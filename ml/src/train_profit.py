"""
train_profit.py

Trains a REAL win-probability classifier: given the current feature vector, what is the
probability that a swing trade taken today hits the take-profit target BEFORE hitting the
stop-loss, within the standard holding window?

Label definition (matches the product's own risk rules in section 20 of the project doc):
  - Take profit:  +4%
  - Stop loss:    -2%
  - Holding period: 5 trading days
  - For each day t: look forward up to 5 trading days. If High reaches +4% from Close[t]
    on some day before Low reaches -2% from Close[t], label = 1 (WIN). Otherwise label = 0.
    If neither level is touched within the window, we fall back to whether the close-to-close
    5-day return was positive (a "soft" outcome), so every row gets a label.

This replaces the previous profit.py, which computed a fake probability from three
hardcoded if/else rules and called itself "Ensemble (Random Forest + XGBoost)" without
ever loading a Random Forest or an XGBoost model.
"""
import os
import glob
import json
import pickle
import logging
import numpy as np
import pandas as pd
import xgboost as xgb
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-profit")

TAKE_PROFIT = 0.04
STOP_LOSS = -0.02
HOLD_DAYS = 5


def compute_first_touch_label(df: pd.DataFrame) -> pd.Series:
    """For each row, walk forward up to HOLD_DAYS and determine which level is touched first."""
    close = df['Close'].values
    high = df['High'].values
    low = df['Low'].values
    n = len(df)
    labels = np.full(n, np.nan)
    
    # 0.25% per side transaction cost (STT + Slippage + Exchange charges)
    COST_BPS = 0.0025

    for i in range(n - HOLD_DAYS):
        raw_entry = close[i]
        entry = raw_entry * (1 + COST_BPS)
        
        # Calculate raw levels that would need to be hit
        # To net TAKE_PROFIT, we need: (tp_raw * (1 - COST_BPS) - entry) / entry >= TAKE_PROFIT
        # tp_raw = entry * (1 + TAKE_PROFIT) / (1 - COST_BPS)
        tp_level_raw = entry * (1 + TAKE_PROFIT) / (1 - COST_BPS)
        
        # SL is hit if: (sl_raw * (1 - COST_BPS) - entry) / entry <= STOP_LOSS
        # sl_raw = entry * (1 + STOP_LOSS) / (1 - COST_BPS)
        sl_level_raw = entry * (1 + STOP_LOSS) / (1 - COST_BPS)
        
        outcome = None
        for d in range(1, HOLD_DAYS + 1):
            hi = high[i + d]
            lo = low[i + d]
            hit_tp = hi >= tp_level_raw
            hit_sl = lo <= sl_level_raw
            if hit_tp and hit_sl:
                # Ambiguous same-day touch: assume stop-loss triggers first (conservative)
                outcome = 0
                break
            elif hit_tp:
                outcome = 1
                break
            elif hit_sl:
                outcome = 0
                break
        if outcome is None:
            # Neither level touched in the window - fall back to close-to-close sign
            final_exit = close[min(i + HOLD_DAYS, n - 1)] * (1 - COST_BPS)
            outcome = 1 if final_exit > entry else 0
        labels[i] = outcome
    return pd.Series(labels, index=df.index)


def main():
    datasets_dir = "ml/datasets"
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    tickers = [os.path.basename(f).replace(".parquet", "") for f in parquet_files]
    logger.info(f"Found {len(tickers)} tickers.")

    market_returns = compute_market_returns(datasets_dir)

    current_dir = os.path.dirname(os.path.abspath(__file__))
    workspace_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

    combined = []
    for ticker in tickers:
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['target'] = compute_first_touch_label(df)
            df = df.dropna()
            df['ticker'] = ticker
            combined.append(df)
            logger.info(f"{ticker}: {len(df)} usable rows")
        except Exception as e:
            logger.error(f"Failed on {ticker}: {e}")

    full_df = pd.concat(combined)
    logger.info(f"Combined shape: {full_df.shape}")

    win_rate_base = full_df['target'].mean() * 100
    logger.info(f"Base rate (unconditional win rate): {win_rate_base:.2f}%")

    features = get_feature_columns(full_df)
    logger.info(f"Feature count: {len(features)}")

    train_df = full_df[full_df.index < '2023-01-01']
    val_df = full_df[(full_df.index >= '2023-01-01') & (full_df.index < '2024-01-01')]
    test_df = full_df[full_df.index >= '2024-01-01']

    X_train, y_train = train_df[features], train_df['target']
    X_val, y_val = val_df[features], val_df['target']
    X_test, y_test = test_df[features], test_df['target']
    logger.info(f"Split sizes: train={len(X_train)} val={len(X_val)} test={len(X_test)}")

    logger.info("Training Random Forest...")
    rf_model = RandomForestClassifier(
        n_estimators=200, max_depth=8, min_samples_leaf=20,
        class_weight='balanced', random_state=42, n_jobs=-1
    )
    rf_model.fit(X_train, y_train)

    logger.info("Training XGBoost...")
    xgb_model = xgb.XGBClassifier(
        n_estimators=150, max_depth=4, learning_rate=0.04,
        subsample=0.8, colsample_bytree=0.8, random_state=42, eval_metric='logloss'
    )
    xgb_model.fit(X_train, y_train, eval_set=[(X_val, y_val)], verbose=False)

    def eval_model(model, name):
        test_probs = model.predict_proba(X_test)[:, 1]
        test_preds = (test_probs >= 0.5).astype(int)
        acc = accuracy_score(y_test, test_preds)
        prec = precision_score(y_test, test_preds, zero_division=0)
        rec = recall_score(y_test, test_preds, zero_division=0)
        f1 = f1_score(y_test, test_preds, zero_division=0)
        auc = roc_auc_score(y_test, test_probs)
        # Precision at a selective threshold (only take high-confidence signals)
        selective_mask = test_probs >= 0.60
        selective_win_rate = y_test[selective_mask].mean() * 100 if selective_mask.sum() > 0 else 0.0
        return {
            "name": name, "test_acc": float(acc), "precision": float(prec),
            "recall": float(rec), "f1": float(f1), "auc": float(auc),
            "n_selective_signals": int(selective_mask.sum()),
            "selective_win_rate_at_60pct_confidence": float(selective_win_rate)
        }

    rf_metrics = eval_model(rf_model, "RandomForest")
    xgb_metrics = eval_model(xgb_model, "XGBoost")

    with open(os.path.join(models_dir, "profit_rf.pkl"), "wb") as f:
        pickle.dump(rf_model, f)
    with open(os.path.join(models_dir, "profit_xgb.pkl"), "wb") as f:
        pickle.dump(xgb_model, f)

    meta = {
        "features": features,
        "label_definition": f"1 if +{TAKE_PROFIT*100:.0f}% touched before {STOP_LOSS*100:.0f}% within {HOLD_DAYS} days, else 0",
        "base_rate_win_pct": float(win_rate_base),
        "metrics": {"random_forest": rf_metrics, "xgboost": xgb_metrics}
    }
    with open(os.path.join(models_dir, "profit_feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print("\n" + "=" * 50)
    print("PROFIT MODEL TRAINING REPORT")
    print("=" * 50)
    print(f"Total samples: {len(full_df)} | Base win rate: {win_rate_base:.2f}%")
    for m in [rf_metrics, xgb_metrics]:
        print(f"\n{m['name']}: acc={m['test_acc']:.4f} prec={m['precision']:.4f} "
              f"recall={m['recall']:.4f} auc={m['auc']:.4f}")
        print(f"  At >=60% confidence: {m['n_selective_signals']} signals, "
              f"win rate {m['selective_win_rate_at_60pct_confidence']:.2f}%")
    print("=" * 50)


if __name__ == "__main__":
    main()
