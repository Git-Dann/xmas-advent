import type { Env } from './env';
import { isProduction } from './env';
import { normaliseInviteCode, randomToken, safeEqual, sha256Hex } from './crypto';
import { HttpError, clearCookie, parseCookies, sessionCookie } from './http';

export const PLAYER_COOKIE = 'k25_session';
export const ADMIN_COOKIE = 'k25_admin';
const PLAYER_SESSION_DAYS = 400;
const ADMIN_SESSION_HOURS = 12;

export interface Player {
  id: string;
  name: string;
  kind: 'real' | 'preview';
}

export const REAL_PLAYER_ID = 'player-real';
export const PREVIEW_PLAYER_ID = 'player-preview';

export function secureCookies(env: Env): boolean {
  return isProduction(env) || env.ENVIRONMENT === 'preview';
}

export async function ensurePlayers(env: Env): Promise<void> {
  const now = new Date().toISOString();
  await env.DB.batch([
    env.DB.prepare("INSERT OR IGNORE INTO players (id, name, kind, created_at) VALUES (?, 'Chloe', 'real', ?)").bind(REAL_PLAYER_ID, now),
    env.DB.prepare("INSERT OR IGNORE INTO players (id, name, kind, created_at) VALUES (?, 'Preview', 'preview', ?)").bind(PREVIEW_PLAYER_ID, now),
  ]);
  // Local development only: bootstrap invitation codes from configuration.
  if (!isProduction(env) && env.INVITE_CODES) {
    for (const code of env.INVITE_CODES.split(',').map((c) => c.trim()).filter(Boolean)) {
      const hash = await sha256Hex(normaliseInviteCode(code));
      await env.DB.prepare("INSERT OR IGNORE INTO access_codes (code_hash, player_id, label, created_at) VALUES (?, ?, 'bootstrap', ?)")
        .bind(hash, REAL_PLAYER_ID, now).run();
    }
  }
}

export async function createPlayerSession(env: Env, playerId: string): Promise<string> {
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + PLAYER_SESSION_DAYS * 86_400_000);
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, role, player_id, created_at, expires_at, last_seen_at) VALUES (?, 'player', ?, ?, ?, ?)",
  ).bind(await sha256Hex(token), playerId, now.toISOString(), expires.toISOString(), now.toISOString()).run();
  return sessionCookie(PLAYER_COOKIE, token, PLAYER_SESSION_DAYS * 86_400, secureCookies(env));
}

/** Exchanges an invitation or recovery code for a long-lived player session. */
export async function claim(env: Env, code: string): Promise<string> {
  const normalised = normaliseInviteCode(code);
  if (normalised.length < 8 || normalised.length > 64) throw new HttpError(401, 'invalid_code', 'That code does not open anything. Check it and try again.');
  const row = await env.DB.prepare(
    'SELECT player_id FROM access_codes WHERE code_hash = ? AND revoked_at IS NULL',
  ).bind(await sha256Hex(normalised)).first<{ player_id: string }>();
  if (!row) throw new HttpError(401, 'invalid_code', 'That code does not open anything. Check it and try again.');
  return createPlayerSession(env, row.player_id);
}

export async function currentPlayer(env: Env, request: Request): Promise<Player | null> {
  const token = parseCookies(request)[PLAYER_COOKIE];
  if (!token) return null;
  const nowIso = new Date().toISOString();
  const row = await env.DB.prepare(
    `SELECT p.id, p.name, p.kind, s.last_seen_at FROM sessions s JOIN players p ON p.id = s.player_id
     WHERE s.token_hash = ? AND s.role = 'player' AND s.expires_at > ?`,
  ).bind(await sha256Hex(token), nowIso).first<{ id: string; name: string; kind: 'real' | 'preview'; last_seen_at: string }>();
  if (!row) return null;
  // Touch at most hourly to keep writes low.
  if (Date.parse(row.last_seen_at) < Date.now() - 3_600_000) {
    await env.DB.prepare('UPDATE sessions SET last_seen_at = ? WHERE token_hash = ?').bind(nowIso, await sha256Hex(token)).run();
  }
  return { id: row.id, name: row.name, kind: row.kind };
}

export async function requirePlayer(env: Env, request: Request): Promise<Player> {
  const player = await currentPlayer(env, request);
  if (!player) throw new HttpError(401, 'unauthenticated', 'Please open your invitation again.');
  return player;
}

export async function logout(env: Env, request: Request): Promise<string> {
  const token = parseCookies(request)[PLAYER_COOKIE];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  return clearCookie(PLAYER_COOKIE, secureCookies(env));
}

export async function adminLogin(env: Env, password: string): Promise<string> {
  if (!env.ADMIN_PASSWORD || env.ADMIN_PASSWORD.length < 8) {
    throw new HttpError(503, 'admin_disabled', 'The admin password has not been configured.');
  }
  if (!(await safeEqual(password, env.ADMIN_PASSWORD))) throw new HttpError(401, 'invalid_password', 'Incorrect password.');
  const token = randomToken();
  const now = new Date();
  const expires = new Date(now.getTime() + ADMIN_SESSION_HOURS * 3_600_000);
  await env.DB.prepare(
    "INSERT INTO sessions (token_hash, role, player_id, created_at, expires_at, last_seen_at) VALUES (?, 'admin', NULL, ?, ?, ?)",
  ).bind(await sha256Hex(token), now.toISOString(), expires.toISOString(), now.toISOString()).run();
  return sessionCookie(ADMIN_COOKIE, token, ADMIN_SESSION_HOURS * 3600, secureCookies(env));
}

export async function isAdmin(env: Env, request: Request): Promise<boolean> {
  const token = parseCookies(request)[ADMIN_COOKIE];
  if (!token) return false;
  const row = await env.DB.prepare(
    "SELECT 1 AS ok FROM sessions WHERE token_hash = ? AND role = 'admin' AND expires_at > ?",
  ).bind(await sha256Hex(token), new Date().toISOString()).first<{ ok: number }>();
  return Boolean(row);
}

export async function requireAdmin(env: Env, request: Request): Promise<void> {
  if (!(await isAdmin(env, request))) throw new HttpError(401, 'admin_required', 'Admin sign-in required.');
}

export async function adminLogout(env: Env, request: Request): Promise<string> {
  const token = parseCookies(request)[ADMIN_COOKIE];
  if (token) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha256Hex(token)).run();
  return clearCookie(ADMIN_COOKIE, secureCookies(env));
}
