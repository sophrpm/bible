import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useStored } from '../storage';
import type { DictionaryInfo, DictionaryEntry } from '../../shared/bible';

export function DictionaryWindow({ topic, onClose }: { topic: string; onClose: () => void }) {
  const [dictionaries, setDictionaries] = useState<DictionaryInfo[]>([]);
  const [selected, setSelected] = useStored<string[]>('dictionary-selection', []);
  const [saved, setSaved] = useStored<string[]>('saved-dictionary-entries', []);
  const [query, setQuery] = useState(topic);
  const [exact, setExact] = useState(!!topic);
  const [offset, setOffset] = useState(0);
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const upload = useRef<HTMLInputElement>(null);
  useEffect(() => {
    api<DictionaryInfo[]>('dictionaries')
      .then(setDictionaries)
      .catch((error: Error) => setError(error.message));
  }, []);
  useEffect(() => {
    setQuery(topic);
    setExact(!!topic);
    setOffset(0);
  }, [topic]);
  useEffect(() => {
    let active = true;
    setBusy(true);
    const timer = setTimeout(() => {
      api<{ items: DictionaryEntry[]; more: boolean }>('dictionary', {
        q: query,
        ids: selected.join(','),
        exact: exact ? 1 : 0,
        offset,
      })
        .then((result) => {
          if (active) {
            setEntries(result.items);
            setMore(result.more);
          }
        })
        .catch((error: Error) => {
          if (active) setError(error.message);
        })
        .finally(() => {
          if (active) setBusy(false);
        });
    }, 200);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [query, selected, exact, offset, dictionaries]);
  async function importFile(file: File) {
    setBusy(true);
    setError('');
    try {
      const form = new FormData();
      form.append('filename', file.name);
      form.append('file', file);
      const response = await fetch('/api/dictionaries/import', { method: 'POST', body: form });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      setDictionaries(await api('dictionaries'));
    } catch (error) {
      setError((error as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div
      className="modal-shade dictionary-shade"
      onKeyDown={(event) => {
        if (event.key === 'Escape') onClose();
      }}
    >
      <section
        className="dictionary-window"
        role="dialog"
        aria-modal="true"
        aria-label="Diccionarios Strong"
      >
        <header className="section-top">
          <div>
            <span className="eyebrow">ESTUDIO DE PALABRAS</span>
            <h2>Diccionarios {topic}</h2>
          </div>
          <button aria-label="Cerrar diccionarios" onClick={onClose}>
            ✕
          </button>
        </header>
        <details className="dictionary-options" open>
          <summary>Diccionarios activos</summary>
          <p className="muted">Sin selección: consultar todos los diccionarios importados.</p>
          {dictionaries.map((dictionary) => (
            <label key={dictionary.id}>
              <input
                type="checkbox"
                checked={selected.includes(dictionary.id)}
                onChange={() =>
                  setSelected((current) =>
                    current.includes(dictionary.id)
                      ? current.filter((id) => id !== dictionary.id)
                      : [...current, dictionary.id],
                  )
                }
              />
              {dictionary.name}
            </label>
          ))}
          <button disabled={busy} onClick={() => upload.current?.click()}>
            Importar diccionario SQLite3
          </button>
          <input
            hidden
            ref={upload}
            type="file"
            accept=".sqlite3,.sqlite,.db"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void importFile(file);
              event.target.value = '';
            }}
          />
        </details>
        <form
          className="dictionary-search"
          onSubmit={(event) => {
            event.preventDefault();
            setExact(false);
            setOffset(0);
          }}
        >
          <input
            aria-label="Buscar en diccionarios"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExact(false);
              setOffset(0);
            }}
            placeholder="H7225, G3056 o palabra…"
          />
          <button>Buscar en diccionario</button>
        </form>
        <button aria-pressed={showSaved} onClick={() => setShowSaved(!showSaved)}>
          Guardados ({saved.length})
        </button>
        {showSaved && (
          <div className="saved-terms">
            {saved.map((key) => (
              <button
                key={key}
                onClick={() => {
                  setQuery(key.split('|')[1]);
                  setExact(true);
                  setShowSaved(false);
                }}
              >
                {key.split('|')[1]}
              </button>
            ))}
          </div>
        )}
        {error && <p role="alert">{error}</p>}
        {busy && <p role="status">Consultando…</p>}
        <div className="dictionary-results">
          {entries.map((entry) => {
            const key = entry.dictionaryId + '|' + entry.topic;
            return (
              <article key={key}>
                <div className="section-top">
                  <h3>
                    {entry.topic} · {entry.lexeme}
                  </h3>
                  <button
                    aria-pressed={saved.includes(key)}
                    onClick={() =>
                      setSaved((current) =>
                        current.includes(key)
                          ? current.filter((item) => item !== key)
                          : [...current, key],
                      )
                    }
                  >
                    {saved.includes(key) ? 'Guardado' : 'Guardar'}
                  </button>
                </div>
                <small>
                  {entry.dictionaryName} · {entry.transliteration} {entry.pronunciation}
                </small>
                <p>{entry.short_definition}</p>
                <div className="dictionary-definition">{entry.definition}</div>
              </article>
            );
          })}
          {!busy && !entries.length && (
            <p>No hay entradas. Importa un diccionario o cambia la búsqueda.</p>
          )}
        </div>
        <div className="chapter-nav">
          <button
            disabled={!offset}
            onClick={() => setOffset((current) => Math.max(0, current - 30))}
          >
            ← Anterior
          </button>
          <button disabled={!more} onClick={() => setOffset((current) => current + 30)}>
            Siguiente →
          </button>
        </div>
      </section>
    </div>
  );
}
