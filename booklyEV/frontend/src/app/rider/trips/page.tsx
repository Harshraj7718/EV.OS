"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi, formatCurrency } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Trip } from "@/lib/rider/types";

const PAGE_SIZE = 10;

export default function RiderTripsPage() {
  const [rows, setRows] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .listTrips({ page, page_size: PAGE_SIZE })
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
        setNeedsProfile(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load trips.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Trip>[] = [
    { key: "job", header: "Job", render: (t) => t.job_title },
    {
      key: "route",
      header: "Route",
      render: (t) => `${t.pickup_location} → ${t.dropoff_location}`,
    },
    { key: "fare", header: "Fare", render: (t) => formatCurrency(t.fare_amount) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "completed_at",
      header: "Completed",
      render: (t) => new Date(t.completed_at).toLocaleString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Trips</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Trips</h1>
      <p className="mt-1 text-sm text-brand-900/60">Your completed trip history.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(t) => t.id}
          emptyMessage="No trips yet — accept and complete a job to see it here."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
