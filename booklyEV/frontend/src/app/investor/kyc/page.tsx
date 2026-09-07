"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { NeedsProfilePrompt } from "@/components/investor/NeedsProfilePrompt";
import { investorApi } from "@/lib/investor/api";
import { ApiError } from "@/lib/api-client";
import { KYC_DOCUMENT_TYPES, type InvestorProfile, type KycDocumentType } from "@/lib/investor/types";

const KYC_LABELS: Record<InvestorProfile["kyc_status"], string> = {
  NOT_STARTED: "Not started",
  PENDING: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

const KYC_HELP: Record<InvestorProfile["kyc_status"], string> = {
  NOT_STARTED: "Submit an identity document below to begin verification.",
  PENDING: "Your documents are under review. This is a mock/dev flow — no automatic verifier runs yet.",
  VERIFIED: "Your identity is verified. You're all set to invest.",
  REJECTED: "A submitted document was rejected. Submit a new one below.",
};

export default function InvestorKycPage() {
  const [profile, setProfile] = useState<InvestorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [documentType, setDocumentType] = useState<KycDocumentType>("PAN");
  const [fileReference, setFileReference] = useState("");

  useEffect(() => {
    let cancelled = false;
    investorApi
      .getProfile()
      .then((data) => {
        if (!cancelled) setProfile(data);
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load KYC status.");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await investorApi.submitKycDocument({ document_type: documentType, file_reference: fileReference });
      const updatedProfile = await investorApi.getProfile();
      setProfile(updatedProfile);
      setFileReference("");
      setNotice("Document submitted. See it listed on the Documents page.");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Document submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">KYC</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">KYC</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Complete identity verification. No real document storage or verification service is
        connected yet — this is a development/mock flow that only records metadata.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}

      {profile && (
        <div className="mt-6 rounded-2xl border border-brand-100 bg-white p-5">
          <div className="flex items-center gap-3">
            <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
              KYC status: {KYC_LABELS[profile.kyc_status]}
            </span>
          </div>
          <p className="mt-2 text-sm text-brand-900/60">{KYC_HELP[profile.kyc_status]}</p>
          <Link
            href="/investor/documents"
            className="mt-3 inline-block text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            View submitted documents →
          </Link>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-2xl border border-brand-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-brand-950">Submit a document</h2>
        <div className="mt-4">
          <label className="block text-xs font-medium text-brand-900/70">Document type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as KycDocumentType)}
            className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {KYC_DOCUMENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-brand-900/70">
            File reference (mock — enter any identifier, no real upload)
          </label>
          <input
            type="text"
            required
            minLength={1}
            maxLength={500}
            value={fileReference}
            onChange={(e) => setFileReference(e.target.value)}
            placeholder="e.g. mock://pan-card.pdf"
            className="mt-1 w-full rounded-lg border border-brand-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
        </div>
        <button
          type="submit"
          disabled={submitting || !fileReference}
          className="mt-4 rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {submitting ? "Submitting…" : "Submit document"}
        </button>
      </form>
    </div>
  );
}
