"""Seed the fixed set of platform roles.

Idempotent — safe to run multiple times (e.g. on every deploy). Roles are
not user-manageable data: this is the only place new roles are added.
"""
from sqlalchemy.orm import Session

from app.core.logging import logger
from app.modules.roles.enums import RoleName
from app.modules.roles.models import Role
from app.modules.roles.repository import RoleRepository


def seed_roles(db: Session) -> None:
    repo = RoleRepository(db)
    created = 0
    for role_name in RoleName:
        if repo.get_by_name(role_name) is not None:
            continue
        db.add(Role(name=role_name))
        created += 1
    db.commit()
    already_present = len(RoleName) - created
    logger.info("Role seed complete: %d created, %d already present", created, already_present)
