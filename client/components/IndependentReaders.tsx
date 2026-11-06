import { useEffect, useRef, useState } from 'react';
import { Plus, X, BookOpen } from 'lucide-react';
import { api } from '../api';
import { useStored } from '../storage';
import { Reader } from './Reader';
import { Select } from './Select';
import { chapterDestination, MAX_READERS, updateReader, type ReaderPanel } from '../readerPanels';
import type { BookSummary, Version } from '../../shared/bible';

type PanelProps = {
  onStrong?: (topic: string) => void;
  panel: ReaderPanel;
  index: number;
  versions: Version[];
  bookmarks: string[];
  active: boolean;
  navigationRequest: number;
  onChange: (patch: Partial<Omit<ReaderPanel, 'id'>>) => void;
  onActivate: () => void;
  onRemove: () => void;
  canRemove: boolean;
  toggleBookmark: (id: string) => void;
};

function IndependentPanel({
  panel,
  index,
  versions,
  bookmarks,
  active,
  navigationRequest,
  onChange,
  onActivate,
  onRemove,
  canRemove,
  toggleBookmark,
  onStrong,
}: PanelProps) {
  const [books, setBooks] = useState<BookSummary[]>([]);
  const [error, setError] = useState('');
  const [book, chapterText] = panel.selected.split('.');
  const chapter = Number(chapterText);
  useEffect(() => {
    let alive = true;
    setError('');
    api<BookSummary[]>('books', { version: panel.version })
      .then((result) => {
        if (alive) setBooks(result);
      })
      .catch((error: Error) => {
        if (alive) setError(error.message);
      });
    return () => {
      alive = false;
    };
  }, [panel.version]);
  function navigateChapter(number: number) {
    const destination = chapterDestination(books, panel.selected, number);
    if (destination) {
      onChange({ selected: destination });
    }
  }
  return (
    <section
      className={'independent-panel ' + (active ? 'active-panel' : '')}
      aria-label={`Lector independiente ${index + 1}`}
    >
      <div className="independent-panel-heading">
        <button aria-pressed={active} onClick={onActivate}>
          <BookOpen size={15} /> Lector {index + 1}
          <small>{active ? 'Referencias activas' : 'Activar referencias'}</small>
        </button>
        <button aria-label={`Cerrar lector ${index + 1}`} disabled={!canRemove} onClick={onRemove}>
          <X size={15} />
        </button>
      </div>
      <div className="independent-panel-controls">
        <Select
          label={`Versión lector ${index + 1}`}
          value={panel.version}
          onChange={(version) => onChange({ version })}
        >
          {versions.map((version) => (
            <option key={version.id} value={version.id}>
              {version.id.startsWith('local-') ? version.name : version.id}
            </option>
          ))}
        </Select>
        <Select
          label={`Libro lector ${index + 1}`}
          value={book}
          onChange={(book) => onChange({ selected: book + '.1.1' })}
        >
          {books.map((book) => (
            <option key={book.book} value={book.book}>
              {book.name}
            </option>
          ))}
        </Select>
        <Select
          label={`Capítulo lector ${index + 1}`}
          value={chapter}
          onChange={(value) => onChange({ selected: `${book}.${value}.1` })}
        >
          {Array.from(
            { length: books.find((item) => item.book === book)?.chapters || chapter },
            (_, i) => (
              <option key={i} value={i + 1}>
                Capítulo {i + 1}
              </option>
            ),
          )}
        </Select>
      </div>
      {error && <p role="alert">{error}</p>}
      <Reader
        version={panel.version}
        selected={panel.selected}
        onSelect={(selected) => onChange({ selected })}
        versions={versions}
        book={book}
        chapter={chapter}
        onChapter={navigateChapter}
        bookmarks={bookmarks}
        toggleBookmark={toggleBookmark}
        navigationRequest={navigationRequest}
        onStrong={onStrong}
      />
    </section>
  );
}

type Props = {
  onStrong?: (topic: string) => void;
  versions: Version[];
  version: string;
  selected: string;
  navigationRequest: number;
  bookmarks: string[];
  toggleBookmark: (id: string) => void;
  onActivate: (selected: string, version: string) => void;
};

export function IndependentReaders({
  versions,
  version,
  selected,
  navigationRequest,
  bookmarks,
  toggleBookmark,
  onActivate,
  onStrong,
}: Props) {
  const [panels, setPanels] = useStored<ReaderPanel[]>('independent-readers', [
    { id: 'reader-1', version, selected },
  ]);
  const [activeId, setActiveId] = useStored('active-reader', 'reader-1');
  const handledNavigation = useRef(-1);
  const [panelRequests, setPanelRequests] = useState<Record<string, number>>({});
  const activePanel = panels.find((panel) => panel.id === activeId) || panels[0];

  useEffect(() => {
    if (handledNavigation.current === navigationRequest || !activePanel) {
      return;
    }
    handledNavigation.current = navigationRequest;
    setPanels((current) => updateReader(current, activePanel.id, { selected, version }));
    setPanelRequests((current) => ({ ...current, [activePanel.id]: navigationRequest + 1 }));
    onActivate(selected, version);
  }, [navigationRequest, selected, activePanel?.id, setPanels]);

  function changePanel(panel: ReaderPanel, patch: Partial<Omit<ReaderPanel, 'id'>>) {
    const next = { ...panel, ...patch };
    setPanels((current) => updateReader(current, panel.id, patch));
    setActiveId(panel.id);
    onActivate(next.selected, next.version);
  }
  function addPanel() {
    if (panels.length >= MAX_READERS) {
      return;
    }
    const next = {
      id: crypto.randomUUID(),
      version: versions[panels.length % versions.length]?.id || version,
      selected,
    };
    setPanels((current) => [...current, next]);
  }
  function removePanel(panel: ReaderPanel) {
    if (panels.length <= 1) {
      return;
    }
    const remaining = panels.filter((item) => item.id !== panel.id);
    setPanels(remaining);
    if (activePanel?.id === panel.id) {
      setActiveId(remaining[0].id);
      onActivate(remaining[0].selected, remaining[0].version);
    }
  }
  return (
    <div className="independent-readers">
      <div className="independent-readers-toolbar">
        <div>
          <strong>Lectores independientes</strong>
          <span>Cada panel conserva su Biblia, pasaje y desplazamiento.</span>
        </div>
        <button onClick={addPanel} disabled={panels.length >= MAX_READERS || !versions.length}>
          <Plus size={15} /> Abrir lector <small>{panels.length}/4</small>
        </button>
      </div>
      <div className="independent-readers-grid">
        {panels.map((panel, index) => (
          <IndependentPanel
            key={panel.id}
            panel={panel}
            index={index}
            versions={versions}
            bookmarks={bookmarks}
            active={panel.id === activePanel?.id}
            navigationRequest={panelRequests[panel.id] || 0}
            onChange={(patch) => changePanel(panel, patch)}
            onActivate={() => {
              setActiveId(panel.id);
              onActivate(panel.selected, panel.version);
            }}
            onRemove={() => removePanel(panel)}
            canRemove={panels.length > 1}
            toggleBookmark={toggleBookmark}
            onStrong={onStrong}
          />
        ))}
      </div>
    </div>
  );
}
