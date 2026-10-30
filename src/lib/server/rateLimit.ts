// Simple per-visitor rate limiter for API routes (PRD §23).
// Counts live in this server instance's memory. On a multi-instance host the
// limit is per instance; use a shared store (e.g. Redis) for a strict global limit.

interface Window {
  perMinute: number;
  perDay: number;
}

export type RateLimitResult =
  | { ok: true }
  | { ok: false; retryAfterSeconds: number; scope: 'minute' | 'day' };

const MINUTE = 60_000;
const DAY = 24 * 60 * MINUTE;
const hits = new Map<string, number[]>();

export function checkRateLimit(key: string, limits: Window, now = Date.now()): RateLimitResult {
  const recent = (hits.get(key) ?? []).filter((time) => now - time < DAY);
  const lastMinute = recent.filter((time) => now - time < MINUTE);

  if (recent.length >= limits.perDay) {
    hits.set(key, recent);
    return { ok: false, scope: 'day', retryAfterSeconds: Math.ceil((recent[0] + DAY - now) / 1000) };
  }
  if (lastMinute.length >= limits.perMinute) {
    hits.set(key, recent);
    return { ok: false, scope: 'minute', retryAfterSeconds: Math.max(1, Math.ceil((lastMinute[0] + MINUTE - now) / 1000)) };
  }

  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [entryKey, times] of hits) {
      if (times.every((time) => now - time >= DAY)) hits.delete(entryKey);
    }
  }
  return { ok: true };
}

// The visitor's IP address as reported by the hosting proxy.
export function clientKey(headers: Headers, scope: string): string {
  const forwarded = headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = forwarded || headers.get('x-real-ip') || 'anonymous';
  return `${scope}:${ip}`;
}

export function describeWait(seconds: number): string {
  if (seconds < 90) return `${seconds} seconds`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 90) return `${minutes} minutes`;
  return `${Math.ceil(minutes / 60)} hours`;
}

// For tests.
export function resetRateLimits() {
  hits.clear();
}
