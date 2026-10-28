import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
// A phone's address bar showing or hiding is not a resize worth re-measuring the page for.
ScrollTrigger.config({ ignoreMobileResize: true });

type FrameSet = { path: string; count: number };
type CamKey = [number, number, number, number]; // progress, zoom, centreX, centreY

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const smooth = (u: number) => u * u * (3 - 2 * u);
const pad = (n: number) => String(n).padStart(3, '0');

/**
 * Scroll-scrubbed frame sequence. Everything the visitor sees is a pure function of scroll progress:
 * stop scrolling and it holds, scroll back and it reverses. The only smoothing is a short critically
 * damped catch-up (~70 ms) that always settles on the exact frame for the current scroll position.
 */
export function initSequence(root: HTMLElement) {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const narrow = matchMedia('(max-width: 1100px)');
  const sets = { desktop: JSON.parse(root.dataset.desktop!) as FrameSet, mobile: JSON.parse(root.dataset.mobile!) as FrameSet };
  const cams = JSON.parse(root.dataset.camera!) as { desktop: CamKey[]; mobile: CamKey[] };

  const canvas = root.querySelector<HTMLCanvasElement>('.seq__canvas')!;
  const ctx = canvas.getContext('2d', { alpha: false })!;
  const poster = root.querySelector<HTMLImageElement>('.seq__poster')!;
  const hero = root.querySelector<HTMLElement>('[data-hero]')!;
  const stage = root.querySelector<HTMLElement>('.seq__stage')!;
  const phases = [...root.querySelectorAll<HTMLElement>('.seq__phase')].map((el) => ({ el, from: +el.dataset.from!, to: +el.dataset.to! }));
  const names = [...root.querySelectorAll<HTMLElement>('[data-name]')];
  const end = root.querySelector<HTMLElement>('[data-end]')!;
  const bar = root.querySelector<HTMLElement>('[data-bar]')!;

  let set: FrameSet = sets.desktop;
  let cam: CamKey[] = cams.desktop;
  let frames: (HTMLImageElement | undefined)[] = [];
  let token = 0;
  let trigger: ScrollTrigger | null = null;
  let target = 0, current = 0, last = 0, raf = 0;
  let drawn = -1, dirty = true;

  function load() {
    const my = ++token;
    frames = new Array(set.count);
    drawn = -1;
    // Coarse to fine: every 16th frame first, then fill in, so any scroll position has a near frame early.
    const order: number[] = [];
    const seen = new Set<number>();
    for (let step = 16; step >= 1; step >>= 1) for (let i = 0; i < set.count; i += step) if (!seen.has(i)) { seen.add(i); order.push(i); }
    if (!seen.has(set.count - 1)) order.splice(1, 0, set.count - 1);
    let q = 0, active = 0;
    const pump = () => {
      while (active < 6 && q < order.length) {
        const i = order[q++];
        const img = new Image();
        active++;
        img.src = `${set.path}${pad(i + 1)}.webp`;
        img.decode().then(() => {
          if (my !== token) return;
          frames[i] = img;
          if (Math.abs(i - frameAt(current)) < 3 || drawn < 0) { dirty = true; render(current); }
        }).catch(() => {}).finally(() => { active--; if (my === token) pump(); });
      }
    };
    pump();
  }

  const frameAt = (p: number) => Math.round(clamp01(p) * (set.count - 1));

  function size() {
    if (!trigger) return; // static (reduced-motion) layout: never write scrub styles
    const dpr = Math.min(window.devicePixelRatio || 1, narrow.matches ? 1.5 : 2);
    const w = Math.round(canvas.clientWidth * dpr), h = Math.round(canvas.clientHeight * dpr);
    if (w && h && (canvas.width !== w || canvas.height !== h)) { canvas.width = w; canvas.height = h; dirty = true; render(current); }
  }

  function camAt(p: number) {
    let i = 0;
    while (i < cam.length - 2 && p > cam[i + 1][0]) i++;
    const a = cam[i], b = cam[i + 1], e = smooth(clamp01((p - a[0]) / (b[0] - a[0])));
    return { z: a[1] + (b[1] - a[1]) * e, cx: a[2] + (b[2] - a[2]) * e, cy: a[3] + (b[3] - a[3]) * e };
  }

  function draw(p: number) {
    const f = frameAt(p);
    let img = frames[f];
    if (!img) for (let d = 1; d < set.count && !img; d++) img = frames[f - d] ?? frames[f + d];
    if (!img) return;
    const cw = canvas.width, ch = canvas.height;
    if (!cw || !ch) return;
    const sw = img.naturalWidth, sh = img.naturalHeight, aspect = cw / ch;
    const { z, cx, cy } = camAt(p);
    // Largest crop of the pane's aspect inside the source, then zoomed: a real camera move within the footage.
    const baseW = Math.min(sw, sh * aspect), baseH = baseW / aspect;
    const w = baseW / z, h = baseH / z;
    const x = Math.max(0, Math.min(sw - w, cx * sw - w / 2));
    const y = Math.max(0, Math.min(sh - h, cy * sh - h / 2));
    ctx.drawImage(img, x, y, w, h, 0, 0, cw, ch);
    if (poster.style.visibility !== 'hidden') poster.style.visibility = 'hidden';
  }

  // Write a style only when its value changes: on a slow phone, rewriting the same six captions on
  // every scroll step costs more than drawing the frame itself.
  const written = new WeakMap<HTMLElement, Record<string, string>>();
  const css = (el: HTMLElement, prop: 'opacity' | 'transform' | 'visibility', value: string) => {
    let rec = written.get(el);
    if (!rec) { rec = {}; written.set(el, rec); }
    if (rec[prop] === value) return;
    rec[prop] = value;
    el.style[prop] = value;
  };
  const phaseNames = phases.map((ph) => ph.el.querySelector('.seq__pname')!.textContent!.split('/ ')[1]);
  let lastActive = -2;

  function render(p: number) {
    const f = frameAt(p);
    if (f !== drawn || dirty) { draw(p); drawn = frames[f] ? f : -1; dirty = false; }

    // Hero copy leaves as the throw begins, and returns when scrolling back to the top.
    const q = clamp01((p - 0.008) / 0.045);
    css(hero, 'opacity', (1 - q).toFixed(3));
    css(hero, 'transform', `translate3d(0, ${(-q * 48).toFixed(1)}px, 0)`);
    css(hero, 'visibility', q >= 1 ? 'hidden' : '');

    let active = -1;
    phases.forEach((ph, i) => {
      const from = i === 0 ? 0.05 : ph.from, to = ph.to;
      const fade = 0.022;
      let o = 0, ty = 20;
      if (p >= from && p <= to) {
        const fin = clamp01((p - from) / fade), fout = i === phases.length - 1 ? clamp01((0.9 - p) / fade) : clamp01((to - p) / fade);
        o = Math.min(fin, fout);
        ty = fin < 1 ? (1 - fin) * 20 : fout < 1 ? -(1 - fout) * 20 : 0;
      }
      if (p >= ph.from && p < (i === phases.length - 1 ? 1.01 : ph.to)) active = i;
      css(ph.el, 'opacity', o.toFixed(3));
      css(ph.el, 'transform', `translate3d(0, ${ty.toFixed(1)}px, 0)`);
      css(ph.el, 'visibility', o > 0 ? 'visible' : 'hidden');
    });
    if (active !== lastActive) {
      lastActive = active;
      names.forEach((n, i) => { n.classList.toggle('is-on', i === active); n.classList.toggle('is-done', i < active); });
    }

    // Gone before the next section slides over it, so nothing ever sits on top of this line.
    const eo = Math.min(clamp01((p - 0.9) / 0.02), clamp01((0.995 - p) / 0.02));
    css(end, 'opacity', eo.toFixed(3));
    css(end, 'visibility', eo > 0 ? 'visible' : 'hidden');
    css(end, 'transform', `translate3d(0, ${((1 - eo) * 16).toFixed(1)}px, 0)`);

    css(bar, 'transform', `scaleX(${p.toFixed(4)})`);

    root.dataset.progress = p.toFixed(4);
    root.dataset.frame = String(f + 1);
    root.dataset.phase = active >= 0 ? phaseNames[active] : '';
  }

  function tick(now: number) {
    const dt = Math.min(64, now - (last || now));
    last = now;
    const d = target - current;
    current = Math.abs(d) < 0.0004 ? target : current + d * (1 - Math.exp(-dt / 70));
    render(current);
    raf = current === target ? 0 : requestAnimationFrame(tick);
  }
  function setTarget(p: number) {
    target = p;
    if (!raf) { last = 0; raf = requestAnimationFrame(tick); }
  }

  function enable() {
    if (trigger) return;
    root.classList.add('is-scrub');
    set = narrow.matches ? sets.mobile : sets.desktop;
    cam = narrow.matches ? cams.mobile : cams.desktop;
    // While the intro plays, leave the main thread to it: the first frame is already on screen as the
    // poster, and the sequence starts downloading the moment the curtain lifts.
    if (document.documentElement.classList.contains('is-loading')) window.addEventListener('hk:intro-done', () => load(), { once: true });
    else load();
    trigger = ScrollTrigger.create({
      // Scrub ends one stage before the section does: that last stage is the next section sliding over.
      // Measured on the stage (a fixed lvh), never innerHeight, which changes as a phone's bar moves.
      trigger: root, start: 'top top', end: () => `+=${root.offsetHeight - 2 * stage.offsetHeight}`, invalidateOnRefresh: true,
      onUpdate: (s) => setTarget(s.progress),
      onRefresh: (s) => { size(); setTarget(s.progress); },
    });
    current = target = trigger.progress;
    size();
    render(current);
  }
  function disable() {
    trigger?.kill(); trigger = null; token++;
    cancelAnimationFrame(raf); raf = 0;
    root.classList.remove('is-scrub');
    [hero, end, ...phases.map((p) => p.el)].forEach((el) => { el.removeAttribute('style'); written.delete(el); });
    poster.style.visibility = '';
    ScrollTrigger.refresh();
  }

  new ResizeObserver(() => size()).observe(canvas);
  narrow.addEventListener('change', () => {
    if (!trigger) return;
    set = narrow.matches ? sets.mobile : sets.desktop;
    cam = narrow.matches ? cams.mobile : cams.desktop;
    load();
  });
  reduced.addEventListener('change', () => (reduced.matches ? disable() : enable()));
  document.fonts?.ready.then(() => ScrollTrigger.refresh());

  if (!reduced.matches) enable();
}
