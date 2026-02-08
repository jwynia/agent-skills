# BasePage Template

Abstract base class for all page objects. Provides navigation, waiting, screenshot, and text extraction utilities.

## Usage

Every page object in a scraper project extends `BasePage`. Do not instantiate it directly.

## Template

```typescript
import { Page } from 'playwright';

/**
 * Abstract base class for all page objects.
 *
 * Provides common navigation, waiting, and extraction methods.
 * All site-specific page objects extend this class.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /**
   * Navigate to a URL and wait for the page to stabilize.
   */
  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  /**
   * Wait for the current page to finish loading.
   * Use after interactions that trigger navigation or content updates.
   */
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Save a full-page screenshot for debugging.
   * Screenshots are saved to the screenshots/ directory.
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  /**
   * Extract text content from a single element.
   * Returns empty string if element not found.
   */
  async getText(selector: string): Promise<string> {
    const el = this.page.locator(selector);
    return (await el.textContent()) ?? '';
  }

  /**
   * Extract text content from all matching elements.
   */
  async getTexts(selector: string): Promise<string[]> {
    return this.page.locator(selector).allTextContents();
  }

  /**
   * Get an attribute value from a single element.
   */
  async getAttribute(selector: string, attr: string): Promise<string | null> {
    return this.page.locator(selector).getAttribute(attr);
  }

  /**
   * Check whether an element exists on the page.
   */
  async exists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }

  /**
   * Get the current page URL.
   */
  get currentUrl(): string {
    return this.page.url();
  }
}
```

## Customization Notes

- **Wait strategy:** `networkidle` works for most server-rendered sites. For SPAs with streaming data, consider `domcontentloaded` plus explicit element waits.
- **Screenshot path:** Adjust the `screenshots/` prefix if your project uses a different directory structure.
- **Additional helpers:** Add methods like `getNumber()`, `getHref()`, or `getImageSrc()` if multiple page objects need them.
