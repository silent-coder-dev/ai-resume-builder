import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

// Keeps answer keys and hidden test cases on the candidate's own machine without
// letting them read it: the server encrypts the data, the browser only carries
// it, and only the server can open it again. This needs no database.
function keyFrom(secret: string): Buffer {
  if (!secret) throw new Error('A server secret is required. Set AI_SYNC_TOKEN_SECRET.');
  return createHash('sha256').update(`assessment-seal:${secret}`).digest();
}

export function seal(value: unknown, secret: string, ttlSeconds: number, now = Date.now()): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', keyFrom(secret), iv);
  const plain = JSON.stringify({ exp: now + ttlSeconds * 1000, value });
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), encrypted]).toString('base64url');
}

// Returns null when the token was changed, made with another secret, or expired.
export function unseal<T>(token: unknown, secret: string, now = Date.now()): T | null {
  if (typeof token !== 'string' || token.length < 40 || token.length > 2_000_000) return null;
  try {
    const raw = Buffer.from(token, 'base64url');
    const decipher = createDecipheriv('aes-256-gcm', keyFrom(secret), raw.subarray(0, 12));
    decipher.setAuthTag(raw.subarray(12, 28));
    const plain = Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plain) as { exp: number; value: T };
    return parsed.exp >= now ? parsed.value : null;
  } catch {
    return null;
  }
}
