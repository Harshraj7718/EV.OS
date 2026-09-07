import { describe, expect, it } from "vitest";
import { hasAnyPermission, hasPermission, hasRole, permissionsFor } from "./authorization";
import type { AuthUser } from "./types";

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "00000000-0000-0000-0000-000000000000",
    name: "Test User",
    email: "test@example.com",
    phone: "+919876543210",
    role: "RIDER",
    status: "ACTIVE",
    is_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("hasRole", () => {
  it("returns true when the user's role is in the allowed list", () => {
    const admin = makeUser({ role: "ADMIN" });
    expect(hasRole(admin, "ADMIN", "SUPER_ADMIN")).toBe(true);
  });

  it("returns false when the user's role is not in the allowed list", () => {
    const rider = makeUser({ role: "RIDER" });
    expect(hasRole(rider, "ADMIN", "SUPER_ADMIN")).toBe(false);
  });

  it("returns false for a null/undefined user", () => {
    expect(hasRole(null, "RIDER")).toBe(false);
    expect(hasRole(undefined, "RIDER")).toBe(false);
  });
});

describe("permissionsFor", () => {
  it("gives SUPER_ADMIN every permission", () => {
    expect(permissionsFor("SUPER_ADMIN")).toHaveLength(22);
  });

  it("gives RIDER exactly its documented set", () => {
    const codes = permissionsFor("RIDER");
    expect(codes).toContain("vehicle.book");
    expect(codes).toContain("trip.create");
    expect(codes).not.toContain("analytics.read");
    expect(codes).not.toContain("user.read");
  });

  it("gives ADMIN exactly its scoped operational set (not create/activate/assign-role/RBAC)", () => {
    const codes = permissionsFor("ADMIN");
    expect(new Set(codes)).toEqual(
      new Set([
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
      ]),
    );
    expect(codes).not.toContain("user.create");
    expect(codes).not.toContain("vehicle.create");
    expect(codes).not.toContain("fleet.update");
    expect(codes).not.toContain("investment.read");
  });
});

describe("hasPermission", () => {
  it("allows a permission the role's matrix grants", () => {
    const investor = makeUser({ role: "INVESTOR" });
    expect(hasPermission(investor, "investment.create")).toBe(true);
  });

  it("denies a permission the role's matrix doesn't grant", () => {
    const investor = makeUser({ role: "INVESTOR" });
    expect(hasPermission(investor, "user.read")).toBe(false);
  });

  it("requires every code passed, not just one", () => {
    const rider = makeUser({ role: "RIDER" });
    expect(hasPermission(rider, "vehicle.book", "trip.create")).toBe(true);
    expect(hasPermission(rider, "vehicle.book", "analytics.read")).toBe(false);
  });

  it("returns false for a null user", () => {
    expect(hasPermission(null, "vehicle.read")).toBe(false);
  });
});

describe("hasAnyPermission", () => {
  it("allows if the role grants at least one of the codes", () => {
    const business = makeUser({ role: "BUSINESS" });
    expect(hasAnyPermission(business, "investment.create", "fleet.read")).toBe(true);
  });

  it("denies if the role grants none of the codes", () => {
    const business = makeUser({ role: "BUSINESS" });
    expect(hasAnyPermission(business, "investment.create", "investment.read")).toBe(false);
  });
});
