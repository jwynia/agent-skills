# Page Object Template

Site-specific page object with locators, extraction methods, and navigation. Extend this for each page type on the target site.

## Usage

Create one page object per distinct page or view. Define locators in the constructor and data extraction in methods.

## Template

```typescript
import { Page, Locator } from 'playwright';
import { BasePage } from './BasePage';

/**
 * {{PageName}}Page — Scrapes data from {{url}}.
 *
 * Locators target {{description of what's on this page}}.
 * Adjust selectors after running agent-browser snapshot against the live site.
 */
export class {{PageName}}Page extends BasePage {
  // === Locators ===

  /** Container for each data item (card, row, list item) */
  readonly itemCards: Locator;

  /** Individual field locators within each item */
  readonly itemTitle: Locator;
  readonly itemPrice: Locator;
  readonly itemImage: Locator;
  readonly itemLink: Locator;

  // === Pagination (if applicable) ===
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);

    // Item containers — adjust selector for the target site
    this.itemCards = page.locator('[data-testid="item-card"], .item-card, .product-card');

    // Field locators — scoped to page level; use card.locator() in scrape methods
    this.itemTitle = page.locator('[data-testid="item-title"]');
    this.itemPrice = page.locator('[data-testid="item-price"]');
    this.itemImage = page.locator('[data-testid="item-card"] img');
    this.itemLink = page.locator('[data-testid="item-card"] a');

    // Pagination
    this.nextButton = page.locator(
      '[aria-label="Next page"], a[rel="next"], button:has-text("Next")'
    );
  }

  /**
   * Scrape all items from the current page.
   *
   * Returns an array of extracted records. Fields that fail to extract
   * will be null rather than throwing.
   */
  async scrape(): Promise<Array<{{DataType}}>> {
    const items: Array<{{DataType}}> = [];
    const count = await this.itemCards.count();

    for (let i = 0; i < count; i++) {
      const card = this.itemCards.nth(i);

      items.push({
        title: (await card.locator('[data-testid="item-title"]').textContent()) ?? '',
        price: (await card.locator('[data-testid="item-price"]').textContent()) ?? '',
        imageUrl: await card.locator('img').getAttribute('src'),
        url: await card.locator('a').first().getAttribute('href'),
      });
    }

    return items;
  }

  /**
   * Check if there is a next page.
   */
  async hasNextPage(): Promise<boolean> {
    return this.nextButton.isVisible();
  }

  /**
   * Navigate to the next page. Returns false if no next page.
   */
  async goToNextPage(): Promise<boolean> {
    if (!(await this.hasNextPage())) return false;
    await this.nextButton.click();
    await this.waitForPageLoad();
    return true;
  }

  /**
   * Scrape all pages, following pagination until exhausted or limit reached.
   */
  async scrapeAllPages(maxPages = 10): Promise<Array<{{DataType}}>> {
    const allItems: Array<{{DataType}}> = [];
    let currentPage = 1;

    do {
      console.log(`Scraping page ${currentPage}...`);
      const items = await this.scrape();
      allItems.push(...items);
      currentPage++;
    } while (currentPage <= maxPages && (await this.goToNextPage()));

    console.log(`Scraped ${allItems.length} items across ${currentPage - 1} pages`);
    return allItems;
  }
}
```

## Customization Notes

- **Replace `{{PageName}}`** with the actual page class name (e.g., `ProductListing`, `SearchResults`)
- **Replace `{{DataType}}`** with the TypeScript interface for extracted data
- **Replace `{{url}}`** with the target page URL
- **Adjust selectors** after analyzing the actual site with agent-browser or browser DevTools
- **Remove pagination** if the page doesn't paginate
- **Add more fields** by adding locators and extending the `scrape()` return object
- **Scoped extraction:** The `scrape()` method uses `card.locator()` (scoped within each item) rather than page-level locators to avoid cross-item contamination
