import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;

export const createBankTransferSchema = z.object({
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
  }),
});

export type CreateBankTransferInput = z.infer<typeof createBankTransferSchema>['body'];
