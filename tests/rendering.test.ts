import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildEdges,
  EdgeSpatialIndex,
  pointOnCurve,
  type EdgeLayout,
} from '../client/components/visualizations/rendering/edgeGeometry';
import { FrameScheduler } from '../client/components/visualizations/rendering/frames';
import type { Link } from '../shared/bible';

const links: Link[] = [
  { from: 'GEN.1.1', to: 'JHN.1.1', end: 'JHN.1.1', votes: 100 },
  { from: 'JOS.1.1', to: 'DEU.34.9', end: 'DEU.34.9', votes: 90 },
];

test('el programador agrupa invalidaciones en un solo fotograma y permanece inactivo después', () => {
  const pending = new Map<number, FrameRequestCallback>();
  let nextId = 0;
  let renders = 0;
  const scheduler = new FrameScheduler(
    () => {
      renders++;
    },
    (callback) => {
      pending.set(++nextId, callback);
      return nextId;
    },
    (id) => {
      pending.delete(id);
    },
  );
  scheduler.request();
  scheduler.request();
  scheduler.request();
  assert.equal(pending.size, 1);
  assert.equal(renders, 0);
  const [id, callback] = [...pending.entries()][0];
  pending.delete(id);
  callback(0);
  assert.equal(renders, 1);
  assert.equal(pending.size, 0);
  scheduler.request();
  assert.equal(pending.size, 1);
  scheduler.dispose();
  assert.equal(pending.size, 0);
});

test('la geometría conserva origen, destino y resaltado en las cuatro capas densas', () => {
  for (const layout of ['arcs', 'threads', 'sphere', 'timeline'] as EdgeLayout[]) {
    const edges = buildEdges(links, 'JOS.1.1', layout, { JOS: 24 });
    assert.equal(edges.length, 2);
    assert.equal(edges[1].link, links[1]);
    assert(edges[1].active);
    for (const edge of edges) {
      assert.deepEqual(pointOnCurve(edge, 0), { x: edge.start.x, y: edge.start.y });
      assert.deepEqual(pointOnCurve(edge, 1), { x: edge.end.x, y: edge.end.y });
      const middle = pointOnCurve(edge, 0.5);
      assert(Number.isFinite(middle.x) && Number.isFinite(middle.y));
    }
  }
});

test('el índice devuelve las curvas candidatas y respeta el orden visual de selección', () => {
  const edges = buildEdges(links, 'JOS.1.1', 'arcs');
  const index = new EdgeSpatialIndex(edges);
  edges.forEach((edge, id) => {
    for (const step of [0.1, 0.3, 0.5, 0.7, 0.9]) {
      const point = pointOnCurve(edge, step);
      assert(index.candidates(point.x, point.y, 8).includes(id));
    }
  });
  assert.deepEqual(index.candidates(-1000, -1000), []);
  const duplicates = new EdgeSpatialIndex([edges[0], edges[0]]);
  const middle = pointOnCurve(edges[0], 0.5);
  assert.deepEqual(duplicates.candidates(middle.x, middle.y), [1, 0]);
});

test('la esfera actualiza su geometría al girar sin alterar los datos de referencias', () => {
  const first = buildEdges(links, 'JOS.1.1', 'sphere', {}, 0, 0);
  const rotated = buildEdges(links, 'JOS.1.1', 'sphere', {}, 90, 30);
  assert.notDeepEqual(first[0].start, rotated[0].start);
  assert.equal(first[0].link, rotated[0].link);
});
