import fs from 'node:fs';
import path from 'node:path';
import { db, root } from './database';
import { codes, osis } from '../../shared/bible';

type SourceItem = { type: string; verse_numbers: number[]; lines: string[] };
type SourceChapter = { usfm: string; items: SourceItem[] };
type SourceBook = { usfm: string; chapters: SourceChapter[] };
type SourceBible = {
  local_abbreviation: string;
  local_title: string;
  copyright: { text: string };
  books: SourceBook[];
};

const SEED_MARKER = 'seed-v2';
const DEFAULT_BIBLE_FILES = ['LBLA_vid_89.json', 'RVR1960_vid_149.json'];

function seedTranslation(filename: string): void {
  const json = fs.readFileSync(path.join(root, '..', filename), 'utf8').replace(/^\uFEFF/, '');
  const bible = JSON.parse(json) as SourceBible;
  const version = bible.local_abbreviation;
  db.prepare('INSERT OR IGNORE INTO versions (id, name, copyright) VALUES (?, ?, ?)').run(
    version,
    bible.local_title,
    bible.copyright.text,
  );
  const insertVerse = db.prepare(`
  INSERT OR REPLACE INTO verses (version, id, book, chapter, verse, text)
  VALUES (?, ?, ?, ?, ?, ?)
 `);

  for (const book of bible.books) {
    for (const chapter of book.chapters) {
      const chapterNumber = Number(chapter.usfm.split('.')[1]);
      for (const item of chapter.items) {
        if (item.type !== 'verse') {
          continue;
        }
        // Some source items span several verse numbers; keep each address navigable.
        for (const verseNumber of item.verse_numbers) {
          insertVerse.run(
            version,
            `${book.usfm}.${chapterNumber}.${verseNumber}`,
            book.usfm,
            chapterNumber,
            verseNumber,
            item.lines.join(' '),
          );
        }
      }
    }
  }
}

function normalizeReference(reference: string): string {
  const [book, ...numbers] = reference.split('.');
  return [codes[osis.indexOf(book)], ...numbers].join('.');
}

function seedReferences(): void {
  const lines = fs
    .readFileSync(path.join(root, '..', 'cross_references.txt'), 'utf8')
    .split(/\r?\n/)
    .slice(1);
  const insertReference = db.prepare(
    'INSERT INTO links (source, target, end, votes) VALUES (?, ?, ?, ?)',
  );
  for (const line of lines) {
    const [source, target, votes] = line.split('\t');
    if (!source || !target) {
      continue;
    }
    const [start, end] = target.split('-');
    insertReference.run(
      normalizeReference(source),
      normalizeReference(start),
      normalizeReference(end || start),
      Number(votes) || 0,
    );
  }
}

/** The marker is committed with the data, so an interrupted seed can safely be retried. */
export function seed(): void {
  if (db.prepare('SELECT 1 FROM meta WHERE key = ?').get(SEED_MARKER)) {
    return;
  }
  db.exec('BEGIN');
  try {
    // Only generated references are rebuilt; locally imported translations remain intact.
    db.exec('DELETE FROM links');
    for (const filename of DEFAULT_BIBLE_FILES) {
      seedTranslation(filename);
    }
    seedReferences();
    db.prepare('INSERT INTO meta (key, value) VALUES (?, ?)').run(SEED_MARKER, '1');
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}
