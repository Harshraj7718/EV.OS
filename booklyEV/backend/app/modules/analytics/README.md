# analytics module

Status: **implemented, minimal** — real aggregate counts only, no
synthetic/placeholder data. See [docs/admin.md](../../../../docs/admin.md).

- `schemas.py` — `PlatformOverview` (total users, users by role, users by
  status, total roles, total permissions, admin actions in the last 24h).
- `service.py` — `AnalyticsService.get_overview()`: plain aggregate
  queries (`COUNT`/`GROUP BY`) against `users`, `roles`, `permissions`,
  `audit_logs` — no model of its own.
- No `router.py` of its own — exposed via
  `GET /api/admin/analytics/overview` in `app/modules/admin/router.py`
  (SUPER_ADMIN only).

Richer analytics (trip volume, payment totals, fleet utilization, ...)
depend on domain modules (`trips`, `payments`, `fleets`) that don't exist
yet — this module will grow as those do, not before, so it never has to
show fake numbers in the meantime.
