# users module

Status: **implemented** (model, repository, and admin service — no
public-facing router of its own; registration/login/me live in `auth`,
admin CRUD is exposed via `app/modules/admin/router.py`).

- `enums.py` — `UserStatus` (ACTIVE, INACTIVE, SUSPENDED, PENDING).
- `models.py` — `User`.
- `repository.py` — `UserRepository`, including `list_paginated()`
  (search/role/status filters) and `count_active_by_role()` (backs the
  last-SUPER_ADMIN guard).
- `schemas.py` — `UserPublic` (external representation; never includes
  `password_hash`), `AdminCreateUserRequest`, `AdminUpdateUserRequest`,
  `AssignRoleRequest`.
- `service.py` — `AdminUserService`: create/update/suspend/activate/
  assign-role, each audit-logged, with guards against (a) suspending or
  demoting the platform's last active SUPER_ADMIN, and (b) a
  non-SUPER_ADMIN actor (i.e. ADMIN) managing a SUPER_ADMIN target at
  all. See [docs/admin.md](../../../../docs/admin.md).

Self-service profile management (a user editing their own name/phone) is
not implemented yet — only via `AdminUserService`, by SUPER_ADMIN (full
access) or ADMIN (view/update/suspend, never a SUPER_ADMIN target), can a
user be updated today.
