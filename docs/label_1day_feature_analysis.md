# 1-Day Hold (+2%/-2%) Feature Importance Analysis

Averaged across all Walk-Forward CV folds, these are the top 10 most predictive features for achieving a 2% up-move before a 2% down-move in a single trading day (net of 0.5% round-trip costs):

1. **lag_trend_persistence_5d_1** (Importance: 0.0022)
   - *Interpretation: Previous day's 5-day trend strength; strong momentum often carries over into the next day's open, driving immediate intraday continuation.*
2. **support_distance** (Importance: 0.0020)
   - *Interpretation: Proximity to recent price floors; being close to support creates an asymmetric risk/reward setup that frequently triggers sharp short-term bounces (mean reversion).*
3. **historical_volatility** (Importance: 0.0017)
   - *Interpretation: Baseline price variance; higher natural volatility is mathematically required for a stock to have the range necessary to hit a 2.5% gross move in a single day.*
4. **relative_volume** (Importance: 0.0016)
   - *Interpretation: Trading volume compared to recent averages; elevated volume indicates active institutional participation or catalyst-driven momentum, providing the fuel for a large 1-day move.*
5. **resistance_distance** (Importance: 0.0014)
   - *Interpretation: Proximity to recent price ceilings; price requires "room to run" upward without hitting immediate technical selling pressure to cleanly complete a +2% move.*
6. **momentum** (Importance: 0.0014)
7. **lag_ma_slope_50d_3** (Importance: 0.0013)
8. **roc** (Importance: 0.0013)
9. **obv** (Importance: 0.0013)
10. **lag_support_distance_1** (Importance: 0.0013)

> [!NOTE]
> **Conclusion:** The top features are deeply rooted in established market microstructure and short-term trading logic (momentum carry-over, mean-reversion off support, volatility requirements, and volume confirmation). There are no opaque or confusing features driving this edge, confirming that the statistical robustness we observed is backed by a highly logical economic story.
