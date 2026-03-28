import { describe, it, expect } from 'vitest';
import { signInAction, signUpAction } from './auth.actions';

describe('signInAction', () => {
  it('returns error when email is invalid', async () => {
    const result = await signInAction({ email: 'not-an-email', password: 'password' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
  });

  it('returns error when password is too short', async () => {
    const result = await signInAction({ email: 'test@example.com', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/8 characters/i);
  });

  it('returns error for wrong credentials', async () => {
    const result = await signInAction({ email: 'wrong@example.com', password: 'wrongpassword' });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBe('Invalid credentials');
  });

  it('returns success with redirectTo for valid stub credentials', async () => {
    const result = await signInAction({ email: 'test@example.com', password: 'password' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.redirectTo).toBe('/dashboard');
  });

  it('returns error when data is missing', async () => {
    const result = await signInAction({});
    expect(result.success).toBe(false);
  });
});

describe('signUpAction', () => {
  it('returns error when name is too short', async () => {
    const result = await signUpAction({
      name: 'A',
      email: 'test@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/2 characters/i);
  });

  it('returns error when email is invalid', async () => {
    const result = await signUpAction({
      name: 'Alice',
      email: 'bad-email',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toBeTruthy();
  });

  it('returns error when password is too short', async () => {
    const result = await signUpAction({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'short',
    });
    expect(result.success).toBe(false);
    if (!result.success) expect(result.error).toMatch(/8 characters/i);
  });

  it('returns success with redirectTo for valid input', async () => {
    const result = await signUpAction({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.redirectTo).toBe('/sign-in');
  });
});
