"""
train_expected_return.py

Walk-forward cross-validated quantile regression for expected return with:
  - 5 expanding-window folds with 5-day purge gap
  - RandomizedSearchCV hyperparameter tuning using walk-forward splitter
  - Permutation importance with shuffled-label control for feature pruning
  - Per-fold MAE, R², and calibration metrics

Target: continuous — actual 5-day forward close-to-close return, percent.
Models: HistGradientBoostingRegressor (quantile loss) at 10th, 50th, 90th percentile.

HONESTY NOTE: Uses gradient boosted quantile regression (not LSTM/GRU — see docstring
in the previous version for rationale). The point forecast has ~0 R² (no real edge);
the uncertainty band is the useful output.
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
from sklearn.model_selection import RandomizedSearchCV

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from walk_forward_cv import (
    TimeSeriesWalkForwardCV, FOLD_BOUNDARIES,
    permutation_importance_with_control,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-return")

HOLD_DAYS = 5
QUANTILES = {"lower": 0.10, "median": 0.50, "upper": 0.90}

HISTGB_PARAM_DIST = {
    "max_iter": [100, 150, 200, 300],
    "max_depth": [3, 4, 5, 6, None],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "min_samples_leaf": [5, 10, 20, 50],
    "max_leaf_nodes": [15, 31, 50, None],
    "l2_regularization": [0.0, 0.1, 1.0, 10.0],
}


def train_expected_return(full_df: pd.DataFrame, features: list, models_dir: str) -> dict:
    """
    Train quantile regressors with full walk-forward CV rigor.
    """
    logger.info("=" * 60)
    logger.info("EXPECTED RETURN MODEL — Walk-Forward Training Pipeline")
    logger.info("=" * 60)

    # ── Target ────────────────────────────────────────────────────────────
    df = full_df.copy()
    df['future_return_5d_pct'] = (df['Close'].shift(-HOLD_DAYS) - df['Close']) / df['Close'] * 100
    # Exclude future_return_5d_pct from features
    feats = [f for f in features if f != 'future_return_5d_pct']
    df = df.dropna(subset=['future_return_5d_pct'] + feats)

    X = df[feats]
    y = df['future_return_5d_pct'].values
    date_index = df.index

    logger.info(f"Dataset shape: {X.shape}")

    # ── Walk-Forward CV ───────────────────────────────────────────────────
    cv = TimeSeriesWalkForwardCV(date_index)

    # ── Hyperparameter Tuning (on median quantile) ────────────────────────
    logger.info("Hyperparameter tuning median quantile regressor...")
    median_base = HistGradientBoostingRegressor(loss='quantile', quantile=0.50, random_state=42)
    median_search = RandomizedSearchCV(
        median_base, HISTGB_PARAM_DIST, n_iter=25, cv=cv,
        scoring='neg_mean_absolute_error',
        random_state=42, n_jobs=-1, refit=False,
    )
    median_search.fit(X, y)
    best_params = median_search.best_params_
    logger.info(f"Best params: {best_params}")

    # ── Per-Fold Evaluation ───────────────────────────────────────────────
    fold_results = []
    for fold_idx, (train_idx, test_idx) in enumerate(cv.split()):
        fold_info = FOLD_BOUNDARIES[fold_idx]
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_test, y_test = X.iloc[test_idx], y[test_idx]

        models_fold = {}
        for name, q in QUANTILES.items():
            m = HistGradientBoostingRegressor(**best_params, loss='quantile', quantile=q, random_state=42)
            m.fit(X_train, y_train)
            models_fold[name] = m

        median_preds = models_fold["median"].predict(X_test)
        lower_preds = models_fold["lower"].predict(X_test)
        upper_preds = models_fold["upper"].predict(X_test)

        mae = float(mean_absolute_error(y_test, median_preds))
        r2 = float(r2_score(y_test, median_preds))
        within_bounds = float(((y_test >= lower_preds) & (y_test <= upper_preds)).mean() * 100)

        fold_results.append({
            "fold": fold_idx + 1,
            "train_end": fold_info["train_end"],
            "test_start": fold_info["test_start"],
            "test_end": fold_info["test_end"],
            "train_size": len(X_train),
            "test_size": len(X_test),
            "median_mae": mae,
            "median_r2": r2,
            "pct_within_10_90_band": within_bounds,
        })
        logger.info(f"Fold {fold_idx+1}: MAE={mae:.4f}, R²={r2:.4f}, Calibration={within_bounds:.1f}%")

    # ── Final Model Training ──────────────────────────────────────────────
    last_fold = FOLD_BOUNDARIES[-1]
    final_train_mask = date_index <= pd.Timestamp(last_fold["train_end"])
    final_test_mask = (date_index >= pd.Timestamp(last_fold["test_start"])) & \
                      (date_index <= pd.Timestamp(last_fold["test_end"]))

    X_train_final, y_train_final = X[final_train_mask], y[final_train_mask]
    X_test_final, y_test_final = X[final_test_mask], y[final_test_mask]

    models_final = {}
    for name, q in QUANTILES.items():
        logger.info(f"Training final {name} (q={q}) quantile regressor...")
        m = HistGradientBoostingRegressor(**best_params, loss='quantile', quantile=q, random_state=42)
        m.fit(X_train_final, y_train_final)
        models_final[name] = m

    median_preds = models_final["median"].predict(X_test_final)
    lower_preds = models_final["lower"].predict(X_test_final)
    upper_preds = models_final["upper"].predict(X_test_final)

    final_mae = float(mean_absolute_error(y_test_final, median_preds))
    final_r2 = float(r2_score(y_test_final, median_preds))
    final_calibration = float(((y_test_final >= lower_preds) & (y_test_final <= upper_preds)).mean() * 100)

    logger.info(f"Final model: MAE={final_mae:.4f}, R²={final_r2:.4f}, Calibration={final_calibration:.1f}%")

    # ── Permutation Importance ────────────────────────────────────────────
    logger.info("Computing permutation importance...")
    perm_result = permutation_importance_with_control(
        models_final["median"], X_test_final, y_test_final,
        scoring='neg_mean_absolute_error', n_repeats=10,
    )

    # ── Save ──────────────────────────────────────────────────────────────
    with open(os.path.join(models_dir, "return_quantile_models.pkl"), "wb") as f:
        pickle.dump(models_final, f)

    meta = {
        "features": feats,
        "label_definition": f"Actual {HOLD_DAYS}-day forward close-to-close return, percent",
        "model_type_honest": "Gradient Boosted Quantile Regression (not LSTM/GRU - see file docstring)",
        "cv_scheme": "walk_forward_expanding_window_5_folds_5d_purge",
        "fold_boundaries": FOLD_BOUNDARIES,
        "metrics": {
            "median_mae": final_mae,
            "median_r2": final_r2,
            "pct_actuals_within_10_90_band": final_calibration,
        },
        "hyperparameters": {
            "best": {k: v if not isinstance(v, np.integer) else int(v) for k, v in best_params.items()},
        },
        "walk_forward_folds": fold_results,
        "permutation_importance": {
            "features_to_keep": perm_result["features_to_keep"],
            "features_to_drop": perm_result["features_to_drop"],
            "control_threshold": perm_result["control_threshold"],
        },
    }
    with open(os.path.join(models_dir, "return_feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info("Expected return model training complete.")
    return meta


def main():
    datasets_dir = "ml/datasets"
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    market_returns = compute_market_returns(datasets_dir)
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

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
    full_df = full_df.dropna()
    features = get_feature_columns(full_df)

    train_expected_return(full_df, features, models_dir)


if __name__ == "__main__":
    main()
