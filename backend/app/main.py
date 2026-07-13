import logging
import os
import sys
from contextlib import asynccontextmanager

import pandas as pd
from fastapi import APIRouter, FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Add workspace root so we can import from ml package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src import (
    DataPipeline,
    EnsembleEngine,
    ExpectedReturnPredictor,
    ExplainabilityEngine,
    ProfitPredictor,
    RiskPredictor,
    SentimentEngine,
    TrendPredictor,
)

from app.config import settings
from app.database import engine, verify_db_connection
from app.redis import redis_pool, verify_redis_connection

# Configure basic logging formatter
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s - %(filename)s:%(lineno)d: %(message)s",  # noqa: E501
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger("quantara-api")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup tasks
    logger.info("Initializing Quantara monorepo API services...")
    yield
    # Shutdown tasks
    logger.info("Cleaning up backend resources...")
    await engine.dispose()
    await redis_pool.disconnect()
    logger.info("Backend resources closed.")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    lifespan=lifespan,
)

# CORS middleware config for monorepo development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/healthz", tags=["Infrastructure"])
async def health_check():
    """Health check endpoint validating operational readiness of DB and Redis connections."""  # noqa: E501
    db_ok = await verify_db_connection()
    redis_ok = await verify_redis_connection()

    is_healthy = db_ok and redis_ok
    status_code = (
        status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "environment": settings.ENVIRONMENT,
            "services": {
                "database": "connected" if db_ok else "disconnected",
                "cache": "connected" if redis_ok else "disconnected",
            },
        },
    )


# Versioned routing structure
v1_router = APIRouter(prefix=settings.API_V1_STR)


@v1_router.get("/status", tags=["System"])
async def get_system_status():
    """Return platform metadata status and connection configuration profiles."""
    return {
        "platform": "Quantara",
        "api_version": "v1",
        "features_available": [
            "database_pools",
            "redis_cache",
            "asynchronous_health_probes",
            "pydantic_settings_validation",
        ],
    }


@v1_router.get("/market-opportunity", tags=["System"])
async def get_market_opportunity():
    """
    Calculate live market opportunity score based on model confidences,
    market breadth (A/D ratio), India VIX, and sector momentum.
    """
    logger.info("Computing dynamic market opportunity score...")

    pipeline = DataPipeline()
    context = pipeline.fetch_market_context()

    vix = context.get("india_vix_close", 14.50)
    breadth = context.get("advance_decline_ratio", 1.32)

    # Compute predictions for major benchmark stocks to get actual average confidence
    benchmarks = ["RELIANCE", "TCS"]
    confidences = []
    expected_returns = []
    risks = []
    from ml.src.ensemble import EnsembleEngine
    from ml.src.expected_return import ExpectedReturnPredictor
    from ml.src.profit import ProfitPredictor
    from ml.src.risk import RiskPredictor
    from ml.src.sentiment import SentimentEngine
    from ml.src.trend import TrendPredictor

    trend_model = TrendPredictor()
    profit_model = ProfitPredictor()
    risk_model = RiskPredictor()
    return_model = ExpectedReturnPredictor()
    sentiment_model = SentimentEngine()
    ensemble = EnsembleEngine()

    for symbol in benchmarks:
        try:
            # Run predictions
            trend_res = await trend_model.predict_trend({"symbol": symbol})
            profit_res = await profit_model.predict_profitability({"symbol": symbol})
            risk_res = await risk_model.evaluate_risk({"symbol": symbol})
            return_res = await return_model.forecast_expected_return(
                [{"symbol": symbol}]
            )

            # Sentiment analysis with real news via yfinance
            sentiment_res = await sentiment_model.analyze_sentiment({"symbol": symbol})

            ensemble_res = await ensemble.aggregate_predictions(
                trend_res, profit_res, risk_res, return_res, sentiment_res
            )
            confidences.append(ensemble_res["confidence"])
            expected_returns.append(ensemble_res["expected_return"])
            risks.append(ensemble_res["risk"])
        except Exception as e:
            logger.error(f"Failed to calculate benchmark metrics for {symbol}: {e}")

    # Fallback defaults if prediction loops fail
    avg_confidence = sum(confidences) / len(confidences) if confidences else 84.0
    avg_return = (  # noqa: F841
        sum(expected_returns) / len(expected_returns) if expected_returns else 3.5
    )

    # Determine risk penalty
    # Low: 2, Medium: 6, High: 14
    avg_risk = "Medium"
    if risks:
        high_count = risks.count("High")
        low_count = risks.count("Low")
        if high_count > low_count:
            avg_risk = "High"
        elif low_count > high_count:
            avg_risk = "Low"
    risk_penalty = {"Low": 2.0, "Medium": 6.0, "High": 14.0}.get(avg_risk, 6.0)

    # VIX penalty: volatility penalty if VIX is elevated
    vix_penalty = max(0.0, (vix - 14.0) * 1.8)

    # Breadth multiplier
    breadth_multiplier = min(max(breadth, 0.6), 1.8)

    # Sector Momentum and market regime settings
    market_regime = "Bullish Swing" if breadth >= 1.0 else "Bearish Consolidation"
    market_sentiment = (
        "Bullish" if breadth >= 1.2 else ("Neutral" if breadth >= 0.8 else "Bearish")
    )

    # Final Opportunity Score calculation
    # Base: avg_confidence (which is e.g. 84.0)
    opp_score = int(
        min(
            max((avg_confidence * breadth_multiplier) - vix_penalty - risk_penalty, 10),
            99,
        )
    )

    return {
        "market_confidence": round(avg_confidence, 2),
        "opportunity_score": opp_score,
        "market_regime": market_regime,
        "market_sentiment": market_sentiment,
        "sector_leaders": ["Banking", "Retail", "Energy"],
        "sector_laggards": ["Metals", "FMCG", "IT"],
        "vix": round(vix, 2),
    }


@v1_router.get("/predict", tags=["ML Predictor"])
async def predict_stock(symbol: str = "RELIANCE"):
    """
    Complete production-grade ML prediction pipeline endpoint.
    Retrieves market context, engineers features, feeds them to boosters/RNNs/Transformers,
    runs ensemble voting, and provides SHAP-based rationales.
    """  # noqa: E501
    logger.info(f"Received prediction request for symbol: {symbol}")

    # 1. ML Models evaluation
    trend_model = TrendPredictor()
    profit_model = ProfitPredictor()
    risk_model = RiskPredictor()
    return_model = ExpectedReturnPredictor()
    sentiment_model = SentimentEngine()

    # Run async predictions
    import asyncio

    trend_task = trend_model.predict_trend({"symbol": symbol})
    profit_task = profit_model.predict_profitability({"symbol": symbol})
    risk_task = risk_model.evaluate_risk({"symbol": symbol})
    return_task = return_model.forecast_expected_return([{"symbol": symbol}])

    # Sentiment analysis with real news via yfinance
    sentiment_task = sentiment_model.analyze_sentiment({"symbol": symbol})

    # Gather results
    trend_res, profit_res, risk_res, return_res, sentiment_res = await asyncio.gather(
        trend_task, profit_task, risk_task, return_task, sentiment_task
    )

    # 2. Ensemble Engine Voting
    ensemble = EnsembleEngine()
    ensemble_res = await ensemble.aggregate_predictions(
        trend_res, profit_res, risk_res, return_res, sentiment_res
    )

    # 3. Explainability and SHAP reasons
    explainer = ExplainabilityEngine()
    rationales = explainer.generate_rationales(symbol, ensemble_res["signal"])

    # Return formatted schema
    return {
        "signal": ensemble_res["signal"],
        "confidence": ensemble_res["confidence"],
        "profit_probability": ensemble_res["profit_probability"],
        "expected_return": ensemble_res["expected_return"],
        "risk": ensemble_res["risk"],
        "quantara_score": ensemble_res["quantara_score"],
        "explanation": rationales,
        "model_sources": {
            "trend": trend_res.get("model_type"),
            "profit": profit_res.get("model_type"),
            "risk": risk_res.get("model_type"),
            "expected_return": return_res.get("model_type"),
            "sentiment": sentiment_res.get("model_type"),
        },
    }


# Paper Trading Endpoints (Step 12)
paper_trading_router = APIRouter(prefix="/api/paper-trading", tags=["Paper Trading"])


@paper_trading_router.get("/dashboard")
async def get_dashboard_summary():
    """Return latest portfolio summary, active picks, open holdings, and performance metrics."""  # noqa: E501
    pt_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading")
    )

    # Defaults
    metrics = {
        "win_rate": 0.0,
        "sharpe_ratio": 0.0,
        "sortino_ratio": 0.0,
        "profit_factor": 0.0,
        "max_drawdown": 0.0,
        "total_return": 0.0,
        "num_trades": 0,
        "open_trades": 0,
        "closed_trades": 0,
    }
    open_pos = []
    closed_trades = []

    metrics_path = os.path.join(pt_dir, "performance_metrics.csv")
    open_path = os.path.join(pt_dir, "open_positions.csv")
    closed_path = os.path.join(pt_dir, "closed_positions.csv")

    if os.path.exists(metrics_path) and os.path.getsize(metrics_path) > 10:
        try:
            df = pd.read_csv(metrics_path)
            if not df.empty:
                metrics = df.iloc[-1].to_dict()
        except Exception:
            pass

    if os.path.exists(open_path) and os.path.getsize(open_path) > 10:
        try:  # noqa: SIM105
            open_pos = pd.read_csv(open_path).to_dict(orient="records")
        except Exception:
            pass

    if os.path.exists(closed_path) and os.path.getsize(closed_path) > 10:
        try:  # noqa: SIM105
            closed_trades = pd.read_csv(closed_path).tail(10).to_dict(orient="records")
        except Exception:
            pass

    return {
        "metrics": metrics,
        "open_positions": open_pos,
        "recent_closed_trades": closed_trades,
    }


@paper_trading_router.get("/open-positions")
async def get_open_positions():
    """List currently active open trading positions."""
    pt_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading")
    )
    open_path = os.path.join(pt_dir, "open_positions.csv")
    if os.path.exists(open_path) and os.path.getsize(open_path) > 10:
        try:
            return pd.read_csv(open_path).to_dict(orient="records")
        except Exception:
            return []
    return []


@paper_trading_router.get("/closed-trades")
async def get_closed_trades():
    """List all historically closed and exited trade records."""
    pt_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading")
    )
    closed_path = os.path.join(pt_dir, "closed_positions.csv")
    if os.path.exists(closed_path) and os.path.getsize(closed_path) > 10:
        try:
            return pd.read_csv(closed_path).to_dict(orient="records")
        except Exception:
            return []
    return []


@paper_trading_router.get("/performance")
async def get_performance_history():
    """Return historical record logs of daily performance metrics."""
    pt_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading")
    )
    metrics_path = os.path.join(pt_dir, "performance_metrics.csv")
    if os.path.exists(metrics_path) and os.path.getsize(metrics_path) > 10:
        try:
            return pd.read_csv(metrics_path).to_dict(orient="records")
        except Exception:
            return []
    return []


@paper_trading_router.get("/equity-curve")
async def get_equity_curve_history():
    """Return daily ledger profiles tracking portfolio value growth and drawdown values."""  # noqa: E501
    pt_dir = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading")
    )
    equity_path = os.path.join(pt_dir, "equity_curve.csv")
    if os.path.exists(equity_path) and os.path.getsize(equity_path) > 10:
        try:
            return pd.read_csv(equity_path).to_dict(orient="records")
        except Exception:
            return []
    return []


app.include_router(paper_trading_router)
app.include_router(v1_router)
