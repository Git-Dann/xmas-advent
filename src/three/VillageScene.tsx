import { useEffect, useRef, useState } from 'react';
import type { CalendarDay } from '../../shared/api';
import { useGame } from '../lib/game';
import { useReducedMotion } from '../lib/prefs';
import type { HouseState, VillageHandle } from './village';

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(canvas.getContext('webgl2') ?? canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

/**
 * Mounts the Three.js village on demand. Three.js is loaded as a separate chunk only here, so
 * the app shell stays small. Without WebGL, or after a lost context, the illustrated CSS
 * fallback is shown and every bit of gameplay still works through the doors below.
 */
export function VillageScene({ days, focusDay, mode = 'village' }: { days: CalendarDay[]; focusDay?: number | null; mode?: 'village' | 'christmas' }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const handle = useRef<VillageHandle | null>(null);
  const reduced = useReducedMotion();
  const { calendar } = useGame();
  const [status, setStatus] = useState<'loading' | 'ready' | 'fallback'>(() => (webglAvailable() ? 'loading' : 'fallback'));
  const [generation, setGeneration] = useState(0);

  useEffect(() => {
    if (status === 'fallback' || !canvasRef.current) return;
    let cancelled = false;
    const canvas = canvasRef.current;
    import('./village')
      .then(({ createVillage }) => {
        if (cancelled) return;
        handle.current = createVillage(canvas, {
          reducedMotion: reduced,
          mode,
          onContextLost: () => {
            handle.current?.dispose();
            handle.current = null;
            setStatus('fallback');
            // Try once to rebuild when the browser restores the context.
            canvas.addEventListener('webglcontextrestored', () => {
              setStatus('loading');
              setGeneration((g) => g + 1);
            }, { once: true });
          },
        });
        setStatus('ready');
      })
      .catch(() => setStatus('fallback'));
    const observer = new ResizeObserver(() => handle.current?.resize());
    observer.observe(canvas);
    return () => {
      cancelled = true;
      observer.disconnect();
      handle.current?.dispose();
      handle.current = null;
    };
    // Rebuild only on mode change or after context restoration.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, generation, status === 'fallback']);

  useEffect(() => {
    handle.current?.setStates(days.map((d) => d.state as HouseState), Boolean(calendar?.hasChristmasKey));
  }, [days, calendar?.hasChristmasKey, status]);

  useEffect(() => {
    handle.current?.setReducedMotion(reduced);
  }, [reduced]);

  useEffect(() => {
    if (focusDay) handle.current?.focus(focusDay);
  }, [focusDay]);

  return (
    <div className={`scene scene-${status}`} aria-hidden="true">
      {status !== 'fallback' ? <canvas ref={canvasRef} className="scene-canvas" /> : <div className="village-fallback" />}
    </div>
  );
}
