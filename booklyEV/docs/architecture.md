# Architecture

## Overview

Booklynk EV is a monorepo with two independently deployable applications
that communicate exclusively over HTTP:

```
booklyEV/
├── frontend/     Next.js 15 + TypeScript + Tailwind CSS
├── backend/      FastAPI + SQLAlchemy + Alembic + PostgreSQL
├── database/     DB init scripts + docs (schema itself lives in SQLAlchemy models)
├── docker/       docker-compose.yml orchestrating postgres, redis, backend, frontend
└── docs/         this documentation
```

## Request flow

```
Frontend (Next.js)
    ↓  fetch, via src/lib/api-client.ts
API (FastAPI routers)
    ↓
Authentication            (JWT verification — implemented: app/api/deps.py get_current_user)
    ↓
Authorization              (require_role / require_permission — implemented: app/core/authorization.py, app/api/deps.py)
    ↓
Services                   (business logic — per module)
    ↓
Repositories                (DB access layer — per module)
    ↓
PostgreSQL                  (via SQLAlchemy ORM + Alembic migrations)
```

Every layer already has a place in the codebase (see "Backend structure"
below). `auth`, `users`, `roles`, `permissions`, `audit`, `analytics`,
`admin`, `investors`, `riders`, and `businesses` are implemented — see
[authentication.md](authentication.md), [authorization.md](authorization.md),
[admin.md](admin.md), [investor.md](investor.md), [rider.md](rider.md),
and [business.md](business.md); remaining modules still need their
`models.py` / `schemas.py` / `repository.py` / `service.py` /
`router.py` filled in.

## Backend structure

```
backend/app/
├── main.py                 FastAPI app factory (CORS, exception handlers, routers)
├── core/
│   ├── config.py            Pydantic Settings — all env vars
│   ├── logging.py           Logging setup
│   ├── database.py          SQLAlchemy engine/session + declarative Base
│   ├── redis.py              Redis client factory (reserved for caching/rate-limiting/queues)
│   ├── security.py           Password hashing + JWT issue/verify
│   ├── authorization.py      user_has_role / user_has_permissions — pure RBAC checks
│   └── exceptions.py         AppError hierarchy + consistent JSON error responses
├── api/
│   ├── deps.py                get_current_user (401), require_role() / require_permission() (403) — see authorization.md
│   ├── health.py              GET /api/health
│   └── v1/router.py            Aggregator for future versioned domain routers
└── modules/                    One package per business domain (see below)
    ├── auth/     implemented — register/login/refresh/logout/me/change-password
    ├── users/    implemented — User model + repository + AdminUserService
    ├── roles/    implemented — fixed role catalog + seed
    ├── permissions/  implemented — permission catalog + matrix + seed + admin grant/revoke
    ├── audit/    implemented — AuditLog model + admin action logging
    ├── analytics/  implemented — real aggregate platform counts
    ├── admin/    implemented — SUPER_ADMIN-only API aggregator (/api/admin/*)
    ├── investors/  implemented — INVESTOR self-service module (/api/investor/*)
    ├── riders/  implemented — RIDER self-service module (/api/rider/*)
    ├── businesses/  implemented — BUSINESS Fleet SaaS module (/api/business/*)
    ├── vehicles/  fleets/  trips/
    ├── payments/  kyc/
    ├── notifications/
```

`auth`, `users`, `roles`, `permissions`, `audit`, `analytics`, `admin`,
`investors`, `riders`, and `businesses` are implemented — see
[authentication.md](authentication.md), [authorization.md](authorization.md),
[admin.md](admin.md), [investor.md](investor.md), [rider.md](rider.md),
and [business.md](business.md) for the full design. Every other
`modules/<name>/` package still contains only `__init__.py` and a
`README.md` describing the layered files (`models.py`, `schemas.py`,
`repository.py`, `service.py`, `router.py`) it will get when implemented.

## Why this shape

- **Layered separation (router → service → repository → model)** keeps
  HTTP concerns, business rules, and persistence independently testable and
  swappable — e.g. a repository can move from raw SQLAlchemy to a cached
  read path without touching the service or router.
- **One package per domain** means growth (charging, GPS/IoT, AI) adds new
  `modules/<name>/` packages instead of growing existing files.
- **`Base.metadata` as the single schema source of truth**: Alembic
  autogenerates migrations from the SQLAlchemy models, so schema and code
  never drift.
- **Authentication and authorization are separate layers on purpose**:
  `get_current_user` only answers "who is this" (401 if it can't tell);
  `require_role`/`require_permission` build on top of it to answer "can
  they do this" (403 if not). A future domain module never has to
  reimplement either — it just adds `Depends(require_permission("x.y"))`.
  `core/redis.py` remains unused, reserved for caching/rate-limiting.

## Frontend structure

```
frontend/src/
├── app/
│   ├── layout.tsx, page.tsx, error.tsx, not-found.tsx, globals.css
│   ├── login/  register/        forms calling the auth API
│   ├── dashboard/                 protected: any authenticated user
│   ├── admin/                     protected: SUPER_ADMIN & ADMIN — layout.tsx guards
│   │   ├── page.tsx                 Overview
│   │   ├── users/  investors/  riders/  businesses/    real, User-backed
│   │   ├── vehicles/  fleets/  trips/  payments/  kyc/  honest placeholders (no backend module)
│   │   ├── rbac/                    live-editable permission matrix
│   │   ├── audit-logs/  analytics/  settings/
│   ├── investor/                  protected: INVESTOR only — layout.tsx guards, see investor.md
│   │   ├── page.tsx                 redirects to dashboard/
│   │   ├── dashboard/  investments/  assets/  portfolio/  earnings/
│   │   ├── transactions/  payouts/  kyc/  documents/  profile/
│   ├── rider/                     protected: RIDER only — layout.tsx guards, see rider.md
│   │   ├── page.tsx                 redirects to dashboard/
│   │   ├── dashboard/  vehicles/  bookings/  current-vehicle/  trips/
│   │   ├── jobs/  earnings/  payments/  kyc/  documents/  profile/  support/
│   └── business/                  protected: BUSINESS only — layout.tsx guards, see business.md
│       ├── page.tsx                 redirects to dashboard/
│       ├── dashboard/  profile/  fleets/  vehicles/  riders/  assignments/
│       ├── trips/  revenue/  analytics/  documents/  settings/
├── components/
│   ├── layout/          Header (auth-aware nav), Footer
│   ├── ui/               StakeholderCard, ApiStatus
│   ├── auth/              ProtectedRoute — client-side route guard
│   ├── admin/              DataTable, SearchInput, FilterSelect, Pagination,
│   │                        StatusBadge, StakeholderTable, EmptyState — see admin.md
│   │                        (DataTable/Pagination/StatusBadge/FilterSelect reused by
│   │                         investor/, rider/, and business/ too)
│   ├── investor/            InvestorSidebar, NeedsProfilePrompt — see investor.md
│   ├── rider/                RiderSidebar, NeedsProfilePrompt — see rider.md
│   └── business/             BusinessSidebar, NeedsProfilePrompt — see business.md
├── lib/
│   ├── api-client.ts     fetch wrapper: bearer token, refresh-on-401, ApiError
│   ├── env.ts             typed NEXT_PUBLIC_* env access
│   ├── auth/
│   │   ├── types.ts          Role/Permission unions, AuthUser (mirrors backend)
│   │   ├── token-storage.ts   localStorage read/write for access+refresh tokens
│   │   ├── auth-context.tsx   AuthProvider/useAuth() — login/register/logout, hydrates from /api/auth/me
│   │   └── authorization.ts   hasRole/hasPermission — UI hints only, see authorization.md
│   ├── admin/
│   │   ├── types.ts           Page<T>, AuditLogEntry, PlatformOverview, ...
│   │   └── api.ts              typed wrapper over every /api/admin/* endpoint
│   ├── investor/
│   │   ├── types.ts           Page<T>, InvestorProfile, EVAsset, Investment, ... (mirrors backend)
│   │   └── api.ts              typed wrapper over every /api/investor/* endpoint + currency formatting
│   ├── rider/
│   │   ├── types.ts           Page<T>, RiderProfile, Vehicle, Booking, Job, Trip, ... (mirrors backend)
│   │   └── api.ts              typed wrapper over every /api/rider/* endpoint + currency formatting
│   └── business/
│       ├── types.ts           Page<T>, BusinessProfile, Fleet, Vehicle, Trip, ... (mirrors backend)
│       └── api.ts              typed wrapper over every /api/business/* endpoint + currency formatting
└── types/               Shared TS types (mirrors backend response shapes)
```

## Infrastructure

- **PostgreSQL 16** — primary datastore.
- **Redis 7** — reserved for caching, rate limiting, and background job
  queues (payments, notifications); not used by any endpoint yet.
- **Docker Compose** (`docker/docker-compose.yml`) — runs postgres, redis,
  backend (with `--reload`), and frontend together for local development
  and verification.

## What's deferred (by design)

Authentication, authorization, the SUPER_ADMIN panel, the INVESTOR
module, the RIDER module, and the BUSINESS (Fleet SaaS) module
(`auth`/`users`/`roles`/`permissions`/`audit`/`analytics`/`admin`/
`investors`/`riders`/`businesses`) are implemented — see
[authentication.md](authentication.md), [authorization.md](authorization.md),
[admin.md](admin.md), [investor.md](investor.md), [rider.md](rider.md),
and [business.md](business.md). Still **not** implemented:
forgot/reset-password and email/phone verification endpoints (the
`VerificationToken` table reserves their schema), payments via a real
gateway, or admin-side KYC/business verification — the `/admin`
dashboard has real navigation entries for vehicles/fleets/trips/payments/
kyc but shows an honest empty state rather than fake data (see admin.md;
note that "vehicles"/"fleets"/"trips" there is a distinct, still-unbuilt
admin-wide concept from the investor module's `EVAsset`, the rider
module's own `Trip`, or the business module's own `Fleet`/`Vehicle`/
`Trip` — each stakeholder module owns its own version of these concepts
where it needed one, and nothing here reuses another module's table
across a stakeholder boundary except the rider module's deliberate reuse
of `EVAsset`). The architecture above reserves the remaining gaps; a
later phase fills them in without restructuring anything here.
