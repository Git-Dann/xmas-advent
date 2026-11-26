import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CalendarResponse, SessionResponse } from '../../shared/api';
import { ApiFailure, api } from './api';

interface GameState {
  session: SessionResponse | null;
  calendar: CalendarResponse | null;
  error: string | null;
  refresh: () => Promise<void>;
  setSession: (s: SessionResponse) => void;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const s = await api<SessionResponse>('/api/session');
      setSession(s);
      if (s.authenticated) setCalendar(await api<CalendarResponse>('/api/calendar'));
      else setCalendar(null);
      setError(null);
    } catch (err) {
      setError(err instanceof ApiFailure ? err.message : 'Something went wrong.');
      setSession((prev) => prev ?? { authenticated: false });
    }
  }, []);

  useEffect(() => {
    void refresh();
    // Re-check when the app returns to the foreground: a new day may have opened.
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [refresh]);

  const value = useMemo(() => ({ session, calendar, error, refresh, setSession }), [session, calendar, error, refresh]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame outside GameProvider');
  return ctx;
}

export function formatDay(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y!, m! - 1, d!)).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', timeZone: 'UTC' });
}
