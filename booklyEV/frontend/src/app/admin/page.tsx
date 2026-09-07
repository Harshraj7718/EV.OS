"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import type { PlatformOverview } from "@/lib/admin/types";
import { ApiError } from "@/lib/api-client";

function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

export default function AdminOverviewPage() {
  const [overview, setOverview] = useState<PlatformOverview | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    adminApi
      .getOverview()
      .then((data) => {
        if (!cancelled) setOverview(data);
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof ApiError ? err.message : "Failed to load overview.");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Overview</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Real platform counts — no synthetic data. Richer analytics arrive as vehicles, fleets,
        trips, and payments are implemented.
      </p>

      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}

      {overview && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total users" value={overview.total_users} />
            <StatCard label="Roles" value={overview.total_roles} />
            <StatCard label="Permissions" value={overview.total_permissions} />
            <StatCard label="Admin actions (24h)" value={overview.audit_log_count_last_24h} />
          </div>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-brand-100 bg-white p-5">
              <p className="text-sm font-medium text-brand-950">Users by role</p>
              <dl className="mt-3 space-y-2">
                {Object.entries(overview.users_by_role).map(([role, count]) => (
                  <div key={role} className="flex items-center justify-between text-sm">
                    <dt className="text-brand-900/70">{role}</dt>
                    <dd className="font-medium text-brand-950">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="rounded-2xl border border-brand-100 bg-white p-5">
              <p className="text-sm font-medium text-brand-950">Users by status</p>
              <dl className="mt-3 space-y-2">
                {Object.entries(overview.users_by_status).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <dt className="text-brand-900/70">{status}</dt>
                    <dd className="font-medium text-brand-950">{count}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
