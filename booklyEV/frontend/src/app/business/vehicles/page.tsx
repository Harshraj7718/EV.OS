"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { Vehicle, VehicleStatus } from "@/lib/business/types";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: VehicleStatus[] = ["ACTIVE", "MAINTENANCE", "RETIRED"];

export default function BusinessVehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [modelName, setModelName] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(() => {
    return businessApi
      .listVehicles({ page, page_size: PAGE_SIZE })
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
          setError(err instanceof ApiError ? err.message : "Failed to load vehicles.");
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
      await businessApi.createVehicle({
        registration_number: registrationNumber,
        model_name: modelName,
      });
      setRegistrationNumber("");
      setModelName("");
      setShowForm(false);
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add vehicle.");
    } finally {
      setCreating(false);
    }
  }

  async function handleStatusChange(vehicle: Vehicle, status: VehicleStatus) {
    if (status === vehicle.status) return;
    setBusyId(vehicle.id);
    setError(null);
    try {
      await businessApi.updateVehicle(vehicle.id, { status });
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update vehicle.");
    } finally {
      setBusyId(null);
    }
  }

  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (v) => (
        <div>
          <p className="font-medium text-brand-950">{v.model_name}</p>
          <p className="text-xs text-brand-900/50">{v.registration_number}</p>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (v) => (
        <select
          value={v.status}
          disabled={busyId === v.id}
          onChange={(e) => handleStatusChange(v, e.target.value as VehicleStatus)}
          className="rounded-lg border border-brand-100 bg-white px-2 py-1 text-xs"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      ),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Vehicles</h1>
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
          <h1 className="text-2xl font-semibold text-brand-950">Vehicles</h1>
          <p className="mt-1 text-sm text-brand-900/60">
            Your vehicle inventory. Assign vehicles to a fleet from the Assignments page.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showForm ? "Cancel" : "Add vehicle"}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 grid gap-3 rounded-2xl border border-brand-100 bg-white p-5 sm:grid-cols-2"
        >
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Registration number</label>
            <input
              type="text"
              required
              minLength={2}
              maxLength={50}
              value={registrationNumber}
              onChange={(e) => setRegistrationNumber(e.target.value)}
              placeholder="e.g. KA-01-AA-0001"
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Model</label>
            <input
              type="text"
              required
              minLength={1}
              maxLength={150}
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {creating ? "Adding…" : "Add vehicle"}
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
          getRowKey={(v) => v.id}
          emptyMessage="No vehicles yet — add one to get started."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
