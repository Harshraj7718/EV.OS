import { PlanId } from '../interfaces/payment.interface';

// Never trust a client-supplied investment amount — always resolve it here,
// server-side, from the plan name. Shared by both the Razorpay and bank
// transfer payment flows so the two can never drift out of sync.
export const PAYABLE_PLAN_AMOUNTS: Record<Exclude<PlanId, 'Custom'>, number> = {
  Starter: 140000,
  Growth: 350000,
  Enterprise: 700000,
};

export const resolvePlanAmount = (plan: PlanId): number | undefined => {
  if (plan === 'Custom') return undefined;
  return PAYABLE_PLAN_AMOUNTS[plan];
};

export const BANK_TRANSFER_DETAILS = {
  accountHolderName: 'BookLynk Services Private Limited',
  accountNumber: '926020014337722',
  ifscCode: 'UTIB0004618',
  accountType: 'Current',
};
