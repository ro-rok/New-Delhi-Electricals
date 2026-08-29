import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests', timeout: 30_000, fullyParallel: false,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium' },
  webServer: { command: 'node scripts/serve-prerendered.js', url: 'http://127.0.0.1:4173', reuseExistingServer: true },
});
