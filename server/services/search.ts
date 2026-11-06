import { parsePassage } from '../../shared/passage';
import { db } from './database';
import { codes, type SearchResults, type Verse } from '../../shared/bible';

type SearchOptions = {
  text: string;
  version: string;
  book?: string;
  testament?: string;
  offset: number;
};
const PAGE_SIZE = 50;

/** Build one parameterized filter and reuse it for both results and the total count. */
export function searchVerses({
  text,
  version,
  book,
  testament,
  offset,
}: SearchOptions): SearchResults {
  if (text.length < 2) {
    return { items: [], total: 0 };
  }
  const passage = parsePassage(text);
  const values: (string | number)[] = [];
  const conditions: string[] = [];
  if (version !== '*') {
    conditions.push('version = ?');
    values.push(version);
  }
  if (passage) {
    conditions.push('id = ?');
    values.push(passage);
  } else {
    conditions.push("text LIKE ? ESCAPE '\\'");
    values.push('%' + text.replace(/[\\%_]/g, '\\$&') + '%');
  }
  if (book) {
    conditions.push('book = ?');
    values.push(book);
  }
  if (testament) {
    const books = testament === 'nt' ? codes.slice(39) : codes.slice(0, 39);
    conditions.push(`book IN (${books.map(() => '?').join(', ')})`);
    values.push(...books);
  }
  const filter = conditions.join(' AND ');
  const items = db
    .prepare(
      `
  SELECT id, book, chapter, verse, text, version
  FROM verses
  WHERE ${filter}
  ORDER BY rowid
  LIMIT ? OFFSET ?
 `,
    )
    .all(...values, PAGE_SIZE, offset) as Verse[];
  const count = db
    .prepare(`SELECT COUNT(*) AS total FROM verses WHERE ${filter}`)
    .get(...values) as { total: number };
  return { items, total: count.total };
}
