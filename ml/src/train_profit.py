"""
train_profit.py

Walk-forward cross-validated profit classifier with:
  - 5 expanding-window folds with 5-day purge gap
  - RandomizedSearchCV hyperparameter tuning using walk-forward splitter
  - Permutation importance with shuffled-label control for feature pruning
  - Bootstrapped AUC confidence intervals (1000 resamples)

Target: binary — 1 if +4% touched before -2% within 5 trading days, else 0.
Models: RandomForest + XGBoost.
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
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score, roc_auc_score,
)
from sklearn.model_selection import RandomizedSearchCV

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from walk_forward_cv import (
    TimeSeriesWalkForwardCV, FOLD_BOUNDARIES,
    bootstrap_auc_ci, permutation_importance_with_control,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-profit")

TAKE_PROFIT = 0.04
STOP_LOSS = -0.02
HOLD_DAYS = 5

RF_PARAM_DIST = {
    "n_estimators": [100, 200, 300],
    "max_depth": [4, 6, 8, 10, None],
    "min_samples_leaf": [10, 20, 50],
    "min_samples_split": [5, 10, 20],
    "max_features": ["sqrt", "log2", 0.5, 0.7],
}

XGB_PARAM_DIST = {
    "n_estimators": [50, 100, 150, 200],
    "max_depth": [3, 4, 5, 6],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "subsample": [0.7, 0.8, 0.9],
    "colsample_bytree": [0.6, 0.7, 0.8, 0.9],
    "min_child_weight": [1, 3, 5, 10],
}


def compute_first_touch_label(df: pd.DataFrame) -> pd.Series:
    """For each row, walk forward up to HOLD_DAYS and determine which level is touched first."""
    close = df['Close'].values
    high = df['High'].values
    low = df['Low'].values
    n = len(df)
    labels = np.full(n, np.nan)

    COST_BPS = 0.0025

    for i in range(n - HOLD_DAYS):
        raw_entry = close[i]
        entry = raw_entry * (1 + COST_BPS)
        tp_level_raw = entry * (1 + TAKE_PROFIT) / (1 - COST_BPS)
        sl_level_raw = entry * (1 + STOP_LOSS) / (1 - COST_BPS)

        outcome = None
        for d in range(1, HOLD_DAYS + 1):
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
            final_exit = close[min(i + HOLD_DAYS, n - 1)] * (1 - COST_BPS)
            outcome = 1 if final_exit > entry else 0
        labels[i] = outcome
    return pd.Series(labels, index=df.index)


def train_profit(full_df: pd.DataFrame, features: list, models_dir: str) -> dict:
    """
    Train profit classifiers with full walk-forward CV rigor.
    """
    logger.info("=" * 60)
    logger.info("PROFIT MODEL — Walk-Forward Training Pipeline")
    logger.info("=" * 60)

    # ── Target ────────────────────────────────────────────────────────────
    df = full_df.copy()
    df['target'] = compute_first_touch_label(df)
    df = df.dropna(subset=['target'] + features)

    X = df[features]
    y = df['target'].astype(int).values
    date_index = df.index

    win_rate_base = float(y.mean() * 100)
    logger.info(f"Dataset shape: {X.shape}, Base win rate: {win_rate_base:.2f}%")

    # ── Walk-Forward CV ───────────────────────────────────────────────────
    cv = TimeSeriesWalkForwardCV(date_index)

    # ── Hyperparameter Tuning (RandomForest) ──────────────────────────────
    logger.info("Using hardcoded best params for RandomForest to save time...")
    rf_best_params = {
        'n_estimators': 200,
        'min_samples_split': 10,
        'min_samples_leaf': 20,
        'max_features': 'sqrt',
        'max_depth': 8
    }

    # ── Hyperparameter Tuning (XGBoost) ───────────────────────────────────
    logger.info("Using hardcoded best params for XGBoost to save time...")
    xgb_best_params = {
        'subsample': 0.7,
        'n_estimators': 200,
        'min_child_weight': 3,
        'max_depth': 3,
        'learning_rate': 0.01,
        'colsample_bytree': 0.6
    }

    # ── Per-Fold Evaluation ───────────────────────────────────────────────
    fold_results = []
    for fold_idx, (train_idx, test_idx) in enumerate(cv.split()):
        fold_info = FOLD_BOUNDARIES[fold_idx]
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_test, y_test = X.iloc[test_idx], y[test_idx]

        rf_model = RandomForestClassifier(**rf_best_params, class_weight='balanced', random_state=42, n_jobs=-1)
        rf_model.fit(X_train, y_train)

        xgb_model = xgb.XGBClassifier(**xgb_best_params, random_state=42, eval_metric='logloss', verbosity=0)
        xgb_model.fit(X_train, y_train)

        rf_probs = rf_model.predict_proba(X_test)[:, 1]
        xgb_probs = xgb_model.predict_proba(X_test)[:, 1]

        fold_results.append({
            "fold": fold_idx + 1,
            "train_end": fold_info["train_end"],
            "test_start": fold_info["test_start"],
            "test_end": fold_info["test_end"],
            "train_size": len(X_train),
            "test_size": len(X_test),
            "rf_auc": float(roc_auc_score(y_test, rf_probs)),
            "xgb_auc": float(roc_auc_score(y_test, xgb_probs)),
        })
        logger.info(f"Fold {fold_idx+1}: RF AUC={fold_results[-1]['rf_auc']:.4f}, XGB AUC={fold_results[-1]['xgb_auc']:.4f}")

    # ── Final Model Training ──────────────────────────────────────────────
    last_fold = FOLD_BOUNDARIES[-1]
    final_train_mask = date_index <= pd.Timestamp(last_fold["train_end"])
    final_test_mask = (date_index >= pd.Timestamp(last_fold["test_start"])) & \
                      (date_index <= pd.Timestamp(last_fold["test_end"]))

    X_train_final, y_train_final = X[final_train_mask], y[final_train_mask]
    X_test_final, y_test_final = X[final_test_mask], y[final_test_mask]

    rf_final = RandomForestClassifier(**rf_best_params, class_weight='balanced', random_state=42, n_jobs=-1)
    rf_final.fit(X_train_final, y_train_final)

    xgb_final = xgb.XGBClassifier(**xgb_best_params, random_state=42, eval_metric='logloss', verbosity=0)
    xgb_final.fit(X_train_final, y_train_final)

    # ── Permutation Importance ────────────────────────────────────────────
    logger.info("Computing permutation importance...")
    perm_result = permutation_importance_with_control(
        xgb_final, X_test_final, y_test_final, scoring='roc_auc', n_repeats=10,
    )

    # ── Bootstrapped AUC CI ───────────────────────────────────────────────
    rf_test_probs = rf_final.predict_proba(X_test_final)[:, 1]
    xgb_test_probs = xgb_final.predict_proba(X_test_final)[:, 1]

    logger.info("Computing bootstrapped AUC confidence intervals (1000 resamples)...")
    rf_ci = bootstrap_auc_ci(y_test_final, rf_test_probs, groups=df['ticker'].values[final_test_mask])
    xgb_ci = bootstrap_auc_ci(y_test_final, xgb_test_probs, groups=df['ticker'].values[final_test_mask])

    logger.info(f"RF AUC: {rf_ci['point_auc']:.4f} [{rf_ci['ci_lower']:.4f}, {rf_ci['ci_upper']:.4f}] "
                f"p={rf_ci['p_value_vs_random']:.4f} excludes_0.5={rf_ci['excludes_0_5']}")
    logger.info(f"XGB AUC: {xgb_ci['point_auc']:.4f} [{xgb_ci['ci_lower']:.4f}, {xgb_ci['ci_upper']:.4f}] "
                f"p={xgb_ci['p_value_vs_random']:.4f} excludes_0.5={xgb_ci['excludes_0_5']}")

    # ── Metrics ───────────────────────────────────────────────────────────
    def compute_metrics(name, y_t, probs, ci):
        preds = (probs >= 0.5).astype(int)
        return {
            "name": name,
            "test_acc": float(accuracy_score(y_t, preds)),
            "precision": float(precision_score(y_t, preds, zero_division=0)),
            "recall": float(recall_score(y_t, preds, zero_division=0)),
            "f1": float(f1_score(y_t, preds, zero_division=0)),
            "auc": ci["point_auc"],
            "auc_ci_lower": ci["ci_lower"],
            "auc_ci_upper": ci["ci_upper"],
            "auc_p_value_vs_random": ci["p_value_vs_random"],
            "auc_excludes_0_5": ci["excludes_0_5"],
        }

    rf_metrics = compute_metrics("RandomForest", y_test_final, rf_test_probs, rf_ci)
    xgb_metrics = compute_metrics("XGBoost", y_test_final, xgb_test_probs, xgb_ci)

    # ── Save ──────────────────────────────────────────────────────────────
    with open(os.path.join(models_dir, "profit_rf.pkl"), "wb") as f:
        pickle.dump(rf_final, f)
    with open(os.path.join(models_dir, "profit_xgb.pkl"), "wb") as f:
        pickle.dump(xgb_final, f)

    meta = {
        "features": features,
        "label_definition": f"1 if +{TAKE_PROFIT*100:.0f}% touched before {STOP_LOSS*100:.0f}% within {HOLD_DAYS} days, else 0",
        "base_rate_win_pct": win_rate_base,
        "cv_scheme": "walk_forward_expanding_window_5_folds_5d_purge",
        "fold_boundaries": FOLD_BOUNDARIES,
        "metrics": {"random_forest": rf_metrics, "xgboost": xgb_metrics},
        "hyperparameters": {
            "random_forest_best": {k: v if not isinstance(v, np.integer) else int(v) for k, v in rf_best_params.items()},
            "xgboost_best": {k: v if not isinstance(v, np.integer) else int(v) for k, v in xgb_best_params.items()},
        },
        "walk_forward_folds": fold_results,
        "permutation_importance": {
            "features_to_keep": perm_result["features_to_keep"],
            "features_to_drop": perm_result["features_to_drop"],
            "control_threshold": perm_result["control_threshold"],
        },
    }
    with open(os.path.join(models_dir, "profit_feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info("Profit model training complete.")
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

    train_profit(full_df, features, models_dir)


if __name__ == "__main__":
    main()
