"""
train_trend.py

Walk-forward cross-validated trend classifier with:
  - 5 expanding-window folds with 5-day purge gap
  - RandomizedSearchCV hyperparameter tuning using walk-forward splitter
  - Permutation importance with shuffled-label control for feature pruning
  - Bootstrapped AUC confidence intervals (1000 resamples)

Target: binary — 1 if 5-day forward return > 2%, else 0.
Models: XGBoost + LightGBM.
"""
import os
import glob
import json
import pickle
import logging
import numpy as np
import pandas as pd
import xgboost as xgb
import lightgbm as lgb
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
logger = logging.getLogger("quantara-train-trend")

XGB_PARAM_DIST = {
    "n_estimators": [50, 100, 200, 300],
    "max_depth": [3, 4, 5, 6],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "subsample": [0.7, 0.8, 0.9],
    "colsample_bytree": [0.6, 0.7, 0.8, 0.9],
    "min_child_weight": [1, 3, 5, 10],
}

LGB_PARAM_DIST = {
    "n_estimators": [50, 100, 200, 300],
    "max_depth": [3, 4, 5, 6, -1],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "num_leaves": [15, 31, 50, 80],
    "feature_fraction": [0.6, 0.7, 0.8, 0.9],
    "min_child_samples": [5, 10, 20, 50],
}


def train_trend(full_df: pd.DataFrame, features: list, models_dir: str, workspace_root: str) -> dict:
    """
    Train trend classifiers with full walk-forward CV rigor.

    Returns a results dict containing metrics, CI, fold details, and
    permutation importance for the methodology report.
    """
    logger.info("=" * 60)
    logger.info("TREND MODEL — Walk-Forward Training Pipeline")
    logger.info("=" * 60)

    # ── Target ────────────────────────────────────────────────────────────
    df = full_df.copy()
    df['future_return_5d'] = (df['Close'].shift(-5) - df['Close']) / df['Close']
    df['target'] = (df['future_return_5d'] > 0.02).astype(int)
    df = df.dropna(subset=['target'] + features)

    X = df[features]
    y = df['target'].values
    date_index = df.index

    logger.info(f"Dataset shape: {X.shape}, Positive rate: {y.mean():.4f}")

    # ── Walk-Forward CV ───────────────────────────────────────────────────
    cv = TimeSeriesWalkForwardCV(date_index)

    # ── Hyperparameter Tuning (XGBoost) ───────────────────────────────────
    logger.info("Hyperparameter tuning XGBoost via RandomizedSearchCV (walk-forward CV)...")
    xgb_base = xgb.XGBClassifier(random_state=42, eval_metric='logloss', verbosity=0)
    xgb_search = RandomizedSearchCV(
        xgb_base, XGB_PARAM_DIST, n_iter=30, cv=cv, scoring='roc_auc',
        random_state=42, n_jobs=-1, refit=False,
    )
    xgb_search.fit(X, y)
    xgb_best_params = xgb_search.best_params_
    logger.info(f"XGBoost best params: {xgb_best_params}")

    # ── Hyperparameter Tuning (LightGBM) ──────────────────────────────────
    logger.info("Hyperparameter tuning LightGBM via RandomizedSearchCV (walk-forward CV)...")
    lgb_base = lgb.LGBMClassifier(random_state=42, verbose=-1)
    lgb_search = RandomizedSearchCV(
        lgb_base, LGB_PARAM_DIST, n_iter=30, cv=cv, scoring='roc_auc',
        random_state=42, n_jobs=-1, refit=False,
    )
    lgb_search.fit(X, y)
    lgb_best_params = lgb_search.best_params_
    logger.info(f"LightGBM best params: {lgb_best_params}")

    # ── Per-Fold Evaluation ───────────────────────────────────────────────
    fold_results = []
    for fold_idx, (train_idx, test_idx) in enumerate(cv.split()):
        fold_info = FOLD_BOUNDARIES[fold_idx]
        X_train, y_train = X.iloc[train_idx], y[train_idx]
        X_test, y_test = X.iloc[test_idx], y[test_idx]

        xgb_model = xgb.XGBClassifier(**xgb_best_params, random_state=42, eval_metric='logloss', verbosity=0)
        xgb_model.fit(X_train, y_train)

        lgb_model = lgb.LGBMClassifier(**lgb_best_params, random_state=42, verbose=-1)
        lgb_model.fit(X_train, y_train)

        xgb_probs = xgb_model.predict_proba(X_test)[:, 1]
        lgb_probs = lgb_model.predict_proba(X_test)[:, 1]

        fold_results.append({
            "fold": fold_idx + 1,
            "train_end": fold_info["train_end"],
            "test_start": fold_info["test_start"],
            "test_end": fold_info["test_end"],
            "train_size": len(X_train),
            "test_size": len(X_test),
            "xgb_auc": float(roc_auc_score(y_test, xgb_probs)),
            "lgb_auc": float(roc_auc_score(y_test, lgb_probs)),
            "xgb_acc": float(accuracy_score(y_test, (xgb_probs >= 0.5).astype(int))),
            "lgb_acc": float(accuracy_score(y_test, (lgb_probs >= 0.5).astype(int))),
        })
        logger.info(f"Fold {fold_idx+1}: XGB AUC={fold_results[-1]['xgb_auc']:.4f}, LGB AUC={fold_results[-1]['lgb_auc']:.4f}")

    # ── Final Model Training (all-but-last-fold train, last fold test) ───
    last_fold = FOLD_BOUNDARIES[-1]
    final_train_mask = date_index <= pd.Timestamp(last_fold["train_end"])
    final_test_mask = (date_index >= pd.Timestamp(last_fold["test_start"])) & \
                      (date_index <= pd.Timestamp(last_fold["test_end"]))

    X_train_final, y_train_final = X[final_train_mask], y[final_train_mask]
    X_test_final, y_test_final = X[final_test_mask], y[final_test_mask]

    logger.info(f"Final model: train={len(X_train_final)}, test={len(X_test_final)}")

    xgb_final = xgb.XGBClassifier(**xgb_best_params, random_state=42, eval_metric='logloss', verbosity=0)
    xgb_final.fit(X_train_final, y_train_final)

    lgb_final = lgb.LGBMClassifier(**lgb_best_params, random_state=42, verbose=-1)
    lgb_final.fit(X_train_final, y_train_final)

    # ── Permutation Importance ────────────────────────────────────────────
    logger.info("Computing permutation importance on held-out test fold...")
    perm_result = permutation_importance_with_control(
        lgb_final, X_test_final, y_test_final, scoring='roc_auc', n_repeats=10,
    )
    logger.info(f"Permutation importance: {len(perm_result['features_to_keep'])} features to keep, "
                f"{len(perm_result['features_to_drop'])} to drop")

    # ── Bootstrapped AUC CI ───────────────────────────────────────────────
    xgb_test_probs = xgb_final.predict_proba(X_test_final)[:, 1]
    lgb_test_probs = lgb_final.predict_proba(X_test_final)[:, 1]

    logger.info("Computing bootstrapped AUC confidence intervals (1000 resamples)...")
    xgb_ci = bootstrap_auc_ci(y_test_final, xgb_test_probs, groups=df['ticker'].values[final_test_mask])
    lgb_ci = bootstrap_auc_ci(y_test_final, lgb_test_probs, groups=df['ticker'].values[final_test_mask])

    logger.info(f"XGBoost AUC: {xgb_ci['point_auc']:.4f} [{xgb_ci['ci_lower']:.4f}, {xgb_ci['ci_upper']:.4f}] "
                f"p={xgb_ci['p_value_vs_random']:.4f} excludes_0.5={xgb_ci['excludes_0_5']}")
    logger.info(f"LightGBM AUC: {lgb_ci['point_auc']:.4f} [{lgb_ci['ci_lower']:.4f}, {lgb_ci['ci_upper']:.4f}] "
                f"p={lgb_ci['p_value_vs_random']:.4f} excludes_0.5={lgb_ci['excludes_0_5']}")

    # ── Final Metrics ─────────────────────────────────────────────────────
    xgb_preds = (xgb_test_probs >= 0.5).astype(int)
    lgb_preds = (lgb_test_probs >= 0.5).astype(int)

    def compute_metrics(name, y_t, preds, probs, ci):
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

    xgb_metrics = compute_metrics("XGBoost", y_test_final, xgb_preds, xgb_test_probs, xgb_ci)
    lgb_metrics = compute_metrics("LightGBM", y_test_final, lgb_preds, lgb_test_probs, lgb_ci)

    # ── Save Models ───────────────────────────────────────────────────────
    with open(os.path.join(models_dir, "trend_xgboost.pkl"), "wb") as f:
        pickle.dump(xgb_final, f)
    with open(os.path.join(models_dir, "trend_lightgbm.pkl"), "wb") as f:
        pickle.dump(lgb_final, f)

    # ── Save Metadata ─────────────────────────────────────────────────────
    meta = {
        "features": features,
        "label_definition": "1 if 5-day forward return > 2%, else 0",
        "cv_scheme": "walk_forward_expanding_window_5_folds_5d_purge",
        "fold_boundaries": FOLD_BOUNDARIES,
        "metrics": {
            "xgboost": xgb_metrics,
            "lightgbm": lgb_metrics,
        },
        "hyperparameters": {
            "xgboost_best": xgb_best_params,
            "lightgbm_best": lgb_best_params,
        },
        "walk_forward_folds": fold_results,
        "permutation_importance": {
            "features_to_keep": perm_result["features_to_keep"],
            "features_to_drop": perm_result["features_to_drop"],
            "control_threshold": perm_result["control_threshold"],
        },
    }
    with open(os.path.join(models_dir, "feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info("Trend model training complete.")
    return meta


def main():
    datasets_dir = "ml/datasets"
    models_dir = "models"
    os.makedirs(models_dir, exist_ok=True)

    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    if not parquet_files:
        logger.error(f"No parquet datasets found in {datasets_dir}. Exiting.")
        return

    market_returns = compute_market_returns(datasets_dir)
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    combined = []
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['ticker'] = ticker
            combined.append(df)
            logger.info(f"Processed {ticker}: {len(df)} rows.")
        except Exception as e:
            logger.error(f"Error processing {ticker}: {e}")

    full_df = pd.concat(combined)
    full_df = full_df.dropna()
    features = get_feature_columns(full_df)

    train_trend(full_df, features, models_dir, workspace_root)


if __name__ == "__main__":
    main()
