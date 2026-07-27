# Quantara — Product Vision & Development Roadmap

> **This document is the canonical product-positioning reference.**
> Every phase of development MUST be checked against the principles and model metrics stated here,
> and the PR description for each phase MUST explicitly cite this document.

---

## Mission Statement

**Quantara is an AI-assisted market analysis guide that helps a user build their own informed judgment about a NIFTY 50 stock.**

Quantara does **not** predict profitable trades. It does **not** issue buy/sell recommendations. It presents quantitative evidence, historical context, and explicitly calibrated uncertainty so that the user — not the system — makes the final decision.

This distinction is not a disclaimer: it is a design constraint that governs every screen, every API response, every model output label, and every AI message.

---

## What Quantara Does and Does Not Do

| ✅ Quantara Does | ❌ Quantara Does Not Do |
|---|---|
| Show a volatility risk band (Low / Medium / High) with calibrated confidence | Predict whether a stock will go up or down |
| Display historical base rates so users can evaluate signal strength | Issue "Buy", "Sell", or "Hold" recommendations |
| Surface evidence: RSI, MACD, ATR, VIX, sector relative strength | Promise or imply profitable outcomes |
| Show the model's track record alongside each signal | Auto-execute or suggest position sizing |
| Provide an AI mentor that explains concepts and asks the user to reason | Give the user a conclusion to act on without showing the evidence |

---

## Validated Model Registry (Source of Truth)

The numbers in this section are read directly from the model metadata files in `models/`.
**Do not paraphrase, round, or inflate these numbers anywhere in the product.**

### ✅ Feature 1 — Risk / Volatility Classifier (Headline, Validated Feature)

**Source file:** [`models/risk_feature_metadata.json`](../models/risk_feature_metadata.json)

| Metric | Value |
|---|---|
| Label definition | Terciles of realized annualized volatility over next 5 trading days |
| Classes | Low (≤ 17.98%), Medium (17.98%–28.57%), High (> 28.57%) |
| Test Accuracy | **45.69%** |
| Random Baseline (3-class uniform) | **33.33%** |
| Lift over random | **+12.4 percentage points** |
| Macro F1 | 0.4174 |
| Low-volatility class F1 | 0.589 (n = 10,807) |
| Medium-volatility class F1 | 0.294 (n = 7,910) |
| High-volatility class F1 | 0.369 (n = 5,027) |
| Total test samples | 23,744 |

**Presentation rule:** The risk band (Low / Medium / High) is the **only** model output that is permitted to be shown with prominence. It must always be accompanied by the accuracy figure (45.69%) and the random baseline (33.33%) so the user can evaluate how much weight to give it. The model is better than chance; it is not infallible.

---

### ⚠️ Feature 2 — Trend / Profit Signal (Weak Evidence, Shown With Honest Uncertainty)

**Source file:** [`models/profit_feature_metadata.json`](../models/profit_feature_metadata.json) and [`models/feature_metadata.json`](../models/feature_metadata.json)

| Metric | Value | Interpretation |
|---|---|---|
| Profit signal AUC (RandomForest) | **0.5143** | Near-random (0.50 = random) |
| Profit signal AUC (XGBoost) | **0.5141** | Near-random |
| Trend direction AUC (XGBoost) | **0.5473** | Marginally above random |
| Trend direction AUC (LightGBM) | **0.5458** | Marginally above random |
| Profit label | 1 if +4% touched before −2% within 5 days | Historical win rate: 33.8% |
| Return model R² | −0.0068 | No predictive value for exact return |
| Return model (actuals within 10–90 band) | 82.85% | Interval is informative; point estimate is not |

**Presentation rule:** The trend/profit signal **must never** be shown as a verdict ("Strong Buy", "Likely Profitable"). It is presented as a weak probabilistic clue alongside the historical base rate (33.8% base win rate) and the AUC. The UI label should read something like *"Weak bullish lean — this signal is near-random (AUC 0.514)"* rather than "Bullish Signal Detected."

---

### Survivorship Bias Resolution

See [`docs/survivorship_bias_audit.md`](survivorship_bias_audit.md) for the full audit.

> **Status: Resolved.** The training dataset now comprises 65 stocks, including key historically removed constituents. A point-in-time filter correctly truncates history during training, ensuring tail-risk events are included. Any future work to map additional obscure delisted stocks or expand to the NIFTY 100 represents a standard dataset expansion, not a fundamental flaw.

---

## UI / UX Principle: Evidence, Not Verdicts

Every user-facing screen in Quantara must follow this principle:

1. **Show the evidence first.** Raw indicators (RSI, MACD Histogram, ATR percentile, VIX level, sector relative strength) are displayed before any model output.
2. **Show the model output second, labeled with its uncertainty.** Risk band with accuracy ± confidence. Profit signal with AUC and base rate.
3. **Show historical context third.** How often has this setup appeared in the past? What did the stock do on those occasions?
4. **Never show a verdict.** There is no "Recommendation" field, no "Confidence Score" presented as a call to action, no green "BUY" button, no red "SELL" button.
5. **The AI mentor asks, it does not tell.** The AI mentor should probe the user's reasoning ("What does the RSI reading tell you about momentum here?"), not provide a conclusion.

This principle applies to every route:
- `/home` — market overview: shows regime evidence, not a regime verdict
- `/analyze` — stock analysis: shows indicator grid + risk band with calibrated uncertainty
- `/ask` — AI mentor: Socratic, evidence-surfacing dialogue, not recommendation delivery

---

## Development Phases

> **PR instructions:** The PR description for every phase below MUST include the line:
> *"This phase was reviewed against `docs/roadmap.md` (Product Vision & Development Roadmap)."*

---

### Phase 1: Production Foundation ✅ Completed

- [x] Restructured monorepo workspaces using Turborepo.
- [x] Scaffolded Next.js 15, React 19, Tailwind CSS v4, Zustand, and TanStack Query.
- [x] Integrated TradingView Lightweight Charts on `/home` route.
- [x] Added mock authorization context and Protected Route checks.
- [x] Defined PostgreSQL schemas for all 12 operational entities.
- [x] Created Redis caching helper services separating prefixes for sessions, predictions, market rates, and AI memories.
- [x] Established interface schemas for ML model predictors (trend, price, profit, risk, ensemble).
- [x] Established interface schemas for AI assistant mentors (mentor, memory, RAG, tool caller).
- [x] Configured Docker Compose and GitHub Actions checks.

---

### Phase 2: NIFTY 50 Data Ingestion & Auth 🔲 Planned

> **Scope check against roadmap:** Data feeds must ingest raw OHLCV + indicators only. No "prediction" or "signal" columns should be pre-computed in the data layer; those live in the ML pipeline.

- [ ] Integrate broker API or mock feeds for NSE (National Stock Exchange of India) stocks.
- [ ] Build auth workflows (JWT) to secure user endpoints.
- [ ] Set up user registration and profile preferences mapping.
- [ ] Stream real-time price tickers to Redis cache memory spaces.
- [x] **[Survivorship bias fix]** Sourced point-in-time NIFTY 50 constituent history and corrected the dataset bias (see `docs/survivorship_bias_audit.md`).

---

### Phase 3: ML Evidence Pipelines ✅ Completed

> **Scope check against roadmap:** Model outputs surface evidence and bands, not buy/sell signals. Labels and confidence scores are always accompanied by the metrics from the Validated Model Registry above.

- [x] Connect the `ml/` predictors to live and historical stock data.
- [x] Serve the **risk/volatility classifier** (45.69% acc vs. 33.33% random) as the primary evidence layer on `/api/v1/predict`.
- [x] Serve the **trend/profit signal** as a secondary, explicitly weak-evidence indicator with AUC (≈ 0.514) displayed in-line.
- [x] Display the **return quantile band** (10th–90th percentile interval; do not display point estimate given R² = −0.0068).
- [x] Populate the `/api/v1/predict` endpoint with structured model outputs and their metadata (accuracy, AUC, base rate) — never just a bare signal.
- [ ] Draw evidence panels (not forecasting charts) inside `/analyze` (UI).

---

### Phase 4: AI Analysis Mentor 🔲 Planned

> **Scope check against roadmap:** The AI mentor is Socratic. It surfaces evidence and asks questions. It does not issue recommendations.

- [ ] Connect `ai/` mentor interfaces to LLM models.
- [ ] Implement RAG queries searching financial disclosures and trading rule documents.
- [ ] Enable chat support on `/ask` where the AI surfaces technical evidence and asks the user to reason through it.
- [ ] **System prompt constraint (non-negotiable):** The AI mentor's system prompt must include an explicit prohibition against issuing buy/sell recommendations or expressing confidence in trade outcomes. It must reference the model metrics from this document.
- [ ] Implement guard rails: any AI response containing "buy", "sell", "recommend", or "will go up/down" must trigger a rewrite or a disclaimer injection.

---

### Phase 5: Production & Hosting 🔲 Planned

> **Scope check against roadmap:** Production readiness includes honesty infrastructure — the risk/model accuracy figures from this document must be surfaced on a public `/about/models` page before launch.

- [ ] Write Terraform profiles to deploy in AWS ECS / RDS.
- [ ] Set up CD deployment workflows pushing Docker builds to Amazon ECR.
- [ ] Build monitoring panels validating database pools and Redis locks.
- [ ] **[Accuracy monitoring]** Add a model performance monitoring job that recomputes accuracy/AUC on rolling out-of-sample windows and alerts if metrics degrade below the baselines documented here.
- [ ] **[Disclosure page]** Publish a `/about/models` page that reproduces the Validated Model Registry table from this document, visible to all users before they interact with any model output.

---

## Glossary of Terms (For Consistent Usage Across All Documents)

| Term | Correct Usage | Prohibited Alternatives |
|---|---|---|
| **Risk band** | "The model estimates Low / Medium / High volatility risk" | "Risk prediction", "Risk forecast", "Risk signal" |
| **Trend lean** | "The model shows a weak bullish lean (AUC 0.514)" | "Bullish signal", "Buy signal", "Strong uptrend confirmed" |
| **Evidence** | "Here is the evidence: RSI 54, ATR at 62nd percentile…" | "The analysis shows you should…", "The system recommends…" |
| **Historical context** | "In similar setups over the past 5 years, the stock rose 58% of the time" | "Based on history, the stock will rise" |
| **Model accuracy** | "The risk model is correct 45.69% of the time vs. 33.33% random" | "The model is accurate", "High confidence" |
