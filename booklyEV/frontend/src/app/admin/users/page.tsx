"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTable, type Column } from "@/components/admin/DataTable";
import { SearchInput } from "@/components/admin/SearchInput";
import { FilterSelect } from "@/components/admin/FilterSelect";
import { Pagination } from "@/components/admin/Pagination";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import { ROLES, type AuthUser, type Role } from "@/lib/auth/types";

const PAGE_SIZE = 10;

// ADMIN's scoped view: no create, no role-assignment, no activate, and no
// touching a SUPER_ADMIN account at all — enforced for real by the backend
// (see docs/admin.md); this only decides what to render so ADMIN isn't
// shown a control that would just 403. SUPER_ADMIN's unrestricted version
// lives at app/super-admin/users/page.tsx.
export default function AdminUsersPage() {
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);

  const load = useCallback(() => {
    return adminApi
      .listUsers({
        search: search || undefined,
        role: (role || undefined) as Role | undefined,
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
        setError(err instanceof ApiError ? err.message : "Failed to load users.");
      })
      .finally(() => setLoading(false));
  }, [search, role, status, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSuspend(user: AuthUser) {
    setBusyUserId(user.id);
    try {
      await adminApi.suspendUser(user.id);
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
    {
      key: "role",
      header: "Role",
      render: (u) => <span className="rounded-full bg-brand-50 px-2.5 py-1 text-xs text-brand-700">{u.role}</span>,
    },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div>
      <div>
        <h1 className="text-2xl font-semibold text-brand-950">Users</h1>
        <p className="mt-1 text-sm text-brand-900/60">
          View, update, and suspend users. SUPER_ADMIN accounts are not shown as editable.
        </p>
      </div>

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
          value={role}
          onChange={(v) => {
            setPage(1);
            setRole(v);
          }}
          placeholder="All roles"
          options={ROLES.map((r) => ({ value: r, label: r }))}
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
          emptyMessage="No users match these filters."
          renderActions={(u) => {
            // ADMIN can't manage a SUPER_ADMIN account at all (backend-enforced).
            if (u.role === "SUPER_ADMIN") {
              return <span className="text-xs text-brand-900/40">—</span>;
            }
            const busy = busyUserId === u.id;
            if (u.status === "SUSPENDED") {
              // ADMIN has "suspend" but not "activate" — reactivating is
              // SUPER_ADMIN-only, so ADMIN sees no action here at all.
              return <span className="text-xs text-brand-900/40">Suspended</span>;
            }
            return (
              <button
                type="button"
                disabled={busy}
                onClick={() => handleSuspend(u)}
                className="rounded-full border border-brand-200 px-3 py-1 text-xs text-brand-900 hover:bg-brand-50 disabled:opacity-50"
              >
                Suspend
              </button>
            );
          }}
        />
        <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
      </div>
    </div>
  );
}
