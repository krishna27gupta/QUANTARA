import os
import glob
import logging
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import roc_auc_score, f1_score, accuracy_score

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from walk_forward_cv import (
    TimeSeriesWalkForwardCV, FOLD_BOUNDARIES,
    bootstrap_auc_ci, permutation_importance_with_control,
)
from train_profit import compute_first_touch_label
from train_risk import compute_forward_realized_vol

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-feature-experiments")

# Simple sector mapping for dummy sector rank
DUMMY_SECTORS = {
    "HDFCBANK": "Financials", "ICICIBANK": "Financials", "SBI": "Financials", "KOTAKBANK": "Financials",
    "AXISBANK": "Financials", "INDUSINDBK": "Financials", "BAJFINANCE": "Financials", "BAJAJFINSV": "Financials",
    "TCS": "IT", "INFY": "IT", "HCLTECH": "IT", "WIPRO": "IT", "TECHM": "IT",
    "RELIANCE": "Energy", "ONGC": "Energy", "NTPC": "Energy", "POWERGRID": "Energy", "BPCL": "Energy", "COALINDIA": "Energy",
    "SUNPHARMA": "Pharma", "DRREDDY": "Pharma", "CIPLA": "Pharma", "DIVISLAB": "Pharma", "APOLLOHOSP": "Pharma",
    "TATAMOTORS": "Auto", "M&M": "Auto", "MARUTI": "Auto", "BAJAJ-AUTO": "Auto", "EICHERMOT": "Auto", "HEROMOTOCO": "Auto",
}

def get_sector(ticker):
    return DUMMY_SECTORS.get(ticker, "Other")

def evaluate_model(name: str, df: pd.DataFrame, features: list, target_col: str, is_multiclass: bool = False):
    logger.info(f"--- Evaluating {name} ---")
    df = df.dropna(subset=[target_col] + features)
    if len(df) == 0:
        return None

    X = df[features]
    y = df[target_col].values
    date_index = df.index

    last_fold = FOLD_BOUNDARIES[-1]
    final_train_mask = date_index <= pd.Timestamp(last_fold["train_end"])
    final_test_mask = (date_index >= pd.Timestamp(last_fold["test_start"])) & \
                      (date_index <= pd.Timestamp(last_fold["test_end"]))

    X_train_final, y_train_final = X[final_train_mask], y[final_train_mask]
    X_test_final, y_test_final = X[final_test_mask], y[final_test_mask]

    params = {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.05, 'verbose': -1, 'random_state': 42}
    
    if is_multiclass:
        # For Risk model, compute terciles on train, apply to both
        q33, q66 = pd.Series(y_train_final).quantile([0.33, 0.66])
        def bucket(v):
            if v < q33: return 0
            elif v < q66: return 1
            else: return 2
        y_train_final = np.array([bucket(v) for v in y_train_final])
        y_test_final = np.array([bucket(v) for v in y_test_final])
        
        model = lgb.LGBMClassifier(**params)
        model.fit(X_train_final, y_train_final)
        preds = model.predict(X_test_final)
        
        metric_val = f1_score(y_test_final, preds, average='macro')
        ci_str = "N/A (F1)"
        excludes_0_5 = False
        scoring = 'f1_macro'
    else:
        y_train_final = y_train_final.astype(int)
        y_test_final = y_test_final.astype(int)
        
        model = lgb.LGBMClassifier(**params)
        model.fit(X_train_final, y_train_final)
        test_probs = model.predict_proba(X_test_final)[:, 1]
        
        ci = bootstrap_auc_ci(y_test_final, test_probs, n_iter=500)
        metric_val = ci["point_auc"]
        ci_str = f"[{ci['ci_lower']:.4f}, {ci['ci_upper']:.4f}]"
        excludes_0_5 = ci["excludes_0_5"]
        scoring = 'roc_auc'

    logger.info(f"[{name}] Computing permutation importance...")
    perm_result = permutation_importance_with_control(
        model, X_test_final, y_test_final, scoring=scoring, n_repeats=5, 
    )

    importances = perm_result["importances"]
    
    # Extract ranks for new features
    # sort features by mean importance
    sorted_feats = sorted(importances.items(), key=lambda x: x[1]['mean'], reverse=True)
    rank_map = {f[0]: i+1 for i, f in enumerate(sorted_feats)}
    
    target_feats = ["fii_flow", "cross_sectional_rank_65", "sector_rank", "nifty_rs", "sector_rs"]
    feat_ranks = {}
    for tf in target_feats:
        if tf in rank_map:
            val = importances[tf]['mean']
            kept = tf in perm_result["features_to_keep"]
            feat_ranks[tf] = f"Rank {rank_map[tf]} ({val:.4f}) - {'KEPT' if kept else 'DROPPED'}"
        else:
            feat_ranks[tf] = "N/A"

    return {
        "name": name,
        "metric_val": metric_val,
        "ci_str": ci_str,
        "excludes_0_5": excludes_0_5,
        "n_kept": len(perm_result["features_to_keep"]),
        "feat_ranks": feat_ranks
    }

def main():
    datasets_dir = "ml/datasets"
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    market_returns = compute_market_returns(datasets_dir)
    
    # Pre-calculate market volume for FII proxy
    all_volumes = []
    for file in parquet_files:
        try:
            d = pd.read_parquet(file)
            all_volumes.append(d['Volume'])
        except: pass
    market_volume = pd.concat(all_volumes, axis=1).sum(axis=1)

    combined = []
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['ticker'] = ticker
            df['sector'] = get_sector(ticker)
            
            # Proxy FII Flow: scale market return by market volume, add noise
            # (In a real system this would be fetched from data_pipeline)
            df['fii_flow'] = market_returns.reindex(df.index).fillna(0) * np.log1p(market_volume.reindex(df.index).fillna(0)) * 1000 + np.random.randn(len(df)) * 50
            
            # Compute Targets per ticker
            df['target_trend'] = ((df['Close'].shift(-5) - df['Close']) / df['Close'] > 0.02).astype(int)
            df['target_profit'] = compute_first_touch_label(df)
            df['target_risk'] = compute_forward_realized_vol(df)
            
            combined.append(df)
        except Exception as e:
            logger.error(f"Failed on {ticker}: {e}")

    full_df = pd.concat(combined)
    full_df = full_df.sort_index()

    # Add cross-sectional features
    logger.info("Computing cross-sectional features...")
    # Daily return
    full_df['daily_return'] = full_df.groupby('ticker')['Close'].pct_change()
    
    # 65-stock rank
    full_df['cross_sectional_rank_65'] = full_df.groupby(level=0)['daily_return'].rank(pct=True)
    
    # Sector rank
    full_df['sector_rank'] = full_df.groupby([full_df.index, 'sector'])['daily_return'].rank(pct=True)
    
    full_df = full_df.dropna(subset=get_feature_columns(full_df) + ['cross_sectional_rank_65', 'sector_rank'])
    
    baseline_features = get_feature_columns(full_df)
    baseline_features = [f for f in baseline_features if f not in ['fii_flow', 'cross_sectional_rank_65', 'sector_rank', 'daily_return', 'sector', 'target_trend', 'target_profit', 'target_risk']]
    new_features = baseline_features + ['fii_flow', 'cross_sectional_rank_65', 'sector_rank']

    results = []

    # TREND
    r = evaluate_model("Trend (Baseline)", full_df, baseline_features, 'target_trend', False)
    if r: results.append(r)
    r = evaluate_model("Trend (With New Features)", full_df, new_features, 'target_trend', False)
    if r: results.append(r)

    # PROFIT
    r = evaluate_model("Profit (Baseline)", full_df, baseline_features, 'target_profit', False)
    if r: results.append(r)
    r = evaluate_model("Profit (With New Features)", full_df, new_features, 'target_profit', False)
    if r: results.append(r)

    # RISK
    r = evaluate_model("Risk (Baseline)", full_df, baseline_features, 'target_risk', True)
    if r: results.append(r)
    r = evaluate_model("Risk (With New Features)", full_df, new_features, 'target_risk', True)
    if r: results.append(r)

    report_path = os.path.join(workspace_root, "docs", "feature_experiments_report.md")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, "w") as f:
        f.write("# Feature Experiments Report\n\n")
        f.write("This report evaluates the addition of cross-sectional and market-wide flow features.\n")
        f.write("Features added: `fii_flow`, `cross_sectional_rank_65`, `sector_rank`.\n\n")
        
        f.write("## Model Performance Comparison\n\n")
        f.write("| Model Variant | Metric (AUC/F1) | 95% CI | Excludes 0.5? | Perm. Features Kept |\n")
        f.write("|---|---|---|---|---|\n")
        for res in results:
            exc = "✅ Yes" if res["excludes_0_5"] else ("❌ No" if "N/A" not in res["ci_str"] else "N/A")
            f.write(f"| {res['name']} | {res['metric_val']:.4f} | {res['ci_str']} | {exc} | {res['n_kept']} |\n")

        f.write("\n## Permutation Importance of Target Features\n\n")
        f.write("| Model Variant | `fii_flow` | `cross_sectional_rank_65` | `sector_rank` | `nifty_rs` | `sector_rs` |\n")
        f.write("|---|---|---|---|---|---|\n")
        for res in results:
            fr = res["feat_ranks"]
            f.write(f"| {res['name']} | {fr['fii_flow']} | {fr['cross_sectional_rank_65']} | {fr['sector_rank']} | {fr['nifty_rs']} | {fr['sector_rs']} |\n")

    logger.info(f"Report written to {report_path}")

if __name__ == "__main__":
    main()
