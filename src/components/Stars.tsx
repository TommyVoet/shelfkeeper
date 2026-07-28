import { Icon } from './Icon';

interface Props {
  value: number;
  onChange?: (value: number) => void;
  label: string;
}

/** Vijf sterren; nog eens op dezelfde ster tikken wist de beoordeling. */
export function Stars({ value, onChange, label }: Props) {
  const readOnly = !onChange;
  return (
    <div class="stars" role={readOnly ? 'img' : 'group'} aria-label={`${label}: ${value}/5`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const filled = n <= value;
        const star = <Icon name={filled ? 'star-filled' : 'star'} size={22} />;
        if (readOnly) {
          return (
            <span key={n} class={`stars__item${filled ? ' is-on' : ''}`}>
              {star}
            </span>
          );
        }
        return (
          <button
            key={n}
            class={`stars__item${filled ? ' is-on' : ''}`}
            aria-label={`${n}/5`}
            aria-pressed={filled}
            onClick={() => onChange(value === n ? 0 : n)}
          >
            {star}
          </button>
        );
      })}
    </div>
  );
}
