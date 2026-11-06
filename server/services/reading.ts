import { db } from './database';
import {
  codes,
  names,
  group,
  type BookSummary,
  type Verse,
  type Version,
} from '../../shared/bible';

/** Database rows are translated into the public API model at the service boundary. */
export function listVersions(): Version[] {
  return db
    .prepare(
      'SELECT v.id,v.name,v.copyright,COALESCE(s.strongs,0) AS strongs FROM versions v LEFT JOIN version_sources s ON s.version=v.id',
    )
    .all()
    .map((row) => ({
      id: String(row.id),
      name: String(row.name),
      copyright: String(row.copyright),
      strongs: Boolean(row.strongs),
    }));
}

export function listBooks(version: string): BookSummary[] {
  const rows = db
    .prepare(
      `
  SELECT book, MAX(chapter) AS chapters
  FROM verses
  WHERE version = ?
  GROUP BY book
 `,
    )
    .all(version) as { book: string; chapters: number }[];
  return rows
    .map((row) => {
      const order = codes.indexOf(row.book);
      return { ...row, name: names[order], order, group: group(order) };
    })
    .sort((left, right) => left.order - right.order);
}

export function readChapter(version: string, book: string, chapter: number): Verse[] {
  return db
    .prepare(
      `
  SELECT v.id, v.book, v.chapter, v.verse, v.text, m.markup, h.title AS heading
  FROM verses v
  LEFT JOIN verse_markup m ON m.version=v.version AND m.id=v.id
  LEFT JOIN chapter_headings h ON h.version=v.version AND h.book=v.book AND h.chapter=v.chapter AND h.verse=v.verse
  WHERE v.version = ? AND v.book = ? AND v.chapter = ?
  ORDER BY v.verse
 `,
    )
    .all(version, book, chapter) as Verse[];
}

export function readVerse(version: string, id: string): Verse | null {
  return (
    (db
      .prepare(
        `
  SELECT v.id, v.book, v.chapter, v.verse, v.text, m.markup
  FROM verses v LEFT JOIN verse_markup m ON m.version=v.version AND m.id=v.id
  WHERE v.version = ? AND v.id = ?
 `,
      )
      .get(version, id) as Verse | undefined) ?? null
  );
}
