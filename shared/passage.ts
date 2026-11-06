import { codes, names } from './bible';

const clean = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[\u0300-\u036f.]/g, '')
    .toLowerCase()
    .replace(/\s/g, '');
export function parsePassage(input: string): string | null {
  const m = input.trim().match(/^(.+?)\s+(\d+)(?::(\d+))?$/);
  if (!m) {
    return null;
  }
  const book = clean(m[1]);
  const aliases: Record<string, string> = {
    jn: 'JHN',
    juan: 'JHN',
    gn: 'GEN',
    gen: 'GEN',
    sal: 'PSA',
    salmo: 'PSA',
    salmos: 'PSA',
    mt: 'MAT',
    ap: 'REV',
    rom: 'ROM',
  };
  const i = names.findIndex((n) => clean(n) === book);
  const code = i >= 0 ? codes[i] : aliases[book] || codes.find((c) => clean(c) === book);
  return code && +m[2] > 0 && +(m[3] || 1) > 0 ? `${code}.${+m[2]}.${+(m[3] || 1)}` : null;
}
