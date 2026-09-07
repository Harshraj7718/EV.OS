"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  { href: "/rider/dashboard", label: "Dashboard" },
  { href: "/rider/vehicles", label: "Available EVs" },
  { href: "/rider/bookings", label: "Bookings" },
  { href: "/rider/current-vehicle", label: "Current Vehicle" },
  { href: "/rider/trips", label: "Trips" },
  { href: "/rider/jobs", label: "Jobs" },
  { href: "/rider/earnings", label: "Earnings" },
  { href: "/rider/payments", label: "Payments" },
  { href: "/rider/kyc", label: "KYC" },
  { href: "/rider/documents", label: "Documents" },
  { href: "/rider/profile", label: "Profile" },
  { href: "/rider/support", label: "Support" },
];

export function RiderSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 py-6 pr-4">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
        Rider
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
