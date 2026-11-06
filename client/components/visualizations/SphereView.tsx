import { memo, useMemo } from 'react';
import { CanvasEdges } from './rendering/CanvasEdges';
import { buildEdges } from './rendering/edgeGeometry';
import { codes, names, colors, group } from '../../../shared/bible';
import { spherePoint } from './geometry';
import { activate, type VisualProps } from './types';

export const SphereView = memo(function SphereView({
  links,
  selected,
  onHover,
  onSelect,
  yaw,
  pitch,
}: { yaw: number; pitch: number } & VisualProps) {
  const points = useMemo(() => codes.map((_, i) => spherePoint(i, yaw, pitch)), [yaw, pitch]);
  const edges = useMemo(
    () => buildEdges(links, selected, 'sphere', {}, yaw, pitch),
    [links, selected, yaw, pitch],
  );
  return (
    <>
      <text x="38" y="30" className="chart-heading">
        Constelación 3D
      </text>
      <text x="38" y="51" className="chart-subtitle">
        66 libros distribuidos en una esfera · gira con los controles
      </text>
      <ellipse cx="600" cy="255" rx="225" ry="225" className="sphere-outline" />
      <CanvasEdges edges={edges} height={510} onHover={onHover} onSelect={onSelect} />
      {points
        .map((p, i) => ({ ...p, i }))
        .sort((a, b) => a.z! - b.z!)
        .map((p) => (
          <g
            key={p.i}
            tabIndex={0}
            role="button"
            className="visual-target"
            aria-label={'Leer ' + names[p.i]}
            onClick={() => onSelect(codes[p.i] + '.1.1')}
            onKeyDown={(e) => activate(e, () => onSelect(codes[p.i] + '.1.1'))}
            opacity={0.45 + (p.z! + 1) * 0.275}
          >
            <circle cx={p.x} cy={p.y} r={4 + (p.z! + 1) * 1.7} fill={colors[group(p.i)]} />
            <text x={p.x + 9} y={p.y + 4} className="sphere-label">
              {names[p.i]}
            </text>
          </g>
        ))}
    </>
  );
});
