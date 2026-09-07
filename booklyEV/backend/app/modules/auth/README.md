# auth module

Status: **implemented** (registration, login, JWT access/refresh, logout,
current-user, change-password).

- `enums.py` — `VerificationPurpose` (structure for future forgot/reset
  password and email/phone verification flows).
- `models.py` — `RefreshToken` (rotated, revocable, hash-at-rest) and
  `VerificationToken` (structural placeholder — no router uses it yet).
- `schemas.py` — request/response Pydantic models, password/phone
  validators.
- `repository.py` — `RefreshTokenRepository`.
- `service.py` — `AuthService`: register, login, refresh (rotates +
  reuse-detection), logout, get_current_user, change_password.
- `router.py` — `POST /api/auth/{register,login,refresh,logout,change-password}`,
  `GET /api/auth/me`.

Not implemented yet (tracked for a later phase): forgot-password,
reset-password, email verification, phone verification endpoints —
`VerificationToken` reserves their schema.
