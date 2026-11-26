import { Glyph } from '../components/Glyph';
import { Seal } from '../components/Seal';
import { Spinner } from '../components/ui';
import { useGame } from '../lib/game';
import { Link } from '../lib/router';

/** The Vault is visible from the start and changes as chapters are completed. */
export function VaultScreen() {
  const { calendar } = useGame();
  if (!calendar) return <Spinner />;
  const seals = calendar.chapterSeals;
  const count = Object.values(seals).filter(Boolean).length;
  const day25 = calendar.days[24]!;
  let line = 'A heavy door at the edge of the village. Four empty sockets. One keyhole.';
  if (count > 0 && count < 4) line = `${count} of 4 seals have found their places. The door feels a little warmer than it did.`;
  if (count === 4 && !calendar.hasChristmasKey) line = 'All four seals are in place. Something behind the door is waiting for a key.';
  if (calendar.hasChristmasKey && day25.state !== 'available' && day25.state !== 'in_progress' && day25.state !== 'complete') line = 'You hold the Christmas Key. The vault opens on Christmas morning.';
  if (day25.state === 'available' || day25.state === 'in_progress') line = 'Christmas morning. The vault is ready for its key.';
  if (day25.state === 'complete') line = 'The vault stands open, and the light is still on.';
  return (
    <div className="vault-screen">
      <header className="screen-header">
        <p className="eyebrow">Locked since the beginning</p>
        <h1>The Vault</h1>
        <p className="lede">{line}</p>
      </header>
      <div className={`vault-illustration seals-${count}${calendar.hasChristmasKey ? ' has-key' : ''}`} aria-hidden="true">
        <div className="vault-face">
          {(['star', 'moon', 'home', 'heart'] as const).map((s) => (
            <span key={s} className={`vault-socket vault-socket-${s}`}>{seals[s] ? <Seal kind={s} size={46} /> : <Glyph name={s} size={22} />}</span>
          ))}
          <div className="vault-lock"><span className="vault-keyhole" /></div>
        </div>
      </div>
      <ul className="vault-status">
        {(['star', 'moon', 'home', 'heart'] as const).map((s) => (
          <li key={s}><Glyph name={seals[s] ? 'check' : s} size={18} /> {s[0]!.toUpperCase() + s.slice(1)} seal: {seals[s] ? 'in place' : 'not yet found'}</li>
        ))}
        <li><Glyph name={calendar.hasChristmasKey ? 'check' : 'key'} size={18} /> The Christmas Key: {calendar.hasChristmasKey ? 'yours' : 'not yet earned'}</li>
      </ul>
      {day25.state === 'available' || day25.state === 'in_progress' ? <Link to="/day/25" className="btn btn-primary">Open the vault</Link> : null}
      {day25.state === 'complete' ? <Link to="/christmas" className="btn btn-primary">Go to the Christmas Room</Link> : null}
    </div>
  );
}
