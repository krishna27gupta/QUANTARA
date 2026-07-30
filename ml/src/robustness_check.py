import os
import glob
import logging
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import roc_auc_score

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from label_experiments import compute_dynamic_touch_label
from walk_forward_cv import FOLD_BOUNDARIES, bootstrap_auc_ci

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-robustness")

def evaluate_robustness(name: str, df: pd.DataFrame, features: list):
    logger.info(f"--- Robustness Check for: {name} ---")
    df = df.dropna(subset=['target'] + features).copy()
    if len(df) == 0:
        return None
        
    X = df[features]
    y = df['target'].astype(int).values
    date_index = df.index

    # Holdout is the most recent 6 months
    holdout_start = pd.Timestamp("2025-07-01")
    holdout_end = pd.Timestamp("2025-12-31")

    # Train across all folds and collect predictions to compute fold-level and ticker-level AUC
    fold_aucs = []
    test_preds = []
    test_ys = []
    test_tickers = []
    
    # Per-fold check
    params = {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.05, 'num_leaves': 31, 'verbose': -1, 'random_state': 42}
    
    for i, fold in enumerate(FOLD_BOUNDARIES):
        train_end = pd.Timestamp(fold["train_end"])
        test_start = pd.Timestamp(fold["test_start"])
        # Ensure test end doesn't leak into holdout
        test_end = min(pd.Timestamp(fold["test_end"]), holdout_start - pd.Timedelta(days=1))
        
        if test_start > test_end:
            continue
            
        train_mask = date_index <= train_end
        test_mask = (date_index >= test_start) & (date_index <= test_end)
        
        if not test_mask.any():
            continue
            
        X_train, y_train = X[train_mask], y[train_mask]
        X_test, y_test = X[test_mask], y[test_mask]
        
        if len(np.unique(y_test)) < 2:
            continue
            
        model = lgb.LGBMClassifier(**params)
        model.fit(X_train, y_train)
        
        preds = model.predict_proba(X_test)[:, 1]
        auc = roc_auc_score(y_test, preds)
        fold_aucs.append((i+1, auc))
        
        test_preds.extend(preds)
        test_ys.extend(y_test)
        test_tickers.extend(df['ticker'].values[test_mask])

    # Concentration check
    results_df = pd.DataFrame({'y': test_ys, 'pred': test_preds, 'ticker': test_tickers})
    ticker_aucs = []
    for ticker, group in results_df.groupby('ticker'):
        if len(np.unique(group['y'])) == 2:
            ticker_aucs.append(roc_auc_score(group['y'], group['pred']))
    
    ticker_aucs = np.array(ticker_aucs)
    frac_above_50 = (ticker_aucs > 0.5).mean() if len(ticker_aucs) > 0 else 0
    median_ticker_auc = np.median(ticker_aucs) if len(ticker_aucs) > 0 else 0

    # True holdout check
    train_mask_holdout = date_index < holdout_start
    test_mask_holdout = (date_index >= holdout_start) & (date_index <= holdout_end)
    
    holdout_auc_point = None
    holdout_ci = None
    if test_mask_holdout.any():
        X_train_h = X[train_mask_holdout]
        y_train_h = y[train_mask_holdout]
        X_test_h = X[test_mask_holdout]
        y_test_h = y[test_mask_holdout]
        
        if len(np.unique(y_test_h)) == 2:
            model_h = lgb.LGBMClassifier(**params)
            model_h.fit(X_train_h, y_train_h)
            preds_h = model_h.predict_proba(X_test_h)[:, 1]
            holdout_ci = bootstrap_auc_ci(y_test_h, preds_h, groups=df['ticker'].values[test_mask_holdout], n_iter=1000)
            holdout_auc_point = holdout_ci["point_auc"]

    return {
        "name": name,
        "base_rate": float(y.mean()),
        "fold_aucs": fold_aucs,
        "frac_above_50": frac_above_50,
        "median_ticker_auc": median_ticker_auc,
        "holdout_auc_point": holdout_auc_point,
        "holdout_ci": holdout_ci
    }

def main():
    datasets_dir = "ml/datasets"
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    market_returns = compute_market_returns(datasets_dir)

    combined = []
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['ticker'] = ticker
            combined.append(df)
        except Exception as e:
            logger.error(f"Failed on {ticker}: {e}")

    full_df = pd.concat(combined)
    full_df = full_df.dropna(subset=get_feature_columns(full_df))
    features = get_feature_columns(full_df)
    
    results = []

    # 1. Baseline
    df_base = full_df.copy()
    df_base['target'] = compute_dynamic_touch_label(df_base, 5, pd.Series(0.04, index=df_base.index), pd.Series(-0.02, index=df_base.index))
    r_base = evaluate_robustness("Baseline (5-day, +4%/-2%)", df_base, features)
    if r_base: results.append(r_base)

    # 2. 1-day
    df_1d = full_df.copy()
    df_1d['target'] = compute_dynamic_touch_label(df_1d, 1, pd.Series(0.02, index=df_1d.index), pd.Series(-0.02, index=df_1d.index))
    r_1d = evaluate_robustness("1-Day Hold (+2%/-2%)", df_1d, features)
    if r_1d: results.append(r_1d)

    report_path = os.path.join(workspace_root, "docs", "robustness_check_report.md")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, "w") as f:
        f.write("# Label Variants Robustness Check\n\n")
        f.write("This report evaluates the top two label variants from our original label experiments against strict stress-tests: cross-fold stability, per-ticker concentration, economic reality, and a true out-of-sample holdout.\n\n")
        
        for res in results:
            f.write(f"## {res['name']}\n\n")
            
            f.write("### 1. Base Rate net of Transaction Costs\n")
            f.write(f"The `compute_dynamic_touch_label` incorporates 0.25%-per-side (0.5% round-trip) transaction costs into the target levels. After costs, this variant achieves a base win rate of **{res['base_rate']:.1%}**.\n\n")
            
            f.write("### 2. Per-Fold Stability\n")
            f.write("Walk-forward CV AUCs by fold:\n")
            for fold_i, auc_val in res["fold_aucs"]:
                f.write(f"- Fold {fold_i}: {auc_val:.4f}\n")
            f.write("\n")
            
            f.write("### 3. Concentration Check\n")
            f.write(f"When evaluating the pooled CV predictions by individual ticker, **{res['frac_above_50']:.1%}** of tickers had an AUC > 0.5. The median ticker AUC was **{res['median_ticker_auc']:.4f}**.\n\n")
            
            f.write("### 4. True Holdout Check (Jul 2025 - Dec 2025)\n")
            if res["holdout_ci"] is not None:
                ci = res["holdout_ci"]
                exc = "excludes 0.5" if ci["excludes_0_5"] else "DOES NOT exclude 0.5"
                f.write(f"Evaluated on a completely unseen 6-month holdout (Jul 2025 - Dec 2025) strictly held out from all CV tuning, the variant achieved an AUC of **{ci['point_auc']:.4f}** with a 95% CI of `[{ci['ci_lower']:.4f}, {ci['ci_upper']:.4f}]`. This **{exc}** (p-value = {ci['p_value_vs_random']:.4f}).\n\n")
            else:
                f.write("Not enough data to evaluate on holdout.\n\n")

    logger.info("Report completed.")

if __name__ == "__main__":
    main()
