import uuid
from typing import Any

from sqlalchemy.orm import Session

from app.core.pagination import Page
from app.modules.audit.repository import AuditLogRepository
from app.modules.audit.schemas import AuditLogPublic
from app.modules.users.models import User


class AuditService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.repo = AuditLogRepository(db)

    def log(
        self,
        *,
        actor: User,
        action: str,
        target_type: str,
        target_id: str | uuid.UUID | None,
        details: dict[str, Any] | None = None,
    ) -> None:
        self.repo.create(
            actor_user_id=actor.id,
            action=action,
            target_type=target_type,
            target_id=str(target_id) if target_id is not None else None,
            details=details,
        )

    def list_logs(
        self, *, action: str | None, target_type: str | None, page: int, page_size: int
    ) -> Page[AuditLogPublic]:
        items, total = self.repo.list_paginated(
            action=action, target_type=target_type, page=page, page_size=page_size
        )
        return Page[AuditLogPublic](
            items=[AuditLogPublic.model_validate(item) for item in items],
            total=total,
            page=page,
            page_size=page_size,
        )
