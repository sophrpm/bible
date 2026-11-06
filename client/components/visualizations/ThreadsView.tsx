import { memo, useMemo } from 'react';
import { CanvasEdges } from './rendering/CanvasEdges';
import { buildEdges } from './rendering/edgeGeometry';
import { codes, names, colors, group } from '../../../shared/bible';
import { activate, type VisualProps } from './types';

export const ThreadsView = memo(function ThreadsView({
  links,
  selected,
  onSelect,
  onHover,
}: VisualProps) {
  const edges = useMemo(() => buildEdges(links, selected, 'threads'), [links, selected]);
  return (
    <>
      <text x="600" y="24" textAnchor="middle" className="chart-heading">
        Hilos entre los libros
      </text>
      <text x="600" y="43" textAnchor="middle" className="chart-subtitle">
        Origen a la izquierda · destino a la derecha · orden canónico
      </text>
      <CanvasEdges edges={edges} height={510} onHover={onHover} onSelect={onSelect} />
      {codes.map((b, i) => (
        <g key={b}>
          {[true, false].map((left) => (
            <g
              key={String(left)}
              role="button"
              tabIndex={0}
              className="visual-target"
              aria-label={'Leer ' + names[i]}
              onClick={() => onSelect(b + '.1.1')}
              onKeyDown={(e) => activate(e, () => onSelect(b + '.1.1'))}
            >
              <rect
                x={left ? 230 : 960}
                y={66 + i * 6.2}
                width="10"
                height="5"
                fill={colors[group(i)]}
              />
              {i % 2 === 0 && (
                <text
                  x={left ? 220 : 980}
                  y={72 + i * 6.2}
                  textAnchor={left ? 'end' : 'start'}
                  className="thread-label"
                >
                  {names[i]}
                </text>
              )}
            </g>
          ))}
        </g>
      ))}
    </>
  );
});
