"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { RiderSummary } from "@/lib/business/types";

const PAGE_SIZE = 10;

export default function BusinessRidersPage() {
  const [rows, setRows] = useState<RiderSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);

  const load = useCallback(() => {
    return businessApi
      .getProfile()
      .then(() => {
        setNeedsProfile(false);
        return businessApi.listEligibleRiders({ page, page_size: PAGE_SIZE }).then((data) => {
          setRows(data.items);
          setTotal(data.total);
        });
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load riders.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAssign(rider: RiderSummary) {
    setAssigningId(rider.id);
    setError(null);
    setNotice(null);
    try {
      await businessApi.assignRider(rider.id);
      setNotice(`${rider.legal_name} recruited — see the Assignments page.`);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign rider.");
    } finally {
      setAssigningId(null);
    }
  }

  const columns: Column<RiderSummary>[] = [
    { key: "name", header: "Rider", render: (r) => r.legal_name },
    { key: "city", header: "City", render: (r) => r.city ?? "—" },
    { key: "kyc", header: "KYC status", render: (r) => r.kyc_status },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Riders</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Riders</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Riders not currently assigned to any business — recruit one to your roster. Once assigned,
        manage or unassign them from the Assignments page.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(r) => r.id}
          emptyMessage="No eligible riders right now."
          renderActions={(r) => (
            <button
              type="button"
              disabled={assigningId === r.id}
              onClick={() => handleAssign(r)}
              className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
            >
              {assigningId === r.id ? "Recruiting…" : "Recruit"}
            </button>
          )}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
