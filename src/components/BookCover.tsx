import { useState } from 'preact/hooks';
import { coverInitials, spineHue, useCoverSrc } from '../lib/covers';
import type { Book } from '../lib/types';

interface Props {
  book: Pick<Book, 'title' | 'coverKey' | 'coverUrl'>;
  /** 'grid' = groot in het raster, 'row' = klein in de lijst. */
  size?: 'grid' | 'row' | 'detail';
}

/**
 * Toont de omslag; zonder omslag tekent de app zelf een boekrug met de
 * beginletters, in een kleur die uit de titel volgt (altijd dezelfde).
 */
export function BookCover({ book, size = 'grid' }: Props) {
  const src = useCoverSrc(book);
  const [failed, setFailed] = useState(false);

  if (src && !failed) {
    return (
      <div class={`cover cover--${size}`}>
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  const hue = spineHue(book.title || '?');
  return (
    <div
      class={`cover cover--${size} cover--blank`}
      style={{ '--spine-hue': hue } as unknown as string}
      aria-hidden="true"
    >
      <span class="cover__initials">{coverInitials(book.title)}</span>
    </div>
  );
}
