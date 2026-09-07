"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Booking, Vehicle } from "@/lib/rider/types";

const PAGE_SIZE = 10;

export default function RiderVehiclesPage() {
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [currentVehicle, setCurrentVehicle] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingId, setBookingId] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .getProfile()
      .then(() => {
        setNeedsProfile(false);
        return Promise.all([
          riderApi.listAvailableVehicles({ page, page_size: PAGE_SIZE }).then((data) => {
            setRows(data.items);
            setTotal(data.total);
          }),
          riderApi
            .getCurrentVehicle()
            .then((data) => setCurrentVehicle(data))
            .catch(() => setCurrentVehicle(null)), // no active booking — expected, not an error
        ]);
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

  async function handleBook(vehicle: Vehicle) {
    setBookingId(vehicle.id);
    setError(null);
    try {
      await riderApi.bookVehicle(vehicle.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Booking failed.");
    } finally {
      setBookingId(null);
    }
  }

  const columns: Column<Vehicle>[] = [
    {
      key: "vehicle",
      header: "EV Vehicle",
      render: (v) => (
        <div>
          <p className="font-medium text-brand-950">{v.model_name}</p>
          <p className="text-xs text-brand-900/50">{v.asset_code}</p>
        </div>
      ),
    },
    {
      key: "registration",
      header: "Registration",
      render: (v) => v.registration_number ?? "—",
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Available EVs</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Available EVs</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Deployed EVs ready to book. No real handover process is connected — booking settles
        instantly in a development/mock state.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Booking is hidden entirely while a vehicle is already active — the
          backend rejects a second booking anyway, but hiding the action
          avoids surfacing a control that would just fail. */}
      {currentVehicle && (
        <p className="mt-4 text-sm text-brand-900/60">
          You already have an active vehicle ({currentVehicle.vehicle.model_name}). Return it from
          the Current Vehicle page before booking another.
        </p>
      )}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(v) => v.id}
          emptyMessage="No EVs available for booking right now."
          renderActions={
            currentVehicle
              ? undefined
              : (v) => (
                  <button
                    type="button"
                    disabled={bookingId === v.id}
                    onClick={() => handleBook(v)}
                    className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                  >
                    {bookingId === v.id ? "Booking…" : "Book"}
                  </button>
                )
          }
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
