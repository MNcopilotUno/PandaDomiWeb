// Writes every illustration to site/art/<id>.svg.
// Usage: node art/build.mjs           build all
//        node art/build.mjs --check   fail if site/art is out of date
import { writeFileSync, readFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { svg } from './lib.mjs';
import { assets } from './scenes.mjs';

const out = join(dirname(fileURLToPath(import.meta.url)), '..', 'site', 'art');
const check = process.argv.includes('--check');
const stale = [];

mkdirSync(out, { recursive: true });
for (const [id, draw] of Object.entries(assets)) {
  const a = draw();
  const text = a.raw
    ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${a.w} ${a.h}" width="${a.w}" height="${a.h}" aria-hidden="true">\n${a.body}\n</svg>\n`
    : svg(a.w, a.h, a.body, { seed: a.seed });
  const file = join(out, `${id}.svg`);
  if (check) {
    if (!existsSync(file) || readFileSync(file, 'utf8') !== text) stale.push(id);
  } else {
    writeFileSync(file, text);
    console.log(`${id}.svg  ${a.w}x${a.h}  ${(text.length / 1024).toFixed(1)} KB`);
  }
}
if (check) {
  if (stale.length) {
    console.error(`Out of date, run pnpm art: ${stale.join(', ')}`);
    process.exit(1);
  }
  console.log(`${Object.keys(assets).length} illustrations up to date.`);
}
