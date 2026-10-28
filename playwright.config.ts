import { defineConfig, devices } from '@playwright/test';

// The tests run against a production build served under the same sub-path as GitHub Pages,
// so a path that forgets withBase() fails here before it fails live.
export const BASE_PATH = '/club_hikawa';
const PORT = 4400;

export default defineConfig({
  testDir: 'tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
    trace: 'retain-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'mobile', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'npm run build && node scripts/serve-dist.mjs',
    url: `http://127.0.0.1:${PORT}${BASE_PATH}/`,
    env: { BASE_PATH, PORT: String(PORT), SITE_URL: 'https://donatonicolasayalaosorio73.github.io' },
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
