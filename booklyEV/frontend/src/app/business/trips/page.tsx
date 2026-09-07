"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi, formatCurrency } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { FleetVehicleAssignment, RiderAssignment, Trip, TripStatus } from "@/lib/business/types";

const PAGE_SIZE = 10;
const STATUS_OPTIONS: TripStatus[] = ["ONGOING", "COMPLETED", "CANCELLED"];

export default function BusinessTripsPage() {
  const [rows, setRows] = useState<Trip[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [vehicleAssignments, setVehicleAssignments] = useState<FleetVehicleAssignment[]>([]);
  const [riderAssignments, setRiderAssignments] = useState<RiderAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");

  const [fleetVehicleId, setFleetVehicleId] = useState("");
  const [riderAssignmentId, setRiderAssignmentId] = useState("");
  const [pickup, setPickup] = useState("");
  const [dropoff, setDropoff] = useState("");
  const [distance, setDistance] = useState("");
  const [revenue, setRevenue] = useState("");
  const [logging, setLogging] = useState(false);

  const load = useCallback(() => {
    return businessApi
      .getProfile()
      .then(() => {
        setNeedsProfile(false);
        return Promise.all([
          businessApi
            .listTrips({
              page,
              page_size: PAGE_SIZE,
              trip_status: (statusFilter || undefined) as TripStatus | undefined,
            })
            .then((d) => {
              setRows(d.items);
              setTotal(d.total);
            }),
          businessApi
            .listVehicleAssignments({ page_size: 100 })
            .then((d) => setVehicleAssignments(d.items.filter((a) => a.status === "ACTIVE"))),
          businessApi
            .listRiderAssignments({ page_size: 100 })
            .then((d) => setRiderAssignments(d.items.filter((a) => a.status === "ACTIVE"))),
        ]);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load trips.");
        }
      })
      .finally(() => setLoading(false));
  }, [page, statusFilter]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleLogTrip(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLogging(true);
    setError(null);
    setNotice(null);
    try {
      await businessApi.logTrip({
        fleet_vehicle_id: fleetVehicleId,
        rider_assignment_id: riderAssignmentId,
        pickup_location: pickup,
        dropoff_location: dropoff,
        distance_km: distance,
        revenue_amount: revenue,
      });
      setFleetVehicleId("");
      setRiderAssignmentId("");
      setPickup("");
      setDropoff("");
      setDistance("");
      setRevenue("");
      setShowForm(false);
      setNotice("Trip logged.");
      setPage(1);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to log trip.");
    } finally {
      setLogging(false);
    }
  }

  const columns: Column<Trip>[] = [
    {
      key: "route",
      header: "Route",
      render: (t) => `${t.pickup_location} → ${t.dropoff_location}`,
    },
    { key: "distance", header: "Distance", render: (t) => `${t.distance_km} km` },
    { key: "revenue", header: "Revenue", render: (t) => formatCurrency(t.revenue_amount) },
    { key: "status", header: "Status", render: (t) => <StatusBadge status={t.status} /> },
    {
      key: "completed_at",
      header: "Completed",
      render: (t) => new Date(t.completed_at).toLocaleString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Trips</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  const canLogTrip = vehicleAssignments.length > 0 && riderAssignments.length > 0;

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-950">Trips</h1>
          <p className="mt-1 text-sm text-brand-900/60">Log completed trips and review history.</p>
        </div>
        {canLogTrip && (
          <button
            type="button"
            onClick={() => setShowForm((v) => !v)}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            {showForm ? "Cancel" : "Log trip"}
          </button>
        )}
      </div>

      {!loading && !canLogTrip && (
        <p className="mt-4 text-sm text-brand-900/60">
          You need at least one actively assigned vehicle and one assigned rider to log a trip —
          see Assignments.
        </p>
      )}

      {showForm && canLogTrip && (
        <form
          onSubmit={handleLogTrip}
          className="mt-6 grid gap-3 rounded-2xl border border-brand-100 bg-white p-5 sm:grid-cols-2"
        >
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Vehicle</label>
            <select
              required
              value={fleetVehicleId}
              onChange={(e) => setFleetVehicleId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a vehicle</option>
              {vehicleAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.vehicle.model_name} ({a.vehicle.registration_number})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Rider</label>
            <select
              required
              value={riderAssignmentId}
              onChange={(e) => setRiderAssignmentId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm"
            >
              <option value="">Select a rider</option>
              {riderAssignments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.rider.legal_name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Pickup location</label>
            <input
              type="text"
              required
              maxLength={255}
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Dropoff location</label>
            <input
              type="text"
              required
              maxLength={255}
              value={dropoff}
              onChange={(e) => setDropoff(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Distance (km)</label>
            <input
              type="number"
              required
              min="0.01"
              step="0.01"
              value={distance}
              onChange={(e) => setDistance(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-brand-900/70">Revenue (₹)</label>
            <input
              type="number"
              required
              min="0"
              step="0.01"
              value={revenue}
              onChange={(e) => setRevenue(e.target.value)}
              className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={logging}
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {logging ? "Logging…" : "Log trip"}
            </button>
          </div>
        </form>
      )}

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <FilterSelect
          value={statusFilter}
          onChange={(v) => {
            setPage(1);
            setStatusFilter(v);
          }}
          placeholder="All statuses"
          options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
        />
      </div>

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(t) => t.id}
          emptyMessage="No trips logged yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
