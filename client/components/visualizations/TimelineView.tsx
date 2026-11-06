import { memo, useMemo } from 'react';
import { CanvasEdges } from './rendering/CanvasEdges';
import { buildEdges } from './rendering/edgeGeometry';
import { codes, names, colors, groups, group } from '../../../shared/bible';
import { activate, type VisualProps } from './types';

export const TimelineView = memo(function TimelineView({
  links,
  selected,
  onHover,
  onSelect,
}: VisualProps) {
  const edges = useMemo(() => buildEdges(links, selected, 'timeline'), [links, selected]);
  return (
    <>
      <text x="40" y="35" className="chart-heading">
        Recorrido canónico
      </text>
      <text x="40" y="56" className="chart-subtitle">
        Secuencia de los libros de la Biblia; no representa fechas históricas.
      </text>
      <line x1="40" y1="280" x2="1160" y2="280" stroke="#a38343" opacity=".5" />
      <CanvasEdges edges={edges} height={510} onHover={onHover} onSelect={onSelect} />
      {codes.map((b, i) => (
        <g
          key={b}
          tabIndex={0}
          role="button"
          className="visual-target"
          aria-label={'Leer ' + names[i]}
          onClick={() => onSelect(b + '.1.1')}
          onKeyDown={(e) => activate(e, () => onSelect(b + '.1.1'))}
        >
          <circle cx={48 + i * 17} cy="280" r="5" fill={colors[group(i)]} />
          <text transform={`translate(${51 + i * 17} 300) rotate(60)`} className="thread-label">
            {names[i]}
          </text>
        </g>
      ))}
      {groups.map((g, i) => (
        <g key={g}>
          <rect x={45 + i * 114} y="438" width="100" height="3" rx="2" fill={colors[i]} />
          <text x={45 + i * 114} y="458" className="thread-label">
            {g.slice(0, 19)}
          </text>
        </g>
      ))}
    </>
  );
});
