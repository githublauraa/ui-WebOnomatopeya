import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e-real',
  fullyParallel: false,
  workers: 1,
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report-real', open: 'never' }]
  ],
  outputDir: 'test-results-real',
  use: {
    baseURL: 'http://127.0.0.1:4203',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [{ name: 'chrome-real', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }]
});
