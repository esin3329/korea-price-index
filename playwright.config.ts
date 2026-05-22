import { defineConfig, devices } from '@playwright/test';

const devServerCommand =
  process.platform === 'win32'
    ? 'node scripts\\static-server.mjs out 3000'
    : 'node scripts/static-server.mjs out 3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: 'http://127.0.0.1:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PLAYWRIGHT_NO_WEBSERVER
    ? undefined
    : {
        command: devServerCommand,
        url: 'http://127.0.0.1:3000',
        reuseExistingServer: !process.env.CI,
        timeout: 120000,
        gracefulShutdown: { signal: 'SIGTERM', timeout: 500 },
      },
});
