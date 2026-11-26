import { useCallback, useEffect, useId, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import type { ArchiveResponse, EvidenceSummary, OptionSpec, StageSpec } from '../../shared/api';
import { audio } from '../audio/engine';
import { Glyph } from '../components/Glyph';
import { Seal } from '../components/Seal';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { clearDraft, readDraft, useDrag, writeDraft } from './drag';

export interface StageProps<K extends StageSpec['kind']> {
  spec: Extract<StageSpec, { kind: K }>;
  day: number;
  busy: boolean;
  /** Sends the answer to the server. Resolves true only when the server says it is correct. */
  submit: (answer: unknown) => Promise<boolean>;
}

function useDraftState<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => readDraft(key, initial));
  const set = useCallback((next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const resolved = typeof next === 'function' ? (next as (p: T) => T)(prev) : next;
      writeDraft(key, resolved);
      return resolved;
    });
  }, [key]);
  return [value, set] as const;
}

function SubmitRow({ busy, disabled, label = 'Try this answer', children }: { busy: boolean; disabled?: boolean; label?: string; children?: ReactNode }) {
  return (
    <div className="submit-row">
      {children}
      <Button type="submit" busy={busy} disabled={busy || disabled} sound="ui.press">
        {busy ? 'Checking…' : label}
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------- Text

export function TextStage({ spec, day, busy, submit }: StageProps<'text'>) {
  const key = `${day}.${spec.id}`;
  const [value, setValue] = useDraftState(key, '');
  const id = useId();
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!value.trim()) return;
    if (await submit(value)) clearDraft(key);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <label className="field-label" htmlFor={id}>{spec.label}</label>
      <input
        id={id}
        className="input"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={spec.placeholder}
        inputMode={spec.inputMode ?? 'text'}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="words"
        spellCheck={false}
        enterKeyHint="done"
      />
      <SubmitRow busy={busy} disabled={!value.trim()} />
    </form>
  );
}

// ---------------------------------------------------------------- Code (wheels or typed)

function Wheel({ value, onChange, label, size = 'large' }: { value: number; onChange: (v: number) => void; label: string; size?: 'large' | 'small' }) {
  const drag = useRef<{ y: number; start: number } | null>(null);
  const step = (delta: number) => {
    onChange((value + delta + 10) % 10);
    void audio.play('dial.tick');
  };
  const onKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'ArrowUp') { event.preventDefault(); step(1); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); step(-1); }
    else if (/^\d$/.test(event.key)) { onChange(Number(event.key)); void audio.play('dial.tick'); }
  };
  return (
    <div className={`wheel wheel-${size}`}>
      <button type="button" className="wheel-btn" aria-label={`${label}: up`} tabIndex={-1} onClick={() => step(1)}>
        <Glyph name="back" size={18} style={{ transform: 'rotate(90deg)' }} />
      </button>
      <div
        className="wheel-window"
        role="spinbutton"
        tabIndex={0}
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={9}
        aria-valuenow={value}
        onKeyDown={onKey}
        onPointerDown={(e) => {
          drag.current = { y: e.clientY, start: value };
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (!drag.current) return;
          const delta = Math.round((drag.current.y - e.clientY) / 28);
          const next = (((drag.current.start + delta) % 10) + 10) % 10;
          if (next !== value) {
            onChange(next);
            void audio.play('dial.tick');
          }
        }}
        onPointerUp={() => {
          if (drag.current) void audio.play('ui.release');
          drag.current = null;
        }}
        onPointerCancel={() => (drag.current = null)}
      >
        <span className="wheel-digit wheel-prev" aria-hidden="true">{(value + 9) % 10}</span>
        <span className="wheel-digit wheel-current" key={value}>{value}</span>
        <span className="wheel-digit wheel-next" aria-hidden="true">{(value + 1) % 10}</span>
      </div>
      <button type="button" className="wheel-btn" aria-label={`${label}: down`} tabIndex={-1} onClick={() => step(-1)}>
        <Glyph name="back" size={18} style={{ transform: 'rotate(-90deg)' }} />
      </button>
    </div>
  );
}

export function CodeStage({ spec, day, busy, submit }: StageProps<'code'>) {
  const key = `${day}.${spec.id}`;
  const [digits, setDigits] = useDraftState<number[]>(`${key}.wheels`, Array(spec.digits).fill(0));
  const [typed, setTyped] = useDraftState(`${key}.typed`, '');
  const [mode, setMode] = useState<'wheels' | 'type'>(spec.wheels ? 'wheels' : 'type');
  const id = useId();
  const groups = spec.format?.split(' ').map((g) => g.length) ?? [spec.digits];
  const value = mode === 'wheels' ? digits.join('') : typed;
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (value.length !== spec.digits) return;
    void audio.play('lock.engage');
    if (await submit(value)) {
      clearDraft(`${key}.wheels`);
      clearDraft(`${key}.typed`);
    }
  }
  let offset = 0;
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      {mode === 'wheels' ? (
        <fieldset className="lock">
          <legend className="field-label">{spec.label}</legend>
          <div className="lock-plate">
            {groups.map((length, g) => {
              const start = offset;
              offset += length;
              return (
                <div className="lock-group" key={g}>
                  {Array.from({ length }, (_, i) => start + i).map((index) => (
                    <Wheel
                      key={index}
                      value={digits[index] ?? 0}
                      label={`Wheel ${index + 1} of ${spec.digits}`}
                      onChange={(v) => setDigits((prev) => prev.map((d, j) => (j === index ? v : d)))}
                    />
                  ))}
                </div>
              );
            })}
          </div>
          {spec.format ? <p className="lock-format" aria-hidden="true">{spec.format}</p> : null}
        </fieldset>
      ) : (
        <>
          <label className="field-label" htmlFor={id}>{spec.label}{spec.format ? ` (${spec.format})` : ''}</label>
          <input
            id={id}
            className="input input-code"
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/\D/g, '').slice(0, spec.digits))}
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            maxLength={spec.digits}
            placeholder={'0'.repeat(spec.digits)}
            enterKeyHint="done"
          />
        </>
      )}
      <SubmitRow busy={busy} disabled={value.length !== spec.digits} label={spec.wheels ? 'Try the lock' : 'Try this answer'}>
        {spec.wheels ? (
          <button type="button" className="btn btn-quiet btn-small" onClick={() => setMode(mode === 'wheels' ? 'type' : 'wheels')}>
            {mode === 'wheels' ? 'Type the numbers instead' : 'Use the wheels'}
          </button>
        ) : null}
      </SubmitRow>
    </form>
  );
}

// ---------------------------------------------------------------- Dials (two birth years)

export function DialsStage({ spec, day, busy, submit }: StageProps<'dials'>) {
  const key = `${day}.${spec.id}`;
  const [values, setValues] = useDraftState<Record<string, number[]>>(key, Object.fromEntries(spec.dials.map((d) => [d.id, Array(d.digits).fill(0)])));
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const answer = Object.fromEntries(spec.dials.map((d) => [d.id, d.prefix + (values[d.id] ?? []).join('')]));
    if (await submit(answer)) clearDraft(key);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className="dials">
        {spec.dials.map((dial) => (
          <fieldset key={dial.id} className="dial-card">
            <legend className="field-label">{dial.label}</legend>
            <div className="dial-row">
              <span className="dial-prefix" aria-hidden="true">{dial.prefix}</span>
              {Array.from({ length: dial.digits }, (_, i) => (
                <Wheel
                  key={i}
                  size="small"
                  label={`${dial.label}, digit ${i + 3}`}
                  value={values[dial.id]?.[i] ?? 0}
                  onChange={(v) => setValues((prev) => ({ ...prev, [dial.id]: (prev[dial.id] ?? []).map((d, j) => (j === i ? v : d)) }))}
                />
              ))}
            </div>
            <p className="visually-hidden">Year: {dial.prefix}{(values[dial.id] ?? []).join('')}</p>
          </fieldset>
        ))}
      </div>
      <SubmitRow busy={busy} label="Complete the records" />
    </form>
  );
}

// ---------------------------------------------------------------- Choice

export function ChoiceStage({ spec, day, busy, submit }: StageProps<'choice'>) {
  const [selected, setSelected] = useState<string | null>(null);
  const [text, setText] = useDraftState(`${day}.${spec.id}.text`, '');
  const id = useId();
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    const answer = selected ?? text.trim();
    if (!answer) return;
    await submit(answer);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className={`choices choices-${spec.layout ?? 'grid'}`} role="radiogroup" aria-label={spec.prompt}>
        {spec.options.map((option) => (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={selected === option.id}
            className={`choice${selected === option.id ? ' is-selected' : ''}`}
            onClick={() => {
              setSelected(selected === option.id ? null : option.id);
              setText('');
              void audio.play('ui.tap');
            }}
          >
            <span className="choice-label">{option.label}</span>
            {option.description ? <span className="choice-desc">{option.description}</span> : null}
          </button>
        ))}
      </div>
      {spec.allowText ? (
        <div className="alt-input">
          <label className="field-label" htmlFor={id}>{spec.textLabel ?? 'Or type your answer'}</label>
          <input id={id} className="input" value={text} onChange={(e) => { setText(e.target.value); setSelected(null); }} autoComplete="off" autoCorrect="off" spellCheck={false} />
        </div>
      ) : null}
      <SubmitRow busy={busy} disabled={!selected && !text.trim()} />
    </form>
  );
}

// ---------------------------------------------------------------- Tiles (ordered words)

export function TilesStage({ spec, day, busy, submit }: StageProps<'tiles'>) {
  const [slots, setSlots] = useState<(string | null)[]>(Array(spec.slots).fill(null));
  const [text, setText] = useDraftState(`${day}.${spec.id}.text`, '');
  const id = useId();
  const byId = useMemo(() => new Map(spec.tiles.map((t) => [t.id, t])), [spec.tiles]);
  const place = useCallback((tileId: string, slotIndex?: number) => {
    setSlots((prev) => {
      const next = prev.map((s) => (s === tileId ? null : s));
      const target = slotIndex ?? next.findIndex((s) => s === null);
      if (target < 0) return prev;
      next[target] = tileId;
      return next;
    });
  }, []);
  const onDrop = useCallback((tileId: string, target: string) => {
    if (target.startsWith('slot-')) place(tileId, Number(target.slice(5)));
  }, [place]);
  const dragStart = useDrag(onDrop);
  const filled = slots.every(Boolean);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (filled) await submit(slots.map((s) => byId.get(s!)!.label));
    else if (text.trim()) await submit(text.trim());
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <ol className="tile-slots" aria-label="Your answer, in order">
        {slots.map((tileId, index) => (
          <li key={index} className={`tile-slot${tileId ? ' is-filled' : ''}`} data-drop={`slot-${index}`}>
            {tileId ? (
              <button type="button" className="tile tile-placed" aria-label={`${byId.get(tileId)?.label}, position ${index + 1}. Tap to remove.`} onClick={() => { setSlots((p) => p.map((s, j) => (j === index ? null : s))); void audio.play('object.pickup'); }}>
                {byId.get(tileId)?.label}
              </button>
            ) : (
              <span className="tile-slot-empty" aria-label={`Position ${index + 1}, empty`}>{index + 1}</span>
            )}
          </li>
        ))}
      </ol>
      <ul className="tile-pool" aria-label="Pieces">
        {spec.tiles.map((tile) => {
          const used = slots.includes(tile.id);
          return (
            <li key={tile.id}>
              <button
                type="button"
                className={`tile${used ? ' is-used' : ''}`}
                disabled={used}
                onPointerDown={used ? undefined : dragStart(tile.id)}
                onClick={() => { place(tile.id); void audio.play('object.place'); }}
              >
                {tile.label}
              </button>
            </li>
          );
        })}
      </ul>
      {spec.allowText ? (
        <div className="alt-input">
          <label className="field-label" htmlFor={id}>{spec.textLabel ?? 'Or type it'}</label>
          <input id={id} className="input" value={text} onChange={(e) => setText(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck={false} />
        </div>
      ) : null}
      <SubmitRow busy={busy} disabled={!filled && !text.trim()}>
        <button type="button" className="btn btn-quiet btn-small" onClick={() => setSlots(Array(spec.slots).fill(null))} disabled={!slots.some(Boolean)}>Clear</button>
      </SubmitRow>
    </form>
  );
}

// ---------------------------------------------------------------- Placement (pieces into slots)

function OptionFace({ option }: { option: OptionSpec }) {
  return (
    <>
      {option.glyph ? (['star', 'moon', 'home', 'heart'].includes(option.glyph) ? <Seal kind={option.glyph} size={52} /> : <Glyph name={option.glyph} />) : null}
      <span className="piece-label">{option.label}</span>
      {option.description ? <span className="piece-desc">{option.description}</span> : null}
    </>
  );
}

export function PlacementStage({ spec, busy, submit }: StageProps<'placement'>) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const byId = useMemo(() => new Map(spec.pieces.map((p) => [p.id, p])), [spec.pieces]);
  const emblem = spec.slots.every((s) => s.glyph);
  const assign = useCallback((pieceId: string, slotId: string) => {
    setMapping((prev) => {
      const next: Record<string, string> = {};
      for (const [k, v] of Object.entries(prev)) if (v !== pieceId && k !== slotId) next[k] = v;
      next[slotId] = pieceId;
      return next;
    });
    setSelected(null);
  }, []);
  const dragStart = useDrag(useCallback((pieceId: string, target: string) => assign(pieceId, target), [assign]));
  const placed = new Set(Object.values(mapping));
  const complete = spec.slots.every((slot) => mapping[slot.id]);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (!complete) return;
    await submit(mapping);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <p className="stage-instruction">{selected ? `Now choose where "${byId.get(selected)?.label}" goes.` : 'Choose a piece, then choose its place. You can also drag.'}</p>
      <ul className={`placement-slots${emblem ? ' placement-emblem' : ''}`} aria-label="Places">
        {spec.slots.map((slot) => {
          const piece = mapping[slot.id] ? byId.get(mapping[slot.id]!) : undefined;
          return (
            <li key={slot.id} className={`placement-slot-wrap${slot.glyph ? ` slot-glyph-${slot.glyph}` : ""}`}>
              <button
                type="button"
                className={`placement-slot${piece ? ' is-filled' : ''}${selected ? ' is-ready' : ''}`}
                data-drop={slot.id}
                aria-label={`${slot.label}${piece ? `: ${piece.label}. Tap to remove.` : selected ? '. Tap to place here.' : ', empty'}`}
                onClick={() => {
                  if (selected) {
                    assign(selected, slot.id);
                    void audio.play('object.place');
                  } else if (piece) {
                    setMapping((prev) => {
                      const { [slot.id]: _, ...rest } = prev;
                      return rest;
                    });
                    void audio.play('object.pickup');
                  }
                }}
              >
                {piece ? <OptionFace option={piece} /> : slot.glyph ? <span className="slot-outline"><Glyph name={slot.glyph} size={34} /></span> : <span className="slot-name">{slot.label}</span>}
              </button>
              {!emblem || !piece ? <span className="slot-caption" aria-hidden="true">{emblem ? '' : slot.label}</span> : null}
            </li>
          );
        })}
        {emblem ? <li className="emblem-centre" aria-hidden="true"><Glyph name="key" size={28} /></li> : null}
      </ul>
      <ul className="placement-pool" aria-label="Pieces">
        {spec.pieces.map((piece) => (
          <li key={piece.id}>
            <button
              type="button"
              className={`piece${selected === piece.id ? ' is-selected' : ''}${placed.has(piece.id) ? ' is-placed' : ''}`}
              aria-pressed={selected === piece.id}
              onPointerDown={dragStart(piece.id)}
              onClick={() => {
                setSelected(selected === piece.id ? null : piece.id);
                void audio.play('object.pickup');
              }}
            >
              <OptionFace option={piece} />
              {placed.has(piece.id) ? <span className="visually-hidden"> (placed)</span> : null}
            </button>
          </li>
        ))}
      </ul>
      <SubmitRow busy={busy} disabled={!complete} label={emblem ? 'Set the seals' : 'Check the order'} />
    </form>
  );
}

// ---------------------------------------------------------------- Sorting (items into bins)

export function SortingStage({ spec, busy, submit }: StageProps<'sorting'>) {
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const assign = useCallback((item: string, bin: string) => setMapping((prev) => ({ ...prev, [item]: bin })), []);
  const dragStart = useDrag(assign);
  const complete = spec.items.every((item) => mapping[item.id]);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (complete) await submit(mapping);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className="sort-bins">
        {spec.bins.map((bin) => (
          <section key={bin.id} className="sort-bin" data-drop={bin.id} aria-label={bin.label}>
            <h3 className="sort-bin-title">{bin.label}</h3>
            <ul className="sort-bin-items">
              {spec.items.filter((item) => mapping[item.id] === bin.id).map((item) => (
                <li key={item.id} className="sort-chip"><Glyph name={item.glyph ?? 'note'} size={18} />{item.label}</li>
              ))}
            </ul>
          </section>
        ))}
      </div>
      <ul className="sort-items" aria-label="Objects to sort">
        {spec.items.map((item) => (
          <li key={item.id} className={`sort-item${mapping[item.id] ? ' is-sorted' : ''}`}>
            <span className="sort-item-name" onPointerDown={dragStart(item.id)}>
              <Glyph name={item.glyph ?? 'note'} />
              {item.label}
            </span>
            <span className="sort-item-actions" role="group" aria-label={`Sort ${item.label}`}>
              {spec.bins.map((bin, index) => (
                <button
                  key={bin.id}
                  type="button"
                  className="btn btn-small btn-secondary"
                  aria-pressed={mapping[item.id] === bin.id}
                  aria-label={`${item.label}: ${bin.label}`}
                  onClick={() => { assign(item.id, bin.id); void audio.play('object.place'); }}
                >
                  {index === 0 ? 'Loves' : 'Dislikes'}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
      <SubmitRow busy={busy} disabled={!complete} label="Close the box" />
    </form>
  );
}

// ---------------------------------------------------------------- Fields (structured choices)

export function FieldsStage({ spec, day, busy, submit }: StageProps<'fields'>) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [freeText, setFreeText] = useDraftState(`${day}.${spec.id}.free`, '');
  const [mode, setMode] = useState<'build' | 'write'>('build');
  const id = useId();
  const complete = spec.fields.every((f) => values[f.id]);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (mode === 'write') {
      if (freeText.trim()) await submit(freeText.trim());
    } else if (complete) {
      await submit(values);
    }
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      {mode === 'build' ? (
        spec.sentence ? (
          <p className="sentence">
            {spec.fields.map((field) => (
              <label key={field.id} className="sentence-slot">
                <span className="visually-hidden">{field.label}</span>
                {field.type === 'choice' ? (
                  <select className="select" value={values[field.id] ?? ''} onChange={(e) => { setValues((p) => ({ ...p, [field.id]: e.target.value })); void audio.play('ui.tap'); }}>
                    <option value="" disabled>{field.label}…</option>
                    {field.options.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
                  </select>
                ) : null}
              </label>
            ))}
            <span aria-hidden="true">.</span>
          </p>
        ) : (
          spec.fields.map((field) => (
            <fieldset key={field.id} className="field-group">
              <legend className="field-label">{field.label}</legend>
              {field.type === 'choice' ? (
                <div className="choices choices-grid" role="radiogroup" aria-label={field.label}>
                  {field.options.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      role="radio"
                      aria-checked={values[field.id] === o.id}
                      className={`choice choice-ticket${values[field.id] === o.id ? ' is-selected' : ''}`}
                      onClick={() => { setValues((p) => ({ ...p, [field.id]: o.id })); void audio.play('paper.rustle'); }}
                    >
                      <span className="choice-label">{o.label}</span>
                    </button>
                  ))}
                </div>
              ) : (
                <input className="input" value={values[field.id] ?? ''} onChange={(e) => setValues((p) => ({ ...p, [field.id]: e.target.value }))} />
              )}
            </fieldset>
          ))
        )
      ) : (
        <div className="alt-input">
          <label className="field-label" htmlFor={id}>{spec.textAlternative?.label}</label>
          <input id={id} className="input" value={freeText} onChange={(e) => setFreeText(e.target.value)} autoComplete="off" spellCheck={false} />
        </div>
      )}
      <SubmitRow busy={busy} disabled={mode === 'build' ? !complete : !freeText.trim()}>
        {spec.textAlternative ? (
          <button type="button" className="btn btn-quiet btn-small" onClick={() => setMode(mode === 'build' ? 'write' : 'build')}>
            {mode === 'build' ? 'Write it instead' : 'Build the sentence'}
          </button>
        ) : null}
      </SubmitRow>
    </form>
  );
}

// ---------------------------------------------------------------- Date (calendar picker)

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function DateStage({ spec, day, busy, submit }: StageProps<'date'>) {
  const [month, setMonth] = useState(1);
  const [picked, setPicked] = useState<{ day: number; month: number } | null>(null);
  const [text, setText] = useDraftState(`${day}.${spec.id}.text`, '');
  const id = useId();
  const daysInMonth = new Date(Date.UTC(spec.year, month, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(spec.year, month - 1, 1)).getUTCDay() + 6) % 7; // Monday first
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (picked) await submit(picked);
    else if (text.trim()) await submit(text.trim());
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className="calendar-picker" aria-label={spec.label}>
        <div className="calendar-picker-head">
          <button type="button" className="icon-button" aria-label="Previous month" onClick={() => { setMonth(month === 1 ? 12 : month - 1); void audio.play('paper.rustle'); }}>
            <Glyph name="back" />
          </button>
          <p className="calendar-picker-title" aria-live="polite">{MONTHS[month - 1]} {spec.year}</p>
          <button type="button" className="icon-button" aria-label="Next month" onClick={() => { setMonth(month === 12 ? 1 : month + 1); void audio.play('paper.rustle'); }}>
            <Glyph name="next" />
          </button>
        </div>
        <div className="calendar-picker-grid" role="grid" aria-label={`${MONTHS[month - 1]} ${spec.year}`}>
          {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <span key={i} className="cal-dow" aria-hidden="true">{d}</span>)}
          {Array.from({ length: firstWeekday }, (_, i) => <span key={`b${i}`} aria-hidden="true" />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => {
            const isPicked = picked?.day === d && picked.month === month;
            return (
              <button
                key={d}
                type="button"
                className={`cal-day${isPicked ? ' is-selected' : ''}`}
                aria-pressed={isPicked}
                aria-label={`${d} ${MONTHS[month - 1]}`}
                onClick={() => { setPicked({ day: d, month }); setText(''); void audio.play('ui.tap'); }}
              >
                {d}
              </button>
            );
          })}
        </div>
      </div>
      <div className="alt-input">
        <label className="field-label" htmlFor={id}>Or type the date</label>
        <input id={id} className="input" value={text} placeholder="For example, 14 February" onChange={(e) => { setText(e.target.value); setPicked(null); }} autoComplete="off" />
      </div>
      <SubmitRow busy={busy} disabled={!picked && !text.trim()} label={picked ? `Choose ${picked.day} ${MONTHS[picked.month - 1]}` : 'Try this date'} />
    </form>
  );
}

// ---------------------------------------------------------------- Select many (evidence board)

export function SelectManyStage({ spec, busy, submit }: StageProps<'select-many'>) {
  const [chosen, setChosen] = useState<string[]>([]);
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (chosen.length > 0) await submit(chosen);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className="board">
        <div className="board-centre" aria-hidden="true">
          <Glyph name="magnifier" size={28} />
          <span>{spec.centreLabel}</span>
        </div>
        <ul className="board-cards">
          {spec.options.map((option, index) => {
            const on = chosen.includes(option.id);
            return (
              <li key={option.id} className={`board-card-wrap pin-${index % 4}`}>
                <button
                  type="button"
                  className={`board-card${on ? ' is-on' : ''}`}
                  aria-pressed={on}
                  onClick={() => {
                    setChosen(on ? chosen.filter((c) => c !== option.id) : [...chosen, option.id]);
                    void audio.play(on ? 'object.pickup' : 'object.place');
                  }}
                >
                  <span className="board-thread" aria-hidden="true" />
                  <span className="board-card-title">{option.label}</span>
                  {option.description ? <span className="board-card-desc">{option.description}</span> : null}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
      <p className="stage-instruction" aria-live="polite">{chosen.length} {chosen.length === 1 ? 'clue' : 'clues'} connected to the Curator.</p>
      <SubmitRow busy={busy} disabled={chosen.length === 0} label="Connect the evidence" />
    </form>
  );
}

// ---------------------------------------------------------------- Compare (spot the altered record)

export function CompareStage({ spec, day, busy, submit }: StageProps<'compare'>) {
  const [field, setField] = useState<string | null>(null);
  const [value, setValue] = useDraftState(`${day}.${spec.id}`, '');
  const id = useId();
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (field && value.trim()) await submit({ field, value: value.trim() });
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <div className="compare">
        <section className="paper record" aria-label={spec.left.title}>
          <p className="record-kicker">{spec.left.caption}</p>
          <h3>{spec.left.title}</h3>
          <dl className="record-fields">
            {spec.left.fields.map((f) => (
              <div key={f.id}><dt>{f.label}</dt><dd>{f.value}</dd></div>
            ))}
          </dl>
        </section>
        <section className="paper record record-copy" aria-label={spec.right.title}>
          <p className="record-kicker">{spec.right.caption}</p>
          <h3>{spec.right.title}</h3>
          <div className="record-fields" role="radiogroup" aria-label="Select the altered line">
            {spec.right.fields.map((f) => (
              <button
                key={f.id}
                type="button"
                role="radio"
                aria-checked={field === f.id}
                className={`record-line${field === f.id ? ' is-selected' : ''}`}
                onClick={() => { setField(f.id); void audio.play('object.inspect'); }}
              >
                <span className="record-line-label">{f.label}</span>
                <span className="record-line-value">{f.value}</span>
              </button>
            ))}
          </div>
        </section>
      </div>
      <div className="alt-input">
        <label className="field-label" htmlFor={id}>{spec.valueLabel}</label>
        <input id={id} className="input" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="off" inputMode="text" disabled={!field} placeholder={field ? '' : 'Select a line first'} />
      </div>
      <SubmitRow busy={busy} disabled={!field || !value.trim()} label="Correct the record" />
    </form>
  );
}

// ---------------------------------------------------------------- Evidence slots

export function EvidenceSlotsStage({ spec, day, busy, submit }: StageProps<'evidence-slots'>) {
  const [archive, setArchive] = useState<EvidenceSummary[]>([]);
  const [values, setValues] = useState<Record<string, { evidence?: string; text?: string }>>({});
  const [picking, setPicking] = useState<string | null>(null);
  useEffect(() => {
    api<ArchiveResponse>('/api/archive').then((a) => setArchive(a.evidence)).catch(() => setArchive([]));
  }, []);
  const byId = new Map(archive.map((e) => [e.id, e]));
  const complete = spec.slots.every((s) => values[s.id]?.evidence || values[s.id]?.text?.trim());
  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    if (complete) await submit(values);
  }
  return (
    <form className="stage-form" onSubmit={onSubmit}>
      <ul className="evidence-slots">
        {spec.slots.map((slot) => {
          const v = values[slot.id];
          const ev = v?.evidence ? byId.get(v.evidence) : undefined;
          return (
            <li key={slot.id} className={`evidence-slot${ev || v?.text ? ' is-filled' : ''}`}>
              <p className="evidence-slot-label">{slot.label}</p>
              <p className="evidence-slot-hint">{slot.hint}</p>
              {ev ? (
                <button type="button" className="evidence-chip is-placed" onClick={() => setValues((p) => ({ ...p, [slot.id]: {} }))} aria-label={`${ev.title} placed in ${slot.label}. Tap to remove.`}>
                  <Glyph name={ev.glyph ?? 'note'} size={18} /> {ev.title}
                </button>
              ) : (
                <>
                  <button type="button" className="btn btn-secondary btn-small" aria-expanded={picking === slot.id} onClick={() => setPicking(picking === slot.id ? null : slot.id)}>
                    Choose from the Archive
                  </button>
                  {picking === slot.id ? (
                    <ul className="evidence-picker" aria-label={`Evidence for ${slot.label}`}>
                      {archive.map((item) => (
                        <li key={item.id}>
                          <button type="button" className="evidence-chip" onClick={() => { setValues((p) => ({ ...p, [slot.id]: { evidence: item.id } })); setPicking(null); void audio.play('object.place'); }}>
                            <Glyph name={item.glyph ?? 'note'} size={18} /> {item.title}
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <label className="field-label" htmlFor={`${day}-${slot.id}`}>Or type it</label>
                  <input
                    id={`${day}-${slot.id}`}
                    className="input"
                    inputMode={slot.inputMode ?? 'text'}
                    value={v?.text ?? ''}
                    onChange={(e) => setValues((p) => ({ ...p, [slot.id]: { text: e.target.value } }))}
                    autoComplete="off"
                  />
                </>
              )}
            </li>
          );
        })}
      </ul>
      <SubmitRow busy={busy} disabled={!complete} label="Try the lock" />
    </form>
  );
}
