import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: 0,
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'tests/report' }]],
  use: {
    baseURL: 'http://192.168.0.14:5173',
    headless: false,          // hiện browser để nhìn thấy trực tiếp
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',         // chụp ảnh sau mỗi test
    video: 'retain-on-failure',
    locale: 'vi-VN',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  outputDir: 'tests/results',
});
