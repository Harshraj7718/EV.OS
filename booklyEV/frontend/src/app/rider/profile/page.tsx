"use client";

import { useEffect, useState, type FormEvent } from "react";
import { riderApi } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { RiderProfile, RiderProfileCreatePayload } from "@/lib/rider/types";

const EMPTY_FORM: RiderProfileCreatePayload = {
  legal_name: "",
  date_of_birth: "",
  driving_license_number: "",
  address_line1: "",
  city: "",
  state: "",
  postal_code: "",
  country: "India",
};

function toFormState(profile: RiderProfile): RiderProfileCreatePayload {
  return {
    legal_name: profile.legal_name,
    date_of_birth: profile.date_of_birth ?? "",
    driving_license_number: profile.driving_license_number ?? "",
    address_line1: profile.address_line1 ?? "",
    city: profile.city ?? "",
    state: profile.state ?? "",
    postal_code: profile.postal_code ?? "",
    country: profile.country,
  };
}

/** Empty-string optional fields are omitted, not sent as "" — the backend
 * treats an absent field as "no change" (PATCH) or "not provided" (POST),
 * which is what an untouched optional input should mean. */
function toPayload(form: RiderProfileCreatePayload): RiderProfileCreatePayload {
  const payload: RiderProfileCreatePayload = { legal_name: form.legal_name, country: form.country };
  const optionalKeys = [
    "date_of_birth",
    "driving_license_number",
    "address_line1",
    "city",
    "state",
    "postal_code",
  ] as const;
  for (const key of optionalKeys) {
    const value = form[key];
    if (value) payload[key] = value;
  }
  return payload;
}

export default function RiderProfilePage() {
  const [profile, setProfile] = useState<RiderProfile | null>(null);
  const [form, setForm] = useState<RiderProfileCreatePayload>(EMPTY_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    riderApi
      .getProfile()
      .then((data) => {
        if (cancelled) return;
        setProfile(data);
        setForm(toFormState(data));
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (!(err instanceof ApiError && err.status === 404)) {
          setError(err instanceof ApiError ? err.message : "Failed to load profile.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  function updateField<K extends keyof RiderProfileCreatePayload>(
    key: K,
    value: RiderProfileCreatePayload[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const payload = toPayload(form);
      const saved = profile
        ? await riderApi.updateProfile(payload)
        : await riderApi.createProfile(payload);
      setProfile(saved);
      setForm(toFormState(saved));
      setNotice(profile ? "Profile updated." : "Profile created.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Profile</h1>
        <p className="mt-6 text-sm text-brand-900/50">Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Profile</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        {profile
          ? "Manage your rider profile details."
          : "Create your rider profile to start booking vehicles."}
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}

      {profile && (
        <span className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          KYC: {profile.kyc_status}
        </span>
      )}

      <form onSubmit={handleSubmit} className="mt-6 grid max-w-xl gap-4 rounded-2xl border border-brand-100 bg-white p-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-brand-900/70">Legal name</label>
          <input
            type="text"
            required
            minLength={2}
            maxLength={150}
            value={form.legal_name}
            onChange={(e) => updateField("legal_name", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-900/70">Driving license number</label>
          <input
            type="text"
            maxLength={30}
            value={form.driving_license_number ?? ""}
            onChange={(e) => updateField("driving_license_number", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-900/70">Date of birth</label>
          <input
            type="date"
            value={form.date_of_birth ?? ""}
            onChange={(e) => updateField("date_of_birth", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-brand-900/70">Address</label>
          <input
            type="text"
            maxLength={255}
            value={form.address_line1 ?? ""}
            onChange={(e) => updateField("address_line1", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-900/70">City</label>
          <input
            type="text"
            maxLength={100}
            value={form.city ?? ""}
            onChange={(e) => updateField("city", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-900/70">State</label>
          <input
            type="text"
            maxLength={100}
            value={form.state ?? ""}
            onChange={(e) => updateField("state", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-900/70">Postal code</label>
          <input
            type="text"
            maxLength={20}
            value={form.postal_code ?? ""}
            onChange={(e) => updateField("postal_code", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-brand-900/70">Country</label>
          <input
            type="text"
            required
            maxLength={100}
            value={form.country}
            onChange={(e) => updateField("country", e.target.value)}
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : profile ? "Save changes" : "Create profile"}
          </button>
        </div>
      </form>
    </div>
  );
}
