"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import type { AuditLogEntry } from "@/lib/admin/types";

const PAGE_SIZE = 20;

const ACTIONS = [
  "user.create",
  "user.update",
  "user.suspend",
  "user.activate",
  "user.role_assign",
  "permission.grant",
  "permission.revoke",
];

// SUPER_ADMIN-exclusive by construction (see super-admin/layout.tsx) — no
// Audit Logs page exists under /admin/* at all.
export default function SuperAdminAuditLogsPage() {
  const [rows, setRows] = useState<AuditLogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [action, setAction] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    return adminApi
      .listAuditLogs({ action: action || undefined, page, page_size: PAGE_SIZE })
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load audit logs.");
      })
      .finally(() => setLoading(false));
  }, [action, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const columns: Column<AuditLogEntry>[] = [
    {
      key: "created_at",
      header: "When",
      render: (log) => new Date(log.created_at).toLocaleString(),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => <code className="text-xs text-brand-900">{log.action}</code>,
    },
    {
      key: "target",
      header: "Target",
      render: (log) => (
        <span className="text-xs text-brand-900/70">
          {log.target_type}
          {log.target_id ? `:${log.target_id.slice(0, 8)}…` : ""}
        </span>
      ),
    },
    {
      key: "details",
      header: "Details",
      render: (log) => (
        <code className="text-xs text-brand-900/60">
          {log.details ? JSON.stringify(log.details) : "—"}
        </code>
      ),
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Audit Logs</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        Every sensitive admin action, logged with actor, action, target, and details.
      </p>

      <div className="mt-6">
        <FilterSelect
          value={action}
          onChange={(v) => {
            setPage(1);
            setAction(v);
          }}
          placeholder="All actions"
          options={ACTIONS.map((a) => ({ value: a, label: a }))}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(log) => log.id}
          emptyMessage="No audit log entries yet."
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
