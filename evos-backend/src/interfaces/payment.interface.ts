export type PlanId = 'Starter' | 'Growth' | 'Enterprise' | 'Custom';

export type PaymentStatus = 'created' | 'paid' | 'failed';

export interface IPayment {
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
  razorpay_order_id: string;
  razorpay_payment_id?: string;
  payment_status: PaymentStatus;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ICreateOrderDto {
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
}

export interface ICreateOrderResult {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  name: string;
  email: string;
  phone: string;
  plan: PlanId;
  investmentAmount: number;
}

export interface IVerifyPaymentDto {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}
