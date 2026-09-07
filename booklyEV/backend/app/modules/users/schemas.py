import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.core.validation import validate_password_strength, validate_phone_format
from app.modules.roles.enums import RoleName
from app.modules.users.enums import UserStatus
from app.modules.users.models import User


class UserPublic(BaseModel):
    """Safe, external representation of a User. Never includes password_hash."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    email: str
    phone: str
    role: RoleName
    status: UserStatus
    is_verified: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def from_user(cls, user: User) -> "UserPublic":
        return cls(
            id=user.id,
            name=user.name,
            email=user.email,
            phone=user.phone,
            role=user.role.name,
            status=user.status,
            is_verified=user.is_verified,
            created_at=user.created_at,
            updated_at=user.updated_at,
        )


# --- admin (SUPER_ADMIN-only) requests --------------------------------------


class AdminCreateUserRequest(BaseModel):
    """Unlike public /api/auth/register, this can assign any role,
    including ADMIN/SUPER_ADMIN — only reachable by an already-authenticated
    SUPER_ADMIN (see app/modules/admin/router.py).
    """

    name: str = Field(min_length=2, max_length=120)
    email: EmailStr
    phone: str
    password: str = Field(max_length=128)
    role: RoleName

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str) -> str:
        return validate_phone_format(value)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        return validate_password_strength(value)


class AdminUpdateUserRequest(BaseModel):
    """All fields optional — only the ones provided are changed."""

    name: str | None = Field(default=None, min_length=2, max_length=120)
    email: EmailStr | None = None
    phone: str | None = None

    @field_validator("phone")
    @classmethod
    def validate_phone(cls, value: str | None) -> str | None:
        return validate_phone_format(value) if value is not None else None


class AssignRoleRequest(BaseModel):
    role: RoleName
