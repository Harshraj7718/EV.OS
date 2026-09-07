# Rider Module

Implemented by `app/modules/riders/` (backend) and
`frontend/src/app/rider/` (frontend). Business proposition: **affordable
mobility** — a RIDER completes a profile and KYC, books a deployed EV
from the shared fleet, accepts gig jobs from a marketplace, and tracks
the trips, earnings, and payments that result.

## Scope

Real backing data model: `RiderProfile`, `VehicleBooking`, `Job`, `Trip`,
`RiderEarning`, plus `KycDocument` (added the same way the investor
module added its own — necessary for the explicit "complete KYC"/
"manage documents" requirements even though it wasn't in the named model
list) — 6 tables (see [database.md](database.md)). No real payment
gateway or dispatch system is connected; booking a vehicle and completing
a job both settle synchronously in a clearly-marked development/mock
state (see "Mock settlement" below).

**Vehicles are not a new model.** "View available EVs" / "book an EV" /
"current EV" reuse the investor module's `EVAsset` table — the same
physical fleet an investor invests in is what a rider drives. A rider
never sees investor-facing fields on it (see `VehiclePublic` below), and
"available for booking" is a *derived* notion (deployed **and** not
currently in another rider's active booking) computed in
`VehicleRepository`, never written back onto `EVAsset` itself. That
derivation, plus never writing `EVAsset.status`/`owner_investor_profile_id`
from anywhere in this module, is what "rider cannot modify vehicle/fleet
ownership" means in code — there is structurally no code path here that
could.

## Ownership isolation: the core requirement

**Rider A must never access Rider B's profile / trips / bookings /
earnings / payments / documents / jobs**, enforced the same
structurally-provable way as the investor module:

1. **Every repository method scoped to a rider takes `rider_profile_id`
   as a required parameter** — not optional, not inferred.
   `app/modules/riders/repository.py` has no method capable of returning
   another rider's row by accident; there's no code path that queries
   `VehicleBooking`/`Trip`/`RiderEarning`/`KycDocument` without that
   filter, and `Job.get_owned()` filters on `assigned_rider_profile_id`
   the same way.
2. **`RiderService.get_profile_for_user(user)` is the only way any
   service method learns "which rider"** — resolved from the
   authenticated `User` (itself resolved from the JWT), never from
   client input. No service method accepts a `rider_id`/`user_id`
   parameter from a caller.
3. **A single-record ownership gate returns `None` for both "not found"
   and "not yours"** — `VehicleBookingRepository.get_owned()` and
   `JobRepository.get_owned()` both filter on the resource id *and* the
   caller's profile id in one query, so e.g. `GET
   /api/rider/bookings/{id}` or completing someone else's accepted job
   404s identically whether the id doesn't exist or belongs to another
   rider — no IDOR enumeration signal either way.

**Do not trust `user_id`/`rider_id`/anything from the client**: `user_id`
is never read from a request body; no route has a `rider_id` path or
query parameter for anything; `ev_asset_id` in `POST /bookings` is looked
up and its *current* deployment/booking state re-checked server-side
regardless of what the available-vehicles list showed a moment ago;
`assigned_rider_profile_id` on `Job` is set in exactly one place —
`RiderService.accept_job()`, for the authenticated caller's own profile.

The open job marketplace and the available-vehicles list are
deliberately unauthenticated-of-identity in their *response* even though
the routes require RIDER auth: `JobPublic` never includes
`assigned_rider_profile_id`, so browsing the marketplace can't leak which
rider (if any) holds a job — see `test_job_assigned_rider_not_leaked_in_marketplace`.

## Mock settlement (no real payment gateway or dispatch system)

`book_vehicle()` and `complete_job()` both simulate settlement
synchronously and unconditionally — a real integration would leave a
booking `PENDING` until a handover confirms it, or a payment `PENDING`
until a gateway confirms it, but that would make the module
un-exercisable end-to-end without real infrastructure. Every place this
happens is commented `# --- MOCK ... settlement ---` in `service.py`.

**Rider income is realized the moment a job is completed — unlike the
investor module's periodic passive accrual.** There is no rider-facing
"request payout" endpoint at all: `RiderService.complete_job()` creates
the `Trip` and its `RiderEarning` in the same request and immediately
marks the earning `PAID`. This is a deliberate, real business difference
between the two stakeholders (passive investment income vs. active gig
income), not an oversight — see the `RiderEarning` model's docstring.

**"Earnings" vs. "Payments" — same underlying ledger, two views.** No
separate payout/disbursement model was requested for this module (only
`RiderEarning`), so `GET /earnings` returns the full ledger (with a
summary: total earned, total paid, trip count) and `GET /payments`
returns the subset with `status=PAID` — a real, correct distinction even
though in this phase every earning ends up `PAID` immediately.

## API (`/api/rider/*`)

Every route uses `require_role(RoleName.RIDER)` — role-gated, not
permission-gated, for the same reason as the investor module: RBAC codes
like `vehicle.book`/`payment.read`/`kyc.read` are shared across
stakeholder roles for the general matrix, but this route surface must
stay rider-exclusive regardless.

| Method | Path | Notes |
|---|---|---|
| POST | `/profile` | Create; 409 if one already exists for this user |
| GET | `/profile` | 404 if none yet |
| PATCH | `/profile` | Partial update |
| POST | `/kyc/documents` | Records metadata only — no real file storage; bumps `kyc_status` to `PENDING` if it was `NOT_STARTED` |
| GET | `/kyc/documents` | Paginated, own documents only |
| GET | `/vehicles` | `EVAsset`s that are deployed (`status=ALLOCATED`) and not in anyone's active booking — shared browse list, not rider-scoped |
| POST | `/bookings` | Body is just `{ev_asset_id}`; 409 if the caller already has an active booking, 404 unknown vehicle, 409 not deployed/already booked |
| GET | `/bookings` | Own booking history, paginated |
| GET | `/bookings/{id}` | Ownership-gated — 404 for someone else's id |
| GET | `/current-vehicle` | The caller's `ACTIVE` booking; 404 if none |
| POST | `/current-vehicle/return` | Ends the active booking (`COMPLETED`); 404 if none |
| GET | `/trips` | Own completed trip history, paginated |
| GET | `/jobs/marketplace` | Open (`status=OPEN`) jobs — shared, never reveals who holds accepted jobs |
| GET | `/jobs/mine` | Jobs assigned to the caller, paginated |
| POST | `/jobs/{id}/accept` | 409 if caller has no active vehicle booking, 404 unknown job, 409 job not OPEN |
| POST | `/jobs/{id}/complete` | Ownership-gated (404 unless assigned to caller and `ACCEPTED`); creates a `Trip` + `PAID` `RiderEarning` |
| GET | `/earnings` | Own earnings, paginated |
| GET | `/earnings/summary` | `total_earned`, `total_paid`, `trip_count` |
| GET | `/payments` | Own earnings with `status=PAID` only |

## Frontend

`app/rider/layout.tsx` wraps every `/rider/*` page in `<ProtectedRoute
roles={["RIDER"]}>` once — a UX convenience; the real boundary is the
backend's `require_role` on every call. `/rider` itself redirects to
`/rider/dashboard`.

| Page | Backend calls |
|---|---|
| `/rider/dashboard` | profile + earnings summary + current vehicle, KYC status, quick links |
| `/rider/vehicles` | available EVs (browse + book) |
| `/rider/bookings` | booking history |
| `/rider/current-vehicle` | active booking detail + "Return vehicle" action |
| `/rider/trips` | trip history |
| `/rider/jobs` | job marketplace (browse + accept) and "my jobs" (accept/complete) in one page |
| `/rider/earnings` | earnings summary + list |
| `/rider/payments` | paid earnings only |
| `/rider/kyc` | current KYC status + submit-document form |
| `/rider/documents` | read-only table of all submitted KYC documents |
| `/rider/profile` | create (if none) or view/edit |
| `/rider/support` | static contact info — no `SupportTicket` model was requested for this module, so this is an honest static page rather than a fabricated ticketing backend |

**"Frontend must hide unavailable functionality but backend remains
authoritative"** is implemented as real conditional rendering, backed by
data the page already has — never as a security boundary:

- `/rider/vehicles`: the "Book" action is omitted entirely (not just
  disabled) whenever the rider already has an active booking, replaced
  with an explanatory message pointing at Current Vehicle.
- `/rider/jobs`: the "Accept" action across every marketplace row is
  omitted entirely whenever the rider has no active vehicle booking,
  replaced with a message linking to Vehicles. "Complete" only ever
  renders on a row whose `status === "ACCEPTED"` in the caller's own
  "my jobs" list.

Every page except Profile depends on a profile existing (the backend
404s "Rider profile not found" otherwise); on that specific 404 they
render `<NeedsProfilePrompt>` instead of a raw error, linking to
`/rider/profile`. A 404 from `/current-vehicle` is handled separately and
treated as "no vehicle booked" (an expected state), never as an error.

`lib/rider/` mirrors the `lib/investor/` pattern exactly (`types.ts`
mirroring the backend schemas 1:1, `api.ts` wrapping every endpoint
through the shared `apiClient`), kept self-contained rather than
importing from `lib/investor/` or `lib/admin/`. Tables/pagination/status
pills reuse the existing generic
`components/admin/{DataTable,Pagination,StatusBadge}`.

## Testing

- **`backend/tests/test_rider.py`** (31 tests) — every endpoint; profile
  create/conflict/404/update; KYC submit + status transition; available-
  vehicles filtering (deployed-and-unbooked only) and field redaction
  (`VehiclePublic` never leaks `price`/`status`/owner); booking (success,
  second-booking-while-active 409, already-booked-by-another 409,
  not-deployed 409, unknown-vehicle 404); current vehicle 404-when-none
  and return-frees-it-for-rebooking; job marketplace listing; accepting
  (requires active booking 409, already-accepted 409, unknown-job 404);
  accept-then-complete produces a `Trip` and a `PAID` `RiderEarning` with
  an accurate summary; completing without accepting first 404s; the
  marketplace never leaks `assigned_rider_profile_id`; non-RIDER roles
  (SUPER_ADMIN/ADMIN/INVESTOR/BUSINESS) denied 403; unauthenticated 401;
  and, explicitly, **ownership isolation**: Rider B given Rider A's real
  booking id gets 404; B's bookings/trips/earnings/payments/jobs lists
  never include A's rows while A's own lists still do; Rider B cannot
  complete a job Rider A accepted (404, not merely a permissions error).

Verified live in the browser against the real backend: created a
profile, booked a deployed EV (it disappeared from Available EVs,
appeared on Current Vehicle), accepted a marketplace job (Accept hidden
once booked was no longer relevant — visible because a vehicle was
active), completed it (produced a `Trip` and a `PAID` `RiderEarning`,
visible on Trips/Earnings/Payments with matching amounts), submitted a
KYC document (status moved to `PENDING`, visible on Documents); confirmed
an INVESTOR account hitting `/rider/dashboard` gets the frontend's
"Access denied" state; confirmed a second RIDER account with no profile
sees none of the first rider's data. All demo/test accounts and data
created during this verification were deleted afterward, including
resetting the deployed EV asset and the completed seed job back to their
baseline state.
