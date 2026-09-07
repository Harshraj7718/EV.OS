"""Application-wide logging configuration."""
import logging
import sys

from app.core.config import settings


def configure_logging() -> None:
    root = logging.getLogger()
    root.setLevel(settings.LOG_LEVEL)

    # Avoid duplicate handlers on reload.
    if root.handlers:
        return

    handler = logging.StreamHandler(sys.stdout)
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%dT%H:%M:%S%z",
    )
    handler.setFormatter(formatter)
    root.addHandler(handler)

    # Quiet noisy third-party loggers unless we're debugging.
    logging.getLogger("uvicorn.access").setLevel("INFO" if settings.DEBUG else "WARNING")

    # sqlalchemy.engine is deliberately left alone: SQLAlchemy sets its
    # level itself based on `echo=` at create_engine() (see
    # core/database.py, controlled by DATABASE_ECHO) — setting it here
    # too would silently override that, in whichever direction ran last.


logger = logging.getLogger(settings.APP_NAME)
