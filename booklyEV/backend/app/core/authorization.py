"""Reusable RBAC checks.

The backend is the sole source of truth for authorization: every check
here re-derives the user's role and permissions from the database (via
`current_user.role`, loaded fresh by `get_current_user` on every request).
Nothing a client sends — a JWT claim, a request body field, a query
param — is ever trusted as an authorization input.
"""
from app.modules.roles.enums import RoleName
from app.modules.users.models import User


def user_has_role(user: User, *allowed_roles: RoleName) -> bool:
    return user.role.name in allowed_roles


def user_permission_codes(user: User) -> set[str]:
    return {permission.code for permission in user.role.permissions}


def user_has_permissions(user: User, *required_codes: str) -> bool:
    return set(required_codes).issubset(user_permission_codes(user))
