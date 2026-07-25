"""
train_risk.py

Walk-forward cross-validated risk classifier with:
  - 5 expanding-window folds with 5-day purge gap
  - RandomizedSearchCV hyperparameter tuning using walk-forward splitter
  - Permutation importance with shuffled-label control for feature pruning
  - Per-fold accuracy and macro-F1 (multiclass — AUC CI not applicable)

Target: 3-class — terciles of realized annualized volatility over the next 5 trading days.
Tercile thresholds fit on each fold's training data only (no leakage).
Model: HistGradientBoostingClassifier.
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
from sklearn.model_selection import RandomizedSearchCV

from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from walk_forward_cv import (
    TimeSeriesWalkForwardCV, FOLD_BOUNDARIES,
    permutation_importance_with_control,
)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-risk")

FORWARD_WINDOW = 5

HISTGB_PARAM_DIST = {
    "max_iter": [100, 150, 200, 300],
    "max_depth": [3, 4, 5, 6, None],
    "learning_rate": [0.01, 0.03, 0.05, 0.1],
    "min_samples_leaf": [5, 10, 20, 50],
    "max_leaf_nodes": [15, 31, 50, None],
    "l2_regularization": [0.0, 0.1, 1.0, 10.0],
}


def compute_forward_realized_vol(df: pd.DataFrame) -> pd.Series:
    daily_ret = df['Close'].pct_change()
    fwd_returns = pd.concat([daily_ret.shift(-i) for i in range(1, FORWARD_WINDOW + 1)], axis=1)
    fwd_vol = fwd_returns.std(axis=1) * np.sqrt(252)
    return fwd_vol


def train_risk(full_df: pd.DataFrame, features: list, models_dir: str) -> dict:
    """
    Train risk classifier with full walk-forward CV rigor.
    """
    logger.info("=" * 60)
    logger.info("RISK MODEL — Walk-Forward Training Pipeline")
    logger.info("=" * 60)

    # ── Target ────────────────────────────────────────────────────────────
    df = full_df.copy()
    df['forward_realized_vol'] = compute_forward_realized_vol(df)
    df = df.dropna(subset=['forward_realized_vol'] + features)

    X = df[features]
    date_index = df.index

    # ── Walk-Forward CV with per-fold tercile thresholds ───────────────────
    cv = TimeSeriesWalkForwardCV(date_index)

    # For hyperparameter tuning, we need a consistent target. Use global terciles
    # from the earliest possible train window for the search, then recompute per-fold.
    early_train = df[df.index <= pd.Timestamp(FOLD_BOUNDARIES[0]["train_end"])]
    global_q33, global_q66 = early_train['forward_realized_vol'].quantile([0.33, 0.66])

    def bucket(v, q33, q66):
        if v < q33:
            return 0
        elif v < q66:
            return 1
        else:
            return 2

    # Global target for search
    y_global = df['forward_realized_vol'].apply(lambda v: bucket(v, global_q33, global_q66)).values

    # ── Hyperparameter Tuning ─────────────────────────────────────────────
    logger.info("Hyperparameter tuning HistGradientBoosting via RandomizedSearchCV...")
    gb_base = HistGradientBoostingClassifier(random_state=42)
    gb_search = RandomizedSearchCV(
        gb_base, HISTGB_PARAM_DIST, n_iter=30, cv=cv, scoring='f1_macro',
        random_state=42, n_jobs=-1, refit=False,
    )
    gb_search.fit(X, y_global)
    best_params = gb_search.best_params_
    logger.info(f"Best params: {best_params}")

    # ── Per-Fold Evaluation (with per-fold thresholds) ────────────────────
    fold_results = []
    for fold_idx, (train_idx, test_idx) in enumerate(cv.split()):
        fold_info = FOLD_BOUNDARIES[fold_idx]
        df_train_fold = df.iloc[train_idx]
        df_test_fold = df.iloc[test_idx]

        # Fit terciles on this fold's training data only
        q33, q66 = df_train_fold['forward_realized_vol'].quantile([0.33, 0.66])
        y_train = df_train_fold['forward_realized_vol'].apply(lambda v: bucket(v, q33, q66)).values
        y_test = df_test_fold['forward_realized_vol'].apply(lambda v: bucket(v, q33, q66)).values

        X_train = df_train_fold[features]
        X_test = df_test_fold[features]

        model = HistGradientBoostingClassifier(**best_params, random_state=42)
        model.fit(X_train, y_train)

        preds = model.predict(X_test)
        acc = float(accuracy_score(y_test, preds))
        f1 = float(f1_score(y_test, preds, average='macro'))

        fold_results.append({
            "fold": fold_idx + 1,
            "train_end": fold_info["train_end"],
            "test_start": fold_info["test_start"],
            "test_end": fold_info["test_end"],
            "train_size": len(X_train),
            "test_size": len(X_test),
            "accuracy": acc,
            "macro_f1": f1,
            "thresholds": {"q33": float(q33), "q66": float(q66)},
        })
        logger.info(f"Fold {fold_idx+1}: Acc={acc:.4f}, Macro F1={f1:.4f}")

    # ── Final Model Training ──────────────────────────────────────────────
    last_fold = FOLD_BOUNDARIES[-1]
    final_train_mask = date_index <= pd.Timestamp(last_fold["train_end"])
    final_test_mask = (date_index >= pd.Timestamp(last_fold["test_start"])) & \
                      (date_index <= pd.Timestamp(last_fold["test_end"]))

    df_train_final = df[final_train_mask]
    df_test_final = df[final_test_mask]

    q33_final, q66_final = df_train_final['forward_realized_vol'].quantile([0.33, 0.66])
    y_train_final = df_train_final['forward_realized_vol'].apply(lambda v: bucket(v, q33_final, q66_final)).values
    y_test_final = df_test_final['forward_realized_vol'].apply(lambda v: bucket(v, q33_final, q66_final)).values

    X_train_final = df_train_final[features]
    X_test_final = df_test_final[features]

    gb_final = HistGradientBoostingClassifier(**best_params, random_state=42)
    gb_final.fit(X_train_final, y_train_final)

    test_preds = gb_final.predict(X_test_final)
    final_acc = float(accuracy_score(y_test_final, test_preds))
    final_f1 = float(f1_score(y_test_final, test_preds, average='macro'))
    report = classification_report(y_test_final, test_preds, target_names=["Low", "Medium", "High"], output_dict=True)

    logger.info(f"Final model: Acc={final_acc:.4f}, Macro F1={final_f1:.4f}")

    # ── Permutation Importance ────────────────────────────────────────────
    logger.info("Computing permutation importance...")
    perm_result = permutation_importance_with_control(
        gb_final, X_test_final, y_test_final, scoring='f1_macro', n_repeats=10,
    )

    # ── Save ──────────────────────────────────────────────────────────────
    with open(os.path.join(models_dir, "risk_gb.pkl"), "wb") as f:
        pickle.dump(gb_final, f)

    meta = {
        "features": features,
        "label_definition": f"Terciles of realized volatility (annualized) over the next {FORWARD_WINDOW} trading days, thresholds fit on training split only",
        "thresholds": {"low_upper_bound": float(q33_final), "medium_upper_bound": float(q66_final)},
        "cv_scheme": "walk_forward_expanding_window_5_folds_5d_purge",
        "fold_boundaries": FOLD_BOUNDARIES,
        "metrics": {
            "test_accuracy": final_acc,
            "macro_f1": final_f1,
            "random_baseline_accuracy": 0.3333,
            "lift_over_random_pp": round(final_acc - 0.3333, 4),
            "classification_report": report,
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
    with open(os.path.join(models_dir, "risk_feature_metadata.json"), "w") as f:
        json.dump(meta, f, indent=2)

    logger.info("Risk model training complete.")
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

    train_risk(full_df, features, models_dir)


if __name__ == "__main__":
    main()
