# Scraper Runner Template

Orchestrator that launches the browser, creates page objects, iterates through pages, collects data, validates with schemas, and writes output.

## Template

```typescript
import { chromium, Browser, Page } from 'playwright';
import { {{PageName}}Page } from '../pages/{{PageName}}Page';
import { {{SchemaName}} } from '../schemas/{{schemaFile}}';
import { writeJson, writeCsv } from '../utils/storage';
import { withRetry } from '../utils/retry';

/**
 * {{SiteName}}Scraper — Orchestrates scraping of {{description}}.
 *
 * Workflow:
 * 1. Launch headless browser
 * 2. Navigate to starting URL
 * 3. Scrape data across pages (with pagination)
 * 4. Validate extracted data against schemas
 * 5. Write validated data to output files
 * 6. Close browser and report results
 */
export class {{SiteName}}Scraper {
  private browser: Browser | null = null;
  private page: Page | null = null;

  private readonly baseUrl: string;
  private readonly maxPages: number;
  private readonly requestDelay: number;
  private readonly headless: boolean;
  private readonly outputDir: string;

  constructor() {
    this.baseUrl = process.env.BASE_URL ?? '{{defaultUrl}}';
    this.maxPages = parseInt(process.env.MAX_PAGES ?? '10');
    this.requestDelay = parseInt(process.env.REQUEST_DELAY ?? '1000');
    this.headless = process.env.HEADLESS !== 'false';
    this.outputDir = process.env.OUTPUT_DIR ?? './data';
  }

  /**
   * Main entry point. Runs the full scraping workflow.
   */
  async run(): Promise<void> {
    console.log(`Starting scrape of ${this.baseUrl}`);
    console.log(`Max pages: ${this.maxPages}, Delay: ${this.requestDelay}ms`);

    try {
      await this.setup();
      const data = await this.scrape();
      const validated = this.validate(data);
      await this.save(validated);
      this.report(data.length, validated.length);
    } catch (error) {
      console.error('Scrape failed:', error);
      if (this.page) {
        await this.page.screenshot({
          path: `screenshots/fatal-error-${Date.now()}.png`,
        });
      }
      throw error;
    } finally {
      await this.teardown();
    }
  }

  /**
   * Launch browser and create page.
   */
  private async setup(): Promise<void> {
    this.browser = await chromium.launch({
      headless: this.headless,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; ScrapeBot/1.0)',
    });

    this.page = await context.newPage();
    this.page.setDefaultTimeout(30000);
  }

  /**
   * Execute the scraping logic.
   */
  private async scrape(): Promise<Array<Record<string, unknown>>> {
    if (!this.page) throw new Error('Browser not initialized');

    const pageObj = new {{PageName}}Page(this.page);

    // Navigate to starting URL with retry
    await withRetry(() => pageObj.navigate(this.baseUrl));

    // Scrape with pagination
    const allData: Array<Record<string, unknown>> = [];
    let currentPage = 1;

    do {
      console.log(`Scraping page ${currentPage}/${this.maxPages}...`);

      const items = await withRetry(() => pageObj.scrape());
      allData.push(...items);

      console.log(`  Found ${items.length} items (total: ${allData.length})`);
      currentPage++;

      // Delay between pages to be respectful
      if (this.requestDelay > 0) {
        await new Promise(r => setTimeout(r, this.requestDelay));
      }
    } while (currentPage <= this.maxPages && (await pageObj.goToNextPage()));

    return allData;
  }

  /**
   * Validate scraped data against schema.
   */
  private validate(
    data: Array<Record<string, unknown>>,
  ): Array<Record<string, unknown>> {
    const validated: Array<Record<string, unknown>> = [];
    let failures = 0;

    for (const item of data) {
      const result = {{SchemaName}}.safeParse(item);
      if (result.success) {
        validated.push(result.data);
      } else {
        failures++;
        console.warn(`Validation failed: ${result.error.issues[0]?.message}`);
      }
    }

    if (failures > 0) {
      console.warn(`${failures}/${data.length} items failed validation`);
    }

    return validated;
  }

  /**
   * Write validated data to output files.
   */
  private async save(data: Array<Record<string, unknown>>): Promise<void> {
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `{{siteName}}-${timestamp}`;

    writeJson(data, filename, this.outputDir);
    writeCsv(data as Record<string, unknown>[], filename, this.outputDir);
  }

  /**
   * Report scraping results.
   */
  private report(total: number, valid: number): void {
    console.log('\n=== SCRAPE COMPLETE ===');
    console.log(`Total extracted: ${total}`);
    console.log(`Valid records:   ${valid}`);
    console.log(`Failed:          ${total - valid}`);
    console.log(`Output:          ${this.outputDir}/`);
  }

  /**
   * Clean up browser resources.
   */
  private async teardown(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
  }
}
```

## Customization Notes

- **Replace `{{placeholders}}`** with actual names: SiteName, PageName, SchemaName, etc.
- **Multiple page types:** If the scraper visits different page types (listing → detail), add multiple page object instances in the `scrape()` method.
- **Output format:** The template writes both JSON and CSV. Remove whichever isn't needed.
- **Error screenshots:** Fatal errors save a timestamped screenshot for debugging.
- **Request delay:** Controlled via `REQUEST_DELAY` environment variable. Default 1000ms.
- **Validation:** The `validate()` method uses Zod's `safeParse` to avoid throwing on invalid records. Remove if `--no-validation` was used during scaffolding.
