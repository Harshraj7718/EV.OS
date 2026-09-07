"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth/auth-context";
import { hasRole } from "@/lib/auth/authorization";
import type { Page, UserListParams } from "@/lib/admin/types";
import type { AuthUser } from "@/lib/auth/types";

const PAGE_SIZE = 10;

interface StakeholderTableProps {
  title: string;
  description: string;
  fetcher: (params: UserListParams) => Promise<Page<AuthUser>>;
}

/** Read-only filtered view of Users for a single role — Investors, Riders,
 * and Businesses don't have their own profile tables yet, only User
 * accounts with that role (see docs/admin.md). Reused by all three pages
 * so the search/filter/pagination/status/action pattern isn't duplicated
 * three times.
 *
 * ADMIN's grant for these three sections is "view" only — narrower than
 * its "view, update, suspend" over Users in general — so action buttons
 * here are SUPER_ADMIN-only; ADMIN manages accounts (including
 * investors/riders/businesses) from the Users page instead. */
export function StakeholderTable({ title, description, fetcher }: StakeholderTableProps) {
  const { user: currentUser } = useAuth();
  const isSuperAdmin = hasRole(currentUser, "SUPER_ADMIN");

  const [rows, setRows] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(() => {
    return fetcher({
      search: search || undefined,
      status: (status || undefined) as AuthUser["status"] | undefined,
      page,
      page_size: PAGE_SIZE,
    })
      .then((data) => {
        setRows(data.items);
        setTotal(data.total);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(err instanceof ApiError ? err.message : "Failed to load.");
      })
      .finally(() => setLoading(false));
  }, [fetcher, search, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleToggleStatus(user: AuthUser) {
    setBusyUserId(user.id);
    try {
      if (user.status === "SUSPENDED") {
        await adminApi.activateUser(user.id);
      } else {
        await adminApi.suspendUser(user.id);
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusyUserId(null);
    }
  }

  const columns: Column<AuthUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (u) => (
        <div>
          <p className="font-medium text-brand-950">{u.name}</p>
          <p className="text-xs text-brand-900/50">{u.email}</p>
        </div>
      ),
    },
    { key: "phone", header: "Phone", render: (u) => u.phone },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
    { key: "created_at", header: "Joined", render: (u) => new Date(u.created_at).toLocaleDateString() },
  ];

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">{title}</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        {description}
        {!isSuperAdmin && " View only — manage accounts from the Users page."}
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <SearchInput
          value={search}
          onChange={(v) => {
            setPage(1);
            setSearch(v);
          }}
          placeholder="Search name, email, phone…"
        />
        <FilterSelect
          value={status}
          onChange={(v) => {
            setPage(1);
            setStatus(v);
          }}
          placeholder="All statuses"
          options={["ACTIVE", "INACTIVE", "SUSPENDED", "PENDING"].map((s) => ({ value: s, label: s }))}
        />
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <div className="mt-4">
        <DataTable
          columns={columns}
          rows={rows}
          loading={loading}
          getRowKey={(u) => u.id}
          emptyMessage="No matches."
          renderActions={
            isSuperAdmin
              ? (u) => (
                  <button
                    type="button"
                    disabled={busyUserId === u.id}
                    onClick={() => handleToggleStatus(u)}
                    className="rounded-full border border-brand-200 px-3 py-1 text-xs text-brand-900 hover:bg-brand-50 disabled:opacity-50"
                  >
                    {u.status === "SUSPENDED" ? "Activate" : "Suspend"}
                  </button>
                )
              : undefined
          }
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
