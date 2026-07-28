import { useCallback, useEffect, useRef, useState } from 'preact/hooks';
import { useLocation } from 'preact-iso';
import { Icon } from '../../components/Icon';
import { useT } from '../../i18n';
import { createScanner, type Scanner } from '../../lib/scan/barcode';
import { isBookBarcode, isbnKey } from '../../lib/isbn';
import { lookupIsbn, type BookCandidate } from '../../lib/books/openlibrary';
import { addCandidate } from '../../lib/books/add';
import { bookByIsbn, useStore } from '../../lib/store';
import { authorLine } from '../../lib/book';
import { ROUTES, bookPath } from '../../lib/routes';
import type { Book } from '../../lib/types';

type Phase = 'idle' | 'preparing' | 'running' | 'denied' | 'nocamera' | 'insecure' | 'failed';

interface Hit {
  isbn: string;
  kind: 'have' | 'new' | 'added' | 'unknown';
  title?: string;
  author?: string;
  bookId?: string;
  candidate?: BookCandidate;
}

const SCAN_INTERVAL_MS = 300;
/** Dezelfde code niet meteen opnieuw behandelen. */
const REPEAT_BLOCK_MS = 2500;

export function ScanTab() {
  const t = useT();
  const { route } = useLocation();
  useStore(); // meelopen met wijzigingen in de collectie

  const [phase, setPhase] = useState<Phase>('idle');
  const [auto, setAuto] = useState(false);
  const [current, setCurrent] = useState<Hit | null>(null);
  const [session, setSession] = useState<Hit[]>([]);
  const [busy, setBusy] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<Scanner | null>(null);
  const timerRef = useRef<number | null>(null);
  const recentRef = useRef<Map<string, number>>(new Map());
  const autoRef = useRef(auto);
  autoRef.current = auto;

  const stop = useCallback(() => {
    if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
    scannerRef.current?.dispose();
    scannerRef.current = null;
    setPhase('idle');
  }, []);

  // Camera altijd loslaten als je het scherm verlaat.
  useEffect(() => stop, [stop]);

  const handleCode = useCallback(async (raw: string) => {
    const isbn = isbnKey(raw);
    if (!isbn) return;
    const now = Date.now();
    const seen = recentRef.current.get(isbn);
    if (seen && now - seen < REPEAT_BLOCK_MS) return;
    recentRef.current.set(isbn, now);

    navigator.vibrate?.(35);

    const owned: Book | undefined = bookByIsbn(isbn);
    if (owned) {
      const hit: Hit = {
        isbn,
        kind: 'have',
        title: owned.title,
        author: authorLine(owned.authors),
        bookId: owned.id,
      };
      setCurrent(hit);
      setSession((s) => [hit, ...s.filter((x) => x.isbn !== isbn)]);
      return;
    }

    setCurrent({ isbn, kind: 'new' });
    let candidate: BookCandidate | null = null;
    try {
      candidate = await lookupIsbn(isbn);
    } catch {
      candidate = null;
    }
    if (!candidate) {
      const hit: Hit = { isbn, kind: 'unknown' };
      setCurrent(hit);
      setSession((s) => [hit, ...s.filter((x) => x.isbn !== isbn)]);
      return;
    }

    if (autoRef.current) {
      const book = await addCandidate(candidate, { source: 'scan' });
      const hit: Hit = {
        isbn,
        kind: 'added',
        title: book.title,
        author: authorLine(book.authors),
        bookId: book.id,
      };
      setCurrent(hit);
      setSession((s) => [hit, ...s.filter((x) => x.isbn !== isbn)]);
      return;
    }

    const hit: Hit = {
      isbn,
      kind: 'new',
      title: candidate.title,
      author: authorLine(candidate.authors),
      candidate,
    };
    setCurrent(hit);
    setSession((s) => [hit, ...s.filter((x) => x.isbn !== isbn)]);
  }, []);

  const start = async () => {
    if (!window.isSecureContext) {
      setPhase('insecure');
      return;
    }
    if (!navigator.mediaDevices?.getUserMedia) {
      setPhase('nocamera');
      return;
    }
    setPhase('preparing');
    try {
      const [stream, scanner] = await Promise.all([
        navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } },
          audio: false,
        }),
        createScanner(),
      ]);
      streamRef.current = stream;
      scannerRef.current = scanner;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((tr) => tr.stop());
        setPhase('failed');
        return;
      }
      video.srcObject = stream;
      await video.play();
      setPhase('running');

      timerRef.current = window.setInterval(async () => {
        const s = scannerRef.current;
        const v = videoRef.current;
        if (!s || !v || v.readyState < 2) return;
        try {
          const codes = await s.scan(v);
          for (const code of codes) {
            if (isBookBarcode(code)) {
              await handleCode(code);
              break;
            }
          }
        } catch {
          /* één mislukt beeld is niet erg; de volgende keer opnieuw */
        }
      }, SCAN_INTERVAL_MS);
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === 'NotAllowedError' || name === 'SecurityError') setPhase('denied');
      else if (name === 'NotFoundError' || name === 'OverconstrainedError') setPhase('nocamera');
      else setPhase('failed');
    }
  };

  const addCurrent = async () => {
    if (!current?.candidate) return;
    setBusy(true);
    try {
      const book = await addCandidate(current.candidate, { source: 'scan' });
      const hit: Hit = {
        isbn: current.isbn,
        kind: 'added',
        title: book.title,
        author: authorLine(book.authors),
        bookId: book.id,
      };
      setCurrent(hit);
      setSession((s) => [hit, ...s.filter((x) => x.isbn !== hit.isbn)]);
    } finally {
      setBusy(false);
    }
  };

  const problem =
    phase === 'denied' ? t('scan.denied')
    : phase === 'nocamera' ? t('scan.noCamera')
    : phase === 'insecure' ? t('scan.insecure')
    : phase === 'failed' ? t('scan.failed')
    : null;

  return (
    <div class="addtab">
      <div class={`scanner${phase === 'running' ? ' is-live' : ''}`}>
        <video ref={videoRef} class="scanner__video" playsInline muted autoPlay />
        {phase === 'running' && <div class="scanner__frame" aria-hidden="true" />}
        {phase !== 'running' && (
          <div class="scanner__overlay">
            {phase === 'preparing' ? (
              <p>{t('scan.preparing')}</p>
            ) : (
              <button class="btn btn--primary" onClick={start}>
                <Icon name="scan" size={20} />
                {t('scan.start')}
              </button>
            )}
          </div>
        )}
      </div>

      {phase === 'running' && (
        <>
          <p class="hint scanner__hint">{t('scan.hint')}</p>
          <div class="scanner__controls">
            <label class="switch">
              <input type="checkbox" checked={auto} onChange={(e) => setAuto((e.target as HTMLInputElement).checked)} />
              <span>{t('scan.auto')}</span>
            </label>
            <button class="btn btn--ghost" onClick={stop}>
              {t('scan.stop')}
            </button>
          </div>
        </>
      )}

      {problem && <p class="notice notice--error">{problem}</p>}

      {current && (
        <div class={`scanhit scanhit--${current.kind}`} role="status">
          <div class="scanhit__label">
            {current.kind === 'have' && t('scan.result.have')}
            {current.kind === 'added' && t('add.added')}
            {current.kind === 'unknown' && t('scan.result.unknown')}
            {current.kind === 'new' && (current.title ? t('scan.result.new') : t('scan.result.lookup'))}
          </div>
          {current.title && <div class="scanhit__title">{current.title}</div>}
          {current.author && <div class="scanhit__author">{current.author}</div>}
          {current.kind === 'unknown' && <div class="scanhit__author">{current.isbn}</div>}

          <div class="scanhit__actions">
            {current.kind === 'new' && current.candidate && (
              <button class="btn btn--primary" onClick={addCurrent} disabled={busy}>
                {t('common.add')}
              </button>
            )}
            {(current.kind === 'have' || current.kind === 'added') && current.bookId && (
              <button class="btn btn--ghost" onClick={() => route(bookPath(current.bookId!))}>
                {t('add.openBook')}
              </button>
            )}
            {current.kind === 'unknown' && (
              <button
                class="btn btn--ghost"
                onClick={() => route(`${ROUTES.add}?mode=manual&isbn=${current.isbn}`)}
              >
                {t('scan.result.unknownCta')}
              </button>
            )}
          </div>
        </div>
      )}

      {session.length > 1 && (
        <>
          <h2 class="section__title scanner__sessiontitle">{t('scan.session')}</h2>
          <ul class="scanlist">
            {session.map((h) => (
              <li key={h.isbn}>
                <span class="scanlist__title">{h.title ?? h.isbn}</span>
                <span class={`badge badge--${h.kind === 'have' ? 'have' : h.kind === 'added' ? 'read' : 'wishlist'}`}>
                  {h.kind === 'added' ? t('scan.session.added')
                    : h.kind === 'have' ? t('scan.session.have')
                    : t('scan.session.unknown')}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
