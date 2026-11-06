import { Fragment, useEffect, useId, useRef, useState } from 'react';
import { Bookmark, BookmarkCheck } from 'lucide-react';
import { api } from '../api';
import { label, type Verse, type Version } from '../../shared/bible';
import { VerseText } from './VerseText';

type Props = {
  version: string;
  selected: string;
  onSelect: (id: string) => void;
  versions: Version[];
  book: string;
  chapter: number;
  onChapter: (chapter: number) => void;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  navigationRequest?: number;
  onStrong?: (topic: string) => void;
};

/** Continuous chapter reading: selection changes emphasis, never the reader's scroll position. */
export function Reader({
  version,
  selected,
  onSelect,
  versions,
  book,
  chapter,
  onChapter,
  bookmarks,
  toggleBookmark,
  navigationRequest = 0,
  onStrong,
}: Props) {
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const list = useRef<HTMLDivElement>(null);
  const lastNavigation = useRef(-1);
  const readerId = useId();
  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    api<Verse[]>('chapter', { version, book, chapter })
      .then((result) => {
        if (active) setVerses(result);
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [version, book, chapter]);
  useEffect(() => {
    if (loading || !list.current || lastNavigation.current === navigationRequest) return;
    const element = list.current.querySelector<HTMLElement>(`[data-verse-id="${selected}"]`);
    if (!element) return;
    lastNavigation.current = navigationRequest;
    const bounds = list.current.getBoundingClientRect(),
      verse = element.getBoundingClientRect();
    if (verse.top < bounds.top || verse.bottom > bounds.bottom) {
      list.current.scrollTo({
        top: list.current.scrollTop + verse.top - bounds.top - 12,
        behavior: 'instant',
      });
    }
  }, [navigationRequest, loading, verses, selected]);
  const saved = bookmarks.includes(selected);
  return (
    <section className="reader continuous-reader" aria-busy={loading}>
      <div className="section-top">
        <div>
          <span className="eyebrow">
            {versions.find((item) => item.id === version)?.name || version}
          </span>
          <h2>{label(book + '.' + chapter)}</h2>
        </div>
        <div className="chapter-nav">
          <button aria-label="Capítulo anterior" onClick={() => onChapter(chapter - 1)}>
            ←
          </button>
          <button aria-label="Capítulo siguiente" onClick={() => onChapter(chapter + 1)}>
            →
          </button>
        </div>
      </div>
      <div className="selected-verse-actions">
        <span>{label(selected)}</span>
        <button aria-pressed={saved} onClick={() => toggleBookmark(selected)}>
          {saved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}{' '}
          {saved ? 'Guardado' : 'Guardar versículo'}
        </button>
      </div>
      {error && <p role="alert">{error}</p>}
      <div className="verse-list continuous-chapter" ref={list}>
        {loading ? (
          <p>Cargando capítulo…</p>
        ) : (
          <div className="chapter-prose">
            {verses.map((verse) => (
              <Fragment key={verse.id}>
                {verse.heading && <h3 className="chapter-heading">{verse.heading}</h3>}
                <span
                  id={readerId + verse.id}
                  data-verse-id={verse.id}
                  role="button"
                  tabIndex={0}
                  aria-label={'Leer referencias de ' + label(verse.id)}
                  className={'inline-verse ' + (verse.id === selected ? 'selected' : '')}
                  onClick={() => onSelect(verse.id)}
                  onKeyDown={(event) => {
                    if (
                      event.target === event.currentTarget &&
                      (event.key === 'Enter' || event.key === ' ')
                    ) {
                      event.preventDefault();
                      onSelect(verse.id);
                    }
                  }}
                >
                  <sup className="inline-verse-number">{verse.verse}</sup>
                  <VerseText verse={verse} onStrong={onStrong} />
                </span>{' '}
              </Fragment>
            ))}
          </div>
        )}
      </div>
      <div className="reader-foot">
        Selecciona un versículo para estudiar · Los superíndices Strong abren el diccionario.
      </div>
    </section>
  );
}
