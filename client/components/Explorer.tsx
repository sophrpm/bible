import { useFrameState } from '../hooks/useFrameState';
import { mergeGraphLinks } from '../../shared/referenceLinks';
import { useMemo, useState } from 'react';
import { Network, GitBranch, Waypoints, Globe2, Milestone, Grid3X3 } from 'lucide-react';
import { ArcAtlas } from './ArcAtlas';
import { GraphViewport } from './visualizations/GraphViewport';
import { GraphTooltip } from './visualizations/GraphTooltip';
import { TreeView } from './visualizations/TreeView';
import { ThreadsView } from './visualizations/ThreadsView';
import { SphereView } from './visualizations/SphereView';
import { TimelineView } from './visualizations/TimelineView';
import { MatrixView } from './visualizations/MatrixView';
import { Select } from './Select';
import { codes, names, label, type Link } from '../../shared/bible';

const modes = [
  ['arcs', 'Arcos', Network],
  ['tree', 'Árbol', GitBranch],
  ['threads', 'Hilos', Waypoints],
  ['sphere', 'Esfera 3D', Globe2],
  ['timeline', 'Recorrido', Milestone],
  ['matrix', 'Matriz', Grid3X3],
] as const;
export function Explorer({
  links,
  focused,
  selected,
  version,
  onSelect,
}: {
  links: Link[];
  focused: Link[];
  selected: string;
  version: string;
  onSelect: (id: string) => void;
  chapters: Record<string, number>;
}) {
  const [mode, setMode] = useState('arcs');
  const [hover, setHover] = useState<Link | null>(null);
  const [yaw, setYaw] = useFrameState(25);
  const [pitch, setPitch] = useFrameState(12);
  const [book, setBook] = useState('');
  const [minimum, setMinimum] = useState(0);
  const filtered = useMemo(
    () =>
      mergeGraphLinks(links, focused).filter(
        (l) =>
          (!book || l.from.startsWith(book + '.') || l.to.startsWith(book + '.')) &&
          l.votes >= minimum,
      ),
    [links, focused, book, minimum],
  );
  const treeLinks = useMemo(
    () =>
      focused.filter(
        (l) =>
          (!book || l.from.startsWith(book + '.') || l.to.startsWith(book + '.')) &&
          l.votes >= minimum,
      ),
    [focused, book, minimum],
  );
  const props = {
    links: mode === 'tree' ? treeLinks : filtered,
    selected,
    onSelect,
    onHover: setHover,
  };
  return (
    <section className="explorer-page" aria-label="Explorar visualizaciones">
      <div className="explorer-heading">
        <div>
          <span className="eyebrow">ATLAS DE REFERENCIAS</span>
          <h1>
            Una Palabra, <em>muchas perspectivas.</em>
          </h1>
          <p>Explora sus conexiones. Abre cualquier pasaje para continuar en el lector.</p>
        </div>
        <div className="explorer-focus">
          <small>PASAJE DE ENFOQUE</small>
          <b>{label(selected)}</b>
        </div>
      </div>
      <div className="visual-mode-tabs" role="tablist" aria-label="Tipo de visualización">
        {modes.map(([key, name, Icon]) => (
          <button
            key={key}
            role="tab"
            id={'tab-' + key}
            aria-controls="visual-panel"
            aria-selected={mode === key}
            onClick={() => {
              setMode(key);
              setHover(null);
            }}
          >
            <Icon size={17} />
            {name}
          </button>
        ))}
      </div>
      {mode !== 'arcs' && (
        <div className="explorer-filters">
          <Select label="Filtrar por libro" value={book} onChange={setBook}>
            <option value="">Todos los libros</option>
            {codes.map((b, i) => (
              <option key={b} value={b}>
                {names[i]}
              </option>
            ))}
          </Select>
          <label>
            Votos mínimos{' '}
            <input
              type="number"
              min="0"
              value={minimum}
              onChange={(e) => {
                setMinimum(Math.max(0, +e.target.value));
                setHover(null);
              }}
            />
          </label>
          <span>
            {(mode === 'tree' ? treeLinks : filtered).length.toLocaleString('es')} conexiones
            disponibles
          </span>
        </div>
      )}
      <div
        className="visual-panel"
        role="tabpanel"
        id="visual-panel"
        aria-labelledby={'tab-' + mode}
      >
        {mode === 'arcs' ? (
          <ArcAtlas onSelect={onSelect} />
        ) : (
          <GraphViewport
            footer={
              mode === 'sphere' && (
                <div className="sphere-controls">
                  <label>
                    Rotación horizontal{' '}
                    <input
                      aria-label="Rotación horizontal"
                      type="range"
                      min="-180"
                      max="180"
                      value={yaw}
                      onChange={(e) => setYaw(+e.target.value)}
                    />
                    <output>{yaw}°</output>
                  </label>
                  <label>
                    Inclinación{' '}
                    <input
                      aria-label="Inclinación"
                      type="range"
                      min="-90"
                      max="90"
                      value={pitch}
                      onChange={(e) => setPitch(+e.target.value)}
                    />
                    <output>{pitch}°</output>
                  </label>
                  <button
                    onClick={() => {
                      setYaw(25);
                      setPitch(12);
                    }}
                  >
                    Restablecer rotación
                  </button>
                </div>
              )
            }
            key={mode}
            label={'Visualización ' + modes.find((m) => m[0] === mode)?.[1]}
            overlay={
              <GraphTooltip
                onClose={() => setHover(null)}
                link={hover}
                version={version}
                onSelect={onSelect}
              />
            }
          >
            {mode === 'tree' && <TreeView {...props} />}{' '}
            {mode === 'threads' && <ThreadsView {...props} />}{' '}
            {mode === 'sphere' && <SphereView {...props} yaw={yaw} pitch={pitch} />}{' '}
            {mode === 'timeline' && <TimelineView {...props} />}{' '}
            {mode === 'matrix' && <MatrixView {...props} />}
          </GraphViewport>
        )}
      </div>
      <div className="explorer-foot">
        <span>
          {mode === 'arcs'
            ? 'Atlas de 160.000 referencias sobre un eje proporcional de versículos. Señala un capítulo para resaltar sus conexiones.'
            : `Las otras vistas globales parten de las ${links.length.toLocaleString('es')} conexiones con más votos. El árbol usa su propio pasaje de enfoque.`}
        </span>
        <span>
          {mode === 'threads'
            ? 'Hasta 700 hilos'
            : mode === 'sphere'
              ? 'Hasta 650 aristas'
              : mode === 'timeline'
                ? 'Hasta 450 arcos'
                : mode === 'tree'
                  ? 'Hasta 28 conexiones y 9 ramas'
                  : mode === 'matrix'
                    ? 'Toda la muestra, agrupada por libro'
                    : 'Toda la muestra'}{' '}
          {mode === 'arcs' ? ' · Zoom hasta el detalle de versículos' : ' · Zoom hasta 800%'}
        </span>
      </div>
      {mode !== 'arcs' && !(mode === 'tree' ? treeLinks : filtered).length && (
        <p className="empty-visual">
          No hay conexiones con estos filtros. Prueba otro libro o reduce los votos mínimos.
        </p>
      )}
    </section>
  );
}
