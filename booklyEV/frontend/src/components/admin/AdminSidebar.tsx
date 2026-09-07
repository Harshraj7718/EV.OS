"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// ADMIN's own scoped panel — split from SUPER_ADMIN's full one (see
// SuperAdminSidebar.tsx and docs/admin.md). No RBAC / Audit Logs /
// Settings links: those pages don't exist under /admin/* at all
// ("modify system permissions" / "modify role definitions" / "access
// security secrets" are out of ADMIN's scope), not just hidden from nav.
// Everything listed here maps to a capability ADMIN was actually
// granted; the backend enforces the same boundary independently.
const NAV_SECTIONS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/investors", label: "Investors" },
  { href: "/admin/riders", label: "Riders" },
  { href: "/admin/businesses", label: "Businesses" },
  { href: "/admin/vehicles", label: "Vehicles" },
  { href: "/admin/fleets", label: "Fleets" },
  { href: "/admin/trips", label: "Trips" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/kyc", label: "KYC" },
  { href: "/admin/analytics", label: "Analytics" },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 py-6 pr-4">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
        Admin · Operations
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
