import { useEffect, useState } from 'react';
import { api } from '../api';
import { label, type Verse, type Link } from '../../shared/bible';

function ReferenceCard({
  link,
  selected,
  version,
  onSelect,
}: {
  link: Link;
  selected: string;
  version: string;
  onSelect: (s: string) => void;
}) {
  const id = link.from === selected ? link.to : link.from;
  const [verse, setVerse] = useState<Verse | null>(null);
  useEffect(() => {
    let active = true;
    api<Verse | null>('verse', { version, id })
      .then((v) => active && setVerse(v))
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [version, id]);
  return (
    <button className="reference-card" onClick={() => onSelect(id)}>
      <div>
        <b>
          {label(id)}
          {link.from === selected && link.end !== link.to ? ' – ' + label(link.end) : ''}
        </b>
        <span>{link.votes} votos ↗</span>
      </div>
      <p>{verse?.text || 'Abrir pasaje'}</p>
    </button>
  );
}
export function References({
  links,
  selected,
  version,
  onSelect,
  direction,
  setDirection,
  min,
  setMin,
  note,
  setNote,
}: {
  links: Link[];
  selected: string;
  version: string;
  onSelect: (s: string) => void;
  direction: string;
  setDirection: (s: string) => void;
  min: number;
  setMin: (n: number) => void;
  note: string;
  setNote: (s: string) => void;
}) {
  return (
    <aside className="references">
      <span className="eyebrow">EXPLORA LAS CONEXIONES</span>
      <div className="ref-title">
        <h2>{label(selected)}</h2>
        <span className="badge">{links.length}</span>
      </div>
      <p className="muted">La Escritura ilumina la Escritura.</p>
      <div className="direction">
        {[
          ['both', 'Ambos'],
          ['out', 'Desde aquí'],
          ['in', 'Hacia aquí'],
        ].map(([v, n]) => (
          <button
            className={direction === v ? 'active' : ''}
            key={v}
            onClick={() => setDirection(v)}
          >
            {n}
          </button>
        ))}
      </div>
      <label className="vote-filter">
        Votos mínimos{' '}
        <input
          type="number"
          min="0"
          value={min}
          onChange={(e) => setMin(Math.max(0, +e.target.value))}
        />
      </label>
      <div className="reference-list">
        {links.slice(0, 60).map((l, i) => (
          <ReferenceCard
            key={l.from + l.to + i}
            link={l}
            selected={selected}
            version={version}
            onSelect={onSelect}
          />
        ))}
        {!links.length && <p className="muted">No hay referencias con estos filtros.</p>}
        {links.length > 60 && <p>Mostrando las 60 referencias con más votos.</p>}
      </div>
      <label className="note-label">
        MI NOTA · {label(selected)}
        <textarea
          placeholder="Escribe una reflexión…"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>
      <small className="muted">Se guarda automáticamente en este navegador.</small>
    </aside>
  );
}
