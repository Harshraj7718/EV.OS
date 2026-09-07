import uuid
from datetime import UTC, datetime

import jwt
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.exceptions import AppError, ConflictError, ForbiddenError, UnauthorizedError
from app.core.security import create_token, decode_token, hash_password, hash_token, verify_password
from app.modules.auth.repository import RefreshTokenRepository
from app.modules.auth.schemas import (
    ChangePasswordRequest,
    LoginRequest,
    LogoutRequest,
    RefreshRequest,
    RefreshResponse,
    RegisterRequest,
    TokenPairResponse,
)
from app.modules.roles.enums import DEFAULT_SELF_SIGNUP_ROLE
from app.modules.roles.repository import RoleRepository
from app.modules.users.enums import UserStatus
from app.modules.users.models import User
from app.modules.users.repository import UserRepository
from app.modules.users.schemas import UserPublic


class AuthService:
    def __init__(self, db: Session) -> None:
        self.db = db
        self.users = UserRepository(db)
        self.roles = RoleRepository(db)
        self.refresh_tokens = RefreshTokenRepository(db)

    # --- token issuance -------------------------------------------------

    def _issue_token_pair(self, user: User) -> tuple[str, str, int]:
        access_token = create_token(
            subject=str(user.id),
            token_type="access",
            extra_claims={"role": user.role.name.value},
        )
        refresh_token = create_token(subject=str(user.id), token_type="refresh")
        refresh_claims = decode_token(refresh_token)
        expires_at = datetime.fromtimestamp(refresh_claims["exp"], tz=UTC)

        self.refresh_tokens.create(
            user_id=user.id,
            token_hash=hash_token(refresh_token),
            expires_at=expires_at,
        )
        expires_in = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
        return access_token, refresh_token, expires_in

    # --- public operations ------------------------------------------------

    def register(self, payload: RegisterRequest) -> TokenPairResponse:
        email = payload.email.lower()

        if self.users.get_by_email(email) is not None:
            raise ConflictError("An account with this email already exists.")
        if self.users.get_by_phone(payload.phone) is not None:
            raise ConflictError("An account with this phone number already exists.")

        role = self.roles.get_by_name(DEFAULT_SELF_SIGNUP_ROLE)
        if role is None:
            # Seed data is missing — a deployment/ops problem, not a client error.
            raise RuntimeError(
                f"Role '{DEFAULT_SELF_SIGNUP_ROLE.value}' is not seeded. Run `python -m app.seed`."
            )

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
        user.role = role  # avoid a reload just to populate the relationship

        access_token, refresh_token, expires_in = self._issue_token_pair(user)
        self.db.commit()

        return TokenPairResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserPublic.from_user(user),
        )

    def login(self, payload: LoginRequest) -> TokenPairResponse:
        user = self.users.get_by_email(payload.email.lower())
        if user is None or not verify_password(payload.password, user.password_hash):
            raise UnauthorizedError("Invalid email or password.")

        if user.status != UserStatus.ACTIVE:
            raise ForbiddenError(f"Account is {user.status.value.lower()}.")

        access_token, refresh_token, expires_in = self._issue_token_pair(user)
        self.db.commit()

        return TokenPairResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=expires_in,
            user=UserPublic.from_user(user),
        )

    def refresh(self, payload: RefreshRequest) -> RefreshResponse:
        claims = self._decode_or_401(payload.refresh_token, expected_type="refresh")

        token_hash = hash_token(payload.refresh_token)
        record = self.refresh_tokens.get_by_hash(token_hash)
        if record is None:
            raise UnauthorizedError("Invalid refresh token.")

        if record.revoked_at is not None:
            # This token was already rotated away once — reusing it suggests
            # theft/replay. Revoke the whole family as a precaution.
            self.refresh_tokens.revoke_all_for_user(record.user_id)
            self.db.commit()
            raise UnauthorizedError("Refresh token has already been used.")

        if not RefreshTokenRepository.is_active(record):
            raise UnauthorizedError("Refresh token has expired.")

        user = self.users.get_by_id(uuid.UUID(claims["sub"]))
        if user is None:
            raise UnauthorizedError("Invalid refresh token.")
        if user.status != UserStatus.ACTIVE:
            raise ForbiddenError(f"Account is {user.status.value.lower()}.")

        self.refresh_tokens.revoke(record)
        access_token, refresh_token, expires_in = self._issue_token_pair(user)
        self.db.commit()

        return RefreshResponse(
            access_token=access_token, refresh_token=refresh_token, expires_in=expires_in
        )

    def logout(self, payload: LogoutRequest) -> None:
        try:
            claims = decode_token(payload.refresh_token)
        except jwt.PyJWTError:
            return  # Already unusable — logout is idempotent, nothing to leak.

        if claims.get("type") != "refresh":
            return

        record = self.refresh_tokens.get_by_hash(hash_token(payload.refresh_token))
        if record is not None and record.revoked_at is None:
            self.refresh_tokens.revoke(record)
            self.db.commit()

    def get_current_user(self, access_token: str) -> User:
        claims = self._decode_or_401(access_token, expected_type="access")

        user = self.users.get_by_id(uuid.UUID(claims["sub"]))
        if user is None:
            raise UnauthorizedError("User not found.")
        if user.status != UserStatus.ACTIVE:
            raise ForbiddenError(f"Account is {user.status.value.lower()}.")
        return user

    def change_password(self, user: User, payload: ChangePasswordRequest) -> None:
        if not verify_password(payload.current_password, user.password_hash):
            raise AppError("Current password is incorrect.")

        user.password_hash = hash_password(payload.new_password)
        self.db.flush()
        self.refresh_tokens.revoke_all_for_user(user.id)
        self.db.commit()

    # --- helpers ------------------------------------------------------------

    @staticmethod
    def _decode_or_401(token: str, *, expected_type: str) -> dict:
        try:
            claims = decode_token(token)
        except jwt.ExpiredSignatureError as exc:
            raise UnauthorizedError("Token has expired.") from exc
        except jwt.PyJWTError as exc:
            raise UnauthorizedError("Invalid token.") from exc

        if claims.get("type") != expected_type:
            raise UnauthorizedError("Invalid token type.")
        return claims
