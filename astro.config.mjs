import { defineConfig } from 'astro/config';

// `site` stays unset until the production domain is known (og:image becomes absolute then).
export default defineConfig({
  output: 'static',
  build: { inlineStylesheets: 'auto' },
});
