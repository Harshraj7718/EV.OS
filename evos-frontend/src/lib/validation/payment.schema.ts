import { z } from 'zod';

const indianMobileRegex = /^[6-9]\d{9}$/;

export const paymentFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().toLowerCase().email('Please enter a valid email address'),
  phone: z.string().trim().regex(indianMobileRegex, 'Enter a valid 10-digit Indian mobile number'),
});

export type PaymentFormValues = z.infer<typeof paymentFormSchema>;

export const paymentFormDefaultValues: PaymentFormValues = {
  name: '',
  email: '',
  phone: '',
};
