"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Pagination } from "@/components/admin/Pagination";
import { NeedsProfilePrompt } from "@/components/rider/NeedsProfilePrompt";
import { riderApi } from "@/lib/rider/api";
import { ApiError } from "@/lib/api-client";
import type { KycDocument } from "@/lib/rider/types";

const PAGE_SIZE = 10;

export default function RiderDocumentsPage() {
  const [rows, setRows] = useState<KycDocument[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [needsProfile, setNeedsProfile] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return riderApi
      .listKycDocuments({ page, page_size: PAGE_SIZE })
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
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
  }, [page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<KycDocument>[] = [
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
        All KYC documents you&apos;ve submitted. Submit a new one from the{" "}
        <Link href="/rider/kyc" className="font-medium text-brand-600 hover:text-brand-700">
          KYC page
        </Link>
        .
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-6">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(d) => d.id}
          emptyMessage="No documents submitted yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
