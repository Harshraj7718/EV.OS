# Authorization (RBAC)

Implemented by `app/modules/{roles,permissions}/` (data) and
`app/core/authorization.py` + `app/api/deps.py` (enforcement).

## Model

```
User
  ↓ role_id (FK, one role per user)
Role          SUPER_ADMIN | ADMIN | INVESTOR | RIDER | BUSINESS
  ↓ role_permissions (join table)
Permission    resource.action  (e.g. "vehicle.book")
```

- **`Role`** — fixed catalog, seeded by `app/modules/roles/seed.py`.
- **`Permission`** — `resource` + `action` + a unique `code` column
  (`"resource.action"`). Plain strings, not enums, so a new resource is a
  new seeded row, not a schema change.
- **`RolePermission`** — pure join table (composite PK, `ON DELETE
  CASCADE` from both sides), populated by
  `app/modules/permissions/seed.py`.

**The backend is the only source of truth.** `require_role()` /
`require_permission()` always re-derive the current user's role and
permissions from the database on every request (`current_user.role`,
loaded fresh inside `get_current_user`) — never from a JWT claim, a
request body field, or anything else the client sends. The access token
does carry a `role` claim, but it exists purely as a UI hint for the
frontend; no backend authorization decision ever reads it.

## The permission catalog

| Resource | Actions |
|---|---|
| `user` | `read`, `create`, `update`, `suspend` |
| `vehicle` | `read`, `create`, `update`, `book` |
| `fleet` | `read`, `create`, `update` |
| `investment` | `read`, `create` |
| `trip` | `read`, `create`, `update` |
| `payment` | `read`, `create` |
| `analytics` | `read` |
| `kyc` | `read`, `submit`, `verify` |

22 permissions total. Source of truth: `PERMISSION_DEFINITIONS` in
`app/modules/permissions/seed.py`.

## Authorization matrix

✓ = granted. Generated from `ROLE_PERMISSIONS` in
`app/modules/permissions/seed.py` — if this table and that file ever
disagree, the file is correct; update this table to match.

| Permission | SUPER_ADMIN | ADMIN | INVESTOR | RIDER | BUSINESS |
|---|:---:|:---:|:---:|:---:|:---:|
| `user.read` | ✓ | ✓ | | | ✓ |
| `user.create` | ✓ | | | | |
| `user.update` | ✓ | ✓ | | | |
| `user.suspend` | ✓ | ✓ | | | |
| `vehicle.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `vehicle.create` | ✓ | | | | ✓ |
| `vehicle.update` | ✓ | ✓ | | | ✓ |
| `vehicle.book` | ✓ | | | ✓ | |
| `fleet.read` | ✓ | ✓ | ✓ | | ✓ |
| `fleet.create` | ✓ | | | | ✓ |
| `fleet.update` | ✓ | | | | ✓ |
| `investment.read` | ✓ | | ✓ | | |
| `investment.create` | ✓ | | ✓ | | |
| `trip.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `trip.create` | ✓ | | | ✓ | ✓ |
| `trip.update` | ✓ | ✓ | | ✓ | ✓ |
| `payment.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `payment.create` | ✓ | | ✓ | ✓ | ✓ |
| `analytics.read` | ✓ | ✓ | ✓ | | ✓ |
| `kyc.read` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `kyc.submit` | ✓ | | ✓ | ✓ | ✓ |
| `kyc.verify` | ✓ | ✓ | | | |
| **Total** | **22** | **12** | **10** | **9** | **15** |

**Update (ADMIN operational role phase):** ADMIN's grant set was
tightened from an earlier, broader 17-permission set to exactly the 12
above — see [admin.md](admin.md) ("ADMIN operational role") for the
precise capability spec this now matches and why `user.create`,
`vehicle.create`, `fleet.create`, `fleet.update`, and `investment.read`
were removed.

### Design rationale

- **SUPER_ADMIN** has every permission unconditionally — the platform
  override role.
- **ADMIN** is a scoped internal-operations role: view/update/suspend
  users, view/update vehicles and trips, view fleets/payments, verify
  KYC, view analytics. Deliberately excludes create/activate/role-
  assignment for users, any create/update on fleets or vehicle-creation,
  and everything RBAC/audit/settings-related — see admin.md for the full
  "ADMIN cannot" list and how it's enforced. Like SUPER_ADMIN, ADMIN also
  never gets the *customer-side transactional* actions (booking a
  vehicle, creating an investment, starting a trip, submitting KYC docs)
  — those are things a specific stakeholder does *as themselves*, not
  something an operator does on their behalf.
- **INVESTOR** reads what it needs to evaluate returns (vehicles, fleets,
  trips, analytics) and can create/fund investments and pay for them, plus
  manage its own KYC — but has no access to user management, fleet/vehicle
  operations, or trip management.
- **RIDER** can browse and book vehicles, manage its own trips, pay, and
  submit KYC — no visibility into analytics, fleets, investments, or other
  users.
- **BUSINESS** (fleet operator) manages its fleet, vehicles, and trips,
  reads the riders associated with it (`user.read`), and has analytics —
  but doesn't touch investments, can't create/suspend user accounts, and
  can't verify KYC (that's a compliance function, reserved to ADMIN).

This is a judgment call made while implementing — reasonable, documented,
and easy to change in one place (`ROLE_PERMISSIONS`) if product decides
differently.

## Usage

Two reusable FastAPI dependency factories in `app/api/deps.py`:

```python
from app.api.deps import require_permission, require_role
from app.modules.roles.enums import RoleName

@router.post("/vehicles/{id}/book")
def book_vehicle(
    id: str,
    current_user: User = Depends(require_permission("vehicle.book")),
):
    ...

@router.post("/kyc/{id}/verify")
def verify_kyc(
    id: str,
    current_user: User = Depends(require_role(RoleName.ADMIN, RoleName.SUPER_ADMIN)),
):
    ...
```

**Prefer `require_permission` over `require_role` for most endpoints.** It
decouples "what capability does this endpoint need" from "which role(s)
happen to grant it today" — reshuffling the matrix in
`ROLE_PERMISSIONS` doesn't mean auditing every router for hardcoded role
checks. Reach for `require_role` only when a check is genuinely about
identity/tier rather than a capability (e.g. "only SUPER_ADMIN may do
this, full stop").

Both build on `get_current_user`, so the status codes are automatic:

- **401 Unauthorized** — missing, malformed, wrong-type, or expired
  token. Raised inside `get_current_user`, before any role/permission
  check runs.
- **403 Forbidden** — authenticated, but the role/permission check
  failed (including: the account is authenticated but not `ACTIVE`, e.g.
  suspended mid-session).

Both are converted from Python exceptions into that exact JSON shape (see
[architecture.md](architecture.md)) by `register_exception_handlers` — any
FastAPI app instance that mounts these dependencies must call it, or
`AppError`s propagate unhandled instead of becoming HTTP responses (this
bit the test suite once; see `tests/test_rbac.py`'s `rbac_app` setup).

## Testing

`backend/tests/test_rbac.py` mounts a small throwaway FastAPI app with a
handful of demo routes guarded by `require_permission`/`require_role`, and
exercises all five roles with a real, DB-issued user + access token each:

| Role | Allowed case tested | Denied case tested |
|---|---|---|
| SUPER_ADMIN | `kyc.verify`, role-gated route | a permission code that was never seeded (not even SUPER_ADMIN gets what doesn't exist) |
| ADMIN | `user.read`, role-gated route | `investment.create` |
| INVESTOR | `investment.create` | `user.read`, role-gated route |
| RIDER | `vehicle.book` | `analytics.read`, role-gated route |
| BUSINESS | `fleet.create` | `investment.create`, role-gated route |

Plus: an unauthenticated request gets 401 regardless of which dependency
guards the route, and a suspended user's still-valid token gets 403 (not
401) — proving authentication and authorization fail differently and
correctly compose.

## Frontend

`frontend/src/lib/auth/`:

- **`types.ts`** — `Role`/`Permission` string-union types and `AuthUser`,
  mirroring the backend's enums and `UserPublic` shape.
- **`token-storage.ts`** — localStorage read/write for the access and
  refresh tokens (see [authentication.md](authentication.md) for why
  localStorage, not a cookie).
- **`auth-context.tsx`** — `AuthProvider`/`useAuth()`. On mount, if a
  token exists, hydrates the user via `GET /api/auth/me`; exposes
  `login`, `register`, `logout`.
- **`authorization.ts`** — `hasRole()`, `hasPermission()`,
  `hasAnyPermission()`, and a hand-maintained mirror of
  `ROLE_PERMISSIONS` from the backend's `seed.py`.

**These are UI hints, not a security boundary.** They decide what to
render — show/hide a button, redirect away from a page — never what data
is safe to display. Every actual data fetch still goes through the API,
which re-checks authorization server-side regardless of what the frontend
computed. `frontend/src/components/auth/ProtectedRoute.tsx` is the
route-guard built on this: it redirects unauthenticated visitors to
`/login` and shows an "Access denied" state when `roles`/`permissions`
props aren't satisfied by the current user, e.g.:

```tsx
<ProtectedRoute roles={["ADMIN", "SUPER_ADMIN"]}>
  <AdminContent />
</ProtectedRoute>
```

Two example pages demonstrate it end-to-end: `/dashboard` (any
authenticated user) and `/admin` (ADMIN/SUPER_ADMIN only) — both verified
live against the real backend: a self-registered RIDER is denied `/admin`
and sees 9 permissions on `/dashboard`; a directly-seeded ADMIN sees 17
permissions and is granted `/admin`.

**Why client-side guards, not Next.js middleware:** tokens live in
localStorage, which server/edge middleware can't read — there's no way to
gate a page before it renders without either moving to cookie-based
tokens (a trade-off explicitly declined in
[authentication.md](authentication.md)) or introducing a second,
non-authoritative cookie just for redirect hints. `ProtectedRoute` checks
auth state after hydration instead; the very first render is a brief
loading state, then either the content or a redirect.

## What's not implemented yet

**Update (SUPER_ADMIN module phase):** the matrix is no longer edit-only-
via-redeploy — `GET/POST/DELETE /api/admin/rbac/...` let SUPER_ADMIN view
and grant/revoke permissions per role at runtime (SUPER_ADMIN's own row is
still fixed and can't be edited). `ROLE_PERMISSIONS` in
`app/modules/permissions/seed.py` remains the *initial* seed, not the only
way to change it. See [admin.md](admin.md).

Still not implemented: real business endpoints (vehicles, fleets, trips,
payments, kyc submissions) to actually apply `require_permission` to —
those domains have no backend module yet at all (see admin.md's "Scope"
section for why). `require_permission`/`require_role` are proven
end-to-end via `tests/test_rbac.py` and `tests/test_admin.py`; wiring them
into real resource endpoints happens as each domain module is
implemented.
