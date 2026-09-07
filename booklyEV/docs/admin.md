# Admin Panel (SUPER_ADMIN & ADMIN)

Implemented by `app/modules/admin/` (the API surface) plus additions to
`users`, `permissions`, `roles`, `audit`, and `analytics`. **One backend
module, two separate frontend route trees**: `frontend/src/app/super-admin/`
(SUPER_ADMIN-exclusive, full panel) and `frontend/src/app/admin/` (ADMIN-
exclusive, scoped panel) — matching the single-role pattern `/investor`,
`/rider`, and `/business` already use, rather than one shared `/admin`
shell branching on role. The backend `/api/admin/*` module is completely
unaware of this split and unchanged by it: both frontends call the same
endpoints, gated exactly as described below, regardless of which route
tree made the call.

## Scope: what's real vs. placeholder

This module gives full control over everything that has a real backing
data model today: **users** (and, since Investors/Riders/Businesses are
just users with those roles, that covers them too), the **RBAC matrix**,
**audit logs**, and real **analytics** computed from actual rows.

**Vehicles, Fleets, Trips, Payments, and KYC have no backend module yet** —
those domains were explicitly deferred in every earlier phase of this
project. Rather than fake it, those five dashboard sections exist as real
navigation entries with an honest "not implemented yet" empty state — no
synthetic data, no endpoints that return nothing meaningful. `vehicle.*`,
`fleet.read`, `trip.*`, `payment.read`, and `kyc.*` already exist as
seeded permissions (see [authorization.md](authorization.md)) and are
ready to guard real endpoints the moment those domains exist — ADMIN's
grant already includes the ones its spec calls for (`vehicle.read/update`,
`fleet.read`, `trip.read/update`, `payment.read`, `kyc.read/verify`), so
no RBAC work will be needed when those modules land, only the endpoints
themselves.

## Two roles, one panel, per-endpoint gating

Every route under `/api/admin/*` uses one of two dependencies:

- **`require_role(RoleName.SUPER_ADMIN)`** — for anything ADMIN must
  never reach *regardless of its permission grants*: creating a user,
  activating a suspended account, assigning roles, managing the RBAC
  matrix, reading audit logs, reading settings. These map directly to
  "ADMIN cannot: manage SUPER_ADMIN, modify system permissions, modify
  role definitions, access security secrets."
- **`require_admin_permission(code)`** — for endpoints ADMIN's scoped
  permission set legitimately covers (view/update users, suspend, view
  stakeholders, view analytics). It's not just `require_permission`:
  INVESTOR/RIDER/BUSINESS hold overlapping codes too (`user.read` is on
  BUSINESS's grant, for its own future features) — `require_admin_permission`
  first confirms the caller is internal ops staff (SUPER_ADMIN or ADMIN)
  and only *then* checks the permission, so holding a matching code never
  grants entry to `/admin` on its own. See `app/api/deps.py`.

Additionally, `AdminUserService._assert_can_manage_target()` refuses to
let a non-SUPER_ADMIN actor update/suspend/activate/reassign a
**SUPER_ADMIN** target — so even though ADMIN reaches the update/suspend
endpoints via `require_admin_permission`, a SUPER_ADMIN account is still
completely out of its reach. Managing another **ADMIN** account is fine
(not restricted) — that's a legitimate ops action (e.g. offboarding), not
a privilege-escalation vector.

## ADMIN operational role

Exact grant (12 permissions — see [authorization.md](authorization.md)
for the full matrix):

| Section | ADMIN can |
|---|---|
| Users | view, update, suspend |
| Investors / Riders / Businesses | view only (read-only pages — manage the underlying account from Users instead) |
| Vehicles | view, update *(no backend yet — placeholder)* |
| Fleets | view *(no backend yet — placeholder)* |
| Trips | view, update *(no backend yet — placeholder)* |
| Payments | view *(no backend yet — placeholder)* |
| KYC | view, verify *(no backend yet — placeholder)* |
| Analytics | view |

**ADMIN cannot** (each mapped to how it's actually enforced):

| Restriction | Enforcement |
|---|---|
| Manage SUPER_ADMIN | `AdminUserService._assert_can_manage_target()` — 403 regardless of which permission-gated endpoint is used |
| Modify system permissions / role definitions | `/roles`, `/permissions`, `/rbac/matrix`, grant/revoke — all `require_role(SUPER_ADMIN)` |
| Access security secrets | `/settings` — `require_role(SUPER_ADMIN)`, even though the payload itself has no secrets in it |
| Create users, activate users, assign roles | Each endpoint is `require_role(SUPER_ADMIN)`, not permission-gated — the primary privilege-escalation vectors (an ADMIN granting itself/anyone SUPER_ADMIN) are closed at the route level, not just the service level |
| Unrestricted database operations | By construction — every write is a specific, permission-checked service method; no generic/raw query surface exists at all |

Two capabilities were **removed** from ADMIN's original (SUPER_ADMIN
module phase) grant to match this spec exactly: `user.create` and
`fleet.create`/`fleet.update`/`vehicle.create` are no longer granted, and
`investment.read` was dropped (investors are view-only for ADMIN via the
Users/Investors pages, not investment-data access). See
`app/modules/permissions/seed.py`'s `ROLE_PERMISSIONS[RoleName.ADMIN]`.

## API (`/api/admin/*`)

| Method | Path | Gate | Notes |
|---|---|---|---|
| GET | `/users` | `user.read` | Paginated; `search`, `role`, `status` filters |
| POST | `/users` | SUPER_ADMIN only | Can assign **any** role, including ADMIN/SUPER_ADMIN — unlike public `/api/auth/register` |
| GET | `/users/{id}` | `user.read` | |
| PATCH | `/users/{id}` | `user.update` | name/email/phone; 403 if target is SUPER_ADMIN and actor isn't |
| POST | `/users/{id}/suspend` | `user.suspend` | 403 if target is SUPER_ADMIN and actor isn't; 409 if this is the last active SUPER_ADMIN |
| POST | `/users/{id}/activate` | SUPER_ADMIN only | |
| POST | `/users/{id}/role` | SUPER_ADMIN only | 409 if reassigning the last active SUPER_ADMIN away from that role |
| GET | `/investors`, `/riders`, `/businesses` | `user.read` | `GET /users` pre-filtered by role — no separate profile tables exist |
| GET | `/roles`, `/permissions`, `/rbac/matrix` | SUPER_ADMIN only | |
| POST/DELETE | `/rbac/roles/{role}/permissions/{code}` | SUPER_ADMIN only | 400 if `role` is SUPER_ADMIN (its matrix is fixed) |
| GET | `/audit-logs` | SUPER_ADMIN only | Paginated; `action`, `target_type` filters |
| GET | `/analytics/overview` | `analytics.read` | Real aggregate counts only |
| GET | `/settings` | SUPER_ADMIN only | Non-secret config only |

## Security

- **Backend is the only source of truth.** Every route re-derives the
  caller's role and permissions from the database on every request;
  nothing from the client (a JWT claim, a request field) is trusted. See
  [authorization.md](authorization.md).
- **401 vs 403**: unauthenticated → 401 (from `get_current_user`, before
  any admin logic runs); authenticated but lacking the role/permission →
  403. Verified for every role on every endpoint category —
  `tests/test_admin.py` and `tests/test_admin_role.py`.
- **Passwords never exposed**: every user-returning response uses
  `UserPublic`, which has no `password_hash` field at all — not "hidden",
  structurally absent from the schema.
- **Last-SUPER_ADMIN protection**: there's no user-delete endpoint (only
  suspend/activate/role-assign are in scope), so "prevent deleting the
  last SUPER_ADMIN" is implemented as: block **suspending** or
  **reassigning the role of** the last active SUPER_ADMIN — either action
  would functionally remove the platform's last super-admin access.
  `AdminUserService._is_last_active_super_admin()`; raises
  `LastSuperAdminError` (409, code `last_super_admin`).
- **Audit logging**: every write in this module is logged to `audit_logs`
  in the *same DB transaction* as the change. Reads (list/view) are not
  logged — "sensitive actions" is interpreted as state-changing writes.
- **Validation**: `AdminCreateUserRequest`/`AdminUpdateUserRequest` reuse
  the same email/phone/password validators as public registration
  (`app/core/validation.py`).

## Frontend

Two independent route trees, each gated once at the layout level — no
per-page nested guards, no role branching inside shared page components:

- **`app/super-admin/layout.tsx`** wraps every `/super-admin/*` page in
  `<ProtectedRoute roles={["SUPER_ADMIN"]}>`, using `SuperAdminSidebar`
  (all 14 sections, including RBAC, Audit Logs, Settings).
- **`app/admin/layout.tsx`** wraps every `/admin/*` page in
  `<ProtectedRoute roles={["ADMIN"]}>`, using `AdminSidebar` (11 sections
  — no RBAC, Audit Logs, or Settings links). Those three pages don't
  exist as routes under `/admin/*` at all — not hidden, not gated,
  genuinely absent — so navigating there directly by URL 404s rather
  than rendering an "Access denied" state.

Each tree's Users page is now a plain, single-purpose component instead
of branching on `hasRole(user, "SUPER_ADMIN")`:

- **`super-admin/users/page.tsx`**: always shows "New user", the
  role-assignment `<select>`, and "Activate" for suspended users —
  correct unconditionally, since this route only ever renders for
  SUPER_ADMIN.
- **`admin/users/page.tsx`**: never shows those — a SUPER_ADMIN target
  renders no action at all, and a suspended user shows a plain
  "Suspended" label (no activate capability), matching ADMIN's actual
  grant unconditionally.
- **Investors/Riders/Businesses pages** (`StakeholderTable`, shared by
  both trees): still checks `hasRole(user, "SUPER_ADMIN")` internally to
  decide whether to render the action column, since ADMIN's grant for
  these three sections is "view" only — this is the one place role
  branching remains, because the component itself is shared rather than
  duplicated per tree. Never a security boundary (the backend is that),
  only to avoid showing ADMIN a button that would just 403.

`components/admin/`:

- **`DataTable`** — generic table (any row type, typed columns, optional
  per-row actions slot).
- **`SearchInput`** — debounced (300ms).
- **`FilterSelect`** — single-select dropdown filter.
- **`Pagination`** — page/page_size/total controls.
- **`StatusBadge`** — colored ACTIVE/INACTIVE/SUSPENDED/PENDING pill.
- **`StakeholderTable`** — composes the above for the Investors/Riders/
  Businesses pages so that pattern isn't triplicated.
- **`EmptyState`** — the honest "not implemented yet" placeholder used by
  Vehicles/Fleets/Trips/Payments/KYC.

`lib/admin/api.ts` wraps every `/api/admin/*` endpoint through the shared
`apiClient` (bearer token + refresh-on-401 already handled there — see
[authentication.md](authentication.md)).

### A real bug this surfaced (SUPER_ADMIN module phase)

`apiClient`'s response handling assumed a `content-type: application/json`
header meant there was JSON to parse. FastAPI sets that header even on a
body-less `204 No Content` response, so `response.json()` was throwing a
`SyntaxError` on every 204 (grant/revoke permission, logout,
change-password) — masked earlier because `logout()` swallows its errors.
Fixed in `frontend/src/lib/api-client.ts`: a response is now treated as
body-less (skip `.json()`) when its status is 204/205 or
`Content-Length: 0`, regardless of `Content-Type`.

## Testing

- **`backend/tests/test_admin.py`** (21 tests): SUPER_ADMIN-exclusive
  routes are denied to every other role (via `/settings`, a route with no
  permission-based exception); user CRUD, the last-SUPER_ADMIN guard,
  audit log verification, RBAC matrix grant/revoke (including the
  SUPER_ADMIN-is-immutable guard), filtered stakeholder views, analytics
  accuracy, settings never exposing secrets.
- **`backend/tests/test_admin_role.py`** (18 tests, added for the ADMIN
  operational role): the exact 12-permission grant verified against the
  live RBAC matrix; every granted capability exercised as a real request
  (view/update/suspend users incl. another ADMIN, view stakeholders,
  view analytics); every explicit restriction denied (create, activate,
  RBAC read/write, audit logs, settings); and dedicated privilege-
  escalation attempts — updating or suspending a SUPER_ADMIN target,
  assigning SUPER_ADMIN to self or another user, creating a SUPER_ADMIN
  account outright, and self-granting an extra permission via the RBAC
  endpoint — each asserted 403, with one test also confirming the
  attempted role-escalation had zero effect on the target's actual role.

Verified live in the browser against the real backend (SUPER_ADMIN
module phase): creating a user, toggling a permission (which is what
surfaced the 204 bug above) and seeing it audit-logged, and a
freshly-created ADMIN account hitting `/admin` and getting the frontend's
"Access denied" state (from the phase before ADMIN was let into `/admin`
at all — now superseded by ADMIN having its own dedicated `/admin` tree).
