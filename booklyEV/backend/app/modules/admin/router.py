"""Admin API — shared by SUPER_ADMIN (full control) and ADMIN (a scoped
internal-operations role).

Two gating styles are used deliberately:

- `require_super_admin` (= `require_role(RoleName.SUPER_ADMIN)`) for
  anything ADMIN must never reach regardless of its permission grants:
  creating users, activating a suspended account, assigning roles,
  managing the RBAC matrix, reading audit logs, reading settings. These
  map directly to "ADMIN cannot: manage SUPER_ADMIN, modify system
  permissions, modify role definitions, access security secrets" (see
  docs/admin.md).
- `require_admin_permission(code)` for endpoints ADMIN's scoped
  permission set legitimately covers (view/update users, suspend, view
  stakeholders, view analytics). It first confirms the caller is internal
  ops staff (SUPER_ADMIN or ADMIN) before checking the permission code —
  see its docstring in app/api/deps.py for why that first check matters.

Additionally, `AdminUserService` itself refuses to let a non-SUPER_ADMIN
actor update/suspend/activate/reassign a SUPER_ADMIN target, so ADMIN
can't manage a SUPER_ADMIN account even via the permission-gated
update/suspend endpoints it does have access to.
"""
import uuid

from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.orm import Session

from app.api.deps import get_db_session, require_admin_permission, require_role
from app.core.config import settings
from app.core.pagination import Page
from app.modules.admin.schemas import SettingsPublic
from app.modules.analytics.schemas import PlatformOverview
from app.modules.analytics.service import AnalyticsService
from app.modules.audit.schemas import AuditLogPublic
from app.modules.audit.service import AuditService
from app.modules.permissions.repository import PermissionRepository
from app.modules.permissions.schemas import PermissionPublic, RolePermissionMatrix
from app.modules.permissions.service import PermissionAdminService
from app.modules.roles.enums import RoleName
from app.modules.roles.repository import RoleRepository
from app.modules.roles.schemas import RolePublic
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.schemas import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AssignRoleRequest,
    UserPublic,
)
from app.modules.users.service import AdminUserService

router = APIRouter(tags=["admin"])

# Shared dependency instances (not re-created per route) so FastAPI's
# per-request dependency cache dedupes them when multiple params
# reference the same callable.
require_super_admin = require_role(RoleName.SUPER_ADMIN)
require_view_users = require_admin_permission("user.read")
require_update_users = require_admin_permission("user.update")
require_suspend_users = require_admin_permission("user.suspend")
require_view_analytics = require_admin_permission("analytics.read")


# --- users -------------------------------------------------------------------


@router.get("/users", response_model=Page[UserPublic])
def list_users(
    search: str | None = Query(default=None, max_length=255),
    role: RoleName | None = None,
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    actor: User = Depends(require_view_users),
    db: Session = Depends(get_db_session),
) -> Page[UserPublic]:
    return AdminUserService(db).list_users(
        search=search, role=role, status=status_filter, page=page, page_size=page_size
    )


@router.post("/users", response_model=UserPublic, status_code=status.HTTP_201_CREATED)
def create_user(
    payload: AdminCreateUserRequest,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db_session),
) -> UserPublic:
    user = AdminUserService(db).create_user(payload, actor=actor)
    return UserPublic.from_user(user)


@router.get("/users/{user_id}", response_model=UserPublic)
def get_user(
    user_id: uuid.UUID,
    actor: User = Depends(require_view_users),
    db: Session = Depends(get_db_session),
) -> UserPublic:
    user = AdminUserService(db).get_user(user_id)
    return UserPublic.from_user(user)


@router.patch("/users/{user_id}", response_model=UserPublic)
def update_user(
    user_id: uuid.UUID,
    payload: AdminUpdateUserRequest,
    actor: User = Depends(require_update_users),
    db: Session = Depends(get_db_session),
) -> UserPublic:
    user = AdminUserService(db).update_user(user_id, payload, actor=actor)
    return UserPublic.from_user(user)


@router.post("/users/{user_id}/suspend", response_model=UserPublic)
def suspend_user(
    user_id: uuid.UUID,
    actor: User = Depends(require_suspend_users),
    db: Session = Depends(get_db_session),
) -> UserPublic:
    user = AdminUserService(db).suspend_user(user_id, actor=actor)
    return UserPublic.from_user(user)


@router.post("/users/{user_id}/activate", response_model=UserPublic)
def activate_user(
    user_id: uuid.UUID,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db_session),
) -> UserPublic:
    user = AdminUserService(db).activate_user(user_id, actor=actor)
    return UserPublic.from_user(user)


@router.post("/users/{user_id}/role", response_model=UserPublic)
def assign_role(
    user_id: uuid.UUID,
    payload: AssignRoleRequest,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db_session),
) -> UserPublic:
    user = AdminUserService(db).assign_role(user_id, payload, actor=actor)
    return UserPublic.from_user(user)


# --- stakeholder views (filtered users — no separate profile data yet) -------


def _stakeholder_list(
    db: Session,
    role: RoleName,
    *,
    search: str | None,
    status_filter: UserStatus | None,
    page: int,
    page_size: int,
) -> Page[UserPublic]:
    return AdminUserService(db).list_users(
        search=search, role=role, status=status_filter, page=page, page_size=page_size
    )


@router.get("/investors", response_model=Page[UserPublic])
def list_investors(
    search: str | None = Query(default=None, max_length=255),
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    actor: User = Depends(require_view_users),
    db: Session = Depends(get_db_session),
) -> Page[UserPublic]:
    return _stakeholder_list(
        db,
        RoleName.INVESTOR,
        search=search,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


@router.get("/riders", response_model=Page[UserPublic])
def list_riders(
    search: str | None = Query(default=None, max_length=255),
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    actor: User = Depends(require_view_users),
    db: Session = Depends(get_db_session),
) -> Page[UserPublic]:
    return _stakeholder_list(
        db,
        RoleName.RIDER,
        search=search,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


@router.get("/businesses", response_model=Page[UserPublic])
def list_businesses(
    search: str | None = Query(default=None, max_length=255),
    status_filter: UserStatus | None = Query(default=None, alias="status"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    actor: User = Depends(require_view_users),
    db: Session = Depends(get_db_session),
) -> Page[UserPublic]:
    return _stakeholder_list(
        db,
        RoleName.BUSINESS,
        search=search,
        status_filter=status_filter,
        page=page,
        page_size=page_size,
    )


# --- roles & permissions (SUPER_ADMIN only — ADMIN cannot modify RBAC) -------


@router.get("/roles", response_model=list[RolePublic])
def list_roles(
    actor: User = Depends(require_super_admin), db: Session = Depends(get_db_session)
) -> list[RolePublic]:
    roles = RoleRepository(db).list_all()
    return [RolePublic.model_validate(r) for r in roles]


@router.get("/permissions", response_model=list[PermissionPublic])
def list_permissions(
    actor: User = Depends(require_super_admin), db: Session = Depends(get_db_session)
) -> list[PermissionPublic]:
    permissions = PermissionRepository(db).list_all()
    return [PermissionPublic.model_validate(p) for p in permissions]


@router.get("/rbac/matrix", response_model=RolePermissionMatrix)
def get_rbac_matrix(
    actor: User = Depends(require_super_admin), db: Session = Depends(get_db_session)
) -> RolePermissionMatrix:
    return PermissionAdminService(db).get_matrix()


@router.post("/rbac/roles/{role_name}/permissions/{code}", status_code=status.HTTP_204_NO_CONTENT)
def grant_permission(
    role_name: RoleName,
    code: str,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db_session),
) -> None:
    PermissionAdminService(db).grant(role_name, code, actor=actor)


@router.delete("/rbac/roles/{role_name}/permissions/{code}", status_code=status.HTTP_204_NO_CONTENT)
def revoke_permission(
    role_name: RoleName,
    code: str,
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db_session),
) -> None:
    PermissionAdminService(db).revoke(role_name, code, actor=actor)


# --- audit logs (SUPER_ADMIN only) ----------------------------------------------


@router.get("/audit-logs", response_model=Page[AuditLogPublic])
def list_audit_logs(
    action: str | None = Query(default=None, max_length=100),
    target_type: str | None = Query(default=None, max_length=50),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    actor: User = Depends(require_super_admin),
    db: Session = Depends(get_db_session),
) -> Page[AuditLogPublic]:
    return AuditService(db).list_logs(
        action=action, target_type=target_type, page=page, page_size=page_size
    )


# --- analytics -----------------------------------------------------------------


@router.get("/analytics/overview", response_model=PlatformOverview)
def get_analytics_overview(
    actor: User = Depends(require_view_analytics), db: Session = Depends(get_db_session)
) -> PlatformOverview:
    return AnalyticsService(db).get_overview()


# --- settings (SUPER_ADMIN only — non-secret, but still out of ADMIN's scope) --


@router.get("/settings", response_model=SettingsPublic)
def get_settings(actor: User = Depends(require_super_admin)) -> SettingsPublic:
    return SettingsPublic(
        app_name=settings.APP_NAME,
        environment=settings.ENVIRONMENT,
        api_v1_prefix=settings.API_V1_PREFIX,
        access_token_expire_minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES,
        refresh_token_expire_days=settings.REFRESH_TOKEN_EXPIRE_DAYS,
    )
