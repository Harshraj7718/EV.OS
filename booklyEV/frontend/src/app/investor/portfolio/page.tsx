"use client";

import { useEffect, useState } from "react";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi, formatCurrency, formatPercent } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import type { PortfolioSummary } from "@/lib/investor/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

export default function InvestorPortfolioPage() {
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    investorApi
      .getPortfolio()
      .then((data) => {
        if (!cancelled) setPortfolio(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load portfolio.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Portfolio</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Portfolio</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        A full snapshot of what you&apos;ve invested and what it&apos;s returned.
      </p>

      {loading && <p className="mt-6 text-sm text-brand-900/50">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {portfolio && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total invested" value={formatCurrency(portfolio.total_invested)} />
          <StatCard label="EV assets owned" value={portfolio.assets_owned} />
          <StatCard label="Total earnings" value={formatCurrency(portfolio.total_earnings)} />
          <StatCard
            label="Earnings paid out"
            value={formatCurrency(portfolio.total_earnings_paid)}
          />
          <StatCard
            label="Unpaid earnings balance"
            value={formatCurrency(portfolio.unpaid_earnings_balance)}
          />
          <StatCard label="Total payouts" value={formatCurrency(portfolio.total_payouts)} />
          <StatCard label="Return on investment" value={formatPercent(portfolio.roi_percent)} />
        </div>
      )}
    </div>
  );
}
