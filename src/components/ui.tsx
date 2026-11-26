import { forwardRef, useEffect, useRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { audio, type SoundEvent } from '../audio/engine';

type Variant = 'primary' | 'secondary' | 'quiet' | 'paper';

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; sound?: SoundEvent | null; busy?: boolean }>(
  function Button({ variant = 'primary', sound = 'ui.tap', busy, className, onClick, children, disabled, ...rest }, ref) {
    return (
      <button
        ref={ref}
        className={`btn btn-${variant}${busy ? ' is-busy' : ''}${className ? ` ${className}` : ''}`}
        disabled={disabled}
        aria-busy={busy || undefined}
        onClick={(event) => {
          if (sound) void audio.play(sound);
          onClick?.(event);
        }}
        {...rest}
      >
        {children}
      </button>
    );
  },
);

/** Polite announcements for screen readers (answer feedback, rewards, hints). */
let announcer: ((text: string) => void) | null = null;
export function announce(text: string) {
  announcer?.(text);
}

export function LiveRegion() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    announcer = (text: string) => {
      if (!ref.current) return;
      ref.current.textContent = '';
      window.setTimeout(() => {
        if (ref.current) ref.current.textContent = text;
      }, 60);
    };
    return () => {
      announcer = null;
    };
  }, []);
  return <div ref={ref} className="visually-hidden" role="status" aria-live="polite" aria-atomic="true" />;
}

/**
 * Accessible modal built on the native <dialog> element: focus is trapped by the browser,
 * Escape closes it, and focus returns to the opener.
 */
export function Dialog({ open, onClose, label, children, className, tone = 'dark' }: {
  open: boolean;
  onClose: () => void;
  label: string;
  children: ReactNode;
  className?: string;
  tone?: 'dark' | 'paper';
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const opener = useRef<Element | null>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) {
      opener.current = document.activeElement;
      dialog.showModal();
      void audio.play('ui.open');
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    const handleClose = () => {
      (opener.current as HTMLElement | null)?.focus?.();
      if (open) onClose();
    };
    dialog.addEventListener('close', handleClose);
    return () => dialog.removeEventListener('close', handleClose);
  }, [open, onClose]);
  return (
    <dialog
      ref={ref}
      aria-label={label}
      className={`dialog dialog-${tone}${className ? ` ${className}` : ''}`}
      onClick={(event) => {
        if (event.target === ref.current) {
          void audio.play('ui.close');
          onClose();
        }
      }}
    >
      {open ? children : null}
    </dialog>
  );
}

export function Spinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div className="spinner" role="status">
      <span className="spinner-dot" aria-hidden="true" />
      <span className="visually-hidden">{label}</span>
    </div>
  );
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'gentle' | 'success'; children: ReactNode }) {
  return <p className={`notice notice-${tone}`}>{children}</p>;
}
