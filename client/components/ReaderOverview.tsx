import { Search } from 'lucide-react';
import { ArcAtlas } from './ArcAtlas';
type Props = {
  selected: string;
  navigate: (id: string) => void;
  setSearch: (open: boolean) => void;
  showArc?: boolean;
};
export function ReaderOverview({ selected, navigate, setSearch, showArc = true }: Props) {
  return (
    <>
      <section className="intro">
        <div>
          <span className="eyebrow">TU ESPACIO DE ESTUDIO PERSONAL</span>
          <h1>
            Lee y descubre <em>la Palabra.</em>
          </h1>
          <p>Lectura continua, comparación y estudio de palabras.</p>
        </div>
        <button className="search-launch" onClick={() => setSearch(true)}>
          <Search size={18} />
          <span>Busca en tus Biblias</span>
          <kbd>Buscar ↗</kbd>
        </button>
      </section>
      {showArc && <ArcAtlas selected={selected} onSelect={navigate} />}
    </>
  );
}
