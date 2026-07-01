import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, status, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

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

app.include_router(v1_router)
