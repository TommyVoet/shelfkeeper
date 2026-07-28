# 📚 Shelfkeeper

Keep track of the books you own. Scan a barcode, search, shelve — offline and private.

Alles blijft op het toestel: geen account, geen server, geen tracking. Boekgegevens en
omslagen komen van [Open Library](https://openlibrary.org).

> **Werknaam.** De definitieve naam ligt pas vast vóór de Play Store-inzending.

## Ontwikkelen

```bash
npm install
npm run dev        # http://localhost:5273/shelfkeeper/
npm test           # Vitest op de logica
npm run build      # typecheck + productiebuild in dist/
```

Het icoon wordt gemaakt uit `public/icon.svg`:

```bash
node scripts/make-icons.mjs
```

## Techniek

| Onderdeel | Keuze |
|---|---|
| Build | Vite + TypeScript |
| UI | Preact + `preact-iso` (echte history-routes → Android-terugknop werkt) |
| Opslag | IndexedDB via `idb` (boeken, planken, omslagen); localStorage alleen voor thema/taal |
| PWA | `vite-plugin-pwa` (Workbox): offline app-shell + cache voor omslagen |
| Scannen | `BarcodeDetector` waar beschikbaar, anders `zxing-wasm` |
| Boekgegevens | Open Library (geen sleutel nodig, CORS-vriendelijk) |
| Talen | Engels (basis), Nederlands, Frans — volgt de taal van het toestel |

De app draait onder `/shelfkeeper/`; alle routepaden lopen via `src/lib/routes.ts`.

## Herkomst

Voortgekomen uit [Boekenzoeker](https://github.com/TommyVoet/boekenzoeker), die een Google
Sheet als bron gebruikte. Bewezen onderdelen (accent-ongevoelig zoeken, treffers oplichten,
CSV-lezer, A–Z-balk, dubbeldetectie) zijn overgenomen; nieuw is dat boeken in de app zelf
binnenkomen via scannen en zoeken.
