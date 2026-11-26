import { audio } from '../audio/engine';
import { Button } from '../components/ui';
import { api } from '../lib/api';
import { useGame } from '../lib/game';
import { setPrefs, usePrefs } from '../lib/prefs';

export function SettingsScreen() {
  const prefs = usePrefs();
  const { refresh } = useGame();
  const volume = (key: 'ui' | 'ambient' | 'narrative', label: string) => (
    <div className="setting">
      <label htmlFor={`vol-${key}`} className="field-label">{label}</label>
      <input
        id={`vol-${key}`}
        className="range"
        type="range"
        min={0}
        max={1}
        step={0.05}
        value={prefs[key]}
        disabled={prefs.muted}
        onChange={(e) => { setPrefs({ [key]: Number(e.target.value) }); audio.applyVolumes(); }}
        onPointerUp={() => void audio.play(key === 'ui' ? 'ui.tap' : key === 'narrative' ? 'secret.reveal' : 'dial.tick')}
      />
    </div>
  );
  return (
    <div className="settings">
      <header className="screen-header">
        <p className="eyebrow">Your device</p>
        <h1>Settings</h1>
        <p className="lede">These settings are saved on this device only. Your progress is always kept safely on the server.</p>
      </header>
      <section className="settings-group" aria-labelledby="sound-title">
        <h2 id="sound-title" className="section-title">Sound</h2>
        <div className="setting setting-row">
          <span>Sound</span>
          <button type="button" className="toggle" role="switch" aria-checked={!prefs.muted} onClick={() => audio.setMuted(!prefs.muted)}>
            <span className="toggle-thumb" />
            <span className="visually-hidden">Sound</span>
          </button>
        </div>
        {volume('ui', 'Interface sounds')}
        {volume('ambient', 'Ambience')}
        {volume('narrative', 'Discoveries and recordings')}
        <p className="muted">No puzzle needs sound. Everything you hear is also shown on screen.</p>
      </section>
      <section className="settings-group" aria-labelledby="motion-title">
        <h2 id="motion-title" className="section-title">Motion and display</h2>
        <div className="setting setting-row">
          <span>Reduce motion</span>
          <button type="button" className="toggle" role="switch" aria-checked={prefs.reduceMotion} onClick={() => setPrefs({ reduceMotion: !prefs.reduceMotion })}>
            <span className="toggle-thumb" /><span className="visually-hidden">Reduce motion</span>
          </button>
        </div>
        <div className="setting setting-row">
          <span>3D village</span>
          <button type="button" className="toggle" role="switch" aria-checked={prefs.immersive} onClick={() => setPrefs({ immersive: !prefs.immersive })}>
            <span className="toggle-thumb" /><span className="visually-hidden">3D village</span>
          </button>
        </div>
        <p className="muted">Turning off the 3D village saves battery. Every puzzle works the same either way.</p>
      </section>
      <section className="settings-group" aria-labelledby="access-title">
        <h2 id="access-title" className="section-title">Access</h2>
        <p className="muted">To continue on another device, open your invitation code there. Your progress follows you.</p>
        <Button variant="quiet" onClick={async () => { await api('/api/auth/logout', { method: 'POST' }); await refresh(); }}>
          Sign out of this device
        </Button>
      </section>
    </div>
  );
}
