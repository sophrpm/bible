import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const root = path.resolve(import.meta.dirname, '../..');
export const storage = path.resolve(process.env.BIBLE_STORAGE || path.join(root, 'storage'));
fs.mkdirSync(path.join(storage, 'Bversions'), { recursive: true });
export const db = new DatabaseSync(path.join(storage, 'bible.sqlite3'));
// WAL permits readers to keep working while an imported translation is committed.
db.exec(`
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS versions (
    id TEXT PRIMARY KEY,
    name TEXT,
    copyright TEXT
  );

  CREATE TABLE IF NOT EXISTS verses (
    version TEXT,
    id TEXT,
    book TEXT,
    chapter INTEGER,
    verse INTEGER,
    text TEXT,
    PRIMARY KEY (version, id)
  );
  CREATE INDEX IF NOT EXISTS chapter_idx ON verses (version, book, chapter);

  CREATE TABLE IF NOT EXISTS links (
    source TEXT,
    target TEXT,
    end TEXT,
    votes INTEGER
  );
  CREATE INDEX IF NOT EXISTS source_idx ON links (source);
  CREATE INDEX IF NOT EXISTS target_idx ON links (target);

  CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

// Additive tables preserve existing installations and imported translations.
db.exec(`
 CREATE TABLE IF NOT EXISTS verse_markup(version TEXT,id TEXT,markup TEXT,PRIMARY KEY(version,id));
 CREATE TABLE IF NOT EXISTS chapter_headings(version TEXT,book TEXT,chapter INTEGER,verse INTEGER,title TEXT,PRIMARY KEY(version,book,chapter,verse));
 CREATE TABLE IF NOT EXISTS version_sources(version TEXT PRIMARY KEY,filename TEXT,strongs INTEGER);
 CREATE TABLE IF NOT EXISTS dictionaries(id TEXT PRIMARY KEY,name TEXT,filename TEXT UNIQUE);
`);
