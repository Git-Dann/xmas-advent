import { normaliseCode, normaliseText, parseDayMonth } from './normalise';

/**
 * Declarative answer matchers. These live only on the server. Nothing in this module, nor any
 * matcher configuration, is ever serialised into a player-facing response.
 */
export type Matcher =
  /** Free text compared after normalisation against an explicit alias list. No fuzzy matching. */
  | { type: 'text'; accept: string[] }
  /** Exact digit string, such as a lock combination or year. Leading zeros matter. */
  | { type: 'code'; value: string }
  /** Opaque option id chosen from a list. */
  | { type: 'choice'; value: string }
  /** Ordered sequence of option ids or words. Words are compared with text normalisation. */
  | { type: 'sequence'; items: string[]; compare?: 'id' | 'text' }
  /** Unordered set of option ids. Must match exactly: no missing and no extra items. */
  | { type: 'set'; items: string[] }
  /** Every key must map to exactly the given value, with no extra keys. */
  | { type: 'mapping'; map: Record<string, string> }
  /** Day and month, either as { day, month } or as free text such as "1 December" or "01/12". */
  | { type: 'date'; day: number; month: number }
  /** Several required answers in one submission. Every field must match. */
  | { type: 'fields'; fields: Record<string, Matcher> }
  /** Accepts any one of several matchers (for example, a chosen option id or typed text). */
  | { type: 'any'; of: Matcher[] }
  /** Accepts an evidence id (ownership checked by the caller) or a typed value. */
  | { type: 'evidenceOrText'; evidence: string[]; text: Matcher }
  /** Requires the player to present an evidence item they own (for example the Christmas Key). */
  | { type: 'evidence'; id: string };

export interface MatchContext {
  /** Evidence ids the player currently owns. */
  ownedEvidence: ReadonlySet<string>;
}

export function matches(matcher: Matcher, answer: unknown, ctx: MatchContext): boolean {
  switch (matcher.type) {
    case 'text': {
      if (typeof answer !== 'string') return false;
      const value = normaliseText(answer);
      if (!value) return false;
      return matcher.accept.some((alias) => normaliseText(alias) === value);
    }
    case 'code': {
      const value = normaliseCode(answer);
      return value !== null && value === matcher.value;
    }
    case 'choice':
      return typeof answer === 'string' && answer === matcher.value;
    case 'sequence': {
      if (!Array.isArray(answer) || answer.length !== matcher.items.length) return false;
      return matcher.items.every((expected, index) => {
        const given = answer[index];
        if (typeof given !== 'string') return false;
        return matcher.compare === 'text' ? normaliseText(given) === normaliseText(expected) : given === expected;
      });
    }
    case 'set': {
      if (!Array.isArray(answer)) return false;
      if (!answer.every((item): item is string => typeof item === 'string')) return false;
      const given = new Set(answer);
      if (given.size !== answer.length) return false;
      const expected = new Set(matcher.items);
      if (given.size !== expected.size) return false;
      for (const item of expected) if (!given.has(item)) return false;
      return true;
    }
    case 'mapping': {
      if (!isRecord(answer)) return false;
      const expectedKeys = Object.keys(matcher.map);
      const givenKeys = Object.keys(answer);
      if (givenKeys.length !== expectedKeys.length) return false;
      return expectedKeys.every((key) => answer[key] === matcher.map[key]);
    }
    case 'date': {
      if (typeof answer === 'string') {
        const parsed = parseDayMonth(answer);
        return parsed !== null && parsed.day === matcher.day && parsed.month === matcher.month;
      }
      if (!isRecord(answer)) return false;
      const day = toInt(answer.day);
      const month = toInt(answer.month);
      return day === matcher.day && month === matcher.month;
    }
    case 'fields': {
      if (!isRecord(answer)) return false;
      return Object.entries(matcher.fields).every(([key, sub]) => matches(sub, answer[key], ctx));
    }
    case 'any':
      return matcher.of.some((sub) => matches(sub, answer, ctx));
    case 'evidence':
      return isRecord(answer) && answer.evidence === matcher.id && ctx.ownedEvidence.has(matcher.id);
    case 'evidenceOrText': {
      if (isRecord(answer) && typeof answer.evidence === 'string') {
        return matcher.evidence.includes(answer.evidence) && ctx.ownedEvidence.has(answer.evidence);
      }
      if (isRecord(answer) && typeof answer.text === 'string') {
        return matches(matcher.text, answer.text, ctx);
      }
      return typeof answer === 'string' && matches(matcher.text, answer, ctx);
    }
  }
}

/**
 * Field-level results for structured answers. Used only to tell the player how many parts are
 * right (for example "one of the two years is right"), never which value is correct.
 */
export function countCorrectFields(matcher: Matcher, answer: unknown, ctx: MatchContext): { correct: number; total: number } | null {
  if (matcher.type !== 'fields' || !isRecord(answer)) return null;
  const entries = Object.entries(matcher.fields);
  const correct = entries.filter(([key, sub]) => matches(sub, answer[key], ctx)).length;
  return { correct, total: entries.length };
}

function toInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value)) return value;
  if (typeof value === 'string' && /^\d{1,2}$/.test(value.trim())) return Number(value.trim());
  return null;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/** Structural validation for matchers submitted from the admin editor. */
export function isValidMatcher(value: unknown, depth = 0): value is Matcher {
  if (depth > 4 || !isRecord(value) || typeof value.type !== 'string') return false;
  const strings = (v: unknown) => Array.isArray(v) && v.length > 0 && v.every((s) => typeof s === 'string' && s.length > 0 && s.length < 200);
  switch (value.type) {
    case 'text': return strings(value.accept);
    case 'code': return typeof value.value === 'string' && /^\d{1,12}$/.test(value.value);
    case 'choice': return typeof value.value === 'string' && value.value.length > 0;
    case 'sequence': return strings(value.items) && (value.compare === undefined || value.compare === 'id' || value.compare === 'text');
    case 'set': return strings(value.items);
    case 'mapping': return isRecord(value.map) && Object.values(value.map).every((v) => typeof v === 'string');
    case 'date': return Number.isInteger(value.day) && Number.isInteger(value.month);
    case 'fields': return isRecord(value.fields) && Object.values(value.fields).every((m) => isValidMatcher(m, depth + 1));
    case 'any': return Array.isArray(value.of) && value.of.length > 0 && value.of.every((m) => isValidMatcher(m, depth + 1));
    case 'evidence': return typeof value.id === 'string' && value.id.length > 0;
    case 'evidenceOrText': return strings(value.evidence) && isValidMatcher(value.text, depth + 1);
    default: return false;
  }
}
