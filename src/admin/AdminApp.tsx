import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { ApiFailure, api } from '../lib/api';
import './admin.css';

/* eslint-disable @typescript-eslint/no-explicit-any */
type Overview = any;
type DaysData = any;

const TABS = ['Overview', 'Days', 'Final message', 'Media', 'Access', 'Preview', 'Repair and backup'] as const;
type Tab = (typeof TABS)[number];

export default function AdminApp() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('Overview');
  const [overview, setOverview] = useState<Overview | null>(null);
  const [days, setDays] = useState<DaysData | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [o, d] = await Promise.all([api<Overview>('/api/admin/overview'), api<DaysData>('/api/admin/days')]);
      setOverview(o);
      setDays(d);
      setAuthed(true);
    } catch (err) {
      if (err instanceof ApiFailure && err.status === 401) setAuthed(false);
      else setMessage(err instanceof Error ? err.message : 'Failed to load.');
    }
  }, []);

  useEffect(() => {
    document.title = 'The 25th Key · Admin';
    void load();
  }, [load]);

  const run = useCallback(async (label: string, fn: () => Promise<unknown>) => {
    setMessage(null);
    try {
      await fn();
      setMessage(`${label}: done.`);
      await load();
    } catch (err) {
      setMessage(`${label}: ${err instanceof Error ? err.message : 'failed'}`);
    }
  }, [load]);

  if (authed === null) return <div className="admin"><p>Loading…</p></div>;
  if (!authed) return <Login onDone={load} />;

  return (
    <div className="admin">
      <header className="admin-header">
        <h1>The 25th Key · Admin</h1>
        <p className="admin-env">Environment: <strong>{overview?.environment}</strong> · Media storage: {overview?.mediaStorage ? 'connected' : 'not configured'}</p>
        <button type="button" onClick={() => run('Signed out', () => api('/api/admin/logout', { method: 'POST' }))}>Sign out</button>
      </header>
      <nav className="admin-tabs" aria-label="Admin sections">
        {TABS.map((t) => <button key={t} type="button" aria-pressed={tab === t} onClick={() => setTab(t)}>{t}</button>)}
      </nav>
      {message ? <p className="admin-message" role="status">{message}</p> : null}
      <main className="admin-main">
        {tab === 'Overview' && overview && days ? <OverviewTab overview={overview} days={days} /> : null}
        {tab === 'Days' && days ? <DaysTab days={days} run={run} /> : null}
        {tab === 'Final message' && days ? <FinalTab days={days} run={run} /> : null}
        {tab === 'Media' && overview ? <MediaTab overview={overview} run={run} /> : null}
        {tab === 'Access' && overview ? <AccessTab overview={overview} run={run} /> : null}
        {tab === 'Preview' && overview ? <PreviewTab overview={overview} run={run} /> : null}
        {tab === 'Repair and backup' && days ? <RepairTab days={days} run={run} /> : null}
      </main>
    </div>
  );
}

function Login({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  async function submit(e: FormEvent) {
    e.preventDefault();
    try {
      await api('/api/admin/login', { method: 'POST', body: { password } });
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
    }
  }
  return (
    <div className="admin admin-login">
      <h1>Admin</h1>
      <form onSubmit={submit}>
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />
        <button type="submit">Sign in</button>
        {error ? <p className="admin-error">{error}</p> : null}
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return <section className="admin-section"><h2>{title}</h2>{children}</section>;
}

function OverviewTab({ overview, days }: { overview: Overview; days: DaysData }) {
  const real = (overview.progress as any[]).filter((p) => p.player_id === 'player-real');
  const byDay = new Map(real.map((p) => [p.day, p]));
  const hints = new Map((overview.hints as any[]).filter((h) => h.player_id === 'player-real').map((h) => [h.day, h.hints]));
  const attempts = new Map((overview.attempts as any[]).filter((a) => a.player_id === 'player-real').map((a) => [a.day, a]));
  return (
    <>
      {overview.graphProblems.length ? (
        <Section title="Dependency problems">
          <ul className="admin-problems">{overview.graphProblems.map((p: string) => <li key={p}>{p}</li>)}</ul>
        </Section>
      ) : <p className="admin-ok">Puzzle dependency graph: valid.</p>}
      <Section title="Chloe's progress">
        <table className="admin-table">
          <thead><tr><th>Day</th><th>Title</th><th>Status</th><th>Completed</th><th>Hints</th><th>Attempts</th></tr></thead>
          <tbody>
            {days.days.map((d: any) => {
              const p = byDay.get(d.day);
              const a = attempts.get(d.day);
              return (
                <tr key={d.day}>
                  <td>{d.day}</td>
                  <td>{d.content.title}</td>
                  <td>{p?.status ?? '-'}</td>
                  <td>{p?.completed_at ? new Date(p.completed_at).toLocaleString('en-GB') : '-'}</td>
                  <td>{hints.get(d.day) ?? 0}</td>
                  <td>{a ? `${a.total} (${a.correct} correct)` : 0}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Section>
      <Section title="Sessions">
        <ul>{(overview.sessions as any[]).map((s) => <li key={s.player_id}>{s.player_id}: {s.n} session(s), last seen {s.last_seen ? new Date(s.last_seen).toLocaleString('en-GB') : 'never'}</li>)}</ul>
      </Section>
      <Section title="Asset check">
        <AssetCheck />
      </Section>
      <Section title="Recent admin activity">
        <ul className="admin-audit">{(overview.audit as any[]).map((a, i) => <li key={i}><code>{a.at}</code> {a.action} <small>{a.detail}</small></li>)}</ul>
      </Section>
    </>
  );
}

function AssetCheck() {
  const [results, setResults] = useState<[string, boolean][] | null>(null);
  async function check() {
    const urls = [
      '/assets/textures/paper-fine.webp', '/assets/textures/wood-table.webp', '/assets/textures/velvet-maroon.webp', '/assets/textures/leather-brown.webp',
      ...['red-squirrel', 'robin', 'owl', 'hare', 'fox', 'hedgehog', 'deer', 'elephant', 'foxglove'].map((n) => `/assets/engravings/${n}.webp`),
    ];
    try {
      const map = (await import('../audio/soundMap.json')).default as Record<string, { files: string[] }>;
      for (const def of Object.values(map)) urls.push(...def.files);
    } catch {
      urls.push('(sound map missing)');
    }
    const checked = await Promise.all([...new Set(urls)].map(async (u) => {
      try {
        const res = await fetch(u, { method: 'HEAD' });
        return [u, res.ok] as [string, boolean];
      } catch {
        return [u, false] as [string, boolean];
      }
    }));
    setResults(checked);
  }
  return (
    <>
      <button type="button" onClick={check}>Check all public assets</button>
      {results ? (
        <p>{results.filter((r) => r[1]).length} of {results.length} available.{' '}
          {results.filter((r) => !r[1]).map((r) => <code key={r[0]} className="admin-missing">{r[0]}</code>)}
        </p>
      ) : null}
    </>
  );
}

function DaysTab({ days, run }: { days: DaysData; run: (l: string, f: () => Promise<unknown>) => void }) {
  const [day, setDay] = useState(1);
  const entry = days.days.find((d: any) => d.day === day);
  const [draft, setDraft] = useState<string>('');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!entry) return;
    const c = entry.content;
    setDraft(JSON.stringify({ title: c.title, intro: c.intro, objective: c.objective, hints: c.hints, reveal: { title: c.reveal.title, body: c.reveal.body }, scene: c.scene }, null, 2));
    setAnswers(Object.fromEntries(Object.entries(entry.answers).map(([k, v]: [string, any]) => [k, JSON.stringify(v.matcher, null, 2)])));
  }, [entry]);
  if (!entry) return null;
  return (
    <>
      <div className="admin-row">
        <label htmlFor="day-select">Day</label>
        <select id="day-select" value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {days.days.map((d: any) => <option key={d.day} value={d.day}>{d.day}. {d.content.title}{d.overridden ? ' (edited)' : ''}</option>)}
        </select>
        <a href={`/day/${day}`} target="_blank" rel="noreferrer">Open as preview player</a>
      </div>
      <Section title="Narrative, hints and reveal">
        <p className="admin-help">Edit the JSON. Only title, intro, objective, hints (exactly three), reveal and scene (same kind) are saved. Mechanical requirements and rewards stay fixed so progression cannot break.</p>
        <textarea className="admin-json" value={draft} onChange={(e) => setDraft(e.target.value)} rows={22} spellCheck={false} />
        <div className="admin-row">
          <button type="button" onClick={() => run(`Day ${day} saved`, async () => api(`/api/admin/days/${day}`, { method: 'PUT', body: JSON.parse(draft) }))}>Save text</button>
          {entry.overridden ? <button type="button" onClick={() => confirm('Revert this day to the original text?') && run(`Day ${day} reverted`, () => api(`/api/admin/days/${day}`, { method: 'PUT', body: { reset: true } }))}>Revert to original</button> : null}
        </div>
      </Section>
      <Section title="Accepted answers">
        <p className="admin-help">Matcher types: text (accept: list of aliases), code (exact digits, leading zeros matter), choice, sequence, set, mapping, date, fields, any, evidenceOrText, evidence. Saved matchers are validated by the server.</p>
        {Object.keys(answers).map((stage) => (
          <div key={stage} className="admin-answer">
            <h3>Stage: {stage}{entry.answers[stage].overridden ? ' (edited)' : ''}</h3>
            <textarea className="admin-json" rows={8} value={answers[stage]} onChange={(e) => setAnswers((a) => ({ ...a, [stage]: e.target.value }))} spellCheck={false} />
            <div className="admin-row">
              <button type="button" onClick={() => run(`Answer ${day}/${stage} saved`, () => api(`/api/admin/answers/${day}/${stage}`, { method: 'PUT', body: { matcher: JSON.parse(answers[stage]!) } }))}>Save answer</button>
              {entry.answers[stage].overridden ? <button type="button" onClick={() => run('Answer reverted', () => api(`/api/admin/answers/${day}/${stage}`, { method: 'PUT', body: { reset: true } }))}>Revert</button> : null}
            </div>
          </div>
        ))}
      </Section>
      <Section title="Dependencies">
        <p className="admin-help">Mandatory evidence for this day: {entry.content.requiresEvidence.join(', ') || 'none'}. Rewards: {entry.content.rewards.join(', ') || 'none'}.</p>
        <details><summary>Full Mermaid diagram</summary><pre className="admin-pre">{days.mermaid}</pre></details>
      </Section>
    </>
  );
}

function FinalTab({ days, run }: { days: DaysData; run: (l: string, f: () => Promise<unknown>) => void }) {
  const [title, setTitle] = useState(days.final.title);
  const [letter, setLetter] = useState((days.final.letter as string[]).join('\n\n'));
  const [signature, setSignature] = useState(days.final.signature);
  const [closing, setClosing] = useState(days.final.closing);
  return (
    <Section title="The Christmas morning message (private until Day 25 is complete)">
      <label htmlFor="f-title">Title</label>
      <input id="f-title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <label htmlFor="f-letter">Letter (blank line between paragraphs)</label>
      <textarea id="f-letter" rows={16} value={letter} onChange={(e) => setLetter(e.target.value)} />
      <label htmlFor="f-sig">Signature</label>
      <input id="f-sig" value={signature} onChange={(e) => setSignature(e.target.value)} />
      <label htmlFor="f-close">Closing line</label>
      <input id="f-close" value={closing} onChange={(e) => setClosing(e.target.value)} />
      <div className="admin-row">
        <button type="button" onClick={() => run('Final message saved', () => api('/api/admin/final', { method: 'PUT', body: { title, letter: letter.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean), signature, closing } }))}>Save message</button>
        {days.finalOverridden ? <button type="button" onClick={() => run('Final message reverted', () => api('/api/admin/final', { method: 'PUT', body: { reset: true } }))}>Revert to original</button> : null}
      </div>
    </Section>
  );
}

/** Re-encodes photos through a canvas, which strips EXIF metadata including GPS location. */
async function stripImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2400 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Could not process image'))), 'image/jpeg', 0.88));
}

function MediaTab({ overview, run }: { overview: Overview; run: (l: string, f: () => Promise<unknown>) => void }) {
  const [slot, setSlot] = useState('final-photo');
  const [caption, setCaption] = useState('');
  const [file, setFile] = useState<File | null>(null);
  async function upload() {
    if (!file) return;
    let body: Blob = file;
    let type = file.type || 'application/octet-stream';
    if (type.startsWith('image/')) {
      body = await stripImage(file);
      type = 'image/jpeg';
    }
    const res = await fetch(`/api/admin/media?slot=${encodeURIComponent(slot)}&caption=${encodeURIComponent(caption)}`, { method: 'POST', headers: { 'Content-Type': type }, body, credentials: 'same-origin' });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message ?? 'Upload failed');
  }
  return (
    <>
      <Section title="Upload private media">
        {!overview.mediaStorage ? <p className="admin-error">R2 media storage is not bound in this environment. See docs/DEPLOYMENT.md.</p> : null}
        <p className="admin-help">Slots: honeymoon-photo (shown on the Day 13 postcard after Day 13), investigators (audio or video for Day 20), final-photo and final-recording (Christmas Room only). Photos are re-encoded in your browser before upload, which removes location and camera metadata.</p>
        <label htmlFor="slot">Slot</label>
        <select id="slot" value={slot} onChange={(e) => setSlot(e.target.value)}>
          <option value="final-photo">final-photo</option>
          <option value="final-recording">final-recording</option>
          <option value="honeymoon-photo">honeymoon-photo</option>
          <option value="investigators">investigators</option>
        </select>
        <label htmlFor="caption">Caption (optional)</label>
        <input id="caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
        <input type="file" accept="image/*,audio/*,video/mp4,video/quicktime" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        <button type="button" disabled={!file} onClick={() => run('Uploaded', upload)}>Upload</button>
      </Section>
      <Section title="Uploaded">
        <table className="admin-table">
          <thead><tr><th>Slot</th><th>Type</th><th>Size</th><th>Caption</th><th /></tr></thead>
          <tbody>
            {(overview.media as any[]).map((m) => (
              <tr key={m.id}>
                <td>{m.slot}</td><td>{m.content_type}</td><td>{Math.round(m.size / 1024)} KB</td><td>{m.caption}</td>
                <td>
                  <a href={`/api/admin/media/${m.id}`} target="_blank" rel="noreferrer">View</a>{' '}
                  <button type="button" onClick={() => confirm('Delete this file permanently?') && run('Deleted', () => api(`/api/admin/media/${m.id}`, { method: 'DELETE', body: { confirm: 'DELETE' } }))}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
    </>
  );
}

function AccessTab({ overview, run }: { overview: Overview; run: (l: string, f: () => Promise<unknown>) => void }) {
  const [code, setCode] = useState<string | null>(null);
  const [label, setLabel] = useState('Chloe');
  return (
    <>
      <Section title="Invitation and recovery codes">
        <p className="admin-help">A code signs Chloe in on any device and keeps her progress. Create one for the invitation, and another if she ever loses access. The code is shown once; only a hash is stored.</p>
        <label htmlFor="label">Label</label>
        <input id="label" value={label} onChange={(e) => setLabel(e.target.value)} />
        <div className="admin-row">
          <button type="button" onClick={() => run('Code created', async () => setCode((await api<{ code: string }>('/api/admin/codes', { method: 'POST', body: { label } })).code))}>Create code for Chloe</button>
          <button type="button" onClick={() => run('Tester code created', async () => setCode((await api<{ code: string }>('/api/admin/codes', { method: 'POST', body: { label: `${label} (tester)`, player: 'preview' } })).code))}>Create tester code (preview player)</button>
        </div>
        <p className="admin-help">Tester codes sign in as the preview player: separate progress, and the simulated date set in the Preview tab. Chloe is never affected.</p>
        {code ? (
          <div className="admin-code">
            <p>Code: <strong>{code}</strong></p>
            <p>Invitation link: <code>{`${location.origin}/#code=${code}`}</code></p>
          </div>
        ) : null}
        <table className="admin-table">
          <thead><tr><th>Ref</th><th>Label</th><th>Created</th><th>Status</th><th /></tr></thead>
          <tbody>
            {(overview.codes as any[]).map((c) => (
              <tr key={c.ref}>
                <td><code>{c.ref}</code></td><td>{c.label}{c.player_id === 'player-preview' ? ' · preview' : ''}</td><td>{new Date(c.created_at).toLocaleString('en-GB')}</td><td>{c.revoked_at ? 'revoked' : 'active'}</td>
                <td>{!c.revoked_at ? <button type="button" onClick={() => confirm('Revoke this code?') && run('Revoked', () => api('/api/admin/codes/revoke', { method: 'POST', body: { ref: c.ref } }))}>Revoke</button> : null}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      <Section title="Sign out Chloe's devices">
        <button type="button" onClick={() => prompt('Type SIGN OUT to sign out every device Chloe uses') === 'SIGN OUT' && run('Sessions revoked', () => api('/api/admin/sessions/revoke', { method: 'POST', body: { player: 'real', confirm: 'SIGN OUT' } }))}>Sign out all of Chloe's sessions</button>
      </Section>
    </>
  );
}

function PreviewTab({ overview, run }: { overview: Overview; run: (l: string, f: () => Promise<unknown>) => void }) {
  const [at, setAt] = useState('2026-12-01T09:00');
  return (
    <Section title="Isolated preview">
      <p className="admin-help">The preview player is completely separate from Chloe. Its simulated date applies only to the preview player and never to Chloe or to the real calendar.</p>
      <p>Preview date: <strong>{overview.previewClock ?? 'real time'}</strong></p>
      <label htmlFor="at">Simulated date and time (UK)</label>
      <input id="at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
      <div className="admin-row">
        <button type="button" onClick={() => run('Preview date set', () => api('/api/admin/preview/clock', { method: 'POST', body: { at: new Date(at).toISOString() } }))}>Set preview date</button>
        <button type="button" onClick={() => run('Preview date cleared', () => api('/api/admin/preview/clock', { method: 'POST', body: { at: null } }))}>Use real time</button>
      </div>
      <div className="admin-row">
        <button type="button" onClick={() => run('Preview session started', async () => { await api('/api/admin/preview/session', { method: 'POST' }); window.open('/', '_blank'); })}>Play as the preview player</button>
        <button type="button" onClick={() => confirm('Reset all preview progress?') && run('Preview reset', () => api('/api/admin/players/reset', { method: 'POST', body: { player: 'preview', confirm: 'RESET' } }))}>Reset preview progress</button>
      </div>
      <p className="admin-help">This browser will then be signed in as the preview player. Sign out from Settings in the game, then open Chloe's invitation link, to switch back.</p>
    </Section>
  );
}

function RepairTab({ days, run }: { days: DaysData; run: (l: string, f: () => Promise<unknown>) => void }) {
  const [player, setPlayer] = useState<'real' | 'preview'>('real');
  const [day, setDay] = useState(1);
  const [evidence, setEvidence] = useState('');
  const confirmRepair = () => prompt('Type REPAIR to confirm') === 'REPAIR';
  return (
    <>
      <Section title="Backup">
        <div className="admin-row">
          <a className="admin-button" href="/api/admin/export?player=real" download>Download Chloe's progress</a>
          <a className="admin-button" href="/api/admin/export?player=preview" download>Download preview progress</a>
        </div>
        <label htmlFor="restore">Restore from a backup file</label>
        <input id="restore" type="file" accept="application/json" onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          const backup = JSON.parse(await f.text());
          const word = prompt(`Restoring REPLACES the ${player} player's progress. Type RESTORE to continue.`);
          if (word === 'RESTORE') run('Restored', () => api('/api/admin/import', { method: 'POST', body: { player, backup, confirm: 'RESTORE' } }));
        }} />
      </Section>
      <Section title="Repair progress">
        <p className="admin-help">Use only if something has gone wrong. Every repair keeps days in order and is written to the audit log.</p>
        <div className="admin-row">
          <label htmlFor="rp">Player</label>
          <select id="rp" value={player} onChange={(e) => setPlayer(e.target.value as 'real' | 'preview')}><option value="real">Chloe (real)</option><option value="preview">Preview</option></select>
          <label htmlFor="rd">Day</label>
          <select id="rd" value={day} onChange={(e) => setDay(Number(e.target.value))}>{days.days.map((d: any) => <option key={d.day} value={d.day}>{d.day}</option>)}</select>
        </div>
        <div className="admin-row">
          <button type="button" onClick={() => confirmRepair() && run(`Day ${day} marked complete`, () => api('/api/admin/repair', { method: 'POST', body: { player, action: 'complete-day', day, confirm: 'REPAIR' } }))}>Mark day complete (with rewards)</button>
          <button type="button" onClick={() => confirmRepair() && run(`Day ${day} reopened`, () => api('/api/admin/repair', { method: 'POST', body: { player, action: 'reopen-day', day, confirm: 'REPAIR' } }))}>Reopen this day and all later days</button>
        </div>
        <div className="admin-row">
          <label htmlFor="ev">Evidence</label>
          <select id="ev" value={evidence} onChange={(e) => setEvidence(e.target.value)}>
            <option value="">Choose…</option>
            {(days.evidence as any[]).map((e) => <option key={e.id} value={e.id}>{e.title} (day {e.day})</option>)}
          </select>
          <button type="button" disabled={!evidence} onClick={() => confirmRepair() && run('Evidence granted', () => api('/api/admin/repair', { method: 'POST', body: { player, action: 'grant-evidence', evidence, confirm: 'REPAIR' } }))}>Grant evidence</button>
        </div>
      </Section>
      <Section title="Reset">
        <button type="button" className="admin-danger" onClick={() => {
          const word = player === 'real' ? 'RESET CHLOE' : 'RESET';
          if (prompt(`This deletes ALL progress for the ${player} player. Download a backup first. Type ${word} to continue.`) === word) run('Player reset', () => api('/api/admin/players/reset', { method: 'POST', body: { player, confirm: word } }));
        }}>Reset {player === 'real' ? "Chloe's" : 'preview'} progress</button>
      </Section>
    </>
  );
}
