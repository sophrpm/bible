import { memo } from 'react';
import { codes, names, colors, group, label } from '../../../shared/bible';
import { activate, type VisualProps } from './types';

export const TreeView = memo(function TreeView({
  links,
  selected,
  onSelect,
  onHover,
}: VisualProps) {
  const focused = links.filter((l) => l.from === selected || l.to === selected);
  const sample = (focused.length ? focused : links).slice(0, 28);
  const books = [
    ...new Set(sample.map((l) => (l.from === selected ? l.to : l.from).split('.')[0])),
  ].slice(0, 9);
  return (
    <>
      <text x="40" y="35" className="chart-heading">
        Árbol de conexiones · {label(selected)}
      </text>
      <text x="40" y="56" className="chart-subtitle">
        Raíz: pasaje seleccionado · ramas: libros conectados · hojas: versículos
      </text>
      <rect x="30" y="230" width="190" height="52" rx="10" className="chart-node" />
      <text x="125" y="260" textAnchor="middle" className="node-title">
        {label(selected)}
      </text>
      {books.map((book, i) => {
        const y = 100 + i * 43;
        const children = sample
          .filter((l) => (l.from === selected ? l.to : l.from).split('.')[0] === book)
          .slice(0, 3);
        return (
          <g key={book}>
            <path
              d={`M220 256 C330 256 330 ${y} 440 ${y}`}
              fill="none"
              stroke={colors[group(codes.indexOf(book))]}
              opacity=".65"
            />
            <rect x="440" y={y - 13} width="160" height="28" rx="7" className="chart-node" />
            <text x="520" y={y + 5} textAnchor="middle" className="node-title">
              {names[codes.indexOf(book)]}
            </text>
            {children.map((l, j) => {
              const id = l.from === selected ? l.to : l.from;
              const x = 720 + j * 155;
              const ly = y + (j - 1) * 9;
              return (
                <g
                  className="visual-target"
                  key={j}
                  tabIndex={0}
                  role="button"
                  aria-label={'Leer ' + label(id)}
                  onFocus={() => onHover(l)}
                  onBlur={() => onHover(null)}
                  onPointerLeave={() => onHover(null)}
                  onPointerEnter={() => onHover(l)}
                  onClick={() => onSelect(id)}
                  onKeyDown={(e) => activate(e, () => onSelect(id))}
                >
                  <path
                    d={`M600 ${y} C650 ${y} 660 ${ly} ${x} ${ly}`}
                    fill="none"
                    stroke={colors[group(codes.indexOf(book))]}
                    opacity=".5"
                  />
                  <rect x={x} y={ly - 12} width="143" height="27" rx="6" className="chart-node" />
                  <text x={x + 71} y={ly + 5} textAnchor="middle" className="chart-label">
                    {label(id)}
                  </text>
                  <title>
                    {label(id)} · {l.votes} votos
                  </title>
                </g>
              );
            })}
          </g>
        );
      })}
      {!sample.length && (
        <text x="600" y="350" className="chart-label">
          No hay conexiones para este pasaje.
        </text>
      )}
    </>
  );
});
