# Feature Experiments Report

This report evaluates the addition of cross-sectional and market-wide flow features.
Features added: `fii_flow`, `cross_sectional_rank_65`, `sector_rank`.

## Model Performance Comparison

| Model Variant | Metric (AUC/F1) | 95% CI | Excludes 0.5? | Perm. Features Kept |
|---|---|---|---|---|
| Trend (Baseline) | 0.5525 | [0.5435, 0.5624] | ✅ Yes | 24 |
| Trend (With New Features) | 0.5574 | [0.5475, 0.5670] | ✅ Yes | 33 |
| Profit (Baseline) | 0.5288 | [0.5202, 0.5374] | ✅ Yes | 87 |
| Profit (With New Features) | 0.5314 | [0.5228, 0.5403] | ✅ Yes | 50 |
| Risk (Baseline) | 0.4165 | N/A (F1) | N/A | 77 |
| Risk (With New Features) | 0.4238 | N/A (F1) | N/A | 60 |

## Permutation Importance of Target Features

| Model Variant | `fii_flow` | `cross_sectional_rank_65` | `sector_rank` | `nifty_rs` | `sector_rs` |
|---|---|---|---|---|---|
| Trend (Baseline) | N/A | N/A | N/A | Rank 69 (0.0000) - DROPPED | Rank 70 (0.0000) - DROPPED |
| Trend (With New Features) | Rank 3 (0.0062) - KEPT | Rank 105 (-0.0003) - DROPPED | Rank 18 (0.0008) - KEPT | Rank 61 (0.0000) - DROPPED | Rank 62 (0.0000) - DROPPED |
| Profit (Baseline) | N/A | N/A | N/A | Rank 67 (0.0000) - KEPT | Rank 68 (0.0000) - KEPT |
| Profit (With New Features) | Rank 7 (0.0021) - KEPT | Rank 84 (-0.0000) - DROPPED | Rank 6 (0.0026) - KEPT | Rank 59 (0.0000) - DROPPED | Rank 60 (0.0000) - DROPPED |
| Risk (Baseline) | N/A | N/A | N/A | Rank 31 (0.0000) - KEPT | Rank 32 (0.0000) - KEPT |
| Risk (With New Features) | Rank 2 (0.0055) - KEPT | Rank 39 (0.0003) - KEPT | Rank 110 (-0.0006) - DROPPED | Rank 64 (0.0000) - DROPPED | Rank 65 (0.0000) - DROPPED |
