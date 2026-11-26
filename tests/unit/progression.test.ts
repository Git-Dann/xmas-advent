import { describe, expect, it } from 'vitest';
import { londonDate } from '../../server/clock';
import { Harness, SOLUTIONS, solveThrough } from '../helpers/harness';

async function player(clock = '2026-12-01T09:00:00Z') {
  const h = new Harness();
  await h.setClock(clock);
  const claim = await h.claim();
  expect(claim.status).toBe(200);
  return h;
}

describe('authentication', () => {
  it('rejects protected requests without a session', async () => {
    const h = new Harness();
    for (const path of ['/api/calendar', '/api/puzzles/1', '/api/archive']) expect((await h.get(path)).status).toBe(401);
  });
  it('rejects an unknown invitation code', async () => {
    const h = new Harness();
    expect((await h.claim('NOPE-NOPE-NOPE')).status).toBe(401);
  });
  it('accepts the invitation code in any case and with spaces', async () => {
    const h = new Harness();
    expect((await h.claim(' test code 2026 key ')).status).toBe(200);
    expect((await h.get('/api/session')).json).toMatchObject({ authenticated: true });
  });
  it('sets Secure, HttpOnly, SameSite=Strict cookies in production', async () => {
    const h = new Harness({ ENVIRONMENT: 'production', INVITE_CODES: undefined, ALLOW_TEST_CLOCK: undefined });
    await h.adminLogin();
    const code = (await h.post('/api/admin/codes', { label: 'Chloe' })).json.code as string;
    const res = await new Harness().request('GET', '/api/session');
    expect(res.status).toBe(200);
    const fresh = h; fresh.cookies.clear();
    const claim = await fresh.claim(code);
    expect(claim.headers.get('set-cookie')).toMatch(/HttpOnly; SameSite=Strict; Max-Age=\d+; Secure/);
  });
  it('rejects cross-origin state-changing requests', async () => {
    const h = await player();
    const res = await h.request('POST', '/api/puzzles/1/attempt', { stage: 'place', answer: 'Edge Hill' }, { origin: 'https://evil.example' });
    expect(res.status).toBe(403);
  });
  it('a new device can recover with the same invitation code', async () => {
    const h = await player();
    await solveThrough(h, 1);
    const other = new Harness(); other.d1 = h.d1; other.env = h.env;
    await other.claim();
    expect((await other.get('/api/calendar')).json.completedCount).toBe(1);
  });
  it('all protected responses are private and uncached', async () => {
    const h = await player();
    const res = await h.get('/api/calendar');
    expect(res.headers.get('cache-control')).toBe('private, no-store');
    expect(res.headers.get('x-robots-tag')).toContain('noindex');
  });
});

describe('date and sequential gating', () => {
  it('Day 1 cannot be played on 30 November', async () => {
    const h = await player('2026-11-30T23:59:00Z');
    const res = await h.get('/api/puzzles/1');
    expect(res.status).toBe(403);
    expect(res.json.error).toBe('not_yet');
    expect(JSON.stringify(res.json)).not.toContain('Curator');
    expect((await h.attempt(1, 'place', 'Edge Hill')).status).toBe(403);
  });
  it('Day 1 becomes available at 00:00 UK time on 1 December', async () => {
    const h = await player('2026-12-01T00:00:00Z');
    expect((await h.get('/api/puzzles/1')).status).toBe(200);
  });
  it('uses Europe/London, not UTC or the device clock', () => {
    expect(londonDate(Date.parse('2026-11-30T23:59:59Z'))).toBe('2026-11-30');
    expect(londonDate(Date.parse('2026-12-01T00:00:00Z'))).toBe('2026-12-01');
    expect(londonDate(Date.parse('2026-06-30T23:30:00Z'))).toBe('2026-07-01'); // BST
  });
  it('Day 2 cannot be played if Day 1 is incomplete', async () => {
    const h = await player('2026-12-02T10:00:00Z');
    const res = await h.get('/api/puzzles/2');
    expect(res.status).toBe(403);
    expect(res.json.error).toBe('locked');
  });
  it('Day 2 cannot be played on 1 December even if Day 1 is complete', async () => {
    const h = await player('2026-12-01T10:00:00Z');
    await solveThrough(h, 1);
    expect((await h.get('/api/puzzles/2')).json.error).toBe('not_yet');
  });
  it('completing Day 1 on 5 December permits Day 2 (catch-up in order)', async () => {
    const h = await player('2026-12-05T10:00:00Z');
    const cal = (await h.get('/api/calendar')).json;
    expect(cal.days[0].state).toBe('available');
    expect(cal.days[1].state).toBe('locked');
    expect(cal.days[5].state).toBe('future');
    await solveThrough(h, 1);
    expect((await h.get('/api/puzzles/2')).status).toBe(200);
  });
  it('the browser clock is irrelevant: only server time decides', async () => {
    const h = await player('2026-12-01T10:00:00Z');
    const res = await h.request('GET', '/api/puzzles/3', undefined, { date: 'Fri, 25 Dec 2026 10:00:00 GMT', 'x-client-time': '2026-12-25' });
    expect(res.status).toBe(403);
  });
  it('a future puzzle returns no private content', async () => {
    const h = await player('2026-12-01T10:00:00Z');
    for (const day of [2, 6, 12, 24, 25]) {
      const res = await h.get(`/api/puzzles/${day}`);
      expect(res.status).toBe(403);
      expect(Object.keys(res.json).sort()).toEqual(['error', 'message']);
    }
    const cal = (await h.get('/api/calendar')).json;
    for (const d of cal.days.slice(1)) expect(d.title).toBeUndefined();
  });
  it('rejects nonsense day numbers', async () => {
    const h = await player();
    expect((await h.get('/api/puzzles/0')).status).toBe(404);
    expect((await h.get('/api/puzzles/26')).status).toBe(404);
  });
});

describe('answers and rewards', () => {
  it('an incorrect answer returns a gentle response without the answer', async () => {
    const h = await player();
    await h.get('/api/puzzles/1');
    const res = await h.attempt(1, 'place', 'Liverpool');
    expect(res.json.correct).toBe(false);
    expect(res.json.message).toBeTruthy();
    expect(JSON.stringify(res.json).toLowerCase()).not.toContain('edge');
  });
  it('a client cannot award itself evidence or the Christmas Key', async () => {
    const h = await player('2026-12-25T10:00:00Z');
    for (const path of ['/api/archive/christmas-key', '/api/archive/star-seal']) expect((await h.get(path)).status).toBe(404);
    expect((await h.post('/api/finale/unlock')).status).toBe(403);
    expect((await h.attempt(25, 'unlock', { evidence: 'christmas-key' })).status).toBe(403);
    expect((await h.post('/api/archive/christmas-key', {})).status).toBe(404);
  });
  it('duplicate and concurrent submissions do not duplicate rewards', async () => {
    const h = await player('2026-12-01T10:00:00Z');
    await h.get('/api/puzzles/1');
    const results = await Promise.all([1, 2, 3].map(() => h.attempt(1, 'place', 'Edge Hill')));
    for (const r of results) expect(r.json.correct).toBe(true);
    const again = await h.attempt(1, 'place', 'edge hill');
    expect(again.json.dayComplete).toBe(true);
    const rows = h.d1.db.prepare("SELECT COUNT(*) AS n FROM player_evidence WHERE evidence_id = 'university-record'").get() as { n: number };
    expect(rows.n).toBe(1);
  });
  it('multi-stage puzzles enforce stage order', async () => {
    const h = await player('2026-12-03T10:00:00Z');
    await solveThrough(h, 2);
    await h.get('/api/puzzles/3');
    const res = await h.attempt(3, 'film', "Gulliver's Island");
    expect(res.status).toBe(409);
    expect(res.json.error).toBe('stage_order');
  });
  it('refreshing mid-puzzle keeps completed stages', async () => {
    const h = await player('2026-12-03T10:00:00Z');
    await solveThrough(h, 2);
    await h.get('/api/puzzles/3');
    await h.attempt(3, 'pieces', SOLUTIONS[3]![0]![1]);
    const reload = (await h.get('/api/puzzles/3')).json;
    expect(reload.stages[0].complete).toBe(true);
    expect(reload.stages[1].active).toBe(true);
  });
  it('hints unlock progressively without completing the puzzle', async () => {
    const h = await player();
    await h.get('/api/puzzles/1');
    const first = (await h.post('/api/puzzles/1/hint')).json;
    expect(first.hints).toHaveLength(1);
    await h.post('/api/puzzles/1/hint');
    const third = (await h.post('/api/puzzles/1/hint')).json;
    expect(third.hints).toHaveLength(3);
    expect((await h.post('/api/puzzles/1/hint')).json.hints).toHaveLength(3);
    expect((await h.get('/api/calendar')).json.completedCount).toBe(0);
  });
  it('hidden evidence layers stay on the server until their reveal', async () => {
    const h = await player('2026-12-08T10:00:00Z');
    await solveThrough(h, 8);
    const ticket = (await h.get('/api/archive/cinema-ticket')).json;
    expect(ticket.layers).toEqual([]);
    expect(JSON.stringify(ticket)).not.toContain('PROMISE');
    await h.setClock('2026-12-09T10:00:00Z');
    await h.get('/api/puzzles/9');
    const lit = (await h.get('/api/archive/cinema-ticket')).json;
    expect(lit.actions).toContain('overlay');
    expect(JSON.stringify(lit.layers)).toContain('PROMISE');
  });
  it('day 6 rejects attempts if required evidence is missing', async () => {
    const h = await player('2026-12-06T10:00:00Z');
    await solveThrough(h, 5);
    h.d1.db.prepare("DELETE FROM player_evidence WHERE evidence_id = 'clock'").run();
    await h.get('/api/puzzles/6');
    expect((await h.attempt(6, 'combination', '9186')).json.error).toBe('missing_evidence');
  });
  it('puzzle payloads never contain answers or matcher configuration', async () => {
    const h = await player('2026-12-24T10:00:00Z');
    for (let day = 1; day <= 24; day++) {
      const body = JSON.stringify((await h.get(`/api/puzzles/${day}`)).json);
      expect(body).not.toMatch(/"accept"|"matcher"|"type":"code"|9186|2510|0130|"map":/);
      if (day === 16) expect(body).not.toMatch(/bin-a"\s*:|"category"/);
      for (const [stage, answer] of SOLUTIONS[day]!) {
        const r = await h.attempt(day, stage, answer);
        expect(r.json.correct, `day ${day} ${stage}`).toBe(true);
      }
    }
  });
});

describe('the finale', () => {
  it('130 is rejected; 0130 is accepted only with all prerequisites', async () => {
    const h = await player('2026-12-24T10:00:00Z');
    await solveThrough(h, 23);
    await h.get('/api/puzzles/24');
    expect((await h.attempt(24, 'combination', '130')).json.correct).toBe(false);
    h.d1.db.prepare("DELETE FROM player_evidence WHERE evidence_id = 'heart-seal'").run();
    expect((await h.attempt(24, 'combination', '0130')).json.error).toBe('missing_evidence');
    h.d1.db.prepare("INSERT INTO player_evidence VALUES ('player-real', 'heart-seal', 22, '2026-12-22T10:00:00Z')").run();
    expect((await h.attempt(24, 'combination', '0130')).json.correct).toBe(true);
    const wrongSeals = await h.attempt(24, 'seals', { 'pos-n': 'moon-seal', 'pos-e': 'star-seal', 'pos-s': 'home-seal', 'pos-w': 'heart-seal' });
    expect(wrongSeals.json.correct).toBe(false);
    expect((await h.get('/api/calendar')).json.hasChristmasKey).toBe(false);
    const right = await h.attempt(24, 'seals', SOLUTIONS[24]![1]![1]);
    expect(right.json.dayComplete).toBe(true);
    expect(right.json.reveal.rewards.map((r: { id: string }) => r.id)).toContain('christmas-key');
    expect((await h.get('/api/calendar')).json.hasChristmasKey).toBe(true);
  });
  it('Day 25 is unavailable on 24 December even with the key', async () => {
    const h = await player('2026-12-24T23:59:00Z');
    await solveThrough(h, 24);
    expect((await h.get('/api/puzzles/25')).json.error).toBe('not_yet');
    expect((await h.post('/api/finale/unlock')).status).toBe(403);
    expect((await h.get('/api/finale')).json).toEqual({ unlocked: false });
  });
  it('Day 25 is unavailable without the earned key', async () => {
    const h = await player('2026-12-25T08:00:00Z');
    await solveThrough(h, 24);
    h.d1.db.prepare("DELETE FROM player_rewards WHERE reward_id = 'christmas-key'").run();
    expect((await h.get('/api/puzzles/25')).json.error).toBe('locked');
  });
  it('Day 25 opens on Christmas morning and the game stays playable afterwards', async () => {
    const h = await player('2026-12-25T00:00:00Z');
    await solveThrough(h, 24);
    expect((await h.get('/api/puzzles/25')).status).toBe(200);
    const unlock = await h.post('/api/finale/unlock');
    expect(unlock.json.dayComplete).toBe(true);
    expect(unlock.json.reveal.title).toContain('Merry Christmas');
    const finale = (await h.get('/api/finale')).json;
    expect(finale.unlocked).toBe(true);
    expect(finale.letter.join(' ')).toContain('Elephant Juice');
    await h.setClock('2027-01-15T12:00:00Z');
    const cal = (await h.get('/api/calendar')).json;
    expect(cal.completedCount).toBe(25);
    expect((await h.get('/api/puzzles/9')).json.reveal).toBeTruthy();
    expect((await h.get('/api/archive')).json.evidence.length).toBeGreaterThan(30);
  });
});

describe('admin isolation', () => {
  it('admin endpoints require admin sign-in', async () => {
    const h = await player();
    expect((await h.get('/api/admin/overview')).status).toBe(401);
    expect((await h.post('/api/admin/login', { password: 'wrong' })).status).toBe(401);
  });
  it('preview player has its own clock and never touches the real player', async () => {
    const h = new Harness();
    await h.setClock('2026-12-01T09:00:00Z');
    await h.adminLogin();
    await h.post('/api/admin/preview/clock', { at: '2026-12-25T10:00:00Z' });
    await h.post('/api/admin/preview/session');
    await solveThrough(h, 25);
    expect((await h.get('/api/session')).json.player.preview).toBe(true);
    const real = h.d1.db.prepare("SELECT COUNT(*) AS n FROM puzzle_progress WHERE player_id = 'player-real'").get() as { n: number };
    expect(real.n).toBe(0);
    // The real player still sees today's real calendar.
    h.cookies.delete('k25_session');
    await h.claim();
    const cal = (await h.get('/api/calendar')).json;
    expect(cal.today).toBe('2026-12-01');
    expect(cal.days[1].state).toBe('future');
  });
  it('a tester code signs in as the preview player and never touches Chloe', async () => {
    const h = new Harness();
    await h.setClock('2026-12-01T09:00:00Z');
    await h.adminLogin();
    await h.post('/api/admin/preview/clock', { at: '2026-12-03T10:00:00Z' });
    const { code } = (await h.post('/api/admin/codes', { label: 'Dan', player: 'preview' })).json;
    h.cookies.delete('k25_admin');
    expect((await h.claim(code)).status).toBe(200);
    expect((await h.get('/api/session')).json.player.preview).toBe(true);
    await solveThrough(h, 3);
    const real = h.d1.db.prepare("SELECT COUNT(*) AS n FROM puzzle_progress WHERE player_id = 'player-real'").get() as { n: number };
    expect(real.n).toBe(0);
  });
  it('the test clock is ignored in production', async () => {
    const h = new Harness({ ENVIRONMENT: 'production' });
    await h.setClock('2026-12-25T10:00:00Z');
    await h.claim(); // INVITE_CODES bootstrap is ignored in production
    expect((await h.get('/api/calendar')).status).toBe(401);
    await h.adminLogin();
    expect((await h.post('/api/test/clock', { at: '2026-12-25T10:00:00Z' })).status).toBe(404);
  });
  it('admin edits to answers and text take effect privately', async () => {
    const h = new Harness();
    await h.setClock('2026-12-01T09:00:00Z');
    await h.adminLogin();
    expect((await h.request('PUT', '/api/admin/answers/1/place', { matcher: { type: 'text', accept: ['Ormskirk'] } })).status).toBe(200);
    expect((await h.request('PUT', '/api/admin/days/1', { title: 'A New Title' })).status).toBe(200);
    expect((await h.request('PUT', '/api/admin/answers/1/place', { matcher: { type: 'llm' } })).status).toBe(400);
    await h.claim();
    const puzzle = (await h.get('/api/puzzles/1')).json;
    expect(puzzle.title).toBe('A New Title');
    expect((await h.attempt(1, 'place', 'Edge Hill')).json.correct).toBe(false);
    expect((await h.attempt(1, 'place', 'Ormskirk')).json.correct).toBe(true);
  });
  it('repairs keep progression sequential and are audited; backups round-trip', async () => {
    const h = new Harness();
    await h.setClock('2026-12-03T09:00:00Z');
    await h.adminLogin();
    expect((await h.post('/api/admin/repair', { player: 'real', action: 'complete-day', day: 2, confirm: 'REPAIR' })).status).toBe(409);
    expect((await h.post('/api/admin/repair', { player: 'real', action: 'complete-day', day: 1 })).status).toBe(400);
    expect((await h.post('/api/admin/repair', { player: 'real', action: 'complete-day', day: 1, confirm: 'REPAIR' })).status).toBe(200);
    const backup = (await h.get('/api/admin/export?player=real')).json;
    expect(backup.data.puzzle_progress).toHaveLength(1);
    await h.post('/api/admin/players/reset', { player: 'real', confirm: 'RESET CHLOE' });
    expect((h.d1.db.prepare("SELECT COUNT(*) AS n FROM puzzle_progress WHERE player_id='player-real'").get() as { n: number }).n).toBe(0);
    expect((await h.post('/api/admin/import', { player: 'real', backup, confirm: 'RESTORE' })).status).toBe(200);
    expect((h.d1.db.prepare("SELECT COUNT(*) AS n FROM player_evidence WHERE player_id='player-real'").get() as { n: number }).n).toBe(1);
    const overview = (await h.get('/api/admin/overview')).json;
    expect(overview.audit.map((a: { action: string }) => a.action)).toContain('repair');
  });
});
