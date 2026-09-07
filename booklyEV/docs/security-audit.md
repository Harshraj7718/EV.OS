# Security & RBAC Audit

A complete audit of authentication, authorization, and multi-tenant
isolation across every API endpoint and every frontend protected route
in the Booklynk EV MVP. Covers the 18 threat categories requested:
authentication bypass, authorization bypass, IDOR, privilege escalation,
role/permission manipulation, cross-user/investor/rider/business/fleet
access, JWT manipulation, expired tokens, refresh token abuse, direct API
access, frontend route bypass, request-body ownership manipulation, and
URL id manipulation.

**Result: no broken-access-control vulnerability was found in the
existing code.** Every module was already built (across four prior
implementation phases) around the same ownership-isolation discipline
documented in [admin.md](admin.md), [investor.md](investor.md),
[rider.md](rider.md), and [business.md](business.md); this audit's job
was to verify that discipline empirically rather than take it on faith,
and to harden two real gaps found during review — see §9 and §10.

---

## 1. Architecture

```
Frontend (Next.js, localStorage bearer tokens)
    ↓ fetch, Authorization: Bearer <access_token>
API (FastAPI routers)
    ↓
get_current_user           JWT signature + expiry + type verified (PyJWT,
                            algorithms=["HS256"] pinned — no "alg:none",
                            no algorithm confusion); user re-loaded from
                            DB by `sub` on every request; account status
                            re-checked on every request (instant effect
                            for suspension, even against an unexpired
                            token)
    ↓
require_role / require_permission / require_admin_permission
                            403 if the DB-loaded role/permissions don't
                            match — never reads the token's own `role`
                            claim (see §9, embedded-claim test)
    ↓
Service layer               get_profile_for_user(user) /
                            get_business_for_user(user) is the *only*
                            way any service method learns "which
                            investor/rider/business" — never a
                            client-supplied id
    ↓
Repository layer            every method touching an owned table takes
                            the owner id as a mandatory filter; get_owned()
                            returns None for both "doesn't exist" and
                            "not yours" — 404 either way, no IDOR signal
    ↓
PostgreSQL                  FK constraints + two partial unique indexes
                            enforcing tenant invariants at the DB level
                            (see §7)
```

One monorepo, two deployables (`frontend/`, `backend/`) communicating
only over HTTP. See [architecture.md](architecture.md) for the full
non-security architecture writeup.

---

## 2. Roles

Fixed catalog, seeded and not user-editable except via
`POST/DELETE /api/admin/rbac/roles/{role}/permissions/{code}`
(SUPER_ADMIN only, and SUPER_ADMIN's own matrix is immutable — see §9):

| Role | Nature |
|---|---|
| `SUPER_ADMIN` | Full platform control |
| `ADMIN` | Scoped internal-operations role — view/update/suspend users, read-only stakeholder views, platform analytics; explicitly walled off from managing SUPER_ADMIN, RBAC, audit logs, settings |
| `INVESTOR` | Passive-income stakeholder — owns an `InvestorProfile` |
| `RIDER` | Gig-mobility stakeholder — owns a `RiderProfile` |
| `BUSINESS` | Fleet-SaaS tenant — owns a `BusinessProfile` |

A user has exactly one role (`users.role_id`, `NOT NULL`). Public
registration (`POST /api/auth/register`) always assigns `RIDER`
(`DEFAULT_SELF_SIGNUP_ROLE`); the request schema has no `role` field at
all, so a client-supplied `role` in that body is silently dropped by
Pydantic, not merely overridden (verified: `test_register_payload_role_field_is_ignored`,
plus the pre-existing `test_register_rejects_client_supplied_role`).
Any other role can only be assigned via `POST /api/admin/users` or
`POST /api/admin/users/{id}/role`, both `require_role(SUPER_ADMIN)` —
role-gated, not permission-gated, so no permission grant can ever open
this path (see §9's permission-manipulation tests).

---

## 3. Permissions

22 fixed `resource.action` codes (`app/modules/permissions/seed.py`),
synced — not just additively granted — to each role on every seed run,
so the running database can never drift from `ROLE_PERMISSIONS`. Full
matrix in [authorization.md](authorization.md). `SUPER_ADMIN` holds every
current permission by data (`ALL_PERMISSION_CODES`), not a code-level
bypass — confirmed by reading `seed_role_permissions()`, which computes
`desired_codes = set(ALL_PERMISSION_CODES)` for `SUPER_ADMIN` specifically
so it self-heals if a new permission is ever added.

Three enforcement layers wrap permission codes (`app/api/deps.py`):

- **`require_role(*roles)`** — role membership only.
- **`require_permission(*codes)`** — permission-code membership only.
  Deliberately *not* used for `/api/admin/*`, `/api/investor/*`,
  `/api/rider/*`, or `/api/business/*`, because permission codes overlap
  across stakeholder roles by design (e.g. `payment.read` is held by both
  INVESTOR and RIDER) — using it there would let one stakeholder role
  reach another's dashboard.
- **`require_admin_permission(*codes)`** — first confirms the caller is
  `SUPER_ADMIN`/`ADMIN`, *then* checks the code. This is what actually
  keeps `/api/admin/*` closed to INVESTOR/RIDER/BUSINESS despite those
  roles holding some of the same permission codes ADMIN uses.

Every one of `/api/investor/*`, `/api/rider/*`, `/api/business/*` uses
plain **role**-gating (`require_role(RoleName.X)`) for exactly this
reason — see each module's router docstring.

---

## 4. APIs

129 endpoints across 5 routers, every one gated (none reachable
unauthenticated except the 4 public auth endpoints):

| Router | Prefix | Gate | Endpoint count |
|---|---|---|---|
| `auth` | `/api/auth` | Public (register/login/refresh/logout) + `get_current_user` (me, change-password) | 6 |
| `admin` | `/api/admin` | `require_role(SUPER_ADMIN)` or `require_admin_permission(code)` per route | 16 |
| `investors` | `/api/investor` | `require_role(INVESTOR)` on every route | 15 |
| `riders` | `/api/rider` | `require_role(RIDER)` on every route | 18 |
| `businesses` | `/api/business` | `require_role(BUSINESS)` on every route | 25 |

Full per-endpoint tables already exist and remain accurate:
[admin.md](admin.md#api-apiadmin), [investor.md](investor.md#api-apiinvestor),
[rider.md](rider.md#api-apirider), [business.md](business.md#api-apibusiness).

---

## 5. Protected routes (frontend)

Every `layout.tsx` guard matches its backend role gate exactly (verified
by diffing against §4 — no drift found):

| Path | `ProtectedRoute roles=` | Matches backend |
|---|---|---|
| `/admin/**` | `["SUPER_ADMIN", "ADMIN"]` | ✅ `require_role`/`require_admin_permission` union |
| `/admin/rbac`, `/admin/audit-logs`, `/admin/settings` | nested `["SUPER_ADMIN"]` | ✅ `require_role(SUPER_ADMIN)` |
| `/investor/**` | `["INVESTOR"]` | ✅ |
| `/rider/**` | `["RIDER"]` | ✅ |
| `/business/**` | `["BUSINESS"]` | ✅ |
| `/dashboard` | none (any authenticated user) | ✅ (`/api/auth/me` has no role restriction) |

`ProtectedRoute` is explicitly documented (in its own source) and
verified (§9, `ProtectedRoute.test.tsx`, 6 tests) as **UX only**: it
never renders protected children or leaks data for an unauthenticated or
wrong-role/permission user (loading → nothing; unauthenticated → nothing
+ redirect; wrong role/permission → "Access denied" placeholder only).
Nothing about it is trusted as a security boundary — every data fetch
the page makes afterward is independently re-authorized by the backend,
which is what makes "frontend route bypass" (disable JS, call the API
directly, edit localStorage) a non-issue: there is no code path where
the frontend guard being bypassed grants access the backend wouldn't
also grant.

Identity/role displayed in the UI always comes from `GET /api/auth/me`
(a real, signature-verified, DB-backed call) — the frontend never decodes
the JWT client-side for any authorization decision.

---

## 6. Database relationships

Full schema and per-table cascade/constraint notes:
[database.md](database.md). The security-relevant shape:

```
users (role_id → roles)
  ├─ refresh_tokens (CASCADE)
  ├─ investor_profiles (CASCADE, unique per user)
  │    ├─ investments → ev_assets
  │    ├─ investor_earnings, payouts, investor_transactions, investor_kyc_documents
  │    └─ ev_assets.owner_investor_profile_id (SET NULL)
  ├─ rider_profiles (CASCADE, unique per user)
  │    ├─ vehicle_bookings → ev_assets (shared with investors, read-only to riders)
  │    ├─ jobs.assigned_rider_profile_id (SET NULL)
  │    ├─ trips → jobs, vehicle_bookings
  │    └─ rider_earnings, rider_kyc_documents
  └─ business_profiles (CASCADE, unique per user)
       ├─ business_documents
       ├─ fleets, vehicles                      (business's own private inventory)
       ├─ fleet_vehicles → fleets, vehicles      (+ business_profile_id denormalized)
       ├─ business_rider_assignments → rider_profiles (+ business_profile_id denormalized)
       ├─ business_trips → fleet_vehicles, business_rider_assignments
       │    (+ business_profile_id, fleet_id, vehicle_id, rider_profile_id denormalized)
       └─ business_revenue → business_trips
```

`role_permissions` is a plain M:N join between `roles` and `permissions`,
mutable only via `/api/admin/rbac/...`.

---

## 7. Ownership rules

Every table above that isn't shared platform inventory (`ev_assets`,
`jobs`, `roles`, `permissions`) carries its owner id **as a direct
column**, never only reachable through a join. That single design choice
is the entire mechanism behind "do not trust IDs" in this codebase:

1. **`get_owned(resource_id, owner_id)`** is the only way a single
   record is ever fetched by id, everywhere. It filters on both columns
   in one query. Not-found and not-yours both return `None` → both 404.
   No endpoint anywhere calls a bare `get_by_id` on an owned table.
2. **The owner id is never a request parameter.** It's resolved exactly
   once per request, from the authenticated `User`, via
   `get_profile_for_user`/`get_business_for_user`, and threaded through
   from there. No repository method, no service method, no router
   parameter across all four stakeholder modules accepts an
   `investor_id`/`rider_id`/`business_id`/`owner_id`/`user_id` from the
   client (verified by a full-codebase grep, §9).
3. **Two-resource actions check both sides independently.** Assigning a
   vehicle to a fleet, or logging a trip against a fleet-vehicle
   assignment and a rider assignment, resolves *every* referenced id
   scoped to the caller's own tenant before doing anything — a foreign
   id simply doesn't resolve to a real record, so these 404 rather than
   ever comparing ownership after the fact.
4. **Shared platform resources redact owner-only fields.** `EVAsset`
   (investor-owned inventory) and `Job` (rider-facing marketplace
   postings) are intentionally browsable across their respective
   stakeholder role, but their `*Public` response schemas never include
   `owner_investor_profile_id` / `assigned_rider_profile_id` — a rider
   browsing available EVs, or a business browsing eligible riders, gets
   a minimal, need-only projection, never the platform-internal owner
   link (`VehiclePublic`, `RiderSummaryPublic`).

---

## 8. Multi-tenant rules (BUSINESS module)

The BUSINESS module is the one genuinely multi-tenant system in this
platform (many independent businesses, each with its own fleets,
vehicles, riders, and trips). Beyond the four ownership rules above, two
invariants are enforced **at the database level**, not just in the
service layer, so they hold even against a service-layer bug or a
concurrent request:

- **A vehicle can be actively assigned to at most one fleet at a time** —
  partial unique index `ix_fleet_vehicles_one_active_per_vehicle` on
  `fleet_vehicles(vehicle_id) WHERE status='ACTIVE'`.
- **A rider can be actively assigned to at most one business at a time** —
  partial unique index `ix_rider_assignments_one_active_per_rider` on
  `business_rider_assignments(rider_profile_id) WHERE status='ACTIVE'`.

Both are proven live, not just present in the migration:
`test_business.py::test_db_level_constraint_blocks_two_active_assignments_for_same_vehicle`
bypasses `BusinessService` entirely and inserts two active rows directly
via the ORM — the second raises `IntegrityError` from Postgres itself.

Riders are cross-module: a `BusinessRiderAssignment` references the
*rider* module's own `RiderProfile`, but this module only ever reads a
minimal `RiderSummaryPublic` projection (id, legal name, city, KYC
status) — never DOB, address, driving license number, or documents. The
"eligible riders" pool is computed globally (excluding every business's
active assignments, not just the caller's own), so every business sees
the same unassigned pool and can't infer another business's roster size
or composition from who's missing.

---

## 9. Security test results

**220 backend tests, 19 frontend tests, all passing.** New this audit:
`backend/tests/test_security_audit.py` (33 tests) and
`frontend/src/components/auth/ProtectedRoute.test.tsx` (6 tests) — both
written to empirically verify the 18 requested threat categories, not
just restate the code-review conclusions above.

| # | Threat category | Verified by | Result |
|---|---|---|---|
| 1 | Authentication bypass | No header / malformed header / garbage token against 4 modules | 401 in every case |
| 2 | Authorization bypass | Role-module access matrix (5 roles × 4 module canaries, parametrized) | Exactly the intended role passes; every other role 403 |
| 3 | IDOR | Per-module `get_owned` tests (pre-existing, 60+ tests) + new random-UUID-on-every-`get`-by-id sweep (5 endpoints) | 404, never a 500 or data leak |
| 4 | Privilege escalation | Register-role-injection, RBAC-matrix-edit-by-non-SUPER_ADMIN, embedded-role-claim test | All blocked/ignored |
| 5 | Role manipulation | Profile-update payloads with injected `kyc_status`/`verification_status`/`id` | Extra fields silently ignored (Pydantic `extra="ignore"`), state unchanged |
| 6 | Permission manipulation | ADMIN/INVESTOR/RIDER/BUSINESS attempting grant; SUPER_ADMIN attempting to edit its own matrix | 403 / 400 respectively |
| 7 | Cross-user access | `/api/auth/me` and every profile endpoint scoped to `get_current_user`'s own id only | No endpoint accepts a foreign user id |
| 8 | Cross-investor access | `test_investor.py` isolation suite (pre-existing) | A's investment ids 404 for B |
| 9 | Cross-rider access | `test_rider.py` isolation suite (pre-existing) | A's bookings/trips/jobs 404 for B |
| 10 | Cross-business access | `test_business.py` isolation suite (pre-existing, includes the 5 spec-named cases) | A's fleet/vehicle/rider/trip 404 for B |
| 11 | Cross-fleet access | DB-level partial unique indexes (§8) + service checks | One active assignment per vehicle/rider, enforced twice over |
| 12 | JWT manipulation | Forged secret, tampered payload (same signature), `alg:none`, embedded `role` claim override | All rejected (401) or ignored (real DB role governs) |
| 13 | Expired tokens | Hand-crafted token with `exp` in the past | 401 "Token has expired" |
| 14 | Refresh token abuse | Reuse-after-logout, refresh-token-as-bearer-access-token (pre-existing: rotation reuse detection + family revocation) | 401 in every case |
| 15 | Direct API access | Every test in the suite calls the API directly (no frontend involved) | Identical enforcement to "through the UI" — by construction |
| 16 | Frontend route bypass | `ProtectedRoute.test.tsx` (6 tests) | Never renders children/data for unauthenticated or wrong-role/permission state |
| 17 | Request body ownership manipulation | Injected `business_profile_id`/`investor_profile_id`/`rider_profile_id` in Fleet/Investment/Booking create payloads | Ignored — record owned by the authenticated actor regardless |
| 18 | URL id manipulation | Cross-module type confusion (a real `EVAsset` id used as a `Vehicle` id) + the IDOR sweep above | 404, not 500, not a leak |

Full commands:

```bash
docker compose -f docker/docker-compose.yml exec backend pytest -q      # 220 passed
docker compose -f docker/docker-compose.yml exec backend ruff check .   # clean
docker compose -f docker/docker-compose.yml exec backend mypy app       # clean, 86 files
docker compose -f docker/docker-compose.yml exec backend alembic upgrade head  # 8/8 applied
cd frontend && npm test && npm run lint && npm run typecheck && npm run build   # 19 passed, clean, clean, 56 routes
```

**Clean-environment Docker Compose verification**: `docker compose down
-v` (removing the postgres volume), rebuilt both images from scratch
(`docker compose up --build`), applied all 8 migrations to an empty
database, ran the seed script, confirmed `/api/health` and the frontend
both serve, and smoke-tested a real registration end-to-end — all from
zero state. The environment was then restored to the same state
afterward (migrated + seeded, no leftover accounts).

### Fixes applied

Two hardening gaps were found by code review (not by the empirical
suite — both were "correct today, fragile under misconfiguration"
issues, not currently-exploitable bugs):

1. **`SECRET_KEY` had no production safety net.** Both checked-in
   `.env.example` files ship an obvious placeholder value; nothing
   stopped the app from actually running with it under
   `ENVIRONMENT=production`, which would let anyone who'd read either
   file forge valid JWTs for any user id (full auth bypass). Fixed:
   `Settings` now has a `model_validator` that raises at startup if
   `ENVIRONMENT=production` and `SECRET_KEY` is either of the known
   placeholder strings or under 32 characters. Does not affect
   development/test (`ENVIRONMENT=development` is unaffected) — verified
   by the full suite still passing unchanged.
2. **Password fields had no upper length bound.** `RegisterRequest.password`,
   `LoginRequest.password`, `ChangePasswordRequest.{current,new}_password`,
   and `AdminCreateUserRequest.password` accepted arbitrarily long
   strings before being fed into bcrypt hashing/verification — a cheap
   large-payload amplification vector, and bcrypt's own well-known
   72-byte truncation behavior means an unbounded input doesn't even add
   real entropy past that point. Fixed: `Field(max_length=128)` on all
   five.

No other code change was made. Every ownership/authorization pattern
already in the codebase passed empirical testing as-is.

---

## 10. Remaining technical risks

Documented, not fixed — each is a deliberate scope boundary or an
accepted MVP-stage tradeoff, not a bug, and none is a request to silently
add infrastructure ("do not add unnecessary features" — see the
reasoning under each):

- **No login/register rate limiting.** Redis is provisioned and reserved
  for exactly this (see [architecture.md](architecture.md)) but not
  wired up. A determined attacker could brute-force a weak password with
  unlimited attempts. Adding real rate limiting is infrastructure, not a
  fix to existing broken behavior — worth doing before a real production
  launch, not as part of this audit's fix list.
- **No instant access-token revocation.** Refresh tokens are revocable
  (and are, on logout/password-change/reuse-detection); access tokens
  are stateless JWTs valid for their full 15-minute lifetime regardless
  of a subsequent logout or password change — the standard, accepted
  tradeoff for short-lived stateless access tokens. The account-status
  check on every request (§1) already gives *suspension* an immediate
  effect; only logout/password-change have this bounded (≤15 min) delay.
- **No forgot/reset-password or email/phone verification flow.** The
  `VerificationToken` table reserves the schema; no endpoint uses it.
  Zero attack surface today (nothing reads or writes that table via any
  route) but also zero self-service account-recovery capability.
- **Business self-reported trip/revenue data.** Unlike investor earnings
  (system-accrued) and rider earnings (created only on real job
  completion), a business can log a `Trip` with any `distance_km`/
  `revenue_amount` it likes for its own fleet — this is by design (it's
  the business's own operational log, not something Booklynk EV pays
  out against — see [business.md](business.md)), but means the
  `revenue`/`analytics` numbers are exactly as trustworthy as the
  business's own honesty, with no independent verification.
- **Rider-discovery ID enumeration oracle (low severity).**
  `POST /api/business/riders/{rider_profile_id}/assign` distinguishes
  "rider doesn't exist" (404) from "rider exists but is already assigned
  somewhere" (409) without revealing *where*. This lets a business
  confirm a guessed `RiderProfile` UUID is valid, but UUIDv4's 128 bits
  of entropy make brute-forcing real ids computationally infeasible; no
  other private data is exposed either way.
- **API docs (`/docs`, `/openapi.json`) are not disabled by environment.**
  Standard FastAPI behavior; every documented endpoint still requires
  the same authentication/authorization it always did, so this is
  information disclosure of the schema shape only, not of any protected
  data — a common and often-intentional choice, not flagged as a fix.
- **Password reuse across long inputs (bcrypt's own limitation).**
  Bcrypt truncates at 72 bytes; two passwords sharing the first 72 bytes
  hash identically. `max_length=128` (this audit's fix) narrows but
  doesn't eliminate this — it's inherent to bcrypt itself, not specific
  to this codebase, and switching hash algorithms is out of scope for an
  audit fix.
