import { useEffect, useState } from 'react';
import type { EvidenceDetail, EvidenceFace } from '../../shared/api';
import { audio } from '../audio/engine';
import { api } from '../lib/api';
import { Glyph } from './Glyph';
import { Seal } from './Seal';
import { Dialog, Spinner, announce } from './ui';

/**
 * The reusable evidence-inspection interface. Only actions that make sense for the object are
 * shown (the server decides which: turn, rotate, zoom, lamp overlay, reveal, listen).
 */
export function EvidenceViewer({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [detail, setDetail] = useState<EvidenceDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [side, setSide] = useState<'front' | 'back'>('front');
  const [zoom, setZoom] = useState(false);
  const [lamp, setLamp] = useState(false);
  const [tilt, setTilt] = useState(0);

  useEffect(() => {
    setDetail(null);
    setError(null);
    setSide('front');
    setZoom(false);
    setLamp(false);
    setTilt(0);
    if (!id) return;
    const controller = new AbortController();
    api<EvidenceDetail>(`/api/archive/${id}`, { signal: controller.signal })
      .then((d) => {
        setDetail(d);
        void audio.play(d.kind === 'letter' || d.kind === 'note' || d.kind === 'record' ? 'paper.rustle' : 'object.pickup');
      })
      .catch((err: Error) => {
        if (err.name !== 'AbortError') setError(err.message);
      });
    return () => controller.abort();
  }, [id]);

  const has = (action: string) => detail?.actions.includes(action as never) ?? false;
  const layersFor = (face: 'front' | 'back') =>
    (detail?.layers ?? []).filter((l) => l.face === face && (l.id !== 'lamp-words' || lamp));

  return (
    <Dialog open={id !== null} onClose={onClose} label={detail ? detail.title : 'Evidence'} className="evidence-dialog">
      <div className="evidence-viewer">
        <header className="evidence-header">
          <div>
            <p className="eyebrow">{detail ? `Day ${detail.day} · ${detail.kind}` : 'Evidence'}</p>
            <h2>{detail?.title ?? 'Opening…'}</h2>
          </div>
          <button type="button" className="icon-button" onClick={() => { void audio.play('ui.close'); onClose(); }} aria-label="Close">
            <Glyph name="close" />
          </button>
        </header>
        {error ? <p className="notice notice-gentle">{error}</p> : null}
        {!detail && !error ? <Spinner label="Opening the evidence" /> : null}
        {detail ? (
          <>
            <p className="evidence-description">{detail.description}</p>
            <div className={`evidence-stage${zoom ? ' is-zoomed' : ''}`}>
              <div
                className={`evidence-object kind-${detail.kind}${side === 'back' ? ' is-flipped' : ''}${lamp ? ' is-lamp' : ''}`}
                style={{ '--tilt': `${tilt}deg` } as React.CSSProperties}
              >
                <Face face={detail.front} layers={layersFor('front')} detail={detail} which="front" hidden={side !== 'front'} />
                {detail.back ? <Face face={detail.back} layers={layersFor('back')} detail={detail} which="back" hidden={side !== 'back'} /> : null}
              </div>
              {lamp ? <div className="lamp-beam" aria-hidden="true" /> : null}
            </div>
            <div className="evidence-actions" role="toolbar" aria-label="Inspect">
              {has('turn') ? (
                <button type="button" className="action" onClick={() => { setSide(side === 'front' ? 'back' : 'front'); void audio.play('paper.rustle'); announce(side === 'front' ? 'Showing the back' : 'Showing the front'); }}>
                  <Glyph name="turn" /> {side === 'front' ? 'Turn over' : 'Turn back'}
                </button>
              ) : null}
              {has('rotate') ? (
                <button type="button" className="action" onClick={() => { setTilt((t) => (t + 30) % 360); void audio.play('object.rotate'); }}>
                  <Glyph name="rotate" /> Rotate
                </button>
              ) : null}
              <button type="button" className="action" aria-pressed={zoom} onClick={() => { setZoom(!zoom); void audio.play('object.inspect'); }}>
                <Glyph name="zoom" /> {zoom ? 'Zoom out' : 'Zoom in'}
              </button>
              {has('overlay') ? (
                <button type="button" className="action action-lamp" aria-pressed={lamp} onClick={() => {
                  const next = !lamp;
                  setLamp(next);
                  void audio.play(next ? 'secret.reveal' : 'ui.close');
                  if (next) announce(side === 'back' ? 'The lamp reveals hidden writing.' : 'The lamp is on. Try the other side.');
                }}>
                  <Glyph name="lamp" /> {lamp ? 'Lamp off' : 'Use the lamp'}
                </button>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </Dialog>
  );
}

function Face({ face, layers, detail, which, hidden }: { face: EvidenceFace; layers: EvidenceDetail['layers']; detail: EvidenceDetail; which: 'front' | 'back'; hidden: boolean }) {
  return (
    <div className={`evidence-face face-${which}`} aria-hidden={hidden}>
      {detail.kind === 'seal' && which === 'front' ? <Seal kind={detail.glyph ?? 'star'} size={120} /> : null}
      {detail.kind === 'key' && detail.id === 'christmas-key' && which === 'front' ? <div className="gold-key" aria-hidden="true"><Glyph name="key" size={96} /></div> : null}
      {face.heading ? <h3 className="evidence-heading">{face.heading}</h3> : null}
      {face.image ? <img className="evidence-image" src={face.image} alt={face.imageAlt ?? ''} loading="lazy" onError={(e) => (e.currentTarget.style.display = 'none')} /> : null}
      {face.fields?.length ? (
        <dl className="record-fields">
          {face.fields.map((f) => <div key={f.label}><dt>{f.label}</dt><dd>{f.value}</dd></div>)}
        </dl>
      ) : null}
      {face.lines.map((line, i) => <p key={i}>{line}</p>)}
      {layers.map((layer) => (
        <div key={layer.id} className={`evidence-layer layer-${layer.id}`}>
          <p className="record-kicker">{layer.label}</p>
          {layer.lines.map((line, i) => <p key={i}>{line}</p>)}
        </div>
      ))}
      {face.mediaUrl ? (
        face.mediaType === 'image' ? <img className="evidence-photo" src={face.mediaUrl} alt="A family photograph" loading="lazy" />
          : face.mediaType === 'video' ? <video src={face.mediaUrl} controls playsInline preload="metadata" />
            : <audio src={face.mediaUrl} controls preload="metadata" />
      ) : null}
    </div>
  );
}
