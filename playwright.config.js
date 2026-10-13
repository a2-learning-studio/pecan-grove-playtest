const { defineConfig, devices } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests/e2e', timeout: 45000, expect: { timeout: 10000 },
  fullyParallel: true, forbidOnly: !!process.env.CI, retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',
  use: { baseURL: 'http://127.0.0.1:8890', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: [
    { command: 'python -B -m http.server 8890 --bind 127.0.0.1 --directory dist', url: 'http://127.0.0.1:8890', reuseExistingServer: !process.env.CI, timeout: 30000 },
    { command: 'python -B -m http.server 8892 --bind 127.0.0.1 --directory dist-family', url: 'http://127.0.0.1:8892', reuseExistingServer: !process.env.CI, timeout: 30000 }
  ],
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit', use: { ...devices['Desktop Safari'] } },
    { name: 'pixel', use: { ...devices['Pixel 7'] } },
    { name: 'iphone', use: { ...devices['iPhone 14'] } }
  ]
});
