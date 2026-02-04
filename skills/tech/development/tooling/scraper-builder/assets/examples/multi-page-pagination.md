# Example: Multi-Page Pagination Handling

Strategies for handling different pagination patterns found across websites. Covers numbered pagination, "Load More" buttons, infinite scroll, and URL-based pagination.

## Pattern 1: Numbered Pagination (Click-Based)

The most common pattern. A pagination bar with numbered links and Next/Previous buttons.

```typescript
import { Page, Locator } from 'playwright';
import { BasePage } from './BasePage';

export class NumberedPaginationPage extends BasePage {
  readonly pagination: Locator;
  readonly nextButton: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    super(page);
    this.pagination = page.locator('nav[aria-label="pagination"]');
    this.nextButton = page.locator('[aria-label="Next page"], a[rel="next"]');
    this.items = page.locator('.item-card');
  }

  async scrapeAllPages(maxPages = 10): Promise<Array<Record<string, string | null>>> {
    const allItems: Array<Record<string, string | null>> = [];
    let currentPage = 1;

    do {
      const items = await this.scrapeCurrentPage();
      allItems.push(...items);
      console.log(`Page ${currentPage}: ${items.length} items`);
      currentPage++;
    } while (currentPage <= maxPages && (await this.goToNextPage()));

    return allItems;
  }

  private async scrapeCurrentPage(): Promise<Array<Record<string, string | null>>> {
    const items: Array<Record<string, string | null>> = [];
    const count = await this.items.count();

    for (let i = 0; i < count; i++) {
      const card = this.items.nth(i);
      items.push({
        title: (await card.locator('h3').textContent()) ?? '',
        url: await card.locator('a').getAttribute('href'),
      });
    }

    return items;
  }

  private async goToNextPage(): Promise<boolean> {
    if (!(await this.nextButton.isVisible())) return false;

    const isDisabled = await this.nextButton.getAttribute('disabled');
    if (isDisabled !== null) return false;

    await this.nextButton.click();
    await this.waitForPageLoad();
    return true;
  }
}
```

**Key points:**
- Check both visibility and `disabled` attribute before clicking Next
- Use `aria-label="Next page"` or `a[rel="next"]` for resilient selectors
- Wait for `networkidle` after each page transition

## Pattern 2: "Load More" Button

Content stays on one page; clicking a button appends more items.

```typescript
export class LoadMorePage extends BasePage {
  readonly loadMoreButton: Locator;
  readonly items: Locator;

  constructor(page: Page) {
    super(page);
    this.loadMoreButton = page.locator('button:has-text("Load More"), button:has-text("Show More")');
    this.items = page.locator('.item-card');
  }

  async loadAllItems(maxClicks = 20): Promise<void> {
    let clicks = 0;

    while (clicks < maxClicks) {
      const isVisible = await this.loadMoreButton.isVisible();
      if (!isVisible) break;

      const countBefore = await this.items.count();
      await this.loadMoreButton.click();

      // Wait for new items to appear
      await this.page.waitForFunction(
        (prevCount) => {
          return document.querySelectorAll('.item-card').length > prevCount;
        },
        countBefore,
        { timeout: 10000 },
      ).catch(() => {
        console.log('No new items loaded, stopping');
      });

      const countAfter = await this.items.count();
      if (countAfter === countBefore) break; // No new items

      console.log(`Loaded ${countAfter - countBefore} more items (total: ${countAfter})`);
      clicks++;

      // Polite delay
      await new Promise(r => setTimeout(r, 1000));
    }
  }

  async scrapeAll(): Promise<Array<Record<string, string | null>>> {
    await this.loadAllItems();
    return this.scrapeCurrentPage();
  }

  private async scrapeCurrentPage(): Promise<Array<Record<string, string | null>>> {
    const items: Array<Record<string, string | null>> = [];
    const count = await this.items.count();

    for (let i = 0; i < count; i++) {
      const card = this.items.nth(i);
      items.push({
        title: (await card.locator('h3').textContent()) ?? '',
        url: await card.locator('a').getAttribute('href'),
      });
    }

    return items;
  }
}
```

**Key points:**
- Use `waitForFunction` to detect when new items actually appear
- Compare counts before/after to detect when loading is exhausted
- Set a `maxClicks` limit to prevent infinite loops

## Pattern 3: Infinite Scroll

Content loads automatically as the user scrolls down.

```typescript
export class InfiniteScrollPage extends BasePage {
  readonly items: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.locator('.item-card');
    this.loadingSpinner = page.locator('.loading-spinner, [data-loading="true"]');
  }

  async scrollToLoadAll(maxScrolls = 30): Promise<void> {
    let scrolls = 0;
    let previousCount = 0;
    let stableCount = 0; // How many scrolls with no new items

    while (scrolls < maxScrolls && stableCount < 3) {
      const currentCount = await this.items.count();

      if (currentCount === previousCount) {
        stableCount++;
      } else {
        stableCount = 0;
      }

      previousCount = currentCount;
      console.log(`Scroll ${scrolls + 1}: ${currentCount} items`);

      // Scroll to bottom
      await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

      // Wait for loading spinner to appear and disappear
      try {
        await this.loadingSpinner.waitFor({ state: 'visible', timeout: 2000 });
        await this.loadingSpinner.waitFor({ state: 'hidden', timeout: 10000 });
      } catch {
        // Spinner may not appear if content loads instantly
      }

      // Brief wait for DOM to update
      await new Promise(r => setTimeout(r, 500));
      scrolls++;
    }

    console.log(`Scrolling complete: ${await this.items.count()} total items`);
  }

  async scrapeAll(): Promise<Array<Record<string, string | null>>> {
    await this.scrollToLoadAll();
    return this.scrapeVisibleItems();
  }

  private async scrapeVisibleItems(): Promise<Array<Record<string, string | null>>> {
    const items: Array<Record<string, string | null>> = [];
    const count = await this.items.count();

    for (let i = 0; i < count; i++) {
      const card = this.items.nth(i);
      items.push({
        title: (await card.locator('h3').textContent()) ?? '',
        url: await card.locator('a').getAttribute('href'),
      });
    }

    return items;
  }
}
```

**Key points:**
- Track `stableCount` — stop when 3 consecutive scrolls produce no new items
- Watch for a loading spinner to know when content is being fetched
- Use `page.evaluate` to scroll the actual browser window

## Pattern 4: URL-Based Pagination

Pages accessed via URL parameters (e.g., `?page=2`). No clicking needed.

```typescript
export class UrlPaginationPage extends BasePage {
  readonly items: Locator;

  constructor(page: Page) {
    super(page);
    this.items = page.locator('.item-card');
  }

  async scrapeAllPages(
    baseUrl: string,
    maxPages = 10,
  ): Promise<Array<Record<string, string | null>>> {
    const allItems: Array<Record<string, string | null>> = [];

    for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
      const url = `${baseUrl}?page=${pageNum}`;
      console.log(`Fetching ${url}`);

      await this.navigate(url);
      const items = await this.scrapeCurrentPage();

      if (items.length === 0) {
        console.log(`Page ${pageNum} is empty, stopping`);
        break;
      }

      allItems.push(...items);
      console.log(`Page ${pageNum}: ${items.length} items (total: ${allItems.length})`);

      // Polite delay between requests
      await new Promise(r => setTimeout(r, 1000));
    }

    return allItems;
  }

  private async scrapeCurrentPage(): Promise<Array<Record<string, string | null>>> {
    const items: Array<Record<string, string | null>> = [];
    const count = await this.items.count();

    for (let i = 0; i < count; i++) {
      const card = this.items.nth(i);
      items.push({
        title: (await card.locator('h3').textContent()) ?? '',
        url: await card.locator('a').getAttribute('href'),
      });
    }

    return items;
  }
}
```

**Key points:**
- Simplest approach — construct URLs directly, no click interactions
- Detect empty pages to know when to stop
- Works well for API-backed sites with predictable URL patterns

## Choosing a Pagination Strategy

| Signal | Strategy |
|--------|----------|
| Numbered links at bottom of page | Pattern 1: Click-based |
| "Load More" or "Show More" button | Pattern 2: Load More |
| Content appears on scroll, no pagination bar | Pattern 3: Infinite Scroll |
| URL contains `?page=N` or `/page/N` | Pattern 4: URL-based |
| Multiple signals | Prefer URL-based if available; it's most reliable |
