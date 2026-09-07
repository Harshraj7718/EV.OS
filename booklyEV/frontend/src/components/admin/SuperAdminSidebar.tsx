"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// SUPER_ADMIN's full panel, split into its own route tree from ADMIN's
// scoped one (see AdminSidebar.tsx and docs/admin.md) — no filtering
// needed here since every page under /super-admin/* is SUPER_ADMIN-only
// by construction, unlike the old shared /admin panel this replaced.
const NAV_SECTIONS = [
  { href: "/super-admin", label: "Overview" },
  { href: "/super-admin/users", label: "Users" },
  { href: "/super-admin/investors", label: "Investors" },
  { href: "/super-admin/riders", label: "Riders" },
  { href: "/super-admin/businesses", label: "Businesses" },
  { href: "/super-admin/vehicles", label: "Vehicles" },
  { href: "/super-admin/fleets", label: "Fleets" },
  { href: "/super-admin/trips", label: "Trips" },
  { href: "/super-admin/payments", label: "Payments" },
  { href: "/super-admin/kyc", label: "KYC" },
  { href: "/super-admin/rbac", label: "Roles & Permissions" },
  { href: "/super-admin/audit-logs", label: "Audit Logs" },
  { href: "/super-admin/analytics", label: "Analytics" },
  { href: "/super-admin/settings", label: "Settings" },
];

export function SuperAdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 py-6 pr-4">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
        Super Admin
      </p>
      <ul className="mt-3 space-y-0.5">
        {NAV_SECTIONS.map((item) => {
          const active = pathname === item.href;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={
                  active
                    ? "block rounded-lg bg-brand-100 px-3 py-2 text-sm font-medium text-brand-800"
                    : "block rounded-lg px-3 py-2 text-sm text-brand-900/70 hover:bg-brand-50"
                }
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
