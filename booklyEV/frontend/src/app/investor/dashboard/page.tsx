"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { investorApi, formatCurrency, formatPercent } from "@/lib/investor/api";
import type { InvestorProfile, PortfolioSummary } from "@/lib/investor/types";
import { ApiError } from "@/lib/api-client";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

const KYC_LABELS: Record<InvestorProfile["kyc_status"], string> = {
  NOT_STARTED: "Not started",
  PENDING: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function InvestorDashboardPage() {
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [portfolio, setPortfolio] = useState<PortfolioSummary | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([investorApi.getProfile(), investorApi.getPortfolio()])
      .then(([profileData, portfolioData]) => {
        if (cancelled) return;
        setProfile(profileData);
        setPortfolio(portfolioData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Dashboard</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Passive income at a glance — your investments, earnings, and returns.
      </p>

      {loading && <p className="mt-6 text-sm text-brand-900/50">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {!loading && needsProfile && (
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      )}

      {profile && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-white p-5">
          <div>
            <p className="text-sm text-brand-900/60">Signed in as</p>
            <p className="text-lg font-medium text-brand-950">{profile.legal_name}</p>
          </div>
          <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            KYC: {KYC_LABELS[profile.kyc_status]}
          </span>
          {profile.kyc_status !== "VERIFIED" && (
            <Link
              href="/investor/kyc"
              className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              Complete KYC
            </Link>
          )}
        </div>
      )}

      {portfolio && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total invested" value={formatCurrency(portfolio.total_invested)} />
            <StatCard label="EV assets owned" value={portfolio.assets_owned} />
            <StatCard label="Total earnings" value={formatCurrency(portfolio.total_earnings)} />
            <StatCard
              label="Unpaid earnings balance"
              value={formatCurrency(portfolio.unpaid_earnings_balance)}
            />
            <StatCard label="Total payouts" value={formatCurrency(portfolio.total_payouts)} />
            <StatCard label="ROI" value={formatPercent(portfolio.roi_percent)} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/investor/investments"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Browse opportunities
            </Link>
            <Link
              href="/investor/payouts"
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50"
            >
              Request payout
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
