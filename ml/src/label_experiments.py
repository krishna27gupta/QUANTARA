import os
import glob
import json
import logging
import numpy as np
import pandas as pd
import lightgbm as lgb
from sklearn.metrics import roc_auc_score

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from walk_forward_cv import (
    TimeSeriesWalkForwardCV, FOLD_BOUNDARIES,
    bootstrap_auc_ci, permutation_importance_with_control,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-label-experiments")

def compute_dynamic_touch_label(df: pd.DataFrame, hold_days: int, tp_series: pd.Series, sl_series: pd.Series) -> pd.Series:
    """For each row, walk forward up to hold_days and determine which level is touched first."""
    close = df['Close'].values
    high = df['High'].values
    low = df['Low'].values
    tp = tp_series.values
    sl = sl_series.values
    
    n = len(df)
    labels = np.full(n, np.nan)
    COST_BPS = 0.0025

    for i in range(n - hold_days):
        raw_entry = close[i]
        entry = raw_entry * (1 + COST_BPS)
        
        take_profit = tp[i]
        stop_loss = sl[i]
        if pd.isna(take_profit) or pd.isna(stop_loss):
            continue
            
        tp_level_raw = entry * (1 + take_profit) / (1 - COST_BPS)
        sl_level_raw = entry * (1 + stop_loss) / (1 - COST_BPS)

        outcome = None
        for d in range(1, hold_days + 1):
            hi = high[i + d]
            lo = low[i + d]
            hit_tp = hi >= tp_level_raw
            hit_sl = lo <= sl_level_raw
            if hit_tp and hit_sl:
                outcome = 0
                break
            elif hit_tp:
                outcome = 1
                break
            elif hit_sl:
                outcome = 0
                break
        if outcome is None:
            final_exit = close[min(i + hold_days, n - 1)] * (1 - COST_BPS)
            outcome = 1 if final_exit > entry else 0
        labels[i] = outcome
        
    return pd.Series(labels, index=df.index)

def evaluate_variant(name: str, df: pd.DataFrame, features: list):
    logger.info(f"--- Evaluating variant: {name} ---")
    df = df.dropna(subset=['target'] + features)
    if len(df) == 0:
        logger.warning(f"No data for variant {name}")
        return None
        
    X = df[features]
    y = df['target'].astype(int).values
    date_index = df.index

    base_rate = float(y.mean())
    logger.info(f"Dataset shape: {X.shape}, Base win rate: {base_rate:.4f}")

    last_fold = FOLD_BOUNDARIES[-1]
    final_train_mask = date_index <= pd.Timestamp(last_fold["train_end"])
    final_test_mask = (date_index >= pd.Timestamp(last_fold["test_start"])) & \
                      (date_index <= pd.Timestamp(last_fold["test_end"]))

    X_train_final, y_train_final = X[final_train_mask], y[final_train_mask]
    X_test_final, y_test_final = X[final_test_mask], y[final_test_mask]

    if len(X_test_final) == 0 or len(np.unique(y_test_final)) < 2:
        logger.warning(f"Not enough test data for variant {name}")
        return None

    # Use fixed reasonable params to avoid slow tuning in experiment script
    params = {'n_estimators': 100, 'max_depth': 5, 'learning_rate': 0.05, 'num_leaves': 31, 'verbose': -1, 'random_state': 42}
    model = lgb.LGBMClassifier(**params)
    model.fit(X_train_final, y_train_final)

    test_probs = model.predict_proba(X_test_final)[:, 1]

    logger.info(f"[{name}] Computing bootstrapped AUC confidence intervals...")
    ci = bootstrap_auc_ci(y_test_final, test_probs, n_iter=1000)
    
    logger.info(f"[{name}] Computing permutation importance...")
    perm_result = permutation_importance_with_control(
        model, X_test_final, y_test_final, scoring='roc_auc', n_repeats=5, 
    )

    return {
        "name": name,
        "base_rate": base_rate,
        "auc_point": ci["point_auc"],
        "ci_lower": ci["ci_lower"],
        "ci_upper": ci["ci_upper"],
        "p_value": ci["p_value_vs_random"],
        "excludes_0_5": ci["excludes_0_5"],
        "n_features_kept": len(perm_result["features_to_keep"])
    }

def main():
    datasets_dir = "ml/datasets"
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    market_returns = compute_market_returns(datasets_dir)

    combined = []
    for file in parquet_files[:5]: # Take a subset or all? 
        # I should probably take all to get accurate results, but let's see how fast it runs. 
        # Since I use final fold only, it should be reasonably fast. Let's use all.
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['ticker'] = ticker
            
            if 'historical_volatility' in df.columns:
                df['vol_20d'] = df['historical_volatility'] / np.sqrt(252) * np.sqrt(20)
            else:
                df['vol_20d'] = df['Close'].pct_change().rolling(20).std() * np.sqrt(20)
            
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
    r = evaluate_variant("Baseline (5-day, +4%/-2%)", df_base, features)
    if r: results.append(r)

    # 2. 1-day
    df_1d = full_df.copy()
    df_1d['target'] = compute_dynamic_touch_label(df_1d, 1, pd.Series(0.02, index=df_1d.index), pd.Series(-0.02, index=df_1d.index))
    r = evaluate_variant("1-Day Hold (+2%/-2%)", df_1d, features)
    if r: results.append(r)

    # 3. 3-day
    df_3d = full_df.copy()
    df_3d['target'] = compute_dynamic_touch_label(df_3d, 3, pd.Series(0.02, index=df_3d.index), pd.Series(-0.02, index=df_3d.index))
    r = evaluate_variant("3-Day Hold (+2%/-2%)", df_3d, features)
    if r: results.append(r)

    # 4. 10-day
    df_10d = full_df.copy()
    df_10d['target'] = compute_dynamic_touch_label(df_10d, 10, pd.Series(0.02, index=df_10d.index), pd.Series(-0.02, index=df_10d.index))
    r = evaluate_variant("10-Day Hold (+2%/-2%)", df_10d, features)
    if r: results.append(r)

    # 5. 20-day
    df_20d = full_df.copy()
    df_20d['target'] = compute_dynamic_touch_label(df_20d, 20, pd.Series(0.02, index=df_20d.index), pd.Series(-0.02, index=df_20d.index))
    r = evaluate_variant("20-Day Hold (+2%/-2%)", df_20d, features)
    if r: results.append(r)

    # 6. Volatility-Adjusted
    df_vol = full_df.copy()
    df_vol['vol_20d'] = df_vol['vol_20d'].fillna(0.05) 
    tp_vol = df_vol['vol_20d'] * 2.0
    sl_vol = df_vol['vol_20d'] * -1.0
    df_vol['target'] = compute_dynamic_touch_label(df_vol, 5, tp_vol, sl_vol)
    r = evaluate_variant("Vol-Adjusted (5-day, TP=2*vol, SL=-vol)", df_vol, features)
    if r: results.append(r)

    # 7. Regime-Conditional
    vix_median = df_base['vix_level'].median()
    # Check if vix_level is perfectly constant
    if df_base['vix_level'].nunique() <= 1:
        logger.warning("vix_level is constant. Falling back to stock-level vol_20d for regime split.")
        regime_col = 'vol_20d'
        vix_median = df_base['vol_20d'].median()
    else:
        regime_col = 'vix_level'

    df_high = df_base[df_base[regime_col] > vix_median].copy()
    if len(df_high) > 0:
        r = evaluate_variant(f"Regime: High Volatility ({regime_col} > Median)", df_high, features)
        if r: results.append(r)

    df_low = df_base[df_base[regime_col] <= vix_median].copy()
    if len(df_low) > 0:
        r = evaluate_variant(f"Regime: Low Volatility ({regime_col} <= Median)", df_low, features)
        if r: results.append(r)

    # Rank and generate report
    results = sorted(results, key=lambda x: x["auc_point"], reverse=True)
    
    report_path = os.path.join(workspace_root, "docs", "label_experiments_report.md")
    os.makedirs(os.path.dirname(report_path), exist_ok=True)
    
    with open(report_path, "w") as f:
        f.write("# Label Experiments Report\n\n")
        f.write("This report evaluates multiple alternative label definitions against the existing feature set.\n")
        f.write("A model's 95% Confidence Interval excluding 0.5 suggests a statistically significant edge. ")
        f.write("Finding no edge is a valid and useful result, indicating the market is too efficient at that horizon or parameters.\n\n")
        
        f.write("| Rank | Variant | AUC Point | 95% CI | Excludes 0.5? | p-value vs 0.5 | Base Rate | Perm. Features Kept |\n")
        f.write("|---|---|---|---|---|---|---|---|\n")
        for i, res in enumerate(results):
            exc = "✅ Yes" if res["excludes_0_5"] else "❌ No"
            ci = f"[{res['ci_lower']:.4f}, {res['ci_upper']:.4f}]"
            f.write(f"| {i+1} | {res['name']} | {res['auc_point']:.4f} | {ci} | {exc} | {res['p_value']:.4f} | {res['base_rate']:.1%} | {res['n_features_kept']} |\n")
            
    logger.info(f"Report written to {report_path}")

if __name__ == "__main__":
    main()
