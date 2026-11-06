import { useEffect, useState } from 'react';
import { api } from '../../api';
import { label, type Link, type Verse } from '../../../shared/bible';

type Info = { verse: Verse | null; outgoing: number };
const cache = new Map<string, Info>();
export function GraphTooltip({
  link,
  version,
}: {
  link: Link | null;
  version: string;
  onClose?: () => void;
  onSelect?: (id: string) => void;
}) {
  const [info, setInfo] = useState<Record<string, Info>>({});
  useEffect(() => {
    let active = true;
    if (!link) return;
    setInfo({});
    Promise.all(
      [...new Set([link.from, link.to])].map(async (id) => {
        const key = version + id;
        let value = cache.get(key);
        if (!value) {
          value = await api<Info>('verse-info', { id, version });
          if (cache.size > 300) cache.clear();
          cache.set(key, value);
        }
        return [id, value] as const;
      }),
    )
      .then((rows) => {
        if (active) setInfo(Object.fromEntries(rows));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [link?.from, link?.to, version]);
  if (!link) return null;
  return (
    <div className="graph-tooltip transient-tooltip" role="tooltip">
      <div className="tooltip-heading">
        <span>CONEXIÓN BÍBLICA</span>
        <b>{link.votes} votos</b>
      </div>
      {[...new Set([link.from, link.to])].map((id) => (
        <div className="tooltip-passage" key={id}>
          <strong>{label(id)}</strong>
          <p>{info[id]?.verse?.text || 'Cargando…'}</p>
          <small>{info[id]?.outgoing ?? '…'} referencias desde este versículo</small>
        </div>
      ))}
      <small>Clic en la conexión para leer el destino.</small>
    </div>
  );
}
