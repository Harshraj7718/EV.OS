"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi, formatCurrency } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { BusinessRevenue } from "@/lib/business/types";

const PAGE_SIZE = 10;

export default function BusinessRevenuePage() {
  const [rows, setRows] = useState<BusinessRevenue[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return businessApi
      .listRevenue({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load revenue.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<BusinessRevenue>[] = [
    { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount) },
    {
      key: "recognized_at",
      header: "Recognized on",
      render: (r) => new Date(r.recognized_at).toLocaleString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Revenue</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Revenue</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Revenue recognized from each completed trip. See totals on the Analytics page.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(r) => r.id}
          emptyMessage="No revenue recognized yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
