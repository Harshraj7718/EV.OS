"""FastAPI application factory and entrypoint."""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.health import router as health_router
from app.api.v1.router import api_router as api_v1_router
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.core.logging import configure_logging, logger
from app.modules.admin.router import router as admin_router
from app.modules.auth.router import router as auth_router
from app.modules.businesses.router import router as business_router
from app.modules.investors.router import router as investor_router
from app.modules.riders.router import router as rider_router


@asynccontextmanager
async def lifespan(_: FastAPI):
    configure_logging()
    logger.info(
        "Booklynk EV API starting | environment=%s debug=%s",
        settings.ENVIRONMENT,
        settings.DEBUG,
    )
    yield
    logger.info("Booklynk EV API shutting down")


def create_app() -> FastAPI:
    app = FastAPI(
        title="Booklynk EV API",
        description="The Operating System for India's EV Economy.",
        version="0.1.0",
        debug=settings.DEBUG,
        lifespan=lifespan,
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    register_exception_handlers(app)

    app.include_router(health_router, prefix="/api")
    app.include_router(auth_router, prefix="/api/auth")
    app.include_router(admin_router, prefix="/api/admin")
    app.include_router(investor_router, prefix="/api/investor")
    app.include_router(rider_router, prefix="/api/rider")
    app.include_router(business_router, prefix="/api/business")
    app.include_router(api_v1_router, prefix=settings.API_V1_PREFIX)

    return app


app = create_app()
