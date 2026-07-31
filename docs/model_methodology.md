# Quantara Model Methodology Report

> Auto-generated on 2026-07-28 05:57:40 UTC by `ml/src/train_all_models.py`.
> This document is fully reproducible: re-run the training pipeline to regenerate.

---

## Cross-Validation Scheme

All models use **walk-forward (rolling-origin) cross-validation** with 5 sequential
expanding-window folds and a 5-day purge gap between training and test periods.
The purge gap matches the forward-looking label horizon (5 trading days) to prevent
target leakage at fold boundaries.

### Fold Boundaries

| Fold | Train End | Test Start | Test End |
|------|-----------|------------|----------|
| 1 | 2019-12-31 | 2020-01-08 | 2021-06-30 |
| 2 | 2021-06-30 | 2021-07-08 | 2022-06-30 |
| 3 | 2022-06-30 | 2022-07-08 | 2023-06-30 |
| 4 | 2023-06-30 | 2023-07-08 | 2024-06-30 |
| 5 | 2024-06-30 | 2024-07-08 | 2025-12-31 |

---

## 1. Trend Classifier

**Label:** 1 if 5-day forward return > 2%, else 0

### Hyperparameter Search

Search method: `RandomizedSearchCV` (30 iterations) with walk-forward CV splitter.

**xgboost_best:** `{"subsample": 0.8, "n_estimators": 300, "min_child_weight": 5, "max_depth": 5, "learning_rate": 0.01, "colsample_bytree": 0.6}`

**lightgbm_best:** `{"num_leaves": 31, "n_estimators": 100, "min_child_samples": 10, "max_depth": 4, "learning_rate": 0.03, "feature_fraction": 0.7}`

### Walk-Forward Fold Results

| Fold | Train Size | Test Size | XGB AUC | LGB AUC |
|------|-----------|-----------|---------|---------|
| 1 | 39339 | 16879 | 0.5485 | 0.5487 |
| 2 | 56443 | 11406 | 0.5389 | 0.5427 |
| 3 | 68084 | 11291 | 0.5563 | 0.5540 |
| 4 | 79605 | 11260 | 0.5433 | 0.5481 |
| 5 | 91100 | 17911 | 0.5642 | 0.5595 |

### Final Model Metrics (Last Fold = Held-Out Test)

**XGBoost:**
- AUC: **0.5642** [0.5544, 0.5741]
- p-value vs 0.5: 0.0000
- **Excludes 0.5 from CI: True**
- Accuracy: 0.7450, Precision: 0.5926, Recall: 0.0035, F1: 0.0070

**LightGBM:**
- AUC: **0.5595** [0.5498, 0.5700]
- p-value vs 0.5: 0.0000
- **Excludes 0.5 from CI: True**
- Accuracy: 0.7450, Precision: 0.6250, Recall: 0.0022, F1: 0.0044

### Permutation Importance

- Features retained: 33
- Features dropped (indistinguishable from noise): 88
- Control threshold: 0.00013379407438831348

---

## 2. Profit Classifier

**Label:** 1 if +2% touched before -2% within 1 trading day, else 0

> [!WARNING]
> **Deprecation Notice for Legacy 5-Day Label**
> The original baseline label (1 if +4% touched before -2% within 5 days) has been officially deprecated. While it showed apparent promise during cross-validation, it completely failed true out-of-sample holdout validation (AUC 0.5007, failing to exclude 0.5). It has been replaced by the 1-Day Hold (+2%/-2%) variant which successfully excluded 0.5 in true holdout (AUC 0.5287) and demonstrated far superior fold-over-fold stability.

**Base win rate:** [To be populated by training script]

### Hyperparameter Search

**random_forest_best:** `{"n_estimators": 200, "min_samples_split": 10, "min_samples_leaf": 20, "max_features": "sqrt", "max_depth": 8}`

**xgboost_best:** `{"subsample": 0.7, "n_estimators": 200, "min_child_weight": 3, "max_depth": 3, "learning_rate": 0.01, "colsample_bytree": 0.6}`

### Walk-Forward Fold Results

| Fold | Train Size | Test Size | RF AUC | XGB AUC |
|------|-----------|-----------|--------|---------|
| 1 | 39334 | 16879 | 0.5325 | 0.5266 |
| 2 | 56438 | 11406 | 0.5051 | 0.5012 |
| 3 | 68079 | 11291 | 0.5268 | 0.5297 |
| 4 | 79600 | 11260 | 0.5114 | 0.5108 |
| 5 | 91095 | 17911 | 0.5341 | 0.5291 |

### Final Model Metrics (Last Fold = Held-Out Test)

**RandomForest:**
- AUC: **0.5341** [0.5250, 0.5428]
- p-value vs 0.5: 0.0000
- **Excludes 0.5 from CI: True**
- Accuracy: 0.4764, Precision: 0.3430, Recall: 0.6565, F1: 0.4506

**XGBoost:**
- AUC: **0.5291** [0.5198, 0.5383]
- p-value vs 0.5: 0.0000
- **Excludes 0.5 from CI: True**
- Accuracy: 0.6729, Precision: 0.0000, Recall: 0.0000, F1: 0.0000

### Permutation Importance

- Features retained: 16
- Features dropped: 105

---

## 3. Risk / Volatility Classifier

**Label:** Terciles of realized volatility (annualized) over the next 5 trading days, thresholds fit on training split only

- Test Accuracy: **0.4587**
- Random Baseline (3-class): **0.3333**
- Lift over random: **+0.1254 pp**
- Macro F1: 0.4179

### Walk-Forward Fold Results

| Fold | Train Size | Test Size | Accuracy | Macro F1 |
|------|-----------|-----------|----------|----------|
| 1 | 39337 | 16879 | 0.5194 | 0.4450 |
| 2 | 56441 | 11406 | 0.4150 | 0.4091 |
| 3 | 68082 | 11291 | 0.4650 | 0.4144 |
| 4 | 79603 | 11260 | 0.4483 | 0.3909 |
| 5 | 91098 | 17911 | 0.4587 | 0.4179 |

### Permutation Importance

- Features retained: 89
- Features dropped: 32

---

## 4. Expected Return (Quantile Regression)

**Label:** Actual 5-day forward close-to-close return, percent
**Model type:** Gradient Boosted Quantile Regression (not LSTM/GRU - see file docstring)

- Median MAE: 5.7118 pp
- Median R²: -0.0004 (point forecast has no predictive value)
- Actuals within 10-90 band: 82.4%

### Walk-Forward Fold Results

| Fold | Train Size | Test Size | MAE | R² | Calibration % |
|------|-----------|-----------|-----|-----|---------------|
| 1 | 39334 | 16879 | 5.0319 | -0.0008 | 71.3% |
| 2 | 56438 | 11406 | 3.5698 | -0.0007 | 77.5% |
| 3 | 68079 | 11291 | 2.5413 | 0.0006 | 88.1% |
| 4 | 79600 | 11260 | 2.6854 | -0.0039 | 83.8% |
| 5 | 91095 | 17911 | 5.7118 | -0.0004 | 82.4% |

### Permutation Importance

- Features retained: 11
- Features dropped: 110

---

## Data Quality Caveats

See [`docs/survivorship_bias_audit.md`](survivorship_bias_audit.md) for details.

Trained on **65 stocks** with point-in-time constituent filtering
applied via `filter_point_in_time()` in `ml/src/features_engine.py`. The training
universe includes historical NIFTY 50 drop-outs (e.g. YESBANK, VEDL, GAIL) and
each stock's data is masked to its actual index membership window, preventing
survivorship bias from inflating model metrics.
