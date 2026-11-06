import { codes, type VerseToken } from './bible';

export function plainBibleText(markup: string): string {
  return markup
    .replace(/<m>.*?<\/m>/gis, '')
    .replace(/<S>.*?<\/S>/gis, '')
    .replace(/<[^>]*>/g, '')
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Keep Strong markers attached to the preceding word; the testament supplies missing H/G prefixes. */
export function verseTokens(markup: string, book: string): VerseToken[] {
  const tokens: VerseToken[] = [];
  const prefix = codes.indexOf(book) < 39 ? 'H' : 'G';
  for (const part of markup.replace(/<m>.*?<\/m>/gis, '').split(/(<S>.*?<\/S>)/gi)) {
    const marker = part.match(/^<S>(.*?)<\/S>$/i);
    if (marker) {
      for (const number of marker[1].match(/[HG]?\d+/gi) || []) {
        tokens.push({ strong: /^[HG]/i.test(number) ? number.toUpperCase() : prefix + number });
      }
    } else {
      const text = plainBibleText(part);
      if (text) tokens.push({ text });
    }
  }
  return tokens;
}
