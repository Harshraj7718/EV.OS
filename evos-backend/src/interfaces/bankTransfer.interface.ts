import { PlanId } from './payment.interface';

export type BankTransferStatus = 'pending_review' | 'verified' | 'rejected';

export interface IBankTransferSubmission {
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
  invoiceFileName: string;
  invoiceFileMimeType: string;
  invoiceFileData: Buffer;
  status: BankTransferStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateBankTransferDto {
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  invoiceFileName: string;
  invoiceFileMimeType: string;
  invoiceFileData: Buffer;
}

export interface IBankTransferResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
  status: BankTransferStatus;
  createdAt?: Date;
}
