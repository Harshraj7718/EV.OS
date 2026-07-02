import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;

export const leadFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  phone: z
    .string()
    .trim()
    .regex(indianMobileRegex, 'Enter a valid 10-digit Indian mobile number'),
  city: z
    .string()
    .trim()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must be at most 100 characters'),
  interest: z.enum(['Investor', 'Rider', 'Business', 'Other'], {
    required_error: 'Please select what you are interested in',
  }),
  budget: z.string().trim().max(100).optional(),
  message: z.string().trim().max(1000).optional(),
});

export type LeadFormValues = z.infer<typeof leadFormSchema>;

export const leadFormDefaultValues: Partial<LeadFormValues> = {
  name: '',
  email: '',
  phone: '',
  city: '',
  budget: '',
  message: '',
};
