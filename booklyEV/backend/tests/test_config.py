"""Unit tests for app/core/config.py — no DB, no fixtures."""
import pytest

from app.core.config import Settings


@pytest.mark.parametrize(
    "raw,expected",
    [
        ("postgres://u:p@h:5432/db", "postgresql+psycopg://u:p@h:5432/db"),
        ("postgresql://u:p@h:5432/db", "postgresql+psycopg://u:p@h:5432/db"),
        ("postgresql+psycopg://u:p@h:5432/db", "postgresql+psycopg://u:p@h:5432/db"),
    ],
)
def test_database_url_normalized_to_psycopg_driver(raw: str, expected: str) -> None:
    """Managed Postgres providers (Render, Heroku, ...) hand out
    `postgres://`/`postgresql://` connection strings with no driver named
    — SQLAlchemy needs the `+psycopg` dialect this app actually ships, or
    `create_engine` fails at startup. See docs/deployment.md.
    """
    assert Settings(DATABASE_URL=raw).DATABASE_URL == expected


def test_secret_key_placeholder_rejected_in_production() -> None:
    with pytest.raises(ValueError, match="placeholder"):
        Settings(
            ENVIRONMENT="production",
            SECRET_KEY="dev-only-change-me-generate-a-long-random-secret",
        )


def test_secret_key_too_short_rejected_in_production() -> None:
    with pytest.raises(ValueError, match="at least"):
        Settings(ENVIRONMENT="production", SECRET_KEY="short")


def test_secret_key_placeholder_allowed_outside_production() -> None:
    settings = Settings(
        ENVIRONMENT="development",
        SECRET_KEY="change-me-in-production-use-a-long-random-string",
    )
    assert settings.SECRET_KEY == "change-me-in-production-use-a-long-random-string"


def test_real_secret_key_accepted_in_production() -> None:
    settings = Settings(ENVIRONMENT="production", SECRET_KEY="a" * 32)
    assert settings.SECRET_KEY == "a" * 32
