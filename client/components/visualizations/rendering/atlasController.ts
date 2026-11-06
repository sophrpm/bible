import type { AtlasData, AtlasChapter } from '../../../../shared/bible';
import { codes, names, colors, group } from '../../../../shared/bible';
import { FrameScheduler } from './frames';
import { AtlasRenderer } from './AtlasRenderer';

export type AtlasHover = { chapter: AtlasChapter; verse: number; x: number; y: number } | null;
type Callbacks = {
  onError: (message: string) => void;
  onZoom: (zoom: number) => void;
  onHover: (hover: AtlasHover) => void;
  onSelect: (id: string) => void;
  getSelected: () => string;
};

/** Owns GPU/axis drawing and input, independently of React tooltip updates. */
export function createAtlasController(
  container: HTMLDivElement,
  glCanvas: HTMLCanvasElement,
  overlay: HTMLCanvasElement,
  data: AtlasData,
  callbacks: Callbacks,
) {
  let renderer: AtlasRenderer;
  try {
    renderer = new AtlasRenderer(glCanvas, data);
  } catch (error) {
    console.error(error);
    callbacks.onError('No se pudo iniciar el atlas gráfico. Recarga para volver a intentarlo.');
    return;
  }
  const context = overlay.getContext('2d')!;
  let width = 1,
    height = 1,
    start = 0,
    end = data.verseCount,
    lastX = 0.5,
    lastHover: AtlasChapter | null = null;
  let drag: { x: number; start: number; end: number; moved: boolean } | null = null;
  let clickTimer: ReturnType<typeof setTimeout> | undefined;
  let visible = true;
  let dark = document.documentElement.dataset.theme === 'dark';
  // Canonical book extents never change while zooming or hovering.
  const books = codes.map((book, index) => {
    const chapters = data.chapters.filter((chapter) => chapter.book === book);
    return { index, chapters };
  });
  const find = (position: number) => {
    let low = 0,
      high = data.chapters.length - 1;
    while (low <= high) {
      const middle = (low + high) >> 1,
        c = data.chapters[middle];
      if (position < c.start) high = middle - 1;
      else if (position >= c.end) low = middle + 1;
      else return c;
    }
    return data.chapters[Math.max(0, Math.min(data.chapters.length - 1, low))];
  };
  const toX = (position: number) => 28 + ((position - start) / (end - start)) * (width - 56);
  function focusRange(): [number, number] {
    if (lastHover) return [lastHover.start, lastHover.end];
    const [book, chapter, verse] = callbacks.getSelected().split('.');
    const found = data!.chapters.find((item) => item.id === book + '.' + chapter);
    return found
      ? [found.start + Number(verse || 1) - 1, found.start + Number(verse || 1)]
      : [-1, -1];
  }
  function paint() {
    if (!visible || document.hidden) return;
    renderer.draw(width, height, start, end, focusRange(), dark, data!.shown);
    const ratio = Math.min(devicePixelRatio || 1, 2);
    overlay!.width = width * ratio;
    overlay!.height = height * ratio;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, width, height);
    context.font = '11px Arial';
    context.fillStyle = dark ? '#aeb0a5' : '#5c6157';
    for (const { index, chapters } of books) {
      if (!chapters.length) continue;
      const a = toX(chapters[0].start),
        b = toX(chapters[chapters.length - 1].end);
      if (b < 28 || a > width - 28) continue;
      context.fillStyle = colors[group(index)];
      context.fillRect(
        Math.max(28, a),
        height - 43,
        Math.min(width - 28, b) - Math.max(28, a) - 1,
        7,
      );
      const visibleWidth = Math.min(width - 28, b) - Math.max(28, a);
      if (visibleWidth > 36) {
        context.fillStyle = dark ? '#bdbeb3' : '#53584e';
        context.textAlign = 'center';
        const name = names[index];
        const title =
          context.measureText(name).width < visibleWidth - 6
            ? name
            : name.replace(/^(\d) /, '$1').slice(0, 4);
        context.fillText(title, (Math.max(28, a) + Math.min(width - 28, b)) / 2, height - 18);
      }
    }
    if (width / (end - start) > 0.14) {
      for (const chapter of data!.chapters) {
        const x = toX(chapter.start);
        if (x < 28 || x > width - 28) continue;
        context.fillStyle = dark ? '#797b70' : '#9a9d91';
        context.fillRect(x, height - 34, 1, 4);
        if (toX(chapter.end) - x > 30) {
          context.font = '9px Arial';
          context.fillText(chapter.id.split('.')[1], x + 8, height - 24);
        }
      }
    }
    if (lastHover) {
      context.fillStyle = dark ? '#f0dfae' : '#8b6726';
      context.fillRect(
        toX(lastHover.start),
        height - 45,
        Math.max(2, toX(lastHover.end) - toX(lastHover.start)),
        11,
      );
    }
  }
  const scheduler = new FrameScheduler(paint);
  function zoomAt(factor: number, anchor = lastX) {
    const point = start + anchor * (end - start);
    const span = Math.max(20, Math.min(data!.verseCount, (end - start) / factor));
    start = Math.max(0, Math.min(data!.verseCount - span, point - anchor * span));
    end = start + span;
    callbacks.onZoom(data!.verseCount / span);
    scheduler.request();
  }
  const controls = {
    zoom: (factor: number) => zoomAt(factor),
    reset: () => {
      start = 0;
      end = data.verseCount;
      callbacks.onZoom(1);
      scheduler.request();
    },
  };
  const resize = new ResizeObserver((entries) => {
    const bounds = entries[0].contentRect;
    width = Math.max(1, bounds.width);
    height = Math.max(1, bounds.height);
    scheduler.request();
  });
  resize.observe(container);
  const theme = new MutationObserver(() => {
    dark = document.documentElement.dataset.theme === 'dark';
    scheduler.request();
  });
  theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  const intersection = new IntersectionObserver((entries) => {
    visible = entries[0]?.isIntersecting ?? true;
    if (visible) scheduler.request();
  });
  intersection.observe(container);
  function position(event: PointerEvent | MouseEvent) {
    const bounds = container!.getBoundingClientRect();
    return { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
  }
  function preview(event: PointerEvent) {
    const point = position(event);
    lastX = Math.max(0, Math.min(1, (point.x - 28) / (width - 56)));
    if (drag) {
      const dx = point.x - drag.x;
      if (Math.abs(dx) > 4) {
        drag.moved = true;
        const span = drag.end - drag.start;
        start = Math.max(
          0,
          Math.min(data!.verseCount - span, drag.start - (dx / (width - 56)) * span),
        );
        end = start + span;
        scheduler.request();
      }
      return;
    }
    const coordinate = start + lastX * (end - start);
    lastHover = find(coordinate);
    callbacks.onHover({
      chapter: lastHover,
      verse: Math.max(1, Math.floor(coordinate - lastHover.start) + 1),
      x: Math.min(width - 250, Math.max(8, point.x + 14)),
      y: Math.min(height - 110, Math.max(10, point.y - 84)),
    });
    scheduler.request();
  }
  const leave = () => {
    lastHover = null;
    callbacks.onHover(null);
    scheduler.request();
  };
  const cancel = () => {
    drag = null;
    leave();
  };
  const down = (event: PointerEvent) => {
    if (event.button !== 0) return;
    const point = position(event);
    drag = { x: point.x, start, end, moved: false };
    glCanvas!.setPointerCapture(event.pointerId);
  };
  const up = (event: PointerEvent) => {
    const moved = drag?.moved;
    drag = null;
    if (glCanvas!.hasPointerCapture(event.pointerId))
      glCanvas!.releasePointerCapture(event.pointerId);
    if (moved) {
      leave();
      return;
    }
    const point = position(event);
    const coordinate =
      start + Math.max(0, Math.min(1, (point.x - 28) / (width - 56))) * (end - start);
    const chapter = find(coordinate);
    clearTimeout(clickTimer);
    clickTimer = setTimeout(
      () =>
        callbacks.onSelect(
          chapter.id +
            '.' +
            (width / (end - start) > 4
              ? Math.max(1, Math.floor(coordinate - chapter.start) + 1)
              : 1),
        ),
      220,
    );
  };
  const wheel = (event: WheelEvent) => {
    event.preventDefault();
    const point = position(event);
    lastX = Math.max(0, Math.min(1, (point.x - 28) / (width - 56)));
    zoomAt(Math.exp(-event.deltaY * 0.002));
  };
  const double = (event: MouseEvent) => {
    clearTimeout(clickTimer);
    const point = position(event);
    zoomAt(2, Math.max(0, Math.min(1, (point.x - 28) / (width - 56))));
  };
  const key = (event: KeyboardEvent) => {
    if (event.key === '+' || event.key === '=') {
      event.preventDefault();
      zoomAt(1.6);
    } else if (event.key === '-') {
      event.preventDefault();
      zoomAt(1 / 1.6);
    } else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
      event.preventDefault();
      const span = end - start;
      start = Math.max(
        0,
        Math.min(
          data!.verseCount - span,
          start + (event.key === 'ArrowRight' ? 1 : -1) * span * 0.15,
        ),
      );
      end = start + span;
      lastHover = find((start + end) / 2);
      callbacks.onHover({ chapter: lastHover, verse: 1, x: width / 2, y: height / 2 });
      scheduler.request();
    } else if (event.key === 'Enter' && lastHover) {
      callbacks.onSelect(lastHover.id + '.1');
    }
  };
  const invalidate = () => scheduler.request();
  container.addEventListener('atlas-focus-change', invalidate);
  document.addEventListener('visibilitychange', invalidate);
  glCanvas.addEventListener('pointermove', preview);
  glCanvas.addEventListener('pointerleave', leave);
  glCanvas.addEventListener('pointerdown', down);
  glCanvas.addEventListener('pointerup', up);
  glCanvas.addEventListener('pointercancel', cancel);
  glCanvas.addEventListener('blur', leave);
  glCanvas.addEventListener('wheel', wheel, { passive: false });
  glCanvas.addEventListener('dblclick', double);
  glCanvas.addEventListener('keydown', key);
  const lost = (event: Event) => {
    event.preventDefault();
    callbacks.onError('Se interrumpió el renderizado. Recarga la página para restaurarlo.');
  };
  glCanvas.addEventListener('webglcontextlost', lost);
  scheduler.request();
  return {
    ...controls,
    dispose: () => {
      clearTimeout(clickTimer);
      scheduler.dispose();
      resize.disconnect();
      theme.disconnect();
      intersection.disconnect();
      glCanvas.removeEventListener('webglcontextlost', lost);
      renderer.dispose();

      container.removeEventListener('atlas-focus-change', invalidate);
      document.removeEventListener('visibilitychange', invalidate);
      glCanvas.removeEventListener('pointermove', preview);
      glCanvas.removeEventListener('pointerleave', leave);
      glCanvas.removeEventListener('pointerdown', down);
      glCanvas.removeEventListener('pointerup', up);
      glCanvas.removeEventListener('pointercancel', cancel);
      glCanvas.removeEventListener('blur', leave);
      glCanvas.removeEventListener('wheel', wheel);
      glCanvas.removeEventListener('dblclick', double);
      glCanvas.removeEventListener('keydown', key);
    },
  };
}
