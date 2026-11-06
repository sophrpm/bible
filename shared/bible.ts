/** One canonical catalogue keeps USFM codes, OSIS codes and Spanish names in sync. */
const canonicalBooks = [
  { code: 'GEN', osis: 'Gen', name: 'Génesis' },
  { code: 'EXO', osis: 'Exod', name: 'Éxodo' },
  { code: 'LEV', osis: 'Lev', name: 'Levítico' },
  { code: 'NUM', osis: 'Num', name: 'Números' },
  { code: 'DEU', osis: 'Deut', name: 'Deuteronomio' },
  { code: 'JOS', osis: 'Josh', name: 'Josué' },
  { code: 'JDG', osis: 'Judg', name: 'Jueces' },
  { code: 'RUT', osis: 'Ruth', name: 'Rut' },
  { code: '1SA', osis: '1Sam', name: '1 Samuel' },
  { code: '2SA', osis: '2Sam', name: '2 Samuel' },
  { code: '1KI', osis: '1Kgs', name: '1 Reyes' },
  { code: '2KI', osis: '2Kgs', name: '2 Reyes' },
  { code: '1CH', osis: '1Chr', name: '1 Crónicas' },
  { code: '2CH', osis: '2Chr', name: '2 Crónicas' },
  { code: 'EZR', osis: 'Ezra', name: 'Esdras' },
  { code: 'NEH', osis: 'Neh', name: 'Nehemías' },
  { code: 'EST', osis: 'Esth', name: 'Ester' },
  { code: 'JOB', osis: 'Job', name: 'Job' },
  { code: 'PSA', osis: 'Ps', name: 'Salmos' },
  { code: 'PRO', osis: 'Prov', name: 'Proverbios' },
  { code: 'ECC', osis: 'Eccl', name: 'Eclesiastés' },
  { code: 'SNG', osis: 'Song', name: 'Cantares' },
  { code: 'ISA', osis: 'Isa', name: 'Isaías' },
  { code: 'JER', osis: 'Jer', name: 'Jeremías' },
  { code: 'LAM', osis: 'Lam', name: 'Lamentaciones' },
  { code: 'EZK', osis: 'Ezek', name: 'Ezequiel' },
  { code: 'DAN', osis: 'Dan', name: 'Daniel' },
  { code: 'HOS', osis: 'Hos', name: 'Oseas' },
  { code: 'JOL', osis: 'Joel', name: 'Joel' },
  { code: 'AMO', osis: 'Amos', name: 'Amós' },
  { code: 'OBA', osis: 'Obad', name: 'Abdías' },
  { code: 'JON', osis: 'Jonah', name: 'Jonás' },
  { code: 'MIC', osis: 'Mic', name: 'Miqueas' },
  { code: 'NAM', osis: 'Nah', name: 'Nahúm' },
  { code: 'HAB', osis: 'Hab', name: 'Habacuc' },
  { code: 'ZEP', osis: 'Zeph', name: 'Sofonías' },
  { code: 'HAG', osis: 'Hag', name: 'Hageo' },
  { code: 'ZEC', osis: 'Zech', name: 'Zacarías' },
  { code: 'MAL', osis: 'Mal', name: 'Malaquías' },
  { code: 'MAT', osis: 'Matt', name: 'Mateo' },
  { code: 'MRK', osis: 'Mark', name: 'Marcos' },
  { code: 'LUK', osis: 'Luke', name: 'Lucas' },
  { code: 'JHN', osis: 'John', name: 'Juan' },
  { code: 'ACT', osis: 'Acts', name: 'Hechos' },
  { code: 'ROM', osis: 'Rom', name: 'Romanos' },
  { code: '1CO', osis: '1Cor', name: '1 Corintios' },
  { code: '2CO', osis: '2Cor', name: '2 Corintios' },
  { code: 'GAL', osis: 'Gal', name: 'Gálatas' },
  { code: 'EPH', osis: 'Eph', name: 'Efesios' },
  { code: 'PHP', osis: 'Phil', name: 'Filipenses' },
  { code: 'COL', osis: 'Col', name: 'Colosenses' },
  { code: '1TH', osis: '1Thess', name: '1 Tesalonicenses' },
  { code: '2TH', osis: '2Thess', name: '2 Tesalonicenses' },
  { code: '1TI', osis: '1Tim', name: '1 Timoteo' },
  { code: '2TI', osis: '2Tim', name: '2 Timoteo' },
  { code: 'TIT', osis: 'Titus', name: 'Tito' },
  { code: 'PHM', osis: 'Phlm', name: 'Filemón' },
  { code: 'HEB', osis: 'Heb', name: 'Hebreos' },
  { code: 'JAS', osis: 'Jas', name: 'Santiago' },
  { code: '1PE', osis: '1Pet', name: '1 Pedro' },
  { code: '2PE', osis: '2Pet', name: '2 Pedro' },
  { code: '1JN', osis: '1John', name: '1 Juan' },
  { code: '2JN', osis: '2John', name: '2 Juan' },
  { code: '3JN', osis: '3John', name: '3 Juan' },
  { code: 'JUD', osis: 'Jude', name: 'Judas' },
  { code: 'REV', osis: 'Rev', name: 'Apocalipsis' },
];

export const codes = canonicalBooks.map((book) => book.code);
export const osis = canonicalBooks.map((book) => book.osis);
export const names = canonicalBooks.map((book) => book.name);

export const groups = [
  'Ley',
  'Libros históricos',
  'Poesía y sabiduría',
  'Profetas mayores',
  'Profetas menores',
  'Evangelios',
  'Hechos',
  'Epístolas paulinas',
  'Epístolas generales',
  'Apocalipsis',
];
export const colors = [
  '#d482a4',
  '#ce8952',
  '#c0a34d',
  '#b57ba6',
  '#9baf60',
  '#60a7a5',
  '#6da181',
  '#749cbe',
  '#6bafa2',
  '#9d88bf',
];
// Each bound is the final book index (exclusive) for one canonical genre.
const genreBounds = [5, 17, 22, 27, 39, 43, 44, 57, 65, 66];

export function group(bookIndex: number): number {
  const genreIndex = genreBounds.findIndex((end) => bookIndex < end);
  return genreIndex === -1 ? groups.length - 1 : genreIndex;
}

export type Verse = {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  markup?: string;
  heading?: string;
  version?: string;
};
export type Link = { from: string; to: string; end: string; votes: number };
export type Version = { id: string; name: string; copyright: string; strongs?: boolean };
export function label(id: string) {
  const [b, c, v] = id.split('.');
  return `${names[codes.indexOf(b)] || b} ${c}${v ? ':' + v : ''}`;
}

export type BookSummary = {
  book: string;
  chapters: number;
  name: string;
  order: number;
  group: number;
};

export type BibleStats = {
  references: number;
  verses: number;
};

export type SearchResults = {
  items: Verse[];
  total: number;
};

export type VerseToken = { text?: string; strong?: string };
export type DictionaryInfo = { id: string; name: string; filename: string };
export type DictionaryEntry = {
  topic: string;
  definition: string;
  lexeme: string | null;
  transliteration: string | null;
  pronunciation: string | null;
  short_definition: string | null;
  dictionaryId: string;
  dictionaryName: string;
};
export type AtlasChapter = {
  id: string;
  book: string;
  start: number;
  end: number;
  connections: number;
};
export type AtlasData = {
  edges: number[];
  chapters: AtlasChapter[];
  verseCount: number;
  total: number;
  shown: number;
};
