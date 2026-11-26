import { useEffect, useRef, useState, type FormEvent } from 'react';
import type { RecordSpec, SceneSpec, StageSpec } from '../../shared/api';
import { audio } from '../audio/engine';
import { Glyph } from '../components/Glyph';
import { Seal } from '../components/Seal';
import { Button } from '../components/ui';
import { useReducedMotion } from '../lib/prefs';

type SceneProps<K extends SceneSpec['kind']> = { scene: Extract<SceneSpec, { kind: K }>; onReady: () => void; ready: boolean };

export function RecordCard({ record, className }: { record: RecordSpec; className?: string }) {
  return (
    <section className={`paper record${className ? ` ${className}` : ''}`} aria-label={record.title}>
      <p className="record-kicker">{record.caption}</p>
      <h3>{record.title}</h3>
      <dl className="record-fields">
        {record.fields.map((f) => (
          <div key={f.id}><dt>{f.label}</dt><dd>{f.value}</dd></div>
        ))}
      </dl>
    </section>
  );
}

// ---------------------------------------------------------------- Envelope (day 1)

export function EnvelopeScene({ scene, onReady, ready }: SceneProps<'envelope'>) {
  const [stage, setStage] = useState<'sealed' | 'opening' | 'open'>(ready ? 'open' : 'sealed');
  const reduced = useReducedMotion();
  function open() {
    void audio.play('seal.break');
    setStage('opening');
    window.setTimeout(() => {
      void audio.play('letter.unfold');
      setStage('open');
      onReady();
    }, reduced ? 0 : 900);
  }
  return (
    <div className={`envelope-scene is-${stage}`}>
      {stage !== 'open' ? (
        <div className="envelope" aria-hidden={stage === 'opening'}>
          <div className="envelope-back" />
          <div className="envelope-flap" />
          <div className="envelope-front">
            <span className="envelope-address">By hand</span>
          </div>
          <button type="button" className="envelope-seal" onClick={open} disabled={stage === 'opening'} aria-label="Break the seal and open the envelope">
            <Seal kind={scene.seal} size={76} />
          </button>
        </div>
      ) : (
        <div className="letter-stack">
          <article className="paper letter">
            {scene.letter.map((line, i) => <p key={i}>{line}</p>)}
            <p className="letter-signature">{scene.signature}</p>
          </article>
          {scene.enclosure ? <RecordCard record={scene.enclosure} className="record-enclosure" /> : null}
        </div>
      )}
      {stage === 'sealed' ? <p className="scene-hint">Tap the seal to open the envelope.</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------- Frost (day 2)

function FrostPane({ text, cleared, onClear, index }: { text: string; cleared: boolean; onClear: () => void; index: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const strokes = useRef(0);
  useEffect(() => {
    const c = canvas.current;
    if (!c || cleared) return;
    const rect = c.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.max(1, rect.width * dpr);
    c.height = Math.max(1, rect.height * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    // Procedural frost: layered translucent speckle (an interface mask, not artwork).
    ctx.fillStyle = 'rgba(214, 226, 232, 0.92)';
    ctx.fillRect(0, 0, c.width, c.height);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.35})`;
      const r = Math.random() * 3 * dpr;
      ctx.beginPath();
      ctx.arc(Math.random() * c.width, Math.random() * c.height, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [cleared]);
  function wipe(e: React.PointerEvent<HTMLCanvasElement>) {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || !drawing.current) return;
    const rect = c.getBoundingClientRect();
    const scale = c.width / rect.width;
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc((e.clientX - rect.left) * scale, (e.clientY - rect.top) * scale, 26 * scale, 0, Math.PI * 2);
    ctx.fill();
    strokes.current += 1;
    if (strokes.current % 12 === 0) {
      void audio.play('paper.rustle', { gain: 0.4 });
      // Sample coverage cheaply.
      const data = ctx.getImageData(0, 0, c.width, c.height).data;
      let clear = 0;
      for (let i = 3; i < data.length; i += 64) if (data[i]! < 40) clear++;
      if (clear / (data.length / 64) > 0.5) onClear();
    }
  }
  return (
    <div className={`frost-pane${cleared ? ' is-cleared' : ''}`}>
      <p className="frost-text" aria-hidden={!cleared}>{text}</p>
      {!cleared ? (
        <>
          <canvas
            ref={canvas}
            className="frost-canvas"
            aria-hidden="true"
            onPointerDown={(e) => { drawing.current = true; e.currentTarget.setPointerCapture(e.pointerId); wipe(e); }}
            onPointerMove={wipe}
            onPointerUp={() => (drawing.current = false)}
            onPointerCancel={() => (drawing.current = false)}
          />
          <button type="button" className="btn btn-quiet btn-small frost-button" onClick={() => { void audio.play('secret.reveal'); onClear(); }}>
            Clear window {index + 1}
          </button>
        </>
      ) : null}
    </div>
  );
}

export function FrostScene({ scene, onReady, ready }: SceneProps<'frost'>) {
  const [cleared, setCleared] = useState<string[]>(ready ? scene.panes.map((p) => p.id) : []);
  useEffect(() => {
    if (cleared.length === scene.panes.length) onReady();
  }, [cleared, scene.panes.length, onReady]);
  return (
    <div className="frost-scene">
      <p className="scene-hint">Wipe the frost with your finger, or use the buttons.</p>
      <div className="frost-panes">
        {scene.panes.map((pane, i) => (
          <FrostPane key={pane.id} index={i} text={pane.text} cleared={cleared.includes(pane.id)} onClear={() => setCleared((c) => (c.includes(pane.id) ? c : [...c, pane.id]))} />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Clock (day 5)

export function ClockScene({ scene, onReady, ready }: SceneProps<'clock'>) {
  // Hours from 21 (9pm) to 28 (4am), as a continuous evening-to-dawn range.
  const [hour, setHour] = useState(ready ? 28 : 20);
  const seq = scene.fragments.map((f) => (f.hour < 12 ? f.hour + 24 : f.hour));
  const visible = scene.fragments.filter((_, i) => seq[i]! <= hour);
  useEffect(() => {
    if (hour >= Math.max(...seq)) onReady();
  }, [hour, seq, onReady]);
  const hourAngle = ((hour % 12) / 12) * 360;
  const label = (h: number) => {
    const hh = h % 24;
    const twelve = hh % 12 === 0 ? 12 : hh % 12;
    return `${twelve} ${hh < 12 ? 'am' : 'pm'}`.replace('12 am', 'midnight');
  };
  return (
    <div className="clock-scene">
      <svg className="clock-face" viewBox="0 0 200 200" aria-hidden="true">
        <circle cx="100" cy="100" r="92" className="clock-rim" />
        <circle cx="100" cy="100" r="84" className="clock-dial" />
        {Array.from({ length: 12 }, (_, i) => (
          <line key={i} x1="100" y1="22" x2="100" y2={i % 3 === 0 ? 34 : 29} className="clock-tick" transform={`rotate(${i * 30} 100 100)`} />
        ))}
        <line x1="100" y1="100" x2="100" y2="52" className="clock-hand clock-hand-hour" style={{ transform: `rotate(${hourAngle}deg)` }} />
        <line x1="100" y1="100" x2="100" y2="30" className="clock-hand clock-hand-minute" />
        <circle cx="100" cy="100" r="5" className="clock-pin" />
      </svg>
      <label className="field-label" htmlFor="clock-range">Wind the clock: <strong>{label(hour)}</strong></label>
      <input
        id="clock-range"
        className="range"
        type="range"
        min={20}
        max={28}
        step={1}
        value={hour}
        aria-valuetext={label(hour)}
        onChange={(e) => { setHour(Number(e.target.value)); void audio.play('dial.tick'); }}
      />
      <ol className="clock-fragments" aria-live="polite">
        {visible.map((f) => <li key={f.hour} className="clock-fragment">{f.text}</li>)}
      </ol>
    </div>
  );
}

// ---------------------------------------------------------------- Postcard (day 7)

export function PostcardScene({ scene, onReady, ready }: SceneProps<'postcard'>) {
  const [read, setRead] = useState(ready ? scene.layers.length : 0);
  const [steady, setSteady] = useState(false);
  const reduced = useReducedMotion();
  function steadyIt() {
    if (read >= scene.layers.length) return;
    void audio.play('paper.rustle');
    setSteady(true);
    window.setTimeout(() => {
      setRead((r) => {
        const next = Math.min(scene.layers.length, r + 1);
        if (next === scene.layers.length) onReady();
        return next;
      });
      setSteady(false);
    }, reduced ? 0 : 450);
  }
  return (
    <div className="postcard-scene">
      <div className={`postcard${steady || read >= scene.layers.length ? ' is-steady' : ''}`}>
        <p className="postcard-front">{scene.front}</p>
        <ol className="postcard-lines">
          {scene.layers.map((layer, i) => (
            <li key={layer.id} className={i < read ? 'is-read' : 'is-blurred'} aria-hidden={i >= read}>
              {i < read ? layer.text : 'The wind has the card. Hold it steady to read this line.'}
            </li>
          ))}
        </ol>
      </div>
      {read < scene.layers.length ? (
        <Button variant="secondary" sound={null} onClick={steadyIt}>Hold the postcard steady ({read}/{scene.layers.length})</Button>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- Woodland (day 8): scene is the choice

export function WoodlandStage({ scene, stage, busy, submit }: {
  scene: Extract<SceneSpec, { kind: 'woodland' }>;
  stage: Extract<StageSpec, { kind: 'choice' }>;
  busy: boolean;
  submit: (answer: unknown) => Promise<boolean>;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [view, setView] = useState<'scene' | 'list'>('scene');
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (selected) await submit(selected);
  }
  const chosen = scene.objects.find((o) => o.id === selected);
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className="segmented" role="group" aria-label="How to search">
        <button type="button" aria-pressed={view === 'scene'} onClick={() => setView('scene')}>Search the woods</button>
        <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>Read the field notes</button>
      </div>
      {view === 'scene' ? (
        <div className="woodland" role="radiogroup" aria-label={stage.prompt}>
          <div className="woodland-pines" aria-hidden="true" />
          {scene.objects.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={selected === o.id}
              aria-label={`${o.label}: ${o.description}`}
              className={`woodland-object${selected === o.id ? ' is-selected' : ''}`}
              style={{ left: `${o.x}%`, top: `${o.y}%`, width: `${Math.round(o.scale * 22)}%` }}
              onClick={() => { setSelected(o.id); void audio.play('object.inspect'); }}
            >
              <img
                src={o.image}
                alt=""
                loading="lazy"
                draggable={false}
                onError={(e) => {
                  // Missing artwork: show a numbered field marker so the scene still works.
                  e.currentTarget.replaceWith(Object.assign(document.createElement('span'), { className: 'woodland-marker', textContent: String(scene.objects.indexOf(o) + 1) }));
                }}
              />
            </button>
          ))}
        </div>
      ) : (
        <div className="choices choices-list" role="radiogroup" aria-label={stage.prompt}>
          {scene.objects.map((o) => (
            <button key={o.id} type="button" role="radio" aria-checked={selected === o.id} className={`choice${selected === o.id ? ' is-selected' : ''}`} onClick={() => setSelected(o.id)}>
              <span className="choice-label">{o.label}</span>
              <span className="choice-desc">{o.description}</span>
            </button>
          ))}
        </div>
      )}
      <p className="stage-instruction" aria-live="polite">{chosen ? `Selected: ${chosen.description}` : 'Nothing selected yet.'}</p>
      <div className="submit-row">
        <Button type="submit" busy={busy} disabled={!selected || busy} sound="ui.press">{busy ? 'Checking…' : 'This is the one'}</Button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- House (day 14)

export function HouseScene({ scene }: SceneProps<'house'>) {
  const [face, setFace] = useState(0);
  const current = scene.faces[face]!;
  const turn = (delta: number) => {
    setFace((f) => (f + delta + scene.faces.length) % scene.faces.length);
    void audio.play('object.rotate');
  };
  return (
    <div className="house-scene">
      <div className="house-stage" aria-hidden="true">
        <div className="house-model" style={{ transform: `rotateX(-14deg) rotateY(${-face * 90}deg)` }}>
          {['front', 'side', 'back', 'roof'].map((name) => (
            <div key={name} className={`house-face house-face-${name}`}>
              <span className="house-window" />
              <span className="house-window" />
              {name === 'front' ? <span className="house-door" /> : null}
              {name === 'side' ? <span className="house-sign"><Glyph name="foxglove" size={20} /></span> : null}
            </div>
          ))}
          <div className="house-roof house-roof-a" />
          <div className="house-roof house-roof-b" />
        </div>
      </div>
      <div className="house-controls" role="group" aria-label="Turn the house">
        <button type="button" className="icon-button" onClick={() => turn(-1)} aria-label="Turn left"><Glyph name="back" /></button>
        <div className="segmented" role="group" aria-label="Side of the house">
          {scene.faces.map((f, i) => (
            <button key={f.id} type="button" aria-pressed={face === i} onClick={() => { setFace(i); void audio.play('object.rotate'); }}>{f.label}</button>
          ))}
        </div>
        <button type="button" className="icon-button" onClick={() => turn(1)} aria-label="Turn right"><Glyph name="next" /></button>
      </div>
      <div className="paper house-note" aria-live="polite">
        <p className="record-kicker">{current.label}</p>
        {current.image ? <img src={current.image} alt="A botanical engraving of a tall flower with bell-shaped blooms" className="house-note-image" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> : null}
        <p>{current.text}</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- Clues, media

export function CluesScene({ scene }: SceneProps<'clues'>) {
  return (
    <div className="clues">
      {scene.clues.map((clue, i) => (
        <section key={i} className="paper clue">
          {clue.image ? <img src={clue.image} alt="" className="clue-image" loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> : clue.glyph ? <Glyph name={clue.glyph} size={30} className="clue-glyph" /> : null}
          <h3 className="clue-title">{clue.title}</h3>
          <p>{clue.text}</p>
        </section>
      ))}
      {scene.record ? <RecordCard record={scene.record} /> : null}
    </div>
  );
}

export function MediaScene({ scene }: SceneProps<'media'>) {
  return (
    <div className="media-scene">
      {scene.mediaUrl ? (
        <figure className="media-frame">
          {scene.mediaType === 'video' ? (
            <video src={scene.mediaUrl} controls playsInline preload="metadata" />
          ) : (
            <audio src={scene.mediaUrl} controls preload="metadata" />
          )}
          <figcaption>A recording from the Junior Investigators. The case files below say the same thing in writing.</figcaption>
        </figure>
      ) : null}
      <section className="paper case-files" aria-label={scene.transcriptTitle}>
        <p className="record-kicker">{scene.transcriptTitle}</p>
        {scene.transcript.map((line, i) => <p key={i}>{line}</p>)}
      </section>
    </div>
  );
}

export function Scene({ scene, onReady, ready }: { scene: SceneSpec; onReady: () => void; ready: boolean }) {
  switch (scene.kind) {
    case 'envelope': return <EnvelopeScene scene={scene} onReady={onReady} ready={ready} />;
    case 'frost': return <FrostScene scene={scene} onReady={onReady} ready={ready} />;
    case 'clock': return <ClockScene scene={scene} onReady={onReady} ready={ready} />;
    case 'postcard': return <PostcardScene scene={scene} onReady={onReady} ready={ready} />;
    case 'house': return <HouseScene scene={scene} onReady={onReady} ready={ready} />;
    case 'clues': return <CluesScene scene={scene} onReady={onReady} ready={ready} />;
    case 'media': return <MediaScene scene={scene} onReady={onReady} ready={ready} />;
    default: return null;
  }
}

/** Scenes that must be explored before the stage appears. */
export function sceneGates(scene: SceneSpec): boolean {
  return scene.kind === 'envelope' || scene.kind === 'frost' || scene.kind === 'clock' || scene.kind === 'postcard';
}
