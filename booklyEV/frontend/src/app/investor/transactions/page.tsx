"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi, formatCurrency } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import type { Transaction } from "@/lib/investor/types";

const PAGE_SIZE = 15;

const TYPE_LABELS: Record<Transaction["type"], string> = {
  INVESTMENT: "Investment",
  EARNING_CREDIT: "Earning credit",
  PAYOUT: "Payout",
};

export default function InvestorTransactionsPage() {
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return investorApi
      .listTransactions({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load transactions.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<Transaction>[] = [
    { key: "type", header: "Type", render: (t) => TYPE_LABELS[t.type] },
    { key: "description", header: "Description", render: (t) => t.description },
    { key: "amount", header: "Amount", render: (t) => formatCurrency(t.amount) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "created_at",
      header: "Date",
      render: (t) => new Date(t.created_at).toLocaleString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Transactions</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Transactions</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        A ledger of every investment, earning credit, and payout on your account.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(t) => t.id}
          emptyMessage="No transactions yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
