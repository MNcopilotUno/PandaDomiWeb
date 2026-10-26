// A tiny static server for site/, mounted under /PandaDomiWeb/ exactly like
// GitHub Pages serves it, so relative paths are tested as deployed.
// Listens on 127.0.0.1 only.
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../site/', import.meta.url));
const base = '/PandaDomiWeb/';
const port = Number(process.env.PORT ?? 4173);
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.xml': 'application/atom+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url ?? '/', 'http://x').pathname);
  if (path === '/' || path === base.slice(0, -1)) {
    res.writeHead(302, { location: base }).end();
    return;
  }
  if (!path.startsWith(base)) {
    res.writeHead(404).end('Not found');
    return;
  }
  let file = normalize(join(root, path.slice(base.length)));
  if (!file.startsWith(root.endsWith(sep) ? root : root + sep) && file !== root) {
    res.writeHead(403).end('Forbidden');
    return;
  }
  try {
    if ((await stat(file)).isDirectory()) file = join(file, 'index.html');
    const body = await readFile(file);
    res.writeHead(200, { 'content-type': types[extname(file)] ?? 'application/octet-stream' }).end(body);
  } catch (err) {
    if (err.code !== 'ENOENT') console.error(`serve: ${file}: ${err.message}`);
    res.writeHead(404).end('Not found');
  }
}).listen(port, '127.0.0.1', () => {
  console.log(`Serving site/ at http://127.0.0.1:${port}${base}`);
});
