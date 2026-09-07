from sqlalchemy.orm import Session

from app.core.exceptions import AppError, NotFoundError
from app.modules.audit.service import AuditService
from app.modules.permissions.repository import PermissionRepository
from app.modules.permissions.schemas import PermissionPublic, RolePermissionMatrix
from app.modules.roles.enums import RoleName
from app.modules.roles.repository import RoleRepository
from app.modules.users.models import User


class PermissionAdminService:
    """Runtime management of the role -> permission matrix (grant/revoke),
    on top of the fixed permission catalog seeded by
    app/modules/permissions/seed.py. SUPER_ADMIN's own permission set is
    intentionally immutable — see docs/authorization.md.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.permissions = PermissionRepository(db)
        self.roles = RoleRepository(db)
        self.audit = AuditService(db)

    def get_matrix(self) -> RolePermissionMatrix:
        all_permissions = self.permissions.list_all()
        matrix: dict[RoleName, list[str]] = {}
        for role_name in RoleName:
            role = self.roles.get_by_name(role_name)
            matrix[role_name] = sorted(p.code for p in role.permissions) if role else []
        return RolePermissionMatrix(
            permissions=[PermissionPublic.model_validate(p) for p in all_permissions],
            matrix=matrix,
        )

    def grant(self, role_name: RoleName, code: str, *, actor: User) -> None:
        if role_name == RoleName.SUPER_ADMIN:
            raise AppError("SUPER_ADMIN always has every permission — its matrix can't be edited.")

        role = self.roles.get_by_name(role_name)
        if role is None:
            raise NotFoundError(f"Role '{role_name.value}' not found.")
        permission = self.permissions.get_by_code(code)
        if permission is None:
            raise NotFoundError(f"Permission '{code}' not found.")

        if self.permissions.link_exists(role.id, permission.id):
            return
        self.permissions.link(role.id, permission.id)
        self.audit.log(
            actor=actor,
            action="permission.grant",
            target_type="role",
            target_id=role.id,
            details={"role": role_name.value, "permission": code},
        )
        self.db.commit()

    def revoke(self, role_name: RoleName, code: str, *, actor: User) -> None:
        if role_name == RoleName.SUPER_ADMIN:
            raise AppError("SUPER_ADMIN always has every permission — its matrix can't be edited.")

        role = self.roles.get_by_name(role_name)
        if role is None:
            raise NotFoundError(f"Role '{role_name.value}' not found.")
        permission = self.permissions.get_by_code(code)
        if permission is None:
            raise NotFoundError(f"Permission '{code}' not found.")

        if not self.permissions.link_exists(role.id, permission.id):
            return
        self.permissions.unlink(role.id, permission.id)
        self.audit.log(
            actor=actor,
            action="permission.revoke",
            target_type="role",
            target_id=role.id,
            details={"role": role_name.value, "permission": code},
        )
        self.db.commit()
