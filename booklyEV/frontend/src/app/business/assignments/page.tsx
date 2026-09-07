"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { Fleet, FleetVehicleAssignment, RiderAssignment, Vehicle } from "@/lib/business/types";

export default function BusinessAssignmentsPage() {
  const [vehicleAssignments, setVehicleAssignments] = useState<FleetVehicleAssignment[]>([]);
  const [riderAssignments, setRiderAssignments] = useState<RiderAssignment[]>([]);
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [selectedFleetId, setSelectedFleetId] = useState("");
  const [selectedVehicleId, setSelectedVehicleId] = useState("");
  const [assigning, setAssigning] = useState(false);

  const load = useCallback(() => {
    return businessApi
      .getProfile()
      .then(() => {
        setNeedsProfile(false);
        return Promise.all([
          businessApi.listVehicleAssignments({ page_size: 50 }).then((d) => setVehicleAssignments(d.items)),
          businessApi.listRiderAssignments({ page_size: 50 }).then((d) => setRiderAssignments(d.items)),
          businessApi.listFleets({ page_size: 100 }).then((d) => setFleets(d.items)),
          businessApi.listVehicles({ page_size: 100 }).then((d) => setVehicles(d.items)),
        ]);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load assignments.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unassignedVehicles = vehicles.filter(
    (v) => !vehicleAssignments.some((a) => a.status === "ACTIVE" && a.vehicle.id === v.id),
  );
  const activeFleets = fleets.filter((f) => f.status === "ACTIVE");

  async function handleAssignVehicle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedFleetId || !selectedVehicleId) return;
    setAssigning(true);
    setError(null);
    try {
      await businessApi.assignVehicle(selectedFleetId, selectedVehicleId);
      setSelectedFleetId("");
      setSelectedVehicleId("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign vehicle.");
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassignVehicle(assignment: FleetVehicleAssignment) {
    setBusyId(assignment.id);
    setError(null);
    try {
      await businessApi.unassignVehicle(assignment.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unassign vehicle.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleUnassignRider(assignment: RiderAssignment) {
    setBusyId(assignment.id);
    setError(null);
    try {
      await businessApi.unassignRider(assignment.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unassign rider.");
    } finally {
      setBusyId(null);
    }
  }

  const vehicleColumns: Column<FleetVehicleAssignment>[] = [
    {
      key: "vehicle",
      header: "Vehicle",
      render: (a) => (
        <div>
          <p className="font-medium text-brand-950">{a.vehicle.model_name}</p>
          <p className="text-xs text-brand-900/50">{a.vehicle.registration_number}</p>
        </div>
      ),
    },
    { key: "fleet", header: "Fleet", render: (a) => a.fleet_name },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];

  const riderColumns: Column<RiderAssignment>[] = [
    { key: "rider", header: "Rider", render: (a) => a.rider.legal_name },
    { key: "city", header: "City", render: (a) => a.rider.city ?? "—" },
    { key: "status", header: "Status", render: (a) => <StatusBadge status={a.status} /> },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Assignments</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Assignments</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Assign vehicles into fleets and manage your rider roster.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <h2 className="mt-8 text-lg font-semibold text-brand-950">Fleet vehicle assignments</h2>

      {!loading && activeFleets.length > 0 && unassignedVehicles.length > 0 && (
        <form
          onSubmit={handleAssignVehicle}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-2xl border border-brand-100 bg-white p-4"
        >
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Fleet</label>
            <select
              required
              value={selectedFleetId}
              onChange={(e) => setSelectedFleetId(e.target.value)}
              className="mt-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a fleet</option>
              {activeFleets.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Vehicle</label>
            <select
              required
              value={selectedVehicleId}
              onChange={(e) => setSelectedVehicleId(e.target.value)}
              className="mt-1 rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a vehicle</option>
              {unassignedVehicles.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.model_name} ({v.registration_number})
                </option>
              ))}
            </select>
          </div>
          <button
            type="submit"
            disabled={assigning}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {assigning ? "Assigning…" : "Assign vehicle"}
          </button>
        </form>
      )}
      {!loading && (activeFleets.length === 0 || unassignedVehicles.length === 0) && (
        <p className="mt-3 text-sm text-brand-900/60">
          {activeFleets.length === 0
            ? "Create an active fleet to assign vehicles into it."
            : "Every vehicle is already actively assigned — add another vehicle to assign more."}
        </p>
      )}

      <div className="mt-4">
        <DataTable
          columns={vehicleColumns}
          rows={vehicleAssignments}
          loading={loading}
          getRowKey={(a) => a.id}
          emptyMessage="No vehicle assignments yet."
          renderActions={(a) =>
            a.status === "ACTIVE" ? (
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => handleUnassignVehicle(a)}
                className="rounded-full border border-brand-200 px-3 py-1 text-xs text-brand-900 hover:bg-brand-50 disabled:opacity-50"
              >
                {busyId === a.id ? "Unassigning…" : "Unassign"}
              </button>
            ) : (
              <span className="text-xs text-brand-900/40">—</span>
            )
          }
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand-950">Rider assignments</h2>
      <p className="mt-1 text-sm text-brand-900/60">
        Recruit new riders from the{" "}
        <Link href="/business/riders" className="font-medium text-brand-600 hover:text-brand-700">
          Riders
        </Link>{" "}
        page.
      </p>
      <div className="mt-3">
        <DataTable
          columns={riderColumns}
          rows={riderAssignments}
          loading={loading}
          getRowKey={(a) => a.id}
          emptyMessage="No riders assigned yet."
          renderActions={(a) =>
            a.status === "ACTIVE" ? (
              <button
                type="button"
                disabled={busyId === a.id}
                onClick={() => handleUnassignRider(a)}
                className="rounded-full border border-brand-200 px-3 py-1 text-xs text-brand-900 hover:bg-brand-50 disabled:opacity-50"
              >
                {busyId === a.id ? "Unassigning…" : "Unassign"}
              </button>
            ) : (
              <span className="text-xs text-brand-900/40">—</span>
            )
          }
        />
      </div>
    </div>
  );
}
