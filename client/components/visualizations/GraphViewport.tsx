import { useFrameState } from '../../hooks/useFrameState';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ZoomIn, ZoomOut, Maximize, Minimize, RotateCcw, Move } from 'lucide-react';
import { zoomAroundPoint } from './zoom';

export function GraphViewport({
  children,
  label,
  height = 510,
  overlay,
  footer,
}: {
  children: ReactNode;
  label: string;
  height?: number;
  overlay?: ReactNode;
  footer?: ReactNode;
}) {
  const [view, setView] = useFrameState({ zoom: 1, pan: { x: 0, y: 0 } });
  const { zoom, pan } = view;
  const anchor = useRef({ x: 600, y: height / 2 });
  function zoomAt(factor: number) {
    setView((current) => zoomAroundPoint(current, anchor.current, factor, height));
  }
  const [full, setFull] = useState(false);
  const [dragging, setDragging] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; px: number; py: number; moved: boolean } | null>(
    null,
  );
  const suppressClick = useRef(false);
  useEffect(() => {
    const el = svg.current;
    if (!el) {
      return;
    }
    const wheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        const matrix = svg.current?.getScreenCTM();
        if (matrix) {
          anchor.current = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
        }
        setView((current) =>
          zoomAroundPoint(current, anchor.current, Math.exp(-e.deltaY * 0.002), height),
        );
      }
    };
    el.addEventListener('wheel', wheel, { passive: false });
    return () => el.removeEventListener('wheel', wheel);
  }, []);
  useEffect(() => {
    if (!full) {
      return;
    }
    // Fullscreen owns focus and page scrolling until it closes or unmounts.
    const before = document.body.style.overflow;
    const previous = document.activeElement as HTMLElement | null;
    document.body.style.overflow = 'hidden';
    root.current?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setFull(false);
      }
      if (e.key === 'Tab') {
        const items = Array.from(
          root.current?.querySelectorAll<HTMLElement>(
            'button:not(:disabled),input:not(:disabled),[tabindex="0"]',
          ) || [],
        );
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', escape);
      previous?.focus();
    };
  }, [full]);
  return (
    <div
      className={'graph-viewport ' + (full ? 'graph-fullscreen' : '')}
      ref={root}
      role={full ? 'dialog' : undefined}
      aria-modal={full ? true : undefined}
      aria-label={full ? label + ' · pantalla completa' : undefined}
    >
      <div className="graph-controls">
        <span className="graph-instruction">
          <Move size={13} /> Arrastra para mover · Ctrl + rueda para ampliar
        </span>
        <button
          title="Alejar"
          aria-label="Alejar visualización"
          disabled={zoom <= 1}
          onClick={() => zoomAt(1 / 1.3)}
        >
          <ZoomOut size={16} />
        </button>
        <output aria-live="polite">{Math.round(zoom * 100)}%</output>
        <button
          title="Acercar"
          aria-label="Acercar visualización"
          disabled={zoom >= 8}
          onClick={() => zoomAt(1.3)}
        >
          <ZoomIn size={16} />
        </button>
        <button
          title="Restablecer vista"
          aria-label="Restablecer vista"
          onClick={() => {
            setView({ zoom: 1, pan: { x: 0, y: 0 } });
          }}
        >
          <RotateCcw size={15} />
        </button>
        <button
          title={full ? 'Salir de pantalla completa' : 'Pantalla completa'}
          aria-label={full ? 'Salir de pantalla completa' : 'Pantalla completa'}
          onClick={() => setFull(!full)}
        >
          {full ? <Minimize size={16} /> : <Maximize size={16} />}
        </button>
      </div>
      <svg
        onDoubleClick={() => zoomAt(1.8)}
        ref={svg}
        viewBox={`0 0 1200 ${height}`}
        role="group"
        aria-label={label}
        className={dragging ? 'dragging' : ''}
        onPointerDown={(e) => {
          if (e.button !== 0) {
            return;
          }
          drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, moved: false };
          suppressClick.current = false;
        }}
        onPointerMove={(e) => {
          const matrix = svg.current?.getScreenCTM();
          if (matrix) {
            anchor.current = new DOMPoint(e.clientX, e.clientY).matrixTransform(matrix.inverse());
          }
          if (!drag.current) {
            return;
          }
          const dx = e.clientX - drag.current.x;
          const dy = e.clientY - drag.current.y;
          // Ignore small hand movements so a normal click still opens its verse.
          if (Math.hypot(dx, dy) > 5) {
            drag.current.moved = true;
            setDragging(true);
            svg.current?.setPointerCapture(e.pointerId);
            // Pan is stored in SVG coordinates, independently of the CSS viewport width.
            const scale = 1200 / (svg.current?.getBoundingClientRect().width || 1200);
            const nextPan = { x: drag.current.px + dx * scale, y: drag.current.py + dy * scale };
            setView((current) => ({ ...current, pan: nextPan }));
          }
        }}
        onPointerUp={(e) => {
          suppressClick.current = !!drag.current?.moved;
          drag.current = null;
          setDragging(false);
          if (svg.current?.hasPointerCapture(e.pointerId)) {
            svg.current.releasePointerCapture(e.pointerId);
          }
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onClickCapture={(e) => {
          if (suppressClick.current) {
            e.preventDefault();
            e.stopPropagation();
            suppressClick.current = false;
          }
        }}
      >
        <g
          transform={`translate(${pan.x} ${pan.y}) translate(600 ${height / 2}) scale(${zoom}) translate(-600 ${-height / 2})`}
        >
          {children}
        </g>
      </svg>
      {footer}
      {overlay}
    </div>
  );
}
