"""Centralized application configuration, loaded from environment variables."""
from functools import lru_cache

from pydantic import Field, field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

# Both this project's checked-in .env.example files ship this exact string
# as a clearly-labeled placeholder. If it (or anything this short) is ever
# still in effect with ENVIRONMENT=production, every JWT the app issues is
# forgeable by anyone who has read either file — see docs/security-audit.md.
_INSECURE_SECRET_KEYS = {
    "change-me-in-production-use-a-long-random-string",
    "dev-only-change-me-generate-a-long-random-secret",
}
_MIN_PRODUCTION_SECRET_KEY_LENGTH = 32


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # --- Application ---
    APP_NAME: str = "booklynk-ev"
    ENVIRONMENT: str = "development"  # development | staging | production
    DEBUG: bool = True
    API_V1_PREFIX: str = "/api/v1"
    LOG_LEVEL: str = "INFO"

    # --- Database ---
    DATABASE_URL: str = Field(
        default="postgresql+psycopg://postgres:postgres@localhost:5432/booklynk_ev",
        description="SQLAlchemy connection string (sync driver, e.g. psycopg).",
    )
    DATABASE_ECHO: bool = False

    @field_validator("DATABASE_URL")
    @classmethod
    def _normalize_database_url_driver(cls, value: str) -> str:
        """Managed Postgres providers (Render, Heroku, ...) hand out
        connection strings as `postgres://` or plain `postgresql://` —
        neither names a driver, so SQLAlchemy falls back to psycopg2
        (not installed here; only psycopg3 is) and `create_engine` blows
        up at startup. Rewrite to the `+psycopg` dialect we actually
        ship, so pasting a provider's connection string in as-is just
        works instead of needing manual editing on every deploy.
        """
        for prefix in ("postgres://", "postgresql://"):
            if value.startswith(prefix) and not value.startswith("postgresql+"):
                return "postgresql+psycopg://" + value[len(prefix) :]
        return value

    # --- Redis ---
    REDIS_URL: str = "redis://localhost:6379/0"

    # --- Auth / security (infrastructure ready for future auth module) ---
    SECRET_KEY: str = Field(
        default="change-me-in-production-use-a-long-random-string",
        description="Used to sign JWT access/refresh tokens.",
    )
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # --- CORS ---
    # Plain comma-separated string on purpose: pydantic-settings tries to
    # JSON-decode env vars for `List[str]` fields, which breaks on a plain
    # "http://a,http://b" value. Split it ourselves via the property below.
    CORS_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @model_validator(mode="after")
    def _reject_insecure_secret_in_production(self) -> "Settings":
        if self.ENVIRONMENT != "production":
            return self
        if self.SECRET_KEY in _INSECURE_SECRET_KEYS:
            raise ValueError(
                "SECRET_KEY is still a checked-in placeholder value. Set a real, random "
                "SECRET_KEY before running with ENVIRONMENT=production — anyone who read "
                "the .env.example files can forge valid JWTs otherwise."
            )
        if len(self.SECRET_KEY) < _MIN_PRODUCTION_SECRET_KEY_LENGTH:
            raise ValueError(
                f"SECRET_KEY must be at least {_MIN_PRODUCTION_SECRET_KEY_LENGTH} characters "
                "long when ENVIRONMENT=production."
            )
        return self


@lru_cache
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
