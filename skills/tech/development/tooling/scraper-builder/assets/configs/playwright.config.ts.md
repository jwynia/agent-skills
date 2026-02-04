# Playwright Configuration Template

Scraper-focused Playwright configuration. This differs from test-focused configs — it optimizes for data extraction rather than test assertions.

## Template

```typescript
/**
 * Playwright configuration for scraping.
 *
 * This config is used when running Playwright as a library (not as a test runner).
 * Import these settings in your browser utility module.
 *
 * Note: This is NOT a @playwright/test config. Scrapers use the `playwright`
 * package directly, not the test runner.
 */

export const playwrightConfig = {
  /** Browser launch options */
  launch: {
    headless: process.env.HEADLESS !== 'false',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
  },

  /** Browser context options */
  context: {
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1920, height: 1080 },
    locale: 'en-US',
    timezoneId: 'America/New_York',
  },

  /** Navigation defaults */
  navigation: {
    timeout: 30000,
    waitUntil: 'networkidle' as const,
  },

  /** Scraping behavior */
  scraping: {
    /** Delay between page navigations (ms) */
    requestDelay: parseInt(process.env.REQUEST_DELAY ?? '1000'),
    /** Maximum pages to scrape in a single run */
    maxPages: parseInt(process.env.MAX_PAGES ?? '10'),
    /** Maximum retry attempts per page */
    maxRetries: 3,
    /** Base delay for exponential backoff (ms) */
    retryBaseDelay: 1000,
  },

  /** Output configuration */
  output: {
    dataDir: process.env.OUTPUT_DIR ?? './data',
    screenshotDir: './screenshots',
    formats: ['json', 'csv'] as const,
  },
};
```

## Usage in Code

```typescript
import { chromium } from 'playwright';
import { playwrightConfig } from '../playwright.config';

const browser = await chromium.launch(playwrightConfig.launch);
const context = await browser.newContext(playwrightConfig.context);
const page = await context.newPage();
page.setDefaultTimeout(playwrightConfig.navigation.timeout);
```

## Customization Notes

- **Not a test config:** This is a plain TypeScript module exporting configuration objects, not a `@playwright/test` config file. Scrapers don't use the test runner.
- **User agent:** The default mimics a standard Chrome browser. Adjust for the target site's expectations.
- **Viewport:** Set to 1920x1080 to ensure desktop layouts render fully. Some sites show different content at smaller viewports.
- **Request delay:** Controls politeness. Increase for sensitive sites, decrease for sites you control.
- **Docker compatibility:** The `--disable-dev-shm-usage` and `--no-sandbox` flags are required for Docker environments.

## See Also

- `../../references/docker-setup.md` — Docker-specific Playwright configuration
- `../../references/playwright-selectors.md` — Selector strategies
