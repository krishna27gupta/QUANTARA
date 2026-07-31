# 1-Day Horizon Feature Experiments Report

This report evaluates the addition of cross-sectional and market-return-volume interaction proxy features against the validated **1-Day Hold (+2%/-2%)** label horizon.
Features tested: `market_return_volume_interaction`, `cross_sectional_rank_65`, `sector_rank`.

## 1. Walk-Forward CV Pooled Performance

| Model Variant | Metric (AUC) | 95% CI (Ticker-Cluster Bootstrap) | Excludes 0.5? | Perm. Features Kept |
|---|---|---|---|---|
| 1-Day Hold (Baseline) | 0.5205 | [0.5154, 0.5247] | ✅ Yes | 100 |
| 1-Day Hold (With New Features) | 0.5305 | [0.5261, 0.5344] | ✅ Yes | 101 |

## 2. Permutation Importance (Target Features)

| Model Variant | `market_return_volume_interaction` | `cross_sectional_rank_65` | `sector_rank` |
|---|---|---|---|
| 1-Day Hold (Baseline) | N/A | N/A | N/A |
| 1-Day Hold (With New Features) | Rank 1 (0.0192) - KEPT | Rank 3 (0.0098) - KEPT | Rank 5 (0.0089) - KEPT |

## 3. Robustness Checks

### 1-Day Hold (Baseline)

- **Cost-Adjusted Economics**: Base rate net of 0.5% RT costs = 34.42%
- **Concentration Check**: 83.6% of tickers > 0.5 AUC (Median Ticker AUC: 0.5146)
- **Per-Fold Stability (Fold AUCs)**:
  - Fold 1: 0.5209
  - Fold 2: 0.5080
  - Fold 3: 0.5143
  - Fold 4: 0.5295
  - Fold 5: 0.5266
- **True Holdout Check**: 0.5350 [0.5212, 0.5484] (Excludes 0.5)

### 1-Day Hold (With New Features)

- **Cost-Adjusted Economics**: Base rate net of 0.5% RT costs = 34.42%
- **Concentration Check**: 92.7% of tickers > 0.5 AUC (Median Ticker AUC: 0.5211)
- **Per-Fold Stability (Fold AUCs)**:
  - Fold 1: 0.5282
  - Fold 2: 0.5236
  - Fold 3: 0.5227
  - Fold 4: 0.5360
  - Fold 5: 0.5352
- **True Holdout Check**: 0.5401 [0.5267, 0.5527] (Excludes 0.5)


## Conclusion

The new features demonstrate a **statistically significant, non-overlapping improvement** over the baseline on the 1-Day horizon. They survive all robustness checks.
