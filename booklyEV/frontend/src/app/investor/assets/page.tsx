"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi, formatCurrency } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import type { EVAsset } from "@/lib/investor/types";

const PAGE_SIZE = 10;

export default function InvestorAssetsPage() {
  const [rows, setRows] = useState<EVAsset[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return investorApi
      .listOwnedAssets({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load assets.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<EVAsset>[] = [
    {
      key: "asset",
      header: "EV Asset",
      render: (a) => (
        <div>
          <p className="font-medium text-brand-950">{a.model_name}</p>
          <p className="text-xs text-brand-900/50">{a.asset_code}</p>
        </div>
      ),
    },
    { key: "price", header: "Price", render: (a) => formatCurrency(a.price) },
    {
      key: "return",
      header: "Expected monthly return",
      render: (a) => formatCurrency(a.expected_monthly_return),
    },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">My EV Assets</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">My EV Assets</h1>
      <p className="mt-1 text-sm text-brand-900/60">EV assets you currently own via investment.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(a) => a.id}
          emptyMessage="You don't own any EV assets yet — invest in an opportunity to get started."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
