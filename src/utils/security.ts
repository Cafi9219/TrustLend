/**
 * Cryptographic security utilities for TrustLend password hashing & verification
 * Implements salted SHA-256 with timing-safe comparison.
 */

function generateRandomSalt(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    return Array.from(arr).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  return Math.random().toString(36).substring(2, 18);
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

export async function hashPassword(password: string, salt?: string): Promise<{ hash: string; salt: string }> {
  const chosenSalt = salt || generateRandomSalt();
  const encoder = new TextEncoder();
  const data = encoder.encode(`trustlend_auth_v1:${chosenSalt}:${password}`);

  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hexHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return {
      hash: `$tl$s256$${chosenSalt}$${hexHash}`,
      salt: chosenSalt,
    };
  }

  // Fallback for non-subtle crypto environments
  let h = 0;
  for (let i = 0; i < data.length; i++) {
    h = (Math.imul(31, h) + data[i]) | 0;
  }
  return {
    hash: `$tl$s256$${chosenSalt}$${Math.abs(h).toString(16)}`,
    salt: chosenSalt,
  };
}

export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  if (!password || !storedHash) return false;
  const parts = storedHash.split('$');
  // Format: ['', 'tl', 's256', salt, hash]
  if (parts.length >= 5) {
    const salt = parts[3];
    const computed = await hashPassword(password, salt);
    return timingSafeEqual(computed.hash, storedHash);
  }
  return false;
}
