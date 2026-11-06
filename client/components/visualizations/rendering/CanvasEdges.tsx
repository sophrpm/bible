import { memo, useEffect, useRef } from 'react';
import type { Link } from '../../../../shared/bible';
import { label } from '../../../../shared/bible';
import { EdgeSpatialIndex, type CurveEdge } from './edgeGeometry';
import { FrameScheduler, MAX_PIXEL_RATIO } from './frames';

type Props = {
  edges: CurveEdge[];
  height: number;
  onHover: (link: Link | null) => void;
  onSelect: (id: string) => void;
};

/** Dense connections live on a single Canvas; book labels and controls remain accessible SVG/HTML. */
export const CanvasEdges = memo(function CanvasEdges({ edges, height, onHover, onSelect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const callbacks = useRef({ onHover, onSelect });
  callbacks.current = { onHover, onSelect };

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!canvas || !context) {
      return;
    }
    const viewport = canvas.closest('.graph-viewport');
    const svg = canvas.closest('svg');
    const paths = edges.map((edge) => {
      const path = new Path2D();
      path.moveTo(edge.start.x, edge.start.y);
      path.bezierCurveTo(
        edge.first.x,
        edge.first.y,
        edge.second.x,
        edge.second.y,
        edge.end.x,
        edge.end.y,
      );
      return path;
    });
    // Curves of the same style share one draw call. Focus is a separate final pass.
    const batches = new Map<
      string,
      { path: Path2D; color: string; alpha: number; width: number }
    >();
    edges.forEach((edge, index) => {
      const key = `${edge.color}|${edge.alpha}|${edge.width}`;
      if (!batches.has(key)) {
        batches.set(key, {
          path: new Path2D(),
          color: edge.color,
          alpha: edge.alpha,
          width: edge.width,
        });
      }
      batches.get(key)!.path.addPath(paths[index]);
    });
    canvas.dataset.batchCount = String(batches.size);
    // A rotating scene does not need to rebuild its hit index until a pointer actually visits it.
    let index: EdgeSpatialIndex | null = null;
    let hovered = -1;
    let pointer: { x: number; y: number } | null = null;
    let visible = true;
    let dirty = true;
    let keyboardIndex = -1;

    function pick(clientX: number, clientY: number): number {
      const bounds = canvas!.getBoundingClientRect();
      if (!bounds.width || !bounds.height) {
        return -1;
      }
      const x = ((clientX - bounds.left) / bounds.width) * 1200,
        y = ((clientY - bounds.top) / bounds.height) * height;
      context!.setTransform(1, 0, 0, 1, 0, 0);
      context!.lineWidth = Math.max(3, (8 * 1200) / bounds.width);
      for (const candidate of (index ??= new EdgeSpatialIndex(edges)).candidates(
        x,
        y,
        context!.lineWidth / 2,
      )) {
        if (context!.isPointInStroke(paths[candidate], x, y)) {
          return candidate;
        }
      }
      return -1;
    }

    function highlight(next: number): void {
      if (hovered === next) {
        return;
      }
      hovered = next;
      dirty = true;
      canvas!.style.cursor = next >= 0 ? 'pointer' : 'grab';
      callbacks.current.onHover(next >= 0 ? edges[next].link : null);
    }

    function render(): void {
      if (!visible || document.hidden) {
        return;
      }
      if (pointer) {
        highlight(pick(pointer.x, pointer.y));
        pointer = null;
      }
      if (!dirty) {
        return;
      }
      dirty = false;
      const bounds = canvas!.getBoundingClientRect();
      // Cap both device pixel ratio and texture dimensions when heavily zoomed in.
      const ratio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
      const width = Math.max(1, Math.min(4096, Math.round(bounds.width * ratio)));
      const pixelHeight = Math.max(1, Math.min(4096, Math.round(bounds.height * ratio)));
      if (canvas!.width !== width || canvas!.height !== pixelHeight) {
        canvas!.width = width;
        canvas!.height = pixelHeight;
      }
      context!.setTransform(width / 1200, 0, 0, pixelHeight / height, 0, 0);
      context!.clearRect(0, 0, 1200, height);
      for (const batch of batches.values()) {
        context!.strokeStyle = batch.color;
        context!.globalAlpha = batch.alpha;
        context!.lineWidth = batch.width;
        context!.stroke(batch.path);
      }
      if (hovered >= 0) {
        context!.strokeStyle = '#ffe2a0';
        context!.globalAlpha = 1;
        context!.lineWidth = 4;
        context!.stroke(paths[hovered]);
      }
      context!.globalAlpha = 1;
    }
    const scheduler = new FrameScheduler(render);
    const invalidate = () => {
      dirty = true;
      scheduler.request();
    };
    const pointerMove = (event: PointerEvent) => {
      if (!event.buttons) {
        pointer = { x: event.clientX, y: event.clientY };
        scheduler.request();
      }
    };
    let navigationTimer: ReturnType<typeof setTimeout> | undefined;
    const doubleClick = () => clearTimeout(navigationTimer);
    const click = (event: MouseEvent) => {
      const hit = pick(event.clientX, event.clientY);
      if (hit >= 0) {
        clearTimeout(navigationTimer);
        navigationTimer = setTimeout(() => callbacks.current.onSelect(edges[hit].link.to), 220);
      }
    };
    const keydown = (event: KeyboardEvent) => {
      if (
        ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'].includes(event.key) &&
        edges.length
      ) {
        event.preventDefault();
        event.stopPropagation();
        keyboardIndex =
          event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? edges.length - 1
              : (keyboardIndex +
                  (event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -1 : 1) +
                  edges.length) %
                edges.length;
        highlight(keyboardIndex);
        canvas!.setAttribute(
          'aria-label',
          `${label(edges[keyboardIndex].link.from)} a ${label(edges[keyboardIndex].link.to)}. Enter para leer.`,
        );
        scheduler.request();
      } else if (event.key === 'Enter' && keyboardIndex >= 0) {
        event.preventDefault();
        callbacks.current.onSelect(edges[keyboardIndex].link.to);
      }
    };
    const observer = new ResizeObserver(invalidate);
    observer.observe(canvas);
    if (svg) {
      observer.observe(svg);
    }
    const intersections = new IntersectionObserver((entries) => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) invalidate();
    });
    intersections.observe(canvas);
    // View transforms are DOM mutations; they do not rebuild scene geometry or React children.
    const transforms = new MutationObserver(invalidate);
    if (svg) {
      transforms.observe(svg, { subtree: true, attributes: true, attributeFilter: ['transform'] });
    }
    viewport?.addEventListener('graph-view-change', invalidate);
    document.addEventListener('visibilitychange', invalidate);
    window.addEventListener('resize', invalidate);
    const leave = () => {
      pointer = null;
      highlight(-1);
      scheduler.request();
    };
    canvas.addEventListener('pointerleave', leave);
    canvas.addEventListener('pointermove', pointerMove);
    canvas.addEventListener('click', click);
    canvas.addEventListener('dblclick', doubleClick);
    canvas.addEventListener('keydown', keydown);
    scheduler.request();
    return () => {
      clearTimeout(navigationTimer);
      scheduler.dispose();
      observer.disconnect();
      intersections.disconnect();
      transforms.disconnect();
      viewport?.removeEventListener('graph-view-change', invalidate);
      document.removeEventListener('visibilitychange', invalidate);
      window.removeEventListener('resize', invalidate);
      canvas.removeEventListener('pointerleave', leave);
      canvas.removeEventListener('pointermove', pointerMove);
      canvas.removeEventListener('click', click);
      canvas.removeEventListener('dblclick', doubleClick);
      canvas.removeEventListener('keydown', keydown);
    };
  }, [edges, height]);

  return (
    <foreignObject x={0} y={0} width={1200} height={height} className="canvas-edges-layer">
      <canvas
        ref={canvasRef}
        role="img"
        tabIndex={0}
        aria-label={`${edges.length} conexiones. Usa las flechas para explorar y Enter para abrir un pasaje.`}
        data-edge-count={edges.length}
        data-active-count={edges.filter((edge) => edge.active).length}
        style={{ width: '100%', height: '100%', display: 'block' }}
      />
    </foreignObject>
  );
});
