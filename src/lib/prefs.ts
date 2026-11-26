import { useSyncExternalStore } from 'react';

/** Non-authoritative, per-device preferences. Never used for gameplay. */
export interface Prefs {
  muted: boolean;
  ui: number;
  ambient: number;
  narrative: number;
  soundPrompted: boolean;
  reduceMotion: boolean;
  immersive: boolean;
  seenIntro: boolean;
}

const KEY = 'k25.prefs.v1';
const defaults: Prefs = { muted: true, ui: 0.7, ambient: 0.45, narrative: 0.9, soundPrompted: false, reduceMotion: false, immersive: true, seenIntro: false };

let current: Prefs = load();
const listeners = new Set<() => void>();

function load(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as Partial<Prefs>) } : { ...defaults };
  } catch {
    return { ...defaults };
  }
}

export function getPrefs(): Prefs {
  return current;
}

export function setPrefs(patch: Partial<Prefs>) {
  current = { ...current, ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch {
    /* Private mode or storage disabled: preferences last for this visit only. */
  }
  listeners.forEach((l) => l());
}

export function usePrefs(): Prefs {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => current,
    () => defaults,
  );
}

const motionQuery = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;

export function prefersReducedMotion(): boolean {
  return Boolean(motionQuery?.matches) || current.reduceMotion;
}

export function useReducedMotion(): boolean {
  const prefs = usePrefs();
  const system = useSyncExternalStore(
    (l) => {
      motionQuery?.addEventListener('change', l);
      return () => motionQuery?.removeEventListener('change', l);
    },
    () => Boolean(motionQuery?.matches),
    () => false,
  );
  return system || prefs.reduceMotion;
}
