# Development Roadmap

This document outlines the milestones for transitioning **Quantara** from its foundation to a production-grade swing trading copilot for Indian retail investors.

---

## Phase 1: Production Foundation (Completed)
* [x] Restructured monorepo workspaces using Turborepo.
* [x] Scaffolded Next.js 15, React 19, Tailwind CSS v4, Zustand, and TanStack Query.
* [x] Integrated TradingView Lightweight Charts on `/home` route.
* [x] Added mock authorization context and Protected Route checks.
* [x] Defined PostgreSQL schemas for all 12 operational entities.
* [x] Created Redis caching helper services separating prefixes for sessions, predictions, market rates, and AI memories.
* [x] Established interface schemas for ML model predictors (trend, price, profit, risk, ensemble).
* [x] Established interface schemas for AI assistant mentors (mentor, memory, RAG, tool caller).
* [x] Configured Docker Compose and GitHub Actions checks.

## Phase 2: NIFTY 50 Data Ingestion & Auth (Planned)
* [ ] Integrate Plaid/Broker API or mock feeds for NSE (National Stock Exchange of India) stocks.
* [ ] Build auth workflows (JWT) to secure user endpoints.
* [ ] Set up user registration and profile preferences mapping.
* [ ] Stream real-time price tickers to Redis cache memory spaces.

## Phase 3: ML Prediction Pipelines (Planned)
* [ ] Connect the `ml/` predictors to historical stock data.
* [ ] Train model ensembles estimating target prices and risk factors.
* [ ] Populate `predictions` and `recommendations` tables dynamically.
* [ ] Draw forecasting trends inside `/analyze` frontend route.

## Phase 4: AI Trading Mentor (Planned)
* [ ] Connect `ai/` mentor interfaces to LLM models.
* [ ] Implement RAG queries searching financial disclosures and trading rule documents.
* [ ] Enable chat support on `/ask` where the AI references portfolio assets.

## Phase 5: Production & Hosting (Planned)
* [ ] Write Terraform profiles to deploy in AWS ECS / RDS.
* [ ] Set up CD deployment workflows pushing Docker builds to Amazon ECR.
* [ ] Build monitoring panels validating database pools and Redis locks.
