import redis.asyncio as aioredis

from app.config import settings

# Initialize Redis connection pool
redis_pool = aioredis.ConnectionPool.from_url(
    settings.REDIS_URL,
    decode_responses=True,
    max_connections=20,
)


async def get_redis() -> aioredis.Redis:
    """Dependency injector for asynchronous Redis client sessions."""
    return aioredis.Redis(connection_pool=redis_pool)


async def verify_redis_connection() -> bool:
    """Utility to test Redis connectivity on health check calls."""
    try:
        client = await get_redis()
        response = await client.ping()
        await client.close()
        return response is True
    except Exception:
        return False
