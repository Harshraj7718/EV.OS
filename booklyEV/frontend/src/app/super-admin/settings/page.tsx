"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import type { AdminSettings } from "@/lib/admin/types";

function Row({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between border-b border-brand-50 py-3 text-sm last:border-0">
      <span className="text-brand-900/60">{label}</span>
      <span className="font-medium text-brand-950">{value}</span>
    </div>
  );
}

// SUPER_ADMIN-exclusive by construction (see super-admin/layout.tsx) — no
// Settings page exists under /admin/* at all.
export default function SuperAdminSettingsPage() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    adminApi
      .getSettings()
      .then(setSettings)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load."));
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Settings</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Non-secret platform configuration. Read-only — there is no settings-editing endpoint yet.
        Secrets (signing keys, database credentials) are never exposed here or anywhere in the API.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {settings && (
        <div className="mt-6 max-w-md rounded-2xl border border-brand-100 bg-white p-6">
          <Row label="App name" value={settings.app_name} />
          <Row label="Environment" value={settings.environment} />
          <Row label="API prefix" value={settings.api_v1_prefix} />
          <Row label="Access token lifetime" value={`${settings.access_token_expire_minutes} min`} />
          <Row label="Refresh token lifetime" value={`${settings.refresh_token_expire_days} days`} />
        </div>
      )}
    </div>
  );
}
