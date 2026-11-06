import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { colors, label, type AtlasData, type AtlasChapter } from '../../shared/bible';
import { createAtlasController } from './visualizations/rendering/atlasController';

let dataset: Promise<AtlasData> | undefined;
function loadAtlas() {
  return (dataset ??= api<AtlasData>('atlas-data').catch((error) => {
    dataset = undefined;
    throw error;
  }));
}

export function ArcAtlas({
  selected = '',
  onSelect,
}: {
  selected?: string;
  onSelect: (id: string) => void;
}) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const axis = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<AtlasData | null>(null);
  const [error, setError] = useState('');
  const [full, setFull] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [hover, setHover] = useState<{
    chapter: AtlasChapter;
    verse: number;
    x: number;
    y: number;
  } | null>(null);
  const controller = useRef<{ zoom: (factor: number) => void; reset: () => void } | null>(null);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  useEffect(() => {
    let active = true;
    loadAtlas()
      .then((result) => {
        if (active) setData(result);
      })
      .catch((error: Error) => {
        if (active) setError(error.message);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const container = root.current,
      glCanvas = canvas.current,
      overlay = axis.current;
    if (!container || !glCanvas || !overlay || !data) return;
    const instance = createAtlasController(container, glCanvas, overlay, data, {
      onError: setError,
      onZoom: setZoom,
      onHover: setHover,
      onSelect: (id) => onSelectRef.current(id),
      getSelected: () => selectedRef.current,
    });
    if (!instance) return;
    controller.current = instance;
    return () => {
      instance.dispose();
      controller.current = null;
    };
  }, [data]);
  useEffect(() => {
    root.current?.dispatchEvent(new Event('atlas-focus-change'));
  }, [selected]);
  useEffect(() => {
    if (!full) return;
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const escape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setFull(false);
    };
    document.addEventListener('keydown', escape);
    return () => {
      document.body.style.overflow = before;
      document.removeEventListener('keydown', escape);
    };
  }, [full]);
  return (
    <section
      className={'arc-atlas ' + (full ? 'atlas-fullscreen' : '')}
      aria-label="Atlas de arcos"
    >
      <div className="atlas-toolbar">
        <div>
          <b>Referencias cruzadas</b>
          <small>
            {data
              ? `${data.verseCount.toLocaleString('es')} versículos · ${data.shown.toLocaleString('es')} de ${data.total.toLocaleString('es')} referencias`
              : 'Preparando el atlas…'}
          </small>
        </div>
        <span>Rueda y doble clic: acercar al punto · arrastra: desplazar</span>
        <button aria-label="Alejar atlas" onClick={() => controller.current?.zoom(1 / 1.6)}>
          −
        </button>
        <output>{zoom.toFixed(1)}×</output>
        <button aria-label="Acercar atlas" onClick={() => controller.current?.zoom(1.6)}>
          +
        </button>
        <button onClick={() => controller.current?.reset()}>Restablecer</button>
        <button onClick={() => setFull(!full)}>
          {full ? 'Salir de pantalla completa' : 'Pantalla completa'}
        </button>
      </div>
      {error ? (
        <p role="alert">{error}</p>
      ) : (
        <div className="atlas-stage" ref={root}>
          <canvas
            ref={canvas}
            tabIndex={0}
            aria-label="Arcos bíblicos. Flechas para explorar capítulos, más y menos para zoom, Enter para leer."
          />
          <canvas ref={axis} className="atlas-axis" aria-hidden="true" />
          {hover && (
            <div className="atlas-hover" role="status" style={{ left: hover.x, top: hover.y }}>
              <strong>
                {label(hover.chapter.id)}
                {zoom > 120 ? ':' + hover.verse : ''}
              </strong>
              <span>{hover.chapter.connections.toLocaleString('es')} conexiones en la muestra</span>
              <small>Clic para leer · doble clic para acercar</small>
            </div>
          )}
        </div>
      )}
      <details className="atlas-legend">
        <summary>Géneros literarios</summary>
        <div>
          {[
            'Ley',
            'Históricos',
            'Poesía y sabiduría',
            'Profetas mayores',
            'Profetas menores',
            'Evangelios',
            'Hechos',
            'Epístolas paulinas',
            'Epístolas generales',
            'Apocalipsis',
          ].map((name, index) => (
            <span key={name}>
              <i style={{ background: colors[index] }} />
              {name}
            </span>
          ))}
        </div>
      </details>
    </section>
  );
}
