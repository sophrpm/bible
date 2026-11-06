export type DiagramView = { zoom: number; pan: { x: number; y: number } };

/** Keep the graph coordinate under the pointer fixed while its neighbourhood expands. */
export function zoomAroundPoint(
  view: DiagramView,
  anchor: { x: number; y: number },
  factor: number,
  height: number,
): DiagramView {
  const zoom = Math.max(1, Math.min(8, view.zoom * factor));
  const ratio = zoom / view.zoom;
  const center = { x: 600, y: height / 2 };
  return {
    zoom,
    pan: {
      x: anchor.x - center.x - (anchor.x - center.x - view.pan.x) * ratio,
      y: anchor.y - center.y - (anchor.y - center.y - view.pan.y) * ratio,
    },
  };
}
