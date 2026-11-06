import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';
import { db, storage } from './database';
import { plainBibleText } from '../../shared/strongs';
import type { DictionaryInfo, DictionaryEntry } from '../../shared/bible';

const directory = path.join(storage, 'Dictionaries');
fs.mkdirSync(directory, { recursive: true });

export function importDictionary(buffer: Buffer, filename: string): string {
  if (buffer.subarray(0, 16).toString() !== 'SQLite format 3\0') {
    throw new Error('El archivo no es SQLite3.');
  }
  if (
    filename !== path.win32.basename(filename) ||
    /[<>:"/\\|?*\x00-\x1f]/.test(filename) ||
    /[. ]$/.test(filename) ||
    /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(filename)
  ) {
    throw new Error('Nombre de diccionario no válido.');
  }
  const file = path.join(directory, filename);
  try {
    fs.writeFileSync(file, buffer, { flag: 'wx' });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      throw new Error('Ya existe un diccionario con ese nombre.');
    throw error;
  }
  let source: DatabaseSync | undefined;
  try {
    source = new DatabaseSync(file, { readOnly: true });
    const columns = source
      .prepare('PRAGMA table_info(dictionary)')
      .all()
      .map((row) => row.name);
    if (
      ![
        'topic',
        'definition',
        'lexeme',
        'transliteration',
        'pronunciation',
        'short_definition',
      ].every((column) => columns.includes(column))
    ) {
      throw new Error('El esquema dictionary no coincide con el requerido.');
    }
    const id = randomUUID();
    db.prepare('INSERT INTO dictionaries VALUES(?,?,?)').run(
      id,
      filename.replace(/\.(?:dictionary\.)?sqlite3?$/i, ''),
      filename,
    );
    return id;
  } catch (error) {
    source?.close();
    source = undefined;
    fs.unlinkSync(file);
    throw error;
  } finally {
    source?.close();
  }
}

export function listDictionaries(): DictionaryInfo[] {
  return db.prepare('SELECT * FROM dictionaries ORDER BY name').all() as DictionaryInfo[];
}

export function dictionaryEntries(
  query: string,
  ids: string[],
  exact: boolean,
  offset = 0,
): { items: DictionaryEntry[]; more: boolean } {
  const dictionaries = listDictionaries().filter((item) => !ids.length || ids.includes(item.id));
  const items: DictionaryEntry[] = [];
  let more = false;
  for (const dictionary of dictionaries) {
    const source = new DatabaseSync(path.join(directory, dictionary.filename), { readOnly: true });
    try {
      const pattern = '%' + query.replace(/[\\%_]/g, '\\$&') + '%';
      const filter = exact
        ? 'topic IN (?,?)'
        : "(topic LIKE ? ESCAPE '\\' OR lexeme LIKE ? ESCAPE '\\' OR definition LIKE ? ESCAPE '\\')";
      const parameters = exact
        ? [query.toUpperCase(), query.replace(/^[HG]/i, '')]
        : [pattern, pattern, pattern];
      const rows = source
        .prepare(
          `SELECT topic,definition,lexeme,transliteration,pronunciation,short_definition FROM dictionary WHERE ${filter} ORDER BY topic LIMIT 31 OFFSET ?`,
        )
        .all(...parameters, offset) as Omit<DictionaryEntry, 'dictionaryId' | 'dictionaryName'>[];
      if (rows.length > 30) more = true;
      items.push(
        ...rows.slice(0, 30).map((row) => ({
          ...row,
          definition: plainBibleText(
            (row.definition || '').replace(/<br\s*\/?\s*>|<\/(?:p|div)>/gi, '\n'),
          ),
          dictionaryId: dictionary.id,
          dictionaryName: dictionary.name,
        })),
      );
    } finally {
      source.close();
    }
  }
  return { items, more };
}
