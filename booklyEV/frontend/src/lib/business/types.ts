// Mirrors backend/app/modules/businesses/{enums,schemas}.py.
// Decimal fields (distance_km, revenue_amount, amount, ...) come over the
// wire as JSON strings (e.g. "450.00") — never parse them as numbers
// implicitly, format via formatCurrency() in api.ts.

export type VerificationStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type BusinessDocumentType =
  | "REGISTRATION_CERTIFICATE"
  | "TAX_ID"
  | "BUSINESS_LICENSE"
  | "OTHER";
export type BusinessDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type FleetStatus = "ACTIVE" | "INACTIVE";
export type VehicleStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED";
export type FleetVehicleStatus = "ACTIVE" | "INACTIVE";
export type RiderAssignmentStatus = "ACTIVE" | "INACTIVE";
export type TripStatus = "ONGOING" | "COMPLETED" | "CANCELLED";

export const BUSINESS_DOCUMENT_TYPES: BusinessDocumentType[] = [
  "REGISTRATION_CERTIFICATE",
  "TAX_ID",
  "BUSINESS_LICENSE",
  "OTHER",
];

// Mirrors backend/app/core/pagination.py Page[T].
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface BusinessProfile {
  id: string;
  business_name: string;
  registration_number: string | null;
  business_type: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  verification_status: VerificationStatus;
  created_at: string;
  updated_at: string;
}

export interface BusinessProfileCreatePayload {
  business_name: string;
  registration_number?: string | null;
  business_type?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
}

export type BusinessProfileUpdatePayload = Partial<BusinessProfileCreatePayload>;

export interface BusinessDocument {
  id: string;
  document_type: BusinessDocumentType;
  file_reference: string;
  status: BusinessDocumentStatus;
  created_at: string;
}

export interface BusinessDocumentCreatePayload {
  document_type: BusinessDocumentType;
  file_reference: string;
}

export interface Fleet {
  id: string;
  fleet_code: string;
  name: string;
  description: string | null;
  status: FleetStatus;
  created_at: string;
  updated_at: string;
}

export interface FleetCreatePayload {
  fleet_code: string;
  name: string;
  description?: string | null;
}

export interface FleetUpdatePayload {
  name?: string;
  description?: string | null;
  status?: FleetStatus;
}

export interface Vehicle {
  id: string;
  registration_number: string;
  model_name: string;
  status: VehicleStatus;
  created_at: string;
  updated_at: string;
}

export interface VehicleCreatePayload {
  registration_number: string;
  model_name: string;
}

export interface VehicleUpdatePayload {
  model_name?: string;
  status?: VehicleStatus;
}

export interface FleetVehicleAssignment {
  id: string;
  status: FleetVehicleStatus;
  assigned_at: string;
  unassigned_at: string | null;
  fleet_id: string;
  fleet_name: string;
  vehicle: Vehicle;
}

export interface RiderSummary {
  id: string;
  legal_name: string;
  city: string | null;
  kyc_status: string;
}

export interface RiderAssignment {
  id: string;
  status: RiderAssignmentStatus;
  assigned_at: string;
  unassigned_at: string | null;
  rider: RiderSummary;
}

export interface Trip {
  id: string;
  fleet_id: string;
  vehicle_id: string;
  rider_profile_id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: string;
  revenue_amount: string;
  status: TripStatus;
  completed_at: string;
  created_at: string;
}

export interface TripCreatePayload {
  fleet_vehicle_id: string;
  rider_assignment_id: string;
  pickup_location: string;
  dropoff_location: string;
  distance_km: string;
  revenue_amount: string;
}

export interface TripFilters {
  vehicle_id?: string;
  rider_id?: string;
  trip_status?: TripStatus;
  min_distance?: string;
  max_distance?: string;
  min_revenue?: string;
  max_revenue?: string;
}

export interface BusinessRevenue {
  id: string;
  trip_id: string;
  amount: string;
  recognized_at: string;
}

export interface BusinessAnalytics {
  total_vehicles: number;
  active_vehicles: number;
  active_riders: number;
  total_trips: number;
  total_revenue: string;
  utilization_percent: string;
}
