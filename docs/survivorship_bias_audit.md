# Survivorship Bias Audit Report

## Executive Summary
An audit of Quantara's historical market datasets (`ml/datasets/`) reveals that the current backtesting framework suffers from **Critical Survivorship Bias**. The historical dataset consists solely of the 47 companies that currently make up the NIFTY 50 universe (with recent entries like JIOFIN, BEL, and TRENT). However, the datasets span a 10-year historical window from 2016-01-01 to 2025-12-31. Over this period, the NIFTY 50 index underwent numerous reconstitutions, but all the companies that failed, went bankrupt, or severely underperformed and were dropped from the index have been entirely excluded from the training data.

> **WARNING**
> Current historical datasets contain survivorship bias because they represent the modern NIFTY 50 universe rather than the historical point-in-time universe.

## Current Dataset Coverage
- **Location:** `ml/datasets/*.parquet`
- **Total Datasets Available:** 47 stocks.
- **Current NIFTY 50 Coverage:** Covers the modern NIFTY 50 constituents as of the mid-2024 to 2025 period.
- **Historical Date Ranges:** Most files span a static 10-year period from `2016-01-01` to `2025-12-31` (or latest available).
- **Anomalies:** Stocks like Jio Financial Services (`JIOFIN`) only have data starting from `2023-08-21` (its listing date), meaning the model is trained on partial timelines for newer index additions, while ignoring entirely the stocks they replaced.

## Historical Constituent Differences
The NIFTY 50 undergoes semi-annual reconstitution (typically in March and September). Between 2016 and 2025, there have been dozens of changes reflecting shifts in market leadership.
- **Recently Added (Included in dataset):** BEL, Trent, InterGlobe Aviation, Max Healthcare, Jio Financial Services, Adani Enterprises, Apollo Hospitals, Tata Consumer.
- **Historically Removed (Missing from dataset):** Divi's Lab (partially replaced historically but currently missing or swapped), LTIMindtree, Hero MotoCorp, IndusInd Bank (dropped in late 2025), Yes Bank, Zee Entertainment, Vedanta, GAIL, Idea Cellular, BHEL, ACC, Ambuja Cements, Aurobindo Pharma.

## Missing Stocks
There are approximately **25 to 35 missing historical constituents** required to make the dataset point-in-time accurate from 2016 to 2025. Without fetching the data for these historical "losers," the dataset remains fundamentally flawed.

## Potential Impact
- **Why this affects backtesting:** By only training and backtesting on stocks that *survived* to remain in the NIFTY 50 today, the models have the benefit of "future sight." They never encounter companies that went bankrupt or entered terminal decline.
- **Affected Models:** Expected Return, Risk Predictor, Profitability Predictor, Trend Predictor, and the Ensemble Engine.
- **Inflated/Deflated Metrics:**
  - **Expected Return:** Artificially inflated. Every "dip" in the current dataset is a buying opportunity because every stock included eventually recovered and thrived.
  - **Risk Assessment:** Artificially deflated. Tail risks and total-loss scenarios (like Yes Bank or DHFL) are completely absent from the training distribution.
- **Forward Validation:** Forward validation (paper trading or live trading) will severely underperform backtested results. The live model will be forced to predict on a live universe without the guarantee of survival, a scenario it was never trained to handle.

## Severity Classification
**Severity: Critical**
*Justification:* Survivorship bias is the most fatal flaw in quantitative finance. It renders historical performance metrics mathematically invalid. Any alpha generated in the backtest is highly likely to be a mirage created by selecting a universe of known winners. Models deployed to production trained on this dataset will fail to manage real-world tail risks.

## Recommended Solution
1. **Implement a Point-in-Time Database:** Source the exact NIFTY 50 constituent list for every trading day (or every semi-annual reconstitution) from 2016 to 2025.
2. **Fetch Missing Data:** Download the OHLCV history for all ~80 stocks that were ever part of the index during this period.
3. **Dynamic Filtering:** Update `features_engine.py` and the training scripts to apply an active constituent mask. On any given date $t$, the models should only be trained and evaluated on the 50 stocks that were actually in the index on date $t$.
4. **Is it required before production?** **YES.** Fixing this is absolutely mandatory before committing any real capital to the strategies or trusting the reported backtest metrics.
