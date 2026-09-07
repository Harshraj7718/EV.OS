from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.permissions.models import Permission
from app.modules.roles.enums import RoleName


class Role(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    __tablename__ = "roles"

    name: Mapped[RoleName] = mapped_column(
        SAEnum(RoleName, name="role_name"), unique=True, index=True, nullable=False
    )

    # viewonly: membership is managed exclusively by app/modules/permissions/seed.py
    # via RolePermission rows, never by appending to this list.
    permissions: Mapped[list[Permission]] = relationship(
        Permission, secondary="role_permissions", lazy="selectin", viewonly=True
    )

    def __repr__(self) -> str:  # pragma: no cover
        return f"Role(id={self.id!r}, name={self.name!r})"
