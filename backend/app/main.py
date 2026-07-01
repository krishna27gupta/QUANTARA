import logging
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd

# Add workspace root so we can import from ml package
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from ml.src import (
    DataPipeline,
    FeatureStore,
    TrendPredictor,
    ProfitPredictor,
    RiskPredictor,
    ExpectedReturnPredictor,
    SentimentEngine,
    EnsembleEngine,
    ExplainabilityEngine,
)

from app.config import settings
from app.database import verify_db_connection, engine
from app.redis import verify_redis_connection, redis_pool

# Configure basic logging formatter
logging.basicConfig(
    level=settings.LOG_LEVEL,
    format="%(asctime)s [%(levelname)s] %(name)s - %(filename)s:%(lineno)d: %(message)s",
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
    """Health check endpoint validating operational readiness of DB and Redis connections."""
    db_ok = await verify_db_connection()
    redis_ok = await verify_redis_connection()
    
    is_healthy = db_ok and redis_ok
    status_code = status.HTTP_200_OK if is_healthy else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return JSONResponse(
        status_code=status_code,
        content={
            "status": "healthy" if is_healthy else "degraded",
            "environment": settings.ENVIRONMENT,
            "services": {
                "database": "connected" if db_ok else "disconnected",
                "cache": "connected" if redis_ok else "disconnected",
            }
        }
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
            "pydantic_settings_validation"
        ]
    }

@v1_router.get("/predict", tags=["ML Predictor"])
async def predict_stock(symbol: str = "RELIANCE"):
    """
    Complete production-grade ML prediction pipeline endpoint.
    Retrieves market context, engineers features, feeds them to boosters/RNNs/Transformers,
    runs ensemble voting, and provides SHAP-based rationales.
    """
    logger.info(f"Received prediction request for symbol: {symbol}")
    
    # 1. Ingestion
    pipeline = DataPipeline()
    ohlcv = pipeline.fetch_ohlcv(symbol, days=60)
    context = pipeline.fetch_market_context()
    
    # 2. Features Calculations
    ohlcv = pipeline.compute_technical_indicators(ohlcv)
    ohlcv = pipeline.compute_volatility_features(ohlcv)
    ohlcv = pipeline.compute_volume_features(ohlcv)
    
    # 3. Feature Store Engineering
    store = FeatureStore()
    engineered = store.engineer_features(ohlcv, context)
    selected = store.select_features(engineered)
    
    # Get latest features vector
    latest_vector = selected[-1] if selected else {}
    
    # 4. ML Models evaluation
    trend_model = TrendPredictor()
    profit_model = ProfitPredictor()
    risk_model = RiskPredictor()
    return_model = ExpectedReturnPredictor()
    sentiment_model = SentimentEngine()
    
    # Run async predictions
    import asyncio
    trend_task = trend_model.predict_trend(latest_vector)
    profit_task = profit_model.predict_profitability(latest_vector)
    risk_task = risk_model.evaluate_risk(latest_vector)
    return_task = return_model.forecast_expected_return(selected)
    
    # Mock text feedback for sentiment NLP
    news_feed = [
        f"Shares of {symbol} show breakout potential after closing above moving averages.",
        f"Brokers report active institutional blocks trade accumulation in {symbol}.",
        f"Market regime remains supportive for Indian swing setups."
    ]
    sentiment_task = sentiment_model.analyze_sentiment(news_feed)
    
    # Gather results
    trend_res, profit_res, risk_res, return_res, sentiment_res = await asyncio.gather(
        trend_task, profit_task, risk_task, return_task, sentiment_task
    )
    
    # 5. Ensemble Engine Voting
    ensemble = EnsembleEngine()
    ensemble_res = await ensemble.aggregate_predictions(
        trend_res, profit_res, risk_res, return_res, sentiment_res
    )
    
    # 6. Explainability and SHAP reasons
    explainer = ExplainabilityEngine()
    rationales = explainer.generate_rationales(latest_vector, ensemble_res["signal"])
    
    # Return formatted schema
    return {
        "signal": ensemble_res["signal"],
        "confidence": ensemble_res["confidence"],
        "profit_probability": ensemble_res["profit_probability"],
        "expected_return": ensemble_res["expected_return"],
        "risk": ensemble_res["risk"],
        "quantara_score": ensemble_res["quantara_score"],
        "explanation": rationales
    }

# Paper Trading Endpoints (Step 12)
paper_trading_router = APIRouter(prefix="/api/paper-trading", tags=["Paper Trading"])

@paper_trading_router.get("/dashboard")
async def get_dashboard_summary():
    """Return latest portfolio summary, active picks, open holdings, and performance metrics."""
    pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading"))
    
    # Defaults
    metrics = {
        "win_rate": 0.0, "sharpe_ratio": 0.0, "sortino_ratio": 0.0, "profit_factor": 0.0,
        "max_drawdown": 0.0, "total_return": 0.0, "num_trades": 0, "open_trades": 0, "closed_trades": 0
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
        try:
            open_pos = pd.read_csv(open_path).to_dict(orient="records")
        except Exception:
            pass
            
    if os.path.exists(closed_path) and os.path.getsize(closed_path) > 10:
        try:
            closed_trades = pd.read_csv(closed_path).tail(10).to_dict(orient="records")
        except Exception:
            pass
            
    return {
        "metrics": metrics,
        "open_positions": open_pos,
        "recent_closed_trades": closed_trades
    }

@paper_trading_router.get("/open-positions")
async def get_open_positions():
    """List currently active open trading positions."""
    pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading"))
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
    pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading"))
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
    pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading"))
    metrics_path = os.path.join(pt_dir, "performance_metrics.csv")
    if os.path.exists(metrics_path) and os.path.getsize(metrics_path) > 10:
        try:
            return pd.read_csv(metrics_path).to_dict(orient="records")
        except Exception:
            return []
    return []

@paper_trading_router.get("/equity-curve")
async def get_equity_curve_history():
    """Return daily ledger profiles tracking portfolio value growth and drawdown values."""
    pt_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "paper_trading"))
    equity_path = os.path.join(pt_dir, "equity_curve.csv")
    if os.path.exists(equity_path) and os.path.getsize(equity_path) > 10:
        try:
            return pd.read_csv(equity_path).to_dict(orient="records")
        except Exception:
            return []
    return []

app.include_router(paper_trading_router)
app.include_router(v1_router)
