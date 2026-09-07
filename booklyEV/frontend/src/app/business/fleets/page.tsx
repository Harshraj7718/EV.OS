"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { Fleet } from "@/lib/business/types";

const PAGE_SIZE = 10;

export default function BusinessFleetsPage() {
  const [rows, setRows] = useState<Fleet[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [fleetCode, setFleetCode] = useState("");
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    return businessApi
      .listFleets({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load fleets.");
        }
      })
      .finally(() => setLoading(false));
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await businessApi.createFleet({ fleet_code: fleetCode, name });
      setFleetCode("");
      setName("");
      setShowForm(false);
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create fleet.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleStatus(fleet: Fleet) {
    setBusyId(fleet.id);
    setError(null);
    try {
      await businessApi.updateFleet(fleet.id, {
        status: fleet.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
      });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update fleet.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<Fleet>[] = [
    {
      key: "fleet",
      header: "Fleet",
      render: (f) => (
        <div>
          <p className="font-medium text-brand-950">{f.name}</p>
          <p className="text-xs text-brand-900/50">{f.fleet_code}</p>
        </div>
      ),
    },
    { key: "status", header: "Status", render: (f) => <StatusBadge status={f.status} /> },
    {
      key: "created_at",
      header: "Created",
      render: (f) => new Date(f.created_at).toLocaleDateString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Fleets</h1>
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
          <h1 className="text-2xl font-semibold text-brand-950">Fleets</h1>
          <p className="mt-1 text-sm text-brand-900/60">Create and manage your vehicle fleets.</p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "New fleet"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-3 rounded-2xl border border-brand-100 bg-white p-5 sm:grid-cols-2"
        >
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Fleet code</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={fleetCode}
              onChange={(e) => setFleetCode(e.target.value)}
              placeholder="e.g. FL-BLR-01"
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Name</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={150}
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create fleet"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(f) => f.id}
          emptyMessage="No fleets yet — create one to start assigning vehicles."
          renderActions={(f) => (
            <button
              type="button"
              disabled={busyId === f.id}
              onClick={() => handleToggleStatus(f)}
              className="rounded-full border border-brand-200 px-3 py-1 text-xs text-brand-900 hover:bg-brand-50 disabled:opacity-50"
            >
              {f.status === "ACTIVE" ? "Deactivate" : "Activate"}
            </button>
          )}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
