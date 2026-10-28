// Serves dist/ under BASE_PATH (e.g. /club_hikawa) the way GitHub Pages does, for the e2e tests.
// Usage: BASE_PATH=/club_hikawa PORT=4400 node scripts/serve-dist.mjs
import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { extname, join, resolve, sep } from 'node:path';

const root = resolve('dist');
const base = (process.env.BASE_PATH || '').replace(/\/$/, '');
const port = Number(process.env.PORT || 4400);
const types = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.mp4': 'video/mp4',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ico': 'image/x-icon', '.txt': 'text/plain',
};

const fileFor = (urlPath) => {
  let p;
  try { p = decodeURIComponent(urlPath); } catch { return null; }
  const file = resolve(join(root, p));
  // Never serve anything outside dist/.
  if (file !== root && !file.startsWith(root + sep)) return null;
  try {
    const st = statSync(file);
    if (st.isDirectory()) return statSync(join(file, 'index.html')).isFile() ? join(file, 'index.html') : null;
    return st.isFile() ? file : null;
  } catch { return null; }
};

createServer((req, res) => {
  const { pathname } = new URL(req.url ?? '/', 'http://localhost');
  if (base && pathname === base) { res.writeHead(301, { Location: base + '/' }).end(); return; }
  if (base && !pathname.startsWith(base + '/')) { res.writeHead(404).end('Not found'); return; }
  const file = fileFor(pathname.slice(base.length));
  if (!file) { res.writeHead(404).end('Not found'); return; }
  res.writeHead(200, { 'Content-Type': types[extname(file)] ?? 'application/octet-stream' });
  createReadStream(file).pipe(res);
}).listen(port, '127.0.0.1', () => console.log(`Serving dist/ at http://127.0.0.1:${port}${base}/`));
