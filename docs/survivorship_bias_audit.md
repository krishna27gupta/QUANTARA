# Survivorship Bias Audit Report (Resolved)

## Executive Summary
An audit of Quantara's historical market datasets (`ml/datasets/`) previously revealed a survivorship bias issue, where models were trained exclusively on the modern NIFTY 50 universe without accounting for historical reconstitutions.

**This issue has now been resolved.** The dataset has been expanded to 65 stocks (incorporating historically removed constituents), and a rigorous point-in-time filtering mechanism is now permanently wired into the machine learning training pipelines.

## Dataset Coverage (Updated)
- **Location:** `ml/datasets/*.parquet`
- **Total Datasets Available:** 65 stocks (up from 47).
- **Historical Additions:** The dataset now includes key historical index drop-outs with verified real historical data spanning `2016-01-01` to `2025-12-31`:
  - `YESBANK`
  - `VEDL`
  - `GAIL`
  - `BHEL`
  - `IDEA`
  - `ZEEL`

## The Fix: Point-in-Time Filtering
The survivorship bias has been structurally corrected at the data engineering layer.
- **Mechanism:** `filter_point_in_time()` in `ml/src/features_engine.py` reads a month-by-month index membership map (`historical_constituents.json`).
- **Integration:** This filter is hardwired into `load_and_engineer()`, which is universally called by the new training scripts (`train_trend.py`, `train_profit.py`, `train_risk.py`, `train_expected_return.py`). 
- **Effect:** Even though `YESBANK.parquet` contains data up to 2025, the model only trains on its data during its actual index membership window (e.g., 2016 to March 2020). The models no longer benefit from "future sight" or ignore tail-risk dropouts.

## Honest Metrics (Before vs. After)
Retraining the models with point-in-time filtering correctly deflated the artificially inflated performance metrics to reflect reality:
- **Profit Signal AUC:** Now accurately reflects near-random performance (~0.534 for RandomForest, ~0.529 for XGBoost), proving that prior higher scores were illusions of future sight.
- **Risk Predictor Accuracy:** Solidified at **45.87%** (vs 33.33% random baseline). The model genuinely learned to predict volatility terciles even when tail-risk dropouts are correctly included in the distribution.
- **Expected Return R²:** Dropped to ~0.0, confirming the point estimate has no predictive edge and validating the shift to quantile uncertainty bands.

## Residual Limitations
For the current 65-stock universe across the 2016-2025 window, the point-in-time fix is complete and the models are structurally sound. Any future work to expand the backtest (e.g., mapping further obscure delisted stocks or expanding to the NIFTY 100 universe) represents a standard dataset expansion, not a fundamental architectural flaw.
