import { useRef, useState } from 'react';
import { audio } from '../audio/engine';
import { Glyph } from '../components/Glyph';
import { Button, announce } from '../components/ui';
import { useReducedMotion } from '../lib/prefs';
import type { StageProps } from './stages';

/**
 * Christmas morning: carry the key to the vault, insert it, turn it. Drag the key into the lock,
 * or use the buttons. Only the server decides whether the vault opens.
 */
export function KeyStage({ busy, submit }: StageProps<'key'>) {
  const [phase, setPhase] = useState<'ready' | 'inserted' | 'turning' | 'open'>('ready');
  const lockRef = useRef<HTMLDivElement>(null);
  const keyRef = useRef<HTMLButtonElement>(null);
  const drag = useRef<{ x: number; y: number } | null>(null);
  const reduced = useReducedMotion();

  function insert() {
    void audio.play('key.insert');
    setPhase('inserted');
    announce('The key is in the lock. Now turn it.');
  }

  async function turn() {
    setPhase('turning');
    void audio.play('key.turn');
    await new Promise((r) => window.setTimeout(r, reduced ? 0 : 900));
    void audio.play('lock.release');
    const ok = await submit({ evidence: 'christmas-key' });
    if (ok) {
      void audio.play('christmas.reveal');
      setPhase('open');
    } else {
      setPhase('inserted');
    }
  }

  return (
    <div className={`vault-door is-${phase}`}>
      <div className="vault-face">
        {['star', 'moon', 'home', 'heart'].map((s) => <span key={s} className={`vault-socket vault-socket-${s}`}><Glyph name={s} size={22} /></span>)}
        <div className="vault-lock" ref={lockRef} data-drop="lock">
          <span className="vault-keyhole" aria-hidden="true" />
          {phase !== 'ready' ? <span className="vault-key-in" aria-hidden="true"><Glyph name="key" size={40} /></span> : null}
        </div>
        <div className="vault-light" aria-hidden="true" />
      </div>
      {phase === 'ready' ? (
        <>
          <button
            ref={keyRef}
            type="button"
            className="christmas-key-token"
            aria-label="The Christmas Key. Drag it to the lock, or use the button below."
            onPointerDown={(e) => {
              drag.current = { x: e.clientX, y: e.clientY };
              e.currentTarget.setPointerCapture(e.pointerId);
              void audio.play('object.pickup');
            }}
            onPointerMove={(e) => {
              if (!drag.current || !keyRef.current) return;
              keyRef.current.style.transform = `translate(${e.clientX - drag.current.x}px, ${e.clientY - drag.current.y}px) rotate(-20deg)`;
            }}
            onPointerUp={(e) => {
              if (!drag.current || !keyRef.current) return;
              keyRef.current.style.transform = '';
              drag.current = null;
              const rect = lockRef.current?.getBoundingClientRect();
              if (rect && e.clientX > rect.left - 30 && e.clientX < rect.right + 30 && e.clientY > rect.top - 30 && e.clientY < rect.bottom + 30) insert();
            }}
          >
            <Glyph name="key" size={56} />
          </button>
          <Button onClick={insert} sound={null}>Insert the key</Button>
        </>
      ) : null}
      {phase === 'inserted' || phase === 'turning' ? (
        <Button onClick={() => void turn()} busy={busy || phase === 'turning'} disabled={busy || phase === 'turning'} sound={null}>
          {phase === 'turning' ? 'Turning…' : 'Turn the key'}
        </Button>
      ) : null}
    </div>
  );
}
