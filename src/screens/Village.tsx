import { useEffect, useState } from 'react';
import type { CalendarDay } from '../../shared/api';
import { audio } from '../audio/engine';
import { Glyph } from '../components/Glyph';
import { Seal } from '../components/Seal';
import { Spinner } from '../components/ui';
import { formatDay, useGame } from '../lib/game';
import { prefersReducedMotion, usePrefs } from '../lib/prefs';
import { Link, navigate } from '../lib/router';
import { VillageScene } from '../three/VillageScene';

const STATE_LABEL: Record<CalendarDay['state'], string> = {
  future: 'Not yet open',
  locked: 'Waiting for an earlier door',
  available: 'Ready to open',
  in_progress: 'In progress',
  complete: 'Complete',
};

export function VillageScreen() {
  const { calendar, refresh } = useGame();
  const prefs = usePrefs();
  const [view, setView] = useState<'doors' | 'list'>('doors');
  const [opening, setOpening] = useState<number | null>(null);
  const [focusDay, setFocusDay] = useState<number | null>(null);

  useEffect(() => {
    void refresh();
    void audio.startAmbient('ambient.winter');
  }, [refresh]);

  if (!calendar) {
    return <div className="screen-loading"><Spinner label="Lighting the village" /></div>;
  }

  const next = calendar.days.find((d) => d.state === 'available' || d.state === 'in_progress');
  const done = calendar.completedCount;

  function open(day: CalendarDay) {
    if (day.state === 'future' || day.state === 'locked') {
      void audio.play('ui.error.soft');
      return;
    }
    setFocusDay(day.day);
    if (prefersReducedMotion()) {
      navigate(`/day/${day.day}`);
      return;
    }
    void audio.play(day.state === 'complete' ? 'door.open' : 'door.unlock');
    setOpening(day.day);
    window.setTimeout(() => navigate(`/day/${day.day}`), 520);
  }

  return (
    <div className="village">
      <section className="village-hero" aria-labelledby="village-title">
        {prefs.immersive ? <VillageScene days={calendar.days} focusDay={focusDay} /> : <div className="village-fallback" aria-hidden="true" />}
        <div className="village-hero-text">
          <p className="eyebrow">{formatDay(calendar.today)}</p>
          <h1 id="village-title">The Village</h1>
          <p className="lede">{statusLine(calendar.days, next, done)}</p>
          {next ? (
            <button type="button" className="btn btn-primary village-cta" onClick={() => open(next)}>
              Open door {next.day}
            </button>
          ) : null}
        </div>
      </section>

      <section className="chapter-seals" aria-label="Chapter seals">
        {(['star', 'moon', 'home', 'heart'] as const).map((kind) => (
          <Seal key={kind} kind={kind} size={44} empty={!calendar.chapterSeals[kind]} label={`${kind} seal ${calendar.chapterSeals[kind] ? 'earned' : 'not yet earned'}`} />
        ))}
        <Link to="/vault" className="chapter-seals-link">The Vault <Glyph name="next" size={16} /></Link>
      </section>

      <section className="calendar" aria-labelledby="calendar-title">
        <div className="calendar-head">
          <h2 id="calendar-title">December</h2>
          <div className="segmented" role="group" aria-label="Calendar view">
            <button type="button" aria-pressed={view === 'doors'} onClick={() => setView('doors')}>Doors</button>
            <button type="button" aria-pressed={view === 'list'} onClick={() => setView('list')}>List</button>
          </div>
        </div>

        {view === 'doors' ? (
          <ol className="doors" aria-label="Advent doors">
            {calendar.days.map((day) => (
              <li key={day.day} className={`door-cell${day.day === 25 ? ' door-cell-25' : ''}`}>
                <button
                  type="button"
                  className={`door is-${day.state}${opening === day.day ? ' is-opening' : ''}`}
                  aria-disabled={day.state === 'future' || day.state === 'locked' ? true : undefined}
                  aria-label={`Door ${day.day}, ${formatDay(day.date)}. ${STATE_LABEL[day.state]}${day.title ? `: ${day.title}` : ''}.`}
                  onClick={() => open(day)}
                >
                  <span className="door-light" aria-hidden="true" />
                  <span className="door-leaf" aria-hidden="true">
                    <span className="door-number">{day.day}</span>
                    {day.day === 25 ? <Glyph name="key" size={20} className="door-key" /> : null}
                    {day.state === 'complete' && day.day !== 25 ? <Glyph name="check" size={14} className="door-check" /> : null}
                  </span>
                </button>
              </li>
            ))}
          </ol>
        ) : (
          <ol className="calendar-list">
            {calendar.days.map((day) => {
              const playable = day.state !== 'future' && day.state !== 'locked';
              return (
                <li key={day.day} className={`calendar-row is-${day.state}`}>
                  <span className="calendar-row-num">{day.day}</span>
                  <span className="calendar-row-body">
                    <span className="calendar-row-title">{day.title ?? (day.state === 'future' ? 'Opens ' + formatDay(day.date) : 'Opens after the doors before it')}</span>
                    <span className="calendar-row-state">{STATE_LABEL[day.state]}</span>
                  </span>
                  {playable ? (
                    <Link to={`/day/${day.day}`} className="btn btn-secondary btn-small" aria-label={`Open day ${day.day}`}>
                      {day.state === 'complete' ? 'Revisit' : 'Open'}
                    </Link>
                  ) : null}
                </li>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function statusLine(days: CalendarDay[], next: CalendarDay | undefined, done: number): string {
  if (done === 25) return 'Every door is open. The collection is complete.';
  if (next) {
    const behind = days.filter((d) => d.state !== 'complete' && d.state !== 'future').length;
    if (next.day === 25) return 'Christmas morning. The vault is waiting.';
    if (behind > 1) return `${behind} doors are waiting. Take them in order, whenever you like.`;
    return done === 0 ? 'The first door is waiting for you.' : 'Tonight\'s door is waiting.';
  }
  const upcoming = days.find((d) => d.state === 'future');
  if (upcoming) return `You are all caught up. The next door opens on ${formatDay(upcoming.date)}.`;
  return 'The village is quiet.';
}
