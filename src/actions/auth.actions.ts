'use server';

import { signInSchema, signUpSchema } from '@/lib/validations/auth.schema';
import type { ActionResult } from '@/types';

export async function signInAction(data: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = signInSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    // TODO: replace with real Better Auth signIn call when story 4.1 (DB) is done
    // Stub: only test@example.com / password works
    const { email, password } = parsed.data;
    if (email === 'test@example.com' && password === 'password') {
      return { success: true, data: { redirectTo: '/dashboard' } };
    }

    return { success: false, error: 'Invalid credentials' };
  } catch {
    return { success: false, error: 'Invalid credentials' };
  }
}

export async function signUpAction(data: unknown): Promise<ActionResult<{ redirectTo: string }>> {
  try {
    const parsed = signUpSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0].message };
    }

    // TODO: replace with real Better Auth signUp call when story 4.1 (DB) is done
    // Stub: always "succeeds" and redirects to sign-in
    return { success: true, data: { redirectTo: '/sign-in' } };
  } catch {
    return { success: false, error: 'Something went wrong. Please try again.' };
  }
}
