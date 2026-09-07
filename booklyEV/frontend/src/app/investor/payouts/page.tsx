"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi, formatCurrency } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import type { Payout } from "@/lib/investor/types";

const PAGE_SIZE = 10;

export default function InvestorPayoutsPage() {
  const [rows, setRows] = useState<Payout[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    return investorApi
      .listPayouts({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load payouts.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleRequestPayout() {
    setRequesting(true);
    setError(null);
    setNotice(null);
    try {
      const payout = await investorApi.requestPayout();
      setNotice(`Payout of ${formatCurrency(payout.amount)} completed (mock settlement).`);
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Payout request failed.");
    } finally {
      setRequesting(false);
    }
  }

  const columns: Column<Payout>[] = [
    { key: "amount", header: "Amount", render: (p) => formatCurrency(p.amount) },
    { key: "method", header: "Method", render: (p) => p.payout_method },
    { key: "status", header: "Status", render: (p) => <StatusBadge status={p.status} /> },
    {
      key: "processed_at",
      header: "Processed on",
      render: (p) => (p.processed_at ? new Date(p.processed_at).toLocaleString() : "—"),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Payouts</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-950">Payouts</h1>
          <p className="mt-1 text-sm text-brand-900/60">
            Request a payout of your accrued earnings. No real bank transfer is connected — this
            is a development/mock settlement.
          </p>
        </div>
        <button
          type="button"
          disabled={requesting}
          onClick={handleRequestPayout}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {requesting ? "Requesting…" : "Request payout"}
        </button>
      </div>

      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(p) => p.id}
          emptyMessage="No payouts yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
