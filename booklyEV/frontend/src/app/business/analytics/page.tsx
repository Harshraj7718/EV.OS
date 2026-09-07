"use client";

import { useEffect, useState } from "react";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi, formatCurrency, formatPercent } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { BusinessAnalytics } from "@/lib/business/types";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

export default function BusinessAnalyticsPage() {
  const [analytics, setAnalytics] = useState<BusinessAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    businessApi
      .getAnalytics()
      .then((data) => {
        if (!cancelled) setAnalytics(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load analytics.");
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
        <h1 className="text-2xl font-semibold text-brand-950">Analytics</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Analytics</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Fleet-wide totals across your vehicles, riders, trips, and revenue.
      </p>

      {loading && <p className="mt-6 text-sm text-brand-900/50">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {analytics && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total vehicles" value={analytics.total_vehicles} />
          <StatCard label="Active vehicles" value={analytics.active_vehicles} />
          <StatCard label="Active riders" value={analytics.active_riders} />
          <StatCard label="Total trips" value={analytics.total_trips} />
          <StatCard label="Total revenue" value={formatCurrency(analytics.total_revenue)} />
          <StatCard label="Utilization" value={formatPercent(analytics.utilization_percent)} />
        </div>
      )}
    </div>
  );
}
