import { useRef } from 'react';
import { BookOpen, Search as SearchIcon, Sun, Moon, Upload, Bookmark, Network } from 'lucide-react';

type Props = {
  tab: string;
  setTab: (tab: string) => void;
  bookmarks: string[];
  dark: boolean;
  setDark: (dark: boolean) => void;
  setSearch: (open: boolean) => void;
  setShowSaved: (open: boolean) => void;
  showSaved: boolean;
  importing: boolean;
  importFile: (file: File) => Promise<void>;
};

export function AppHeader({
  tab,
  setTab,
  bookmarks,
  dark,
  setDark,
  setSearch,
  setShowSaved,
  showSaved,
  importing,
  importFile,
}: Props) {
  const upload = useRef<HTMLInputElement>(null);
  return (
    <>
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => e.preventDefault()}>
          <span className="brand-icon">
            <BookOpen size={23} />
          </span>
          <span>
            concordia<span className="brand-sub">LA BIBLIA CONECTADA</span>
          </span>
        </a>
        <nav>
          <button className={tab === 'reader' ? 'nav-active' : ''} onClick={() => setTab('reader')}>
            <BookOpen size={16} /> Lector
          </button>
          <button className={tab === 'map' ? 'nav-active' : ''} onClick={() => setTab('map')}>
            <Network size={16} /> Explorar
          </button>
          <button onClick={() => setShowSaved(!showSaved)}>
            <Bookmark size={16} /> Guardados <span className="count">{bookmarks.length}</span>
          </button>
        </nav>
        <div className="header-tools">
          <button
            className="icon-button"
            title="Buscar en la Biblia"
            onClick={() => setSearch(true)}
          >
            <SearchIcon size={19} />
          </button>
          <button className="icon-button" title="Cambiar tema" onClick={() => setDark(!dark)}>
            {dark ? <Sun size={19} /> : <Moon size={19} />}
          </button>
          <span className="divider" />
          <button
            className="import-button"
            disabled={importing}
            onClick={() => upload.current?.click()}
          >
            <Upload size={16} /> {importing ? 'Importando…' : 'Importar Biblia'}
          </button>
          <input
            ref={upload}
            type="file"
            accept=".sqlite3,.sqlite,.db"
            hidden
            onChange={(e) => {
              const input = e.currentTarget;
              const file = input.files?.[0];
              if (file) {
                void importFile(file).finally(() => {
                  input.value = '';
                });
              }
            }}
          />
        </div>
      </header>
    </>
  );
}
