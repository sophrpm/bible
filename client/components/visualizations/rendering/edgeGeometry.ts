import type { Link } from '../../../../shared/bible';
import { colors, group } from '../../../../shared/bible';
import { isVerseConnected, visibleGraphLinks } from '../../../../shared/referenceLinks';
import { bookIndex, spherePoint, versePosition } from '../geometry';

export type Coordinate = { x: number; y: number };
export type CurveEdge = {
  link: Link;
  start: Coordinate;
  first: Coordinate;
  second: Coordinate;
  end: Coordinate;
  color: string;
  active: boolean;
  alpha: number;
  width: number;
};
export type EdgeLayout = 'arcs' | 'threads' | 'sphere' | 'timeline';

/** Geometry is built on data/layout changes, never during tooltip updates or pointer movement. */
export function buildEdges(
  links: Link[],
  selected: string,
  layout: EdgeLayout,
  chapters: Record<string, number> = {},
  yaw = 25,
  pitch = 12,
): CurveEdge[] {
  const limits = { arcs: links.length, threads: 700, sphere: 650, timeline: 450 };
  const sphere =
    layout === 'sphere'
      ? Array.from({ length: 66 }, (_, index) => spherePoint(index, yaw, pitch))
      : [];
  return visibleGraphLinks(links, selected, limits[layout]).map((link) => {
    const active = isVerseConnected(link, selected);
    const edge: CurveEdge = {
      link,
      start: { x: 0, y: 0 },
      first: { x: 0, y: 0 },
      second: { x: 0, y: 0 },
      end: { x: 0, y: 0 },
      color: active ? '#f4cb70' : colors[group(bookIndex(link.from))],
      active,
      alpha: active ? 1 : 0.09,
      width: active ? 3 : 1,
    };
    if (layout === 'arcs') {
      const source = versePosition(link.from, chapters),
        target = versePosition(link.to, chapters);
      const height = Math.min(255, 18 + Math.abs(target - source) * 0.46);
      edge.start = { x: source, y: 355 };
      edge.end = { x: target, y: 355 };
      edge.first = { x: source, y: 355 - height * 1.32 };
      edge.second = { x: target, y: 355 - height * 1.32 };
      edge.alpha = active ? 1 : 0.07;
      edge.width = active ? 3 : 0.85;
    } else if (layout === 'threads') {
      const source = 70 + bookIndex(link.from) * 6.2,
        target = 70 + bookIndex(link.to) * 6.2;
      edge.start = { x: 240, y: source };
      edge.first = { x: 480, y: source };
      edge.second = { x: 720, y: target };
      edge.end = { x: 960, y: target };
    } else if (layout === 'timeline') {
      const source = 48 + bookIndex(link.from) * 17,
        target = 48 + bookIndex(link.to) * 17;
      const height = 25 + Math.abs(target - source) * 0.23;
      edge.start = { x: source, y: 280 };
      edge.end = { x: target, y: 280 };
      quadraticControls(edge, { x: (source + target) / 2, y: 280 - height * 2 });
    } else {
      edge.start = sphere[bookIndex(link.from)];
      edge.end = sphere[bookIndex(link.to)];
      quadraticControls(edge, { x: 600, y: 255 });
    }
    return edge;
  });
}

function quadraticControls(edge: CurveEdge, control: Coordinate): void {
  edge.first = {
    x: edge.start.x + (2 / 3) * (control.x - edge.start.x),
    y: edge.start.y + (2 / 3) * (control.y - edge.start.y),
  };
  edge.second = {
    x: edge.end.x + (2 / 3) * (control.x - edge.end.x),
    y: edge.end.y + (2 / 3) * (control.y - edge.end.y),
  };
}

export function pointOnCurve(edge: CurveEdge, t: number): Coordinate {
  const u = 1 - t;
  return {
    x:
      u * u * u * edge.start.x +
      3 * u * u * t * edge.first.x +
      3 * u * t * t * edge.second.x +
      t * t * t * edge.end.x,
    y:
      u * u * u * edge.start.y +
      3 * u * u * t * edge.first.y +
      3 * u * t * t * edge.second.y +
      t * t * t * edge.end.y,
  };
}

/** Sampled segments populate nearby grid cells; exact Canvas stroke picking follows this lookup. */
export class EdgeSpatialIndex {
  private readonly cells = new Map<string, Set<number>>();
  constructor(
    edges: CurveEdge[],
    private readonly cellSize = 32,
  ) {
    edges.forEach((edge, index) => {
      let previous = edge.start;
      for (let step = 1; step <= 32; step++) {
        const next = pointOnCurve(edge, step / 32);
        for (
          let x = Math.floor((Math.min(previous.x, next.x) - 10) / cellSize);
          x <= Math.floor((Math.max(previous.x, next.x) + 10) / cellSize);
          x++
        ) {
          for (
            let y = Math.floor((Math.min(previous.y, next.y) - 10) / cellSize);
            y <= Math.floor((Math.max(previous.y, next.y) + 10) / cellSize);
            y++
          ) {
            const key = x + ',' + y;
            if (!this.cells.has(key)) {
              this.cells.set(key, new Set());
            }
            this.cells.get(key)!.add(index);
          }
        }
        previous = next;
      }
    });
  }
  candidates(x: number, y: number, radius = 0): number[] {
    const candidates = new Set<number>();
    for (
      let column = Math.floor((x - radius) / this.cellSize);
      column <= Math.floor((x + radius) / this.cellSize);
      column++
    ) {
      for (
        let row = Math.floor((y - radius) / this.cellSize);
        row <= Math.floor((y + radius) / this.cellSize);
        row++
      ) {
        for (const index of this.cells.get(column + ',' + row) || []) {
          candidates.add(index);
        }
      }
    }
    return [...candidates].sort((left, right) => right - left);
  }
}
