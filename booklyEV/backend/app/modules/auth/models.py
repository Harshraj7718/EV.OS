import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String
from sqlalchemy import Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base, TimestampMixin, UUIDPrimaryKeyMixin
from app.modules.auth.enums import VerificationPurpose


class RefreshToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Server-side record of an issued refresh token, enabling revocation.

    The raw JWT is never stored — only a SHA-256 digest, so a leaked
    database dump can't be replayed as valid refresh tokens. Rotation on
    every /api/auth/refresh call means each row is used at most once while
    still valid.
    """

    __tablename__ = "refresh_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        revoked = self.revoked_at is not None
        return f"RefreshToken(id={self.id!r}, user_id={self.user_id!r}, revoked={revoked})"


class VerificationToken(UUIDPrimaryKeyMixin, TimestampMixin, Base):
    """Structural placeholder backing the future forgot-password, reset-
    password, email-verification, and phone-verification flows.

    No service/router uses this table yet — /api/auth exposes only
    register/login/refresh/logout/me/change-password in this phase.
    """

    __tablename__ = "verification_tokens"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True
    )
    purpose: Mapped[VerificationPurpose] = mapped_column(
        SAEnum(VerificationPurpose, name="verification_purpose"), nullable=False
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True, nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    used_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    def __repr__(self) -> str:  # pragma: no cover
        return f"VerificationToken(id={self.id!r}, purpose={self.purpose!r})"
