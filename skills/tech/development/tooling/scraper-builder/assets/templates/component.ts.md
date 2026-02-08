# Component Templates

Reusable UI components that page objects compose. Each component models a single UI pattern (pagination, data table, filter sidebar) and can be used across multiple page objects.

## Pagination Component

```typescript
import { Page, Locator } from 'playwright';

/**
 * Pagination component for navigating through paged results.
 *
 * Handles multiple pagination patterns:
 * - Numbered page links
 * - Next/Previous buttons
 * - aria-label based navigation
 */
export class Pagination {
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly currentPage: Locator;
  readonly pageLinks: Locator;

  constructor(
    private page: Page,
    scope?: Locator,
  ) {
    const root = scope ?? page;

    this.nextButton = root.locator(
      '[aria-label="Next page"], a[rel="next"], .pagination-next, button:has-text("Next")'
    );
    this.prevButton = root.locator(
      '[aria-label="Previous page"], a[rel="prev"], .pagination-prev, button:has-text("Previous")'
    );
    this.currentPage = root.locator(
      '[aria-current="page"], .pagination .active, .current-page'
    );
    this.pageLinks = root.locator(
      '.pagination a, .page-numbers a, nav[aria-label="pagination"] a'
    );
  }

  async hasNextPage(): Promise<boolean> {
    return this.nextButton.isVisible();
  }

  async hasPrevPage(): Promise<boolean> {
    return this.prevButton.isVisible();
  }

  async goToNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async goToPrev(): Promise<void> {
    await this.prevButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentPageNumber(): Promise<number> {
    const text = await this.currentPage.textContent();
    return parseInt(text ?? '1', 10);
  }

  async getTotalPages(): Promise<number> {
    const links = await this.pageLinks.allTextContents();
    const numbers = links
      .map(t => parseInt(t.trim(), 10))
      .filter(n => !isNaN(n));
    return numbers.length > 0 ? Math.max(...numbers) : 1;
  }
}
```

## DataTable Component

```typescript
import { Page, Locator } from 'playwright';

/**
 * DataTable component for extracting tabular data.
 *
 * Handles standard HTML tables with thead/tbody structure.
 */
export class DataTable {
  readonly table: Locator;
  readonly headerCells: Locator;
  readonly bodyRows: Locator;

  constructor(
    private page: Page,
    tableSelector: string,
  ) {
    this.table = page.locator(tableSelector);
    this.headerCells = this.table.locator('thead th, thead td');
    this.bodyRows = this.table.locator('tbody tr');
  }

  /**
   * Get column headers as an array of strings.
   */
  async getHeaders(): Promise<string[]> {
    return this.headerCells.allTextContents();
  }

  /**
   * Get the number of data rows (excluding header).
   */
  async getRowCount(): Promise<number> {
    return this.bodyRows.count();
  }

  /**
   * Get a specific cell value by row and column index.
   */
  async getCellValue(row: number, col: number): Promise<string> {
    const cell = this.bodyRows.nth(row).locator('td').nth(col);
    return (await cell.textContent()) ?? '';
  }

  /**
   * Extract all rows as arrays of strings.
   */
  async extractRows(): Promise<string[][]> {
    const rows: string[][] = [];
    const rowCount = await this.getRowCount();

    for (let i = 0; i < rowCount; i++) {
      const cells = this.bodyRows.nth(i).locator('td');
      const cellTexts = await cells.allTextContents();
      rows.push(cellTexts);
    }

    return rows;
  }

  /**
   * Extract all rows as objects using headers as keys.
   */
  async extractAsObjects(): Promise<Record<string, string>[]> {
    const headers = await this.getHeaders();
    const rows = await this.extractRows();

    return rows.map(row => {
      const obj: Record<string, string> = {};
      headers.forEach((header, i) => {
        obj[header.trim()] = (row[i] ?? '').trim();
      });
      return obj;
    });
  }
}
```

## Customization Notes

### Pagination
- **Selector fallbacks:** The component uses comma-separated selectors to match common patterns. Narrow these down once you know the target site's structure.
- **Scope parameter:** Pass a parent `Locator` to scope pagination within a specific section (e.g., bottom pagination vs. top pagination).
- **Infinite scroll:** For infinite scroll pages, replace `goToNext()` with a scroll-based approach.

### DataTable
- **Non-standard tables:** Some sites use `div`-based tables. Adjust selectors from `thead/tbody/tr/td` to the site's custom structure.
- **Sortable tables:** Add a `sortBy(column: string)` method that clicks header cells.
- **Cell links:** Extend `extractRows()` to capture `href` attributes from linked cells.
