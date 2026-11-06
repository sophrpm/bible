import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { db, root, storage } from './database';
import { codes } from '../../shared/bible';

/** Recover headings and Strong markup without replacing existing verse text or original files. */
export function enrichExistingBibles(): void {
  if (!db.prepare("SELECT 1 FROM meta WHERE key='headings-v1'").get()) {
    db.exec('BEGIN');
    try {
      const put = db.prepare('INSERT OR IGNORE INTO chapter_headings VALUES(?,?,?,?,?)');
      for (const filename of ['LBLA_vid_89.json', 'RVR1960_vid_149.json']) {
        const bible = JSON.parse(
          fs.readFileSync(path.join(root, '..', filename), 'utf8').replace(/^\uFEFF/, ''),
        ) as {
          local_abbreviation: string;
          books: {
            usfm: string;
            chapters: {
              usfm: string;
              items: { type: string; lines: string[]; verse_numbers: number[] }[];
            }[];
          }[];
        };
        for (const book of bible.books)
          for (const chapter of book.chapters) {
            let heading = '';
            for (const item of chapter.items) {
              if (item.type.startsWith('heading'))
                heading += (heading ? ' · ' : '') + item.lines.join(' ');
              else if (item.type === 'verse' && heading) {
                put.run(
                  bible.local_abbreviation,
                  book.usfm,
                  Number(chapter.usfm.split('.')[1]),
                  item.verse_numbers[0],
                  heading,
                );
                heading = '';
              }
            }
          }
      }
      db.prepare('INSERT INTO meta VALUES(?,?)').run('headings-v1', '1');
      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }
  const versions = db
    .prepare(
      "SELECT id,name FROM versions WHERE name LIKE '%+' AND id NOT IN (SELECT version FROM version_sources)",
    )
    .all() as { id: string; name: string }[];
  for (const version of versions) {
    const filename = [version.name + '.SQLite3', version.id + '.SQLite3'].find((name) =>
      fs.existsSync(path.join(storage, 'Bversions', name)),
    );
    if (!filename) continue;
    const source = new DatabaseSync(path.join(storage, 'Bversions', filename), { readOnly: true });
    try {
      const books = source.prepare('SELECT book_number FROM books ORDER BY book_number').all();
      const mapping = new Map(books.map((book, index) => [book.book_number, codes[index]]));
      const rows = source.prepare('SELECT book_number,chapter,verse,text FROM verses').all();
      db.exec('BEGIN');
      try {
        const put = db.prepare('INSERT OR REPLACE INTO verse_markup VALUES(?,?,?)');
        for (const row of rows) {
          const book = mapping.get(row.book_number);
          if (book) put.run(version.id, `${book}.${row.chapter}.${row.verse}`, row.text);
        }
        db.prepare('INSERT INTO version_sources VALUES(?,?,?)').run(version.id, filename, 1);
        db.exec('COMMIT');
      } catch (error) {
        db.exec('ROLLBACK');
        throw error;
      }
    } finally {
      source.close();
    }
  }
}
