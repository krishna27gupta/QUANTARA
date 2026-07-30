# Label Definitions Experiment Report

> [!IMPORTANT]
> **Note**: This report supersedes a previous version that was incorrectly run on a subset of only 5 stocks. This report correctly evaluates the full 65-stock universe.

This report ranks alternative label formulations against the original `+4% / -2% / 5-day` baseline.
A model's 95% Confidence Interval excluding 0.5 suggests a statistically significant edge. Finding no edge is a valid and useful result, indicating the market is too efficient at that horizon or parameters.

| Rank | Variant | AUC Point | 95% CI | Excludes 0.5? | p-value vs 0.5 | Base Rate | Perm. Features Kept |
|---|---|---|---|---|---|---|---|
| 1 | 1-Day Hold (+2%/-2%) | 0.5309 | [0.5214, 0.5393] | ✅ Yes | 0.0000 | 34.4% | 90 |
| 2 | Baseline (5-day, +4%/-2%) | 0.5278 | [0.5184, 0.5370] | ✅ Yes | 0.0000 | 33.8% | 41 |
| 3 | Vol-Adjusted (5-day, TP=2*vol, SL=-vol) | 0.5242 | [0.5156, 0.5328] | ✅ Yes | 0.0000 | 46.7% | 49 |
| 4 | Regime: Low Volatility (vol_20d <= Median) | 0.5179 | [0.5067, 0.5290] | ✅ Yes | 0.0000 | 35.6% | 17 |
| 5 | 10-Day Hold (+2%/-2%) | 0.5155 | [0.5068, 0.5247] | ✅ Yes | 0.0010 | 40.6% | 90 |
| 6 | 20-Day Hold (+2%/-2%) | 0.5127 | [0.5045, 0.5214] | ✅ Yes | 0.0020 | 40.7% | 24 |
| 7 | 3-Day Hold (+2%/-2%) | 0.5114 | [0.5028, 0.5201] | ✅ Yes | 0.0070 | 39.4% | 48 |
| 8 | Regime: High Volatility (vol_20d > Median) | 0.5083 | [0.4932, 0.5230] | ❌ No | 0.1480 | 32.0% | 56 |
