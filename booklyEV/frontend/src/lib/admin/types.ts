import type { AuthUser, Permission, Role, UserStatus } from "@/lib/auth/types";

// Mirrors backend/app/core/pagination.py Page[T].
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface UserListParams {
  search?: string;
  role?: Role;
  status?: UserStatus;
  page?: number;
  page_size?: number;
}

export interface AdminCreateUserPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: Role;
}

export interface AdminUpdateUserPayload {
  name?: string;
  email?: string;
  phone?: string;
}

export interface RolePublic {
  id: string;
  name: Role;
}

export interface PermissionPublic {
  id: string;
  resource: string;
  action: string;
  code: Permission;
  description: string;
}

export interface RolePermissionMatrix {
  permissions: PermissionPublic[];
  matrix: Record<Role, Permission[]>;
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface PlatformOverview {
  total_users: number;
  users_by_role: Record<Role, number>;
  users_by_status: Record<UserStatus, number>;
  total_roles: number;
  total_permissions: number;
  audit_log_count_last_24h: number;
}

export interface AdminSettings {
  app_name: string;
  environment: string;
  api_v1_prefix: string;
  access_token_expire_minutes: number;
  refresh_token_expire_days: number;
}

export type { AuthUser as AdminUser };
