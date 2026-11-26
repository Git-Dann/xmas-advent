import type { Env } from '../env';
import type { Matcher } from '../validation/matchers';
import { ANSWERS, FINAL_MESSAGE } from './answers';
import { DAYS, type DayContent } from './days';

/**
 * Merges code defaults with Dan's private overrides from D1. Overrides are loaded once per
 * request. Only whitelisted fields can be overridden, and shapes are checked before use.
 */
export interface ContentOverrides {
  days: Map<number, Partial<Pick<DayContent, 'title' | 'intro' | 'objective' | 'hints' | 'reveal' | 'scene'>>>;
  answers: Map<string, Matcher>;
  final: typeof FINAL_MESSAGE | null;
}

export async function loadOverrides(env: Env): Promise<ContentOverrides> {
  const result = await env.DB.prepare('SELECT key, value FROM content_overrides').all<{ key: string; value: string }>();
  const overrides: ContentOverrides = { days: new Map(), answers: new Map(), final: null };
  for (const row of result.results ?? []) {
    let value: unknown;
    try {
      value = JSON.parse(row.value);
    } catch {
      continue;
    }
    if (row.key.startsWith('day:')) {
      overrides.days.set(Number(row.key.slice(4)), value as never);
    } else if (row.key.startsWith('answer:')) {
      overrides.answers.set(row.key.slice(7), value as Matcher);
    } else if (row.key === 'final') {
      overrides.final = value as typeof FINAL_MESSAGE;
    }
  }
  return overrides;
}

export function dayContent(day: number, overrides: ContentOverrides): DayContent | undefined {
  const base = DAYS.find((entry) => entry.day === day);
  if (!base) return undefined;
  const patch = overrides.days.get(day);
  if (!patch) return base;
  const merged: DayContent = { ...base };
  if (typeof patch.title === 'string') merged.title = patch.title;
  if (isStringArray(patch.intro)) merged.intro = patch.intro;
  if (typeof patch.objective === 'string') merged.objective = patch.objective;
  if (isStringArray(patch.hints) && patch.hints.length === 3) merged.hints = patch.hints as [string, string, string];
  if (patch.reveal && typeof patch.reveal.title === 'string' && isStringArray(patch.reveal.body)) {
    merged.reveal = { ...base.reveal, title: patch.reveal.title, body: patch.reveal.body };
  }
  if (patch.scene && patch.scene.kind === base.scene.kind) merged.scene = patch.scene;
  return merged;
}

export function answerFor(day: number, stage: string, overrides: ContentOverrides): Matcher | undefined {
  return overrides.answers.get(`${day}:${stage}`) ?? ANSWERS[day]?.[stage];
}

export function finalMessage(overrides: ContentOverrides): typeof FINAL_MESSAGE {
  const value = overrides.final;
  if (value && typeof value.title === 'string' && isStringArray(value.letter) && typeof value.signature === 'string') {
    return { title: value.title, letter: value.letter, signature: value.signature, closing: typeof value.closing === 'string' ? value.closing : '' };
  }
  return FINAL_MESSAGE;
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === 'string');
}
