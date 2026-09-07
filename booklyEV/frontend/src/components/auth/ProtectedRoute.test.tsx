/**
 * ProtectedRoute is a UX convenience, not the real security boundary (the
 * backend re-authorizes every request — see the component's own docstring
 * and docs/security-audit.md). These tests exist to prove the one thing
 * that DOES matter about it: it must never render protected children (or
 * any data) for an unauthenticated visitor or a wrong-role/permission
 * user — only a loading state, a redirect, or an "Access denied" message.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ProtectedRoute } from "./ProtectedRoute";
import { useAuth } from "@/lib/auth/auth-context";
import type { AuthUser } from "@/lib/auth/types";

const replaceMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: replaceMock }),
}));

vi.mock("@/lib/auth/auth-context", () => ({
  useAuth: vi.fn(),
}));

const mockedUseAuth = vi.mocked(useAuth);

function makeUser(overrides: Partial<AuthUser> = {}): AuthUser {
  return {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Test User",
    email: "test@example.com",
    phone: "+919900000000",
    role: "RIDER",
    status: "ACTIVE",
    is_verified: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    ...overrides,
  };
}

describe("ProtectedRoute", () => {
  it("renders nothing (no children, no data) while auth state is still loading", () => {
    mockedUseAuth.mockReturnValue({
      user: null,
      status: "loading",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProtectedRoute>
        <div>Secret dashboard content</div>
      </ProtectedRoute>,
    );

    expect(screen.queryByText("Secret dashboard content")).not.toBeInTheDocument();
  });

  it("renders nothing and redirects to /login for an unauthenticated visitor", () => {
    replaceMock.mockClear();
    mockedUseAuth.mockReturnValue({
      user: null,
      status: "unauthenticated",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProtectedRoute roles={["BUSINESS"]}>
        <div>Secret dashboard content</div>
      </ProtectedRoute>,
    );

    expect(screen.queryByText("Secret dashboard content")).not.toBeInTheDocument();
    expect(replaceMock).toHaveBeenCalledWith("/login");
  });

  it("shows Access denied — never the protected children — for a wrong-role user", () => {
    mockedUseAuth.mockReturnValue({
      user: makeUser({ role: "RIDER" }),
      status: "authenticated",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProtectedRoute roles={["BUSINESS"]}>
        <div>Secret business fleet data</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("Secret business fleet data")).not.toBeInTheDocument();
  });

  it("shows Access denied for a wrong-permission user even with a matching role omitted", () => {
    mockedUseAuth.mockReturnValue({
      user: makeUser({ role: "RIDER" }),
      status: "authenticated",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProtectedRoute permissions={["kyc.verify"]}>
        <div>Verifier-only content</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Access denied")).toBeInTheDocument();
    expect(screen.queryByText("Verifier-only content")).not.toBeInTheDocument();
  });

  it("renders children for a correctly-authorized user", () => {
    mockedUseAuth.mockReturnValue({
      user: makeUser({ role: "BUSINESS" }),
      status: "authenticated",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProtectedRoute roles={["BUSINESS"]}>
        <div>Secret business fleet data</div>
      </ProtectedRoute>,
    );

    expect(screen.getByText("Secret business fleet data")).toBeInTheDocument();
    expect(screen.queryByText("Access denied")).not.toBeInTheDocument();
  });

  it("does not redirect an authenticated-but-unauthorized user away from the page", () => {
    replaceMock.mockClear();
    mockedUseAuth.mockReturnValue({
      user: makeUser({ role: "RIDER" }),
      status: "authenticated",
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
    });

    render(
      <ProtectedRoute roles={["BUSINESS"]}>
        <div>Secret business fleet data</div>
      </ProtectedRoute>,
    );

    // Access-denied is shown in place, not redirected — the only
    // programmatic redirect this component performs is for status ===
    // "unauthenticated" (see the component's useEffect).
    expect(replaceMock).not.toHaveBeenCalled();
  });
});
