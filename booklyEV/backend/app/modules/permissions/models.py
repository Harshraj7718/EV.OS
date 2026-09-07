import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin


class Permission(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """A single grantable capability, named `resource.action` (e.g. `user.read`).

    `resource` and `action` are plain strings, not enums — new resources
    (charging, gps, ...) are meant to add rows here, not require a schema
    change.
    """

    __tablename__ = "permissions"
    __table_args__ = (
        UniqueConstraint("resource", "action", name="uq_permissions_resource_action"),
    )

    resource: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    action: Mapped[str] = mapped_column(String(50), nullable=False, index=True)
    code: Mapped[str] = mapped_column(String(101), unique=True, index=True, nullable=False)
    description: Mapped[str] = mapped_column(String(255), nullable=False, default="")

    def __repr__(self) -> str:  # pragma: no cover
        return f"Permission(code={self.code!r})"


class RolePermission(Base):
    """Join table: which permissions a role grants. Managed only by the
    seed script (`app/modules/permissions/seed.py`) — there is no
    role/permission-editing endpoint in this phase.
    """

    __tablename__ = "role_permissions"

    role_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("roles.id", ondelete="CASCADE"), primary_key=True
    )
    permission_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("permissions.id", ondelete="CASCADE"), primary_key=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
