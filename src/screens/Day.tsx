import { useCallback, useEffect, useRef, useState } from 'react';
import type { AttemptResponse, HintResponse, PuzzleResponse, RevealView, StageView } from '../../shared/api';
import { audio } from '../audio/engine';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { Glyph } from '../components/Glyph';
import { Seal } from '../components/Seal';
import { Button, Dialog, Notice, Spinner, announce } from '../components/ui';
import { ApiFailure, api } from '../lib/api';
import { formatDay, useGame } from '../lib/game';
import { useReducedMotion } from '../lib/prefs';
import { Link, navigate } from '../lib/router';
import { KeyStage } from '../puzzles/KeyStage';
import {
  ChoiceStage, CodeStage, CompareStage, DateStage, DialsStage, EvidenceSlotsStage, FieldsStage, PlacementStage, SelectManyStage,
  SortingStage, TextStage, TilesStage,
} from '../puzzles/stages';
import { Scene, WoodlandStage, sceneGates } from '../scenes/scenes';

export function DayScreen({ day }: { day: number }) {
  const { refresh } = useGame();
  const [puzzle, setPuzzle] = useState<PuzzleResponse | null>(null);
  const [error, setError] = useState<ApiFailure | null>(null);
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<{ tone: 'gentle' | 'success' | 'info'; text: string } | null>(null);
  const [reveal, setReveal] = useState<RevealView | null>(null);
  const [sceneReady, setSceneReady] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const [shake, setShake] = useState(0);
  const reduced = useReducedMotion();

  const load = useCallback(async () => {
    try {
      const data = await api<PuzzleResponse>(`/api/puzzles/${day}`);
      setPuzzle(data);
      setError(null);
      const started = data.stages.some((s) => s.complete);
      if (data.state === 'complete' || started || !sceneGates(data.scene)) setSceneReady(true);
    } catch (err) {
      setError(err instanceof ApiFailure ? err : new ApiFailure(0, 'error', 'Something went wrong.'));
    }
  }, [day]);

  useEffect(() => {
    void load();
    void audio.play('door.open');
  }, [load]);

  const submit = useCallback(async (stageId: string, answer: unknown): Promise<boolean> => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await api<AttemptResponse>(`/api/puzzles/${day}/attempt`, { method: 'POST', body: { stage: stageId, answer } });
      if (!res.correct) {
        void audio.play('ui.error.soft');
        setShake((n) => n + 1);
        const partial = res.partial ? ` ${res.partial.correct} of ${res.partial.total} parts are right.` : '';
        const text = `${res.message ?? 'Not quite.'}${partial}`;
        setFeedback({ tone: 'gentle', text });
        announce(text);
        return false;
      }
      if (res.dayComplete && res.reveal) {
        void audio.play(day === 24 ? 'key.earned' : res.reveal.chapterComplete ? 'chapter.complete' : 'puzzle.complete');
        setReveal(res.reveal);
        announce(`Solved. ${res.reveal.title}.`);
        await Promise.all([load(), refresh()]);
      } else {
        void audio.play('puzzle.correct');
        setFeedback({ tone: 'success', text: 'That is right. One more part to go.' });
        announce('That is right. One more part to go.');
        await load();
      }
      return true;
    } catch (err) {
      const message = err instanceof ApiFailure ? err.message : 'Something went wrong. Please try again.';
      setFeedback({ tone: 'info', text: message });
      announce(message);
      return false;
    } finally {
      setBusy(false);
    }
  }, [day, load, refresh]);

  if (error) {
    return (
      <div className="day day-unavailable">
        <Link to="/" className="back-link"><Glyph name="back" size={18} /> The Village</Link>
        <h1>{error.code === 'not_yet' ? 'Not yet' : error.code === 'locked' ? 'One at a time' : 'This door will not open'}</h1>
        <p className="lede">{error.message}</p>
        <Link to="/" className="btn btn-secondary">Back to the village</Link>
      </div>
    );
  }
  if (!puzzle) return <div className="screen-loading"><Spinner label="Opening the door" /></div>;

  const complete = puzzle.state === 'complete';
  const activeStage = puzzle.stages.find((s) => s.active);

  return (
    <article className={`day day-${day} chapter-${puzzle.chapter}`} aria-labelledby="day-title">
      <Link to="/" className="back-link"><Glyph name="back" size={18} /> The Village</Link>
      <header className="day-header">
        <p className="eyebrow">Day {day} · {formatDay(puzzle.date)}</p>
        <h1 id="day-title">{puzzle.title}</h1>
        <p className="day-chapter">Chapter {puzzle.chapter}: {puzzle.chapterTitle}</p>
      </header>

      <div className="prose day-intro">
        {puzzle.intro.map((p, i) => <p key={i} className={i === 0 ? 'lede' : undefined}>{p}</p>)}
      </div>

      <p className="objective"><Glyph name="magnifier" size={20} /><span>{puzzle.objective}</span></p>

      {puzzle.requiredEvidence.length > 0 ? (
        <section className="needed" aria-labelledby="needed-title">
          <h2 id="needed-title" className="needed-title">From your Archive</h2>
          <ul className="needed-list">
            {puzzle.requiredEvidence.map((e) => (
              <li key={e.id}>
                <button type="button" className="evidence-chip" onClick={() => setViewing(e.id)}>
                  <Glyph name={e.glyph ?? 'note'} size={18} /> {e.title}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {puzzle.scene.kind !== 'woodland' ? <Scene scene={puzzle.scene} ready={sceneReady} onReady={() => setSceneReady(true)} /> : null}

      {sceneReady || complete ? (
        <div className="stages">
          {puzzle.stages.map((stage, index) => (
            <StageBlock
              key={stage.spec.id}
              stage={stage}
              index={index}
              total={puzzle.stages.length}
              day={day}
              puzzle={puzzle}
              busy={busy}
              submit={(answer) => submit(stage.spec.id, answer)}
              shake={stage === activeStage ? shake : 0}
              reduced={reduced}
            />
          ))}
        </div>
      ) : null}

      {feedback ? <div className={`feedback feedback-${feedback.tone}`}><Notice tone={feedback.tone}>{feedback.text}</Notice></div> : null}

      {!complete ? <Hints day={day} initial={puzzle.hints} available={puzzle.hintsAvailable} /> : null}

      {complete && puzzle.reveal ? <RevealSection reveal={puzzle.reveal} day={day} onView={setViewing} /> : null}

      <RevealDialog reveal={reveal} day={day} onClose={() => setReveal(null)} onView={setViewing} />
      <EvidenceViewer id={viewing} onClose={() => setViewing(null)} />
    </article>
  );
}

function StageBlock({ stage, index, total, day, puzzle, busy, submit, shake, reduced }: {
  stage: StageView; index: number; total: number; day: number; puzzle: PuzzleResponse; busy: boolean;
  submit: (answer: unknown) => Promise<boolean>; shake: number; reduced: boolean;
}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!shake || reduced || !ref.current) return;
    ref.current.animate([{ transform: 'translateX(0)' }, { transform: 'translateX(-6px)' }, { transform: 'translateX(5px)' }, { transform: 'translateX(-3px)' }, { transform: 'translateX(0)' }], { duration: 320, easing: 'ease-out' });
  }, [shake, reduced]);
  if (!stage.complete && !stage.active) return null;
  const spec = stage.spec;
  const heading = total > 1 ? `Part ${index + 1} of ${total}` : null;
  return (
    <section ref={ref} className={`stage stage-${spec.kind}${stage.complete ? ' is-complete' : ''}`} aria-labelledby={`stage-${spec.id}`}>
      {heading ? <p className="stage-count">{heading}</p> : null}
      <h2 id={`stage-${spec.id}`} className="stage-prompt">{spec.prompt}</h2>
      {stage.complete ? (
        <p className="stage-done"><Glyph name="check" size={18} /> Solved</p>
      ) : (
        <StageInput spec={spec} day={day} puzzle={puzzle} busy={busy} submit={submit} />
      )}
    </section>
  );
}

function StageInput({ spec, day, puzzle, busy, submit }: { spec: StageView['spec']; day: number; puzzle: PuzzleResponse; busy: boolean; submit: (a: unknown) => Promise<boolean> }) {
  const props = { day, busy, submit };
  switch (spec.kind) {
    case 'text': return <TextStage spec={spec} {...props} />;
    case 'code': return <CodeStage spec={spec} {...props} />;
    case 'dials': return <DialsStage spec={spec} {...props} />;
    case 'choice':
      if (spec.layout === 'scene' && puzzle.scene.kind === 'woodland') return <WoodlandStage scene={puzzle.scene} stage={spec} busy={busy} submit={submit} />;
      return <ChoiceStage spec={spec} {...props} />;
    case 'tiles': return <TilesStage spec={spec} {...props} />;
    case 'placement': return <PlacementStage spec={spec} {...props} />;
    case 'sorting': return <SortingStage spec={spec} {...props} />;
    case 'fields': return <FieldsStage spec={spec} {...props} />;
    case 'date': return <DateStage spec={spec} {...props} />;
    case 'select-many': return <SelectManyStage spec={spec} {...props} />;
    case 'compare': return <CompareStage spec={spec} {...props} />;
    case 'evidence-slots': return <EvidenceSlotsStage spec={spec} {...props} />;
    case 'key': return <KeyStage spec={spec} {...props} />;
  }
}

function Hints({ day, initial, available }: { day: number; initial: { index: number; text: string }[]; available: number }) {
  const [hints, setHints] = useState(initial);
  const [busy, setBusy] = useState(false);
  async function more() {
    setBusy(true);
    try {
      const res = await api<HintResponse>(`/api/puzzles/${day}/hint`, { method: 'POST' });
      setHints(res.hints);
      void audio.play('paper.rustle');
      const last = res.hints[res.hints.length - 1];
      if (last) announce(`Hint ${last.index}: ${last.text}`);
    } catch {
      /* offline: the button stays available */
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="hints" aria-labelledby="hints-title">
      <h2 id="hints-title" className="hints-title"><Glyph name="hint" size={20} /> Hints</h2>
      {hints.length === 0 ? <p className="muted">Three hints are here if you want them. They never cost anything.</p> : null}
      <ol className="hint-list">
        {hints.map((h) => <li key={h.index} className="hint"><span className="hint-num">{h.index}</span><p>{h.text}</p></li>)}
      </ol>
      {hints.length < available ? (
        <Button variant="secondary" busy={busy} disabled={busy} onClick={more} sound={null}>
          {hints.length === 0 ? 'Show a hint' : 'Show another hint'}
        </Button>
      ) : null}
    </section>
  );
}

function Rewards({ reveal, onView }: { reveal: RevealView; onView: (id: string) => void }) {
  if (reveal.rewards.length === 0) return null;
  return (
    <ul className="reward-list" aria-label="Added to your Archive">
      {reveal.rewards.map((r, i) => (
        <li key={r.id} style={{ animationDelay: `${300 + i * 140}ms` }}>
          <button type="button" className="reward" onClick={() => onView(r.id)}>
            {r.kind === 'seal' ? <Seal kind={r.glyph ?? 'star'} size={46} /> : <span className="reward-icon"><Glyph name={r.glyph ?? 'note'} /></span>}
            <span className="reward-title">{r.title}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}

function RevealSection({ reveal, day, onView }: { reveal: RevealView; day: number; onView: (id: string) => void }) {
  return (
    <section className="reveal-section paper" aria-labelledby="reveal-title">
      <p className="record-kicker">Solved</p>
      <h2 id="reveal-title">{reveal.title}</h2>
      <div className="prose">{reveal.body.map((p, i) => <p key={i}>{p}</p>)}</div>
      <Rewards reveal={reveal} onView={onView} />
      {day === 24 ? <ChristmasCountdown /> : null}
      {day === 25 ? <Link to="/christmas" className="btn btn-primary">Go to the Christmas Room</Link> : null}
    </section>
  );
}

function RevealDialog({ reveal, day, onClose, onView }: { reveal: RevealView | null; day: number; onClose: () => void; onView: (id: string) => void }) {
  useEffect(() => {
    if (reveal && day < 25) window.setTimeout(() => void audio.play('evidence.collect'), 700);
  }, [reveal, day]);
  if (day === 25) {
    if (reveal) navigate('/christmas');
    return null;
  }
  return (
    <Dialog open={reveal !== null} onClose={onClose} label={reveal?.title ?? 'Solved'} className="reveal-dialog" tone="paper">
      {reveal ? (
        <div className={`reveal${reveal.chapterComplete ? ' is-chapter' : ''}${day === 24 ? ' is-key' : ''}`}>
          {day === 24 ? (
            <div className="key-emblem" aria-hidden="true">
              {['star', 'moon', 'home', 'heart'].map((s) => <Seal key={s} kind={s} size={54} className={`emblem-seal emblem-${s}`} />)}
              <span className="key-emerge"><Glyph name="key" size={84} /></span>
            </div>
          ) : reveal.chapterComplete ? (
            <div className="chapter-seal-reveal" aria-hidden="true"><Seal kind={reveal.chapterComplete.seal} size={110} /></div>
          ) : (
            <div className="reveal-mark" aria-hidden="true"><Glyph name="check" size={36} /></div>
          )}
          {reveal.chapterComplete ? <p className="eyebrow">Chapter {reveal.chapterComplete.chapter} complete · {reveal.chapterComplete.title}</p> : <p className="eyebrow">Day {day} solved</p>}
          <h2>{reveal.title}</h2>
          <div className="prose reveal-body">{reveal.body.map((p, i) => <p key={i}>{p}</p>)}</div>
          <Rewards reveal={reveal} onView={onView} />
          {day === 24 ? <ChristmasCountdown /> : null}
          <div className="reveal-actions">
            <Button variant="paper" onClick={() => { onClose(); navigate('/'); }}>Back to the village</Button>
            {reveal.rewards.length > 0 ? <Button variant="quiet" onClick={() => { onClose(); navigate('/archive'); }}>Open the Archive</Button> : null}
          </div>
        </div>
      ) : null}
    </Dialog>
  );
}

function ChristmasCountdown() {
  const { calendar } = useGame();
  const today = calendar?.today ?? '';
  const isChristmas = today >= '2026-12-25';
  return (
    <p className="countdown">
      <Glyph name="tree" size={20} />
      {isChristmas ? 'It is Christmas morning. The vault is ready.' : 'The vault opens on Christmas morning, Friday 25 December.'}
    </p>
  );
}
