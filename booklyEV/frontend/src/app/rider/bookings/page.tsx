"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Booking } from "@/lib/rider/types";

const PAGE_SIZE = 10;

export default function RiderBookingsPage() {
  const [rows, setRows] = useState<Booking[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .listBookings({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load bookings.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Booking>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (b) => (
        <div>
          <p className="font-medium text-brand-950">{b.vehicle.model_name}</p>
          <p className="text-xs text-brand-900/50">{b.vehicle.asset_code}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (b) => <StatusBadge status={b.status} /> },
    {
      key: "booked_at",
      header: "Booked on",
      render: (b) => (b.booked_at ? new Date(b.booked_at).toLocaleDateString() : "—"),
    },
    {
      key: "ended_at",
      header: "Returned on",
      render: (b) => (b.ended_at ? new Date(b.ended_at).toLocaleDateString() : "—"),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Bookings</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Bookings</h1>
      <p className="mt-1 text-sm text-brand-900/60">Your full vehicle booking history.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(b) => b.id}
          emptyMessage="No bookings yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
