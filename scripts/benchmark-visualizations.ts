import { performance } from 'node:perf_hooks';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import {
  buildEdges,
  EdgeSpatialIndex,
  pointOnCurve,
} from '../client/components/visualizations/rendering/edgeGeometry';
import type { Link } from '../shared/bible';

// Read-only benchmark: no seed, imports or writes to the user's stored Bibles.
const database = new DatabaseSync(
  path.resolve(process.env.BIBLE_STORAGE || 'storage', 'bible.sqlite3'),
  { readOnly: true },
);
try {
  const links = database
    .prepare(
      "SELECT source AS 'from',target AS 'to',end,votes FROM links ORDER BY votes DESC LIMIT 3500",
    )
    .all() as Link[];
  const started = performance.now();
  const edges = buildEdges(links, 'JOS.1.1', 'arcs');
  const geometryDone = performance.now();
  const index = new EdgeSpatialIndex(edges);
  const indexDone = performance.now();
  let candidates = 0;
  for (let sample = 0; sample < 100; sample++) {
    const point = pointOnCurve(edges[sample % edges.length], 0.5);
    candidates += index.candidates(point.x, point.y, 8).length;
  }
  const queriesDone = performance.now();
  console.log(
    JSON.stringify(
      {
        connections: edges.length,
        geometryMs: +(geometryDone - started).toFixed(2),
        indexMs: +(indexDone - geometryDone).toFixed(2),
        queries100Ms: +(queriesDone - indexDone).toFixed(2),
        averageCandidateCount: Math.round(candidates / 100),
      },
      null,
      2,
    ),
  );
} finally {
  database.close();
}
