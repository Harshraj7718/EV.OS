"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import { hasPermission, hasRole } from "@/lib/auth/authorization";
import type { Permission, Role } from "@/lib/auth/types";

interface ProtectedRouteProps {
  children: ReactNode;
  /** If set, the user's role must be one of these. */
  roles?: Role[];
  /** If set, the user must have every one of these permissions. */
  permissions?: Permission[];
  redirectTo?: string;
}

/**
 * Client-side route guard. Tokens live in localStorage (not a cookie —
 * see docs/authentication.md), so there's no server/edge-middleware way to
 * gate a page before it renders; this checks auth state after hydration
 * and redirects unauthenticated visitors. This is a UX convenience, not a
 * security boundary — any data the page fetches is still authorized by
 * the backend on every request, so a user who bypasses this component
 * (e.g. disables JS) still can't get real data they're not allowed to see.
 */
export function ProtectedRoute({ children, roles, permissions, redirectTo = "/login" }: ProtectedRouteProps) {
  const { user, status } = useAuth();
  const router = useRouter();

  const isAuthorized =
    (!roles || hasRole(user, ...roles)) && (!permissions || hasPermission(user, ...permissions));

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace(redirectTo);
    }
  }, [status, router, redirectTo]);

  if (status === "loading") {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-sm text-brand-900/60">
        Loading…
      </div>
    );
  }

  if (status === "unauthenticated") {
    return null;
  }

  if (!isAuthorized) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-2 text-center px-6">
        <h2 className="text-lg font-semibold text-brand-950">Access denied</h2>
        <p className="text-sm text-brand-900/60">You don&apos;t have permission to view this page.</p>
      </div>
    );
  }

  return <>{children}</>;
}
