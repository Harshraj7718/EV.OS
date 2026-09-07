# Booklynk EV

**One Platform. Three Stakeholders. Infinite Possibilities.**

The Operating System for India's EV economy — connecting **Investors**
(passive income from EV assets), **Riders** (affordable, maintenance-free
mobility), and **Businesses** (fleet SaaS), with an internal **Admin /
Super Admin** system.

## Status

**Phase 1 (foundation)**, **Phase 2 (authentication)**, **Phase 3
(RBAC)**, **Phase 4 (SUPER_ADMIN module)**, **Phase 5 (ADMIN operational
role)**, **Phase 6 (INVESTOR module)**, **Phase 7 (RIDER module)**,
**Phase 8 (BUSINESS / Fleet SaaS module)**, and **Phase 9 (security &
RBAC audit)** are done. Frontend, backend, database, Docker, health
check, logging, error handling, and CORS are fully wired.

- **Auth** — JWT register/login/refresh/logout/me/change-password,
  secure password hashing, rotated + revocable refresh tokens. See
  [docs/authentication.md](docs/authentication.md).
- **RBAC** — 5 roles (SUPER_ADMIN, ADMIN, INVESTOR, RIDER, BUSINESS), a
  22-permission catalog (`resource.action`), a seeded role → permission
  matrix, and reusable `require_role()` / `require_permission()` FastAPI
  dependencies (401 unauthenticated, 403 unauthorized). See
  [docs/authorization.md](docs/authorization.md) for the full matrix.
- **Admin panel** — one shared backend module (`/api/admin/*`), two
  separate frontend route trees. **SUPER_ADMIN** (`/super-admin`) has
  full control: user management (create/update/suspend/activate/assign-
  role, any role), a live-editable RBAC matrix, audit logs, real
  analytics, and read-only settings. **ADMIN** (`/admin`) is a scoped
  internal-operations role with its own panel: view/update/suspend
  users, read-only Investor/Rider/Business views, view/update on
  vehicles & trips, view fleets & payments, verify KYC, view analytics —
  and is explicitly walled off from managing SUPER_ADMIN, RBAC, audit
  logs, and settings (those pages don't exist under `/admin` at all),
  with dedicated tests for every privilege-escalation attempt.
  Vehicles/Fleets/Trips/Payments/KYC are present as honest "not
  implemented yet" sections — no backing domain model exists for them
  yet. See [docs/admin.md](docs/admin.md).

- **Investor module** (`/investor`) — passive income for INVESTOR
  accounts: create a profile, submit KYC documents, browse EV investment
  opportunities, invest (settles instantly via a clearly-marked
  development/mock payment state — no real gateway), track owned EV
  assets, portfolio summary and ROI, earnings (system-generated only),
  request payouts, and a full transaction ledger. Ownership is
  structurally enforced end-to-end — every query is scoped to the
  authenticated caller's own investor profile, never to a client-supplied
  id — with dedicated tests proving one investor can never reach
  another's data. See [docs/investor.md](docs/investor.md).

- **Rider module** (`/rider`) — affordable mobility for RIDER accounts:
  complete a profile, submit KYC documents (driving license included),
  browse and book a deployed EV from the same fleet investors own (never
  writing back to investor-owned fields), track the current vehicle,
  accept and complete jobs from a marketplace (settles instantly via a
  clearly-marked development/mock state — no real gateway or dispatch
  system), trip history, earnings realized the moment a job completes,
  and a payment history. Ownership is structurally enforced end-to-end
  the same way as the investor module, with dedicated tests proving one
  rider can never reach another's profile, trips, bookings, earnings,
  payments, documents, or jobs. See [docs/rider.md](docs/rider.md).

- **Business module** (`/business`) — Fleet SaaS for BUSINESS accounts:
  create a business profile and submit verification documents, create
  and activate/deactivate fleets, add vehicles to a private inventory
  (a genuinely new model, not a reuse of the investor module's EV
  assets), assign vehicles into fleets and recruit riders (both with
  unassign lifecycles), log trips and see revenue recognized
  automatically, and full fleet analytics (vehicles, active riders,
  trips, revenue, utilization). This is a genuinely **multi-tenant**
  system: every business-owned table carries the owning business's id
  directly, every read/write is scoped through it, and two database-level
  partial unique indexes (one active fleet assignment per vehicle, one
  active assignment per rider) back up the service-layer checks — with
  dedicated tests proving Business A can never reach Business B's
  fleets, vehicles, riders, or trips. See
  [docs/business.md](docs/business.md).

- **Security & RBAC audit** — a complete audit of every API endpoint and
  frontend protected route against 18 threat categories (authentication
  bypass, IDOR, privilege escalation, JWT manipulation, cross-tenant
  access, and more). No broken-access-control vulnerability was found;
  two hardening gaps were fixed (a production-unsafe default `SECRET_KEY`
  now fails startup instead of silently running, and password fields
  gained an upper length bound). Backed by a new 33-test cross-cutting
  regression suite plus a full authorization matrix. See
  [docs/security-audit.md](docs/security-audit.md).

Remaining domain modules (vehicles/fleets/trips as standalone admin-wide
concepts, payments via a real gateway, kyc verification, notifications)
are scaffolded as empty packages — structurally present, not yet
implemented as their own domain models.

## Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15, TypeScript, Tailwind CSS, React 19 |
| Backend | FastAPI, Python 3.12, Pydantic v2, SQLAlchemy 2.0 |
| Database | PostgreSQL 16 |
| Cache / future queues | Redis 7 |
| Migrations | Alembic |
| Infra | Docker, Docker Compose |

## Quick start

```bash
cp docker/.env.example docker/.env
docker compose -f docker/docker-compose.yml up --build
```

Then, in a second terminal:

```bash
docker compose -f docker/docker-compose.yml exec backend alembic upgrade head
docker compose -f docker/docker-compose.yml exec backend python -m app.seed
```

- Frontend: http://localhost:3000
- API health check: http://localhost:8000/api/health
- API docs (Swagger): http://localhost:8000/docs

## Documentation

- [Architecture](docs/architecture.md)
- [Authentication](docs/authentication.md)
- [Authorization (RBAC)](docs/authorization.md)
- [Admin panel (SUPER_ADMIN & ADMIN)](docs/admin.md)
- [Investor module](docs/investor.md)
- [Rider module](docs/rider.md)
- [Business module](docs/business.md)
- [Security & RBAC audit](docs/security-audit.md)
- [Deploying the backend to Render](docs/deployment.md)
- [Deploying the frontend to Vercel (5 portal links)](docs/vercel-deployment.md)
- [Setup instructions](docs/setup.md)
- [Environment variables](docs/environment-variables.md)
- [Database & migrations](docs/database.md)
- [Running tests](docs/testing.md)
- [Project structure](docs/project-structure.md)
