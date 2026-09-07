"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import type { PlatformOverview } from "@/lib/admin/types";

function Bar({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-brand-900/70">{label}</span>
        <span className="font-medium text-brand-950">{value}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-brand-50">
        <div className="h-2 rounded-full bg-brand-500" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

export default function SuperAdminAnalyticsPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getOverview()
      .then(setOverview)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load."));
  }, []);

  const roleEntries = overview ? Object.entries(overview.users_by_role) : [];
  const maxRoleCount = Math.max(1, ...roleEntries.map(([, count]) => count));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Analytics</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        User distribution across the platform. Trip, payment, and fleet-utilization analytics
        arrive once those domain modules are implemented — no synthetic data is shown here in
        the meantime.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {overview && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6">
          <p className="text-sm font-medium text-brand-950">Users by role</p>
          <div className="mt-4 space-y-4">
            {roleEntries.map(([role, count]) => (
              <Bar key={role} label={role} value={count} max={maxRoleCount} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
