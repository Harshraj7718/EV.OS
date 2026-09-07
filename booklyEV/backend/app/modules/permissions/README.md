# permissions module

Status: **implemented** — permission catalog, role → permission matrix,
and the seed data for both. See [docs/authorization.md](../../../../docs/authorization.md)
for the full matrix and rationale.

- `models.py` — `Permission` (`resource`, `action`, unique `code` =
  `"resource.action"`) and `RolePermission` (join table, composite PK,
  `ON DELETE CASCADE` from both `roles` and `permissions`).
- `repository.py` — `PermissionRepository` (includes `unlink()` for revoke).
- `schemas.py` — `PermissionPublic`, `RolePermissionMatrix`.
- `service.py` — `PermissionAdminService`: `get_matrix()`, `grant()`,
  `revoke()` — the runtime mutation layer used by
  `/api/admin/rbac/...` (see [docs/admin.md](../../../../docs/admin.md)).
  SUPER_ADMIN's row is immutable by design.
- `seed.py` — `PERMISSION_DEFINITIONS` (the 22-permission catalog),
  `ROLE_PERMISSIONS` (the *initial* matrix), `seed_permissions()`,
  `seed_role_permissions()`.

The actual authorization *enforcement* — `require_role()` /
`require_permission()` FastAPI dependencies, and the pure `user_has_role`
/ `user_has_permissions` checks they're built on — lives in
`app/core/authorization.py` and `app/api/deps.py`, not here: this module
only owns the *data* (what permissions exist, which roles have them).
