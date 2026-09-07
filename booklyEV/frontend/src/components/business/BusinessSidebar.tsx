"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  { href: "/business/dashboard", label: "Dashboard" },
  { href: "/business/profile", label: "Profile" },
  { href: "/business/fleets", label: "Fleets" },
  { href: "/business/vehicles", label: "Vehicles" },
  { href: "/business/riders", label: "Riders" },
  { href: "/business/assignments", label: "Assignments" },
  { href: "/business/trips", label: "Trips" },
  { href: "/business/revenue", label: "Revenue" },
  { href: "/business/analytics", label: "Analytics" },
  { href: "/business/documents", label: "Documents" },
  { href: "/business/settings", label: "Settings" },
];

export function BusinessSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 py-6 pr-4">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
        Business
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
