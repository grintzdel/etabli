import { defineConfig, devices } from '@playwright/test'

const envTest = new URL('../../.env.test', import.meta.url)

try {
  process.loadEnvFile(envTest)
} catch {
  throw new Error(`Missing ${envTest.pathname}. Run \`pnpm db:test:up\` first.`)
}

const apiPort = process.env.PORT ?? '3001'

export default defineConfig({
  testDir: './src',
  globalSetup: './src/e2e/global-setup.ts',
  testMatch: '**/*.test.e2e.ts',
  timeout: 30_000,
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL ?? 'http://localhost:3000',
    locale: 'fr-FR',
    timezoneId: 'Europe/Paris',
    trace: 'on-first-retry',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: [
    {
      command: process.env.CI ? 'pnpm --filter @etabli/api run start:test' : 'pnpm --filter @etabli/api run dev:test',
      url: `http://localhost:${apiPort}/health`,
      // Never reuse: a running `pnpm dev` on this port is wired to Neon, and
      // reusing it would silently run the suite against the development database.
      reuseExistingServer: false,
      timeout: 60_000,
    },
    {
      command: process.env.CI ? 'pnpm run start' : 'pnpm run dev',
      url: 'http://localhost:3000',
      env: { API_URL: process.env.API_URL ?? `http://localhost:${apiPort}` },
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
})
