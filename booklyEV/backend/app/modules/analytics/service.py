from datetime import UTC, datetime, timedelta

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.modules.analytics.schemas import PlatformOverview
from app.modules.audit.models import AuditLog
from app.modules.permissions.models import Permission
from app.modules.roles.enums import RoleName
from app.modules.roles.models import Role
from app.modules.users.enums import UserStatus
from app.modules.users.models import User


class AnalyticsService:
    """Real aggregate counts only — no synthetic/placeholder data. Richer
    analytics (trips, payments, fleet utilization, ...) will follow once
    those domain modules exist.
    """

    def __init__(self, db: Session) -> None:
        self.db = db

    def get_overview(self) -> PlatformOverview:
        total_users = self.db.scalar(select(func.count()).select_from(User)) or 0

        role_rows = self.db.execute(
            select(Role.name, func.count(User.id))
            .join(User, User.role_id == Role.id, isouter=True)
            .group_by(Role.name)
        ).all()
        users_by_role: dict[RoleName, int] = dict.fromkeys(RoleName, 0)
        for role_name, count in role_rows:
            users_by_role[role_name] = count

        status_stmt = select(User.status, func.count(User.id)).group_by(User.status)
        status_rows = self.db.execute(status_stmt).all()
        users_by_status: dict[UserStatus, int] = dict.fromkeys(UserStatus, 0)
        for status, count in status_rows:
            users_by_status[status] = count

        total_roles = self.db.scalar(select(func.count()).select_from(Role)) or 0
        total_permissions = self.db.scalar(select(func.count()).select_from(Permission)) or 0

        since = datetime.now(UTC) - timedelta(hours=24)
        audit_stmt = select(func.count()).select_from(AuditLog).where(AuditLog.created_at >= since)
        audit_log_count_last_24h = self.db.scalar(audit_stmt) or 0

        return PlatformOverview(
            total_users=total_users,
            users_by_role=users_by_role,
            users_by_status=users_by_status,
            total_roles=total_roles,
            total_permissions=total_permissions,
            audit_log_count_last_24h=audit_log_count_last_24h,
        )
