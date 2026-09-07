"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth/auth-context";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import type { BusinessProfile } from "@/lib/business/types";

/** No settings model/fields (notification preferences, integrations,
 * API keys, ...) were requested for this module — "manage business
 * details" is covered by /business/profile. This page is an honest,
 * minimal account-info view rather than a fabricated settings backend.
 */
export default function BusinessSettingsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    businessApi
      .getProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load settings.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Settings</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Settings</h1>
      <p className="mt-1 text-sm text-brand-900/60">Account-level details for your business.</p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {profile && user && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
          <dl className="space-y-3 text-sm">
            <div className="flex justify-between">
              <dt className="text-brand-900/60">Business name</dt>
              <dd className="font-medium text-brand-950">{profile.business_name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-900/60">Account email</dt>
              <dd className="font-medium text-brand-950">{user.email}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-900/60">Account phone</dt>
              <dd className="font-medium text-brand-950">{user.phone}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-brand-900/60">Verification status</dt>
              <dd className="font-medium text-brand-950">{profile.verification_status}</dd>
            </div>
          </dl>
        </div>
      )}

      <div className="mt-6 rounded-2xl border border-dashed border-brand-200 bg-white p-6">
        <p className="text-sm font-medium text-brand-950">More settings coming later</p>
        <p className="mt-2 text-sm text-brand-900/60">
          Notification preferences, integrations, and API access aren&apos;t implemented yet — this
          section will grow as those features are built. Business details can already be edited on
          the Profile page.
        </p>
      </div>
    </div>
  );
}
