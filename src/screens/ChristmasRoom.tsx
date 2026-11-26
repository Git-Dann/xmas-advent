import { useEffect, useState } from 'react';
import type { FinaleResponse } from '../../shared/api';
import { audio } from '../audio/engine';
import { Glyph } from '../components/Glyph';
import { Spinner } from '../components/ui';
import { api } from '../lib/api';
import { useGame } from '../lib/game';
import { usePrefs } from '../lib/prefs';
import { Link } from '../lib/router';
import { VillageScene } from '../three/VillageScene';

/** The largest payoff: only reachable once Day 25 is complete on the server. */
export function ChristmasRoom() {
  const { calendar } = useGame();
  const prefs = usePrefs();
  const [finale, setFinale] = useState<FinaleResponse | null>(null);
  useEffect(() => {
    api<FinaleResponse>('/api/finale').then(setFinale).catch(() => setFinale({ unlocked: false }));
    void audio.startAmbient('ambient.fireplace');
    return () => audio.stopAmbient();
  }, []);
  if (!finale) return <div className="screen-loading"><Spinner label="Lighting the tree" /></div>;
  if (!finale.unlocked) {
    return (
      <div className="screen-header">
        <h1>Not yet</h1>
        <p className="lede">The Christmas Room opens with the Christmas Key, on Christmas morning.</p>
        <Link to="/vault" className="btn btn-secondary">Visit the Vault</Link>
      </div>
    );
  }
  return (
    <div className="christmas">
      <div className="christmas-scene">
        {calendar && prefs.immersive ? <VillageScene days={calendar.days} mode="christmas" /> : <div className="village-fallback is-christmas" aria-hidden="true" />}
        <div className="christmas-glow" aria-hidden="true" />
      </div>
      <article className="paper christmas-letter" aria-labelledby="christmas-title">
        <p className="record-kicker">{finale.fullTitle ?? 'Christmas morning, 2026'}</p>
        <h1 id="christmas-title">{finale.title}</h1>
        <div className="prose christmas-body">
          {finale.letter?.map((line, i) => <p key={i} style={{ animationDelay: `${600 + i * 450}ms` }}>{line}</p>)}
        </div>
        <p className="christmas-signature">{finale.signature}</p>
        {finale.media && finale.media.length > 0 ? (
          <div className="christmas-media">
            {finale.media.map((m) =>
              m.type === 'image' ? (
                <figure key={m.id} className="christmas-photo">
                  <img src={m.url} alt={m.caption ?? 'A family photograph'} loading="lazy" />
                  {m.caption ? <figcaption>{m.caption}</figcaption> : null}
                </figure>
              ) : m.type === 'video' ? (
                <figure key={m.id} className="christmas-video"><video src={m.url} controls playsInline preload="metadata" />{m.caption ? <figcaption>{m.caption}</figcaption> : null}</figure>
              ) : (
                <figure key={m.id} className="christmas-audio"><audio src={m.url} controls preload="metadata" />{m.caption ? <figcaption>{m.caption}</figcaption> : null}</figure>
              ),
            )}
          </div>
        ) : null}
        {finale.closing ? <p className="christmas-closing"><Glyph name="gift" size={26} /> {finale.closing}</p> : null}
      </article>
      <p className="christmas-after muted">Every memory in the collection is still here. <Link to="/archive">Open the Archive</Link> or <Link to="/">walk back through the village</Link> whenever you like.</p>
    </div>
  );
}
