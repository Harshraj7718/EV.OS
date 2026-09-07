import uuid

from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from app.modules.roles.enums import RoleName
from app.modules.roles.models import Role
from app.modules.users.enums import UserStatus
from app.modules.users.models import User


class UserRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_id(self, user_id: uuid.UUID) -> User | None:
        return self.db.get(User, user_id)

    def get_by_email(self, email: str) -> User | None:
        return self.db.scalar(select(User).where(User.email == email.lower()))

    def get_by_phone(self, phone: str) -> User | None:
        return self.db.scalar(select(User).where(User.phone == phone))

    def create(self, user: User) -> User:
        self.db.add(user)
        self.db.flush()
        return user

    def list_paginated(
        self,
        *,
        search: str | None = None,
        role: RoleName | None = None,
        status: UserStatus | None = None,
        page: int = 1,
        page_size: int = 20,
    ) -> tuple[list[User], int]:
        stmt = select(User)
        count_stmt = select(func.count()).select_from(User)

        if role is not None:
            stmt = stmt.join(Role, User.role_id == Role.id).where(Role.name == role)
            count_stmt = count_stmt.join(Role, User.role_id == Role.id).where(Role.name == role)
        if status is not None:
            stmt = stmt.where(User.status == status)
            count_stmt = count_stmt.where(User.status == status)
        if search:
            pattern = f"%{search}%"
            search_clause = or_(
                User.name.ilike(pattern), User.email.ilike(pattern), User.phone.ilike(pattern)
            )
            stmt = stmt.where(search_clause)
            count_stmt = count_stmt.where(search_clause)

        total = self.db.scalar(count_stmt) or 0

        stmt = stmt.order_by(User.created_at.desc()).offset((page - 1) * page_size).limit(page_size)
        items = list(self.db.scalars(stmt))
        return items, total

    def count_active_by_role(self, role_name: RoleName) -> int:
        stmt = (
            select(func.count())
            .select_from(User)
            .join(Role, User.role_id == Role.id)
            .where(Role.name == role_name, User.status == UserStatus.ACTIVE)
        )
        return self.db.scalar(stmt) or 0
