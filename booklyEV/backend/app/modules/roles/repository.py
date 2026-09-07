from sqlalchemy import select
from sqlalchemy.orm import Session

from app.modules.roles.enums import RoleName
from app.modules.roles.models import Role


class RoleRepository:
    def __init__(self, db: Session) -> None:
        self.db = db

    def get_by_name(self, name: RoleName) -> Role | None:
        return self.db.scalar(select(Role).where(Role.name == name))

    def list_all(self) -> list[Role]:
        return list(self.db.scalars(select(Role).order_by(Role.name)))
