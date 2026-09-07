import { apiClient } from "@/lib/api-client";
import type {
  Booking,
  Earning,
  EarningsSummary,
  Job,
  KycDocument,
  KycDocumentCreatePayload,
  Page,
  RiderProfile,
  RiderProfileCreatePayload,
  RiderProfileUpdatePayload,
  Trip,
  Vehicle,
} from "./types";

interface ListParams {
  page?: number;
  page_size?: number;
}

function toQueryString(params: ListParams): string {
  const search = new URLSearchParams();
  if (params.page !== undefined) search.set("page", String(params.page));
  if (params.page_size !== undefined) search.set("page_size", String(params.page_size));
  const qs = search.toString();
  return qs ? `?${qs}` : "";
}

export const riderApi = {
  // --- profile ---
  getProfile: () => apiClient.get<RiderProfile>("/api/rider/profile"),
  createProfile: (payload: RiderProfileCreatePayload) =>
    apiClient.post<RiderProfile>("/api/rider/profile", payload),
  updateProfile: (payload: RiderProfileUpdatePayload) =>
    apiClient.patch<RiderProfile>("/api/rider/profile", payload),

  // --- KYC ---
  submitKycDocument: (payload: KycDocumentCreatePayload) =>
    apiClient.post<KycDocument>("/api/rider/kyc/documents", payload),
  listKycDocuments: (params: ListParams = {}) =>
    apiClient.get<Page<KycDocument>>(`/api/rider/kyc/documents${toQueryString(params)}`),

  // --- vehicles & bookings ---
  listAvailableVehicles: (params: ListParams = {}) =>
    apiClient.get<Page<Vehicle>>(`/api/rider/vehicles${toQueryString(params)}`),
  bookVehicle: (evAssetId: string) =>
    apiClient.post<Booking>("/api/rider/bookings", { ev_asset_id: evAssetId }),
  listBookings: (params: ListParams = {}) =>
    apiClient.get<Page<Booking>>(`/api/rider/bookings${toQueryString(params)}`),
  getCurrentVehicle: () => apiClient.get<Booking>("/api/rider/current-vehicle"),
  returnCurrentVehicle: () => apiClient.post<Booking>("/api/rider/current-vehicle/return"),

  // --- trips ---
  listTrips: (params: ListParams = {}) =>
    apiClient.get<Page<Trip>>(`/api/rider/trips${toQueryString(params)}`),

  // --- job marketplace ---
  listOpenJobs: (params: ListParams = {}) =>
    apiClient.get<Page<Job>>(`/api/rider/jobs/marketplace${toQueryString(params)}`),
  listMyJobs: (params: ListParams = {}) =>
    apiClient.get<Page<Job>>(`/api/rider/jobs/mine${toQueryString(params)}`),
  acceptJob: (jobId: string) => apiClient.post<Job>(`/api/rider/jobs/${jobId}/accept`),
  completeJob: (jobId: string) => apiClient.post<Job>(`/api/rider/jobs/${jobId}/complete`),

  // --- earnings & payments ---
  listEarnings: (params: ListParams = {}) =>
    apiClient.get<Page<Earning>>(`/api/rider/earnings${toQueryString(params)}`),
  getEarningsSummary: () => apiClient.get<EarningsSummary>("/api/rider/earnings/summary"),
  listPayments: (params: ListParams = {}) =>
    apiClient.get<Page<Earning>>(`/api/rider/payments${toQueryString(params)}`),
};

/** Decimal fields arrive as strings (e.g. "350.00") — format for display,
 * never coerce to number for arithmetic outside this module. */
export function formatCurrency(value: string): string {
  const amount = Number(value);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
