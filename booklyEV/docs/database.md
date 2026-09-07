# Database

## Engine

PostgreSQL 16, accessed via SQLAlchemy 2.0 (sync `psycopg` driver) and
versioned with Alembic. See [`database/README.md`](../database/README.md)
for how `database/init/` relates to Alembic.

## Current schema

`Base.metadata` in `backend/app/core/database.py` is the single source of
truth; each module's `models.py` is imported into `backend/alembic/env.py`
so autogenerate can see it.

| Table | Module | Notes |
|---|---|---|
| `roles` | `roles` | Fixed catalog: SUPER_ADMIN, ADMIN, INVESTOR, RIDER, BUSINESS. Seeded, not user-editable. |
| `users` | `users` | `email`/`phone` unique; `role_id` FK → `roles.id`; `status` (ACTIVE/INACTIVE/SUSPENDED/PENDING); `password_hash` never exposed via the API. |
| `refresh_tokens` | `auth` | One row per issued refresh token. Stores a SHA-256 digest, not the raw token. Rotated (revoked + replaced) on every `/api/auth/refresh` call; `ON DELETE CASCADE` from `users`. |
| `verification_tokens` | `auth` | Structural placeholder for future forgot-password/reset-password/email-verify/phone-verify flows — no endpoint uses it yet. `ON DELETE CASCADE` from `users`. |
| `permissions` | `permissions` | Fixed catalog of `resource.action` capabilities (22 total). Seeded; rows never added/removed at runtime. |
| `role_permissions` | `permissions` | Join table, composite PK (`role_id`, `permission_id`), `ON DELETE CASCADE` from both sides. Seeded initially, then mutable at runtime by SUPER_ADMIN via `/api/admin/rbac/...` — see [authorization.md](authorization.md) and [admin.md](admin.md). |
| `audit_logs` | `audit` | One row per sensitive SUPER_ADMIN write (`user.create`, `permission.grant`, ...). `actor_user_id` is `ON DELETE SET NULL` (not CASCADE) so the trail survives the actor being removed. See [admin.md](admin.md). |
| `investor_profiles` | `investors` | One per INVESTOR user; `user_id` FK unique + `ON DELETE CASCADE`. Holds KYC-relevant identity fields and `kyc_status`. See [investor.md](investor.md). |
| `ev_assets` | `investors` | EV assets available for investment. `owner_investor_profile_id` is `ON DELETE SET NULL`, written only by `InvestorService.invest()`. Seeded baseline data via `seed_ev_assets()`. |
| `investments` | `investors` | `investor_profile_id` `ON DELETE CASCADE`; `ev_asset_id` FK (no cascade). `amount` is always copied from the asset's price at investment time, never client-supplied. |
| `investor_earnings` | `investors` | `investor_profile_id`/`investment_id` `ON DELETE CASCADE`; `paid_out_id` FK → `payouts.id`, `ON DELETE SET NULL`. Only ever written by `InvestorService.accrue_earning_dev()` — no API endpoint creates a row here (system-generated only, see investor.md). |
| `payouts` | `investors` | `investor_profile_id` `ON DELETE CASCADE`. `payout_method` defaults to the literal `"MOCK_BANK_TRANSFER"` — no real gateway. |
| `investor_transactions` | `investors` | `investor_profile_id` `ON DELETE CASCADE`. One row per investment/earning-credit/payout — a full ledger. |
| `investor_kyc_documents` | `investors` | `investor_profile_id` `ON DELETE CASCADE`. `file_reference` stores a mock identifier only — no real file storage. |
| `rider_profiles` | `riders` | One per RIDER user; `user_id` FK unique + `ON DELETE CASCADE`. Holds KYC-relevant identity + driving license fields and `kyc_status`. See [rider.md](rider.md). |
| `jobs` | `riders` | Job-marketplace postings. `assigned_rider_profile_id` is `ON DELETE SET NULL`, written only by `RiderService.accept_job()`. Seeded baseline data via `seed_jobs()`. |
| `vehicle_bookings` | `riders` | `rider_profile_id` `ON DELETE CASCADE`; `ev_asset_id` FK → the investor module's `ev_assets.id` (no cascade) — riders book the same fleet investors own, never writing back to it. |
| `trips` | `riders` | `rider_profile_id` `ON DELETE CASCADE`; `job_id` FK → `jobs.id`, `ON DELETE CASCADE`, unique (one trip per job); `vehicle_booking_id` FK → `vehicle_bookings.id`. Only ever written by `RiderService.complete_job()`. |
| `rider_earnings` | `riders` | `rider_profile_id` `ON DELETE CASCADE`; `trip_id` FK → `trips.id`, `ON DELETE CASCADE`, unique (one earning per trip). Created `ACCRUED` then immediately mock-settled `PAID` in the same request — see [rider.md](rider.md). |
| `rider_kyc_documents` | `riders` | `rider_profile_id` `ON DELETE CASCADE`. `file_reference` stores a mock identifier only — no real file storage. |
| `business_profiles` | `businesses` | One per BUSINESS user; `user_id` FK unique + `ON DELETE CASCADE`. Holds business identity fields and `verification_status`. See [business.md](business.md). |
| `business_documents` | `businesses` | `business_profile_id` `ON DELETE CASCADE`. `file_reference` stores a mock identifier only — no real file storage. |
| `fleets` | `businesses` | `business_profile_id` `ON DELETE CASCADE`. `fleet_code` globally unique. |
| `vehicles` | `businesses` | `business_profile_id` `ON DELETE CASCADE`. `registration_number` globally unique. A business's own private inventory — **not** the investor module's `ev_assets`. |
| `fleet_vehicles` | `businesses` | The assign/unassign join between `fleets` and `vehicles`; `business_profile_id` denormalized directly (all three FKs `ON DELETE CASCADE`). A **partial unique index** (`vehicle_id` WHERE `status='ACTIVE'`) enforces at the database level that a vehicle can only be actively assigned once — see [business.md](business.md). |
| `business_rider_assignments` | `businesses` | `business_profile_id` `ON DELETE CASCADE`; `rider_profile_id` FK → the rider module's `rider_profiles.id`, `ON DELETE CASCADE`. Same partial-unique-index pattern (`rider_profile_id` WHERE `status='ACTIVE'`) so a rider can only be actively assigned to one business at a time. |
| `business_trips` | `businesses` | `business_profile_id` `ON DELETE CASCADE`; denormalizes `fleet_id`/`vehicle_id`/`rider_profile_id` directly (not only reachable via `fleet_vehicle_id`/`rider_assignment_id`) so filtering never requires a join. Only ever written by `BusinessService.log_trip()`. |
| `business_revenue` | `businesses` | `business_profile_id` `ON DELETE CASCADE`; `trip_id` FK → `business_trips.id`, `ON DELETE CASCADE`, unique (one revenue row per trip). Created in the same request as the `Trip` it recognizes. |

Not implemented yet: any table for real payments (a live gateway) — the
`/admin` dashboard's Payments section is an honest "not implemented yet"
placeholder rather than fake data (see [admin.md](admin.md)).

## Running migrations

```bash
cd backend
alembic upgrade head              # apply all migrations
alembic revision --autogenerate -m "add users table"   # generate a new one after adding models
alembic downgrade -1              # roll back one revision
alembic history                   # list revisions
```

Via Docker Compose:

```bash
docker compose -f docker/docker-compose.yml exec backend alembic upgrade head
```

## Seed data

`python -m app.seed` (idempotent) seeds the five fixed roles, the 22
fixed permissions, the role → permission matrix, 5 baseline `ev_assets`
rows, and 5 baseline `jobs` rows, in that order. The business module has
no baseline seed data — a business's fleets/vehicles are private to it
and created by the business itself, not shared platform inventory. Via
Docker Compose:

```bash
docker compose -f docker/docker-compose.yml exec backend python -m app.seed
```

There is no seed data for `users` — accounts are created through
`POST /api/auth/register`, which always assigns the RIDER role (see
[architecture.md](architecture.md)).

`python -m app.modules.investors.dev_seed` is a **separate, dev-only**
script (not part of `app.seed`) that simulates one month's earning
accrual for every `ACTIVE` investment — it depends on real investments
already existing, unlike the one-time baseline data above. See
[investor.md](investor.md). The rider module needs no equivalent script:
a rider's income is realized directly by completing a real job through
the API, not by a periodic system process — see [rider.md](rider.md).
