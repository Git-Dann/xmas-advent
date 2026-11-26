import type { Env } from './env';
import { HttpError } from './http';

/**
 * Fixed-window rate limit stored in D1. Atomic: a single upsert increments the counter and the
 * returned row decides. Generous limits: this protects against scripted guessing, not players.
 */
export async function rateLimit(env: Env, key: string, limit: number, windowSeconds: number): Promise<void> {
  const nowSec = Math.floor(Date.now() / 1000);
  const windowStart = nowSec - (nowSec % windowSeconds);
  const row = await env.DB.prepare(
    `INSERT INTO rate_limits (key, window_start, count) VALUES (?1, ?2, 1)
     ON CONFLICT(key) DO UPDATE SET
       count = CASE WHEN rate_limits.window_start = ?2 THEN rate_limits.count + 1 ELSE 1 END,
       window_start = ?2
     RETURNING count`,
  ).bind(key, windowStart).first<{ count: number }>();
  if ((row?.count ?? 0) > limit) {
    throw new HttpError(429, 'slow_down', 'Lots of tries in a short time. Take a breather and try again in a few minutes.');
  }
}
