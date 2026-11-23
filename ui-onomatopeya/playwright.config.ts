import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:4203',
    trace: 'retain-on-failure'
  },
  webServer: {
    command: 'npm start -- --port 4203',
    url: 'http://localhost:4203/login',
    reuseExistingServer: true,
    timeout: 120_000
  },
  projects: [{ name: 'chrome', use: { ...devices['Desktop Chrome'], channel: 'chrome' } }]
});
