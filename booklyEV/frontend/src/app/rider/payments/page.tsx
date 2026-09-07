"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi, formatCurrency } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Earning } from "@/lib/rider/types";

const PAGE_SIZE = 10;

export default function RiderPaymentsPage() {
  const [rows, setRows] = useState<Earning[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .listPayments({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load payments.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Earning>[] = [
    { key: "amount", header: "Amount", render: (e) => formatCurrency(e.amount) },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
    {
      key: "paid_at",
      header: "Paid on",
      render: (e) => (e.paid_at ? new Date(e.paid_at).toLocaleString() : "—"),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Payments</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Payments</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Confirmed payment history — no real payment gateway is connected, settlement is instant
        and mock.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(e) => e.id}
          emptyMessage="No payments yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
