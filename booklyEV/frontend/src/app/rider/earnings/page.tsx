"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi, formatCurrency } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Earning, EarningsSummary } from "@/lib/rider/types";

const PAGE_SIZE = 10;

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

export default function RiderEarningsPage() {
  const [rows, setRows] = useState<Earning[]>([]);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([
      riderApi.listEarnings({ page, page_size: PAGE_SIZE }),
      riderApi.getEarningsSummary(),
    ])
      .then(([earnings, summaryData]) => {
        setRows(earnings.items);
        setTotal(earnings.total);
        setSummary(summaryData);
        setNeedsProfile(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load earnings.");
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
      key: "created_at",
      header: "Earned on",
      render: (e) => new Date(e.created_at).toLocaleString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Earnings</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Earnings</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Income earned from completed jobs — realized the moment each job is completed.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {summary && (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="Total earned" value={formatCurrency(summary.total_earned)} />
          <StatCard label="Total paid" value={formatCurrency(summary.total_paid)} />
          <StatCard label="Trips completed" value={summary.trip_count} />
        </div>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(e) => e.id}
          emptyMessage="No earnings yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
