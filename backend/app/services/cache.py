import json
import logging
from typing import Any
import redis.asyncio as aioredis
from app.redis import get_redis

logger = logging.getLogger("quantara-cache")

class CacheService:
    def __init__(self):
        # Operational namespaces following 2026 industry best practices
        self.session_prefix = "session:"
        self.prediction_prefix = "prediction:"
        self.market_prefix = "market:"
        self.ai_prefix = "ai:"

    async def set_value(self, prefix: str, key: str, value: Any, expire_seconds: int | None = None) -> bool:
        """Asynchronously cache serialized values under prefixed key hashes."""
        try:
            client = await get_redis()
            full_key = f"{prefix}{key}"
            serialized = json.dumps(value)
            await client.set(full_key, serialized, ex=expire_seconds)
            await client.close()
            return True
        except Exception as e:
            logger.error(f"Redis cache write error [key={prefix}{key}]: {e}")
            return False

    async def get_value(self, prefix: str, key: str) -> Any | None:
        """Asynchronously retrieve deserialized values from the cache pools."""
        try:
            client = await get_redis()
            full_key = f"{prefix}{key}"
            data = await client.get(full_key)
            await client.close()
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.error(f"Redis cache read error [key={prefix}{key}]: {e}")
            return None

    async def delete_key(self, prefix: str, key: str) -> bool:
        """Asynchronously delete keys from redis cache pools."""
        try:
            client = await get_redis()
            full_key = f"{prefix}{key}"
            await client.delete(full_key)
            await client.close()
            return True
        except Exception as e:
            logger.error(f"Redis cache deletion error [key={prefix}{key}]: {e}")
            return False

    # Specific Wrapper utilities
    async def get_session(self, session_id: str) -> dict[str, Any] | None:
        return await self.get_value(self.session_prefix, session_id)

    async def set_session(self, session_id: str, data: dict[str, Any], expire: int = 3600) -> bool:
        return await self.set_value(self.session_prefix, session_id, data, expire)

    async def get_market_data(self, ticker: str) -> dict[str, Any] | None:
        return await self.get_value(self.market_prefix, ticker)

    async def set_market_data(self, ticker: str, data: dict[str, Any], expire: int = 60) -> bool:
        return await self.set_value(self.market_prefix, ticker, data, expire)

    async def get_prediction(self, ticker: str) -> dict[str, Any] | None:
        return await self.get_value(self.prediction_prefix, ticker)

    async def set_prediction(self, ticker: str, data: dict[str, Any], expire: int = 1800) -> bool:
        return await self.set_value(self.prediction_prefix, ticker, data, expire)

    async def get_ai_memory(self, user_id: str) -> dict[str, Any] | None:
        return await self.get_value(self.ai_prefix, user_id)

    async def set_ai_memory(self, user_id: str, data: dict[str, Any], expire: int = 7200) -> bool:
        return await self.set_value(self.ai_prefix, user_id, data, expire)

cache_service = CacheService()
