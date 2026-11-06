import { before, after, test } from 'node:test';
import { startApiServer } from './helpers/apiServer';
import assert from 'node:assert/strict';
import { comparisonIds } from '../client/comparison';
import { spherePoint, versePosition, clamp } from '../client/components/visualizations/geometry';
import { codes } from '../shared/bible';

test('compara un máximo de cuatro versiones distintas incluida la principal', () => {
  assert.deepEqual(comparisonIds('A', ['B', 'C', 'D', 'E']), ['A', 'B', 'C', 'D']);
  assert.deepEqual(comparisonIds('A', ['A', 'B', 'B', 'C']), ['A', 'B', 'C']);
  assert.deepEqual(comparisonIds('A', []), ['A']);
});
test('los arcos separan versículos y capítulos sin superponer libros', () => {
  const chapters = { JHN: 21 };
  assert(versePosition('JHN.1.1', chapters) < versePosition('JHN.1.2', chapters));
  assert(versePosition('JHN.1.51', chapters) < versePosition('JHN.2.1', chapters));
  assert(versePosition('JHN.21.25', chapters) < versePosition('ACT.1.1'));
  for (const code of codes) {
    assert(versePosition(code + '.1.1') >= 30 && versePosition(code + '.1.1') < 1170);
  }
});
test('la esfera proyecta puntos 3D finitos y cambia al girar', () => {
  for (let i = 0; i < 66; i++) {
    const p = spherePoint(i, 25, 12);
    assert(Number.isFinite(p.x) && Number.isFinite(p.y) && Number.isFinite(p.z));
    assert(p.x > 0 && p.x < 1200 && p.y > 0 && p.y < 510);
  }
  assert.notDeepEqual(spherePoint(10, 0, 0), spherePoint(10, 90, 30));
});
test('el zoom queda limitado entre 100% y 800%', () => {
  assert.equal(clamp(0.5, 1, 8), 1);
  assert.equal(clamp(20, 1, 8), 8);
  assert.equal(clamp(3, 1, 8), 3);
});
let apiServer: Awaited<ReturnType<typeof startApiServer>>;
before(async () => {
  apiServer = await startApiServer();
});
after(async () => {
  await apiServer?.close();
});

test('la tarjeta consulta texto y cantidad real de referencias salientes', async () => {
  const response = await fetch(apiServer.baseUrl + 'verse-info?version=LBLA&id=JHN.1.1');
  assert.equal(response.status, 200);
  const info = await response.json();
  assert.equal(info.verse.id, 'JHN.1.1');
  assert.match(info.verse.text, /Verbo/);
  const out = await (await fetch(apiServer.baseUrl + 'references?id=JHN.1.1&direction=out')).json();
  assert.equal(info.outgoing, out.length);
});
