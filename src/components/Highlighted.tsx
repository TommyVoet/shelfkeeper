import { highlight } from '../lib/text';

interface Props {
  text: string;
  tokens: string[];
}

/** Tekst met de zoekwoorden opgelicht — zonder innerHTML. */
export function Highlighted({ text, tokens }: Props) {
  if (!tokens.length) return <>{text}</>;
  return (
    <>
      {highlight(text, tokens).map((seg, i) =>
        seg.hit ? <mark key={i}>{seg.text}</mark> : <span key={i}>{seg.text}</span>,
      )}
    </>
  );
}
