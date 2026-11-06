import { db } from './database';
import type { Link } from '../../shared/bible';

const MAX_REFERENCES = 500;

// Verse numbers stay below 1000, so this ordinal preserves chapter and verse order.
function verseOrdinal(id: string): number {
  const [, chapter, verse] = id.split('.');
  return Number(chapter) * 1000 + Number(verse);
}

export function references(id: string, direction = 'both', minimum = 0): Link[] {
  if (direction === 'out') {
    return db
      .prepare(
        `
    SELECT source AS 'from', target AS 'to', end, votes
    FROM links
    WHERE source = ? AND votes >= ?
    ORDER BY votes DESC
    LIMIT ?
  `,
      )
      .all(id, minimum, MAX_REFERENCES) as Link[];
  }

  const book = id.split('.')[0];
  const selectedPosition = verseOrdinal(id);
  const condition = direction === 'in' ? 'target LIKE ?' : '(source = ? OR target LIKE ?)';
  const values = direction === 'in' ? [book + '.%', minimum] : [id, book + '.%', minimum];
  const candidates = db
    .prepare(
      `
    SELECT source AS 'from', target AS 'to', end, votes
    FROM links
    WHERE ${condition} AND votes >= ?
    ORDER BY votes DESC
 `,
    )
    .all(...values) as Link[];

  // Filter ranges before applying the display limit, including ranges spanning chapters.
  return candidates
    .filter((link) => {
      const isOutgoing = direction !== 'in' && link.from === id;
      const isWithinDestination =
        link.to.split('.')[0] === book &&
        verseOrdinal(link.to) <= selectedPosition &&
        verseOrdinal(link.end) >= selectedPosition;
      return isOutgoing || isWithinDestination;
    })
    .slice(0, MAX_REFERENCES);
}
