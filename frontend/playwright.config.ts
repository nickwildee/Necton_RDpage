import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: 'http://127.0.0.1:8765',
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command:
        'python ../backend/manage.py run_e2e_server --settings=config.e2e_settings',
      env: {
        DB_ENGINE: 'sqlite',
      },
      name: 'Django',
      reuseExistingServer: false,
      stderr: 'pipe',
      stdout: 'pipe',
      timeout: 120_000,
      url: 'http://127.0.0.1:8766/api/auth/me/',
    },
    {
      command:
        'npm run dev -- --host 127.0.0.1 --port 8765 --strictPort',
      env: {
        VITE_API_PROXY_TARGET: 'http://127.0.0.1:8766',
      },
      name: 'Vite',
      reuseExistingServer: false,
      stderr: 'pipe',
      stdout: 'pipe',
      timeout: 120_000,
      url: 'http://127.0.0.1:8765/login',
    },
  ],
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
})
