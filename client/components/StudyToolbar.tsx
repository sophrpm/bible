import { BookOpen } from 'lucide-react';
import { Select } from './Select';

import type { BookSummary, Version } from '../../shared/bible';

type Props = {
  book: string;
  chapter: number;
  books: BookSummary[];
  version: string;
  versions: Version[];
  setVersion: (id: string) => void;
  navigate: (id: string) => void;
};

export function StudyToolbar({
  book,
  chapter,
  books,
  version,
  versions,
  setVersion,
  navigate,
}: Props) {
  return (
    <>
      <section className="study-toolbar">
        <div className="passage-controls">
          <BookOpen size={18} />
          <Select label="Libro" value={book} onChange={(value) => navigate(value + '.1.1')}>
            {books.map((b) => (
              <option key={b.book} value={b.book}>
                {b.name}
              </option>
            ))}
          </Select>
          <Select
            label="Capítulo"
            value={chapter}
            onChange={(value) => navigate(book + '.' + value + '.1')}
          >
            {Array.from(
              { length: books.find((b) => b.book === book)?.chapters || chapter },
              (_, i) => (
                <option key={i} value={i + 1}>
                  Capítulo {i + 1}
                </option>
              ),
            )}
          </Select>
        </div>
        <div className="version-controls">
          <Select label="Versión principal" value={version} onChange={setVersion}>
            {versions.map((v) => (
              <option key={v.id} value={v.id}>
                {v.id.startsWith('local-') ? v.name : v.id}
              </option>
            ))}
          </Select>
          <span className="divider" />
        </div>
      </section>
    </>
  );
}
