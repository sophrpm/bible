import { before, after, test } from 'node:test';
import { startApiServer } from './helpers/apiServer';
import type { Version, BookSummary, Verse, Link, SearchResults, AtlasData } from '../shared/bible';
import assert from 'node:assert/strict';
import { parsePassage } from '../shared/passage';

let apiServer: Awaited<ReturnType<typeof startApiServer>>;
let base: string;
before(async () => {
  apiServer = await startApiServer();
  base = apiServer.baseUrl;
});
after(async () => {
  await apiServer?.close();
});
async function get<T>(route: string): Promise<T> {
  const r = await fetch(base + route);
  assert.equal(r.status, 200);
  return r.json();
}
test('citas españolas y abreviadas', () => {
  assert.equal(parsePassage('Juan 3:16'), 'JHN.3.16');
  assert.equal(parsePassage('Sal 23'), 'PSA.23.1');
  assert.equal(parsePassage('1 Corintios 13:4'), '1CO.13.4');
  assert.equal(parsePassage('amor'), null);
});
test('versiones y libros originales', async () => {
  const versions = await get<Version[]>('versions');
  assert(versions.some((v) => v.id === 'LBLA'));
  assert(versions.some((v) => v.id === 'RVR1960'));
  const books = await get<BookSummary[]>('books?version=LBLA');
  assert.equal(books.length, 66);
  assert.equal(books[0].name, 'Génesis');
});
test('comparación real de Juan 1', async () => {
  for (const v of ['LBLA', 'RVR1960']) {
    const verses = await get<Verse[]>('chapter?version=' + v + '&book=JHN&chapter=1');
    assert.equal(verses.length, 51);
    assert.match(verses[0].text, /Verbo/);
  }
});
test('dirección, votos y referencias de entrada por rango', async () => {
  const out = await get<Link[]>('references?id=GEN.1.1&direction=out&min=60');
  assert(out.length > 0);
  assert(out.every((l) => l.from === 'GEN.1.1' && l.votes >= 60));
  const incoming = await get<Link[]>('references?id=PRO.8.25&direction=in');
  assert(incoming.some((l) => l.from === 'GEN.1.1' && l.to === 'PRO.8.22'));
});
test('búsqueda paginada con filtro de libro', async () => {
  const data = await get<SearchResults>('search?q=Dios&version=LBLA&book=JHN');
  assert(data.total > 50);
  assert.equal(data.items.length, 50);
  assert(data.items.every((v) => v.book === 'JHN'));
  const next = await get<SearchResults>('search?q=Dios&version=LBLA&book=JHN&offset=50');
  assert.notEqual(data.items[0].id, next.items[0].id);
});
test('rechaza archivos que no son SQLite sin crear versión', async () => {
  const before = await get<Version[]>('versions');
  const form = new FormData();
  form.append('file', new Blob(['not sqlite']), 'mal.sqlite3');
  const r = await fetch(base + 'versions/import', { method: 'POST', body: form });
  assert.equal(r.status, 400);
  assert.equal((await get<Version[]>('versions')).length, before.length);
});

test('el atlas conserva coordenadas canónicas y una muestra densa válida', async () => {
  const atlas = await get<AtlasData>('atlas-data');
  assert.equal(atlas.total, 344799);
  assert.equal(atlas.shown, 160000);
  assert.equal(atlas.edges.length, atlas.shown * 4);
  assert.equal(atlas.chapters[0].id, 'GEN.1');
  assert.equal(atlas.chapters.at(-1)?.id, 'REV.22');
  for (let index = 1; index < atlas.chapters.length; index++) {
    assert.equal(atlas.chapters[index].start, atlas.chapters[index - 1].end);
  }
  for (let index = 0; index < atlas.edges.length; index += 4) {
    assert(atlas.edges[index] >= 0 && atlas.edges[index] < atlas.verseCount);
    assert(atlas.edges[index + 1] >= 0 && atlas.edges[index + 1] < atlas.verseCount);
    assert(atlas.edges[index + 2] >= 0 && atlas.edges[index + 2] <= 9);
  }
});
