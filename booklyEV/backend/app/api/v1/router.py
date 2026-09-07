"""Aggregator for versioned (`/api/v1/...`) domain routers.

Empty today. As each module in `app/modules/*` is implemented, its
router gets included here, e.g.:

    from app.modules.users.router import router as users_router
    api_router.include_router(users_router, prefix="/users", tags=["users"])
"""
from fastapi import APIRouter

api_router = APIRouter()
