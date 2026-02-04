# Playwright Selector Strategies

Selector choice is the most critical factor in scraper reliability. A fragile selector breaks on every site update; a resilient selector survives layout changes, redesigns, and A/B tests.

## Selector Priority Hierarchy

Use selectors in this order, from most to least resilient:

### 1. Data Attributes (Most Resilient)

```typescript
page.locator('[data-testid="product-card"]')
page.locator('[data-product-id="123"]')
page.locator('[data-automation="price"]')
```

**Why:** Data attributes exist specifically for programmatic access. They survive CSS refactors, class name changes, and layout updates. Sites that use them rarely remove them.

### 2. ID Selectors

```typescript
page.locator('#product-list')
page.locator('#search-results')
```

**Why:** IDs are unique per page and typically stable. Avoid IDs that look auto-generated (e.g., `#a3f7b2`).

### 3. Semantic HTML and ARIA

```typescript
page.locator('nav[aria-label="main"]')
page.locator('[role="search"]')
page.locator('[aria-label="Next page"]')
page.locator('article')
```

**Why:** Semantic attributes reflect the page's structure and purpose. They change less often than visual styles.

### 4. Structured CSS Classes

```typescript
page.locator('.product-card')
page.locator('.search-results__item')
```

**Why:** Meaningful class names (BEM, component-based) are reasonably stable. Avoid utility classes like `.mt-4` or `.flex`.

### 5. Playwright Text Selectors

```typescript
page.locator('button:has-text("Add to Cart")')
page.locator('a:has-text("Next")')
page.getByText('View Details')
```

**Why:** Text content is stable when the site's language doesn't change. Useful for buttons and links. Fragile for internationalized sites.

### 6. Playwright Role Selectors

```typescript
page.getByRole('button', { name: 'Submit' })
page.getByRole('heading', { level: 2 })
page.getByRole('link', { name: 'Products' })
```

**Why:** Combines ARIA roles with accessible names. More resilient than raw CSS but may match multiple elements.

### 7. CSS Combinators (Use with Caution)

```typescript
page.locator('.product-card h2')
page.locator('.results > .item')
```

**Why:** Depends on DOM structure. Breaks when nesting changes.

### 8. Positional Selectors (Least Resilient)

```typescript
page.locator('.item').nth(0)
page.locator('tr:nth-child(2) td:nth-child(3)')
```

**Why:** Depends on element order. Breaks when items are reordered, added, or removed. Only use when iterating a known collection.

## Playwright-Specific Selector Engines

### Built-in Locator Methods

```typescript
// Preferred API — more readable and type-safe
page.getByRole('button', { name: 'Submit' })
page.getByText('Product Title')
page.getByLabel('Search')
page.getByPlaceholder('Enter search term')
page.getByAltText('Product image')
page.getByTitle('Close dialog')
page.getByTestId('product-card')  // matches data-testid by default
```

### Chaining Locators

```typescript
// Scope a locator within another
const card = page.locator('.product-card').nth(i);
const title = card.locator('h2');
const price = card.locator('.price');
```

### Filtering

```typescript
// Filter by text
page.locator('.product-card').filter({ hasText: 'Sale' })

// Filter by child locator
page.locator('.product-card').filter({
  has: page.locator('.discount-badge'),
})
```

## Resilience Strategies

### 1. Multiple Selector Fallback

When you're unsure which selector will work, use comma-separated CSS:

```typescript
page.locator('[data-testid="next"], [aria-label="Next page"], a.next-page')
```

Playwright matches the first visible element from any of these selectors.

### 2. Schema-Driven Validation

Don't trust selectors blindly. Validate extracted data:

```typescript
const price = await card.locator('.price').textContent();
const parsed = parseFloat(price?.replace(/[^0-9.]/g, '') ?? '');
if (isNaN(parsed)) {
  console.warn(`Invalid price for item ${i}: "${price}"`);
}
```

### 3. Conditional Selectors

Handle sites that use different markup for different states:

```typescript
async getPrice(card: Locator): Promise<string> {
  const salePrice = card.locator('.sale-price');
  if (await salePrice.count() > 0) {
    return (await salePrice.textContent()) ?? '';
  }
  return (await card.locator('.regular-price').textContent()) ?? '';
}
```

### 4. Wait for Stability

Ensure elements are fully rendered before extracting:

```typescript
await page.waitForLoadState('networkidle');
await page.locator('.product-card').first().waitFor({ state: 'visible' });
```

## Debugging Selectors

### Playwright Inspector

During development, use headed mode to see what selectors match:

```typescript
const browser = await chromium.launch({ headless: false });
```

### Count Check

Verify your selector matches the expected number of elements:

```typescript
const count = await page.locator('.product-card').count();
console.log(`Found ${count} product cards`);
```

### Screenshot on Failure

Save a screenshot whenever extraction fails:

```typescript
try {
  const title = await card.locator('.title').textContent();
  if (!title) throw new Error('No title found');
} catch (error) {
  await page.screenshot({ path: `screenshots/error-${Date.now()}.png` });
  throw error;
}
```

## Common Selector Patterns by Element Type

See `../data/selector-patterns.json` for a comprehensive mapping of UI element types to common selectors, organized by:

- Product cards
- Pagination controls
- Data tables
- Search inputs
- Navigation menus
- Form elements

## See Also

- `pageobject-pattern.md` — How selectors fit into page objects
- `agent-browser-workflow.md` — Automated selector discovery
- `anti-patterns.md` — Selector anti-patterns to avoid
