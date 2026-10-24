import argon2 from 'argon2';

/**
 * Hash password using Argon2id with secure recommended parameters
 */
export async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 3,
    parallelism: 1
  });
}

/**
 * Verify a plain password against an Argon2id hash
 */
export async function verifyPassword(hash, plainPassword) {
  try {
    return await argon2.verify(hash, plainPassword);
  } catch (error) {
    return false;
  }
}
