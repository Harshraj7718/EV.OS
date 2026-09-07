from pydantic import BaseModel

from app.modules.roles.enums import RoleName
from app.modules.users.enums import UserStatus


class PlatformOverview(BaseModel):
    total_users: int
    users_by_role: dict[RoleName, int]
    users_by_status: dict[UserStatus, int]
    total_roles: int
    total_permissions: int
    audit_log_count_last_24h: int
