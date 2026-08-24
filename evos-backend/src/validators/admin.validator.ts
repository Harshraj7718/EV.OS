import { z } from 'zod';

export const adminLoginSchema = z.object({
  body: z.object({
    username: z.string({ required_error: 'Username is required' }).trim().min(1),
    password: z.string({ required_error: 'Password is required' }).min(1),
  }),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>['body'];
