# Business Module (Fleet SaaS)

Implemented by `app/modules/businesses/` (backend) and
`frontend/src/app/business/` (frontend). Business proposition: **Fleet
SaaS** — a BUSINESS account operates one or more EV fleets: create fleets,
add vehicles, assign vehicles into fleets, recruit riders, log the trips
those riders complete, and track the revenue that results. Architecture
mirrors the domain hierarchy given in the spec: `Business → Fleet →
Vehicle → Rider → Trip → Revenue`.

## Scope

Real backing data model: `BusinessProfile`, `Fleet`, `Vehicle`,
`FleetVehicle`, `BusinessRiderAssignment`, `Trip`, `BusinessRevenue`,
plus `BusinessDocument` (added the same way the investor/rider modules
added their own KYC document models — necessary for "verification" and
"documents" even though it wasn't in the named model list) — 8 tables
(see [database.md](database.md)). `Vehicle` is a genuinely new,
business-owned model — **not** a reuse of the investor module's
`EVAsset` (unlike the rider module's vehicle-booking design): a
business's fleet inventory is private to that business, not the
platform's shared investable pool. No real payment gateway is connected;
logging a trip recognizes revenue synchronously in the same request
(see "Revenue" below) — there is no external settlement to simulate here,
since a business's own trip/revenue log is self-reported operational
data, not something Booklynk EV pays out based on.

## Multi-tenancy: the core requirement

**Business A must never access Business B's fleets, vehicles, riders, or
trips.** The spec's four-factor authorization model — authenticated user
+ business membership + permission + resource ownership — is implemented
as four concrete, verifiable layers (see `service.py`'s module docstring
for the canonical statement):

1. **Authenticated user** — every service method receives an
   already-verified `User`, resolved from the JWT by `get_current_user`.
   Nothing is ever trusted from client input for identity.
2. **Business membership** — `BusinessService.get_business_for_user(user)`
   is the *only* way any other method learns "which business"; it
   resolves the caller's own `BusinessProfile`, 404ing if none exists. No
   method anywhere in this module accepts a `business_id` parameter from
   a caller.
3. **Permission** — `require_role(RoleName.BUSINESS)` on every
   `/api/business/*` route (see router.py's docstring for why role-, not
   permission-, gating).
4. **Resource ownership** — every table that a business owns carries
   `business_profile_id` **directly**, not only reachable via a join
   through `Fleet`/`FleetVehicle` (see models.py's module docstring).
   Every read/write of a specific record goes through a repository
   `get_owned(id, business_profile_id)` call, filtering on both the
   resource id *and* the caller's own business id in one query. A record
   that exists but belongs to another business is indistinguishable from
   one that doesn't exist at all — 404 either way. This is what "do not
   rely only on IDs" means in code: there is no code path anywhere in
   this module that resolves a client-supplied id into a real row
   without also checking whose it is.

This is proven concretely for **two-resource actions**, where ownership
of *both* referenced records must hold independently — the interesting
case this module has that investor/rider don't:

- **Assigning a vehicle to a fleet** (`POST /assignments/vehicles`) looks
  up `fleet_id` *and* `vehicle_id` each scoped to the caller's own
  business. Business B's fleet_id or vehicle_id simply doesn't resolve
  under Business A's id — assigning A's vehicle into B's fleet, or B's
  vehicle into A's fleet, both 404, never a 403 comparing ownership after
  the fact.
- **Logging a trip** (`POST /trips`) looks up `fleet_vehicle_id` *and*
  `rider_assignment_id` the same way — a trip can never be logged
  against another business's vehicle assignment or rider assignment.

## Database constraints, not just service-layer checks

Two invariants ("a vehicle can only be actively assigned to one fleet at
a time"; "a rider can only be actively assigned to one business at a
time") are enforced at **both** layers, not just the service layer:

- `FleetVehicle` has a partial unique index —
  `ix_fleet_vehicles_one_active_per_vehicle` on `vehicle_id` WHERE
  `status = 'ACTIVE'` — so the database itself rejects a second active
  assignment for the same vehicle, even if a service-layer bug or a
  concurrent request slipped past the pre-check.
- `BusinessRiderAssignment` has the equivalent partial unique index —
  `ix_rider_assignments_one_active_per_rider` on `rider_profile_id` —
  for the same reason.

`tests/test_business.py::test_db_level_constraint_blocks_two_active_assignments_for_same_vehicle`
proves this by bypassing `BusinessService` entirely and inserting two
active `FleetVehicle` rows directly via the ORM — the second insert
raises `IntegrityError` from Postgres itself.

## Riders: read-only, minimal, and cross-module

`BusinessRiderAssignment.rider_profile_id` references the riders
module's own `RiderProfile` — this module never writes to it, and never
exposes more than `RiderSummaryPublic` (id, legal name, city, KYC
status). A business browsing eligible riders, or its own roster, never
sees a rider's date of birth, address, driving license number, or
documents — those stay private to the rider, the same protection the
rider module gives investor data flowing the other direction.
"Eligible" riders are computed globally (every business's active
assignments excluded, not just the caller's own) so every business sees
the same unassigned pool; a rider can only be actively assigned to one
business at a time (see the partial unique index above).

## API (`/api/business/*`)

Every route uses `require_role(RoleName.BUSINESS)`.

| Method | Path | Notes |
|---|---|---|
| POST/GET/PATCH | `/profile` | Create (409 if exists) / 404 if none / partial update |
| POST/GET | `/documents` | Submit (bumps `verification_status` to `PENDING`) / list own |
| POST/GET | `/fleets` | Create (409 duplicate `fleet_code`) / list own |
| GET/PATCH | `/fleets/{id}` | Ownership-gated — 404 for another business's fleet; PATCH also carries activate/deactivate via `status` |
| POST/GET | `/vehicles` | Add (409 duplicate `registration_number`) / list own |
| GET/PATCH | `/vehicles/{id}` | Ownership-gated; PATCH also carries vehicle status |
| POST/GET | `/assignments/vehicles` | Assign a vehicle to a fleet (both ids scoped to caller) / list own |
| POST | `/assignments/vehicles/{id}/unassign` | Ownership-gated |
| GET | `/riders/eligible` | Global, unassigned-anywhere pool, minimal projection |
| POST | `/riders/{rider_profile_id}/assign` | 409 if already actively assigned anywhere |
| GET | `/assignments/riders` | List own roster |
| POST | `/assignments/riders/{id}/unassign` | Ownership-gated |
| POST/GET | `/trips` | Log a trip (both `fleet_vehicle_id` and `rider_assignment_id` scoped to caller, both must be `ACTIVE`) / list own, filterable |
| GET | `/trips/{id}` | Ownership-gated |
| GET | `/trips?vehicle_id=&rider_id=&trip_status=&min_distance=&max_distance=&min_revenue=&max_revenue=` | Filters, all on direct (denormalized) `Trip` columns — see below |
| GET | `/revenue` | Own revenue ledger, paginated |
| GET | `/analytics` | `total_vehicles`, `active_vehicles`, `active_riders`, `total_trips`, `total_revenue`, `utilization_percent` |

## Revenue: operational record + financial ledger, same split as elsewhere

`Trip.revenue_amount` is the operational fact (what this specific trip
earned); `BusinessRevenue` is the financial ledger row, created in the
same request as the `Trip` — same operational-record/ledger-entry split
used by the investor module (`Investment`/`Transaction`) and the rider
module (`Trip`/`RiderEarning`). `Trip` also denormalizes `vehicle_id` and
`rider_profile_id` directly (not only reachable via
`fleet_vehicle_id`/`rider_assignment_id`), so filtering by "this
vehicle" or "this rider" is always a direct column comparison, never a
join, and stays correct even if the vehicle is later reassigned to a
different fleet.

## Analytics: isolated and pure

`app/modules/businesses/analytics.py` has zero DB/HTTP/ORM imports —
`calculate_utilization_percent` is a plain function over `Decimal`
(active fleet-assigned vehicles ÷ total vehicles, as a percentage,
0 when there are no vehicles), tested directly with no fixtures in
`tests/test_business_analytics.py`. Mirrors the investor module's
`finance.py` isolation rationale, scaled to this module's one
non-trivial calculation.

## Frontend

`app/business/layout.tsx` wraps every `/business/*` page in
`<ProtectedRoute roles={["BUSINESS"]}>` once — a UX convenience; the real
multi-tenant boundary is entirely server-side. `/business` itself
redirects to `/business/dashboard`.

| Page | Backend calls |
|---|---|
| `/business/dashboard` | profile + analytics snapshot, verification status, quick links |
| `/business/profile` | create (if none) or view/edit, verification status |
| `/business/fleets` | create + list + activate/deactivate (via status PATCH) |
| `/business/vehicles` | add + list + status change |
| `/business/riders` | eligible-riders discovery + recruit (assign) action |
| `/business/assignments` | fleet↔vehicle assign/unassign, rider-roster unassign — the operational hub for both assignment types |
| `/business/trips` | log a trip (needs one active vehicle assignment + one active rider assignment) + filterable list |
| `/business/revenue` | revenue ledger |
| `/business/analytics` | full `BusinessAnalytics` |
| `/business/documents` | verification-document submission + list |
| `/business/settings` | honest minimal account-info view — no settings model was requested beyond profile/documents, so this doesn't fabricate a backend for notification prefs/integrations/API keys that don't exist |

Every page except Profile depends on a profile existing (the backend
404s "Business profile not found" otherwise); on that specific 404 they
render `<NeedsProfilePrompt>` instead of a raw error, linking to
`/business/profile`.

**"Frontend must hide unavailable functionality but backend remains
authoritative"** is implemented as real conditional rendering, backed by
data the page already has:

- `/business/assignments`: the vehicle-assignment form is omitted
  entirely (not just disabled) when there's no active fleet or no
  unassigned vehicle, replaced with an explanatory message.
- `/business/trips`: the "Log trip" button and form are omitted entirely
  unless the business has at least one active fleet-vehicle assignment
  *and* one active rider assignment — logging a trip is impossible
  without both, so the control isn't shown at all rather than shown and
  left to fail.

`lib/business/` mirrors the `lib/rider/`/`lib/investor/` pattern exactly
(`types.ts` mirroring the backend schemas 1:1, `api.ts` wrapping every
endpoint through the shared `apiClient`), kept self-contained. Tables/
pagination/status pills/filter dropdowns reuse the existing generic
`components/admin/{DataTable,Pagination,StatusBadge,FilterSelect}`.

## Testing

- **`backend/tests/test_business.py`** (46 tests) — every endpoint;
  profile create/conflict/404/update; documents; fleet create (409
  duplicate code) + ownership-gated get/update; vehicle create (409
  duplicate registration) + ownership-gated get; fleet-vehicle assignment
  (success, inactive-fleet conflict, already-active-vehicle conflict,
  unassign frees it for reassignment) **and, specifically, both
  two-resource-ownership directions**: assigning Business B's vehicle
  into Business A's fleet 404s, and assigning Business A's vehicle into
  Business B's fleet 404s; eligible-riders exclusion and private-field
  redaction; rider assignment (success, already-assigned conflict,
  unassign frees for reassignment); trip logging (success + creates
  revenue, Business B's fleet-vehicle-id 404s, Business B's
  rider-assignment-id 404s, inactive-assignment conflict, filters by
  vehicle/rider/status/distance/revenue); the DB-level partial unique
  index test described above; non-BUSINESS roles (SUPER_ADMIN/ADMIN/
  INVESTOR/RIDER) denied 403; unauthenticated 401; and explicitly, the
  five isolation cases named in the spec: **Business A → Business A
  fleet allowed; Business A → Business B fleet/vehicle/rider/trip all
  forbidden (404)**.
- **`backend/tests/test_business_analytics.py`** (5 tests) — pure unit
  tests of `calculate_utilization_percent`, including the zero-vehicles
  and all-active edge cases.

Verified live in the browser against the real backend: created a
business profile, created a fleet, added a vehicle, assigned the vehicle
to the fleet (form correctly hid once no unassigned vehicles remained),
recruited an eligible rider (disappeared from the eligible list), logged
a trip (revenue recognized, analytics — total/active vehicles, active
riders, total trips, total revenue, utilization — all accurate);
confirmed a second BUSINESS account sees zero of the first business's
fleets and does not see the first business's recruited rider as
eligible; confirmed a RIDER account hitting `/business/dashboard` gets
the frontend's "Access denied" state. All demo/test accounts and data
created during this verification were deleted afterward; cascading
deletes left every business-owned table fully clean (no orphaned rows —
unlike the investor/rider modules' shared `EVAsset`, a business's
`Vehicle` inventory is private to it, so there's nothing to reset back
to a shared baseline state).
