# Label Variants Robustness Check

This report evaluates the top two label variants from our original label experiments against strict stress-tests: cross-fold stability, per-ticker concentration, economic reality, and a true out-of-sample holdout.

## Baseline (5-day, +4%/-2%)

### 1. Base Rate net of Transaction Costs
The `compute_dynamic_touch_label` incorporates 0.25%-per-side (0.5% round-trip) transaction costs into the target levels. After costs, this variant achieves a base win rate of **33.8%**.

### 2. Per-Fold Stability
Walk-forward CV AUCs by fold:
- Fold 1: 0.5191
- Fold 2: 0.4976
- Fold 3: 0.5304
- Fold 4: 0.5082
- Fold 5: 0.5333

### 3. Concentration Check
When evaluating the pooled CV predictions by individual ticker, **76.4%** of tickers had an AUC > 0.5. The median ticker AUC was **0.5147**.

### 4. True Holdout Check (Jul 2025 - Dec 2025)
Evaluated on a completely unseen 6-month holdout (Jul 2025 - Dec 2025) strictly held out from all CV tuning, the variant achieved an AUC of **0.5007** with a 95% CI of `[0.4761, 0.5233]`. This **DOES NOT exclude 0.5** (p-value = 0.4590).

## 1-Day Hold (+2%/-2%)

### 1. Base Rate net of Transaction Costs
The `compute_dynamic_touch_label` incorporates 0.25%-per-side (0.5% round-trip) transaction costs into the target levels. After costs, this variant achieves a base win rate of **34.4%**.

### 2. Per-Fold Stability
Walk-forward CV AUCs by fold:
- Fold 1: 0.5180
- Fold 2: 0.5116
- Fold 3: 0.5154
- Fold 4: 0.5244
- Fold 5: 0.5269

### 3. Concentration Check
When evaluating the pooled CV predictions by individual ticker, **81.8%** of tickers had an AUC > 0.5. The median ticker AUC was **0.5128**.

### 4. True Holdout Check (Jul 2025 - Dec 2025)
Evaluated on a completely unseen 6-month holdout (Jul 2025 - Dec 2025) strictly held out from all CV tuning, the variant achieved an AUC of **0.5287** with a 95% CI of `[0.5149, 0.5425]`. This **excludes 0.5** (p-value = 0.0000).

