import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;

export const createOrderSchema = z.object({
  body: z.object({
    name: z.string({ required_error: 'Name is required' }).trim().min(2).max(100),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    phone: z
      .string({ required_error: 'Phone is required' })
      .trim()
      .regex(indianMobileRegex, 'Please provide a valid 10-digit Indian mobile number'),
    plan: z.enum(['Starter', 'Growth', 'Enterprise', 'Custom'], {
      required_error: 'Plan is required',
    }),
    investmentAmount: z.coerce.number().positive().optional(),
  }),
});

export const verifyPaymentSchema = z.object({
  body: z.object({
    razorpay_order_id: z.string({ required_error: 'razorpay_order_id is required' }).trim().min(1),
    razorpay_payment_id: z
      .string({ required_error: 'razorpay_payment_id is required' })
      .trim()
      .min(1),
    razorpay_signature: z
      .string({ required_error: 'razorpay_signature is required' })
      .trim()
      .min(1),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>['body'];
