# Label Definitions Experiment Report

> [!IMPORTANT]
> **Methodology Update**: This report supersedes previous versions due to a statistical methodology error in the bootstrap function. The original CI calculation assumed rows were independent, which is invalid for panel data. The revised Bootstrapped AUC now correctly performs block/cluster resampling at the ticker level.

This report ranks alternative label formulations against the original `+4% / -2% / 5-day` baseline.

A model's 95% Confidence Interval excluding 0.5 suggests a statistically significant edge. Finding no edge is a valid and useful result, indicating the market is too efficient at that horizon or parameters.

| Rank | Variant | AUC Point | 95% CI | Excludes 0.5? | p-value vs 0.5 | Base Rate | Perm. Features Kept |
|---|---|---|---|---|---|---|---|
| 1 | 1-Day Hold (+2%/-2%) | 0.5309 | [0.5216, 0.5397] | ✅ Yes | 0.0000 | 34.4% | 90 |
| 2 | Baseline (5-day, +4%/-2%) | 0.5278 | [0.5117, 0.5439] | ✅ Yes | 0.0010 | 33.8% | 41 |
| 3 | Vol-Adjusted (5-day, TP=2*vol, SL=-vol) | 0.5242 | [0.5086, 0.5387] | ✅ Yes | 0.0020 | 46.7% | 49 |
| 4 | Regime: Low Volatility (vol_20d <= Median) | 0.5179 | [0.5032, 0.5316] | ✅ Yes | 0.0050 | 35.6% | 17 |
| 5 | 10-Day Hold (+2%/-2%) | 0.5155 | [0.5008, 0.5293] | ✅ Yes | 0.0220 | 40.6% | 90 |
| 6 | 20-Day Hold (+2%/-2%) | 0.5127 | [0.4986, 0.5260] | ❌ No | 0.0400 | 40.7% | 24 |
| 7 | 3-Day Hold (+2%/-2%) | 0.5114 | [0.4991, 0.5228] | ❌ No | 0.0280 | 39.4% | 48 |
| 8 | Regime: High Volatility (vol_20d > Median) | 0.5083 | [0.4836, 0.5351] | ❌ No | 0.2530 | 32.0% | 56 |
