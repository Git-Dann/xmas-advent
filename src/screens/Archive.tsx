import { useEffect, useState } from 'react';
import type { ArchiveResponse } from '../../shared/api';
import { EvidenceViewer } from '../components/EvidenceViewer';
import { Glyph } from '../components/Glyph';
import { Seal } from '../components/Seal';
import { Spinner } from '../components/ui';
import { api } from '../lib/api';
import { navigate } from '../lib/router';

// Titles stay on the server; the client only knows the day ranges.
const CHAPTERS = [
  { n: 1, title: 'Chapter One', days: [1, 6] },
  { n: 2, title: 'Chapter Two', days: [7, 12] },
  { n: 3, title: 'Chapter Three', days: [13, 18] },
  { n: 4, title: 'Chapter Four', days: [19, 25] },
];

export function ArchiveScreen({ selected }: { selected: string | null }) {
  const [archive, setArchive] = useState<ArchiveResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<ArchiveResponse>('/api/archive').then(setArchive).catch((e: Error) => setError(e.message));
  }, []);

  return (
    <div className="archive">
      <header className="screen-header">
        <p className="eyebrow">Kept safe</p>
        <h1>The Archive</h1>
        <p className="lede">Everything you have found. Objects come back when you need them, and some of them have more to say than they first let on.</p>
      </header>
      {error ? <p className="notice notice-gentle">{error}</p> : null}
      {!archive && !error ? <Spinner label="Opening the Archive" /> : null}
      {archive && archive.evidence.length === 0 ? (
        <div className="empty-state">
          <Glyph name="archive" size={40} />
          <p>The Archive is empty for now. It opens with the first door.</p>
        </div>
      ) : null}
      {archive?.tools.length ? (
        <section className="tools" aria-labelledby="tools-title">
          <h2 id="tools-title" className="section-title">Tools</h2>
          <ul className="tool-list">
            {archive.tools.filter((t) => t.id !== 'archive').map((tool) => (
              <li key={tool.id} className="tool">
                <Glyph name={tool.id === 'lamp' ? 'lamp' : 'key'} />
                <div><p className="tool-title">{tool.title}</p><p className="muted">{tool.description}</p></div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {archive
        ? CHAPTERS.map((chapter) => {
          const items = archive.evidence.filter((e) => e.day >= chapter.days[0]! && e.day <= chapter.days[1]!);
          if (items.length === 0) return null;
          return (
            <section key={chapter.n} className="archive-chapter" aria-labelledby={`chapter-${chapter.n}`}>
              <h2 id={`chapter-${chapter.n}`} className="section-title">{chapter.title}</h2>
              <ul className="evidence-grid">
                {items.map((item) => (
                  <li key={item.id}>
                    <button type="button" className={`evidence-card kind-${item.kind}`} onClick={() => navigate(`/archive/${item.id}`)}>
                      <span className="evidence-card-art" aria-hidden="true">
                        {item.kind === 'seal' ? <Seal kind={item.glyph ?? 'star'} size={52} /> : <Glyph name={item.glyph ?? 'note'} size={30} />}
                      </span>
                      <span className="evidence-card-title">{item.title}</span>
                      <span className="evidence-card-day">Day {item.day}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          );
        })
        : null}
      <EvidenceViewer id={selected} onClose={() => navigate('/archive', { replace: true })} />
    </div>
  );
}
