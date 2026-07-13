"""
train_risk.py

Trains a REAL risk classifier: given today's feature vector, predict whether the NEXT
5 trading days are likely to be Low / Medium / High realized-volatility for this stock.

Label definition:
  forward_realized_vol = std(daily returns over the next 5 trading days) * sqrt(252)
  Buckets are defined by TERCILES of forward_realized_vol computed on the TRAINING split
  only (no lookahead leakage into thresholds), then applied consistently to val/test.

This replaces the previous risk.py, which computed risk from a hand-picked formula
(vix*0.4 + beta*15 + drawdown*0.2) with hardcoded thresholds and called itself
"Gradient Boosting + Statistical VaR" without training anything.
"""
import os
import glob
import json
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.metrics import accuracy_score, f1_score, classification_report

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-risk")

FORWARD_WINDOW = 5


def compute_forward_realized_vol(df: pd.DataFrame) -> pd.Series:
    daily_ret = df['Close'].pct_change()
    # std of the NEXT FORWARD_WINDOW returns, aligned to today's row
    fwd_vol = daily_ret.shift(-FORWARD_WINDOW).rolling(FORWARD_WINDOW).std().shift(-(FORWARD_WINDOW - 1))
    # simpler and leak-free equivalent: compute std over t+1..t+5 using a forward rolling window
    fwd_returns = pd.concat([daily_ret.shift(-i) for i in range(1, FORWARD_WINDOW + 1)], axis=1)
    fwd_vol = fwd_returns.std(axis=1) * np.sqrt(252)
    return fwd_vol


def main():
    datasets_dir = "ml/datasets"
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    tickers = [os.path.basename(f).replace(".parquet", "") for f in parquet_files]
    market_returns = compute_market_returns(datasets_dir)

    combined = []
    for ticker in tickers:
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns)
            df['forward_realized_vol'] = compute_forward_realized_vol(df)
            df = df.dropna()
            df['ticker'] = ticker
            combined.append(df)
        except Exception as e:
            logger.error(f"Failed on {ticker}: {e}")

    full_df = pd.concat(combined)
    logger.info(f"Combined shape: {full_df.shape}")

    train_df = full_df[full_df.index < '2023-01-01']
    val_df = full_df[(full_df.index >= '2023-01-01') & (full_df.index < '2024-01-01')]
    test_df = full_df[full_df.index >= '2024-01-01']

    # Terciles computed on TRAIN only, then applied everywhere (no leakage)
    q33, q66 = train_df['forward_realized_vol'].quantile([0.33, 0.66])
    logger.info(f"Risk thresholds learned from training data: Low < {q33:.4f} <= Medium < {q66:.4f} <= High")

    def bucket(v):
        if v < q33:
            return 0  # Low
        elif v < q66:
            return 1  # Medium
        else:
            return 2  # High

    for d in (train_df, val_df, test_df):
        d['target_risk'] = d['forward_realized_vol'].apply(bucket)

    features = get_feature_columns(full_df)
    X_train, y_train = train_df[features], train_df['target_risk']
    X_val, y_val = val_df[features], val_df['target_risk']
    X_test, y_test = test_df[features], test_df['target_risk']
    logger.info(f"Split sizes: train={len(X_train)} val={len(X_val)} test={len(X_test)}")

    logger.info("Training Gradient Boosting risk classifier...")
    gb_model = HistGradientBoostingClassifier(
        max_iter=150, max_depth=4, learning_rate=0.05, random_state=42
    )
    gb_model.fit(X_train, y_train)

    test_preds = gb_model.predict(X_test)
    acc = accuracy_score(y_test, test_preds)
    f1 = f1_score(y_test, test_preds, average='macro')
    report = classification_report(y_test, test_preds, target_names=["Low", "Medium", "High"], output_dict=True)

    logger.info(f"Test accuracy: {acc:.4f} | Macro F1: {f1:.4f}")

    with open(os.path.join(models_dir, "risk_gb.pkl"), "wb") as f:
        pickle.dump(gb_model, f)

    meta = {
        "features": features,
        "label_definition": f"Terciles of realized volatility (annualized) over the next {FORWARD_WINDOW} trading days, thresholds fit on training split only",
        "thresholds": {"low_upper_bound": float(q33), "medium_upper_bound": float(q66)},
        "metrics": {"test_accuracy": float(acc), "macro_f1": float(f1), "classification_report": report}
    }
    with open(os.path.join(models_dir, "risk_feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print("\n" + "=" * 50)
    print("RISK MODEL TRAINING REPORT")
    print("=" * 50)
    print(f"Total samples: {len(full_df)}")
    print(f"Risk thresholds (annualized realized vol): Low<{q33:.4f}  Medium<{q66:.4f}  High>=  {q66:.4f}")
    print(f"Test accuracy: {acc:.4f} | Macro F1: {f1:.4f}")
    print(classification_report(y_test, test_preds, target_names=["Low", "Medium", "High"]))
    print("=" * 50)


if __name__ == "__main__":
    main()
