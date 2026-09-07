"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { riderApi, formatCurrency } from "@/lib/rider/api";
import type { Booking, EarningsSummary, RiderProfile } from "@/lib/rider/types";
import { ApiError } from "@/lib/api-client";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-white p-5">
      <p className="text-sm text-brand-900/60">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-brand-950">{value}</p>
    </div>
  );
}

const KYC_LABELS: Record<RiderProfile["kyc_status"], string> = {
  NOT_STARTED: "Not started",
  PENDING: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function RiderDashboardPage() {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [currentVehicle, setCurrentVehicle] = useState<Booking | null>(null);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    Promise.all([riderApi.getProfile(), riderApi.getEarningsSummary()])
      .then(([profileData, summaryData]) => {
        if (cancelled) return;
        setProfile(profileData);
        setSummary(summaryData);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load dashboard.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    riderApi
      .getCurrentVehicle()
      .then((data) => {
        if (!cancelled) setCurrentVehicle(data);
      })
      .catch(() => {
        // No active booking — a normal, expected state, not an error.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Dashboard</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Affordable mobility, at a glance — your vehicle, jobs, and earnings.
      </p>

      {loading && <p className="mt-6 text-sm text-brand-900/50">Loading…</p>}
      {error && <p className="mt-6 text-sm text-red-600">{error}</p>}
      {!loading && needsProfile && (
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      )}

      {profile && (
        <div className="mt-6 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-100 bg-white p-5">
          <div>
            <p className="text-sm text-brand-900/60">Signed in as</p>
            <p className="text-lg font-medium text-brand-950">{profile.legal_name}</p>
          </div>
          <span className="ml-auto rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
            KYC: {KYC_LABELS[profile.kyc_status]}
          </span>
          {profile.kyc_status !== "VERIFIED" && (
            <Link
              href="/rider/kyc"
              className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700"
            >
              Complete KYC
            </Link>
          )}
        </div>
      )}

      {profile && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
          <p className="text-sm font-medium text-brand-950">Current vehicle</p>
          {currentVehicle ? (
            <p className="mt-1 text-sm text-brand-900/70">
              {currentVehicle.vehicle.model_name} ({currentVehicle.vehicle.asset_code})
            </p>
          ) : (
            <p className="mt-1 text-sm text-brand-900/60">
              No vehicle booked yet.{" "}
              <Link href="/rider/vehicles" className="font-medium text-brand-600 hover:text-brand-700">
                Browse available EVs
              </Link>
              .
            </p>
          )}
        </div>
      )}

      {summary && (
        <>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="Total earned" value={formatCurrency(summary.total_earned)} />
            <StatCard label="Total paid" value={formatCurrency(summary.total_paid)} />
            <StatCard label="Trips completed" value={summary.trip_count} />
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/rider/jobs"
              className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
            >
              Browse jobs
            </Link>
            <Link
              href="/rider/earnings"
              className="rounded-full border border-brand-200 px-4 py-2 text-sm font-medium text-brand-900 hover:bg-brand-50"
            >
              View earnings
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
