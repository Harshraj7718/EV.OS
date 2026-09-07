"""Unversioned health check endpoint, used by Docker/orchestrator probes."""
from fastapi import APIRouter

from app.core.config import settings

router = APIRouter(tags=["health"])


@router.get("/health")
def health_check() -> dict:
    return {"status": "ok", "service": settings.APP_NAME}
