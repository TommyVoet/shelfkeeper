/**
 * Een Google Spreadsheet-link omzetten naar een adres dat CSV teruggeeft.
 *
 * Dure les uit Boekenzoeker: `/gviz/tq?tqx=out:csv` verminkt sommige bestanden
 * (de hele eerste kolom belandt in één cel) bij spreadsheets die eigenlijk een
 * in Drive bewaard Excel-bestand zijn. `/export?format=csv` geeft het wél trouw
 * terug. Daarom is die de eerste keuze en gviz alleen reserve.
 */

export interface SheetSource {
  csv: string;
  /** Reserve-adres als het eerste niet werkt. */
  csvAlt?: string;
  /** Adres om de spreadsheet zelf te openen. */
  edit?: string;
}

export function interpretSheetUrl(raw: string): SheetSource | null {
  const url = (raw ?? '').trim();
  if (!url) return null;

  // Gepubliceerde link: /spreadsheets/d/e/<id>/pub…
  const published = url.match(/docs\.google\.com\/spreadsheets\/d\/e\/([^/?#]+)/);
  if (published) {
    const gid = url.match(/[?&#]gid=(\d+)/)?.[1];
    return {
      csv: `https://docs.google.com/spreadsheets/d/e/${published[1]}/pub?output=csv${gid ? `&gid=${gid}` : ''}`,
    };
  }

  // Gewone link: /spreadsheets/d/<id>/…
  const normal = url.match(/docs\.google\.com\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
  if (normal) {
    const gid = url.match(/[?&#]gid=(\d+)/)?.[1];
    const base = `https://docs.google.com/spreadsheets/d/${normal[1]}`;
    return {
      csv: `${base}/export?format=csv${gid ? `&gid=${gid}` : ''}`,
      csvAlt: `${base}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`,
      edit: `${base}/edit`,
    };
  }

  // Iets anders (bijvoorbeeld een rechtstreekse CSV-link): gebruiken zoals opgegeven.
  return { csv: url };
}

/** Haalt de CSV op; probeert het reserve-adres als het eerste faalt. */
export async function fetchSheetCsv(source: SheetSource, signal?: AbortSignal): Promise<string> {
  const urls = [source.csv, source.csvAlt].filter(Boolean) as string[];
  let lastError: Error | null = null;
  for (const url of urls) {
    try {
      const res = await fetch(url, { cache: 'no-store', signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      // Een deelinstelling die niet klopt geeft een inlogpagina terug, geen CSV.
      if (text.trim().startsWith('<')) throw new Error('Dit adres geeft geen CSV terug');
      return text;
    } catch (e) {
      lastError = e as Error;
    }
  }
  throw lastError ?? new Error('Ophalen mislukt');
}
