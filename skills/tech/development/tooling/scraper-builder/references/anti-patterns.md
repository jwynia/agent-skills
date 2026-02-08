# Anti-Pattern Catalog

Extended catalog of common web scraping mistakes, why they fail, and how to fix them.

## 1. Monolith Scraper

**Pattern:** All scraping logic in a single file — navigation, extraction, validation, and output all mixed together.

**Why it fails:**
- Impossible to reuse extraction logic for different pages
- One change to a selector requires reading the entire file
- Cannot test components in isolation
- Quickly exceeds 500+ lines and becomes unmaintainable

**Fix:** Split into PageObject classes (one per page), component classes (for reusable UI patterns), schemas (for validation), and a runner (for orchestration).

```
# Before (monolith)
scraper.ts (800 lines)

# After (structured)
src/pages/BasePage.ts
src/pages/ProductListingPage.ts
src/pages/ProductDetailPage.ts
src/components/Pagination.ts
src/schemas/product.schema.ts
src/scrapers/ShopScraper.ts
```

## 2. Sleep Waiter

**Pattern:** Using `setTimeout`, `page.waitForTimeout()`, or fixed delays instead of event-based waiting.

**Why it fails:**
- Too short: Element not loaded yet, extraction fails silently with empty strings
- Too long: Wastes time on every page load, scraper runs 5-10x slower than necessary
- Unreliable: Network conditions vary; what works locally breaks in Docker on slow networks

**Fix:** Use Playwright's built-in auto-wait and explicit wait conditions:

```typescript
// Bad
await page.waitForTimeout(3000);

// Good — wait for network to be idle
await page.waitForLoadState('networkidle');

// Good — wait for specific element
await page.locator('.product-card').first().waitFor({ state: 'visible' });

// Good — wait for specific network response
await page.waitForResponse(resp => resp.url().includes('/api/products'));
```

## 3. Unvalidated Pipeline

**Pattern:** Extracting data and writing it directly to output without schema validation.

**Why it fails:**
- Selector drift (site changed markup) produces null/empty fields silently
- Malformed data propagates downstream causing failures in data consumers
- No way to detect partial failures (some fields extracted, others missed)
- Debugging requires comparing raw output against expected shape

**Fix:** Validate every record with a Zod schema before writing:

```typescript
import { z } from 'zod';

const ProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z.number().positive('Price must be positive'),
  url: z.string().url('Must be a valid URL'),
});

// In scraper:
const raw = await page.scrapeProducts();
const validated = raw.map(item => {
  const result = ProductSchema.safeParse(item);
  if (!result.success) {
    console.warn(`Validation failed: ${result.error.message}`);
    return null;
  }
  return result.data;
}).filter(Boolean);
```

## 4. Selector Lottery

**Pattern:** Using fragile, position-dependent, or auto-generated selectors.

**Why it fails:**
- `div > div > div > span` breaks when any ancestor changes
- `.css-1a2b3c` (CSS-in-JS hash) changes on every build
- `nth-child(3)` breaks when items are reordered
- XPath like `/html/body/div[2]/main/div[1]` breaks on any structural change

**Fix:** Follow the selector resilience hierarchy:

```typescript
// Bad — fragile positional selector
page.locator('div.container > div:nth-child(2) > span')

// Bad — CSS-in-JS hash
page.locator('.css-1a2b3c')

// Good — data attribute
page.locator('[data-testid="product-title"]')

// Good — semantic + aria
page.locator('[role="heading"][aria-level="2"]')

// Good — stable class name
page.locator('.product-card .product-title')
```

See `playwright-selectors.md` for the full priority hierarchy.

## 5. Silent Failure

**Pattern:** Catching errors and continuing without logging, screenshots, or metrics.

**Why it fails:**
- Scraper appears to succeed but returns empty or partial data
- No indication of which pages or items failed
- Cannot distinguish between "no data on page" and "selector broken"
- Hours of scraping wasted with no diagnostic information

**Fix:** Log failures, save debug screenshots, and track success metrics:

```typescript
try {
  const title = await card.locator('.title').textContent();
  if (!title) throw new Error('Empty title');
  return title;
} catch (error) {
  console.error(`Failed to extract title for item ${index}: ${error}`);
  await this.page.screenshot({
    path: `screenshots/error-item-${index}-${Date.now()}.png`,
  });
  return null; // Return null, don't swallow silently
}

// After scraping, report metrics
console.log(`Scraped ${results.length} items, ${failures} failures`);
```

## 6. Unthrottled Crawler

**Pattern:** Making requests as fast as possible without delays between pages.

**Why it fails:**
- Gets IP blocked or rate-limited by the target site
- Triggers anti-bot protection (CAPTCHA, WAF blocks)
- Can overwhelm small sites, causing actual harm
- Results in inconsistent scraping (some pages blocked, others succeed)

**Fix:** Add configurable delays between requests:

```typescript
const REQUEST_DELAY = parseInt(process.env.REQUEST_DELAY ?? '1000');

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Between page navigations:
for (const url of urls) {
  await this.navigate(url);
  const data = await this.scrape();
  results.push(...data);
  await delay(REQUEST_DELAY);
}
```

## 7. Hardcoded Configuration

**Pattern:** Embedding URLs, selectors, page limits, and output paths as string literals in code.

**Why it fails:**
- Cannot run against different environments (staging vs production)
- Cannot adjust behavior without code changes
- Docker deployments require rebuilding images for config changes
- Team members with different setups cannot share the same code

**Fix:** Use environment variables with sensible defaults:

```typescript
const config = {
  baseUrl: process.env.BASE_URL ?? 'https://example.com',
  maxPages: parseInt(process.env.MAX_PAGES ?? '10'),
  requestDelay: parseInt(process.env.REQUEST_DELAY ?? '1000'),
  outputDir: process.env.OUTPUT_DIR ?? './data',
  headless: process.env.HEADLESS !== 'false',
};
```

## 8. No Retry Logic

**Pattern:** Making a single attempt per request and treating any failure as fatal.

**Why it fails:**
- Transient network errors abort the entire scrape
- Occasional timeouts lose hours of accumulated data
- Rate-limit responses (429) could be waited out but instead cause failure

**Fix:** Implement exponential backoff with configurable limits:

```typescript
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000);
      console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  throw new Error('Unreachable');
}
```

## Quick Reference

| Anti-Pattern | Detection Signal | Fix |
|--------------|-----------------|-----|
| Monolith Scraper | Single file > 300 lines | Split into PageObject + Runner |
| Sleep Waiter | `waitForTimeout` calls | Use `waitForLoadState` / `waitFor` |
| Unvalidated Pipeline | No Zod/schema imports | Add schema per data type |
| Selector Lottery | CSS-in-JS hashes, deep nesting | Use resilient selector hierarchy |
| Silent Failure | Empty catch blocks | Log + screenshot + metrics |
| Unthrottled Crawler | No delay between requests | Add configurable `REQUEST_DELAY` |
| Hardcoded Config | String literals for URLs | Use environment variables |
| No Retry Logic | Single attempt per request | Exponential backoff wrapper |

## See Also

- `../SKILL.md` — Anti-patterns quick reference table
- `playwright-selectors.md` — Selector resilience strategies
- `pageobject-pattern.md` — Proper code structure
