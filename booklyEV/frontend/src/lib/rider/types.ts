// Mirrors backend/app/modules/riders/{enums,schemas}.py.
// Decimal fields (fare_amount, amount, ...) come over the wire as JSON
// strings (e.g. "350.00") — never parse them as numbers implicitly,
// format via formatCurrency() in api.ts.

export type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type KycDocumentType = "DRIVING_LICENSE" | "AADHAAR" | "PAN" | "VEHICLE_INSURANCE" | "OTHER";
export type KycDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type BookingStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type TripStatus = "COMPLETED" | "CANCELLED";
export type JobStatus = "OPEN" | "ACCEPTED" | "COMPLETED" | "CANCELLED";
export type EarningStatus = "ACCRUED" | "PAID";

export const KYC_DOCUMENT_TYPES: KycDocumentType[] = [
  "DRIVING_LICENSE",
  "AADHAAR",
  "PAN",
  "VEHICLE_INSURANCE",
  "OTHER",
];

// Mirrors backend/app/core/pagination.py Page[T].
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface RiderProfile {
  id: string;
  legal_name: string;
  date_of_birth: string | null;
  driving_license_number: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string;
}

export interface RiderProfileCreatePayload {
  legal_name: string;
  date_of_birth?: string | null;
  driving_license_number?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
}

export type RiderProfileUpdatePayload = Partial<RiderProfileCreatePayload>;

export interface KycDocument {
  id: string;
  document_type: KycDocumentType;
  file_reference: string;
  status: KycDocumentStatus;
  created_at: string;
}

export interface KycDocumentCreatePayload {
  document_type: KycDocumentType;
  file_reference: string;
}

export interface Vehicle {
  id: string;
  asset_code: string;
  model_name: string;
  registration_number: string | null;
}

export interface Booking {
  id: string;
  status: BookingStatus;
  booked_at: string | null;
  ended_at: string | null;
  created_at: string;
  vehicle: Vehicle;
}

export interface Job {
  id: string;
  job_code: string;
  title: string;
  description: string | null;
  pickup_location: string;
  dropoff_location: string;
  fare_amount: string;
  status: JobStatus;
  accepted_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface Trip {
  id: string;
  job_code: string;
  job_title: string;
  pickup_location: string;
  dropoff_location: string;
  fare_amount: string;
  status: TripStatus;
  completed_at: string;
  created_at: string;
}

export interface Earning {
  id: string;
  trip_id: string;
  amount: string;
  status: EarningStatus;
  paid_at: string | null;
  created_at: string;
}

export interface EarningsSummary {
  total_earned: string;
  total_paid: string;
  trip_count: number;
}
