import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 45_000,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'test-results/seo-hydration-results.json' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    screenshot: 'off',
  },
  webServer: {
    command: 'node scripts/serve-prerendered.js',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
    timeout: 15_000,
  },
});
