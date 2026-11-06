import {
  Children,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type ReactElement,
} from 'react';
import { ChevronDown, Check, Search } from 'lucide-react';

type Props = {
  value: string | number;
  onChange: (value: string) => void;
  label: string;
  children: ReactNode;
};
export function Select({ value, onChange, label, children }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  // Children.toArray flattens option arrays while preserving React's stable keys.
  type OptionProps = { value: string | number; children: ReactNode };
  const options = Children.toArray(children).filter(
    (child): child is ReactElement<OptionProps> =>
      isValidElement<OptionProps>(child) && child.type === 'option',
  );
  const current = options.find((o) => String(o.props.value) === String(value));
  const filtered = options.filter((o) =>
    String(o.props.children).toLocaleLowerCase('es').includes(query.toLocaleLowerCase('es')),
  );
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
      className="custom-select"
      ref={root}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setOpen(false);
          trigger.current?.focus();
        }
        if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
          e.preventDefault();
          const items = Array.from(
            root.current?.querySelectorAll<HTMLButtonElement>('[role=option]') || [],
          );
          const i = items.indexOf(document.activeElement as HTMLButtonElement);
          items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
        }
      }}
    >
      <button
        ref={trigger}
        className="select-trigger"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => {
          setOpen(!open);
          setQuery('');
        }}
      >
        <span>{current?.props.children || label}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="select-popover">
          <div className="popover-heading">{label}</div>
          {options.length > 10 && (
            <label className="select-search">
              <Search size={14} />
              <input
                autoFocus
                aria-label={'Filtrar ' + label}
                placeholder="Filtrar…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </label>
          )}
          <div role="listbox" aria-label={label} className="select-options">
            {filtered.map((o) => (
              <button
                type="button"
                role="option"
                aria-selected={String(o.props.value) === String(value)}
                key={o.props.value}
                onClick={() => {
                  onChange(String(o.props.value));
                  setOpen(false);
                  trigger.current?.focus();
                }}
              >
                <span>{o.props.children}</span>
                {String(o.props.value) === String(value) && <Check size={14} />}
              </button>
            ))}
            {!filtered.length && <p className="empty-option">Sin resultados</p>}
          </div>
        </div>
      )}
    </div>
  );
}
