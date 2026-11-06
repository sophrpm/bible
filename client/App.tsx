import { ExplorePage } from './components/ExplorePage';
import { DictionaryWindow } from './components/DictionaryWindow';
import { VerseComparison } from './components/VerseComparison';
import { IndependentReaders } from './components/IndependentReaders';
import { useEffect, useState } from 'react';
import { api } from './api';
import { useStored } from './storage';
import { useBibleData } from './hooks/useBibleData';
import { AppHeader } from './components/AppHeader';
import { ReaderOverview } from './components/ReaderOverview';
import { SavedPanel } from './components/SavedPanel';
import { StudyToolbar } from './components/StudyToolbar';
import { AppFooter } from './components/AppFooter';

import { Reader } from './components/Reader';
import { References } from './components/References';
import { Search } from './components/Search';

/** Composes navigation and user preferences; data loading lives in useBibleData. */
export default function App() {
  const [version, setVersion] = useStored('version', 'LBLA');
  const [selected, setSelected] = useStored('passage', 'JHN.1.1');
  const [dark, setDark] = useStored('dark', false);
  const [bookmarks, setBookmarks] = useStored<string[]>('bookmarks', []);
  const [notes, setNotes] = useStored<Record<string, string>>('notes', {});
  const [direction, setDirection] = useState('both');
  const [min, setMin] = useState(0);
  const [search, setSearch] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [tab, setTab] = useState('reader');
  const [message, setMessage] = useState('');
  const [importing, setImporting] = useState(false);
  const [readerMode, setReaderMode] = useStored<'reading' | 'comparison' | 'independent'>(
    'reader-layout-v2',
    'reading',
  );
  const [showArc, setShowArc] = useStored('reader-arc-enabled', false);
  const [showReferences, setShowReferences] = useStored('reader-references-enabled', false);
  const [dictionaryTopic, setDictionaryTopic] = useState<string | null>(null);
  const [navigationRequest, setNavigationRequest] = useState(0);

  function toggleBookmark(id: string) {
    setBookmarks((current) =>
      current.includes(id) ? current.filter((item) => item !== id) : [...current, id],
    );
  }
  function activateIndependentReader(passage: string, readerVersion: string) {
    setSelected(passage);
    setVersion(readerVersion);
  }

  const [book, ch] = selected.split('.');
  const chapter = +ch;
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
  }, [dark]);
  const { versions, setVersions, books, graph, links } = useBibleData({
    referencesEnabled: showReferences && tab === 'reader',
    graphEnabled: tab === 'map',
    version,
    selected,
    direction,
    min,
    setVersion,
    setMessage,
  });
  function navigate(id: string, readerVersion?: string) {
    if (readerVersion) setVersion(readerVersion);
    setNavigationRequest((current) => current + 1);
    setSelected(id);
    setTab('reader');
  }
  function navigateChapter(chapterNumber: number) {
    const current = books.find((b) => b.book === book);
    if (!current) {
      return;
    }
    if (chapterNumber < 1) {
      const previous = books[books.indexOf(current) - 1];
      if (previous) {
        navigate(previous.book + '.' + previous.chapters + '.1');
      }
    } else if (chapterNumber > current.chapters) {
      const next = books[books.indexOf(current) + 1];
      if (next) {
        navigate(next.book + '.1.1');
      }
    } else {
      navigate(book + '.' + chapterNumber + '.1');
    }
  }
  async function importFile(file: File) {
    setImporting(true);
    setMessage('Importando y validando la Biblia…');
    try {
      const data = new FormData();
      // Send File.name explicitly so multipart header decoding cannot alter accents.
      data.append('filename', file.name);
      data.append('file', file);
      const response = await fetch('/api/versions/import', { method: 'POST', body: data });
      const result = await response.json();
      if (!response.ok) {
        throw Error(result.error);
      }
      setVersions(await api('versions'));
      setVersion(result.id);
      setMessage('Versión guardada en Bversions. Ya está disponible sin conexión.');
    } catch (e) {
      setMessage((e as Error).message);
    } finally {
      setImporting(false);
    }
  }
  return (
    <>
      <AppHeader
        {...{
          tab,
          setTab,
          bookmarks,
          dark,
          setDark,
          setSearch,
          setShowSaved,
          showSaved,
          importing,
          importFile,
        }}
      />
      <main>
        {tab === 'map' && <ExplorePage graph={graph} versions={versions} onSelect={navigate} />}
        {tab === 'reader' && (
          <ReaderOverview showArc={showArc} {...{ selected, navigate, setSearch }} />
        )}
        {message && (
          <div className="notice" role="status">
            {message}
            <button onClick={() => setMessage('')}>✕</button>
          </div>
        )}
        {showSaved && <SavedPanel {...{ bookmarks, notes, navigate }} />}
        {tab === 'reader' && (
          <>
            <div className="reader-mode-switch" role="group" aria-label="Modo de lectura">
              <button
                aria-pressed={readerMode === 'reading'}
                onClick={() => setReaderMode('reading')}
              >
                Lectura
              </button>
              <label className="reader-feature-toggle">
                <input
                  type="checkbox"
                  checked={showArc}
                  onChange={(event) => setShowArc(event.target.checked)}
                />{' '}
                Arco de referencias
              </label>
              <label className="reader-feature-toggle">
                <input
                  type="checkbox"
                  checked={showReferences}
                  onChange={(event) => setShowReferences(event.target.checked)}
                />{' '}
                Panel de referencias
              </label>
              <button onClick={() => setDictionaryTopic('')}>Diccionarios</button>
              <button
                aria-pressed={readerMode === 'comparison'}
                onClick={() => setReaderMode('comparison')}
              >
                Comparación sincronizada
              </button>
              <button
                aria-pressed={readerMode === 'independent'}
                onClick={() => setReaderMode('independent')}
              >
                Lectores independientes · hasta 4
              </button>
            </div>
            {readerMode !== 'independent' && (
              <StudyToolbar
                {...{
                  book,
                  chapter,
                  books,
                  version,
                  versions,
                  setVersion,
                  navigate,
                }}
              />
            )}
            <div
              className={
                'study-grid reader-workspace ' +
                (!showReferences ? 'without-references ' : '') +
                (readerMode === 'independent'
                  ? 'independent-study '
                  : readerMode === 'comparison'
                    ? 'verse-comparison-mode '
                    : '')
              }
            >
              {readerMode === 'comparison' && (
                <VerseComparison
                  selected={selected}
                  versions={versions}
                  onStrong={setDictionaryTopic}
                />
              )}
              {readerMode === 'independent' ? (
                <IndependentReaders
                  versions={versions}
                  version={version}
                  selected={selected}
                  navigationRequest={navigationRequest}
                  bookmarks={bookmarks}
                  toggleBookmark={toggleBookmark}
                  onActivate={activateIndependentReader}
                  onStrong={setDictionaryTopic}
                />
              ) : (
                <Reader
                  {...{
                    version,
                    selected,
                    versions,
                    book,
                    chapter,
                    bookmarks,
                    navigationRequest,
                  }}
                  onSelect={setSelected}
                  onChapter={navigateChapter}
                  toggleBookmark={toggleBookmark}
                  onStrong={setDictionaryTopic}
                />
              )}
              {showReferences && (
                <References
                  {...{ links, selected, version, direction, setDirection, min, setMin }}
                  onSelect={navigate}
                  note={notes[selected] || ''}
                  setNote={(note) => setNotes({ ...notes, [selected]: note })}
                />
              )}
            </div>
          </>
        )}
        <AppFooter {...{ versions }} />
      </main>
      {dictionaryTopic !== null && (
        <DictionaryWindow topic={dictionaryTopic} onClose={() => setDictionaryTopic(null)} />
      )}
      {search && <Search version={version} onSelect={navigate} onClose={() => setSearch(false)} />}
    </>
  );
}
