"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/admin/api";
import { ApiError } from "@/lib/api-client";
import type { RolePermissionMatrix } from "@/lib/admin/types";
import { ROLES, type Role } from "@/lib/auth/types";

// SUPER_ADMIN-exclusive by construction (see super-admin/layout.tsx) — no
// RBAC page exists under /admin/* at all for the same reason ADMIN can't
// touch this from the API either.
export default function SuperAdminRbacPage() {
  const [data, setData] = useState<RolePermissionMatrix | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyCell, setBusyCell] = useState<string | null>(null);

  function load() {
    adminApi
      .getRbacMatrix()
      .then(setData)
      .catch((err: unknown) => setError(err instanceof ApiError ? err.message : "Failed to load."));
  }

  useEffect(load, []);

  async function toggle(role: Role, code: string, granted: boolean) {
    const cellKey = `${role}:${code}`;
    setBusyCell(cellKey);
    setError(null);
    try {
      if (granted) {
        await adminApi.revokePermission(role, code);
      } else {
        await adminApi.grantPermission(role, code);
      }
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update permission.");
    } finally {
      setBusyCell(null);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-950">Roles &amp; Permissions</h1>
      <p className="mt-1 text-sm text-brand-900/60">
        The role → permission matrix. SUPER_ADMIN always has every permission and can&apos;t be
        edited. Click a dot to grant or revoke a permission for a role — changes apply
        immediately, backend-enforced.
      </p>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      {data && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-brand-100 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-100 text-left text-xs uppercase tracking-wide text-brand-900/50">
                <th className="px-4 py-3 font-medium">Permission</th>
                {ROLES.map((role) => (
                  <th key={role} className="px-4 py-3 text-center font-medium">
                    {role}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.permissions.map((permission) => (
                <tr key={permission.code} className="border-b border-brand-50 last:border-0">
                  <td className="px-4 py-2.5">
                    <code className="text-xs text-brand-900">{permission.code}</code>
                    <p className="mt-0.5 text-xs text-brand-900/50">{permission.description}</p>
                  </td>
                  {ROLES.map((role) => {
                    const granted = data.matrix[role]?.includes(permission.code) ?? false;
                    const isSuperAdmin = role === "SUPER_ADMIN";
                    const cellKey = `${role}:${permission.code}`;
                    return (
                      <td key={role} className="px-4 py-2.5 text-center">
                        <button
                          type="button"
                          disabled={isSuperAdmin || busyCell === cellKey}
                          onClick={() => toggle(role, permission.code, granted)}
                          title={
                            isSuperAdmin
                              ? "SUPER_ADMIN always has every permission"
                              : granted
                                ? "Click to revoke"
                                : "Click to grant"
                          }
                          className={
                            granted
                              ? "inline-block h-5 w-5 rounded-full bg-brand-500 disabled:opacity-70"
                              : "inline-block h-5 w-5 rounded-full border-2 border-brand-200 disabled:opacity-40"
                          }
                        />
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
