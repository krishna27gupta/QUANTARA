"""
train_all_models.py

Orchestrator that runs all four model training pipelines sequentially and
generates docs/model_methodology.md with full reproducibility documentation.

Usage:
    cd quantara/
    python ml/src/train_all_models.py
"""
import os
import sys
import glob
import json
import logging
import datetime

# Ensure ml/src is importable
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import pandas as pd
from features_engine import compute_market_returns, load_and_engineer, get_feature_columns
from train_trend import train_trend
from train_profit import train_profit
from train_risk import train_risk
from train_expected_return import train_expected_return
from walk_forward_cv import FOLD_BOUNDARIES

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s - %(message)s")
logger = logging.getLogger("quantara-train-all")


def generate_methodology_report(
    trend_meta: dict,
    profit_meta: dict,
    risk_meta: dict,
    return_meta: dict,
    docs_dir: str,
):
    """Auto-generate docs/model_methodology.md from training results."""
    timestamp = datetime.datetime.now(datetime.timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    lines = []
    lines.append("# Quantara Model Methodology Report")
    lines.append("")
    lines.append(f"> Auto-generated on {timestamp} by `ml/src/train_all_models.py`.")
    lines.append("> This document is fully reproducible: re-run the training pipeline to regenerate.")
    lines.append("")
    lines.append("---")
    lines.append("")

    # ── CV Scheme ──────────────────────────────────────────────────────────
    lines.append("## Cross-Validation Scheme")
    lines.append("")
    lines.append("All models use **walk-forward (rolling-origin) cross-validation** with 5 sequential")
    lines.append("expanding-window folds and a 5-day purge gap between training and test periods.")
    lines.append("The purge gap matches the forward-looking label horizon (5 trading days) to prevent")
    lines.append("target leakage at fold boundaries.")
    lines.append("")
    lines.append("### Fold Boundaries")
    lines.append("")
    lines.append("| Fold | Train End | Test Start | Test End |")
    lines.append("|------|-----------|------------|----------|")
    for i, fb in enumerate(FOLD_BOUNDARIES):
        lines.append(f"| {i+1} | {fb['train_end']} | {fb['test_start']} | {fb['test_end']} |")
    lines.append("")

    # ── Trend Model ────────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## 1. Trend Classifier")
    lines.append("")
    lines.append(f"**Label:** {trend_meta.get('label_definition', 'N/A')}")
    lines.append("")
    lines.append("### Hyperparameter Search")
    lines.append("")
    lines.append("Search method: `RandomizedSearchCV` (30 iterations) with walk-forward CV splitter.")
    lines.append("")
    hp = trend_meta.get("hyperparameters", {})
    for model_name, params in hp.items():
        lines.append(f"**{model_name}:** `{json.dumps(params)}`")
        lines.append("")

    lines.append("### Walk-Forward Fold Results")
    lines.append("")
    lines.append("| Fold | Train Size | Test Size | XGB AUC | LGB AUC |")
    lines.append("|------|-----------|-----------|---------|---------|")
    for fr in trend_meta.get("walk_forward_folds", []):
        lines.append(f"| {fr['fold']} | {fr['train_size']} | {fr['test_size']} | {fr['xgb_auc']:.4f} | {fr['lgb_auc']:.4f} |")
    lines.append("")

    lines.append("### Final Model Metrics (Last Fold = Held-Out Test)")
    lines.append("")
    for model_key in ["xgboost", "lightgbm"]:
        m = trend_meta.get("metrics", {}).get(model_key, {})
        lines.append(f"**{m.get('name', model_key)}:**")
        lines.append(f"- AUC: **{m.get('auc', 'N/A'):.4f}** [{m.get('auc_ci_lower', 'N/A'):.4f}, {m.get('auc_ci_upper', 'N/A'):.4f}]")
        lines.append(f"- p-value vs 0.5: {m.get('auc_p_value_vs_random', 'N/A'):.4f}")
        lines.append(f"- **Excludes 0.5 from CI: {m.get('auc_excludes_0_5', 'N/A')}**")
        lines.append(f"- Accuracy: {m.get('test_acc', 'N/A'):.4f}, Precision: {m.get('precision', 'N/A'):.4f}, Recall: {m.get('recall', 'N/A'):.4f}, F1: {m.get('f1', 'N/A'):.4f}")
        lines.append("")

    lines.append("### Permutation Importance")
    lines.append("")
    pi = trend_meta.get("permutation_importance", {})
    lines.append(f"- Features retained: {len(pi.get('features_to_keep', []))}")
    lines.append(f"- Features dropped (indistinguishable from noise): {len(pi.get('features_to_drop', []))}")
    lines.append(f"- Control threshold: {pi.get('control_threshold', 'N/A')}")
    lines.append("")

    # ── Profit Model ───────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## 2. Profit Classifier")
    lines.append("")
    lines.append(f"**Label:** {profit_meta.get('label_definition', 'N/A')}")
    lines.append(f"**Base win rate:** {profit_meta.get('base_rate_win_pct', 'N/A'):.2f}%")
    lines.append("")
    lines.append("### Hyperparameter Search")
    lines.append("")
    hp = profit_meta.get("hyperparameters", {})
    for model_name, params in hp.items():
        lines.append(f"**{model_name}:** `{json.dumps(params)}`")
        lines.append("")

    lines.append("### Walk-Forward Fold Results")
    lines.append("")
    lines.append("| Fold | Train Size | Test Size | RF AUC | XGB AUC |")
    lines.append("|------|-----------|-----------|--------|---------|")
    for fr in profit_meta.get("walk_forward_folds", []):
        lines.append(f"| {fr['fold']} | {fr['train_size']} | {fr['test_size']} | {fr.get('rf_auc', 0):.4f} | {fr.get('xgb_auc', 0):.4f} |")
    lines.append("")

    lines.append("### Final Model Metrics (Last Fold = Held-Out Test)")
    lines.append("")
    for model_key in ["random_forest", "xgboost"]:
        m = profit_meta.get("metrics", {}).get(model_key, {})
        lines.append(f"**{m.get('name', model_key)}:**")
        lines.append(f"- AUC: **{m.get('auc', 'N/A'):.4f}** [{m.get('auc_ci_lower', 'N/A'):.4f}, {m.get('auc_ci_upper', 'N/A'):.4f}]")
        lines.append(f"- p-value vs 0.5: {m.get('auc_p_value_vs_random', 'N/A'):.4f}")
        lines.append(f"- **Excludes 0.5 from CI: {m.get('auc_excludes_0_5', 'N/A')}**")
        lines.append(f"- Accuracy: {m.get('test_acc', 'N/A'):.4f}, Precision: {m.get('precision', 'N/A'):.4f}, Recall: {m.get('recall', 'N/A'):.4f}, F1: {m.get('f1', 'N/A'):.4f}")
        lines.append("")

    pi = profit_meta.get("permutation_importance", {})
    lines.append("### Permutation Importance")
    lines.append("")
    lines.append(f"- Features retained: {len(pi.get('features_to_keep', []))}")
    lines.append(f"- Features dropped: {len(pi.get('features_to_drop', []))}")
    lines.append("")

    # ── Risk Model ─────────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## 3. Risk / Volatility Classifier")
    lines.append("")
    lines.append(f"**Label:** {risk_meta.get('label_definition', 'N/A')}")
    lines.append("")
    rm = risk_meta.get("metrics", {})
    lines.append(f"- Test Accuracy: **{rm.get('test_accuracy', 'N/A'):.4f}**")
    lines.append(f"- Random Baseline (3-class): **0.3333**")
    lines.append(f"- Lift over random: **+{rm.get('lift_over_random_pp', 'N/A'):.4f} pp**")
    lines.append(f"- Macro F1: {rm.get('macro_f1', 'N/A'):.4f}")
    lines.append("")

    lines.append("### Walk-Forward Fold Results")
    lines.append("")
    lines.append("| Fold | Train Size | Test Size | Accuracy | Macro F1 |")
    lines.append("|------|-----------|-----------|----------|----------|")
    for fr in risk_meta.get("walk_forward_folds", []):
        lines.append(f"| {fr['fold']} | {fr['train_size']} | {fr['test_size']} | {fr['accuracy']:.4f} | {fr['macro_f1']:.4f} |")
    lines.append("")

    pi = risk_meta.get("permutation_importance", {})
    lines.append("### Permutation Importance")
    lines.append("")
    lines.append(f"- Features retained: {len(pi.get('features_to_keep', []))}")
    lines.append(f"- Features dropped: {len(pi.get('features_to_drop', []))}")
    lines.append("")

    # ── Expected Return Model ──────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## 4. Expected Return (Quantile Regression)")
    lines.append("")
    lines.append(f"**Label:** {return_meta.get('label_definition', 'N/A')}")
    lines.append(f"**Model type:** {return_meta.get('model_type_honest', 'N/A')}")
    lines.append("")
    em = return_meta.get("metrics", {})
    lines.append(f"- Median MAE: {em.get('median_mae', 'N/A'):.4f} pp")
    lines.append(f"- Median R²: {em.get('median_r2', 'N/A'):.4f} (point forecast has no predictive value)")
    lines.append(f"- Actuals within 10-90 band: {em.get('pct_actuals_within_10_90_band', 'N/A'):.1f}%")
    lines.append("")

    lines.append("### Walk-Forward Fold Results")
    lines.append("")
    lines.append("| Fold | Train Size | Test Size | MAE | R² | Calibration % |")
    lines.append("|------|-----------|-----------|-----|-----|---------------|")
    for fr in return_meta.get("walk_forward_folds", []):
        lines.append(f"| {fr['fold']} | {fr['train_size']} | {fr['test_size']} | {fr['median_mae']:.4f} | {fr['median_r2']:.4f} | {fr['pct_within_10_90_band']:.1f}% |")
    lines.append("")

    pi = return_meta.get("permutation_importance", {})
    lines.append("### Permutation Importance")
    lines.append("")
    lines.append(f"- Features retained: {len(pi.get('features_to_keep', []))}")
    lines.append(f"- Features dropped: {len(pi.get('features_to_drop', []))}")
    lines.append("")

    # ── Data Caveats ───────────────────────────────────────────────────────
    lines.append("---")
    lines.append("")
    lines.append("## Data Quality Caveats")
    lines.append("")
    lines.append("See [`docs/survivorship_bias_audit.md`](survivorship_bias_audit.md) for details.")
    lines.append("All model metrics above are subject to survivorship bias — the training data")
    lines.append("contains only current NIFTY 50 constituents, not the historical point-in-time universe.")
    lines.append("")

    report_path = os.path.join(docs_dir, "model_methodology.md")
    with open(report_path, "w") as f:
        f.write("\n".join(lines))
    logger.info(f"Methodology report saved to {report_path}")


def main():
    datasets_dir = "ml/datasets"
    models_dir = "models"
    docs_dir = "docs"
    os.makedirs(models_dir, exist_ok=True)
    os.makedirs(docs_dir, exist_ok=True)

    logger.info("=" * 70)
    logger.info("QUANTARA — FULL MODEL TRAINING PIPELINE")
    logger.info("=" * 70)

    # ── Load & engineer combined dataset once ─────────────────────────────
    parquet_files = glob.glob(os.path.join(datasets_dir, "*.parquet"))
    if not parquet_files:
        logger.error(f"No parquet datasets found in {datasets_dir}. Exiting.")
        return

    logger.info(f"Found {len(parquet_files)} stock datasets. Loading and engineering features...")
    market_returns = compute_market_returns(datasets_dir)
    workspace_root = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", ".."))

    combined = []
    for file in parquet_files:
        ticker = os.path.basename(file).replace(".parquet", "")
        try:
            df = load_and_engineer(ticker, datasets_dir, market_returns, workspace_root=workspace_root)
            df['ticker'] = ticker
            combined.append(df)
            logger.info(f"  {ticker}: {len(df)} rows")
        except Exception as e:
            logger.error(f"  Error processing {ticker}: {e}")

    full_df = pd.concat(combined)
    full_df = full_df.dropna()
    features = get_feature_columns(full_df)
    logger.info(f"Combined dataset: {full_df.shape}, Features: {len(features)}")

    # ── Train all models ──────────────────────────────────────────────────
    trend_meta = train_trend(full_df, features, models_dir, workspace_root)
    profit_meta = train_profit(full_df, features, models_dir)
    risk_meta = train_risk(full_df, features, models_dir)
    return_meta = train_expected_return(full_df, features, models_dir)

    # ── Generate methodology report ───────────────────────────────────────
    generate_methodology_report(trend_meta, profit_meta, risk_meta, return_meta, docs_dir)

    logger.info("=" * 70)
    logger.info("ALL MODELS TRAINED SUCCESSFULLY")
    logger.info("=" * 70)


if __name__ == "__main__":
    main()
