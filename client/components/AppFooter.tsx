import type { Version } from '../../shared/bible';

type Props = { versions: Version[] };

export function AppFooter({ versions }: Props) {
  return (
    <>
      <footer>
        <span className="footer-brand">
          concordia <span>Un estudio, muchas conexiones.</span>
        </span>
        <span>Referencias: OpenBible.info · CC BY · Biblias para uso personal</span>
        <span>● Almacenamiento local</span>
      </footer>
      <details className="credits">
        <summary>Versiones y derechos de autor</summary>
        {versions.map((v) => (
          <p key={v.id}>
            {v.name} — {v.copyright}
          </p>
        ))}
      </details>
    </>
  );
}
