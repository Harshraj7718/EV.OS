# admin module

Status: **implemented** — the admin API surface, shared by SUPER_ADMIN
(full control) and ADMIN (a scoped operational role). See
[docs/admin.md](../../../../docs/admin.md) for the full design.

- `router.py` — each route uses either `require_role(RoleName.SUPER_ADMIN)`
  (things ADMIN must never reach, regardless of permissions: create/
  activate/assign-role for users, RBAC management, audit logs, settings)
  or `require_admin_permission(code)` (things ADMIN's scoped grant
  legitimately covers: view/update/suspend users, view stakeholders, view
  analytics). Aggregates functionality that lives in other modules'
  services (`users.AdminUserService`, `permissions.PermissionAdminService`,
  `audit.AuditService`, `analytics.AnalyticsService`) rather than owning
  business logic itself — this module is the presentation/routing layer
  for the admin panel, not a domain of its own.
- `schemas.py` — `SettingsPublic` (non-secret config only).

Wasn't part of the original 15 scaffolded modules (auth, users, roles,
permissions, investors, riders, businesses, vehicles, fleets, trips,
payments, kyc, notifications, analytics, audit) — added when the
SUPER_ADMIN module was built, since none of those cleanly owned "the
cross-cutting admin control panel."
