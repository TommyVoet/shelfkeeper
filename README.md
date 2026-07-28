# 📚 Shelfkeeper

Keep track of the books you own. Scan a barcode, search, shelve — offline and private.

Alles blijft op het toestel: geen account, geen server, geen tracking. Boekgegevens en
omslagen komen van [Open Library](https://openlibrary.org).

**Live:** https://tommyvoet.github.io/shelfkeeper/ — open op je telefoon en kies
*Toevoegen aan beginscherm*, dan gedraagt hij zich als een gewone app.

> **Werknaam.** De definitieve naam ligt pas vast vóór de Play Store-inzending.
> `Bookshelf`, `Shelfie`, `Book Keeper` en `BookVault` zijn allemaal al bezet.

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
Elke push naar `main` bouwt, test en publiceert automatisch (zie
[.github/workflows/deploy.yml](.github/workflows/deploy.yml)).

## Wat er nog wacht

- **Google Drive-back-up** — vraagt eenmalig een gratis Google Cloud-project met
  een OAuth-toestemmingsscherm (scope `drive.file`, geen Google-controle nodig).
- **Play Store** — verpakken als TWA met Bubblewrap. Let op: €25 eenmalig, en
  een nieuw persoonlijk ontwikkelaarsaccount moet eerst een gesloten test doen
  met **12 testers, 14 dagen aaneen**. `assetlinks.json` moet op de hoofdmap van
  het domein staan; `tommyvoet.github.io/shelfkeeper/` kan dat niet zelf, dus
  daarvoor is een `tommyvoet.github.io`-repo of een eigen domein nodig.

## Herkomst

Voortgekomen uit [Boekenzoeker](https://github.com/TommyVoet/boekenzoeker), die een Google
Sheet als bron gebruikte. Bewezen onderdelen (accent-ongevoelig zoeken, treffers oplichten,
CSV-lezer, A–Z-balk, dubbeldetectie) zijn overgenomen; nieuw is dat boeken in de app zelf
binnenkomen via scannen en zoeken.
