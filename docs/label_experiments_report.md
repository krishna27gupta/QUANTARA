# Label Experiments Report

This report evaluates multiple alternative label definitions against the existing feature set.
A model's 95% Confidence Interval excluding 0.5 suggests a statistically significant edge. Finding no edge is a valid and useful result, indicating the market is too efficient at that horizon or parameters.

| Rank | Variant | AUC Point | 95% CI | Excludes 0.5? | p-value vs 0.5 | Base Rate | Perm. Features Kept |
|---|---|---|---|---|---|---|---|
| 1 | Vol-Adjusted (5-day, TP=2*vol, SL=-vol) | 0.5015 | [0.4657, 0.5364] | ❌ No | 0.4760 | 46.6% | 35 |
| 2 | 3-Day Hold (+2%/-2%) | 0.4912 | [0.4578, 0.5256] | ❌ No | 0.6910 | 40.2% | 87 |
| 3 | Baseline (5-day, +4%/-2%) | 0.4907 | [0.4523, 0.5273] | ❌ No | 0.6820 | 33.8% | 86 |
| 4 | Regime: High Volatility (vol_20d > Median) | 0.4906 | [0.4319, 0.5531] | ❌ No | 0.5950 | 32.9% | 20 |
| 5 | 1-Day Hold (+2%/-2%) | 0.4905 | [0.4540, 0.5244] | ❌ No | 0.7080 | 34.4% | 42 |
| 6 | 20-Day Hold (+2%/-2%) | 0.4810 | [0.4477, 0.5134] | ❌ No | 0.8730 | 41.1% | 24 |
| 7 | Regime: Low Volatility (vol_20d <= Median) | 0.4796 | [0.4355, 0.5235] | ❌ No | 0.8110 | 34.8% | 21 |
| 8 | 10-Day Hold (+2%/-2%) | 0.4662 | [0.4314, 0.4989] | ❌ No | 0.9780 | 40.9% | 31 |
