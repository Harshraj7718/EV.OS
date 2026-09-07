# Running Tests

## Backend (pytest)

Needs a reachable PostgreSQL server (same one `DATABASE_URL` points at is
fine — tests use a separate `<database>_test` database, created
automatically on first run, and never touch your dev data: each test runs
in its own transaction/savepoint that's rolled back at the end).

```bash
cd backend
pip install -r requirements-dev.txt
pytest
pytest --cov=app                # with coverage
```

220 tests: `test_health.py` (2), `test_auth.py` (25 — registration, login,
`/me`, refresh rotation, logout, change-password), `test_rbac.py` (7 — all
five roles' allowed/denied permissions, role-gated routes, 401 vs 403),
`test_admin.py` (21 — SUPER_ADMIN-exclusive routes, user CRUD, the
last-SUPER_ADMIN guard, audit logging, RBAC matrix grant/revoke,
stakeholder filtered views, analytics, settings), `test_admin_role.py`
(18 — the ADMIN operational role's exact permission set, every granted
capability, every restriction, and privilege-escalation attempts),
`test_investor.py` (23 — every `/api/investor/*` endpoint, non-INVESTOR
roles denied 403, unauthenticated 401, and explicit Investor-A-cannot-
reach-Investor-B's-data ownership isolation tests), `test_investor_finance.py`
(9 — pure unit tests of the isolated financial calculation functions, no
DB/fixtures), `test_rider.py` (31 — every `/api/rider/*` endpoint,
vehicle-booking and job-acceptance lifecycle, non-RIDER roles denied 403,
unauthenticated 401, and explicit Rider-A-cannot-reach-Rider-B's-data
ownership isolation tests), `test_business.py` (46 — every
`/api/business/*` endpoint, fleet/vehicle/rider-assignment/trip
lifecycles, a database-level partial-unique-index test, non-BUSINESS
roles denied 403, unauthenticated 401, and the five explicit multi-tenant
isolation cases: Business A → own fleet allowed; Business A → Business
B's fleet/vehicle/rider/trip all forbidden), `test_business_analytics.py`
(5 — pure unit tests of the utilization calculation, no DB/fixtures),
`test_security_audit.py` (33 — consolidated cross-cutting security suite:
JWT forgery/tampering/`alg:none`, embedded-role-claim rejection, expired
tokens, refresh-token abuse, a systematic 5-role × 4-module access
matrix, request-body ownership-field injection, and cross-module id type
confusion). See [investor.md](investor.md), [rider.md](rider.md),
[business.md](business.md), and [security-audit.md](security-audit.md)
for the full audit report and authorization matrix.

## Backend lint / type-check

```bash
cd backend
ruff check .
mypy app
```

## Frontend (Vitest + React Testing Library)

```bash
cd frontend
npm install
npm test
```

19 tests: `StakeholderCard.test.tsx` (1), `authorization.test.ts` (12 —
`hasRole`, `hasPermission`, `hasAnyPermission`, `permissionsFor` across
roles, including ADMIN's exact scoped set), `ProtectedRoute.test.tsx`
(6 — proves the route guard never renders protected children or leaks
data for an unauthenticated or wrong-role/permission user; see
[security-audit.md](security-audit.md)).

## Frontend lint / type-check

```bash
cd frontend
npm run lint
npm run typecheck
```

## Via Docker Compose

```bash
docker compose -f docker/docker-compose.yml exec backend pytest
docker compose -f docker/docker-compose.yml exec frontend npm test
```
