// Mirrors backend/app/modules/investors/{enums,schemas}.py.
// Decimal fields (amount, price, ...) come over the wire as JSON strings
// (e.g. "1200000.00") — never parse them as numbers implicitly, format via
// formatCurrency() in api.ts's sibling formatting helpers.

export type KycStatus = "NOT_STARTED" | "PENDING" | "VERIFIED" | "REJECTED";
export type KycDocumentType = "PAN" | "AADHAAR" | "PASSPORT" | "BANK_STATEMENT" | "OTHER";
export type KycDocumentStatus = "PENDING" | "VERIFIED" | "REJECTED";
export type EVAssetStatus = "AVAILABLE" | "ALLOCATED" | "RETIRED";
export type InvestmentStatus = "PENDING" | "ACTIVE" | "COMPLETED" | "CANCELLED";
export type EarningStatus = "ACCRUED" | "PAID";
export type PayoutStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
export type TransactionType = "INVESTMENT" | "EARNING_CREDIT" | "PAYOUT";
export type TransactionStatus = "PENDING" | "COMPLETED" | "FAILED";

export const KYC_DOCUMENT_TYPES: KycDocumentType[] = [
  "PAN",
  "AADHAAR",
  "PASSPORT",
  "BANK_STATEMENT",
  "OTHER",
];

// Mirrors backend/app/core/pagination.py Page[T].
export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface InvestorProfile {
  id: string;
  legal_name: string;
  pan_number: string | null;
  date_of_birth: string | null;
  address_line1: string | null;
  city: string | null;
  state: string | null;
  postal_code: string | null;
  country: string;
  kyc_status: KycStatus;
  created_at: string;
  updated_at: string;
}

export interface InvestorProfileCreatePayload {
  legal_name: string;
  pan_number?: string | null;
  date_of_birth?: string | null;
  address_line1?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string;
}

export type InvestorProfileUpdatePayload = Partial<InvestorProfileCreatePayload>;

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

export interface EVAsset {
  id: string;
  asset_code: string;
  model_name: string;
  registration_number: string | null;
  price: string;
  expected_monthly_return: string;
  status: EVAssetStatus;
  description: string | null;
  is_owned_by_me: boolean;
  created_at: string;
}

export interface Investment {
  id: string;
  amount: string;
  status: InvestmentStatus;
  invested_at: string | null;
  created_at: string;
  asset: EVAsset;
}

export interface Earning {
  id: string;
  investment_id: string;
  amount: string;
  period_start: string;
  period_end: string;
  status: EarningStatus;
  created_at: string;
}

export interface Payout {
  id: string;
  amount: string;
  status: PayoutStatus;
  payout_method: string;
  processed_at: string | null;
  created_at: string;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: string;
  status: TransactionStatus;
  reference_type: string;
  reference_id: string;
  description: string;
  created_at: string;
}

export interface PortfolioSummary {
  total_invested: string;
  assets_owned: number;
  total_earnings: string;
  total_earnings_paid: string;
  unpaid_earnings_balance: string;
  total_payouts: string;
  roi_percent: string;
}
