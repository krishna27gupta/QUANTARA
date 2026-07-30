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

# Full 65-stock sector mapping
SECTOR_MAP = {
    "AXISBANK": "Financials", "BAJFINANCE": "Financials", "BAJAJFINSV": "Financials", 
    "BANKBARODA": "Financials", "HDFCBANK": "Financials", "HDFCLIFE": "Financials", 
    "ICICIBANK": "Financials", "INDUSINDBK": "Financials", "JIOFIN": "Financials", 
    "KOTAKBANK": "Financials", "SBILIFE": "Financials", "SBIN": "Financials", 
    "SHRIRAMFIN": "Financials", "YESBANK": "Financials",
    "HCLTECH": "IT", "INFY": "IT", "TCS": "IT", "TECHM": "IT", "WIPRO": "IT",
    "BPCL": "Energy", "COALINDIA": "Energy", "GAIL": "Energy", "IOC": "Energy", 
    "NTPC": "Energy", "ONGC": "Energy", "POWERGRID": "Energy", "RELIANCE": "Energy",
    "BAJAJ-AUTO": "Auto", "BOSCHLTD": "Auto", "EICHERMOT": "Auto", "HEROMOTOCO": "Auto", 
    "M&M": "Auto", "MARUTI": "Auto",
    "APOLLOHOSP": "Pharma", "AUROPHARMA": "Pharma", "CIPLA": "Pharma", "DIVISLAB": "Pharma", 
    "LUPIN": "Pharma", "SUNPHARMA": "Pharma",
    "HINDALCO": "Metals", "JSWSTEEL": "Metals", "TATASTEEL": "Metals", "VEDL": "Metals",
    "BRITANNIA": "FMCG", "HINDUNILVR": "FMCG", "ITC": "FMCG", "NESTLEIND": "FMCG", "TATACONSUM": "FMCG",
    "ACC": "Cement", "AMBUJACEM": "Cement", "GRASIM": "Cement", "SHREECEM": "Cement", "ULTRACEMCO": "Cement",
    "BHARTIARTL": "Telecom", "IDEA": "Telecom",
    "BEL": "Industrials", "BHEL": "Industrials", "LT": "Industrials",
    "ASIANPAINT": "Consumer", "TITAN": "Consumer", "TRENT": "Consumer", "ZEEL": "Consumer",
    "UPL": "Agro",
    "ADANIENT": "Diversified", "ADANIPORTS": "Diversified"
}

def get_sector(ticker):
    return SECTOR_MAP.get(ticker, "Other")

def evaluate_model(name: str, df: pd.DataFrame, features: list, target_col: str, is_multiclass: bool = False):
    logger.info(f"--- Evaluating {name} ---")
    df = df.dropna(subset=[target_col] + features)
    if len(df) == 0:
        return None

    X = df[features]
    y = df[target_col].values
    date_index = df.index

    # Full 5-fold Walk-Forward CV
    cv = TimeSeriesWalkForwardCV(date_index)
    
    # We will pool out-of-fold predictions to compute a single Bootstrapped AUC
    oof_preds = []
    oof_y = []
    oof_X = [] # for permutation importance on the pooled OOF set
    
    params = {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.05, 'verbose': -1, 'random_state': 42}
    
    for fold_idx, (train_idx, test_idx) in enumerate(cv.split()):
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_test, y_test = X.iloc[test_idx], y[test_idx]
        
        if is_multiclass:
            # For Risk model, compute terciles on train, apply to both
            q33, q66 = pd.Series(y_train).quantile([0.33, 0.66])
            def bucket(v):
                if v < q33: return 0
                elif v < q66: return 1
                else: return 2
            y_train = np.array([bucket(v) for v in y_train])
            y_test = np.array([bucket(v) for v in y_test])
            
            model = lgb.LGBMClassifier(**params)
            model.fit(X_train, y_train)
            preds = model.predict(X_test)
            
            oof_preds.extend(preds)
            oof_y.extend(y_test)
            oof_X.append(X_test)
        else:
            y_train = y_train.astype(int)
            y_test = y_test.astype(int)
            
            model = lgb.LGBMClassifier(**params)
            model.fit(X_train, y_train)
            test_probs = model.predict_proba(X_test)[:, 1]
            
            oof_preds.extend(test_probs)
            oof_y.extend(y_test)
            oof_X.append(X_test)
            
    oof_preds = np.array(oof_preds)
    oof_y = np.array(oof_y)
    oof_X_df = pd.concat(oof_X)
    
    # Fit a final model on all data for permutation importance
    final_model = lgb.LGBMClassifier(**params)
    if is_multiclass:
        q33, q66 = pd.Series(y).quantile([0.33, 0.66])
        def bucket(v):
            if v < q33: return 0
            elif v < q66: return 1
            else: return 2
        y_final = np.array([bucket(v) for v in y])
        final_model.fit(X, y_final)
        scoring = 'f1_macro'
        metric_val = f1_score(oof_y, oof_preds, average='macro')
        ci_str = "N/A (F1)"
        excludes_0_5 = False
        pi_y = y_final
    else:
        y_final = y.astype(int)
        final_model.fit(X, y_final)
        scoring = 'roc_auc'
        ci = bootstrap_auc_ci(oof_y, oof_preds, n_iter=500)
        metric_val = ci["point_auc"]
        ci_str = f"[{ci['ci_lower']:.4f}, {ci['ci_upper']:.4f}]"
        excludes_0_5 = ci["excludes_0_5"]
        pi_y = y_final

    logger.info(f"[{name}] Computing permutation importance...")
    # Compute permutation importance on the entire dataset using the final model
    perm_result = permutation_importance_with_control(
        final_model, X, pi_y, scoring=scoring, n_repeats=5, 
    )

    importances = perm_result["importances"]
    
    # Extract ranks for new features
    sorted_feats = sorted(importances.items(), key=lambda x: x[1]['mean'], reverse=True)
    rank_map = {f[0]: i+1 for i, f in enumerate(sorted_feats)}
    
    target_feats = ["market_return_volume_interaction", "cross_sectional_rank_65", "sector_rank", "nifty_rs", "sector_rs"]
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
            
            # This is a proxy feature multiplying market volume and market returns, NOT FII flow
            df['market_return_volume_interaction'] = market_returns.reindex(df.index).fillna(0) * np.log1p(market_volume.reindex(df.index).fillna(0)) * 1000 + np.random.randn(len(df)) * 50
            
            # Compute Targets per ticker
            df['target_trend'] = ((df['Close'].shift(-5) - df['Close']) / df['Close'] > 0.02).astype(int)
            df['target_profit'] = compute_first_touch_label(df)
            df['target_risk'] = compute_forward_realized_vol(df)
            
            combined.append(df)
        except Exception as e:
            logger.error(f"Failed on {ticker}: {e}")

    full_df = pd.concat(combined)
    full_df = full_df.sort_index()

    logger.info("Computing cross-sectional features...")
    full_df['daily_return'] = full_df.groupby('ticker')['Close'].pct_change()
    full_df['cross_sectional_rank_65'] = full_df.groupby(level=0)['daily_return'].rank(pct=True)
    full_df['sector_rank'] = full_df.groupby([full_df.index, 'sector'])['daily_return'].rank(pct=True)
    
    full_df = full_df.dropna(subset=get_feature_columns(full_df) + ['cross_sectional_rank_65', 'sector_rank'])
    
    baseline_features = get_feature_columns(full_df)
    baseline_features = [f for f in baseline_features if f not in ['market_return_volume_interaction', 'cross_sectional_rank_65', 'sector_rank', 'daily_return', 'sector', 'target_trend', 'target_profit', 'target_risk']]
    new_features = baseline_features + ['market_return_volume_interaction', 'cross_sectional_rank_65', 'sector_rank']

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
        f.write("This report evaluates the addition of cross-sectional and a market-return-volume interaction proxy feature.\n")
        f.write("Features added: `market_return_volume_interaction`, `cross_sectional_rank_65`, `sector_rank`.\n\n")
        
        f.write("## Model Performance Comparison\n\n")
        f.write("Evaluated using pooled out-of-fold predictions from a full 5-fold Walk-Forward CV.\n\n")
        f.write("| Model Variant | Metric (AUC/F1) | 95% CI | Excludes 0.5? | Perm. Features Kept |\n")
        f.write("|---|---|---|---|---|\n")
        for res in results:
            exc = "✅ Yes" if res["excludes_0_5"] else ("❌ No" if "N/A" not in res["ci_str"] else "N/A")
            f.write(f"| {res['name']} | {res['metric_val']:.4f} | {res['ci_str']} | {exc} | {res['n_kept']} |\n")

        f.write("\n## Permutation Importance of Target Features\n\n")
        f.write("| Model Variant | `market_return_volume_interaction` | `cross_sectional_rank_65` | `sector_rank` | `nifty_rs` | `sector_rs` |\n")
        f.write("|---|---|---|---|---|---|\n")
        for res in results:
            fr = res["feat_ranks"]
            f.write(f"| {res['name']} | {fr['market_return_volume_interaction']} | {fr['cross_sectional_rank_65']} | {fr['sector_rank']} | {fr['nifty_rs']} | {fr['sector_rs']} |\n")

    logger.info(f"Report written to {report_path}")

if __name__ == "__main__":
    main()
