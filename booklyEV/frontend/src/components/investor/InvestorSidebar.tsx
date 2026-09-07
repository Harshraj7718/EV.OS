"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_SECTIONS = [
  { href: "/investor/dashboard", label: "Dashboard" },
  { href: "/investor/investments", label: "Investments" },
  { href: "/investor/assets", label: "My EV Assets" },
  { href: "/investor/portfolio", label: "Portfolio" },
  { href: "/investor/earnings", label: "Earnings" },
  { href: "/investor/transactions", label: "Transactions" },
  { href: "/investor/payouts", label: "Payouts" },
  { href: "/investor/kyc", label: "KYC" },
  { href: "/investor/documents", label: "Documents" },
  { href: "/investor/profile", label: "Profile" },
];

export function InvestorSidebar() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 py-6 pr-4">
      <p className="px-3 text-xs font-semibold uppercase tracking-wide text-brand-900/40">
        Investor
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
