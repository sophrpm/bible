import { useEffect, useState } from 'react';
import { api } from '../api';
import { useStored } from '../storage';
import { Explorer } from './Explorer';
import { parsePassage } from '../../shared/passage';
import type { BookSummary, Link, Version } from '../../shared/bible';

/** Explorer owns its translation and tree focus; reader selection never enters this component. */
export function ExplorePage({
  graph,
  versions,
  onSelect,
}: {
  graph: Link[];
  versions: Version[];
  onSelect: (id: string, version?: string) => void;
}) {
  const [version, setVersion] = useStored('explorer-version', 'LBLA');
  const [focus, setFocus] = useStored('explorer-focus', 'GEN.1.1');
  const [query, setQuery] = useState('Génesis 1:1');
  const [books, setBooks] = useState<BookSummary[]>([]),
    [connections, setConnections] = useState<Link[]>([]),
    [error, setError] = useState('');
  useEffect(() => {
    let active = true;
    api<BookSummary[]>('books', { version })
      .then((result) => {
        if (active) setBooks(result);
      })
      .catch((error: Error) => setError(error.message));
    return () => {
      active = false;
    };
  }, [version]);
  useEffect(() => {
    let active = true;
    api<Link[]>('references', { id: focus, direction: 'both' })
      .then((result) => {
        if (active) setConnections(result);
      })
      .catch((error: Error) => setError(error.message));
    return () => {
      active = false;
    };
  }, [focus]);
  return (
    <>
      <form
        className="explorer-own-controls"
        onSubmit={(event) => {
          event.preventDefault();
          const id = parsePassage(query);
          if (id) {
            setFocus(id);
            setError('');
          } else setError('Escribe un pasaje válido.');
        }}
      >
        <label>
          Versión de Exploración{' '}
          <select value={version} onChange={(event) => setVersion(event.target.value)}>
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          Raíz del árbol <input value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <button>Aplicar raíz</button>
      </form>
      {error && <p role="alert">{error}</p>}
      <Explorer
        links={graph}
        focused={connections}
        selected={focus}
        version={version}
        onSelect={(id) => onSelect(id, version)}
        chapters={Object.fromEntries(books.map((book) => [book.book, book.chapters]))}
      />
    </>
  );
}
