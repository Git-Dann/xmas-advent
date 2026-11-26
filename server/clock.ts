import type { Env } from './env';
import { isProduction } from './env';

/** The year the experience runs. Day N unlocks at 00:00 Europe/London on N December. */
export const EVENT_YEAR = 2026;
export const TIME_ZONE = 'Europe/London';

const londonFormatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** ISO calendar date (YYYY-MM-DD) in Europe/London for a UTC instant. */
export function londonDate(ms: number): string {
  const parts = londonFormatter.formatToParts(new Date(ms));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function dayDate(day: number): string {
  return `${EVENT_YEAR}-12-${String(day).padStart(2, '0')}`;
}

export function isDateEligible(day: number, today: string): boolean {
  return today >= dayDate(day);
}

/**
 * Resolves "now" for a request. The real player always gets real server time in production.
 * - test clock: local/test environments only, when ALLOW_TEST_CLOCK=1 (used by automated tests).
 * - preview clock: only ever applies to the isolated preview player, set by the admin.
 */
export async function resolveNow(env: Env, playerKind: 'real' | 'preview' | null): Promise<number> {
  const real = Date.now();
  if (playerKind === 'preview') {
    const preview = await readSetting(env, 'preview_clock');
    if (preview) {
      const ms = Date.parse(preview);
      if (!Number.isNaN(ms)) return ms;
    }
  }
  if (!isProduction(env) && env.ALLOW_TEST_CLOCK === '1') {
    const test = await readSetting(env, 'test_clock');
    if (test) {
      const ms = Date.parse(test);
      if (!Number.isNaN(ms)) return ms;
    }
  }
  return real;
}

export async function readSetting(env: Env, key: string): Promise<string | null> {
  const row = await env.DB.prepare('SELECT value FROM settings WHERE key = ?').bind(key).first<{ value: string }>();
  return row?.value ?? null;
}

export async function writeSetting(env: Env, key: string, value: string | null): Promise<void> {
  if (value === null) {
    await env.DB.prepare('DELETE FROM settings WHERE key = ?').bind(key).run();
    return;
  }
  await env.DB.prepare(
    'INSERT INTO settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
  ).bind(key, value, new Date().toISOString()).run();
}
