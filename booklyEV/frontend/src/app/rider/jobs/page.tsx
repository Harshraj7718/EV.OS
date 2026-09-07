"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi, formatCurrency } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { Job } from "@/lib/rider/types";

export default function RiderJobsPage() {
  const [openJobs, setOpenJobs] = useState<Job[]>([]);
  const [myJobs, setMyJobs] = useState<Job[]>([]);
  const [hasActiveVehicle, setHasActiveVehicle] = useState(false);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busyJobId, setBusyJobId] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .getProfile()
      .then(() => {
        setNeedsProfile(false);
        return Promise.all([
          riderApi.listOpenJobs({ page_size: 50 }).then((data) => setOpenJobs(data.items)),
          riderApi.listMyJobs({ page_size: 50 }).then((data) => setMyJobs(data.items)),
          riderApi
            .getCurrentVehicle()
            .then(() => setHasActiveVehicle(true))
            .catch(() => setHasActiveVehicle(false)),
        ]);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load jobs.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleAccept(job: Job) {
    setBusyJobId(job.id);
    setError(null);
    try {
      await riderApi.acceptJob(job.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to accept job.");
    } finally {
      setBusyJobId(null);
    }
  }

  async function handleComplete(job: Job) {
    setBusyJobId(job.id);
    setError(null);
    try {
      await riderApi.completeJob(job.id);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to complete job.");
    } finally {
      setBusyJobId(null);
    }
  }

  const openColumns: Column<Job>[] = [
    { key: "title", header: "Job", render: (j) => j.title },
    {
      key: "route",
      header: "Route",
      render: (j) => `${j.pickup_location} → ${j.dropoff_location}`,
    },
    { key: "fare", header: "Fare", render: (j) => formatCurrency(j.fare_amount) },
  ];

  const myColumns: Column<Job>[] = [
    { key: "title", header: "Job", render: (j) => j.title },
    { key: "fare", header: "Fare", render: (j) => formatCurrency(j.fare_amount) },
    { key: "status", header: "Status", render: (j) => <StatusBadge status={j.status} /> },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Jobs</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Jobs</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Accept jobs from the marketplace, then mark them complete to earn.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {/* Accepting is hidden entirely without an active vehicle — the
          backend rejects it anyway, but showing a disabled button with no
          explanation is worse than not showing it at all. */}
      {!loading && !hasActiveVehicle && (
        <p className="mt-4 text-sm text-brand-900/60">
          You need an active vehicle to accept a job.{" "}
          <Link href="/rider/vehicles" className="font-medium text-brand-600 hover:text-brand-700">
            Book one first
          </Link>
          .
        </p>
      )}

      <h2 className="mt-8 text-lg font-semibold text-brand-950">Job marketplace</h2>
      <div className="mt-3">
        <DataTable
          columns={openColumns}
          rows={openJobs}
          loading={loading}
          getRowKey={(j) => j.id}
          emptyMessage="No open jobs right now."
          renderActions={
            hasActiveVehicle
              ? (j) => (
                  <button
                    type="button"
                    disabled={busyJobId === j.id}
                    onClick={() => handleAccept(j)}
                    className="rounded-full bg-brand-600 px-3 py-1 text-xs font-medium text-white hover:bg-brand-700 disabled:opacity-40"
                  >
                    {busyJobId === j.id ? "Accepting…" : "Accept"}
                  </button>
                )
              : undefined
          }
        />
      </div>

      <h2 className="mt-10 text-lg font-semibold text-brand-950">My jobs</h2>
      <div className="mt-3">
        <DataTable
          columns={myColumns}
          rows={myJobs}
          loading={loading}
          getRowKey={(j) => j.id}
          emptyMessage="You haven't accepted any jobs yet."
          renderActions={(j) =>
            j.status === "ACCEPTED" ? (
              <button
                type="button"
                disabled={busyJobId === j.id}
                onClick={() => handleComplete(j)}
                className="rounded-full border border-brand-200 px-3 py-1 text-xs font-medium text-brand-900 hover:bg-brand-50 disabled:opacity-40"
              >
                {busyJobId === j.id ? "Completing…" : "Complete"}
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
