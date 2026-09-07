export interface HealthResponse {
  status: string;
  service: string;
}

/**
 * Stakeholder roles. Kept in sync with the backend's future RBAC roles
 * (SUPER_ADMIN, ADMIN, INVESTOR, RIDER, BUSINESS) once auth ships.
 */
export type StakeholderRole = "INVESTOR" | "RIDER" | "BUSINESS";
