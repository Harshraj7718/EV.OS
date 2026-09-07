// Mirrors backend/app/modules/roles/enums.py RoleName.
export const ROLES = ["SUPER_ADMIN", "ADMIN", "INVESTOR", "RIDER", "BUSINESS"] as const;
export type Role = (typeof ROLES)[number];

// Mirrors backend/app/modules/permissions/seed.py PERMISSION_DEFINITIONS.
// Kept as a compile-time union (not a bare `string`) so a typo in a
// hasPermission("vehicel.book") call is a build error, not a silent 403.
// Update by hand if the backend catalog changes — see docs/authorization.md.
export const PERMISSIONS = [
  "user.read",
  "user.create",
  "user.update",
  "user.suspend",
  "vehicle.read",
  "vehicle.create",
  "vehicle.update",
  "vehicle.book",
  "fleet.read",
  "fleet.create",
  "fleet.update",
  "investment.read",
  "investment.create",
  "trip.read",
  "trip.create",
  "trip.update",
  "payment.read",
  "payment.create",
  "analytics.read",
  "kyc.read",
  "kyc.submit",
  "kyc.verify",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export type UserStatus = "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING";

// Mirrors backend UserPublic (modules/users/schemas.py) — never includes
// a password hash; the backend never sends one.
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  status: UserStatus;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}
