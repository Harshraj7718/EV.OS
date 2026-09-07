import uuid

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.permissions.models import Permission, RolePermission


class PermissionRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_code(self, code: str) -> Permission | None:
        return self.db.scalar(select(Permission).where(Permission.code == code))

    def list_all(self) -> list[Permission]:
        stmt = select(Permission).order_by(Permission.resource, Permission.action)
        return list(self.db.scalars(stmt))

    def list_codes_for_role(self, role_id: uuid.UUID) -> set[str]:
        stmt = (
            select(Permission.code)
            .join(RolePermission, RolePermission.permission_id == Permission.id)
            .where(RolePermission.role_id == role_id)
        )
        return set(self.db.scalars(stmt))

    def link_exists(self, role_id: uuid.UUID, permission_id: uuid.UUID) -> bool:
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        return self.db.scalar(stmt) is not None

    def link(self, role_id: uuid.UUID, permission_id: uuid.UUID) -> None:
        self.db.add(RolePermission(role_id=role_id, permission_id=permission_id))

    def unlink(self, role_id: uuid.UUID, permission_id: uuid.UUID) -> None:
        stmt = select(RolePermission).where(
            RolePermission.role_id == role_id,
            RolePermission.permission_id == permission_id,
        )
        record = self.db.scalar(stmt)
        if record is not None:
            self.db.delete(record)
