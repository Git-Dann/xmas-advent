import type {
  AttemptResponse, CalendarResponse, DayState, EvidenceDetail, EvidenceSummary, FinaleResponse,
  HintResponse, PuzzleResponse, RevealView, StageSpec, StageView,
} from '../shared/api';
import type { Player } from './auth';
import { dayDate, isDateEligible, londonDate, resolveNow } from './clock';
import { GENTLE_RESPONSES } from './content/answers';
import { CHAPTERS, DAYS, type DayContent } from './content/days';
import { EVIDENCE, TOOLS, actionsFor, getEvidence } from './content/evidence';
import { answerFor, dayContent, finalMessage, loadOverrides, type ContentOverrides } from './content/store';
import type { Env } from './env';
import { HttpError } from './http';
import { rateLimit } from './ratelimit';
import { countCorrectFields, matches } from './validation/matchers';

export const TOTAL_DAYS = 25;

export interface PlayerState {
  completed: Set<number>;
  inProgress: Set<number>;
  stages: Map<number, Set<string>>;
  evidence: Set<string>;
  rewards: Set<string>;
  hints: Map<number, number>;
}

export interface GameContext {
  env: Env;
  player: Player;
  now: number;
  today: string;
  overrides: ContentOverrides;
  state: PlayerState;
}

export async function createContext(env: Env, player: Player): Promise<GameContext> {
  const [now, overrides, state] = await Promise.all([resolveNow(env, player.kind), loadOverrides(env), loadState(env, player.id)]);
  return { env, player, now, today: londonDate(now), overrides, state };
}

export async function loadState(env: Env, playerId: string): Promise<PlayerState> {
  const [progress, stages, evidence, rewards, hints] = await env.DB.batch<Record<string, unknown>>([
    env.DB.prepare('SELECT day, status FROM puzzle_progress WHERE player_id = ?').bind(playerId),
    env.DB.prepare('SELECT day, stage FROM puzzle_stage_progress WHERE player_id = ?').bind(playerId),
    env.DB.prepare('SELECT evidence_id FROM player_evidence WHERE player_id = ?').bind(playerId),
    env.DB.prepare('SELECT reward_id FROM player_rewards WHERE player_id = ?').bind(playerId),
    env.DB.prepare('SELECT day, MAX(hint_index) AS revealed FROM hint_usage WHERE player_id = ? GROUP BY day').bind(playerId),
  ]);
  const state: PlayerState = {
    completed: new Set(), inProgress: new Set(), stages: new Map(), evidence: new Set(), rewards: new Set(), hints: new Map(),
  };
  for (const row of progress?.results ?? []) {
    const day = Number(row.day);
    if (row.status === 'complete') state.completed.add(day);
    else state.inProgress.add(day);
  }
  for (const row of stages?.results ?? []) {
    const day = Number(row.day);
    const set = state.stages.get(day) ?? new Set<string>();
    set.add(String(row.stage));
    state.stages.set(day, set);
  }
  for (const row of evidence?.results ?? []) state.evidence.add(String(row.evidence_id));
  for (const row of rewards?.results ?? []) state.rewards.add(String(row.reward_id));
  for (const row of hints?.results ?? []) state.hints.set(Number(row.day), Number(row.revealed));
  return state;
}

/** The single source of truth for whether a day can be played. */
export function dayState(day: number, state: PlayerState, today: string): DayState {
  if (state.completed.has(day)) return 'complete';
  if (!isDateEligible(day, today)) return 'future';
  for (let earlier = 1; earlier < day; earlier++) {
    if (!state.completed.has(earlier)) return 'locked';
  }
  if (day === TOTAL_DAYS && !state.rewards.has('christmas-key')) return 'locked';
  return state.inProgress.has(day) ? 'in_progress' : 'available';
}

function isOpen(s: DayState): boolean {
  return s === 'available' || s === 'in_progress' || s === 'complete';
}

export function getCalendar(ctx: GameContext): CalendarResponse {
  const days = DAYS.map((def) => {
    const content = dayContent(def.day, ctx.overrides) ?? def;
    const s = dayState(def.day, ctx.state, ctx.today);
    return {
      day: def.day,
      date: dayDate(def.day),
      state: s,
      ...(isOpen(s) ? { title: content.title, chapter: content.chapter } : {}),
    };
  });
  return {
    today: ctx.today,
    days,
    chapterSeals: {
      star: ctx.state.evidence.has('star-seal'),
      moon: ctx.state.evidence.has('moon-seal'),
      home: ctx.state.evidence.has('home-seal'),
      heart: ctx.state.evidence.has('heart-seal'),
    },
    hasChristmasKey: ctx.state.rewards.has('christmas-key'),
    completedCount: ctx.state.completed.size,
  };
}

function requireDay(day: number): void {
  if (!Number.isInteger(day) || day < 1 || day > TOTAL_DAYS) throw new HttpError(404, 'no_such_day', 'There is no such door.');
}

function notAvailable(s: DayState): HttpError {
  if (s === 'future') return new HttpError(403, 'not_yet', 'This door has not opened yet.');
  return new HttpError(403, 'locked', 'Finish the earlier doors first. They open in order.');
}

/** Opens a day for the player: marks it in progress and grants any on-open tools. Idempotent. */
async function openDay(ctx: GameContext, def: DayContent): Promise<void> {
  const nowIso = new Date(ctx.now).toISOString();
  const statements = [
    ctx.env.DB.prepare("INSERT OR IGNORE INTO puzzle_progress (player_id, day, status, started_at) VALUES (?, ?, 'in_progress', ?)")
      .bind(ctx.player.id, def.day, nowIso),
  ];
  for (const reward of def.grantsOnOpen ?? []) {
    statements.push(
      ctx.env.DB.prepare('INSERT OR IGNORE INTO player_rewards (player_id, reward_id, source_day, awarded_at) VALUES (?, ?, ?, ?)')
        .bind(ctx.player.id, reward, def.day, nowIso),
    );
    ctx.state.rewards.add(reward);
  }
  await ctx.env.DB.batch(statements);
  ctx.state.inProgress.add(def.day);
}

export function summarise(id: string): EvidenceSummary | null {
  const def = getEvidence(id);
  if (!def) return null;
  return { id: def.id, title: def.title, kind: def.kind, day: def.day, ...(def.glyph ? { glyph: def.glyph } : {}) };
}

async function mediaForSlot(env: Env, slot: string): Promise<{ id: string; content_type: string; caption: string | null }[]> {
  const rows = await env.DB.prepare('SELECT id, content_type, caption FROM media_assets WHERE slot = ? ORDER BY sort_order, created_at')
    .bind(slot).all<{ id: string; content_type: string; caption: string | null }>();
  return rows.results ?? [];
}

/** Fills stage specs that depend on the scene or on what the player owns. */
async function buildStages(ctx: GameContext, def: DayContent): Promise<StageView[]> {
  const done = ctx.state.stages.get(def.day) ?? new Set<string>();
  let activeAssigned = false;
  return def.stages.map((stage) => {
    let spec: StageSpec = stage;
    if (stage.kind === 'choice' && stage.layout === 'scene' && def.scene.kind === 'woodland') {
      spec = { ...stage, options: def.scene.objects.map((o) => ({ id: o.id, label: o.label, description: o.description, image: o.image })) };
    }
    if (stage.kind === 'placement' && stage.source === 'evidence') {
      const order = ['heart-seal', 'star-seal', 'home-seal', 'moon-seal'];
      spec = {
        ...stage,
        pieces: order.filter((id) => ctx.state.evidence.has(id)).map((id) => {
          const s = summarise(id)!;
          return { id, label: s.title, glyph: s.glyph };
        }),
      };
    }
    const complete = done.has(stage.id) || ctx.state.completed.has(def.day);
    const active = !complete && !activeAssigned;
    if (active) activeAssigned = true;
    return { spec, complete, active };
  });
}

function buildReveal(ctx: GameContext, def: DayContent): RevealView {
  const rewards = def.rewards.map(summarise).filter((s): s is EvidenceSummary => s !== null);
  const view: RevealView = { title: def.reveal.title, body: def.reveal.body, rewards };
  const chapter = CHAPTERS[def.chapter];
  if (chapter && chapter.days[1] === def.day && def.day < TOTAL_DAYS) {
    const seal = def.day === 24 ? 'key' : (chapter.seal ?? 'star');
    view.chapterComplete = { chapter: def.chapter, title: chapter.title, seal };
  }
  if (def.day === TOTAL_DAYS) {
    const final = finalMessage(ctx.overrides);
    view.title = final.title;
    view.body = [...final.letter, final.signature, final.closing].filter(Boolean);
  }
  return view;
}

export async function getPuzzle(ctx: GameContext, day: number): Promise<PuzzleResponse> {
  requireDay(day);
  const s = dayState(day, ctx.state, ctx.today);
  if (!isOpen(s)) throw notAvailable(s);
  const def = dayContent(day, ctx.overrides)!;
  if (s === 'available') await openDay(ctx, def);
  const revealedHints = ctx.state.hints.get(day) ?? 0;
  let scene = def.scene;
  if (scene.kind === 'media') {
    const media = await mediaForSlot(ctx.env, scene.slot);
    const first = media[0];
    if (first) {
      scene = { ...scene, mediaUrl: `/api/media/${first.id}`, mediaType: first.content_type.startsWith('video') ? 'video' : 'audio', isRecording: true };
    }
  }
  const response: PuzzleResponse = {
    day,
    date: dayDate(day),
    title: def.title,
    chapter: def.chapter,
    chapterTitle: CHAPTERS[def.chapter]?.title ?? '',
    state: dayState(day, ctx.state, ctx.today),
    intro: def.intro,
    objective: def.objective,
    scene,
    stages: await buildStages(ctx, def),
    hints: def.hints.slice(0, revealedHints).map((text, index) => ({ index: index + 1, text })),
    hintsAvailable: def.hints.length,
    requiredEvidence: def.requiresEvidence.filter((id) => ctx.state.evidence.has(id)).map(summarise).filter((x): x is EvidenceSummary => x !== null),
  };
  if (s === 'complete') response.reveal = buildReveal(ctx, def);
  return response;
}

export async function revealHint(ctx: GameContext, day: number): Promise<HintResponse> {
  requireDay(day);
  const s = dayState(day, ctx.state, ctx.today);
  if (!isOpen(s)) throw notAvailable(s);
  const def = dayContent(day, ctx.overrides)!;
  const current = ctx.state.hints.get(day) ?? 0;
  const next = Math.min(current + 1, def.hints.length);
  if (next > current) {
    await ctx.env.DB.prepare('INSERT OR IGNORE INTO hint_usage (player_id, day, hint_index, revealed_at) VALUES (?, ?, ?, ?)')
      .bind(ctx.player.id, day, next, new Date(ctx.now).toISOString()).run();
    ctx.state.hints.set(day, next);
  }
  return {
    hints: def.hints.slice(0, next).map((text, index) => ({ index: index + 1, text })),
    hintsAvailable: def.hints.length,
  };
}

function gentle(day: number, attemptsSoFar: number): string {
  return GENTLE_RESPONSES[(day + attemptsSoFar) % GENTLE_RESPONSES.length] ?? 'Not quite.';
}

export async function attempt(ctx: GameContext, day: number, stageId: unknown, answer: unknown): Promise<AttemptResponse> {
  requireDay(day);
  if (typeof stageId !== 'string') throw new HttpError(400, 'bad_stage', 'Missing stage.');
  const s = dayState(day, ctx.state, ctx.today);
  if (!isOpen(s)) throw notAvailable(s);
  const def = dayContent(day, ctx.overrides)!;
  const stageIndex = def.stages.findIndex((stage) => stage.id === stageId);
  if (stageIndex < 0) throw new HttpError(400, 'bad_stage', 'That part of the puzzle does not exist.');

  await rateLimit(ctx.env, `attempt:${ctx.player.id}`, 60, 300);

  const missing = def.requiresEvidence.filter((id) => !ctx.state.evidence.has(id));
  if (missing.length > 0) {
    throw new HttpError(409, 'missing_evidence', 'Something this puzzle needs is missing from your Archive.');
  }
  if (day === TOTAL_DAYS && !ctx.state.rewards.has('christmas-key')) {
    throw new HttpError(403, 'locked', 'The vault needs the Christmas Key.');
  }

  const done = ctx.state.stages.get(day) ?? new Set<string>();
  const dayAlreadyComplete = ctx.state.completed.has(day);
  for (const earlier of def.stages.slice(0, stageIndex)) {
    if (!done.has(earlier.id) && !dayAlreadyComplete) {
      throw new HttpError(409, 'stage_order', 'Finish the earlier part of this puzzle first.');
    }
  }

  const matcher = answerFor(day, stageId, ctx.overrides);
  if (!matcher) throw new HttpError(500, 'no_answer', 'This puzzle is not configured correctly.');
  const matchCtx = { ownedEvidence: ctx.state.evidence };
  const correct = matches(matcher, answer, matchCtx);
  const nowIso = new Date(ctx.now).toISOString();
  const submitted = JSON.stringify(answer ?? null).slice(0, 500);

  if (!correct) {
    const countRow = await ctx.env.DB.prepare('SELECT COUNT(*) AS n FROM attempts WHERE player_id = ? AND day = ?')
      .bind(ctx.player.id, day).first<{ n: number }>();
    await ctx.env.DB.prepare('INSERT INTO attempts (player_id, day, stage, correct, submitted, created_at) VALUES (?, ?, ?, 0, ?, ?)')
      .bind(ctx.player.id, day, stageId, submitted, nowIso).run();
    const partial = countCorrectFields(matcher, answer, matchCtx);
    const response: AttemptResponse = { correct: false, message: gentle(day, countRow?.n ?? 0) };
    if (partial && partial.correct > 0 && partial.total > 1) response.partial = partial;
    return response;
  }

  const db = ctx.env.DB;
  const pid = ctx.player.id;
  const statements: D1PreparedStatement[] = [
    db.prepare('INSERT INTO attempts (player_id, day, stage, correct, submitted, created_at) VALUES (?, ?, ?, 1, ?, ?)').bind(pid, day, stageId, submitted, nowIso),
    db.prepare("INSERT OR IGNORE INTO puzzle_progress (player_id, day, status, started_at) VALUES (?, ?, 'in_progress', ?)").bind(pid, day, nowIso),
    db.prepare('INSERT OR IGNORE INTO puzzle_stage_progress (player_id, day, stage, completed_at) VALUES (?, ?, ?, ?)').bind(pid, day, stageId, nowIso),
  ];
  const stagesAfter = new Set(done);
  stagesAfter.add(stageId);
  const allStagesDone = def.stages.every((stage) => stagesAfter.has(stage.id));

  if (allStagesDone && !dayAlreadyComplete) {
    // Atomic completion. The UPDATE only succeeds if every earlier day is complete, and rewards
    // are only inserted if the completion row exists, all inside one D1 batch (a transaction).
    statements.push(
      db.prepare(
        `UPDATE puzzle_progress SET status = 'complete', completed_at = ?3
         WHERE player_id = ?1 AND day = ?2 AND status <> 'complete'
           AND (SELECT COUNT(*) FROM puzzle_progress WHERE player_id = ?1 AND day < ?2 AND status = 'complete') = ?2 - 1`,
      ).bind(pid, day, nowIso),
    );
    for (const evidenceId of def.rewards) {
      statements.push(
        db.prepare(
          `INSERT OR IGNORE INTO player_evidence (player_id, evidence_id, source_day, acquired_at)
           SELECT ?1, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM puzzle_progress WHERE player_id = ?1 AND day = ?3 AND status = 'complete')`,
        ).bind(pid, evidenceId, day, nowIso),
      );
    }
    for (const reward of def.entitlements ?? []) {
      statements.push(
        db.prepare(
          `INSERT OR IGNORE INTO player_rewards (player_id, reward_id, source_day, awarded_at)
           SELECT ?1, ?2, ?3, ?4 WHERE EXISTS (SELECT 1 FROM puzzle_progress WHERE player_id = ?1 AND day = ?3 AND status = 'complete')`,
        ).bind(pid, reward, day, nowIso),
      );
    }
  }
  await db.batch(statements);

  // Re-read authoritative state rather than trusting what we intended to write.
  ctx.state = await loadState(ctx.env, pid);
  const dayComplete = ctx.state.completed.has(day);
  const response: AttemptResponse = { correct: true, stageComplete: true, dayComplete };
  if (dayComplete) response.reveal = buildReveal(ctx, def);
  return response;
}

export function getArchive(ctx: GameContext) {
  const evidence = EVIDENCE.filter((def) => ctx.state.evidence.has(def.id))
    .map((def) => summarise(def.id)!)
    .sort((a, b) => a.day - b.day);
  const tools = [...ctx.state.rewards]
    .filter((id) => TOOLS[id])
    .map((id) => ({ id, ...TOOLS[id]! }));
  return { evidence, tools };
}

export async function getEvidenceDetail(ctx: GameContext, id: string): Promise<EvidenceDetail> {
  const def = getEvidence(id);
  if (!def || !ctx.state.evidence.has(id)) {
    throw new HttpError(404, 'not_found', 'That is not in your Archive.');
  }
  const layers = (def.layers ?? []).filter((layer) => {
    const r = layer.requires;
    if (r.entitlement && !ctx.state.rewards.has(r.entitlement)) return false;
    if (r.dayComplete && !ctx.state.completed.has(r.dayComplete)) return false;
    if (r.dayAvailable && !isOpen(dayState(r.dayAvailable, ctx.state, ctx.today))) return false;
    return true;
  }).map(({ id: layerId, label, face, lines }) => ({ id: layerId, label, face, lines }));

  let front = def.front;
  if (def.mediaSlot && slotUnlocked(ctx, def.mediaSlot)) {
    const media = await mediaForSlot(ctx.env, def.mediaSlot);
    const first = media[0];
    if (first) {
      const type = first.content_type.startsWith('image') ? 'image' : first.content_type.startsWith('video') ? 'video' : 'audio';
      front = { ...front, mediaUrl: `/api/media/${first.id}`, mediaType: type };
    }
  }
  const hasMedia = front.mediaType === 'audio' || front.mediaType === 'video';
  const summary = summarise(id)!;
  return {
    ...summary,
    description: def.description,
    front,
    ...(def.back ? { back: def.back } : {}),
    layers,
    actions: actionsFor(def, ctx.state.rewards.has('lamp'), hasMedia),
  };
}

/** Which day must be reached before a media slot can be served to the player. */
export function slotUnlocked(ctx: GameContext, slot: string): boolean {
  if (slot === 'honeymoon-photo') return ctx.state.completed.has(13);
  if (slot === 'investigators') return isOpen(dayState(20, ctx.state, ctx.today));
  if (slot.startsWith('final')) return ctx.state.completed.has(TOTAL_DAYS);
  return false;
}

export async function getFinale(ctx: GameContext): Promise<FinaleResponse> {
  if (!ctx.state.completed.has(TOTAL_DAYS)) return { unlocked: false };
  const final = finalMessage(ctx.overrides);
  const rows = await ctx.env.DB.prepare("SELECT id, content_type, caption FROM media_assets WHERE slot LIKE 'final%' ORDER BY sort_order, created_at")
    .all<{ id: string; content_type: string; caption: string | null }>();
  return {
    unlocked: true,
    title: final.title,
    letter: final.letter,
    signature: final.signature,
    closing: final.closing,
    media: (rows.results ?? []).map((row) => ({
      id: row.id,
      type: row.content_type.startsWith('image') ? 'image' : row.content_type.startsWith('video') ? 'video' : 'audio',
      url: `/api/media/${row.id}`,
      ...(row.caption ? { caption: row.caption } : {}),
    })),
  };
}

export async function unlockFinale(ctx: GameContext): Promise<AttemptResponse> {
  return attempt(ctx, TOTAL_DAYS, 'unlock', { evidence: 'christmas-key' });
}
