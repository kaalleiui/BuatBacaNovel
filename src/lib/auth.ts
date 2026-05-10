import * as crypto from 'crypto';

// Simple password hashing using Node.js crypto (scrypt)
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(':');
  const verifyHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === verifyHash;
}

// Simple session token generation
export function generateSessionToken(): string {
  return crypto.randomBytes(32).toString('hex');
}
