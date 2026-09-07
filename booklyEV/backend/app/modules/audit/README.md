# audit module

Status: **implemented** — immutable log of sensitive admin actions. See
[docs/admin.md](../../../../docs/admin.md).

- `models.py` — `AuditLog` (`actor_user_id` FK `ON DELETE SET NULL` so the
  trail survives the actor being removed; `action`, `target_type`,
  `target_id`, `details` JSONB; `created_at` only — no `updated_at`, rows
  are never modified after being written).
- `repository.py` — `AuditLogRepository`: `create()`, `list_paginated()`.
- `service.py` — `AuditService`: `log()` (called by other modules'
  services in the *same DB transaction* as the change being logged, so
  they commit or roll back together) and `list_logs()` (paginated read,
  exposed via `GET /api/admin/audit-logs`).
- No `router.py` of its own — reads are exposed through
  `app/modules/admin/router.py`, since only SUPER_ADMIN can view the log.

No endpoint writes to this table directly; every write goes through
another module's service calling `AuditService.log()`.
