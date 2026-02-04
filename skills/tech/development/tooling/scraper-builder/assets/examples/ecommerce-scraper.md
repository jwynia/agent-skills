# Example: E-Commerce Product Scraper

Complete walkthrough of building a multi-page product scraper for an online store. Demonstrates the full PageObject pattern with pagination, data validation, and Docker deployment.

## Scenario

Target: An online electronics store with paginated product listings. Each product has a title, price, rating, and detail page link.

## Project Structure

```
shop-scraper/
├── src/
│   ├── pages/
│   │   ├── BasePage.ts
│   │   └── ProductListingPage.ts
│   ├── components/
│   │   └── Pagination.ts
│   ├── schemas/
│   │   └── product.schema.ts
│   ├── utils/
│   │   ├── browser.ts
│   │   ├── retry.ts
│   │   └── storage.ts
│   ├── scrapers/
│   │   └── ShopScraper.ts
│   └── index.ts
├── data/
├── screenshots/
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── .env.example
```

## Step 1: Define the Data Schema

```typescript
// src/schemas/product.schema.ts
import { z } from 'zod';

export const ProductSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  price: z
    .string()
    .transform(val => parseFloat(val.replace(/[^0-9.]/g, '')))
    .pipe(z.number().positive()),
  rating: z
    .string()
    .transform(val => parseFloat(val))
    .pipe(z.number().min(0).max(5))
    .optional(),
  url: z.string().min(1),
  imageUrl: z.string().url().nullable(),
});

export type Product = z.infer<typeof ProductSchema>;
```

## Step 2: Build the Page Object

```typescript
// src/pages/ProductListingPage.ts
import { Page, Locator } from 'playwright';
import { BasePage } from './BasePage';
import { Pagination } from '../components/Pagination';

export class ProductListingPage extends BasePage {
  readonly productCards: Locator;
  readonly pagination: Pagination;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('.product-card');
    this.pagination = new Pagination(page);
  }

  async scrape(): Promise<Array<Record<string, string | null>>> {
    const items: Array<Record<string, string | null>> = [];
    const count = await this.productCards.count();

    for (let i = 0; i < count; i++) {
      const card = this.productCards.nth(i);

      try {
        items.push({
          title: (await card.locator('.product-title').textContent()) ?? '',
          price: (await card.locator('.product-price').textContent()) ?? '',
          rating: await card.locator('.star-rating').getAttribute('data-rating'),
          url: await card.locator('a.product-link').getAttribute('href'),
          imageUrl: await card.locator('img').getAttribute('src'),
        });
      } catch (error) {
        console.warn(`Failed to scrape product ${i}: ${error}`);
        await this.screenshot(`error-product-${i}`);
      }
    }

    return items;
  }

  async goToNextPage(): Promise<boolean> {
    if (!(await this.pagination.hasNextPage())) return false;
    await this.pagination.goToNext();
    return true;
  }
}
```

## Step 3: Build the Scraper Runner

```typescript
// src/scrapers/ShopScraper.ts
import { chromium } from 'playwright';
import { ProductListingPage } from '../pages/ProductListingPage';
import { ProductSchema } from '../schemas/product.schema';
import { writeJson, writeCsv } from '../utils/storage';
import { withRetry } from '../utils/retry';

export class ShopScraper {
  private readonly baseUrl = process.env.BASE_URL ?? 'https://shop.example.com';
  private readonly maxPages = parseInt(process.env.MAX_PAGES ?? '10');
  private readonly requestDelay = parseInt(process.env.REQUEST_DELAY ?? '1000');

  async run(): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      const listing = new ProductListingPage(page);
      await withRetry(() => listing.navigate(`${this.baseUrl}/products`));

      const allProducts: Array<Record<string, string | null>> = [];
      let currentPage = 1;

      do {
        console.log(`Scraping page ${currentPage}...`);
        const products = await listing.scrape();
        allProducts.push(...products);
        currentPage++;

        await new Promise(r => setTimeout(r, this.requestDelay));
      } while (currentPage <= this.maxPages && (await listing.goToNextPage()));

      // Validate
      const validated = allProducts
        .map(p => ProductSchema.safeParse(p))
        .filter(r => r.success)
        .map(r => r.data);

      console.log(`Validated ${validated.length}/${allProducts.length} products`);

      // Write output
      const timestamp = new Date().toISOString().split('T')[0];
      writeJson(validated, `products-${timestamp}`);
      writeCsv(validated, `products-${timestamp}`);
    } finally {
      await browser.close();
    }
  }
}
```

## Step 4: Entry Point

```typescript
// src/index.ts
import { ShopScraper } from './scrapers/ShopScraper';
import 'dotenv/config';

async function main() {
  console.log('Starting shop scraper...');
  const scraper = new ShopScraper();
  await scraper.run();
  console.log('Done.');
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
```

## Step 5: Run

```bash
# Local development
npm run dev

# With custom URL
BASE_URL=https://actual-shop.com npm run scrape

# Docker
docker compose up --build

# Docker with custom config
BASE_URL=https://actual-shop.com MAX_PAGES=50 docker compose up
```

## Output

```
Starting shop scraper...
Scraping page 1...
Scraping page 2...
Scraping page 3...
Validated 72/75 products
Wrote 72 records to data/products-2026-02-04.json
Wrote 72 records to data/products-2026-02-04.csv
Done.
```

## Key Patterns Demonstrated

1. **PageObject encapsulation** — `ProductListingPage` owns all selectors and extraction logic
2. **Component composition** — `Pagination` is a separate reusable component
3. **Schema validation** — `ProductSchema` catches 3 invalid records out of 75
4. **Error resilience** — Individual product failures don't abort the entire scrape
5. **Configurable behavior** — All parameters via environment variables
6. **Docker-ready** — Same code runs locally and in containers
