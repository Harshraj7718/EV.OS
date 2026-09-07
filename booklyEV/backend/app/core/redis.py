"""Redis client factory.

Reserved for future use: token blacklisting/session revocation, rate
limiting, caching, and background job queues (payments, notifications).
Not used by any endpoint yet.
"""
from functools import lru_cache

import redis

from app.core.config import settings


@lru_cache
def get_redis_client() -> redis.Redis:
    return redis.from_url(settings.REDIS_URL, decode_responses=True)
