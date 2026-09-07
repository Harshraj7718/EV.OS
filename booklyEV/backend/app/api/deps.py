"""Shared FastAPI dependencies."""
from collections.abc import Callable

from fastapi import Depends
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from app.core.authorization import user_has_permissions, user_has_role
from app.core.database import get_db
from app.core.exceptions import ForbiddenError, UnauthorizedError
from app.modules.auth.service import AuthService
from app.modules.roles.enums import RoleName
from app.modules.users.models import User

get_db_session = get_db

# auto_error=False: FastAPI's HTTPBearer defaults to raising 403 when the
# Authorization header is missing. We want 401 for *any* unauthenticated
# request, so we check for missing credentials ourselves below.
_bearer_scheme = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(_bearer_scheme),
    db: Session = Depends(get_db_session),
) -> User:
    if credentials is None:
        raise UnauthorizedError("Not authenticated.")

    return AuthService(db).get_current_user(credentials.credentials)


def require_role(*allowed_roles: RoleName) -> Callable[[User], User]:
    """FastAPI dependency factory: 401 if unauthenticated (via
    get_current_user), 403 if authenticated but not one of `allowed_roles`.

    Usage: `current_user: User = Depends(require_role(RoleName.ADMIN, RoleName.SUPER_ADMIN))`
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if not user_has_role(current_user, *allowed_roles):
            raise ForbiddenError("You do not have permission to perform this action.")
        return current_user

    return dependency


def require_permission(*required_codes: str) -> Callable[[User], User]:
    """FastAPI dependency factory: 401 if unauthenticated, 403 if the
    current user's role doesn't grant every permission in `required_codes`.

    Prefer this over require_role for most endpoints — it decouples
    "what can be done" from "which role happens to allow it today", so
    reshuffling the role → permission matrix doesn't mean hunting down
    hardcoded role checks across the codebase.

    Usage: `current_user: User = Depends(require_permission("vehicle.book"))`
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if not user_has_permissions(current_user, *required_codes):
            raise ForbiddenError("You do not have permission to perform this action.")
        return current_user

    return dependency


def require_admin_permission(*required_codes: str) -> Callable[[User], User]:
    """For `/api/admin/*` endpoints shared between SUPER_ADMIN and ADMIN.

    `require_permission` alone is NOT safe here: INVESTOR/RIDER/BUSINESS
    hold permission codes like `user.read` or `analytics.read` too — for
    their own future stakeholder-facing features, not for the internal
    admin panel. This dependency first confirms the caller is internal
    ops staff (SUPER_ADMIN or ADMIN) and only then checks the specific
    permission, so holding a matching code never grants entry to
    `/api/admin/*` on its own. See docs/admin.md.
    """

    def dependency(current_user: User = Depends(get_current_user)) -> User:
        if not user_has_role(current_user, RoleName.SUPER_ADMIN, RoleName.ADMIN):
            raise ForbiddenError("You do not have permission to perform this action.")
        if not user_has_permissions(current_user, *required_codes):
            raise ForbiddenError("You do not have permission to perform this action.")
        return current_user

    return dependency
