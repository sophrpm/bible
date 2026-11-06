import { useEffect, useState } from 'react';

import { codes, names, label, type Verse } from '../../shared/bible';

export function Search({
  version,
  onSelect,
  onClose,
}: {
  version: string;
  onSelect: (id: string, version?: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [allVersions, setAllVersions] = useState(false);
  const [book, setBook] = useState('');
  const [testament, setTestament] = useState('');
  const [items, setItems] = useState<Verse[]>([]);
  const [total, setTotal] = useState(0);
  const [offset, setOffset] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    setOffset(0);
  }, [query, allVersions, book, testament]);
  useEffect(() => {
    const controller = new AbortController();
    if (query.trim().length < 2) {
      setItems([]);
      setTotal(0);
      setBusy(false);
      return;
    }
    setBusy(true);
    setError('');
    const timer = setTimeout(() => {
      const params = new URLSearchParams({
        q: query,
        version: allVersions ? '*' : version,
        book,
        testament,
        offset: String(offset),
      });
      fetch('/api/search?' + params, { signal: controller.signal })
        .then((response) => {
          if (!response.ok) throw new Error('No se pudo buscar.');
          return response.json();
        })
        .then((result: { items: Verse[]; total: number }) => {
          setItems(result.items);
          setTotal(result.total);
        })
        .catch((error: Error) => {
          if (error.name !== 'AbortError') setError(error.message);
        })
        .finally(() => {
          if (!controller.signal.aborted) setBusy(false);
        });
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, allVersions, version, book, testament, offset, revision]);
  return (
    <div
      className="modal-shade"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <section
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda avanzada"
      >
        <div className="section-top">
          <h2>Busca en la Palabra</h2>
          <button onClick={onClose} aria-label="Cerrar búsqueda">
            ✕
          </button>
        </div>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setRevision((current) => current + 1);
          }}
        >
          <input
            autoFocus
            aria-label="Búsqueda en vivo"
            placeholder="Palabra, frase o cita: luz, Juan 3:16"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <label className="all-version-search">
            <input
              type="checkbox"
              checked={allVersions}
              onChange={(event) => setAllVersions(event.target.checked)}
            />{' '}
            Buscar en todas las versiones · resultados en vivo
          </label>
          <div className="search-filters">
            <select
              aria-label="Testamento"
              value={testament}
              onChange={(event) => setTestament(event.target.value)}
            >
              <option value="">Toda la Biblia</option>
              <option value="ot">Antiguo Testamento</option>
              <option value="nt">Nuevo Testamento</option>
            </select>
            <select
              aria-label="Libro"
              value={book}
              onChange={(event) => setBook(event.target.value)}
            >
              <option value="">Todos los libros</option>
              {codes.map((code, index) => (
                <option key={code} value={code}>
                  {names[index]}
                </option>
              ))}
            </select>
            <button className="gold-button">Buscar</button>
          </div>
        </form>
        <p className="muted" role="status">
          {busy
            ? 'Buscando…'
            : `${total.toLocaleString('es')} resultados · ${allVersions ? 'Todas las versiones' : version}`}
        </p>
        {error && <p role="alert">{error}</p>}
        <div className="search-results">
          {items.map((verse) => (
            <button
              className="reference-card"
              key={verse.version + verse.id}
              onClick={() => {
                onSelect(verse.id, verse.version);
                onClose();
              }}
            >
              <b>
                {verse.version} · {label(verse.id)}
              </b>
              <p>{verse.text}</p>
            </button>
          ))}
        </div>
        {total > 50 && (
          <div className="chapter-nav">
            <button disabled={!offset} onClick={() => setOffset((current) => current - 50)}>
              ← Anterior
            </button>
            <span>
              {offset + 1}–{Math.min(offset + 50, total)}
            </span>
            <button
              disabled={offset + 50 >= total}
              onClick={() => setOffset((current) => current + 50)}
            >
              Siguiente →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
