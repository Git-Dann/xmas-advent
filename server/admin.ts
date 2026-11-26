import { PREVIEW_PLAYER_ID, REAL_PLAYER_ID, createPlayerSession } from './auth';
import { readSetting, writeSetting } from './clock';
import { ANSWERS, FINAL_MESSAGE } from './content/answers';
import { DAYS } from './content/days';
import { EVIDENCE, getEvidence } from './content/evidence';
import { buildGraph, graphAsMermaid, validateGraph } from './content/graph';
import { dayContent, finalMessage, loadOverrides } from './content/store';
import { normaliseInviteCode, randomInviteCode, randomToken, sha256Hex } from './crypto';
import type { Env } from './env';
import { HttpError } from './http';
import { isValidMatcher } from './validation/matchers';

export async function audit(env: Env, action: string, detail: unknown): Promise<void> {
  await env.DB.prepare('INSERT INTO admin_audit_log (at, action, detail) VALUES (?, ?, ?)')
    .bind(new Date().toISOString(), action, JSON.stringify(detail).slice(0, 4000)).run();
}

function playerIdFrom(value: unknown): string {
  if (value === 'real') return REAL_PLAYER_ID;
  if (value === 'preview') return PREVIEW_PLAYER_ID;
  throw new HttpError(400, 'bad_player', 'Choose the real or preview player.');
}

function requireConfirm(body: Record<string, unknown>, word: string): void {
  if (body.confirm !== word) throw new HttpError(400, 'confirm_required', `Type ${word} to confirm.`);
}

export async function overview(env: Env) {
  const [progress, hints, attempts, codes, media, auditRows, previewClock, sessions] = await Promise.all([
    env.DB.prepare('SELECT player_id, day, status, started_at, completed_at FROM puzzle_progress ORDER BY day').all(),
    env.DB.prepare('SELECT player_id, day, MAX(hint_index) AS hints FROM hint_usage GROUP BY player_id, day').all(),
    env.DB.prepare('SELECT player_id, day, COUNT(*) AS total, SUM(correct) AS correct FROM attempts GROUP BY player_id, day').all(),
    env.DB.prepare('SELECT substr(code_hash, 1, 10) AS ref, player_id, label, created_at, revoked_at FROM access_codes ORDER BY created_at DESC').all(),
    env.DB.prepare('SELECT id, slot, content_type, size, caption, created_at FROM media_assets ORDER BY slot, sort_order').all(),
    env.DB.prepare('SELECT at, action, detail FROM admin_audit_log ORDER BY id DESC LIMIT 50').all(),
    readSetting(env, 'preview_clock'),
    env.DB.prepare("SELECT player_id, COUNT(*) AS n, MAX(last_seen_at) AS last_seen FROM sessions WHERE role = 'player' GROUP BY player_id").all(),
  ]);
  return {
    environment: env.ENVIRONMENT ?? 'production',
    mediaStorage: Boolean(env.MEDIA),
    previewClock,
    progress: progress.results,
    hints: hints.results,
    attempts: attempts.results,
    codes: codes.results,
    media: media.results,
    audit: auditRows.results,
    sessions: sessions.results,
    graphProblems: validateGraph(),
  };
}

export async function allDays(env: Env) {
  const overrides = await loadOverrides(env);
  return {
    days: DAYS.map((base) => {
      const merged = dayContent(base.day, overrides)!;
      return {
        day: base.day,
        content: merged,
        overridden: overrides.days.has(base.day),
        answers: Object.fromEntries(base.stages.map((stage) => [
          stage.id,
          { matcher: overrides.answers.get(`${base.day}:${stage.id}`) ?? ANSWERS[base.day]?.[stage.id], overridden: overrides.answers.has(`${base.day}:${stage.id}`) },
        ])),
      };
    }),
    evidence: EVIDENCE,
    final: finalMessage(overrides),
    finalOverridden: overrides.final !== null,
    mermaid: graphAsMermaid(),
    graph: buildGraph(),
  };
}

async function setOverride(env: Env, key: string, value: unknown | null): Promise<void> {
  if (value === null) {
    await env.DB.prepare('DELETE FROM content_overrides WHERE key = ?').bind(key).run();
  } else {
    await env.DB.prepare(
      'INSERT INTO content_overrides (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at',
    ).bind(key, JSON.stringify(value), new Date().toISOString()).run();
  }
}

const strArr = (v: unknown, max = 30) => Array.isArray(v) && v.length <= max && v.every((s) => typeof s === 'string' && s.length < 2000);

export async function saveDay(env: Env, day: number, body: Record<string, unknown>): Promise<void> {
  const base = DAYS.find((d) => d.day === day);
  if (!base) throw new HttpError(404, 'no_such_day', 'No such day.');
  if (body.reset === true) {
    await setOverride(env, `day:${day}`, null);
    await audit(env, 'day.reset', { day });
    return;
  }
  const patch: Record<string, unknown> = {};
  if (typeof body.title === 'string' && body.title.trim()) patch.title = body.title.trim().slice(0, 120);
  if (strArr(body.intro)) patch.intro = body.intro;
  if (typeof body.objective === 'string') patch.objective = body.objective.slice(0, 500);
  if (strArr(body.hints) && (body.hints as string[]).length === 3) patch.hints = body.hints;
  const reveal = body.reveal as Record<string, unknown> | undefined;
  if (reveal && typeof reveal.title === 'string' && strArr(reveal.body)) patch.reveal = { title: reveal.title, body: reveal.body };
  const scene = body.scene as Record<string, unknown> | undefined;
  if (scene && scene.kind === base.scene.kind) patch.scene = scene;
  await setOverride(env, `day:${day}`, patch);
  await audit(env, 'day.save', { day, fields: Object.keys(patch) });
}

export async function saveAnswer(env: Env, day: number, stage: string, body: Record<string, unknown>): Promise<void> {
  const base = DAYS.find((d) => d.day === day);
  if (!base || !base.stages.some((s) => s.id === stage)) throw new HttpError(404, 'no_such_stage', 'No such stage.');
  if (body.reset === true) {
    await setOverride(env, `answer:${day}:${stage}`, null);
    await audit(env, 'answer.reset', { day, stage });
    return;
  }
  if (!isValidMatcher(body.matcher)) throw new HttpError(400, 'bad_matcher', 'That answer configuration is not valid.');
  await setOverride(env, `answer:${day}:${stage}`, body.matcher);
  await audit(env, 'answer.save', { day, stage });
}

export async function saveFinal(env: Env, body: Record<string, unknown>): Promise<void> {
  if (body.reset === true) {
    await setOverride(env, 'final', null);
    await audit(env, 'final.reset', {});
    return;
  }
  if (typeof body.title !== 'string' || !strArr(body.letter, 60) || typeof body.signature !== 'string') {
    throw new HttpError(400, 'bad_final', 'The final message needs a title, letter paragraphs and a signature.');
  }
  await setOverride(env, 'final', {
    title: body.title, letter: body.letter, signature: body.signature,
    closing: typeof body.closing === 'string' ? body.closing : FINAL_MESSAGE.closing,
  });
  await audit(env, 'final.save', {});
}

export async function createCode(env: Env, body: Record<string, unknown>): Promise<{ code: string }> {
  const label = typeof body.label === 'string' && body.label.trim() ? body.label.trim().slice(0, 80) : 'Invitation';
  const code = randomInviteCode();
  await env.DB.prepare('INSERT INTO access_codes (code_hash, player_id, label, created_at) VALUES (?, ?, ?, ?)')
    .bind(await sha256Hex(normaliseInviteCode(code)), REAL_PLAYER_ID, label, new Date().toISOString()).run();
  await audit(env, 'code.create', { label });
  return { code };
}

export async function revokeCode(env: Env, body: Record<string, unknown>): Promise<void> {
  if (typeof body.ref !== 'string' || body.ref.length < 6) throw new HttpError(400, 'bad_ref', 'Missing code reference.');
  await env.DB.prepare('UPDATE access_codes SET revoked_at = ? WHERE substr(code_hash, 1, 10) = ? AND revoked_at IS NULL')
    .bind(new Date().toISOString(), body.ref).run();
  await audit(env, 'code.revoke', { ref: body.ref });
}

export async function revokeSessions(env: Env, body: Record<string, unknown>): Promise<void> {
  requireConfirm(body, 'SIGN OUT');
  const pid = playerIdFrom(body.player);
  await env.DB.prepare("DELETE FROM sessions WHERE role = 'player' AND player_id = ?").bind(pid).run();
  await audit(env, 'sessions.revoke', { player: body.player });
}

export async function previewSession(env: Env): Promise<string> {
  await audit(env, 'preview.session', {});
  return createPlayerSession(env, PREVIEW_PLAYER_ID);
}

export async function setPreviewClock(env: Env, body: Record<string, unknown>): Promise<void> {
  const value = body.at;
  if (value === null) {
    await writeSetting(env, 'preview_clock', null);
  } else if (typeof value === 'string' && !Number.isNaN(Date.parse(value))) {
    await writeSetting(env, 'preview_clock', new Date(value).toISOString());
  } else {
    throw new HttpError(400, 'bad_date', 'Provide an ISO date and time, or null to use the real time.');
  }
  await audit(env, 'preview.clock', { at: value });
}

const PLAYER_TABLES = ['puzzle_progress', 'puzzle_stage_progress', 'player_evidence', 'player_rewards', 'hint_usage', 'attempts', 'player_preferences'] as const;

export async function resetPlayer(env: Env, body: Record<string, unknown>): Promise<void> {
  const pid = playerIdFrom(body.player);
  requireConfirm(body, pid === REAL_PLAYER_ID ? 'RESET CHLOE' : 'RESET');
  await env.DB.batch(PLAYER_TABLES.map((table) => env.DB.prepare(`DELETE FROM ${table} WHERE player_id = ?`).bind(pid)));
  await audit(env, 'player.reset', { player: body.player });
}

/** Safe repairs. Every action keeps progression sequential and is recorded in the audit log. */
export async function repair(env: Env, body: Record<string, unknown>): Promise<void> {
  requireConfirm(body, 'REPAIR');
  const pid = playerIdFrom(body.player);
  const now = new Date().toISOString();
  const action = body.action;
  if (action === 'complete-day') {
    const day = Number(body.day);
    const def = DAYS.find((d) => d.day === day);
    if (!def) throw new HttpError(400, 'bad_day', 'No such day.');
    const prior = await env.DB.prepare("SELECT COUNT(*) AS n FROM puzzle_progress WHERE player_id = ? AND day < ? AND status = 'complete'")
      .bind(pid, day).first<{ n: number }>();
    if ((prior?.n ?? 0) !== day - 1) throw new HttpError(409, 'out_of_order', 'Earlier days must be complete first.');
    const statements = [
      env.DB.prepare("INSERT OR IGNORE INTO puzzle_progress (player_id, day, status, started_at) VALUES (?, ?, 'in_progress', ?)").bind(pid, day, now),
      env.DB.prepare(
        `UPDATE puzzle_progress SET status = 'complete', completed_at = ?3 WHERE player_id = ?1 AND day = ?2
         AND (SELECT COUNT(*) FROM puzzle_progress WHERE player_id = ?1 AND day < ?2 AND status = 'complete') = ?2 - 1`,
      ).bind(pid, day, now),
      ...def.stages.map((stage) => env.DB.prepare('INSERT OR IGNORE INTO puzzle_stage_progress (player_id, day, stage, completed_at) VALUES (?, ?, ?, ?)').bind(pid, day, stage.id, now)),
      ...def.rewards.map((id) => env.DB.prepare(
        `INSERT OR IGNORE INTO player_evidence (player_id, evidence_id, source_day, acquired_at)
         SELECT ?1, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM puzzle_progress WHERE player_id = ?1 AND day = ?3 AND status = 'complete')`,
      ).bind(pid, id, day, now)),
      ...[...(def.entitlements ?? []), ...(def.grantsOnOpen ?? [])].map((id) => env.DB.prepare(
        `INSERT OR IGNORE INTO player_rewards (player_id, reward_id, source_day, awarded_at)
         SELECT ?1, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM puzzle_progress WHERE player_id = ?1 AND day = ?3 AND status = 'complete')`,
      ).bind(pid, id, day, now)),
    ];
    await env.DB.batch(statements);
    const row = await env.DB.prepare("SELECT status FROM puzzle_progress WHERE player_id = ? AND day = ?").bind(pid, day).first<{ status: string }>();
    if (row?.status !== 'complete') throw new HttpError(409, 'out_of_order', 'Earlier days must be complete first.');
  } else if (action === 'reopen-day') {
    // Reopens a day and every later day, so progression can never contain gaps.
    const day = Number(body.day);
    await env.DB.batch([
      env.DB.prepare("UPDATE puzzle_progress SET status = 'in_progress', completed_at = NULL WHERE player_id = ? AND day >= ?").bind(pid, day),
      env.DB.prepare('DELETE FROM puzzle_stage_progress WHERE player_id = ? AND day >= ?').bind(pid, day),
      env.DB.prepare('DELETE FROM player_evidence WHERE player_id = ? AND source_day >= ?').bind(pid, day),
      env.DB.prepare('DELETE FROM player_rewards WHERE player_id = ? AND source_day >= ?').bind(pid, day),
    ]);
  } else if (action === 'grant-evidence') {
    const id = String(body.evidence ?? '');
    const def = getEvidence(id);
    if (!def) throw new HttpError(400, 'bad_evidence', 'Unknown evidence.');
    await env.DB.prepare('INSERT OR IGNORE INTO player_evidence (player_id, evidence_id, source_day, acquired_at) VALUES (?, ?, ?, ?)')
      .bind(pid, id, def.day, now).run();
  } else {
    throw new HttpError(400, 'bad_action', 'Unknown repair action.');
  }
  await audit(env, 'repair', { player: body.player, action, day: body.day, evidence: body.evidence });
}

export async function exportProgress(env: Env, playerArg: string | null) {
  const pid = playerIdFrom(playerArg ?? 'real');
  const data: Record<string, unknown[]> = {};
  for (const table of PLAYER_TABLES) {
    const rows = await env.DB.prepare(`SELECT * FROM ${table} WHERE player_id = ?`).bind(pid).all();
    data[table] = rows.results ?? [];
  }
  const overrides = await env.DB.prepare('SELECT * FROM content_overrides').all();
  await audit(env, 'export', { player: playerArg });
  return { format: 'the-25th-key-backup', version: 1, exportedAt: new Date().toISOString(), player: pid, data, contentOverrides: overrides.results ?? [] };
}

const COLUMNS: Record<(typeof PLAYER_TABLES)[number], string[]> = {
  puzzle_progress: ['player_id', 'day', 'status', 'started_at', 'completed_at'],
  puzzle_stage_progress: ['player_id', 'day', 'stage', 'completed_at'],
  player_evidence: ['player_id', 'evidence_id', 'source_day', 'acquired_at'],
  player_rewards: ['player_id', 'reward_id', 'source_day', 'awarded_at'],
  hint_usage: ['player_id', 'day', 'hint_index', 'revealed_at'],
  attempts: ['player_id', 'day', 'stage', 'correct', 'submitted', 'created_at'],
  player_preferences: ['player_id', 'prefs', 'updated_at'],
};

export async function importProgress(env: Env, body: Record<string, unknown>): Promise<void> {
  requireConfirm(body, 'RESTORE');
  const backup = body.backup as Record<string, unknown> | undefined;
  if (!backup || backup.format !== 'the-25th-key-backup' || typeof backup.data !== 'object' || backup.data === null) {
    throw new HttpError(400, 'bad_backup', 'That is not a backup file from this game.');
  }
  const pid = playerIdFrom(body.player);
  const data = backup.data as Record<string, unknown>;
  const statements = PLAYER_TABLES.map((table) => env.DB.prepare(`DELETE FROM ${table} WHERE player_id = ?`).bind(pid));
  for (const table of PLAYER_TABLES) {
    const rows = Array.isArray(data[table]) ? (data[table] as Record<string, unknown>[]) : [];
    const cols = COLUMNS[table];
    for (const row of rows) {
      const values = cols.map((col) => (col === 'player_id' ? pid : (row[col] ?? null)));
      statements.push(env.DB.prepare(`INSERT INTO ${table} (${cols.join(', ')}) VALUES (${cols.map(() => '?').join(', ')})`).bind(...values));
    }
  }
  await env.DB.batch(statements);
  await audit(env, 'import', { player: body.player });
}

const MEDIA_SLOTS = new Set(['honeymoon-photo', 'investigators', 'final-photo', 'final-recording']);
const MEDIA_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'audio/mpeg', 'audio/mp4', 'audio/x-m4a', 'audio/aac', 'video/mp4', 'video/quicktime']);
const MAX_MEDIA_BYTES = 60 * 1024 * 1024;

export async function uploadMedia(env: Env, request: Request): Promise<{ id: string }> {
  if (!env.MEDIA) throw new HttpError(503, 'no_storage', 'Private media storage (R2) is not configured for this environment.');
  const url = new URL(request.url);
  const slot = url.searchParams.get('slot') ?? '';
  if (!MEDIA_SLOTS.has(slot)) throw new HttpError(400, 'bad_slot', 'Unknown media slot.');
  const type = (request.headers.get('content-type') ?? '').split(';')[0]!.trim();
  if (!MEDIA_TYPES.has(type)) throw new HttpError(415, 'bad_type', 'Upload a JPEG, PNG, WebP, MP3, M4A or MP4 file.');
  const length = Number(request.headers.get('content-length') ?? '0');
  if (length > MAX_MEDIA_BYTES) throw new HttpError(413, 'too_large', 'That file is larger than 60 MB.');
  const body = await request.arrayBuffer();
  if (body.byteLength === 0 || body.byteLength > MAX_MEDIA_BYTES) throw new HttpError(413, 'too_large', 'That file is empty or larger than 60 MB.');
  const id = `m-${randomToken(12)}`;
  const key = `private/${slot}/${id}`;
  await env.MEDIA.put(key, body, { httpMetadata: { contentType: type } });
  const caption = (url.searchParams.get('caption') ?? '').slice(0, 300) || null;
  const order = Number(url.searchParams.get('order') ?? '0') || 0;
  await env.DB.prepare('INSERT INTO media_assets (id, slot, r2_key, content_type, size, caption, sort_order, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
    .bind(id, slot, key, type, body.byteLength, caption, order, new Date().toISOString()).run();
  await audit(env, 'media.upload', { id, slot, type, size: body.byteLength });
  return { id };
}

export async function deleteMedia(env: Env, id: string, body: Record<string, unknown>): Promise<void> {
  requireConfirm(body, 'DELETE');
  const row = await env.DB.prepare('SELECT r2_key FROM media_assets WHERE id = ?').bind(id).first<{ r2_key: string }>();
  if (!row) throw new HttpError(404, 'not_found', 'No such media.');
  if (env.MEDIA) await env.MEDIA.delete(row.r2_key);
  await env.DB.prepare('DELETE FROM media_assets WHERE id = ?').bind(id).run();
  await audit(env, 'media.delete', { id });
}
