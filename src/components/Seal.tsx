import { Glyph } from './Glyph';

/**
 * A wax or metal seal rendered programmatically (puzzle graphics, not artwork).
 * kind: star | moon | home | heart | key. Metal colour follows the chapter.
 */
const METAL: Record<string, string> = { star: 'gold', moon: 'silver', home: 'gold', heart: 'wax', key: 'gold' };

export function Seal({ kind, size = 72, className, label, empty }: { kind: string; size?: number; className?: string; label?: string; empty?: boolean }) {
  const metal = METAL[kind] ?? 'gold';
  return (
    <span
      className={`seal seal-${empty ? 'empty' : metal}${className ? ` ${className}` : ''}`}
      style={{ width: size, height: size }}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <span className="seal-rim" />
      <Glyph name={kind} size={Math.round(size * 0.42)} className="seal-glyph" />
    </span>
  );
}
