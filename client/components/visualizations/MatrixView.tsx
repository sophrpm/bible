import { isVerseConnected } from '../../../shared/referenceLinks';
import { memo, useMemo } from 'react';
import { names, colors, group } from '../../../shared/bible';
import { bookIndex } from './geometry';
import { activate, type VisualProps } from './types';

export const MatrixView = memo(function MatrixView({
  links,
  selected,
  onSelect,
  onHover,
}: VisualProps) {
  const cells = useMemo(() => {
    const map = new Map<string, { n: number; link: (typeof links)[number]; active: boolean }>();
    for (const l of links) {
      const key = bookIndex(l.from) + ',' + bookIndex(l.to);
      const old = map.get(key);
      const active = isVerseConnected(l, selected);
      map.set(key, {
        n: (old?.n || 0) + 1,
        link: active ? l : old?.link || l,
        active: active || !!old?.active,
      });
    }
    return [...map.entries()].map(([key, v]) => ({
      ...v,
      a: +key.split(',')[0],
      b: +key.split(',')[1],
    }));
  }, [links, selected]);
  return (
    <>
      <text x="40" y="32" className="chart-heading">
        Matriz de conexiones
      </text>
      <text x="40" y="54" className="chart-subtitle">
        Filas: origen · columnas: destino · intensidad: número de conexiones en la muestra
      </text>
      {Array.from({ length: 67 }, (_, i) => (
        <g key={i}>
          <line x1={360 + i * 6.2} x2={360 + i * 6.2} y1="85" y2="494" className="matrix-line" />
          <line x1="360" x2="769" y1={85 + i * 6.2} y2={85 + i * 6.2} className="matrix-line" />
        </g>
      ))}
      {cells.map((c) => (
        <rect
          key={c.a + ',' + c.b}
          x={360 + c.b * 6.2}
          y={85 + c.a * 6.2}
          width="6"
          height="6"
          fill={c.active ? '#f4cb70' : colors[group(c.a)]}
          stroke={c.active ? '#f4cb70' : undefined}
          data-active={c.active}
          opacity={c.active ? 1 : Math.min(0.5, 0.12 + Math.log(c.n + 1) / 8)}
          role="button"
          tabIndex={0}
          className="visual-target"
          aria-label={`${names[c.a]} a ${names[c.b]}: ${c.n} referencias en la muestra`}
          onPointerEnter={() => onHover(c.link)}
          onFocus={() => onHover(c.link)}
          onBlur={() => onHover(null)}
          onPointerLeave={() => onHover(null)}
          onClick={() => onSelect(c.link.to)}
          onKeyDown={(e) => activate(e, () => onSelect(c.link.to))}
        >
          <title>
            {names[c.a]} → {names[c.b]} · {c.n} referencias en la muestra · clic para abrir un
            pasaje
          </title>
        </rect>
      ))}
      {names.map(
        (n, i) =>
          i % 3 === 0 && (
            <g key={n}>
              <text x="350" y={90 + i * 6.2} textAnchor="end" className="thread-label">
                {n}
              </text>
              <text
                transform={`translate(${365 + i * 6.2} 78) rotate(-55)`}
                className="thread-label"
              >
                {n.slice(0, 7)}
              </text>
            </g>
          ),
      )}
    </>
  );
});
