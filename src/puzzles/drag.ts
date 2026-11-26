import { useCallback, useRef, type PointerEvent as ReactPointerEvent } from 'react';
import { audio } from '../audio/engine';

/**
 * Pointer-based drag and drop that works with touch, pen and mouse. Drop targets are any element
 * with a data-drop attribute. Tap-to-select remains the primary (and accessible) alternative;
 * this only adds a direct-manipulation path on top of it.
 */
export function useDrag(onDrop: (itemId: string, targetId: string) => void) {
  const state = useRef<{ id: string; el: HTMLElement; ghost: HTMLElement; startX: number; startY: number; moved: boolean; over: HTMLElement | null } | null>(null);

  const onPointerDown = useCallback((itemId: string) => (event: ReactPointerEvent<HTMLElement>) => {
    if (event.button !== 0) return;
    const el = event.currentTarget;
    state.current = { id: itemId, el, ghost: el, startX: event.clientX, startY: event.clientY, moved: false, over: null };

    const move = (e: PointerEvent) => {
      const s = state.current;
      if (!s) return;
      const dx = e.clientX - s.startX;
      const dy = e.clientY - s.startY;
      if (!s.moved && Math.hypot(dx, dy) < 8) return;
      if (!s.moved) {
        s.moved = true;
        const rect = s.el.getBoundingClientRect();
        const ghost = s.el.cloneNode(true) as HTMLElement;
        ghost.classList.add('drag-ghost');
        ghost.setAttribute('aria-hidden', 'true');
        Object.assign(ghost.style, { position: 'fixed', left: `${rect.left}px`, top: `${rect.top}px`, width: `${rect.width}px`, height: `${rect.height}px`, pointerEvents: 'none', zIndex: '1000' });
        document.body.appendChild(ghost);
        s.ghost = ghost;
        s.el.classList.add('is-dragging');
        void audio.play('object.pickup');
      }
      s.ghost.style.transform = `translate(${dx}px, ${dy}px) scale(1.04)`;
      const target = (document.elementFromPoint(e.clientX, e.clientY) as HTMLElement | null)?.closest<HTMLElement>('[data-drop]') ?? null;
      if (target !== s.over) {
        s.over?.classList.remove('is-over');
        target?.classList.add('is-over');
        s.over = target;
      }
    };
    const up = () => {
      const s = state.current;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (!s) return;
      if (s.moved) {
        s.ghost.remove();
        s.el.classList.remove('is-dragging');
        s.over?.classList.remove('is-over');
        if (s.over?.dataset.drop) {
          onDrop(s.id, s.over.dataset.drop);
          void audio.play('object.place');
        }
        // Swallow the click that follows a drag.
        const swallow = (e: Event) => {
          e.stopPropagation();
          e.preventDefault();
        };
        s.el.addEventListener('click', swallow, { capture: true, once: true });
        window.setTimeout(() => s.el.removeEventListener('click', swallow, { capture: true }), 50);
      }
      state.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }, [onDrop]);

  return onPointerDown;
}

/** Session-scoped draft storage so typed answers survive a refresh or a dropped connection. */
export function readDraft<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(`k25.draft.${key}`);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function writeDraft(key: string, value: unknown): void {
  try {
    sessionStorage.setItem(`k25.draft.${key}`, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

export function clearDraft(key: string): void {
  try {
    sessionStorage.removeItem(`k25.draft.${key}`);
  } catch {
    /* ignore */
  }
}
