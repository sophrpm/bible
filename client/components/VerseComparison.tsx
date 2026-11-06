import { useEffect, useState } from 'react';
import { api } from '../api';
import { label, type Verse, type Version } from '../../shared/bible';
import { VerseText } from './VerseText';

export function VerseComparison({
  selected,
  versions,
  onStrong,
}: {
  selected: string;
  versions: Version[];
  onStrong: (topic: string) => void;
}) {
  const [verses, setVerses] = useState<Record<string, Verse | null>>({});
  const [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    setError('');
    setVerses({});
    Promise.all(
      versions.map(
        async (version) =>
          [
            version.id,
            await api<Verse | null>('verse', { version: version.id, id: selected }),
          ] as const,
      ),
    )
      .then((rows) => {
        if (active) setVerses(Object.fromEntries(rows));
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, [selected, versions]);
  return (
    <aside className="verse-comparison">
      <span className="eyebrow">TODAS LAS VERSIONES</span>
      <h2>{label(selected)}</h2>
      <p className="muted">Selecciona otro versículo en el lector de la derecha.</p>
      {error && <p role="alert">{error}</p>}
      <div className="comparison-stack">
        {versions.map((version) => (
          <article key={version.id}>
            <header>
              <b>{version.id.startsWith('local-') ? version.name : version.id}</b>
              <span>{label(selected)}</span>
            </header>
            {verses[version.id] ? (
              <p>
                <VerseText verse={verses[version.id]!} onStrong={onStrong} />
              </p>
            ) : (
              <p className="muted">
                {version.id in verses ? 'Sin versículo en esta versión.' : 'Cargando…'}
              </p>
            )}
          </article>
        ))}
      </div>
    </aside>
  );
}
