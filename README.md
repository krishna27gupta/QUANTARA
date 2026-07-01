# Quantara - AI-Powered Swing Trading Copilot

Quantara is an institutional-grade swing trading copilot built for Indian retail investors, targeting NIFTY 50 securities. The architecture is organized as a production-grade monorepo.

---

## 📂 Repository Structure

```text
quantara/
├── .github/              # CI/CD pipelines (GitHub Actions lint & build checks)
├── ai/                   # AI mentor services (mentor, memory, RAG, tool calling)
├── backend/              # FastAPI Python 3.13 API service
├── database/             # PostgreSQL database schemas
├── docker/               # Docker Compose and Dockerfile specifications
├── docs/                 # System architecture, database, API, and roadmap docs
├── frontend/apps/web/    # Next.js 15 + React 19 web app (Lightweight Charts, Zustand)
└── ml/                   # ML predictors (trend, price, profit, risk, ensemble)
```

For detailed specifications, check out:
* [System Architecture](file:///Users/krishna/.gemini/antigravity/scratch/quantara/docs/architecture.md)
* [Database Schemas](file:///Users/krishna/.gemini/antigravity/scratch/quantara/docs/database.md)
* [API References](file:///Users/krishna/.gemini/antigravity/scratch/quantara/docs/api.md)
* [Project Roadmap](file:///Users/krishna/.gemini/antigravity/scratch/quantara/docs/roadmap.md)

---

## ⚡ Quick Start

### Prerequisites
* **Node.js**: `v20+`
* **Python**: `v3.13`
* **Docker & Docker Compose**

### 🐳 Run via Docker Compose (Recommended)
Launch the entire platform including PostgreSQL and Redis databases:
```bash
docker compose -f docker/docker-compose.yml up --build
```
* **Frontend Dashboard**: [http://localhost:3000](http://localhost:3000)
* **Backend API**: [http://localhost:8000](http://localhost:8000)
* **Health Check**: [http://localhost:8000/healthz](http://localhost:8000/healthz)

---

## 🛠️ Local Development

Ensure you copy `.env.example` to `.env` in the root:
```bash
cp .env.example .env
```

### 1. Frontend Development (Next.js)
```bash
npm install
npm run dev
```

### 2. Backend Development (FastAPI)
```bash
cd backend
poetry install
poetry run uvicorn app.main:app --reload
```
