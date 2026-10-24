import { defineConfig, devices } from '@playwright/test';

// Tests run against the files exactly as deployed (site/), served under the
// same /PandaDomiWeb/ path GitHub Pages uses.
export default defineConfig({
  testDir: 'tests',
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: process.env.CI ? [['list'], ['github']] : 'list',
  use: { baseURL: 'http://127.0.0.1:4173/PandaDomiWeb/' },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
    { name: 'phone', use: { ...devices['Pixel 7'] } },
  ],
  webServer: {
    command: 'node scripts/serve.mjs',
    url: 'http://127.0.0.1:4173/PandaDomiWeb/',
    reuseExistingServer: !process.env.CI,
  },
});
