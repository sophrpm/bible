import type { BookSummary } from '../shared/bible';

export type ReaderPanel = { id: string; version: string; selected: string };
export const MAX_READERS = 4;

/** Each panel owns its passage; moving one panel never changes its neighbours. */
export function updateReader(
  panels: ReaderPanel[],
  id: string,
  patch: Partial<Omit<ReaderPanel, 'id'>>,
): ReaderPanel[] {
  return panels.map((panel) => (panel.id === id ? { ...panel, ...patch } : panel));
}

export function chapterDestination(
  books: BookSummary[],
  selected: string,
  chapter: number,
): string | null {
  const book = selected.split('.')[0];
  const index = books.findIndex((item) => item.book === book);
  const current = books[index];
  if (!current) {
    return null;
  }
  if (chapter < 1) {
    const previous = books[index - 1];
    return previous ? `${previous.book}.${previous.chapters}.1` : null;
  }
  if (chapter > current.chapters) {
    const next = books[index + 1];
    return next ? `${next.book}.1.1` : null;
  }
  return `${book}.${chapter}.1`;
}
