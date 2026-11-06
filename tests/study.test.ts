import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { verseTokens, plainBibleText } from '../shared/strongs';
import { zoomAroundPoint } from '../client/components/visualizations/zoom';

test('el zoom mantiene el punto señalado inmóvil', () => {
  const view = { zoom: 2, pan: { x: 80, y: -20 } },
    anchor = { x: 310, y: 170 };
  const graphPoint = {
    x: (anchor.x - view.pan.x - 600) / view.zoom + 600,
    y: (anchor.y - view.pan.y - 255) / view.zoom + 255,
  };
  const next = zoomAroundPoint(view, anchor, 1.5, 510);
  assert(Math.abs((graphPoint.x - 600) * next.zoom + 600 + next.pan.x - anchor.x) < 1e-8);
  assert(Math.abs((graphPoint.y - 255) * next.zoom + 255 + next.pan.y - anchor.y) < 1e-8);
});

test('los marcadores Strong conservan idioma y excluyen morfología', () => {
  assert.deepEqual(verseTokens('Dios<S>430</S><m>NCMPA</m>', 'GEN'), [
    { text: 'Dios' },
    { strong: 'H430' },
  ]);
  assert.deepEqual(verseTokens('Verbo<S>3056</S>', 'JHN'), [
    { text: 'Verbo' },
    { strong: 'G3056' },
  ]);
  assert.equal(plainBibleText('Dios<S>430</S><m>NCMPA</m>'), 'Dios');
});

test('importación + y diccionario guardan marcadores, títulos y consultas', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'concordia-study-'));
  process.env.BIBLE_STORAGE = directory;
  const biblePath = path.join(directory, 'fixture.sqlite3'),
    dictionaryPath = path.join(directory, 'dictionary.sqlite3');
  const bible = new DatabaseSync(biblePath);
  bible.exec(
    'CREATE TABLE books(book_number INTEGER);CREATE TABLE verses(book_number INTEGER,chapter INTEGER,verse INTEGER,text TEXT);CREATE TABLE stories(book_number INTEGER,chapter INTEGER,verse INTEGER,order_if_several INTEGER,title TEXT)',
  );
  for (let i = 1; i <= 66; i++) bible.prepare('INSERT INTO books VALUES(?)').run(i * 10);
  bible
    .prepare('INSERT INTO verses VALUES(?,?,?,?)')
    .run(10, 1, 1, 'En el principio<S>7225</S><m>NC</m>');
  bible.prepare('INSERT INTO stories VALUES(?,?,?,?,?)').run(10, 1, 1, 1, 'La creación');
  bible.close();
  const dictionary = new DatabaseSync(dictionaryPath);
  dictionary.exec(
    'CREATE TABLE dictionary(topic TEXT,definition TEXT,lexeme TEXT,transliteration TEXT,pronunciation TEXT,short_definition TEXT)',
  );
  dictionary
    .prepare('INSERT INTO dictionary VALUES(?,?,?,?,?,?)')
    .run('H7225', '<b>Principio</b><br/>Comienzo', 'ראשית', 'reshith', 'ray-sheeth', 'Comienzo');
  dictionary.close();
  const { db } = await import('../server/services/database');
  try {
    const { importVersion } = await import('../server/services/import');
    const { readChapter, listVersions } = await import('../server/services/reading');
    const { searchVerses } = await import('../server/services/search');
    const { importDictionary, dictionaryEntries } = await import('../server/services/dictionaries');
    const plus = importVersion(fs.readFileSync(biblePath), 'Ejemplo+.SQLite3');
    const plain = importVersion(fs.readFileSync(biblePath), 'Ejemplo.SQLite3');
    assert(listVersions().find((version) => version.id === plus)?.strongs);
    assert(!listVersions().find((version) => version.id === plain)?.strongs);
    const chapter = readChapter(plus, 'GEN', 1);
    assert.match(chapter[0].markup || '', /<S>7225/);
    assert.equal(chapter[0].text, 'En el principio');
    assert.equal(chapter[0].heading, 'La creación');
    const results = searchVerses({ text: 'principio', version: '*', offset: 0 });
    assert.equal(results.total, 2);
    assert.equal(new Set(results.items.map((item) => item.version)).size, 2);
    const id = importDictionary(fs.readFileSync(dictionaryPath), 'Strong ejemplo.SQLite3');
    const entry = dictionaryEntries('H7225', [id], true).items[0];
    assert.equal(entry.topic, 'H7225');
    assert.match(entry.definition, /Principio/);
    assert(!entry.definition.includes('<b>'));
    assert.equal(dictionaryEntries('Comienzo', [id], false).items.length, 1);
    assert.throws(
      () => importDictionary(fs.readFileSync(dictionaryPath), 'Strong ejemplo.SQLite3'),
      /Ya existe/,
    );
  } finally {
    db.close();
    for (const folder of ['Bversions', 'Dictionaries']) {
      const target = path.join(directory, folder);
      if (fs.existsSync(target)) {
        for (const file of fs.readdirSync(target)) fs.unlinkSync(path.join(target, file));
        fs.rmdirSync(target);
      }
    }
    for (const file of fs.readdirSync(directory)) fs.unlinkSync(path.join(directory, file));
    fs.rmdirSync(directory);
  }
});
