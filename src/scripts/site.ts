// Page-wide behaviour: header state, mobile menu, in-page links, reveals, looping clips.
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

/* Header turns solid once the page leaves the top. */
const header = document.querySelector<HTMLElement>('[data-header]')!;
const onScrollHeader = () => header.classList.toggle('is-solid', window.scrollY > 40);
window.addEventListener('scroll', onScrollHeader, { passive: true });
onScrollHeader();

/* Mobile menu: locks the page, closes on Esc and on any link. */
const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]')!;
const menu = document.querySelector<HTMLElement>('[data-menu]')!;
const setMenu = (open: boolean) => {
  menu.classList.toggle('is-open', open);
  menu.setAttribute('aria-hidden', String(!open));
  menu.inert = !open;
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
  document.documentElement.classList.toggle('menu-open', open);
  document.body.style.overflow = open ? 'hidden' : '';
  if (open) menu.querySelector<HTMLElement>('a')?.focus();
};
menu.inert = true;
toggle.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
menu.querySelectorAll('[data-menu-link]').forEach((a) => a.addEventListener('click', () => setMenu(false)));
window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('is-open')) { setMenu(false); toggle.focus(); } });

/* In-page links scroll smoothly (instant under reduced motion), landing below the fixed header. */
document.addEventListener('click', (e) => {
  const a = (e.target as Element).closest<HTMLAnchorElement>('a[href*="#"]');
  if (!a || !a.hash || a.pathname !== location.pathname || a.origin !== location.origin) return;
  const target = document.getElementById(a.hash.slice(1));
  if (!target) return;
  e.preventDefault();
  const top = target.getBoundingClientRect().top + window.scrollY - (target.closest('[data-seq]') ? 0 : (parseFloat(getComputedStyle(target).scrollMarginTop) || header.offsetHeight));
  window.scrollTo({ top, behavior: reduced.matches ? 'auto' : 'smooth' });
  history.pushState(null, '', a.hash);
  if (target.tabIndex < 0 && !target.matches('a,button,input,select,textarea')) target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
});

/* Reveal once, as each element reaches the lower 12% of the viewport. */
const io = new IntersectionObserver((entries) => {
  for (const e of entries) if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
}, { rootMargin: '0px 0px -12% 0px', threshold: 0.1 });
document.querySelectorAll('[data-reveal]').forEach((el) => io.observe(el));

/* Looping clips play only while visible, and never under reduced motion. */
const loopIO = new IntersectionObserver((entries) => entries.forEach((e) => {
  const v = e.target as HTMLVideoElement;
  if (e.isIntersecting && !reduced.matches) { v.preload = 'auto'; v.play().catch(() => {}); } else v.pause();
}), { rootMargin: '160px' });
document.querySelectorAll<HTMLVideoElement>('video[data-loop]').forEach((v) => { v.muted = true; loopIO.observe(v); });

/* Where am I: the nav link of the section in view is marked (home page sections only). */
const spyLinks = [...document.querySelectorAll<HTMLAnchorElement>('a[data-spy]')].filter((a) => a.hash && a.pathname === location.pathname);
const spyTargets = [...new Set(spyLinks.map((a) => a.hash.slice(1)))].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
if (spyTargets.length) {
  const mark = (id: string) => spyLinks.forEach((a) => (a.hash.slice(1) === id ? a.setAttribute('aria-current', 'location') : a.removeAttribute('aria-current')));
  const spy = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) mark((e.target as HTMLElement).id); });
  }, { rootMargin: '-45% 0px -54% 0px' });
  spyTargets.forEach((t) => spy.observe(t));
}

/* Back to top: shown after the first screen. */
const toTop = document.querySelector<HTMLButtonElement>('[data-totop]');
if (toTop) {
  const sync = () => toTop.classList.toggle('is-on', window.scrollY > window.innerHeight * 0.9);
  window.addEventListener('scroll', sync, { passive: true });
  sync();
  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: reduced.matches ? 'auto' : 'smooth' });
    document.querySelector<HTMLElement>('.hdr__brand')?.focus({ preventScroll: true });
  });
}
