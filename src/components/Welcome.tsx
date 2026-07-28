import { useState } from 'preact/hooks';
import { useT } from '../i18n';

interface Props {
  onDone: (startScanning: boolean) => void;
}

const STEPS = [1, 2, 3] as const;
const ART = ['📚', '📷', '🔒'];

/** Drie schermen bij de allereerste start. Overslaan mag altijd. */
export function Welcome({ onDone }: Props) {
  const t = useT();
  const [step, setStep] = useState(0);
  const last = step === STEPS.length - 1;

  return (
    <div class="welcome" role="dialog" aria-modal="true" aria-label={t('app.name')}>
      <div class="welcome__body">
        <div class="welcome__art" aria-hidden="true">
          {ART[step]}
        </div>
        <h1 class="welcome__title">{t(`welcome.${STEPS[step]}.title`)}</h1>
        <p class="welcome__text">{t(`welcome.${STEPS[step]}.body`)}</p>
      </div>

      <div class="welcome__dots" aria-hidden="true">
        {STEPS.map((_, i) => (
          <span key={i} class={`welcome__dot${i === step ? ' is-on' : ''}`} />
        ))}
      </div>

      <div class="welcome__actions">
        {last ? (
          <>
            <button class="btn btn--primary btn--block" onClick={() => onDone(true)}>
              {t('welcome.start')}
            </button>
            <button class="btn btn--quiet btn--block" onClick={() => onDone(false)}>
              {t('welcome.browse')}
            </button>
          </>
        ) : (
          <>
            <button class="btn btn--primary btn--block" onClick={() => setStep(step + 1)}>
              {t('welcome.next')}
            </button>
            <button class="btn btn--quiet btn--block" onClick={() => onDone(false)}>
              {t('welcome.skip')}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
