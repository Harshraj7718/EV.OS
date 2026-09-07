"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi, formatCurrency } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import type { Earning } from "@/lib/investor/types";

const PAGE_SIZE = 10;

export default function InvestorEarningsPage() {
  const [rows, setRows] = useState<Earning[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return investorApi
      .listEarnings({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load earnings.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Earning>[] = [
    {
      key: "period",
      header: "Period",
      render: (e) =>
        `${new Date(e.period_start).toLocaleDateString()} – ${new Date(e.period_end).toLocaleDateString()}`,
    },
    { key: "amount", header: "Amount", render: (e) => formatCurrency(e.amount) },
    { key: "status", header: "Status", render: (e) => <StatusBadge status={e.status} /> },
    { key: "created_at", header: "Accrued on", render: (e) => new Date(e.created_at).toLocaleDateString() },
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
        Passive income accrued from your EV assets. Earnings are system-generated, not
        self-reported.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(e) => e.id}
          emptyMessage="No earnings accrued yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
