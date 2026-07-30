# Feature Experiments Report

This report evaluates the addition of cross-sectional and a market-return-volume interaction proxy feature.
Features added: `market_return_volume_interaction`, `cross_sectional_rank_65`, `sector_rank`.

## Model Performance Comparison

Evaluated using pooled out-of-fold predictions from a full 5-fold Walk-Forward CV.

| Model Variant | Metric (AUC/F1) | 95% CI | Excludes 0.5? | Perm. Features Kept |
|---|---|---|---|---|
| Trend (Baseline) | 0.5412 | [0.5371, 0.5462] | ✅ Yes | 99 |
| Trend (With New Features) | 0.5448 | [0.5407, 0.5498] | ✅ Yes | 103 |
| Profit (Baseline) | 0.5149 | [0.5106, 0.5192] | ✅ Yes | 101 |
| Profit (With New Features) | 0.5252 | [0.5202, 0.5294] | ✅ Yes | 103 |
| Risk (Baseline) | 0.4504 | N/A (F1) | N/A | 73 |
| Risk (With New Features) | 0.4540 | N/A (F1) | N/A | 62 |

## Permutation Importance of Target Features

| Model Variant | `market_return_volume_interaction` | `cross_sectional_rank_65` | `sector_rank` | `nifty_rs` | `sector_rs` |
|---|---|---|---|---|---|
| Trend (Baseline) | N/A | N/A | N/A | Rank 64 (0.0006) - KEPT | Rank 121 (-0.0001) - DROPPED |
| Trend (With New Features) | Rank 5 (0.0135) - KEPT | Rank 21 (0.0028) - KEPT | Rank 37 (0.0015) - KEPT | Rank 68 (0.0006) - KEPT | Rank 100 (0.0001) - KEPT |
| Profit (Baseline) | N/A | N/A | N/A | Rank 95 (0.0002) - KEPT | Rank 91 (0.0003) - KEPT |
| Profit (With New Features) | Rank 2 (0.0263) - KEPT | Rank 4 (0.0084) - KEPT | Rank 6 (0.0076) - KEPT | Rank 101 (0.0001) - KEPT | Rank 60 (0.0010) - KEPT |
| Risk (Baseline) | N/A | N/A | N/A | Rank 113 (-0.0001) - DROPPED | Rank 111 (-0.0001) - DROPPED |
| Risk (With New Features) | Rank 4 (0.0058) - KEPT | Rank 69 (0.0002) - DROPPED | Rank 42 (0.0005) - KEPT | Rank 92 (0.0000) - DROPPED | Rank 91 (0.0000) - DROPPED |
