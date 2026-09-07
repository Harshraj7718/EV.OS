import { apiClient } from "@/lib/api-client";
import type {
  BusinessAnalytics,
  BusinessDocument,
  BusinessDocumentCreatePayload,
  BusinessProfile,
  BusinessProfileCreatePayload,
  BusinessProfileUpdatePayload,
  BusinessRevenue,
  Fleet,
  FleetCreatePayload,
  FleetUpdatePayload,
  FleetVehicleAssignment,
  Page,
  RiderAssignment,
  RiderSummary,
  Trip,
  TripCreatePayload,
  TripFilters,
  Vehicle,
  VehicleCreatePayload,
  VehicleUpdatePayload,
} from "./types";

interface ListParams {
  page?: number;
  page_size?: number;
}

function toQueryString(params: object): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params as Record<string, string | number | undefined>)) {
    if (value !== undefined && value !== "") search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const businessApi = {
  // --- profile ---
  getProfile: () => apiClient.get<BusinessProfile>("/api/business/profile"),
  createProfile: (payload: BusinessProfileCreatePayload) =>
    apiClient.post<BusinessProfile>("/api/business/profile", payload),
  updateProfile: (payload: BusinessProfileUpdatePayload) =>
    apiClient.patch<BusinessProfile>("/api/business/profile", payload),

  // --- documents ---
  submitDocument: (payload: BusinessDocumentCreatePayload) =>
    apiClient.post<BusinessDocument>("/api/business/documents", payload),
  listDocuments: (params: ListParams = {}) =>
    apiClient.get<Page<BusinessDocument>>(`/api/business/documents${toQueryString(params)}`),

  // --- fleets ---
  createFleet: (payload: FleetCreatePayload) =>
    apiClient.post<Fleet>("/api/business/fleets", payload),
  listFleets: (params: ListParams = {}) =>
    apiClient.get<Page<Fleet>>(`/api/business/fleets${toQueryString(params)}`),
  updateFleet: (fleetId: string, payload: FleetUpdatePayload) =>
    apiClient.patch<Fleet>(`/api/business/fleets/${fleetId}`, payload),

  // --- vehicles ---
  createVehicle: (payload: VehicleCreatePayload) =>
    apiClient.post<Vehicle>("/api/business/vehicles", payload),
  listVehicles: (params: ListParams = {}) =>
    apiClient.get<Page<Vehicle>>(`/api/business/vehicles${toQueryString(params)}`),
  updateVehicle: (vehicleId: string, payload: VehicleUpdatePayload) =>
    apiClient.patch<Vehicle>(`/api/business/vehicles/${vehicleId}`, payload),

  // --- fleet <-> vehicle assignments ---
  assignVehicle: (fleetId: string, vehicleId: string) =>
    apiClient.post<FleetVehicleAssignment>("/api/business/assignments/vehicles", {
      fleet_id: fleetId,
      vehicle_id: vehicleId,
    }),
  listVehicleAssignments: (params: ListParams = {}) =>
    apiClient.get<Page<FleetVehicleAssignment>>(
      `/api/business/assignments/vehicles${toQueryString(params)}`,
    ),
  unassignVehicle: (assignmentId: string) =>
    apiClient.post<FleetVehicleAssignment>(
      `/api/business/assignments/vehicles/${assignmentId}/unassign`,
    ),

  // --- riders ---
  listEligibleRiders: (params: ListParams = {}) =>
    apiClient.get<Page<RiderSummary>>(`/api/business/riders/eligible${toQueryString(params)}`),
  assignRider: (riderProfileId: string) =>
    apiClient.post<RiderAssignment>(`/api/business/riders/${riderProfileId}/assign`),
  listRiderAssignments: (params: ListParams = {}) =>
    apiClient.get<Page<RiderAssignment>>(`/api/business/assignments/riders${toQueryString(params)}`),
  unassignRider: (assignmentId: string) =>
    apiClient.post<RiderAssignment>(`/api/business/assignments/riders/${assignmentId}/unassign`),

  // --- trips ---
  logTrip: (payload: TripCreatePayload) => apiClient.post<Trip>("/api/business/trips", payload),
  listTrips: (params: ListParams & TripFilters = {}) =>
    apiClient.get<Page<Trip>>(`/api/business/trips${toQueryString(params)}`),

  // --- revenue ---
  listRevenue: (params: ListParams = {}) =>
    apiClient.get<Page<BusinessRevenue>>(`/api/business/revenue${toQueryString(params)}`),

  // --- analytics ---
  getAnalytics: () => apiClient.get<BusinessAnalytics>("/api/business/analytics"),
};

/** Decimal fields arrive as strings (e.g. "450.00") — format for display,
 * never coerce to number for arithmetic outside this module. */
export function formatCurrency(value: string): string {
  const amount = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(value: string): string {
  return `${value}%`;
}
