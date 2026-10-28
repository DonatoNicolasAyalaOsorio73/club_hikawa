import { defineConfig } from 'astro/config';

// SITE_URL and BASE_PATH come from the GitHub Pages workflow (actions/configure-pages), so the same
// build works under /club_hikawa today and at the root of a custom domain later. Locally both are unset.
export default defineConfig({
  site: process.env.SITE_URL || undefined,
  base: process.env.BASE_PATH || '/',
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
