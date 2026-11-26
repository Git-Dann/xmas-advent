import { Suspense, lazy, useEffect } from 'react';
import { audio } from './audio/engine';
import { Glyph } from './components/Glyph';
import { LiveRegion, Spinner } from './components/ui';
import { GameProvider, useGame } from './lib/game';
import { setPrefs, usePrefs } from './lib/prefs';
import { Link, useFocusOnRoute, usePath } from './lib/router';
import { ArchiveScreen } from './screens/Archive';
import { ChristmasRoom } from './screens/ChristmasRoom';
import { DayScreen } from './screens/Day';
import { Invitation } from './screens/Invitation';
import { SettingsScreen } from './screens/Settings';
import { VaultScreen } from './screens/Vault';
import { VillageScreen } from './screens/Village';

const AdminApp = lazy(() => import('./admin/AdminApp'));

export function App() {
  const path = usePath();
  if (path.startsWith('/admin')) {
    return (
      <Suspense fallback={<Spinner label="Loading admin" />}>
        <AdminApp />
      </Suspense>
    );
  }
  return (
    <GameProvider>
      <PlayerApp path={path} />
    </GameProvider>
  );
}

function PlayerApp({ path }: { path: string }) {
  const { session, calendar } = useGame();
  const prefs = usePrefs();
  useFocusOnRoute(path);

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', prefs.reduceMotion);
  }, [prefs.reduceMotion]);

  if (!session) {
    return (
      <div className="boot">
        <Spinner label="Opening the collection" />
      </div>
    );
  }
  if (!session.authenticated) return <Invitation />;

  const dayMatch = /^\/day\/(\d{1,2})$/.exec(path);
  const archiveMatch = /^\/archive(?:\/([a-z0-9-]+))?$/.exec(path);
  let screen;
  if (dayMatch) screen = <DayScreen key={dayMatch[1]} day={Number(dayMatch[1])} />;
  else if (archiveMatch) screen = <ArchiveScreen selected={archiveMatch[1] ?? null} />;
  else if (path === '/vault') screen = <VaultScreen />;
  else if (path === '/christmas') screen = <ChristmasRoom />;
  else if (path === '/settings') screen = <SettingsScreen />;
  else screen = <VillageScreen />;

  const hasArchive = (calendar?.completedCount ?? 0) > 0;
  const christmas = calendar?.days[24]?.state === 'complete';
  return (
    <div className={`shell${path === '/christmas' ? ' shell-christmas' : ''}`}>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <Link to="/" className="wordmark" aria-label="The 25th Key, back to the village">
          <span className="wordmark-key" aria-hidden="true"><Glyph name="key" size={18} /></span>
          <span className="wordmark-text">The 25th Key</span>
        </Link>
        <div className="topbar-actions">
          {session.player?.preview ? <span className="preview-badge">Preview</span> : null}
          <SoundToggle />
          <Link to="/settings" className="icon-button" aria-label="Settings">
            <Glyph name="settings" size={22} />
          </Link>
        </div>
      </header>
      <SoundInvite />
      <main id="main" className="main">{screen}</main>
      <nav className="tabbar" aria-label="Main">
        <TabLink to="/" label="Village" icon="village" active={path === '/' || path.startsWith('/day')} />
        <TabLink to="/archive" label="Archive" icon="archive" active={path.startsWith('/archive')} disabled={!hasArchive} />
        <TabLink to={christmas ? '/christmas' : '/vault'} label={christmas ? 'Christmas' : 'Vault'} icon={christmas ? 'tree' : 'vault'} active={path === '/vault' || path === '/christmas'} />
      </nav>
      <LiveRegion />
    </div>
  );
}

function TabLink({ to, label, icon, active, disabled }: { to: string; label: string; icon: string; active: boolean; disabled?: boolean }) {
  if (disabled) {
    return (
      <span className="tab is-disabled" aria-disabled="true" title="Opens after your first discovery">
        <Glyph name={icon} />
        <span>{label}</span>
      </span>
    );
  }
  return (
    <Link to={to} className={`tab${active ? ' is-active' : ''}`} aria-current={active ? 'page' : undefined} onClick={() => void audio.play('ui.tap')}>
      <Glyph name={icon} />
      <span>{label}</span>
    </Link>
  );
}

function SoundToggle() {
  const prefs = usePrefs();
  return (
    <button
      type="button"
      className="icon-button"
      aria-pressed={!prefs.muted}
      aria-label={prefs.muted ? 'Turn sound on' : 'Turn sound off'}
      onClick={() => {
        audio.setMuted(!prefs.muted);
        if (prefs.muted) void audio.play('ui.open');
      }}
    >
      <Glyph name={prefs.muted ? 'muted' : 'sound'} size={22} />
    </button>
  );
}

/** A single, subtle invitation to turn sound on. Shown once, never repeated. */
function SoundInvite() {
  const prefs = usePrefs();
  if (prefs.soundPrompted) return null;
  return (
    <aside className="sound-invite" aria-label="Sound">
      <Glyph name="sound" size={20} />
      <p>This collection sounds better with sound on.</p>
      <div className="sound-invite-actions">
        <button type="button" className="btn btn-primary btn-small" onClick={() => { audio.setMuted(false); void audio.play('ui.open'); }}>
          Sound on
        </button>
        <button type="button" className="btn btn-quiet btn-small" onClick={() => setPrefs({ soundPrompted: true })}>
          Not now
        </button>
      </div>
    </aside>
  );
}
