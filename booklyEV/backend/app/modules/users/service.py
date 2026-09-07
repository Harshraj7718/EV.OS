import uuid

from sqlalchemy.orm import Session

from app.core.exceptions import ConflictError, ForbiddenError, NotFoundError
from app.core.pagination import Page
from app.core.security import hash_password
from app.modules.audit.service import AuditService
from app.modules.roles.enums import RoleName
from app.modules.roles.repository import RoleRepository
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import (
    AdminCreateUserRequest,
    AdminUpdateUserRequest,
    AssignRoleRequest,
    UserPublic,
)


class LastSuperAdminError(ConflictError):
    """Raised when an action would leave the platform with zero active
    SUPER_ADMIN accounts (demoting or suspending the last one).
    """

    code = "last_super_admin"


def _role_not_seeded_error(role_name: RoleName) -> RuntimeError:
    return RuntimeError(f"Role '{role_name.value}' is not seeded. Run `python -m app.seed`.")


class AdminUserService:
    """User management for the SUPER_ADMIN panel. Every write here is
    logged via AuditService in the same DB transaction as the change it
    describes — see docs/admin.md.
    """

    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.audit = AuditService(db)

    def list_users(
        self,
        *,
        search: str | None,
        role: RoleName | None,
        status: UserStatus | None,
        page: int,
        page_size: int,
    ) -> Page[UserPublic]:
        items, total = self.users.list_paginated(
            search=search, role=role, status=status, page=page, page_size=page_size
        )
        return Page[UserPublic](
            items=[UserPublic.from_user(u) for u in items],
            total=total,
            page=page,
            page_size=page_size,
        )

    def get_user(self, user_id: uuid.UUID) -> User:
        user = self.users.get_by_id(user_id)
        if user is None:
            raise NotFoundError("User not found.")
        return user

    def create_user(self, payload: AdminCreateUserRequest, *, actor: User) -> User:
        email = payload.email.lower()
        if self.users.get_by_email(email) is not None:
            raise ConflictError("An account with this email already exists.")
        if self.users.get_by_phone(payload.phone) is not None:
            raise ConflictError("An account with this phone number already exists.")

        role = self.roles.get_by_name(payload.role)
        if role is None:
            raise _role_not_seeded_error(payload.role)

        user = User(
            name=payload.name,
            email=email,
            phone=payload.phone,
            password_hash=hash_password(payload.password),
            role_id=role.id,
            status=UserStatus.ACTIVE,
            is_verified=False,
        )
        self.users.create(user)
        user.role = role

        self.audit.log(
            actor=actor,
            action="user.create",
            target_type="user",
            target_id=user.id,
            details={"email": email, "role": payload.role.value},
        )
        self.db.commit()
        return user

    def update_user(
        self, user_id: uuid.UUID, payload: AdminUpdateUserRequest, *, actor: User
    ) -> User:
        user = self.get_user(user_id)
        self._assert_can_manage_target(actor, user)
        changes: dict[str, str] = {}

        if payload.email is not None:
            email = payload.email.lower()
            existing = self.users.get_by_email(email)
            if existing is not None and existing.id != user.id:
                raise ConflictError("An account with this email already exists.")
            if email != user.email:
                changes["email"] = email
                user.email = email

        if payload.phone is not None:
            existing = self.users.get_by_phone(payload.phone)
            if existing is not None and existing.id != user.id:
                raise ConflictError("An account with this phone number already exists.")
            if payload.phone != user.phone:
                changes["phone"] = payload.phone
                user.phone = payload.phone

        if payload.name is not None and payload.name != user.name:
            changes["name"] = payload.name
            user.name = payload.name

        if changes:
            self.db.flush()
            self.audit.log(
                actor=actor,
                action="user.update",
                target_type="user",
                target_id=user.id,
                details=changes,
            )
            self.db.commit()
        return user

    def suspend_user(self, user_id: uuid.UUID, *, actor: User) -> User:
        user = self.get_user(user_id)
        self._assert_can_manage_target(actor, user)
        if self._is_last_active_super_admin(user):
            raise LastSuperAdminError("Cannot suspend the last active SUPER_ADMIN.")

        user.status = UserStatus.SUSPENDED
        self.db.flush()
        self.audit.log(actor=actor, action="user.suspend", target_type="user", target_id=user.id)
        self.db.commit()
        return user

    def activate_user(self, user_id: uuid.UUID, *, actor: User) -> User:
        user = self.get_user(user_id)
        self._assert_can_manage_target(actor, user)
        user.status = UserStatus.ACTIVE
        self.db.flush()
        self.audit.log(actor=actor, action="user.activate", target_type="user", target_id=user.id)
        self.db.commit()
        return user

    def assign_role(self, user_id: uuid.UUID, payload: AssignRoleRequest, *, actor: User) -> User:
        user = self.get_user(user_id)
        self._assert_can_manage_target(actor, user)
        if user.role.name == payload.role:
            return user

        if user.role.name == RoleName.SUPER_ADMIN and self._is_last_active_super_admin(user):
            raise LastSuperAdminError("Cannot reassign the role of the last active SUPER_ADMIN.")

        new_role = self.roles.get_by_name(payload.role)
        if new_role is None:
            raise _role_not_seeded_error(payload.role)

        previous_role = user.role.name.value
        user.role_id = new_role.id
        user.role = new_role
        self.db.flush()
        self.audit.log(
            actor=actor,
            action="user.role_assign",
            target_type="user",
            target_id=user.id,
            details={"from": previous_role, "to": payload.role.value},
        )
        self.db.commit()
        return user

    def _is_last_active_super_admin(self, user: User) -> bool:
        if user.role.name != RoleName.SUPER_ADMIN or user.status != UserStatus.ACTIVE:
            return False
        return self.users.count_active_by_role(RoleName.SUPER_ADMIN) <= 1

    @staticmethod
    def _assert_can_manage_target(actor: User, target: User) -> None:
        """ADMIN cannot manage SUPER_ADMIN — the endpoints ADMIN reaches
        here (update, suspend) are permission-gated, not role-gated, so
        this is the check that actually keeps a SUPER_ADMIN account out of
        ADMIN's reach regardless of what permissions ADMIN holds.
        """
        if target.role.name == RoleName.SUPER_ADMIN and actor.role.name != RoleName.SUPER_ADMIN:
            raise ForbiddenError("Only SUPER_ADMIN can manage a SUPER_ADMIN account.")
