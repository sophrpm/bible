import { mergeGraphLinks } from '../../shared/referenceLinks';
import { CanvasEdges } from './visualizations/rendering/CanvasEdges';
import { buildEdges } from './visualizations/rendering/edgeGeometry';
import { useMemo, useState } from 'react';
import { codes, names, colors, group, label, type Link } from '../../shared/bible';
import { GraphViewport } from './visualizations/GraphViewport';
import { GraphTooltip } from './visualizations/GraphTooltip';

const EMPTY_LINKS: Link[] = [];
const EMPTY_CHAPTERS: Record<string, number> = {};

export function ArcMap({
  links,
  activeLinks = EMPTY_LINKS,
  selected,
  onSelect,
  version = 'LBLA',
  chapters = EMPTY_CHAPTERS,
}: {
  links: Link[];
  activeLinks?: Link[];
  selected: string;
  onSelect: (id: string) => void;
  version?: string;
  chapters?: Record<string, number>;
}) {
  const [hover, setHover] = useState<Link | null>(null);
  const edges = useMemo(
    () => buildEdges(mergeGraphLinks(links, activeLinks), selected, 'arcs', chapters),
    [links, activeLinks, selected, chapters],
  );
  const connectedCount = edges.filter((edge) => edge.active).length;
  return (
    <GraphViewport
      label="Mapa interactivo de referencias bíblicas"
      height={400}
      overlay={
        <GraphTooltip
          onClose={() => setHover(null)}
          link={hover}
          version={version}
          onSelect={onSelect}
        />
      }
    >
      <text className="chart-heading" x="600" y="29" textAnchor="middle">
        Una sola historia. Miles de conexiones.
      </text>
      <text className="chart-subtitle" x="600" y="49" textAnchor="middle">
        Señala un arco para ver los pasajes · clic para abrir el destino
      </text>
      <text className="active-verse-caption" x="600" y="72" textAnchor="middle">
        {label(selected)} · {connectedCount} conexiones resaltadas
      </text>
      <CanvasEdges edges={edges} height={400} onHover={setHover} onSelect={onSelect} />
      {codes.map((b, i) => (
        <g
          key={b}
          tabIndex={0}
          role="button"
          aria-label={'Abrir ' + names[i]}
          onPointerEnter={() => setHover(null)}
          onClick={() => onSelect(b + '.1.1')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              onSelect(b + '.1.1');
            }
          }}
        >
          <rect
            x={30 + (i / 66) * 1140}
            y="361"
            width="16"
            height="7"
            rx="1"
            fill={colors[group(i)]}
          />
          {i % 5 === 0 && (
            <text className="chart-label" x={38 + (i / 66) * 1140} y="385" textAnchor="middle">
              {names[i].slice(0, 9)}
            </text>
          )}
          <title>{names[i]} · abrir capítulo 1</title>
        </g>
      ))}
    </GraphViewport>
  );
}
