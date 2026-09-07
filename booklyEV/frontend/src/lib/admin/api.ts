import { apiClient } from "@/lib/api-client";
import type { AuthUser, Role } from "@/lib/auth/types";
import type {
  AdminCreateUserPayload,
  AdminSettings,
  AdminUpdateUserPayload,
  AuditLogEntry,
  Page,
  PermissionPublic,
  PlatformOverview,
  RolePermissionMatrix,
  RolePublic,
  UserListParams,
} from "./types";

function toQueryString(params: Record<string, string | number | undefined>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

function userListQuery(params: UserListParams): string {
  return toQueryString({
    search: params.search,
    role: params.role,
    status: params.status,
    page: params.page,
    page_size: params.page_size,
  });
}

export const adminApi = {
  // --- users ---
  listUsers: (params: UserListParams = {}) =>
    apiClient.get<Page<AuthUser>>(`/api/admin/users${userListQuery(params)}`),
  createUser: (payload: AdminCreateUserPayload) =>
    apiClient.post<AuthUser>("/api/admin/users", payload),
  getUser: (id: string) => apiClient.get<AuthUser>(`/api/admin/users/${id}`),
  updateUser: (id: string, payload: AdminUpdateUserPayload) =>
    apiClient.patch<AuthUser>(`/api/admin/users/${id}`, payload),
  suspendUser: (id: string) => apiClient.post<AuthUser>(`/api/admin/users/${id}/suspend`),
  activateUser: (id: string) => apiClient.post<AuthUser>(`/api/admin/users/${id}/activate`),
  assignRole: (id: string, role: Role) =>
    apiClient.post<AuthUser>(`/api/admin/users/${id}/role`, { role }),

  // --- stakeholder filtered views ---
  listInvestors: (params: UserListParams = {}) =>
    apiClient.get<Page<AuthUser>>(`/api/admin/investors${userListQuery(params)}`),
  listRiders: (params: UserListParams = {}) =>
    apiClient.get<Page<AuthUser>>(`/api/admin/riders${userListQuery(params)}`),
  listBusinesses: (params: UserListParams = {}) =>
    apiClient.get<Page<AuthUser>>(`/api/admin/businesses${userListQuery(params)}`),

  // --- roles & permissions ---
  listRoles: () => apiClient.get<RolePublic[]>("/api/admin/roles"),
  listPermissions: () => apiClient.get<PermissionPublic[]>("/api/admin/permissions"),
  getRbacMatrix: () => apiClient.get<RolePermissionMatrix>("/api/admin/rbac/matrix"),
  grantPermission: (role: Role, code: string) =>
    apiClient.post<void>(`/api/admin/rbac/roles/${role}/permissions/${code}`),
  revokePermission: (role: Role, code: string) =>
    apiClient.delete<void>(`/api/admin/rbac/roles/${role}/permissions/${code}`),

  // --- audit logs ---
  listAuditLogs: (params: { action?: string; target_type?: string; page?: number; page_size?: number } = {}) =>
    apiClient.get<Page<AuditLogEntry>>(`/api/admin/audit-logs${toQueryString(params)}`),

  // --- analytics ---
  getOverview: () => apiClient.get<PlatformOverview>("/api/admin/analytics/overview"),

  // --- settings ---
  getSettings: () => apiClient.get<AdminSettings>("/api/admin/settings"),
};
