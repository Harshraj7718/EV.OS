"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/lib/auth/auth-context";
import { hasRole, permissionsFor } from "@/lib/auth/authorization";
import { env } from "@/lib/env";
import type { Role } from "@/lib/auth/types";

// Maps each role to the portal value that scopes its Vercel deployment
// (see docs/vercel-deployment.md). Used only to avoid showing a dashboard
// link to a route tree this deployment doesn't serve — env.portal is
// undefined for local dev/Docker, where every role's link is shown as before.
const PORTAL_FOR_ROLE: Record<Role, string> = {
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
  INVESTOR: "investor",
  RIDER: "rider",
  BUSINESS: "business",
};

function DashboardContent() {
  const { user, logout } = useAuth();
  const router = useRouter();

  if (!user) return null;

  const onThisPortal = (role: Role) => !env.portal || env.portal === PORTAL_FOR_ROLE[role];

  async function handleLogout() {
    await logout();
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-2xl px-6 py-16">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-950">Dashboard</h1>
        <button
          onClick={handleLogout}
          className="rounded-full border border-brand-200 px-4 py-1.5 text-sm text-brand-900 hover:bg-brand-50"
        >
          Log out
        </button>
      </div>

      <div className="mt-8 rounded-2xl border border-brand-100 bg-white p-6">
        <p className="text-sm text-brand-900/60">Signed in as</p>
        <p className="mt-1 text-lg font-medium text-brand-950">{user.name}</p>
        <p className="text-sm text-brand-900/70">{user.email}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-brand-100 px-3 py-1 text-xs font-semibold text-brand-700">
            {user.role}
          </span>
          <span className="rounded-full bg-brand-50 px-3 py-1 text-xs text-brand-700">
            {user.status}
          </span>
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6">
        <p className="text-sm font-medium text-brand-950">Effective permissions</p>
        <p className="mt-1 text-xs text-brand-900/50">
          Computed client-side from your role — a UI hint only. The backend enforces the
          real permission set on every request.
        </p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {permissionsFor(user.role).map((code) => (
            <code
              key={code}
              className="rounded bg-brand-50 px-2 py-1 text-xs text-brand-800"
            >
              {code}
            </code>
          ))}
        </div>
      </div>

      {hasRole(user, "SUPER_ADMIN") && onThisPortal("SUPER_ADMIN") && (
        <p className="mt-6 text-sm text-brand-900/60">
          As SUPER_ADMIN, you have full platform control via the{" "}
          <Link href="/super-admin" className="font-medium text-brand-600 hover:text-brand-700">
            super admin dashboard
          </Link>
          .
        </p>
      )}

      {hasRole(user, "ADMIN") && onThisPortal("ADMIN") && (
        <p className="mt-6 text-sm text-brand-900/60">
          As ADMIN, you have access to the operational{" "}
          <Link href="/admin" className="font-medium text-brand-600 hover:text-brand-700">
            admin dashboard
          </Link>
          .
        </p>
      )}

      {hasRole(user, "INVESTOR") && onThisPortal("INVESTOR") && (
        <p className="mt-6 text-sm text-brand-900/60">
          As an INVESTOR, track your passive income via the{" "}
          <Link href="/investor" className="font-medium text-brand-600 hover:text-brand-700">
            investor dashboard
          </Link>
          .
        </p>
      )}

      {hasRole(user, "RIDER") && onThisPortal("RIDER") && (
        <p className="mt-6 text-sm text-brand-900/60">
          As a RIDER, book a vehicle and manage jobs via the{" "}
          <Link href="/rider" className="font-medium text-brand-600 hover:text-brand-700">
            rider dashboard
          </Link>
          .
        </p>
      )}

      {hasRole(user, "BUSINESS") && onThisPortal("BUSINESS") && (
        <p className="mt-6 text-sm text-brand-900/60">
          As a BUSINESS, operate your EV fleets via the{" "}
          <Link href="/business" className="font-medium text-brand-600 hover:text-brand-700">
            business dashboard
          </Link>
          .
        </p>
      )}

      {env.portal && !onThisPortal(user.role) && (
        <p className="mt-6 text-sm text-amber-700">
          Your account&apos;s role ({user.role}) doesn&apos;t match this portal. Use the{" "}
          {PORTAL_FOR_ROLE[user.role]} deployment for your dashboard instead.
        </p>
      )}
    </div>
  );
}

export default function DashboardPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <ProtectedRoute>
          <DashboardContent />
        </ProtectedRoute>
      </main>
      <Footer />
    </>
  );
}
