import { useEffect, useRef, useState } from 'react';
import { Columns2, Check, ChevronDown, X } from 'lucide-react';
import type { Version } from '../../shared/bible';

export function ComparisonPicker({
  versions,
  primary,
  selected,
  onChange,
}: {
  versions: Version[];
  primary: string;
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, []);
  return (
    <div
      className="comparison-picker"
      ref={root}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
        }
      }}
    >
      <button
        className="select-trigger"
        aria-label="Comparar versiones"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Columns2 size={16} />
        <span>
          {selected.length ? `${selected.length + 1} versiones en paralelo` : 'Comparar versiones'}
        </span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div
          className="select-popover comparison-popover"
          role="group"
          aria-label="Traducciones para comparar"
        >
          <div className="popover-heading">
            COMPARAR TRADUCCIONES{' '}
            <button aria-label="Cerrar selector" onClick={() => setOpen(false)}>
              <X size={13} />
            </button>
          </div>
          <p>Hasta 4 versiones, incluida la principal.</p>
          <div className="comparison-primary">
            <Check size={14} />
            {versions.find((v) => v.id === primary)?.name}
            <small>Principal</small>
          </div>
          {versions
            .filter((v) => v.id !== primary)
            .map((v) => (
              <label
                className={'comparison-option ' + (selected.includes(v.id) ? 'chosen' : '')}
                key={v.id}
              >
                <input
                  type="checkbox"
                  checked={selected.includes(v.id)}
                  disabled={!selected.includes(v.id) && selected.length >= 3}
                  onChange={() =>
                    onChange(
                      selected.includes(v.id)
                        ? selected.filter((id) => id !== v.id)
                        : [...selected, v.id],
                    )
                  }
                />
                <span>{v.name}</span>
              </label>
            ))}
          {versions.length < 4 && (
            <p className="comparison-hint">
              Importa más Biblias para añadir traducciones a la cuadrícula.
            </p>
          )}
          <button
            className="comparison-clear"
            onClick={() => onChange([])}
            disabled={!selected.length}
          >
            Limpiar comparación
          </button>
        </div>
      )}
    </div>
  );
}
