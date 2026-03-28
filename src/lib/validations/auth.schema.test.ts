import { describe, it, expect } from 'vitest';
import { signInSchema, signUpSchema } from './auth.schema';

describe('signInSchema', () => {
  it('accepts valid email and password', () => {
    const result = signInSchema.safeParse({ email: 'user@example.com', password: 'password123' });
    expect(result.success).toBe(true);
  });

  it('rejects invalid email', () => {
    const result = signInSchema.safeParse({ email: 'not-an-email', password: 'password123' });
    expect(result.success).toBe(false);
  });

  it('rejects password shorter than 8 characters', () => {
    const result = signInSchema.safeParse({ email: 'user@example.com', password: 'short' });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/8 characters/i);
    }
  });

  it('rejects missing fields', () => {
    expect(signInSchema.safeParse({}).success).toBe(false);
  });
});

describe('signUpSchema', () => {
  it('accepts valid name, email and password', () => {
    const result = signUpSchema.safeParse({
      name: 'Alice',
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(true);
  });

  it('rejects name shorter than 2 characters', () => {
    const result = signUpSchema.safeParse({
      name: 'A',
      email: 'alice@example.com',
      password: 'password123',
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.errors[0].message).toMatch(/2 characters/i);
    }
  });

  it('rejects missing name', () => {
    const result = signUpSchema.safeParse({ email: 'alice@example.com', password: 'password123' });
    expect(result.success).toBe(false);
  });
});
