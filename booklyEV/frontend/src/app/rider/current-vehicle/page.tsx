"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Booking } from "@/lib/rider/types";

export default function RiderCurrentVehiclePage() {
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [returning, setReturning] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .getProfile()
      .then(() => {
        setNeedsProfile(false);
        return riderApi
          .getCurrentVehicle()
          .then((data) => setBooking(data))
          .catch(() => setBooking(null)); // no active booking — expected, not an error
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load current vehicle.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleReturn() {
    setReturning(true);
    setError(null);
    setNotice(null);
    try {
      await riderApi.returnCurrentVehicle();
      setNotice("Vehicle returned.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to return vehicle.");
    } finally {
      setReturning(false);
    }
  }

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Current Vehicle</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Current Vehicle</h1>
      <p className="mt-1 text-sm text-brand-900/60">The EV you currently have booked.</p>

      {loading && <p className="mt-6 text-sm text-brand-900/50">Loading…</p>}
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}

      {!loading && !booking && (
        <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white p-12 text-center">
          <h3 className="text-lg font-semibold text-brand-950">No vehicle booked</h3>
          <p className="mt-2 text-sm text-brand-900/60">
            Book an EV to start accepting jobs.
          </p>
          <Link
            href="/rider/vehicles"
            className="mt-4 inline-block rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
          >
            Browse available EVs
          </Link>
        </div>
      )}

      {booking && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-6">
          <p className="text-sm text-brand-900/60">Vehicle</p>
          <p className="mt-1 text-lg font-medium text-brand-950">{booking.vehicle.model_name}</p>
          <p className="text-sm text-brand-900/70">{booking.vehicle.asset_code}</p>
          {booking.vehicle.registration_number && (
            <p className="text-sm text-brand-900/70">Reg: {booking.vehicle.registration_number}</p>
          )}
          <p className="mt-3 text-xs text-brand-900/50">
            Booked {booking.booked_at ? new Date(booking.booked_at).toLocaleString() : "—"}
          </p>
          <button
            type="button"
            disabled={returning}
            onClick={handleReturn}
            className="mt-4 rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50 disabled:opacity-50"
          >
            {returning ? "Returning…" : "Return vehicle"}
          </button>
        </div>
      )}
    </div>
  );
}
