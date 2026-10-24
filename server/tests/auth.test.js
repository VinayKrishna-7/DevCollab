import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/utils/password.js';
import { registerSchema, loginSchema } from '../src/modules/auth/auth.validation.js';

describe('Authentication & Password Security', () => {
  it('hashes password with Argon2id and verifies correctly', async () => {
    const plain = 'SuperSecurePass2026!';
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).toContain('$argon2id$');

    const isValid = await verifyPassword(hash, plain);
    expect(isValid).toBe(true);

    const isWrong = await verifyPassword(hash, 'WrongPassword123');
    expect(isWrong).toBe(false);
  });

  it('validates registration input properly using Zod', () => {
    // Valid input
    const valid = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'dev_user_1',
      password: 'SecurePassword123'
    });
    expect(valid.success).toBe(true);

    // Invalid email
    const invalidEmail = registerSchema.safeParse({
      email: 'not-an-email',
      username: 'dev_user_1',
      password: 'SecurePassword123'
    });
    expect(invalidEmail.success).toBe(false);

    // Short password (< 8 chars)
    const shortPassword = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'dev_user_1',
      password: '123'
    });
    expect(shortPassword.success).toBe(false);

    // Invalid username with spaces
    const invalidUsername = registerSchema.safeParse({
      email: 'test@example.com',
      username: 'invalid user name',
      password: 'SecurePassword123'
    });
    expect(invalidUsername.success).toBe(false);
  });

  it('validates login input with rememberMe support', () => {
    const withRemember = loginSchema.safeParse({
      emailOrUsername: 'alexrivera',
      password: 'Password123!',
      rememberMe: true
    });
    expect(withRemember.success).toBe(true);
    expect(withRemember.data.rememberMe).toBe(true);

    const defaultRemember = loginSchema.safeParse({
      emailOrUsername: 'alexrivera',
      password: 'Password123!'
    });
    expect(defaultRemember.success).toBe(true);
    expect(defaultRemember.data.rememberMe).toBe(true);

    const empty = loginSchema.safeParse({
      emailOrUsername: '',
      password: ''
    });
    expect(empty.success).toBe(false);
  });
});
