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
import { CreateUserForm } from "./CreateUserForm";

const PAGE_SIZE = 10;

// Unconditionally full control — this page only ever renders for
// SUPER_ADMIN (the /super-admin route tree is single-role, see
// super-admin/layout.tsx), unlike its old shared /admin ancestor which
// branched behavior by role. ADMIN's scoped equivalent lives at
// app/admin/users/page.tsx and never shows create/activate/role-assign.
export default function SuperAdminUsersPage() {
  const [rows, setRows] = useState<AuthUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
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

  async function handleActivate(user: AuthUser) {
    setBusyUserId(user.id);
    try {
      await adminApi.activateUser(user.id);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed.");
    } finally {
      setBusyUserId(null);
    }
  }

  async function handleRoleChange(user: AuthUser, newRole: Role) {
    if (newRole === user.role) return;
    setBusyUserId(user.id);
    try {
      await adminApi.assignRole(user.id, newRole);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Role change failed.");
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
      render: (u) => (
        <select
          value={u.role}
          disabled={busyUserId === u.id}
          onChange={(e) => handleRoleChange(u, e.target.value as Role)}
          className="rounded-lg border border-brand-100 bg-white px-2 py-1 text-xs"
        >
          {ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      ),
    },
    { key: "status", header: "Status", render: (u) => <StatusBadge status={u.status} /> },
  ];

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-brand-950">Users</h1>
          <p className="mt-1 text-sm text-brand-900/60">
            View, create, suspend/activate, and assign roles to any user.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          className="rounded-full bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {showCreateForm ? "Cancel" : "New user"}
        </button>
      </div>

      {showCreateForm && (
        <CreateUserForm
          onCreated={() => {
            setShowCreateForm(false);
            load();
          }}
        />
      )}

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
            const busy = busyUserId === u.id;
            if (u.status === "SUSPENDED") {
              return (
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => handleActivate(u)}
                  className="rounded-full border border-brand-200 px-3 py-1 text-xs text-brand-900 hover:bg-brand-50 disabled:opacity-50"
                >
                  Activate
                </button>
              );
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
