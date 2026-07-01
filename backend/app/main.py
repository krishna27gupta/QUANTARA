import logging
import os
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

app.include_router(v1_router)
