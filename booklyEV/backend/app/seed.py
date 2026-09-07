"""Development/deploy seed entrypoint.

Usage:
    python -m app.seed
"""
from app.core.database import SessionLocal
from app.core.logging import configure_logging
from app.modules.investors.seed import seed_ev_assets
from app.modules.permissions.seed import seed_permissions, seed_role_permissions
from app.modules.riders.seed import seed_jobs
from app.modules.roles.seed import seed_roles


def run() -> None:
    configure_logging()
    db = SessionLocal()
    try:
        seed_roles(db)
        seed_permissions(db)
        seed_role_permissions(db)
        seed_ev_assets(db)
        seed_jobs(db)
    finally:
        db.close()


if __name__ == "__main__":
    run()
