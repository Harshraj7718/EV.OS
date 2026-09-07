# roles module

Status: **implemented** (fixed role catalog only — permission-based
authorization is not built yet).

- `enums.py` — `RoleName` (SUPER_ADMIN, ADMIN, INVESTOR, RIDER, BUSINESS)
  and `DEFAULT_SELF_SIGNUP_ROLE` (RIDER — the only role public registration
  can produce).
- `models.py` — `Role`.
- `repository.py` — `RoleRepository`.
- `seed.py` — idempotent seed of the five roles; run via `python -m app.seed`.

Not implemented yet: the `permissions` module and a `role_permissions`
join table for permission-based authorization (`user.read`, `vehicle.book`,
etc.) — this phase only assigns a role to each user, it doesn't enforce
what that role can do.
