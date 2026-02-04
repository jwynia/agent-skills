# PageObject Pattern for Web Scraping

The PageObject pattern, originally designed for test automation, adapts naturally to web scraping. The key difference: in testing, page objects abstract interactions to make assertions; in scraping, page objects abstract element access to extract data.

## Core Concept

Each distinct page (or view) on the target site maps to one TypeScript class. The class encapsulates:

1. **Locators** — How to find elements on the page
2. **Extraction methods** — How to pull data from those elements
3. **Navigation methods** — How to move between pages or states

## BasePage Design

Every page object extends a shared `BasePage` that provides common functionality:

```typescript
import { Page } from 'playwright';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({
      path: `screenshots/${name}.png`,
      fullPage: true,
    });
  }

  async getText(selector: string): Promise<string> {
    const el = this.page.locator(selector);
    return (await el.textContent()) ?? '';
  }

  async getTexts(selector: string): Promise<string[]> {
    const els = this.page.locator(selector);
    return els.allTextContents();
  }

  async getAttribute(selector: string, attr: string): Promise<string | null> {
    return this.page.locator(selector).getAttribute(attr);
  }

  async exists(selector: string): Promise<boolean> {
    return (await this.page.locator(selector).count()) > 0;
  }
}
```

### Design Decisions

- `protected readonly page` — Page objects share the Playwright Page instance but don't expose it publicly
- `networkidle` — Default wait strategy for scraping; ensures dynamic content has loaded
- `screenshot()` — Debug tool; save screenshots on errors to diagnose selector failures
- Helper methods (`getText`, `getTexts`, `getAttribute`) reduce boilerplate in subclasses

## Site-Specific Page Objects

Each page object defines locators as readonly properties in the constructor and provides typed extraction methods:

```typescript
import { Page, Locator } from 'playwright';
import { BasePage } from './BasePage';

interface Product {
  title: string;
  price: string;
  imageUrl: string | null;
  url: string | null;
}

export class ProductListingPage extends BasePage {
  readonly productCards: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productImage: Locator;
  readonly productLink: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('[data-testid="product-card"]');
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productImage = page.locator('[data-testid="product-card"] img');
    this.productLink = page.locator('[data-testid="product-card"] a');
  }

  async scrapeProducts(): Promise<Product[]> {
    const products: Product[] = [];
    const count = await this.productCards.count();

    for (let i = 0; i < count; i++) {
      const card = this.productCards.nth(i);
      products.push({
        title: (await card.locator('[data-testid="product-title"]').textContent()) ?? '',
        price: (await card.locator('[data-testid="product-price"]').textContent()) ?? '',
        imageUrl: await card.locator('img').getAttribute('src'),
        url: await card.locator('a').first().getAttribute('href'),
      });
    }

    return products;
  }
}
```

### Key Rules

1. **Locators in constructor** — Define all locators when the object is created, not in methods
2. **Methods return data** — Scrape methods return typed objects, not void
3. **No assertions** — Page objects extract data; validation happens in schemas
4. **No side effects** — Page objects don't write files or log results

## Component Composition

Reusable UI patterns become component classes that page objects use via composition:

```typescript
export class ProductListingPage extends BasePage {
  readonly pagination: Pagination;
  readonly productCards: Locator;

  constructor(page: Page) {
    super(page);
    this.pagination = new Pagination(page);
    this.productCards = page.locator('.product-card');
  }

  async scrapeAllPages(): Promise<Product[]> {
    const allProducts: Product[] = [];

    do {
      const products = await this.scrapeCurrentPage();
      allProducts.push(...products);
    } while (await this.pagination.hasNextPage() && await this.pagination.goToNext());

    return allProducts;
  }
}
```

Components differ from page objects:
- They don't extend `BasePage`
- They receive a scope (parent locator or full page)
- They model a UI widget, not a full page
- Multiple components can exist on one page

## Page Navigation Patterns

### Single Page → Detail Pattern

When a listing page links to detail pages:

```typescript
async scrapeWithDetails(): Promise<ProductDetail[]> {
  const links = await this.getProductLinks();
  const details: ProductDetail[] = [];

  for (const link of links) {
    await this.navigate(link);
    const detailPage = new ProductDetailPage(this.page);
    details.push(await detailPage.scrapeDetail());
    await this.page.goBack();
    await this.waitForPageLoad();
  }

  return details;
}
```

### Multi-Step Flow Pattern

When scraping requires navigating through multiple distinct pages:

```typescript
class ScraperFlow {
  async run(page: Page): Promise<Result[]> {
    const searchPage = new SearchPage(page);
    await searchPage.navigate('https://example.com/search');
    await searchPage.search('query');

    const resultsPage = new SearchResultsPage(page);
    const items = await resultsPage.scrapeResults();

    return items;
  }
}
```

## Scraping vs Testing: Key Differences

| Aspect | Testing PageObject | Scraping PageObject |
|--------|-------------------|---------------------|
| Purpose | Abstract interactions | Extract data |
| Methods return | void or page objects | Typed data arrays |
| Assertions | In test files | None (use Zod schemas) |
| Wait strategy | Action-specific | `networkidle` for full load |
| Error handling | Fail fast | Retry with backoff |
| Locator count | Only what tests need | Every data element |
| Navigation | Test flow-specific | Exhaustive (all pages) |

## File Organization

```
src/pages/
├── BasePage.ts              # Abstract base
├── ProductListingPage.ts    # One per page type
├── ProductDetailPage.ts
└── SearchResultsPage.ts

src/components/
├── Pagination.ts            # Reusable UI patterns
├── DataTable.ts
└── FilterSidebar.ts
```

## See Also

- `../assets/templates/base-page.ts.md` — BasePage template
- `../assets/templates/page-object.ts.md` — PageObject template
- `../assets/templates/component.ts.md` — Component template
- `playwright-selectors.md` — Selector strategies
