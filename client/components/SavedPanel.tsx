import { ArrowUpRight } from 'lucide-react';
import { label } from '../../shared/bible';

type Props = { bookmarks: string[]; notes: Record<string, string>; navigate: (id: string) => void };

export function SavedPanel({ bookmarks, notes, navigate }: Props) {
  function exportNotes(): void {
    const backup = new Blob([JSON.stringify({ bookmarks, notes }, null, 2)], {
      type: 'application/json',
    });
    const downloadLink = document.createElement('a');
    const objectUrl = URL.createObjectURL(backup);
    downloadLink.href = objectUrl;
    downloadLink.download = 'concordia-notas.json';
    downloadLink.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <section className="saved-panel">
      <h3>Tus marcadores</h3>
      {bookmarks.length ? (
        bookmarks.map((id) => (
          <button key={id} onClick={() => navigate(id)}>
            ★ {label(id)} <ArrowUpRight size={12} />
          </button>
        ))
      ) : (
        <p>Pulsa el número de un versículo para guardarlo.</p>
      )}
      <button onClick={exportNotes}>Exportar notas y marcadores ↓</button>
    </section>
  );
}
