// Extracts a WebP frame sequence from a video using the locally installed Chromium-based browser
// (Edge or Chrome) over the DevTools protocol. No ffmpeg or other binary download needed.
//
// Usage:
//   node scripts/extract-frames.mjs --src media-src/6254569.mp4 --out public/frames/desktop \
//     --count 120 --start 0 --end 4.8 --width 960 --quality 0.72
//   node scripts/extract-frames.mjs --src media-src/6254569.mp4 --probe
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { createReadStream, existsSync, mkdirSync, writeFileSync, statSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : true]);
    return acc;
  }, []),
);
const src = resolve(args.src ?? 'media-src/6254569.mp4');
if (!existsSync(src)) throw new Error(`Video not found: ${src}`);

const BROWSERS = [
  process.env.BROWSER_BIN,
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium',
].filter(Boolean);
const bin = BROWSERS.find((p) => existsSync(p));
if (!bin) throw new Error('No Chromium-based browser found; set BROWSER_BIN.');

const server = createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'content-type': 'text/html' });
    res.end('<!doctype html><video id="v" src="/v.mp4" muted playsinline preload="auto"></video><canvas id="c"></canvas>');
    return;
  }
  const size = statSync(src).size;
  const range = /bytes=(\d+)-(\d*)/.exec(req.headers.range ?? '');
  if (range) {
    const start = +range[1], end = range[2] ? +range[2] : size - 1;
    res.writeHead(206, { 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'content-range': `bytes ${start}-${end}/${size}`, 'content-length': end - start + 1 });
    createReadStream(src, { start, end }).pipe(res);
  } else {
    res.writeHead(200, { 'content-type': 'video/mp4', 'accept-ranges': 'bytes', 'content-length': size });
    createReadStream(src).pipe(res);
  }
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const origin = `http://127.0.0.1:${server.address().port}`;

const profile = join(tmpdir(), `hk-frames-${process.pid}`);
const port = 9300 + (process.pid % 500);
const browser = spawn(bin, ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--autoplay-policy=no-user-gesture-required', 'about:blank'], { stdio: 'ignore' });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let target;
for (let i = 0; i < 50 && !target; i++) {
  await sleep(200);
  try { target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page'); } catch {}
}
if (!target) throw new Error('Browser did not expose a DevTools target.');

const ws = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((r) => ws.addEventListener('open', r, { once: true }));
let seq = 0;
const pending = new Map();
ws.addEventListener('message', (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
const send = (method, params = {}) => new Promise((r) => { const id = ++seq; pending.set(id, r); ws.send(JSON.stringify({ id, method, params })); });
const evaluate = async (expression) => {
  const r = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails));
  return r.result.result.value;
};

try {
  await send('Page.navigate', { url: origin + '/' });
  const meta = await evaluate(`new Promise((ok, no) => { const v = document.getElementById('v');
    const done = () => ok({ duration: v.duration, width: v.videoWidth, height: v.videoHeight });
    if (v.readyState >= 1) done(); else { v.onloadedmetadata = done; v.onerror = () => no('video error ' + (v.error && v.error.code)); } })`);
  console.log(`source: ${meta.width}x${meta.height}, ${meta.duration.toFixed(2)}s`);
  if (args.probe) process.exit(0);

  if (args.sheet) {
    // One labelled contact sheet of N evenly spaced frames, for checking phase timings by eye.
    const n = +args.sheet, cols = 8, w = 200, h = Math.round(meta.height * w / meta.width);
    const t0 = +(args.start ?? 0), t1 = Math.min(+(args.end ?? meta.duration), meta.duration - 0.05);
    const dataUrl = await evaluate(`(async () => { const v = document.getElementById('v'), c = document.getElementById('c');
      const rows = Math.ceil(${n} / ${cols}); c.width = ${cols * w}; c.height = rows * (${h} + 22); const x = c.getContext('2d');
      x.fillStyle = '#111'; x.fillRect(0, 0, c.width, c.height); x.font = '15px sans-serif';
      for (let i = 0; i < ${n}; i++) { const t = ${t0} + i / (${n} - 1) * (${t1} - ${t0});
        await new Promise((ok) => { v.onseeked = ok; v.currentTime = t; });
        const cx = (i % ${cols}) * ${w}, cy = Math.floor(i / ${cols}) * (${h} + 22);
        x.drawImage(v, cx, cy, ${w}, ${h}); x.fillStyle = '#fff'; x.fillText((i + 1) + '  t=' + t.toFixed(2) + 's', cx + 4, cy + ${h} + 16); }
      return c.toDataURL('image/jpeg', 0.8); })()`);
    const file = resolve(args.out ?? 'sheet.jpg');
    writeFileSync(file, Buffer.from(dataUrl.split(',')[1], 'base64'));
    console.log(`sheet → ${file}`);
    process.exit(0);
  }

  // --segments "0-4.4:104,4.5-7.1:10,7.2-8.88:22" samples each time range with its own density,
  // so the scroll spends its length on the throw and passes quickly over the ground hold.
  const end = Math.min(+(args.end ?? meta.duration), meta.duration - 0.05);
  const segments = String(args.segments ?? `${args.start ?? 0}-${end}:${args.count ?? 120}`).split(',').map((s) => {
    const [range, n] = s.split(':'); const [a, b] = range.split('-').map(Number);
    return { a, b: Math.min(b, meta.duration - 0.05), n: +n };
  });
  const times = segments.flatMap(({ a, b, n }) => Array.from({ length: n }, (_, i) => a + (n === 1 ? 0 : (i / (n - 1)) * (b - a))));
  const count = times.length;
  const width = +(args.width ?? 960), quality = +(args.quality ?? 0.72);
  const out = resolve(args.out ?? 'public/frames/desktop');
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  let bytes = 0;
  for (let i = 0; i < count; i++) {
    const t = times[i];
    const dataUrl = await evaluate(`new Promise((ok) => { const v = document.getElementById('v'), c = document.getElementById('c');
      v.onseeked = () => { const w = ${width}, h = Math.round(v.videoHeight * w / v.videoWidth); c.width = w; c.height = h;
        const x = c.getContext('2d'); x.filter = '${args.filter ?? 'grayscale(1)'}'; x.drawImage(v, 0, 0, w, h); ok(c.toDataURL('image/webp', ${quality})); };
      v.currentTime = ${t.toFixed(4)}; })`);
    const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
    bytes += buf.length;
    writeFileSync(join(out, `f${String(i + 1).padStart(3, '0')}.webp`), buf);
  }
  console.log(`${count} frames → ${out} (${(bytes / 1048576).toFixed(2)} MB, ${(bytes / count / 1024).toFixed(0)} KB avg)`);
} finally {
  ws.close();
  browser.kill();
  server.close();
  await sleep(300);
  try { rmSync(profile, { recursive: true, force: true }); } catch {}
}
