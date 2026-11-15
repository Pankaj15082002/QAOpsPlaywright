// @ts-check
import { defineConfig, devices } from '@playwright/test';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',
  reporter: [['html', { open: 'always' }]],

  use: {
    headless: false,
    browserName: 'chromium',
    args: ['--start-maximized'],
     launchOptions: {
    slowMo: 500,
    

  },
   screenshot: 'on',
  video: 'on',
  },
});