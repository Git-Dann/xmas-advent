import { useEffect, useState, type FormEvent } from 'react';
import { audio } from '../audio/engine';
import { Button, Notice } from '../components/ui';
import { ApiFailure, api } from '../lib/api';
import { useGame } from '../lib/game';
import { Seal } from '../components/Seal';

/** The front door. A private invitation code becomes a long-lived, HttpOnly session. */
export function Invitation() {
  const { refresh } = useGame();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Invitation links carry the code in the fragment, which is never sent to the server or logs.
    const read = () => {
      const match = /code=([A-Za-z0-9-]+)/.exec(location.hash);
      if (match) {
        setCode(match[1]!);
        history.replaceState(null, '', location.pathname);
      }
    };
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      await api('/api/auth/claim', { method: 'POST', body: { code } });
      void audio.play('seal.break');
      await refresh();
    } catch (err) {
      void audio.play('ui.error.soft');
      setError(err instanceof ApiFailure ? err.message : 'That did not work. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main id="main" className="invitation">
      <div className="invitation-card">
        <Seal kind="star" size={88} className="invitation-seal" />
        <p className="eyebrow">A private collection</p>
        <h1 className="invitation-title">The 25th Key</h1>
        <p className="invitation-subtitle">The Story of Us</p>
        <p className="invitation-line">Some stories are worth keeping.</p>
        <form className="invitation-form" onSubmit={submit}>
          <label htmlFor="invite-code" className="field-label">Your invitation code</label>
          <input
            id="invite-code"
            className="input input-code"
            value={code}
            onChange={(event) => setCode(event.target.value)}
            autoComplete="one-time-code"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            inputMode="text"
            placeholder="XXXX-XXXX-XXXX-XXXX"
            aria-describedby={error ? 'invite-error' : 'invite-help'}
            aria-invalid={error ? true : undefined}
          />
          <Button type="submit" busy={busy} disabled={busy || !code.trim()} sound={null}>
            {busy ? 'Opening…' : 'Open the invitation'}
          </Button>
          {error ? <div id="invite-error"><Notice tone="gentle">{error}</Notice></div> : null}
          <p id="invite-help" className="invitation-help">
            The same code works on any device, so you can always find your way back in.
          </p>
        </form>
      </div>
    </main>
  );
}
