import type { Link } from './bible';

function ordinal(id: string): number {
  const [, chapter, verse] = id.split('.');
  return Number(chapter) * 1000 + Number(verse);
}

/** Destination ranges count as a connection even when the active verse is not the first verse. */
export function isVerseConnected(link: Link, selected: string): boolean {
  if (link.from === selected) {
    return true;
  }
  return (
    selected.split('.')[0] === link.to.split('.')[0] &&
    ordinal(link.to) <= ordinal(selected) &&
    ordinal(link.end) >= ordinal(selected)
  );
}

export function mergeGraphLinks(sample: Link[], active: Link[]): Link[] {
  const links = new Map<string, Link>();
  for (const link of [...sample, ...active]) {
    links.set(`${link.from}|${link.to}|${link.end}`, link);
  }
  return [...links.values()];
}

/** Keep selected connections within sampling limits and paint them after the background paths. */
export function visibleGraphLinks(links: Link[], selected: string, limit = links.length): Link[] {
  const active = links.filter((link) => isVerseConnected(link, selected)).slice(0, limit);
  const background = links.filter((link) => !isVerseConnected(link, selected));
  return [...background.slice(0, Math.max(0, limit - active.length)), ...active];
}
