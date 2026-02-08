#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Page Object Generator
 *
 * Generates a Playwright PageObject class file for web scraping.
 * Produces a typed class with locators, a scrape() method, and optional pagination.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-page-object.ts --name <name> [options]
 *
 * Options:
 *   --name <name>           Class name (required, e.g., "ProductListing")
 *   --url <url>             Page URL (for documentation comment)
 *   --fields <fields>       Comma-separated data fields (e.g., title,price,rating)
 *   --selectors <json>      JSON map of field->selector (e.g., '{"title":".product-title"}')
 *   --with-pagination       Include pagination methods
 *   --output <path>         Output file path (default: stdout)
 *   --json                  Output as JSON
 *   -h, --help              Show help
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-page-object";

// === Types ===
interface GenerateOptions {
  name: string;
  url: string;
  fields: string[];
  selectors: Record<string, string>;
  withPagination: boolean;
  output: string; // empty string means stdout
}

interface GeneratedOutput {
  className: string;
  fileName: string;
  content: string;
}

// === Helpers ===
function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ""))
    .replace(/^(.)/, (_, c) => c.toUpperCase());
}

function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, "$1-$2")
    .replace(/[\s_]+/g, "-")
    .toLowerCase();
}

function selectorFor(field: string, selectors: Record<string, string>): string {
  return selectors[field] || `.${toKebabCase(field)}`;
}

// === Template ===
function generatePageObjectContent(options: GenerateOptions): string {
  const className = `${toPascalCase(options.name)}Page`;
  const fields = options.fields;
  const urlComment = options.url ? ` for ${options.url}` : "";

  const locatorDeclarations = fields
    .map((f) => `  readonly ${f}: Locator;`)
    .join("\n");

  const paginationDeclarations = options.withPagination
    ? "\n\n  // Pagination\n  readonly nextButton: Locator;\n  readonly prevButton: Locator;"
    : "";

  const locatorAssignments = fields
    .map((f) => {
      const sel = selectorFor(f, options.selectors);
      return `    this.${f} = page.locator('${sel}');`;
    })
    .join("\n");

  const paginationAssignments = options.withPagination
    ? `\n\n    // Pagination\n    this.nextButton = page.locator('[aria-label="Next page"], a[rel="next"]');\n    this.prevButton = page.locator('[aria-label="Previous page"], a[rel="prev"]');`
    : "";

  const scrapeFieldEntries = fields
    .map((f) => {
      const sel = selectorFor(f, options.selectors);
      return `        ${f}: await card.locator('${sel}').textContent(),`;
    })
    .join("\n");

  const paginationMethods = options.withPagination
    ? `

  /**
   * Check if there is a next page available.
   */
  async hasNextPage(): Promise<boolean> {
    return this.nextButton.isVisible();
  }

  /**
   * Navigate to the next page and wait for load.
   */
  async goToNextPage(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }`
    : "";

  return `import { Page, Locator } from 'playwright';
import { BasePage } from './BasePage';

/**
 * ${className} - Page object${urlComment}
 *
 * Locators may need adjustment for the actual site structure.
 * Run with agent-browser snapshot to discover accurate selectors.
 */
export class ${className} extends BasePage {
  // Locators
${locatorDeclarations}${paginationDeclarations}

  constructor(page: Page) {
    super(page);
${locatorAssignments}${paginationAssignments}
  }

  /**
   * Scrape all ${toPascalCase(options.name)} data from the current page.
   */
  async scrape(): Promise<Array<Record<string, string | null>>> {
    // Note: Adjust the container selector for the actual site
    const items: Array<Record<string, string | null>> = [];
    const cards = this.page.locator('.item, .card, [data-item]');
    const count = await cards.count();

    for (let i = 0; i < count; i++) {
      const card = cards.nth(i);
      items.push({
${scrapeFieldEntries}
      });
    }

    return items;
  }${paginationMethods}
}
`;
}

// === Generation ===
function generate(options: GenerateOptions): GeneratedOutput {
  const className = `${toPascalCase(options.name)}Page`;
  const fileName = `${toPascalCase(options.name)}Page.ts`;
  const content = generatePageObjectContent(options);
  return { className, fileName, content };
}

// === Directory Creation ===
async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Page Object Generator

Usage:
  deno run --allow-read --allow-write scripts/generate-page-object.ts --name <name> [options]

Options:
  --name <name>           Class name (required, e.g., "ProductListing")
  --url <url>             Page URL (for documentation comment)
  --fields <fields>       Comma-separated data fields (e.g., title,price,rating)
  --selectors <json>      JSON map of field->selector (e.g., '{"title":".product-title"}')
  --with-pagination       Include pagination methods
  --output <path>         Output file path (default: stdout)
  --json                  Output as JSON
  -h, --help              Show this help

Examples:
  # Generate a basic page object to stdout
  deno run --allow-read --allow-write scripts/generate-page-object.ts --name ProductListing

  # Generate with specific fields and selectors
  deno run --allow-read --allow-write scripts/generate-page-object.ts \\
    --name ProductListing --url "https://example.com/products" \\
    --fields title,price,rating \\
    --selectors '{"title":".product-title","price":".price-tag"}'

  # Generate with pagination and write to file
  deno run --allow-read --allow-write scripts/generate-page-object.ts \\
    --name SearchResults --with-pagination --output ./pages/SearchResultsPage.ts

  # Output as JSON for tool integration
  deno run --allow-read --allow-write scripts/generate-page-object.ts \\
    --name ProductListing --fields title,price --json

Generated Class Structure:
  - Extends BasePage with typed Locator properties
  - Constructor initializes all locators from selectors
  - scrape() method extracts field data from repeated page elements
  - Optional pagination: hasNextPage() and goToNextPage() methods
  - Fields without explicit selectors get kebab-case class placeholders
`);
}

// === CLI Handler ===
function parseArgs(args: string[]): GenerateOptions | null {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return null;
  }

  const options: GenerateOptions = {
    name: "",
    url: "",
    fields: [],
    selectors: {},
    withPagination: false,
    output: "",
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--name" && i + 1 < args.length) {
      options.name = args[++i];
    } else if (arg === "--url" && i + 1 < args.length) {
      options.url = args[++i];
    } else if (arg === "--fields" && i + 1 < args.length) {
      options.fields = args[++i].split(",").map((f) => f.trim());
    } else if (arg === "--selectors" && i + 1 < args.length) {
      try {
        options.selectors = JSON.parse(args[++i]);
      } catch {
        console.error("Error: --selectors must be valid JSON");
        return null;
      }
    } else if (arg === "--with-pagination") {
      options.withPagination = true;
    } else if (arg === "--output" && i + 1 < args.length) {
      options.output = args[++i];
    }
  }

  if (!options.name) {
    console.error("Error: --name is required");
    return null;
  }

  if (options.fields.length === 0) {
    options.fields = ["title", "url"];
  }

  return options;
}

// === Entry Point ===
async function main(): Promise<void> {
  const options = parseArgs(Deno.args);

  if (!options) {
    printHelp();
    Deno.exit(0);
  }

  const result = generate(options);

  const jsonFlag = Deno.args.includes("--json");
  if (jsonFlag) {
    console.log(JSON.stringify(result, null, 2));
  } else if (options.output) {
    const dir = options.output.substring(0, options.output.lastIndexOf("/"));
    if (dir) {
      await ensureDir(dir);
    }
    await Deno.writeTextFile(options.output, result.content);
    console.log(`Generated ${result.fileName} -> ${options.output}`);
  } else {
    console.log(result.content);
  }
}

if (import.meta.main) {
  main();
}
