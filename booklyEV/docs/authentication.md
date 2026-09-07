# Authentication

Implemented by the `auth`, `users`, and `roles` modules
(`backend/app/modules/{auth,users,roles}/`).

## Model

```
User
  ↓ role_id (FK, required)
Role         SUPER_ADMIN | ADMIN | INVESTOR | RIDER | BUSINESS
```

`User` fields: `id` (UUID), `name`, `email` (unique), `phone` (unique,
E.164), `password_hash` (bcrypt, never returned by the API), `role_id`,
`status` (`ACTIVE` / `INACTIVE` / `SUSPENDED` / `PENDING`), `is_verified`,
`created_at`, `updated_at`.

**Public registration always assigns the RIDER role.** `RegisterRequest`
has no `role` field at all — a client cannot request ADMIN/SUPER_ADMIN (or
any role) at signup, and the server never reads a role from the request
body. Assigning any other role requires direct, server-side action (e.g. a
future internal admin tool) — there is no such endpoint yet.

## Endpoints

| Method | Path | Auth required | Notes |
|---|---|---|---|
| POST | `/api/auth/register` | No | Returns a token pair + the new user. 201. |
| POST | `/api/auth/login` | No | Returns a token pair + the user. 401 on bad credentials, 403 if the account isn't ACTIVE. |
| POST | `/api/auth/refresh` | No (refresh token in body) | Rotates the refresh token; returns a new pair. |
| POST | `/api/auth/logout` | No (refresh token in body) | Revokes that refresh token. Idempotent — 204 even for an already-invalid token. |
| GET | `/api/auth/me` | Yes (Bearer access token) | Returns the current user. |
| POST | `/api/auth/change-password` | Yes (Bearer access token) | Requires `current_password`; revokes all of the user's refresh tokens on success. |

All error responses share one shape: `{"error": {"code", "message", "details"}}`.

## Tokens

- **Access token**: JWT, `ACCESS_TOKEN_EXPIRE_MINUTES` (default 15 min),
  `type: "access"`, signed HS256 with `SECRET_KEY`. Returned in the JSON
  response body (not a cookie) — see the trade-off note below.
- **Refresh token**: JWT, `REFRESH_TOKEN_EXPIRE_DAYS` (default 7 days),
  `type: "refresh"`. Also returned in the JSON body.

Every request to a protected endpoint must send
`Authorization: Bearer <access_token>`. Missing, malformed, wrong-type, or
expired tokens → **401** with a `WWW-Authenticate: Bearer` header.
`get_current_user` (`app/api/deps.py`) additionally re-checks the user's
`status` on every call — a token issued before a suspension remains
cryptographically valid but is rejected (403) the moment it's used.

### Why JSON body, not an HttpOnly cookie

Simpler to integrate with the Next.js frontend and to test, and matches
the endpoint contract as specified (`/api/auth/refresh` takes the token as
an explicit parameter). The trade-off: a refresh token readable by frontend
JS is more exposed to XSS token theft than an HttpOnly cookie would be.
Revisit this if/when the frontend gains features that increase XSS surface
(rich text rendering, third-party widgets, etc.).

### Refresh token revocation

Refresh tokens are tracked server-side in the `refresh_tokens` table —
never as the raw JWT, only a SHA-256 digest (`hash_token()` in
`core/security.py`), so a database leak alone can't be replayed.

- **Rotation**: every `/api/auth/refresh` call revokes the presented token
  and issues a brand new pair. A refresh token is single-use.
- **Reuse detection**: if an already-revoked refresh token is presented
  again (someone replaying a stolen/rotated-away token), the service
  revokes *every* active refresh token for that user, forcing a fresh
  login everywhere.
- **Logout**: revokes the presented refresh token.
- **Change password**: revokes *all* of the user's refresh tokens — every
  other session must log in again.

## Password policy

Enforced in `modules/auth/schemas.py` (`validate_password_strength`):
minimum 8 characters, at least one letter, at least one digit. Applied to
both registration and `change-password`'s `new_password`.

## Validation

- **Email**: `pydantic.EmailStr` (via `email-validator`).
- **Phone**: E.164 format (`+` followed by 8–15 digits), enforced with a
  regex in `modules/auth/schemas.py`.
- Both violations, and a weak password, return **422** with per-field
  details in `error.details`.

## What's structural but not wired up yet

`modules/auth/models.py` defines `VerificationToken` (a `purpose` enum of
`EMAIL_VERIFICATION` / `PHONE_VERIFICATION` / `PASSWORD_RESET`, hashed
token, expiry, `used_at`) so forgot-password, reset-password, and
email/phone verification can be added without a schema change — but no
router or service uses it yet. `User.is_verified` exists and defaults to
`false`; nothing currently flips it to `true`.

## Testing

`backend/tests/test_auth.py` (27 tests total with `test_health.py`) covers
registration (success, duplicate email/phone, weak password, invalid
email/phone, role can't be client-supplied), login (success, wrong
password, unknown email), `/me` (missing/invalid/expired/wrong-type token),
refresh (rotation, reuse rejection, invalid/wrong-type token), logout
(revokes token, idempotent), and change-password (success + old password
now rejected, wrong current password, revokes other sessions, requires
auth).

Tests run against a real Postgres database (`booklynk_ev_test`, created
automatically), each wrapped in a transaction/savepoint that's rolled back
afterward — see `backend/tests/conftest.py`.
