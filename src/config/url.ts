// Root-relative paths in the site assume it is served from "/". On GitHub Pages it lives under
// "/club_hikawa", so every internal link and asset goes through withBase().
export const base = import.meta.env.BASE_URL.replace(/\/$/, '');
export const withBase = (path: string) => base + path;
