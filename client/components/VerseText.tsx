import { verseTokens } from '../../shared/strongs';
import type { Verse } from '../../shared/bible';

export function VerseText({
  verse,
  onStrong,
}: {
  verse: Verse;
  onStrong?: (topic: string) => void;
}) {
  if (!verse.markup || !onStrong) return <>{verse.text}</>;
  return (
    <>
      {verseTokens(verse.markup, verse.book).map((token, index) =>
        token.strong ? (
          <sup key={index}>
            <button
              className="strong-number"
              aria-label={'Consultar Strong ' + token.strong}
              onClick={(event) => {
                event.stopPropagation();
                onStrong(token.strong!);
              }}
            >
              {token.strong}
            </button>
          </sup>
        ) : (
          <span key={index}>{token.text}</span>
        ),
      )}
    </>
  );
}
