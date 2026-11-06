import { db } from './database';
import { readVerse } from './reading';
import type { BibleStats, Link } from '../../shared/bible';

const GRAPH_SAMPLE_SIZE = 3500;

export function graphSample(): Link[] {
  return db
    .prepare(
      `
  SELECT source AS 'from', target AS 'to', end, votes
  FROM links
  ORDER BY votes DESC
  LIMIT ?
 `,
    )
    .all(GRAPH_SAMPLE_SIZE) as Link[];
}

export function bibleStatistics(): BibleStats {
  const references = db.prepare('SELECT COUNT(*) AS count FROM links').get() as { count: number };
  const verses = db
    .prepare("SELECT COUNT(*) AS count FROM verses WHERE version = 'LBLA'")
    .get() as { count: number };
  return { references: references.count, verses: verses.count };
}

export function verseInformation(version: string, id: string) {
  // Count the entire dataset, not the limited graph sample displayed in the browser.
  const outgoing = db.prepare('SELECT COUNT(*) AS count FROM links WHERE source = ?').get(id) as {
    count: number;
  };
  return { verse: readVerse(version, id), outgoing: outgoing.count };
}
