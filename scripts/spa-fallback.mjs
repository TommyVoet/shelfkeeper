/**
 * GitHub Pages kent geen herschrijfregels: een diepe link als /book/abc geeft
 * een 404 bij het eerste bezoek. Pages serveert dan 404.html — dat is hier
 * dezelfde app-schil, dus de router pikt het pad alsnog op.
 */
import { copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const dist = join(dirname(fileURLToPath(import.meta.url)), '..', 'dist');
copyFileSync(join(dist, 'index.html'), join(dist, '404.html'));
console.log('404.html geschreven (app-schil voor diepe links)');
