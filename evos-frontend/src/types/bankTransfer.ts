export interface BankTransferDetails {
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  accountType: string;
}

export interface BankTransferSubmissionResult {
  id: string;
  name: string;
  email: string;
  phone: string;
  plan: string;
  investmentAmount: number;
  status: 'pending_review' | 'verified' | 'rejected';
  createdAt?: string;
}
