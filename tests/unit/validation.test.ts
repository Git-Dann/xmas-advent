import { describe, expect, it } from 'vitest';
import { ANSWERS } from '../../server/content/answers';
import { isValidMatcher, matches, type Matcher } from '../../server/validation/matchers';
import { normaliseCode, normaliseText, parseDayMonth } from '../../server/validation/normalise';

const ctx = { ownedEvidence: new Set<string>(['address-label', 'maroon-ornament', 'dated-record', 'christmas-key']) };
const m = (day: number, stage: string): Matcher => ANSWERS[day]![stage]!;

describe('normaliseText', () => {
  it('trims, collapses whitespace and lowercases', () => {
    expect(normaliseText('   Edge    Hill  ')).toBe('edge hill');
  });
  it('treats curly and straight apostrophes the same and drops them', () => {
    expect(normaliseText('Gulliver’s Island')).toBe(normaliseText("Gulliver's Island"));
    expect(normaliseText("Gulliver's Island")).toBe('gullivers island');
  });
  it('applies Unicode normalisation', () => {
    expect(normaliseText('Ｆｏｒｍｂｙ')).toBe('formby');
    expect(normaliseText('Café')).toBe(normaliseText('Café'));
  });
  it('ignores non-meaningful punctuation', () => {
    expect(normaliseText('Elephant-Juice!')).toBe('elephant juice');
    expect(normaliseText('Edge-Hill.')).toBe('edge hill');
  });
});

describe('normaliseCode', () => {
  it('keeps leading zeros and rejects non-digits', () => {
    expect(normaliseCode(' 0130 ')).toBe('0130');
    expect(normaliseCode('130')).toBe('130');
    expect(normaliseCode('01 30')).toBeNull();
    expect(normaliseCode(130 as unknown as string)).toBeNull();
  });
});

describe('parseDayMonth', () => {
  it.each([
    ['1 December', 1, 12], ['1st December', 1, 12], ['December 1', 12 && 1, 12], ['01/12', 1, 12], ['1/12', 1, 12],
    ['01/12/2016', 1, 12], ['1.12', 1, 12], ['30 September', 30, 9], ['30/09', 30, 9], ['30th of September', 30, 9], ['Sept 30', 30, 9],
  ])('parses %s', (text, day, month) => {
    expect(parseDayMonth(text)).toEqual({ day, month });
  });
  it('rejects impossible dates', () => {
    expect(parseDayMonth('31/09')).toBeNull();
    expect(parseDayMonth('12/31')).toBeNull();
    expect(parseDayMonth('banana')).toBeNull();
  });
});

describe('the three combinations', () => {
  it('9186 opens the first lock and swapped digits do not', () => {
    expect(matches(m(6, 'combination'), '9186', ctx)).toBe(true);
    expect(matches(m(6, 'combination'), '8691', ctx)).toBe(false);
    expect(matches(m(6, 'combination'), 9186, ctx)).toBe(false);
  });
  it('2510 opens the wedding lock; 1025 does not', () => {
    expect(matches(m(12, 'combination'), '2510', ctx)).toBe(true);
    expect(matches(m(12, 'combination'), '1025', ctx)).toBe(false);
  });
  it('0130 is correct; 130 and 3001 are not', () => {
    expect(matches(m(24, 'combination'), '0130', ctx)).toBe(true);
    expect(matches(m(24, 'combination'), '130', ctx)).toBe(false);
    expect(matches(m(24, 'combination'), '3001', ctx)).toBe(false);
    expect(matches(m(24, 'combination'), ' 0130', ctx)).toBe(true);
  });
});

describe('per-day answers', () => {
  it('day 1 accepts the configured aliases only', () => {
    for (const ok of ['Edge Hill', 'edgehill', 'EDGE HILL UNIVERSITY', '  edge   hill ']) expect(matches(m(1, 'place'), ok, ctx)).toBe(true);
    for (const bad of ['Hill', 'Edge', 'Liverpool', '']) expect(matches(m(1, 'place'), bad, ctx)).toBe(false);
  });
  it('day 2 year must be exact', () => {
    expect(matches(m(2, 'year'), '2010', ctx)).toBe(true);
    expect(matches(m(2, 'year'), '2011', ctx)).toBe(false);
    expect(matches(m(2, 'year'), '10', ctx)).toBe(false);
  });
  it('day 3 ticket placement and film aliases', () => {
    expect(matches(m(3, 'pieces'), { left: 'tp-k2', centre: 'tp-m7', right: 'tp-x4' }, ctx)).toBe(true);
    expect(matches(m(3, 'pieces'), { left: 'tp-m7', centre: 'tp-k2', right: 'tp-x4' }, ctx)).toBe(false);
    expect(matches(m(3, 'pieces'), { left: 'tp-k2', centre: 'tp-m7', right: 'tp-x4', extra: 'x' }, ctx)).toBe(false);
    for (const ok of ["Gulliver's Island", 'Gullivers Island', 'gulliver’s travels', 'Gullivers Travels', 'Gulliver']) expect(matches(m(3, 'film'), ok, ctx)).toBe(true);
    expect(matches(m(3, 'film'), 'Gulliver Travels Island', ctx)).toBe(false);
  });
  it('day 4 years are structured and not swappable', () => {
    expect(matches(m(4, 'years'), { her: '1991', his: '1986' }, ctx)).toBe(true);
    expect(matches(m(4, 'years'), { her: '1986', his: '1991' }, ctx)).toBe(false);
  });
  it('day 5 explicit aliases, no fuzzy matching', () => {
    for (const ok of ['Talking', 'chatting', 'Texting', 'talking all night', 'Staying up talking', 'talking to each other']) expect(matches(m(5, 'activity'), ok, ctx)).toBe(true);
    for (const bad of ['sleeping', 'walking', 'talkingg']) expect(matches(m(5, 'activity'), bad, ctx)).toBe(false);
  });
  it('day 7 Formby variants', () => {
    for (const ok of ['Formby', 'formby beach', 'Formby Point']) expect(matches(m(7, 'place'), ok, ctx)).toBe(true);
    expect(matches(m(7, 'place'), 'Southport', ctx)).toBe(false);
  });
  it('day 9 phrase in order', () => {
    expect(matches(m(9, 'phrase'), ['TWO', 'PEOPLE', 'ONE', 'PROMISE'], ctx)).toBe(true);
    expect(matches(m(9, 'phrase'), ['ONE', 'PEOPLE', 'TWO', 'PROMISE'], ctx)).toBe(false);
  });
  it('day 10 title and artist aliases including 1D', () => {
    expect(matches(m(10, 'title'), ['Little', 'Things'], ctx)).toBe(true);
    expect(matches(m(10, 'title'), ['Things', 'Little'], ctx)).toBe(false);
    for (const ok of ['a-7q', 'One Direction', '1D', 'one direction']) expect(matches(m(10, 'artist'), ok, ctx)).toBe(true);
    for (const bad of ['a-4n', 'Take That', 'Direction']) expect(matches(m(10, 'artist'), bad, ctx)).toBe(false);
  });
  it('day 13 accepts option ids or text variants', () => {
    expect(matches(m(13, 'trip'), { destination: 'd-8f', attraction: 'x-4u' }, ctx)).toBe(true);
    expect(matches(m(13, 'trip'), { destination: 'Florida', attraction: 'Universal Orlando' }, ctx)).toBe(true);
    expect(matches(m(13, 'trip'), { destination: 'd-1r', attraction: 'x-4u' }, ctx)).toBe(false);
  });
  it('day 14 Foxglove Way', () => {
    expect(matches(m(14, 'street'), 'foxglove way', ctx)).toBe(true);
    expect(matches(m(14, 'street'), 'Foxglove', ctx)).toBe(true);
    expect(matches(m(14, 'street'), 'Bluebell Way', ctx)).toBe(false);
  });
  it('day 15 needs the right field and the original year', () => {
    expect(matches(m(15, 'correction'), { field: 'f-c', value: '2010' }, ctx)).toBe(true);
    expect(matches(m(15, 'correction'), { field: 'f-c', value: '2012' }, ctx)).toBe(false);
    expect(matches(m(15, 'correction'), { field: 'f-a', value: '2010' }, ctx)).toBe(false);
  });
  it('day 16 validates the full mapping', () => {
    const good = { 'o-4r': 'bin-a', 'o-6c': 'bin-a', 'o-2k': 'bin-a', 'o-8w': 'bin-a', 'o-7f': 'bin-b', 'o-1m': 'bin-b', 'o-9d': 'bin-b', 'o-3x': 'bin-b' };
    expect(matches(m(16, 'sort'), good, ctx)).toBe(true);
    expect(matches(m(16, 'sort'), { ...good, 'o-7f': 'bin-a' }, ctx)).toBe(false);
    const { 'o-3x': _, ...missing } = good;
    expect(matches(m(16, 'sort'), missing, ctx)).toBe(false);
  });
  it('day 17 accepts the sentence or configured phrases', () => {
    expect(matches(m(17, 'conclusion'), { who: 'w-3d', what: 'v-4c', object: 'b-1d' }, ctx)).toBe(true);
    for (const ok of ['Dan crashed into the porch door', 'crashed into the porch', 'hit the porch door']) expect(matches(m(17, 'conclusion'), ok, ctx)).toBe(true);
    expect(matches(m(17, 'conclusion'), { who: 'w-7p', what: 'v-4c', object: 'b-1d' }, ctx)).toBe(false);
    expect(matches(m(17, 'conclusion'), 'Dan painted the porch door', ctx)).toBe(false);
  });
  it('day 18 accepts owned evidence or typed values', () => {
    const viaEvidence = { street: { evidence: 'address-label' }, colour: { evidence: 'maroon-ornament' }, year: { evidence: 'dated-record' } };
    expect(matches(m(18, 'slots'), viaEvidence, ctx)).toBe(true);
    expect(matches(m(18, 'slots'), { street: { text: 'Foxglove Way' }, colour: { text: 'maroon' }, year: { text: '2010' } }, ctx)).toBe(true);
    expect(matches(m(18, 'slots'), viaEvidence, { ownedEvidence: new Set(['address-label']) })).toBe(false);
    expect(matches(m(18, 'slots'), { ...viaEvidence, colour: { evidence: 'address-label' } }, ctx)).toBe(false);
  });
  it('days 19 and 21 accept structured and text dates', () => {
    for (const ok of [{ day: 1, month: 12 }, { day: '01', month: '12' }, '01/12', '1/12', '1 December']) expect(matches(m(19, 'birthday'), ok, ctx)).toBe(true);
    for (const bad of [{ day: 12, month: 1 }, '12/01', '2 December']) expect(matches(m(19, 'birthday'), bad, ctx)).toBe(false);
    for (const ok of [{ day: 30, month: 9 }, '30/09', '30 September']) expect(matches(m(21, 'birthday'), ok, ctx)).toBe(true);
    expect(matches(m(21, 'birthday'), '09/30', ctx)).toBe(false);
  });
  it('day 22 phrase variants', () => {
    for (const ok of [['Elephant', 'Juice'], 'elephant juice', 'Elephant-Juice!', 'ELEPHANT  JUICE']) expect(matches(m(22, 'phrase'), ok, ctx)).toBe(true);
    expect(matches(m(22, 'phrase'), ['Juice', 'Elephant'], ctx)).toBe(false);
  });
  it('day 23 board set and Curator aliases', () => {
    expect(matches(m(23, 'board'), ['university-record', 'note-bub', 'note-chunky', 'incident-report', 'wedding-song-record'], ctx)).toBe(true);
    expect(matches(m(23, 'board'), ['note-bub', 'note-chunky', 'wedding-song-record', 'incident-report', 'university-record', 'maroon-ornament'], ctx)).toBe(false);
    expect(matches(m(23, 'board'), ['note-bub', 'note-bub', 'note-chunky', 'wedding-song-record', 'incident-report'], ctx)).toBe(false);
    for (const ok of ['Dan', 'daniel', 'Dan Lindsay', 'Daniel Lindsay', 'my husband']) expect(matches(m(23, 'name'), ok, ctx)).toBe(true);
    expect(matches(m(23, 'name'), 'Oliver', ctx)).toBe(false);
  });
  it('day 24 seals must all be placed correctly', () => {
    expect(matches(m(24, 'seals'), { 'pos-n': 'star-seal', 'pos-e': 'moon-seal', 'pos-s': 'home-seal', 'pos-w': 'heart-seal' }, ctx)).toBe(true);
    expect(matches(m(24, 'seals'), { 'pos-n': 'moon-seal', 'pos-e': 'star-seal', 'pos-s': 'home-seal', 'pos-w': 'heart-seal' }, ctx)).toBe(false);
  });
});

describe('isValidMatcher', () => {
  it('accepts every built-in answer', () => {
    for (const stages of Object.values(ANSWERS)) for (const matcher of Object.values(stages)) expect(isValidMatcher(matcher)).toBe(true);
  });
  it('rejects malformed configurations', () => {
    expect(isValidMatcher({ type: 'text', accept: [] })).toBe(false);
    expect(isValidMatcher({ type: 'code', value: '12a4' })).toBe(false);
    expect(isValidMatcher({ type: 'llm' })).toBe(false);
  });
});
