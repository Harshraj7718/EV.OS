import { apiClient } from "@/lib/api-client";
import type {
  Earning,
  EVAsset,
  InvestorProfile,
  InvestorProfileCreatePayload,
  InvestorProfileUpdatePayload,
  Investment,
  KycDocument,
  KycDocumentCreatePayload,
  Page,
  PortfolioSummary,
  Payout,
  Transaction,
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

export const investorApi = {
  // --- profile ---
  getProfile: () => apiClient.get<InvestorProfile>("/api/investor/profile"),
  createProfile: (payload: InvestorProfileCreatePayload) =>
    apiClient.post<InvestorProfile>("/api/investor/profile", payload),
  updateProfile: (payload: InvestorProfileUpdatePayload) =>
    apiClient.patch<InvestorProfile>("/api/investor/profile", payload),

  // --- KYC ---
  submitKycDocument: (payload: KycDocumentCreatePayload) =>
    apiClient.post<KycDocument>("/api/investor/kyc/documents", payload),
  listKycDocuments: (params: ListParams = {}) =>
    apiClient.get<Page<KycDocument>>(`/api/investor/kyc/documents${toQueryString(params)}`),

  // --- opportunities & owned assets ---
  listOpportunities: (params: ListParams = {}) =>
    apiClient.get<Page<EVAsset>>(`/api/investor/opportunities${toQueryString(params)}`),
  listOwnedAssets: (params: ListParams = {}) =>
    apiClient.get<Page<EVAsset>>(`/api/investor/assets${toQueryString(params)}`),

  // --- investments ---
  invest: (evAssetId: string) =>
    apiClient.post<Investment>("/api/investor/investments", { ev_asset_id: evAssetId }),
  listInvestments: (params: ListParams = {}) =>
    apiClient.get<Page<Investment>>(`/api/investor/investments${toQueryString(params)}`),
  getInvestment: (id: string) => apiClient.get<Investment>(`/api/investor/investments/${id}`),

  // --- portfolio & earnings ---
  getPortfolio: () => apiClient.get<PortfolioSummary>("/api/investor/portfolio"),
  listEarnings: (params: ListParams = {}) =>
    apiClient.get<Page<Earning>>(`/api/investor/earnings${toQueryString(params)}`),

  // --- payouts ---
  requestPayout: () => apiClient.post<Payout>("/api/investor/payouts"),
  listPayouts: (params: ListParams = {}) =>
    apiClient.get<Page<Payout>>(`/api/investor/payouts${toQueryString(params)}`),

  // --- transactions ---
  listTransactions: (params: ListParams = {}) =>
    apiClient.get<Page<Transaction>>(`/api/investor/transactions${toQueryString(params)}`),
};

/** Decimal fields arrive as strings (e.g. "1200000.00") — format for display,
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
