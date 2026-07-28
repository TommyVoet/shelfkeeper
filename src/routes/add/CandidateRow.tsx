import { useState } from 'preact/hooks';
import { Icon } from '../../components/Icon';
import { useT } from '../../i18n';
import { coverInitials, spineHue } from '../../lib/covers';
import type { BookCandidate } from '../../lib/books/openlibrary';
import type { Book } from '../../lib/types';

interface Props {
  candidate: BookCandidate;
  subtitle: string;
  existing?: Book;
  onAdd: () => Promise<void> | void;
  onOpen: () => void;
}

/** Eén zoekresultaat: omslag, titel, auteur en een plus- of vinkknop. */
export function CandidateRow({ candidate, subtitle, existing, onAdd, onOpen }: Props) {
  const t = useT();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      await onAdd();
    } finally {
      setBusy(false);
    }
  };

  return (
    <li class="candidate">
      <div class="candidate__cover">
        {candidate.coverUrl && !failed ? (
          <div class="cover cover--row">
            <img src={candidate.coverUrl} alt="" loading="lazy" onError={() => setFailed(true)} />
          </div>
        ) : (
          <div
            class="cover cover--row cover--blank"
            style={{ '--spine-hue': spineHue(candidate.title) } as unknown as string}
            aria-hidden="true"
          >
            <span class="cover__initials">{coverInitials(candidate.title)}</span>
          </div>
        )}
      </div>

      <div class="candidate__text">
        <span class="candidate__title">{candidate.title}</span>
        {subtitle && <span class="candidate__sub">{subtitle}</span>}
        {existing && <span class="badge badge--have">{t('add.have')}</span>}
      </div>

      {existing ? (
        <button class="candidate__btn candidate__btn--have" onClick={onOpen} aria-label={t('add.openBook')}>
          <Icon name="check" size={20} />
        </button>
      ) : (
        <button class="candidate__btn" onClick={add} disabled={busy} aria-label={t('common.add')}>
          <Icon name="plus" size={20} />
        </button>
      )}
    </li>
  );
}
