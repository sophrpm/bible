import { db } from './database';
import { codes, group, type AtlasData, type AtlasChapter } from '../../shared/bible';
let cache: AtlasData | undefined;

/** Compact GPU instances: source verse, destination verse, genre, vote weight. */
export function atlasData(): AtlasData {
  if (cache) return cache;
  const rows = db
    .prepare(
      "SELECT book,chapter,MAX(verse) AS count FROM verses WHERE version='LBLA' GROUP BY book,chapter",
    )
    .all() as { book: string; chapter: number; count: number }[];
  rows.sort((a, b) => codes.indexOf(a.book) - codes.indexOf(b.book) || a.chapter - b.chapter);
  let cursor = 0;
  const chapters: AtlasChapter[] = [];
  const lookup = new Map<string, AtlasChapter>();
  for (const row of rows) {
    const chapter = {
      id: `${row.book}.${row.chapter}`,
      book: row.book,
      start: cursor,
      end: cursor + row.count,
      connections: 0,
    };
    chapters.push(chapter);
    lookup.set(chapter.id, chapter);
    cursor += row.count;
  }
  const links = db
    .prepare('SELECT source,target,votes FROM links ORDER BY votes DESC LIMIT 160000')
    .all() as { source: string; target: string; votes: number }[];
  const edges: number[] = [];
  for (const link of links) {
    const [sourceBook, sourceChapter, sourceVerse] = link.source.split('.');
    const [targetBook, targetChapter, targetVerse] = link.target.split('.');
    const source = lookup.get(sourceBook + '.' + sourceChapter),
      target = lookup.get(targetBook + '.' + targetChapter);
    if (!source || !target) continue;
    edges.push(
      source.start + Number(sourceVerse) - 1,
      target.start + Number(targetVerse) - 1,
      group(codes.indexOf(sourceBook)),
      Math.min(1, 0.2 + (0.8 * Math.log10(1 + Math.max(0, link.votes))) / 2),
    );
    source.connections++;
    if (target !== source) target.connections++;
  }
  const total = (db.prepare('SELECT COUNT(*) AS count FROM links').get() as { count: number })
    .count;
  cache = { edges, chapters, verseCount: cursor, total, shown: edges.length / 4 };
  return cache;
}
