import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;

export const createLeadSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name must be at most 100 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .trim()
      .toLowerCase()
      .email('Please provide a valid email address'),
    phone: z
      .string({ required_error: 'Phone is required' })
      .trim()
      .regex(indianMobileRegex, 'Please provide a valid 10-digit Indian mobile number'),
    city: z
      .string({ required_error: 'City is required' })
      .trim()
      .min(2, 'City must be at least 2 characters')
      .max(100, 'City must be at most 100 characters'),
    interest: z.enum(['Investor', 'Rider', 'Business', 'Other'], {
      required_error: 'Interest is required',
      invalid_type_error: 'Interest must be one of Investor, Rider, Business, Other',
    }),
    budget: z.string().trim().max(100).optional().default(''),
    message: z.string().trim().max(1000).optional().default(''),
  }),
});

export const listLeadsSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    interest: z.enum(['Investor', 'Rider', 'Business', 'Other']).optional(),
  }),
});

export type CreateLeadInput = z.infer<typeof createLeadSchema>['body'];
