import { writeSetting } from '../../server/clock';
import type { Env } from '../../server/env';
import { handle } from '../../server/router';
import { TestD1 } from './d1';

export const INVITE = 'TEST-CODE-2026-KEY';
export const ORIGIN = 'https://key.test';

/** A small API client with separate cookie jars, driving the real router. */
export class Harness {
  env: Env;
  d1 = new TestD1();
  cookies = new Map<string, string>();

  constructor(overrides: Partial<Env> = {}) {
    this.env = {
      DB: this.d1 as unknown as D1Database,
      ENVIRONMENT: 'test',
      ALLOW_TEST_CLOCK: '1',
      ADMIN_PASSWORD: 'correct horse battery',
      INVITE_CODES: INVITE,
      ...overrides,
    };
  }

  async setClock(iso: string): Promise<void> {
    await writeSetting(this.env, 'test_clock', new Date(iso).toISOString());
  }

  async request(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Promise<{ status: number; json: any; headers: Headers }> {
    const cookie = [...this.cookies.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    const init: RequestInit = { method, headers: { ...(cookie ? { cookie } : {}), ...headers } };
    if (body !== undefined) {
      init.body = JSON.stringify(body);
      (init.headers as Record<string, string>)['content-type'] = 'application/json';
    }
    const res = await handle(new Request(`${ORIGIN}${path}`, init), this.env);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      const [pair] = setCookie.split(';');
      const [name, value] = pair!.split('=');
      if (value) this.cookies.set(name!, value);
      else this.cookies.delete(name!);
    }
    const text = await res.text();
    return { status: res.status, json: text ? JSON.parse(text) : null, headers: res.headers };
  }

  get(path: string) { return this.request('GET', path); }
  post(path: string, body: unknown = {}) { return this.request('POST', path, body); }

  async claim(code = INVITE) {
    return this.post('/api/auth/claim', { code });
  }
  async adminLogin() {
    return this.post('/api/admin/login', { password: 'correct horse battery' });
  }
  async attempt(day: number, stage: string, answer: unknown) {
    return this.post(`/api/puzzles/${day}/attempt`, { stage, answer });
  }
}

/** The submissions a player would make to solve each day, in stage order. Test-only. */
export const SOLUTIONS: Record<number, [string, unknown][]> = {
  1: [['place', 'Edge Hill']],
  2: [['year', '2010']],
  3: [['pieces', { left: 'tp-k2', centre: 'tp-m7', right: 'tp-x4' }], ['film', "Gulliver's Island"]],
  4: [['years', { her: '1991', his: '1986' }]],
  5: [['activity', 'talking']],
  6: [['combination', '9186']],
  7: [['place', 'Formby']],
  8: [['creature', 'w-s9']],
  9: [['phrase', ['TWO', 'PEOPLE', 'ONE', 'PROMISE']]],
  10: [['title', ['Little', 'Things']], ['artist', 'a-7q']],
  11: [['dish', 'm-c4']],
  12: [['combination', '2510']],
  13: [['trip', { destination: 'd-8f', attraction: 'x-4u' }]],
  14: [['street', 'Foxglove Way']],
  15: [['correction', { field: 'f-c', value: '2010' }]],
  16: [['sort', { 'o-4r': 'bin-a', 'o-6c': 'bin-a', 'o-2k': 'bin-a', 'o-8w': 'bin-a', 'o-7f': 'bin-b', 'o-1m': 'bin-b', 'o-9d': 'bin-b', 'o-3x': 'bin-b' }]],
  17: [['conclusion', { who: 'w-3d', what: 'v-4c', object: 'b-1d' }]],
  18: [['slots', { street: { evidence: 'address-label' }, colour: { evidence: 'maroon-ornament' }, year: { evidence: 'dated-record' } }]],
  19: [['birthday', { day: 1, month: 12 }]],
  20: [['match', { 'slot-o': 'inv-a', 'slot-g': 'inv-b' }]],
  21: [['birthday', { day: 30, month: 9 }]],
  22: [['phrase', ['Elephant', 'Juice']]],
  23: [['board', ['note-bub', 'note-chunky', 'wedding-song-record', 'incident-report', 'university-record']], ['name', 'Dan']],
  24: [['combination', '0130'], ['seals', { 'pos-n': 'star-seal', 'pos-e': 'moon-seal', 'pos-s': 'home-seal', 'pos-w': 'heart-seal' }]],
  25: [['unlock', { evidence: 'christmas-key' }]],
};

/** Solves days 1..last on the given London date, opening each day first as a player would. */
export async function solveThrough(h: Harness, last: number): Promise<void> {
  for (let day = 1; day <= last; day++) {
    const open = await h.get(`/api/puzzles/${day}`);
    if (open.status !== 200) throw new Error(`Day ${day} could not be opened: ${JSON.stringify(open.json)}`);
    for (const [stage, answer] of SOLUTIONS[day]!) {
      const res = await h.attempt(day, stage, answer);
      if (res.status !== 200 || !res.json.correct) throw new Error(`Day ${day} stage ${stage} failed: ${JSON.stringify(res.json)}`);
    }
  }
}
