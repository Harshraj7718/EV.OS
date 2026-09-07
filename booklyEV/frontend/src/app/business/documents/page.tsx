"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { NeedsProfilePrompt } from "@/components/business/NeedsProfilePrompt";
import { businessApi } from "@/lib/business/api";
import { ApiError } from "@/lib/api-client";
import {
  BUSINESS_DOCUMENT_TYPES,
  type BusinessDocument,
  type BusinessDocumentType,
  type BusinessProfile,
} from "@/lib/business/types";

const VERIFICATION_LABELS: Record<BusinessProfile["verification_status"], string> = {
  NOT_STARTED: "Not started",
  PENDING: "Under review",
  VERIFIED: "Verified",
  REJECTED: "Rejected",
};

export default function BusinessDocumentsPage() {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [rows, setRows] = useState<BusinessDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [documentType, setDocumentType] = useState<BusinessDocumentType>(
    "REGISTRATION_CERTIFICATE",
  );
  const [fileReference, setFileReference] = useState("");

  const load = useCallback(() => {
    return Promise.all([businessApi.getProfile(), businessApi.listDocuments({ page_size: 50 })])
      .then(([profileData, docs]) => {
        setProfile(profileData);
        setRows(docs.items);
        setNeedsProfile(false);
        setError(null);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 404) {
          setNeedsProfile(true);
        } else {
          setError(err instanceof ApiError ? err.message : "Failed to load documents.");
        }
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setNotice(null);
    try {
      await businessApi.submitDocument({ document_type: documentType, file_reference: fileReference });
      setFileReference("");
      setNotice("Document submitted.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Document submission failed.");
    } finally {
      setSubmitting(false);
    }
  }

  const columns: Column<BusinessDocument>[] = [
    { key: "type", header: "Document type", render: (d) => d.document_type },
    { key: "reference", header: "Reference", render: (d) => d.file_reference },
    { key: "status", header: "Status", render: (d) => <StatusBadge status={d.status} /> },
    {
      key: "created_at",
      header: "Submitted on",
      render: (d) => new Date(d.created_at).toLocaleDateString(),
    },
  ];

  if (!loading && needsProfile) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Documents</h1>
        <div className="mt-6">
          <NeedsProfilePrompt />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Documents</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Submit business verification documents. No real document storage or verification service
        is connected yet — this is a development/mock flow that only records metadata.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      {notice && <p className="mt-4 text-sm text-emerald-700">{notice}</p>}

      {profile && (
        <span className="mt-4 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700">
          Verification status: {VERIFICATION_LABELS[profile.verification_status]}
        </span>
      )}

      <form onSubmit={handleSubmit} className="mt-6 max-w-md rounded-2xl border border-brand-100 bg-white p-5">
        <h2 className="text-sm font-semibold text-brand-950">Submit a document</h2>
        <div className="mt-4">
          <label className="block text-xs font-medium text-brand-900/70">Document type</label>
          <select
            value={documentType}
            onChange={(e) => setDocumentType(e.target.value as BusinessDocumentType)}
            className="mt-1 w-full rounded-lg border border-brand-100 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            {BUSINESS_DOCUMENT_TYPES.map((t) => (
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
            placeholder="e.g. mock://registration-certificate.pdf"
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

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(d) => d.id}
          emptyMessage="No documents submitted yet."
        />
      </div>
    </div>
  );
}
