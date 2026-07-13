"""
train_expected_return.py

Trains a REAL regression model forecasting expected 5-day forward return %, with
upper/lower forecast bounds via quantile regression (10th / 50th / 90th percentile).

IMPORTANT HONESTY NOTE:
The original project doc/code claimed this component used "LSTM + GRU" sequence
networks. This training environment does not have PyTorch or TensorFlow installed
(and installing them isn't practical here), so this script uses Gradient Boosted
Quantile Regression instead - a real, trained, honestly-labeled model. On tabular
technical-indicator data like this (as opposed to raw sequential price data with
thousands of steps), gradient boosting typically matches or beats a small LSTM/GRU
anyway, so this is not a downgrade in practice - just an honest label.

If you specifically want a real LSTM/GRU (e.g. for the pitch value of "deep learning"),
see the note at the bottom of this file for how to swap this out in your own environment
where torch is installed.
"""
import os
import glob
import json
import pickle
import logging
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor
from sklearn.metrics import mean_absolute_error, r2_score

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-return")

HOLD_DAYS = 5
QUANTILES = {"lower": 0.10, "median": 0.50, "upper": 0.90}


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
            df['future_return_5d_pct'] = (df['Close'].shift(-HOLD_DAYS) - df['Close']) / df['Close'] * 100
            df = df.dropna()
            df['ticker'] = ticker
            combined.append(df)
        except Exception as e:
            logger.error(f"Failed on {ticker}: {e}")

    full_df = pd.concat(combined)
    logger.info(f"Combined shape: {full_df.shape}")

    features = [c for c in get_feature_columns(full_df) if c != 'future_return_5d_pct']

    train_df = full_df[full_df.index < '2023-01-01']
    val_df = full_df[(full_df.index >= '2023-01-01') & (full_df.index < '2024-01-01')]
    test_df = full_df[full_df.index >= '2024-01-01']

    X_train, y_train = train_df[features], train_df['future_return_5d_pct']
    X_test, y_test = test_df[features], test_df['future_return_5d_pct']
    logger.info(f"Split sizes: train={len(X_train)} test={len(X_test)}")

    models = {}
    metrics = {}
    for name, q in QUANTILES.items():
        logger.info(f"Training quantile regressor: {name} (q={q})...")
        model = HistGradientBoostingRegressor(
            loss='quantile', quantile=q, max_iter=150, max_depth=4,
            learning_rate=0.05, random_state=42
        )
        model.fit(X_train, y_train)
        models[name] = model

        if name == "median":
            preds = model.predict(X_test)
            mae = mean_absolute_error(y_test, preds)
            r2 = r2_score(y_test, preds)
            metrics["median_mae"] = float(mae)
            metrics["median_r2"] = float(r2)
            logger.info(f"Median model: MAE={mae:.4f}pp, R2={r2:.4f}")

    # Check calibration: what % of actual outcomes fall between lower and upper bound predictions
    lower_preds = models["lower"].predict(X_test)
    upper_preds = models["upper"].predict(X_test)
    within_bounds = ((y_test.values >= lower_preds) & (y_test.values <= upper_preds)).mean() * 100
    metrics["pct_actuals_within_10_90_band"] = float(within_bounds)
    logger.info(f"Calibration check: {within_bounds:.1f}% of actual returns fell within predicted 10-90 band (target ~80%)")

    with open(os.path.join(models_dir, "return_quantile_models.pkl"), "wb") as f:
        pickle.dump(models, f)

    meta = {
        "features": features,
        "label_definition": f"Actual {HOLD_DAYS}-day forward close-to-close return, percent",
        "model_type_honest": "Gradient Boosted Quantile Regression (not LSTM/GRU - see file docstring)",
        "metrics": metrics
    }
    with open(os.path.join(models_dir, "return_feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    print("\n" + "=" * 50)
    print("EXPECTED RETURN MODEL TRAINING REPORT")
    print("=" * 50)
    print(f"Total samples: {len(full_df)}")
    print(f"Median model MAE: {metrics['median_mae']:.4f} percentage points")
    print(f"Median model R2:  {metrics['median_r2']:.4f}")
    print(f"Actuals within predicted 10-90 band: {within_bounds:.1f}% (well-calibrated if close to 80%)")
    print("=" * 50)


if __name__ == "__main__":
    main()

# ---------------------------------------------------------------------------
# If you want a real LSTM/GRU in your own environment (torch installed):
#
#   1. Build sequences instead of a single row: for each (ticker, date), take the
#      trailing 30-60 days of [close, volume, rsi, macd, ...] as a (timesteps, features)
#      tensor instead of collapsing to lag_* columns.
#   2. A minimal architecture: nn.LSTM(input_size=F, hidden_size=64, num_layers=2,
#      batch_first=True) -> take final hidden state -> nn.Linear(64, 3) for
#      [lower, median, upper] with a pinball/quantile loss per output head.
#   3. Train with the same chronological train/val/test split used above to avoid
#      lookahead leakage.
#   4. Expect a real LSTM to need meaningfully more data than 47 NIFTY-50 stocks x
#      ~10 years to beat gradient boosting on this kind of tabular-technical feature
#      set - it's a legitimate thing to try, just don't expect an automatic win.
# ---------------------------------------------------------------------------
