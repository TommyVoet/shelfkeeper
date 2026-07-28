/**
 * Genereert de PNG-iconen uit public/icon.svg.
 *   node scripts/make-icons.mjs
 * Alleen nodig als het icoon verandert; de PNG's staan in git.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');
const svg = readFileSync(join(pub, 'icon.svg'));

/** Maskable: dezelfde tekening, maar op 76% zodat hij binnen elke masker-vorm valt. */
const maskable = Buffer.from(
  readFileSync(join(pub, 'icon.svg'), 'utf8')
    .replace('<rect width="512" height="512" rx="112" fill="#2f6b52"/>', '<rect width="512" height="512" fill="#2f6b52"/>')
    .replace('<g fill="#f7f5f2">', '<g fill="#f7f5f2" transform="translate(61.44 61.44) scale(0.76)">')
    .replace('<g fill="#2f6b52" opacity="0.55">', '<g fill="#2f6b52" opacity="0.55" transform="translate(61.44 61.44) scale(0.76)">'),
);

const jobs = [
  ['icon-192.png', svg, 192],
  ['icon-512.png', svg, 512],
  ['icon-maskable-512.png', maskable, 512],
  ['apple-touch-icon.png', svg, 180],
];

for (const [name, source, size] of jobs) {
  const png = await sharp(source, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toBuffer();
  writeFileSync(join(pub, name), png);
  console.log(`${name}  ${size}×${size}  ${(png.length / 1024).toFixed(1)} kB`);
}
