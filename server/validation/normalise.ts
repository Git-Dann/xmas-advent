/**
 * Text normalisation for human answers.
 *
 * Rules (deliberately conservative):
 * - Unicode NFKC, then lower case.
 * - Curly and modifier apostrophes become a plain apostrophe, then apostrophes are dropped,
 *   so "Gulliver's" and "Gullivers" compare equal.
 * - "&" becomes "and".
 * - Any other punctuation becomes a space (so "Edge-Hill" equals "edge hill").
 * - Whitespace is collapsed and trimmed.
 *
 * Codes (lock combinations, years) never pass through this function. They are compared with
 * `normaliseCode`, which only trims surrounding whitespace and requires digits, so "0130" and
 * "130" can never be confused.
 */
export function normaliseText(input: string): string {
  return input
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[‘’‛ʼʻ`´′]/g, "'")
    .replace(/'/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Lock codes: trimmed, digits only. Returns null for anything that is not purely digits. */
export function normaliseCode(input: unknown): string | null {
  if (typeof input !== 'string') return null;
  const value = input.normalize('NFKC').trim();
  return /^\d+$/.test(value) ? value : null;
}

const MONTHS: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4, may: 5,
  jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/**
 * Parses a UK-style day and month from free text. Accepts "1 December", "1st December",
 * "December 1", "01/12", "1/12", "1-12", "1.12" and "01/12/2016". Day always comes first in
 * numeric forms (UK convention). Returns null when the text is ambiguous or invalid.
 */
export function parseDayMonth(input: string): { day: number; month: number } | null {
  const text = input.normalize('NFKC').toLowerCase().trim();
  const numeric = /^(\d{1,2})\s*[/.\-\s]\s*(\d{1,2})(?:\s*[/.\-\s]\s*(\d{2}|\d{4}))?$/.exec(text);
  if (numeric) {
    return validDayMonth(Number(numeric[1]), Number(numeric[2]));
  }
  const cleaned = text.replace(/,/g, ' ').replace(/\s+/g, ' ').replace(/\b(the|of)\b/g, '').trim();
  const dayFirst = /^(\d{1,2})(?:st|nd|rd|th)?\s+([a-z]+)(?:\s+\d{4})?$/.exec(cleaned.replace(/\s+/g, ' '));
  if (dayFirst) {
    const month = MONTHS[dayFirst[2] ?? ''];
    return month ? validDayMonth(Number(dayFirst[1]), month) : null;
  }
  const monthFirst = /^([a-z]+)\s+(\d{1,2})(?:st|nd|rd|th)?(?:\s+\d{4})?$/.exec(cleaned);
  if (monthFirst) {
    const month = MONTHS[monthFirst[1] ?? ''];
    return month ? validDayMonth(Number(monthFirst[2]), month) : null;
  }
  return null;
}

function validDayMonth(day: number, month: number): { day: number; month: number } | null {
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  if (month < 1 || month > 12 || day < 1) return null;
  const max = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month - 1] ?? 0;
  return day <= max ? { day, month } : null;
}
