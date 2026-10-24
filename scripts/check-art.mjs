// Fails if the art or fonts in site/ drifted from art/assets.json, or if the page
// references a file that is not there or ships a file it never uses.
// Run `python3 scripts/sync-art.py` to bring site/ back in line with the game.
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, existsSync } from 'node:fs';

const registry = JSON.parse(readFileSync('art/assets.json', 'utf8'));
const listed = Object.keys(registry.files);
const problems = [];

if (!registry.source.commit) problems.push('art/assets.json has no source commit: run the sync');
for (const [file, sha] of Object.entries(registry.files)) {
  if (!existsSync(file)) {
    problems.push(`missing: ${file}`);
    continue;
  }
  const actual = createHash('sha256').update(readFileSync(file)).digest('hex');
  if (actual !== sha) problems.push(`changed since the sync: ${file}`);
}
for (const dir of ['site/art', 'site/fonts']) {
  for (const name of readdirSync(dir)) {
    if (!listed.includes(`${dir}/${name}`)) problems.push(`not from the game: ${dir}/${name}`);
  }
}

const page = readFileSync('site/index.html', 'utf8') + readFileSync('site/styles.css', 'utf8');
const used = new Set([...page.matchAll(/(?:art|fonts)\/[\w.-]+\.(?:webp|woff2)/g)].map((m) => `site/${m[0]}`));
for (const file of used) if (!listed.includes(file)) problems.push(`referenced but not shipped: ${file}`);
for (const file of listed) {
  if (/\.(webp|woff2)$/.test(file) && !used.has(file)) problems.push(`shipped but never used: ${file}`);
}

if (problems.length) {
  console.error(problems.join('\n'));
  process.exit(1);
}
console.log(`${listed.length} files match ${registry.source.repo}@${registry.source.commit.slice(0, 7)}.`);
