import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';

test('importa SQLite real, conserva archivo y datos al reabrir', async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'concordia-test-'));
  process.env.BIBLE_STORAGE = dir;
  const { importVersion } = await import('../server/services/import');
  const { db } = await import('../server/services/database');
  try {
    const buffer = fs.readFileSync(path.resolve('../LBLA+.SQLite3'));
    const id = importVersion(buffer, 'LBLA prueba.SQLite3');
    const stored = path.join(dir, 'Bversions', 'LBLA prueba.SQLite3');
    assert(fs.readFileSync(stored).equals(buffer));
    assert.throws(() => importVersion(buffer, 'LBLA prueba.SQLite3'), /Ya existe/);
    assert(fs.readFileSync(stored).equals(buffer));
    assert.throws(() => importVersion(buffer, '../escape.SQLite3'), /nombre/);
    assert(
      (db.prepare('SELECT COUNT(*) n FROM verses WHERE version=?').get(id) as { n: number }).n >
        30000,
    );
    // Browser filenames travel in an explicit UTF-8 form field, including their extension.
    const { createApp } = await import('../server/app');
    const app = await createApp({ serveClient: false });
    const server = app.listen(0, '127.0.0.1');
    await new Promise<void>((resolve) => server.once('listening', resolve));
    try {
      const address = server.address() as { port: number };
      const form = new FormData();
      const originalName = 'Biblia española.SQLite3';
      form.append('filename', originalName);
      form.append('file', new Blob([new Uint8Array(buffer)]), originalName);
      const response = await fetch(`http://127.0.0.1:${address.port}/api/versions/import`, {
        method: 'POST',
        body: form,
      });
      assert.equal(response.status, 201);
      assert(fs.readFileSync(path.join(dir, 'Bversions', originalName)).equals(buffer));
    } finally {
      await new Promise<void>((resolve, reject) =>
        server.close((error) => (error ? reject(error) : resolve())),
      );
    }
    db.close();
    const reopened = new DatabaseSync(path.join(dir, 'bible.sqlite3'));
    assert(reopened.prepare('SELECT 1 FROM versions WHERE id=?').get(id));
    assert.match(
      (
        reopened.prepare("SELECT text FROM verses WHERE version=? AND id='JHN.1.1'").get(id) as {
          text: string;
        }
      ).text,
      /Verbo/,
    );
    reopened.close();
  } finally {
    try {
      db.close();
    } catch {
      // The successful persistence check already closes this connection.
    }
    for (const file of fs.readdirSync(path.join(dir, 'Bversions'))) {
      fs.unlinkSync(path.join(dir, 'Bversions', file));
    }
    fs.rmdirSync(path.join(dir, 'Bversions'));
    const dictionaries = path.join(dir, 'Dictionaries');
    if (fs.existsSync(dictionaries)) {
      for (const file of fs.readdirSync(dictionaries)) fs.unlinkSync(path.join(dictionaries, file));
      fs.rmdirSync(dictionaries);
    }
    for (const file of fs.readdirSync(dir)) {
      fs.unlinkSync(path.join(dir, file));
    }
    fs.rmdirSync(dir);
  }
});
