# Feature Experiments Report

> [!IMPORTANT]
> **Methodology Update**: This report supersedes previous versions due to a statistical methodology error in the bootstrap function. The original CI calculation assumed rows were independent, which is invalid for panel data. The revised Bootstrapped AUC now correctly performs block/cluster resampling at the ticker level.

This report evaluates the addition of cross-sectional and a market-return-volume interaction proxy feature.
Features added: `market_return_volume_interaction`, `cross_sectional_rank_65`, `sector_rank`.

## Model Performance Comparison

Evaluated using pooled out-of-fold predictions from a full 5-fold Walk-Forward CV.

| Model Variant | Metric (AUC/F1) | 95% CI | Excludes 0.5? | Perm. Features Kept |
|---|---|---|---|---|
| Trend (Baseline) | 0.5412 | [0.5322, 0.5497] | ✅ Yes | 99 |
| Trend (With New Features) | 0.5435 | [0.5341, 0.5519] | ✅ Yes | 103 |
| Profit (Baseline) | 0.5149 | [0.5085, 0.5214] | ✅ Yes | 101 |
| Profit (With New Features) | 0.5244 | [0.5187, 0.5304] | ✅ Yes | 104 |
| Risk (Baseline) | 0.4504 | N/A (F1) | N/A | 73 |
| Risk (With New Features) | 0.4533 | N/A (F1) | N/A | 59 |

## Permutation Importance of Target Features

| Model Variant | `market_return_volume_interaction` | `cross_sectional_rank_65` | `sector_rank` | `nifty_rs` | `sector_rs` |
|---|---|---|---|---|---|
| Trend (Baseline) | N/A | N/A | N/A | Rank 64 (0.0006) - KEPT | Rank 121 (-0.0001) - DROPPED |
| Trend (With New Features) | Rank 3 (0.0137) - KEPT | Rank 24 (0.0030) - KEPT | Rank 36 (0.0017) - KEPT | Rank 81 (0.0003) - KEPT | Rank 110 (0.0000) - DROPPED |
| Profit (Baseline) | N/A | N/A | N/A | Rank 95 (0.0002) - KEPT | Rank 91 (0.0003) - KEPT |
| Profit (With New Features) | Rank 2 (0.0249) - KEPT | Rank 5 (0.0078) - KEPT | Rank 8 (0.0069) - KEPT | Rank 98 (0.0002) - KEPT | Rank 85 (0.0005) - KEPT |
| Risk (Baseline) | N/A | N/A | N/A | Rank 113 (-0.0001) - DROPPED | Rank 111 (-0.0001) - DROPPED |
| Risk (With New Features) | Rank 5 (0.0064) - KEPT | Rank 84 (0.0001) - DROPPED | Rank 35 (0.0009) - KEPT | Rank 90 (0.0001) - DROPPED | Rank 95 (0.0000) - DROPPED |
