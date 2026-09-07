"use client";

import { useEffect, useState } from "react";
import { apiClient, ApiError } from "@/lib/api-client";
import type { HealthResponse } from "@/types";

type Status =
  | { kind: "loading" }
  | { kind: "ok"; data: HealthResponse }
  | { kind: "error"; message: string };

export function ApiStatus() {
  const [status, setStatus] = useState<Status>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;

    apiClient
      .get<HealthResponse>("/api/health")
      .then((data) => {
        if (!cancelled) setStatus({ kind: "ok", data });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const message = err instanceof ApiError ? err.message : "Unable to reach the API";
        setStatus({ kind: "error", message });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const dotClass =
    status.kind === "ok"
      ? "bg-brand-500"
      : status.kind === "error"
        ? "bg-red-500"
        : "bg-brand-200 animate-pulse";

  const label =
    status.kind === "ok"
      ? `API online — ${status.data.service}`
      : status.kind === "error"
        ? `API unreachable — ${status.message}`
        : "Checking API…";

  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-brand-100 bg-white px-3 py-1.5 text-xs text-brand-900/70">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
      {label}
    </div>
  );
}
