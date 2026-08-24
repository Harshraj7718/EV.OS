export type PlanId = 'Starter' | 'Growth' | 'Enterprise' | 'Custom';
export type LeadInterest = 'Investor' | 'Rider' | 'Business' | 'Other';
export type PaymentStatus = 'created' | 'paid' | 'failed';
export type BankTransferStatus = 'pending_review' | 'verified' | 'rejected';

export interface Lead {
  _id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  interest: LeadInterest;
  budget?: string;
  message?: string;
  createdAt: string;
}

export interface Payment {
  _id: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  payment_status: PaymentStatus;
  createdAt: string;
}

export interface BankTransfer {
  _id: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
  invoiceFileName: string;
  status: BankTransferStatus;
  createdAt: string;
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
