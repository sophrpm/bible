import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isVerseConnected, mergeGraphLinks, visibleGraphLinks } from '../shared/referenceLinks';
import { updateReader, chapterDestination } from '../client/readerPanels';
import type { BookSummary, Link } from '../shared/bible';

const link: Link = { from: 'JOS.1.6', to: '1CO.16.13', end: '1CO.16.14', votes: 90 };

test('resalta conexiones de salida y de entrada dentro de rangos', () => {
  assert(isVerseConnected(link, 'JOS.1.6'));
  assert(isVerseConnected(link, '1CO.16.14'));
  assert(!isVerseConnected(link, 'JOS.1.18'));
});

test('incluye conexiones activas aunque no estén en la muestra y las dibuja al final', () => {
  const background = { ...link, from: 'GEN.1.1', to: 'JHN.1.1', end: 'JHN.1.1' };
  const merged = mergeGraphLinks([background], [link, link]);
  assert.equal(merged.length, 2);
  assert.deepEqual(visibleGraphLinks(merged, 'JOS.1.6', 1), [link]);
  assert.equal(visibleGraphLinks(merged, 'JOS.1.6')[1], link);
});

test('cambiar un lector conserva los pasajes de los otros lectores', () => {
  const panels = [
    { id: 'a', version: 'LBLA', selected: 'JOS.1.1' },
    { id: 'b', version: 'RVR1960', selected: 'JHN.3.16' },
  ];
  const changed = updateReader(panels, 'a', { selected: 'JOS.1.18' });
  assert.equal(changed[0].selected, 'JOS.1.18');
  assert.equal(changed[1], panels[1]);
  assert.equal(panels[0].selected, 'JOS.1.1');
});

test('la navegación de capítulo respeta los límites entre libros', () => {
  const books = [
    { book: 'JOS', chapters: 24 },
    { book: 'JDG', chapters: 21 },
  ] as BookSummary[];
  assert.equal(chapterDestination(books, 'JOS.24.1', 25), 'JDG.1.1');
  assert.equal(chapterDestination(books, 'JDG.1.1', 0), 'JOS.24.1');
  assert.equal(chapterDestination(books, 'JOS.1.1', 0), null);
});
