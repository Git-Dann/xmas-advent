import type { SessionResponse } from '../shared/api';
import * as admin from './admin';
import {
  adminLogin, adminLogout, claim, currentPlayer, ensurePlayers, isAdmin, logout, requireAdmin, requirePlayer,
} from './auth';
import { writeSetting } from './clock';
import type { Env } from './env';
import { isProduction } from './env';
import {
  attempt, createContext, getArchive, getCalendar, getEvidenceDetail, getFinale, getPuzzle, revealHint, slotUnlocked, unlockFinale,
} from './game';
import { HttpError, assertSameOrigin, clientIp, errorResponse, json, readJson } from './http';
import { rateLimit } from './ratelimit';

const ensuredDatabases = new WeakSet<object>();

/** Single entry point for every /api request. */
export async function handle(request: Request, env: Env): Promise<Response> {
  try {
    if (!ensuredDatabases.has(env.DB)) {
      await ensurePlayers(env);
      ensuredDatabases.add(env.DB);
    }
    const url = new URL(request.url);
    const path = url.pathname.replace(/\/+$/, '');
    const method = request.method.toUpperCase();
    if (method !== 'GET' && method !== 'HEAD') assertSameOrigin(request);

    // ---------- Auth ----------
    if (path === '/api/auth/claim' && method === 'POST') {
      await rateLimit(env, `claim:${clientIp(request)}`, testLimits(env) ? 500 : 12, 900);
      const body = await readJson(request);
      const cookie = await claim(env, String(body.code ?? ''));
      return json({ ok: true }, 200, { 'Set-Cookie': cookie });
    }
    if (path === '/api/auth/logout' && method === 'POST') {
      return json({ ok: true }, 200, { 'Set-Cookie': await logout(env, request) });
    }
    if (path === '/api/session' && method === 'GET') {
      const player = await currentPlayer(env, request);
      const body: SessionResponse = player
        ? { authenticated: true, player: { name: player.name, preview: player.kind === 'preview' } }
        : { authenticated: false };
      if (await isAdmin(env, request)) body.admin = true;
      return json(body);
    }

    // ---------- Admin ----------
    if (path.startsWith('/api/admin')) return await handleAdmin(request, env, path, method, url);

    // ---------- Test clock (never in production) ----------
    if (path === '/api/test/clock' && method === 'POST') {
      if (isProduction(env) || env.ALLOW_TEST_CLOCK !== '1') throw new HttpError(404, 'not_found', 'Not found.');
      await requireAdmin(env, request);
      const body = await readJson(request);
      await writeSetting(env, 'test_clock', typeof body.at === 'string' ? new Date(body.at).toISOString() : null);
      return json({ ok: true });
    }

    // ---------- Player ----------
    const player = await requirePlayer(env, request);
    const ctx = await createContext(env, player);

    if (path === '/api/calendar' && method === 'GET') return json(getCalendar(ctx));
    if (path === '/api/progress' && method === 'GET') {
      const calendar = getCalendar(ctx);
      return json({ completedCount: calendar.completedCount, hasChristmasKey: calendar.hasChristmasKey, today: calendar.today });
    }

    const puzzleMatch = /^\/api\/puzzles\/(\d{1,2})(?:\/(attempt|hint))?$/.exec(path);
    if (puzzleMatch) {
      const day = Number(puzzleMatch[1]);
      const action = puzzleMatch[2];
      if (!action && method === 'GET') return json(await getPuzzle(ctx, day));
      if (action === 'attempt' && method === 'POST') {
        const body = await readJson(request);
        return json(await attempt(ctx, day, body.stage, body.answer));
      }
      if (action === 'hint' && method === 'POST') return json(await revealHint(ctx, day));
    }

    if (path === '/api/archive' && method === 'GET') {
      if (!ctx.state.rewards.has('archive')) return json({ evidence: [], tools: [] });
      return json(getArchive(ctx));
    }
    const evidenceMatch = /^\/api\/archive\/([a-z0-9-]{1,60})$/.exec(path);
    if (evidenceMatch && method === 'GET') return json(await getEvidenceDetail(ctx, evidenceMatch[1]!));

    if (path === '/api/finale' && method === 'GET') return json(await getFinale(ctx));
    if (path === '/api/finale/unlock' && method === 'POST') return json(await unlockFinale(ctx));

    const mediaMatch = /^\/api\/media\/(m-[A-Za-z0-9_-]{6,40})$/.exec(path);
    if (mediaMatch && method === 'GET') return await serveMedia(env, mediaMatch[1]!, (slot) => slotUnlocked(ctx, slot));

    if (path === '/api/preferences' && method === 'PUT') {
      const body = await readJson(request, 2048);
      await env.DB.prepare(
        'INSERT INTO player_preferences (player_id, prefs, updated_at) VALUES (?, ?, ?) ON CONFLICT(player_id) DO UPDATE SET prefs = excluded.prefs, updated_at = excluded.updated_at',
      ).bind(player.id, JSON.stringify(body).slice(0, 2000), new Date().toISOString()).run();
      return json({ ok: true });
    }

    throw new HttpError(404, 'not_found', 'Not found.');
  } catch (err) {
    if (err instanceof HttpError) return errorResponse(err);
    console.error('Unhandled API error', err instanceof Error ? err.message : 'unknown');
    return json({ error: 'server_error', message: 'Something went wrong on our side. Please try again.' }, 500);
  }
}

/** Rate limits are strict everywhere except automated-test environments (never production). */
function testLimits(env: Env): boolean {
  return !isProduction(env) && env.ALLOW_TEST_CLOCK === '1';
}

async function serveMedia(env: Env, id: string, allowed: (slot: string) => boolean): Promise<Response> {
  const row = await env.DB.prepare('SELECT slot, r2_key, content_type FROM media_assets WHERE id = ?').bind(id)
    .first<{ slot: string; r2_key: string; content_type: string }>();
  if (!row || !allowed(row.slot) || !env.MEDIA) throw new HttpError(404, 'not_found', 'Not found.');
  const object = await env.MEDIA.get(row.r2_key);
  if (!object) throw new HttpError(404, 'not_found', 'Not found.');
  return new Response(object.body, {
    headers: {
      'Content-Type': row.content_type,
      'Cache-Control': 'private, no-store',
      'X-Robots-Tag': 'noindex, nofollow, noarchive',
      'X-Content-Type-Options': 'nosniff',
      'Content-Disposition': 'inline',
    },
  });
}

async function handleAdmin(request: Request, env: Env, path: string, method: string, url: URL): Promise<Response> {
  if (path === '/api/admin/login' && method === 'POST') {
    // Strict in production. Relaxed only where the test clock is enabled (local automated tests).
    await rateLimit(env, `admin-login:${clientIp(request)}`, testLimits(env) ? 500 : 10, 900);
    const body = await readJson(request);
    return json({ ok: true }, 200, { 'Set-Cookie': await adminLogin(env, String(body.password ?? '')) });
  }
  if (path === '/api/admin/logout' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': await adminLogout(env, request) });
  }
  await requireAdmin(env, request);

  if (path === '/api/admin/overview' && method === 'GET') return json(await admin.overview(env));
  if (path === '/api/admin/days' && method === 'GET') return json(await admin.allDays(env));
  const dayMatch = /^\/api\/admin\/days\/(\d{1,2})$/.exec(path);
  if (dayMatch && method === 'PUT') {
    await admin.saveDay(env, Number(dayMatch[1]), await readJson(request, 65_536));
    return json({ ok: true });
  }
  const answerMatch = /^\/api\/admin\/answers\/(\d{1,2})\/([a-z0-9-]{1,40})$/.exec(path);
  if (answerMatch && method === 'PUT') {
    await admin.saveAnswer(env, Number(answerMatch[1]), answerMatch[2]!, await readJson(request));
    return json({ ok: true });
  }
  if (path === '/api/admin/final' && method === 'PUT') {
    await admin.saveFinal(env, await readJson(request, 65_536));
    return json({ ok: true });
  }
  if (path === '/api/admin/codes' && method === 'POST') return json(await admin.createCode(env, await readJson(request)));
  if (path === '/api/admin/codes/revoke' && method === 'POST') {
    await admin.revokeCode(env, await readJson(request));
    return json({ ok: true });
  }
  if (path === '/api/admin/sessions/revoke' && method === 'POST') {
    await admin.revokeSessions(env, await readJson(request));
    return json({ ok: true });
  }
  if (path === '/api/admin/preview/session' && method === 'POST') {
    return json({ ok: true }, 200, { 'Set-Cookie': await admin.previewSession(env) });
  }
  if (path === '/api/admin/preview/clock' && method === 'POST') {
    await admin.setPreviewClock(env, await readJson(request));
    return json({ ok: true });
  }
  if (path === '/api/admin/players/reset' && method === 'POST') {
    await admin.resetPlayer(env, await readJson(request));
    return json({ ok: true });
  }
  if (path === '/api/admin/repair' && method === 'POST') {
    await admin.repair(env, await readJson(request));
    return json({ ok: true });
  }
  if (path === '/api/admin/export' && method === 'GET') {
    const data = await admin.exportProgress(env, url.searchParams.get('player'));
    return json(data, 200, { 'Content-Disposition': `attachment; filename="the-25th-key-backup-${new Date().toISOString().slice(0, 10)}.json"` });
  }
  if (path === '/api/admin/import' && method === 'POST') {
    await admin.importProgress(env, await readJson(request, 2_000_000));
    return json({ ok: true });
  }
  if (path === '/api/admin/media' && method === 'POST') return json(await admin.uploadMedia(env, request));
  const mediaMatch = /^\/api\/admin\/media\/(m-[A-Za-z0-9_-]{6,40})$/.exec(path);
  if (mediaMatch && method === 'GET') return serveMedia(env, mediaMatch[1]!, () => true);
  if (mediaMatch && method === 'DELETE') {
    await admin.deleteMedia(env, mediaMatch[1]!, await readJson(request));
    return json({ ok: true });
  }
  throw new HttpError(404, 'not_found', 'Not found.');
}
