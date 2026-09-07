# Project Structure

```
booklyEV/
├── frontend/                      Next.js 15 + TypeScript + Tailwind CSS
│   ├── src/
│   │   ├── proxy.ts                   portal-scoped Vercel deployments only — see vercel-deployment.md
│   │   ├── app/
│   │   │   ├── layout.tsx, page.tsx, error.tsx, not-found.tsx, globals.css
│   │   │   ├── login/  register/    forms calling the auth API
│   │   │   ├── dashboard/             protected: any authenticated user
│   │   │   ├── super-admin/           protected: SUPER_ADMIN only — see admin.md
│   │   │   │   ├── page.tsx             Overview (real aggregate stats)
│   │   │   │   ├── users/  investors/  riders/  businesses/    User-backed, real
│   │   │   │   ├── vehicles/ fleets/ trips/ payments/ kyc/       honest placeholders
│   │   │   │   ├── rbac/                 live-editable permission matrix
│   │   │   │   ├── audit-logs/  analytics/  settings/
│   │   │   ├── admin/                 protected: ADMIN only — scoped subset, see admin.md
│   │   │   │   ├── page.tsx             Overview (real aggregate stats)
│   │   │   │   ├── users/  investors/  riders/  businesses/    User-backed, real (read-only for the latter three)
│   │   │   │   ├── vehicles/ fleets/ trips/ payments/ kyc/       honest placeholders
│   │   │   │   └── analytics/           no rbac/, audit-logs/, or settings/ — SUPER_ADMIN-only, don't exist here
│   │   │   ├── investor/              protected: INVESTOR only — see investor.md
│   │   │   │   ├── page.tsx             redirects to dashboard/
│   │   │   │   ├── dashboard/  investments/  assets/  portfolio/  earnings/
│   │   │   │   ├── transactions/  payouts/  kyc/  documents/  profile/
│   │   │   ├── rider/                 protected: RIDER only — see rider.md
│   │   │   │   ├── page.tsx             redirects to dashboard/
│   │   │   │   ├── dashboard/  vehicles/  bookings/  current-vehicle/  trips/
│   │   │   │   ├── jobs/  earnings/  payments/  kyc/  documents/  profile/  support/
│   │   │   └── business/              protected: BUSINESS only — see business.md
│   │   │       ├── page.tsx             redirects to dashboard/
│   │   │       ├── dashboard/  profile/  fleets/  vehicles/  riders/  assignments/
│   │   │       ├── trips/  revenue/  analytics/  documents/  settings/
│   │   ├── components/
│   │   │   ├── layout/               Header (auth-aware nav), Footer
│   │   │   ├── ui/                    StakeholderCard, ApiStatus (+ test)
│   │   │   ├── auth/                  ProtectedRoute — client-side route guard
│   │   │   ├── admin/                  SuperAdminSidebar, AdminSidebar, DataTable, SearchInput,
│   │   │   │                           FilterSelect, Pagination, StatusBadge, StakeholderTable, EmptyState
│   │   │   ├── investor/               InvestorSidebar, NeedsProfilePrompt
│   │   │   ├── rider/                   RiderSidebar, NeedsProfilePrompt
│   │   │   └── business/                BusinessSidebar, NeedsProfilePrompt
│   │   ├── lib/
│   │   │   ├── api-client.ts         bearer token + refresh-on-401 fetch wrapper
│   │   │   ├── env.ts                 typed NEXT_PUBLIC_* env access
│   │   │   ├── auth/                   types.ts, token-storage.ts, auth-context.tsx,
│   │   │   │                           authorization.ts (+ test) — see authorization.md
│   │   │   ├── admin/                  types.ts, api.ts — typed wrapper over /api/admin/*
│   │   │   ├── investor/               types.ts, api.ts — typed wrapper over /api/investor/*
│   │   │   ├── rider/                   types.ts, api.ts — typed wrapper over /api/rider/*
│   │   │   └── business/                types.ts, api.ts — typed wrapper over /api/business/*
│   │   └── types/                    shared TS types
│   ├── package.json / tsconfig.json / tailwind.config.ts / eslint.config.mjs / vitest.config.ts
│   ├── Dockerfile                    multi-stage, Next.js standalone output
│   └── .env.example
│
├── backend/                        FastAPI + SQLAlchemy + Alembic
│   ├── app/
│   │   ├── main.py                   app factory: CORS, exception handlers, routers
│   │   ├── core/                     config, logging, database, redis, security,
│   │   │                             authorization.py (RBAC checks), validation.py,
│   │   │                             pagination.py, exceptions
│   │   ├── api/                      deps.py (get_current_user — 401; require_role() /
│   │   │                             require_permission() — 403), health.py, v1/router.py
│   │   └── modules/
│   │       ├── auth/                   implemented — register/login/refresh/logout/me/change-password
│   │       ├── users/                  implemented — User model + repository + AdminUserService
│   │       ├── roles/                  implemented — fixed role catalog + seed
│   │       ├── permissions/            implemented — catalog + matrix + seed + admin grant/revoke
│   │       ├── audit/                  implemented — AuditLog model + admin action logging
│   │       ├── analytics/              implemented — real aggregate platform counts
│   │       ├── admin/                  implemented — SUPER_ADMIN-only API aggregator (/api/admin/*)
│   │       ├── investors/              implemented — INVESTOR self-service module (/api/investor/*)
│   │       ├── riders/                 implemented — RIDER self-service module (/api/rider/*)
│   │       ├── businesses/             implemented — BUSINESS Fleet SaaS module (/api/business/*)
│   │       └── vehicles/  fleets/  trips/  payments/  kyc/  notifications/
│   │                                 — scaffolded, not implemented (distinct, still-unbuilt
│   │                                 admin-wide concepts — not the same tables as the investor/
│   │                                 rider/business modules' own Vehicle/Fleet/Trip models)
│   ├── alembic/                      env.py wired to app settings + Base.metadata
│   ├── tests/                        conftest.py (transactional Postgres fixtures + role/user
│   │                                 helpers), test_health.py, test_auth.py, test_rbac.py,
│   │                                 test_admin.py, test_admin_role.py, test_investor.py,
│   │                                 test_investor_finance.py, test_rider.py, test_business.py,
│   │                                 test_business_analytics.py (187 tests)
│   ├── app/seed.py                   `python -m app.seed` — seeds roles, permissions, matrix,
│   │                                 EV assets, jobs; `app/modules/investors/dev_seed.py` —
│   │                                 dev-only earnings accrual, see investor.md
│   ├── requirements.txt / requirements-dev.txt / pyproject.toml (pytest/ruff/mypy config)
│   ├── Dockerfile
│   └── .env.example
│
├── database/
│   ├── init/                        SQL run once on first Postgres container init
│   └── README.md
│
├── docker/
│   ├── docker-compose.yml            postgres + redis + backend + frontend
│   └── .env.example
│
├── docs/                            this documentation set
│
├── .gitignore
└── README.md
```

## Module skeleton shape

Every unimplemented package under `backend/app/modules/` follows the same
layered shape once it's built:

```
modules/<name>/
├── __init__.py
├── models.py         SQLAlchemy ORM models
├── schemas.py         Pydantic request/response schemas
├── repository.py      DB access layer
├── service.py          Business logic
└── router.py            FastAPI routes (registered in app/api/v1/router.py)
```
