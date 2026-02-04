---
name: scraper-builder
description: "Guide AI agents to generate complete PageObject pattern web scraper projects using Playwright and TypeScript with Docker deployment. Supports agent-browser site analysis for automated selector discovery. Keywords: scraper, playwright, pageobject, web scraping, docker, typescript, data extraction, automation."
license: MIT
compatibility: Requires Deno for generator scripts. Generated projects use Node.js with Playwright.
metadata:
  author: agent-skills
  version: "1.0"
  domain: development
  type: generator
  mode: generative
---

# Scraper Builder

Generate complete, runnable web scraper projects using the PageObject pattern with Playwright and TypeScript. This skill produces site-specific scrapers with typed data extraction, Docker deployment, and optional agent-browser integration for automated site analysis.

## When to Use This Skill

Use this skill when:
- Building a site-specific web scraper for data extraction
- Generating PageObject classes for a target website
- Scaffolding a complete scraper project with Docker support
- Using agent-browser to analyze a site and auto-generate selectors
- Creating reusable scraping components (pagination, data tables)

Do NOT use this skill when:
- Building API clients (use HTTP client libraries directly)
- Writing QA/E2E test suites (use Playwright test runner with test-focused patterns)
- Mass crawling or spidering entire domains (use Crawlee or Scrapy)
- Scraping sites that require authentication bypass or CAPTCHA solving

## Core Principles

### 1. PageObject Encapsulation

Each page on the target site maps to one PageObject class. Locators are defined in the constructor, and scraping logic lives in methods. Page objects never contain assertions or business logic — they extract and return data.

### 2. Selector Resilience

Prefer selectors in this order: `data-testid` > `id` > semantic HTML (`role`, `aria-label`) > structured CSS classes > text content. Avoid positional selectors (`nth-child`) and layout-dependent paths. See `references/playwright-selectors.md` for the full hierarchy.

### 3. Composition Over Inheritance

Reusable UI patterns (pagination, data tables, search bars) are modeled as component classes that page objects compose via properties. Only `BasePage` uses inheritance — everything else composes.

### 4. Typed Data Extraction

All scraped data flows through Zod schemas for validation. This catches selector drift (when a site changes its markup) at extraction time rather than downstream. See `assets/templates/data-schema.ts.md`.

### 5. Docker-First Deployment

Generated projects include a Dockerfile using Microsoft's official Playwright images and a docker-compose.yml with volume mounts for output data and debug screenshots. This ensures consistent browser environments across machines.

## Generation Modes

### Mode 1: Agent-Browser Analysis

Use `agent-browser` to navigate the target site, capture accessibility tree snapshots, and automatically discover selectors. This is the preferred mode when the agent has access to the agent-browser CLI.

**Prerequisites:** If `agent-browser` is not already installed, add it as a skill first:

```bash
npx skills add vercel-labs/agent-browser
```

**Workflow:**

```bash
# 1. Open the target page
agent-browser open https://example.com/products

# 2. Capture interactive snapshot with element references
agent-browser snapshot -i --json > snapshot.json

# 3. Capture scoped sections for focused analysis
agent-browser snapshot -i --json -s "main" > main-content.json
agent-browser snapshot -i --json -s "nav" > navigation.json

# 4. Test dynamic behavior (pagination, load-more)
agent-browser click @e3
agent-browser wait --load networkidle
agent-browser snapshot -i --json > after-click.json

# 5. Close when done
agent-browser close
```

**What the agent does with snapshots:**

1. Parse element references (`@e1`, `@e2`, etc.) and their roles
2. Group elements by semantic purpose (navigation, data display, forms, actions)
3. Map data elements to fields (title, price, image, etc.)
4. Generate PageObject classes with discovered selectors
5. Identify pagination and dynamic loading patterns

See `references/agent-browser-workflow.md` for the complete workflow reference.

### Mode 2: Manual Description

The user describes the target site's page structure and the agent maps it to page objects. The agent asks structured questions:

1. **What pages to scrape?** — List of URLs or page types
2. **What data to extract?** — Field names and expected types per page
3. **How is data paginated?** — Numbered pages, load-more, infinite scroll, or single page
4. **What selectors are known?** — Any CSS selectors, data-testid values, or XPath the user already knows

The agent then:
- Matches the description to a site archetype from `data/site-archetypes.json`
- Proposes a page object map with class names and responsibilities
- Generates code after the user confirms the plan

### Mode 3: Full Project Scaffold

Generate a complete runnable project in one operation using the scaffolder script:

```bash
deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts \
  --name "my-scraper" \
  --url "https://example.com" \
  --pages "ProductListing,ProductDetail" \
  --fields "title,price,image_url,description"
```

This produces a project with all source files, configuration, Docker setup, and an entry point ready to run. See the Scripts Reference section for full options.

## Quick Reference

| Category | Approach | Details |
|----------|----------|---------|
| Framework | Playwright | `playwright` package, not `@playwright/test` |
| Language | TypeScript | Strict mode, ES2022 target |
| Pattern | PageObject | One class per page, compose components |
| Selectors | Resilient | data-testid > id > role > CSS class > text |
| Wait strategy | Auto-wait | Playwright built-in, plus `networkidle` for navigation |
| Validation | Zod | Schema per page object's output type |
| Output | JSON + CSV | Configurable via storage utility |
| Docker | Official image | `mcr.microsoft.com/playwright:v1.48.0-jammy` |
| Retry | Exponential backoff | 3 attempts default, configurable |
| Screenshots | On error | Saved to `screenshots/` for debugging |

## Generation Process

Follow this sequence when generating a scraper:

### Step 1: Gather Requirements

Ask the user for:
- Target site URL(s)
- Data fields to extract
- Number of pages/items expected
- Output format preference (JSON, CSV, both)
- Whether Docker deployment is needed

### Step 2: Analyze the Site

Use Mode 1 (agent-browser) or Mode 2 (manual description) to understand:
- Page structure and navigation flow
- Data element locations and selector strategies
- Pagination or infinite scroll patterns
- Dynamic content loading behavior

### Step 3: Design the Page Object Map

Create a plan listing:
- Each PageObject class and its URL pattern
- Component classes needed (Pagination, DataTable, etc.)
- Data schema fields and types per page
- The scraper's navigation flow between pages

### Step 4: Present the Plan

Show the user the page object map before generating code. Include class names, field names, and the execution flow. Wait for confirmation.

### Step 5: Generate Code

Use the templates in `assets/templates/` as the foundation:
- `base-page.ts.md` — BasePage abstract class
- `page-object.ts.md` — Site-specific page object
- `component.ts.md` — Reusable components
- `scraper-runner.ts.md` — Orchestrator
- `data-schema.ts.md` — Zod validation schemas

### Step 6: Deliver

Provide the complete project with:
- All source files
- Configuration files from `assets/configs/`
- A README explaining how to run it
- Docker setup (unless explicitly excluded)

## Code Patterns

### BasePage

Abstract class providing `navigate()`, `waitForPageLoad()`, `screenshot()`, and `getText()` helpers. All page objects extend this.

```typescript
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  async navigate(url: string): Promise<void> { /* ... */ }
  async screenshot(name: string): Promise<void> { /* ... */ }
}
```

See: `assets/templates/base-page.ts.md`

### PageObject

Site-specific class with locators as readonly properties, scrape methods returning typed data, and navigation methods for multi-page flows.

```typescript
export class ProductListingPage extends BasePage {
  readonly productCards: Locator;
  readonly nextButton: Locator;
  async scrapeProducts(): Promise<Product[]> { /* ... */ }
  async goToNextPage(): Promise<boolean> { /* ... */ }
}
```

See: `assets/templates/page-object.ts.md`

### Component

Reusable UI pattern (Pagination, DataTable) that receives a parent locator scope and provides extraction methods.

```typescript
export class Pagination {
  constructor(private page: Page, private scope: Locator) {}
  async hasNextPage(): Promise<boolean> { /* ... */ }
  async goToNext(): Promise<void> { /* ... */ }
}
```

See: `assets/templates/component.ts.md`

### ScraperRunner

Orchestrator that launches the browser, creates page objects, iterates through pages, collects data, validates with schemas, and writes output.

```typescript
export class SiteScraper {
  async run(): Promise<void> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    // navigate, scrape, validate, write
  }
}
```

See: `assets/templates/scraper-runner.ts.md`

### DataSchema

Zod schemas that validate scraped records, catching selector drift and malformed data at extraction time.

```typescript
export const ProductSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
});
```

See: `assets/templates/data-schema.ts.md`

## Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Monolith Scraper | All scraping logic in one file | Split into PageObject classes per page |
| Sleep Waiter | Using `setTimeout`/fixed delays | Use Playwright auto-wait and `networkidle` |
| Unvalidated Pipeline | No schema validation on output | Add Zod schemas for every data type |
| Selector Lottery | Fragile positional selectors | Use resilient selector hierarchy |
| Silent Failure | Swallowing errors without logging | Log failures and save debug screenshots |
| Unthrottled Crawler | No delay between requests | Add configurable request delays |
| Hardcoded Config | URLs and selectors in code | Use environment variables and config files |
| No Retry Logic | Single attempt per request | Implement exponential backoff |

See `references/anti-patterns.md` for the extended catalog with examples and fixes.

## Scripts Reference

### scaffold-scraper-project.ts

Generate a complete scraper project:

```bash
deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts [options]

Options:
  --name <name>       Project name (required)
  --path <path>       Target directory (default: ./)
  --url <url>         Target site base URL
  --pages <pages>     Comma-separated page names (e.g., ProductListing,ProductDetail)
  --fields <fields>   Comma-separated data fields (e.g., title,price,rating)
  --no-docker         Skip Docker setup
  --no-validation     Skip Zod validation setup
  --json              Output as JSON
  -h, --help          Show help

Examples:
  # Scaffold a product scraper
  deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts \
    --name "shop-scraper" --url "https://shop.example.com" \
    --pages "ProductListing,ProductDetail" --fields "title,price,image_url"

  # Minimal scraper without Docker
  deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts \
    --name "blog-scraper" --no-docker
```

### generate-page-object.ts

Generate a single PageObject class for an existing project:

```bash
deno run --allow-read --allow-write scripts/generate-page-object.ts [options]

Options:
  --name <name>           Class name (required)
  --url <url>             Page URL (for documentation comment)
  --fields <fields>       Comma-separated data fields
  --selectors <json>      JSON map of field to selector
  --with-pagination       Include pagination methods
  --output <path>         Output file path (default: stdout)
  --json                  Output as JSON
  -h, --help              Show help

Examples:
  # Generate a page object with known selectors
  deno run --allow-read --allow-write scripts/generate-page-object.ts \
    --name "ProductListing" --url "https://shop.example.com/products" \
    --fields "title,price,rating" \
    --selectors '{"title":".product-title","price":".product-price","rating":".star-rating"}' \
    --with-pagination --output src/pages/ProductListingPage.ts

  # Quick generation to stdout
  deno run --allow-read scripts/generate-page-object.ts \
    --name "SearchResults" --fields "title,url,snippet"
```

## Templates & References

### Templates (assets/templates/)

| Template | Purpose |
|----------|---------|
| `base-page.ts.md` | Abstract BasePage with navigation, screenshots, text helpers |
| `page-object.ts.md` | Site-specific page object with locators and scrape methods |
| `component.ts.md` | Reusable components: Pagination, DataTable |
| `scraper-runner.ts.md` | Orchestrator: browser launch, iteration, collection, output |
| `data-schema.ts.md` | Zod schemas for scraped data validation |

### Configs (assets/configs/)

| Config | Purpose |
|--------|---------|
| `dockerfile.md` | Multi-stage Dockerfile using official Playwright image |
| `docker-compose.yml.md` | Service with data/screenshots volume mounts |
| `tsconfig.json.md` | Strict TypeScript with ES2022 target |
| `package.json.md` | playwright, zod, tsx dependencies |
| `playwright.config.ts.md` | Scraper-focused Playwright configuration |

### References (references/)

| Reference | Purpose |
|-----------|---------|
| `pageobject-pattern.md` | PageObject pattern adapted for scraping |
| `playwright-selectors.md` | Selector strategies and resilience hierarchy |
| `docker-setup.md` | Docker configuration and deployment |
| `agent-browser-workflow.md` | Agent-browser analysis workflow |
| `anti-patterns.md` | Extended anti-pattern catalog |

### Examples (assets/examples/)

| Example | Purpose |
|---------|---------|
| `ecommerce-scraper.md` | Complete multi-page product scraper walkthrough |
| `multi-page-pagination.md` | Pagination handling strategies |

### Data Files (data/)

| File | Purpose |
|------|---------|
| `selector-patterns.json` | Common selectors organized by UI element type |
| `site-archetypes.json` | Website structure archetypes with typical pages and fields |

## Example Interaction

**User:** "I need a scraper for an online bookstore. I want to get book titles, authors, prices, and ratings from the catalog pages."

**Agent workflow:**

1. Checks `site-archetypes.json` — matches `ecommerce` archetype
2. Proposes page object map:
   - `BookListingPage` — catalog with pagination
   - `BookDetailPage` — individual book page (if detail scraping needed)
   - `Pagination` component — shared pagination handler
3. Presents the plan with field mapping:
   - `title` → `[itemprop="name"]` or `.book-title`
   - `author` → `[itemprop="author"]` or `.book-author`
   - `price` → `[itemprop="price"]` or `.price`
   - `rating` → `.star-rating` or `[data-rating]`
4. After confirmation, generates using the scaffold script or manual code generation
5. Delivers project with Docker setup and Zod schemas for `Book` type

## Integration

This skill connects to:
- **typescript-best-practices** — TypeScript coding patterns used in generated code
- **devcontainer** — Development container setup for the generated project
- **agent-browser** — Site analysis and selector discovery (external tool)

## What You Do NOT Do

This skill does NOT:
- Bypass authentication or login walls
- Solve CAPTCHAs or bot detection
- Generate JavaScript-only output (always TypeScript)
- Produce crawlers that spider entire domains
- Create scrapers that violate robots.txt
- Handle rate-limited APIs (use HTTP clients for API work)
- Generate test suites (use Playwright test patterns for QA)
