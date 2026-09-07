"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { businessApi, formatCurrency, formatPercent } from "@/lib/business/api";
import type { BusinessAnalytics, BusinessProfile } from "@/lib/business/types";
import { ApiError } from "@/lib/api-client";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

const VERIFICATION_LABELS: Record<BusinessProfile["verification_status"], string> = {
  NOT_STARTED: "Not started",
  PENDING: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function BusinessDashboardPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([businessApi.getProfile(), businessApi.getAnalytics()])
      .then(([profileData, analyticsData]) => {
        if (cancelled) return;
        setProfile(profileData);
        setAnalytics(analyticsData);
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
        Fleet SaaS at a glance — vehicles, riders, trips, and revenue.
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
            <p className="text-lg font-medium text-brand-950">{profile.business_name}</p>
          </div>
          <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            Verification: {VERIFICATION_LABELS[profile.verification_status]}
          </span>
          {profile.verification_status !== "VERIFIED" && (
            <Link
              href="/business/documents"
              className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              Submit documents
            </Link>
          )}
        </div>
      )}

      {analytics && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total vehicles" value={analytics.total_vehicles} />
            <StatCard label="Active vehicles" value={analytics.active_vehicles} />
            <StatCard label="Active riders" value={analytics.active_riders} />
            <StatCard label="Total trips" value={analytics.total_trips} />
            <StatCard label="Total revenue" value={formatCurrency(analytics.total_revenue)} />
            <StatCard label="Utilization" value={formatPercent(analytics.utilization_percent)} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/business/fleets"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Manage fleets
            </Link>
            <Link
              href="/business/trips"
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50"
            >
              Log a trip
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
