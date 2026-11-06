import { plainBibleText } from '../../shared/strongs';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { db, storage } from './database';
import { codes } from '../../shared/bible';

type ImportedBook = { book_number: number };
type ImportedVerse = { book_number: number; chapter: number; verse: number; text: string };
type TableColumn = { name: string };

/** Validate before writing any records; retain an untouched copy for offline access. */
export function importVersion(buffer: Buffer, name: string) {
  if (buffer.subarray(0, 16).toString() !== 'SQLite format 3\0') {
    throw Error('El archivo no es una base SQLite3 válida.');
  }
  const id = 'local-' + crypto.randomUUID().slice(0, 8);
  // Reject unsafe names rather than silently renaming the user's file.
  if (
    !name ||
    name !== path.win32.basename(name) ||
    /[<>:"/\\|?*\x00-\x1f]/.test(name) ||
    /[. ]$/.test(name) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(name)
  ) {
    throw new Error('El nombre del archivo no es válido. Usa un nombre de archivo local válido.');
  }
  const file = path.join(storage, 'Bversions', name);
  try {
    // Exclusive creation preserves an existing file when the same name is imported twice.
    fs.writeFileSync(file, buffer, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw new Error(`Ya existe ${name} en Bversions. No se ha reemplazado ni renombrado.`);
    }
    throw error;
  }
  let source: DatabaseSync | undefined;
  try {
    source = new DatabaseSync(file, { readOnly: true });
    const columns = (source.prepare('PRAGMA table_info(verses)').all() as TableColumn[]).map(
      (column) => column.name,
    );
    if (!['book_number', 'chapter', 'verse', 'text'].every((c) => columns.includes(c))) {
      throw Error('Se requiere verses(book_number, chapter, verse, text).');
    }
    const books = source
      .prepare('SELECT book_number FROM books ORDER BY book_number')
      .all() as ImportedBook[];
    if (books.length !== 66) {
      throw Error('Se requieren los 66 libros canónicos en books, ordenados por book_number.');
    }
    const map = new Map(books.map((b, i) => [b.book_number, codes[i]]));
    const rows = source
      .prepare('SELECT book_number,chapter,verse,text FROM verses')
      .all() as ImportedVerse[];
    if (
      !rows.length ||
      rows.some(
        (r) =>
          !map.has(r.book_number) ||
          !Number.isInteger(r.chapter) ||
          r.chapter < 1 ||
          !Number.isInteger(r.verse) ||
          r.verse < 1 ||
          typeof r.text !== 'string',
      )
    ) {
      throw Error('Los versículos contienen datos no válidos.');
    }
    // The version becomes visible only if every verse has been inserted successfully.
    db.exec('BEGIN');
    try {
      db.prepare('INSERT INTO versions VALUES(?,?,?)').run(
        id,
        name.replace(/\.sqlite3?$/i, ''),
        'Versión importada por el usuario',
      );
      const put = db.prepare('INSERT INTO verses VALUES(?,?,?,?,?,?)');
      const putMarkup = db.prepare('INSERT INTO verse_markup VALUES(?,?,?)');
      const hasStrongs = /\+\.(sqlite3?|db)$/i.test(name);
      db.prepare('INSERT INTO version_sources VALUES(?,?,?)').run(id, name, hasStrongs ? 1 : 0);
      for (const r of rows) {
        const b = map.get(r.book_number)!;
        const text = plainBibleText(r.text);
        if (hasStrongs) {
          putMarkup.run(id, `${b}.${r.chapter}.${r.verse}`, r.text);
        }
        put.run(id, `${b}.${r.chapter}.${r.verse}`, b, r.chapter, r.verse, text);
      }
      const hasStories = source.prepare("SELECT 1 FROM sqlite_master WHERE name='stories'").get();
      if (hasStories) {
        const headings = source
          .prepare('SELECT book_number,chapter,verse,title FROM stories ORDER BY order_if_several')
          .all() as { book_number: number; chapter: number; verse: number; title: string }[];
        const putHeading = db.prepare('INSERT OR REPLACE INTO chapter_headings VALUES(?,?,?,?,?)');
        for (const heading of headings) {
          const book = map.get(heading.book_number);
          if (book)
            putHeading.run(id, book, heading.chapter, heading.verse, plainBibleText(heading.title));
        }
      }
      db.exec('COMMIT');
    } catch (e) {
      db.exec('ROLLBACK');
      throw e;
    }
    return id;
  } catch (e) {
    source?.close();
    source = undefined;
    fs.unlinkSync(file);
    throw e;
  } finally {
    source?.close();
  }
}
