import { z } from 'zod';

export const signInSchema = z.object({
  email: z.string().email('Valid email required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signUpSchema = signInSchema.extend({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
