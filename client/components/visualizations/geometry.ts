import { codes } from '../../../shared/bible';

export type Point = { x: number; y: number; z?: number };

const CANONICAL_BOOK_COUNT = codes.length;
const CHART_LEFT = 30;
const CHART_WIDTH = 1140;

export function bookIndex(id: string): number {
  return Math.max(0, codes.indexOf(id.split('.')[0]));
}

/** Position each verse inside its book's segment rather than collapsing it onto the book label. */
export function versePosition(id: string, chapters: Record<string, number> = {}): number {
  const [book, chapter, verse] = id.split('.');
  const chapterCount = chapters[book] || 150;
  const verseFraction = Math.min(0.99, Number(verse) / 200);
  const positionInBook = (Math.max(0, Number(chapter) - 1) + verseFraction) / chapterCount;
  return CHART_LEFT + ((bookIndex(id) + positionInBook) / CANONICAL_BOOK_COUNT) * CHART_WIDTH;
}

/** Distribute books with the golden angle, rotate in 3D, then project onto the SVG plane. */
export function spherePoint(index: number, yaw: number, pitch: number): Point {
  const vertical = 1 - (2 * (index + 0.5)) / CANONICAL_BOOK_COUNT;
  const radius = Math.sqrt(1 - vertical * vertical);
  const goldenAngle = index * Math.PI * (3 - Math.sqrt(5));
  const horizontal = Math.cos(goldenAngle) * radius;
  const initialDepth = Math.sin(goldenAngle) * radius;
  const yawRadians = (yaw * Math.PI) / 180;
  const pitchRadians = (pitch * Math.PI) / 180;

  const rotatedX = horizontal * Math.cos(yawRadians) + initialDepth * Math.sin(yawRadians);
  const rotatedDepth = -horizontal * Math.sin(yawRadians) + initialDepth * Math.cos(yawRadians);
  const rotatedY = vertical * Math.cos(pitchRadians) - rotatedDepth * Math.sin(pitchRadians);
  const depth = vertical * Math.sin(pitchRadians) + rotatedDepth * Math.cos(pitchRadians);
  const perspective = 700 / (700 - depth * 180);

  return { x: 600 + rotatedX * 210 * perspective, y: 255 + rotatedY * 210 * perspective, z: depth };
}

export function clamp(value: number, minimum: number, maximum: number): number {
  return Math.max(minimum, Math.min(maximum, value));
}
