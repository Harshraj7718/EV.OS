"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi, formatCurrency } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import type { EVAsset, Investment } from "@/lib/investor/types";

export default function InvestorInvestmentsPage() {
  const [opportunities, setOpportunities] = useState<EVAsset[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [investingId, setInvestingId] = useState<string | null>(null);

  const load = useCallback(() => {
    return Promise.all([
      investorApi.listOpportunities({ page_size: 50 }),
      investorApi.listInvestments({ page_size: 50 }),
    ])
      .then(([opps, invs]) => {
        setOpportunities(opps.items);
        setInvestments(invs.items);
        setNeedsProfile(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load investments.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleInvest(asset: EVAsset) {
    setInvestingId(asset.id);
    setError(null);
    try {
      await investorApi.invest(asset.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Investment failed.");
    } finally {
      setInvestingId(null);
    }
  }

  const opportunityColumns: Column<EVAsset>[] = [
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

  const investmentColumns: Column<Investment>[] = [
    {
      key: "asset",
      header: "EV Asset",
      render: (i) => (
        <div>
          <p className="font-medium text-brand-950">{i.asset.model_name}</p>
          <p className="text-xs text-brand-900/50">{i.asset.asset_code}</p>
        </div>
      ),
    },
    { key: "amount", header: "Amount", render: (i) => formatCurrency(i.amount) },
    { key: "status", header: "Status", render: (i) => <StatusBadge status={i.status} /> },
    {
      key: "invested_at",
      header: "Invested on",
      render: (i) => (i.invested_at ? new Date(i.invested_at).toLocaleDateString() : "—"),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Investments</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Investments</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Browse available EV assets and invest. No real payment gateway is connected — investing
        settles instantly in a development/mock state.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <h2 className="mt-8 text-lg font-semibold text-brand-950">Available opportunities</h2>
      <div className="mt-3">
        <DataTable
          columns={opportunityColumns}
          rows={opportunities}
          loading={loading}
          getRowKey={(a) => a.id}
          emptyMessage="No investment opportunities available right now."
          renderActions={(a) => (
            <button
              type="button"
              disabled={a.status !== "AVAILABLE" || investingId === a.id}
              onClick={() => handleInvest(a)}
              className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {investingId === a.id ? "Investing…" : "Invest"}
            </button>
          )}
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand-950">My investments</h2>
      <div className="mt-3">
        <DataTable
          columns={investmentColumns}
          rows={investments}
          loading={loading}
          getRowKey={(i) => i.id}
          emptyMessage="You haven't made any investments yet."
        />
      </div>
    </div>
  );
}
