import { PERMISSIONS, type AuthUser, type Permission, type Role } from "./types";

/**
 * UI-hint utilities only. The backend re-derives role/permissions from the
 * database on every request and is the sole authorization boundary (see
 * docs/authorization.md) — nothing here prevents a request from reaching
 * the API. Use these to decide what to render (show/hide a button, redirect
 * away from a page), never as the reason data is safe to display: any data
 * fetch must still come from an API call the backend itself authorizes.
 */

export function hasRole(user: AuthUser | null | undefined, ...roles: Role[]): boolean {
  return !!user && roles.includes(user.role);
}

// Mirrors backend/app/modules/permissions/seed.py ROLE_PERMISSIONS.
// Update by hand if that file changes — see docs/authorization.md.
const ROLE_PERMISSIONS: Record<Role, readonly Permission[] | "ALL"> = {
  SUPER_ADMIN: "ALL",
  // ADMIN is a scoped internal-operations role — view/update/suspend,
  // never create/activate/assign-role/manage-RBAC. See docs/admin.md.
  ADMIN: [
    "user.read",
    "user.update",
    "user.suspend",
    "vehicle.read",
    "vehicle.update",
    "fleet.read",
    "trip.read",
    "trip.update",
    "payment.read",
    "analytics.read",
    "kyc.read",
    "kyc.verify",
  ],
  INVESTOR: [
    "investment.read",
    "investment.create",
    "vehicle.read",
    "fleet.read",
    "trip.read",
    "analytics.read",
    "payment.read",
    "payment.create",
    "kyc.read",
    "kyc.submit",
  ],
  RIDER: [
    "vehicle.read",
    "vehicle.book",
    "trip.read",
    "trip.create",
    "trip.update",
    "payment.read",
    "payment.create",
    "kyc.read",
    "kyc.submit",
  ],
  BUSINESS: [
    "fleet.read",
    "fleet.create",
    "fleet.update",
    "vehicle.read",
    "vehicle.create",
    "vehicle.update",
    "trip.read",
    "trip.create",
    "trip.update",
    "analytics.read",
    "payment.read",
    "payment.create",
    "kyc.read",
    "kyc.submit",
    "user.read",
  ],
};

export function permissionsFor(role: Role): readonly Permission[] {
  const codes = ROLE_PERMISSIONS[role];
  return codes === "ALL" ? PERMISSIONS : codes;
}

export function hasPermission(user: AuthUser | null | undefined, ...codes: Permission[]): boolean {
  if (!user) return false;
  const granted = new Set(permissionsFor(user.role));
  return codes.every((code) => granted.has(code));
}

export function hasAnyPermission(user: AuthUser | null | undefined, ...codes: Permission[]): boolean {
  if (!user) return false;
  const granted = new Set(permissionsFor(user.role));
  return codes.some((code) => granted.has(code));
}
