#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Web Scraper Project Scaffolder
 *
 * Generates a Playwright-based web scraper project with page objects,
 * retry logic, data storage, and optional Docker/Zod validation setup.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts --name <name> [options]
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "scaffold-scraper-project";

// === Types ===
interface ScaffoldOptions {
  name: string;
  path: string;
  url: string;
  pages: string[];
  fields: string[];
  withDocker: boolean;
  withValidation: boolean;
}

interface GeneratedFile {
  path: string;
  content: string;
}

// === Helpers ===
function toPascalCase(str: string): string {
  return str.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).replace(/\s+/g, "");
}

function toKebabCase(str: string): string {
  return str.replace(/([a-z])([A-Z])/g, "$1-$2").replace(/[\s_]+/g, "-").toLowerCase();
}

// === Templates ===
function getBasePageTs(): string {
  return `import { Page } from 'playwright';

export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: \`screenshots/\${name}.png\`, fullPage: true });
  }

  async getText(selector: string): Promise<string> {
    const el = this.page.locator(selector);
    return (await el.textContent()) ?? '';
  }
}
`;
}

function getPageTs(pageName: string, fields: string[], withPagination: boolean): string {
  const locators = fields.map((f) => `  readonly ${f}Locator = this.page.locator('.${f}');`).join("\n");
  const scrapeFields = fields.map((f) => `        ${f}: await item.locator('.${f}').textContent() ?? '',`).join("\n");
  const pagImport = withPagination ? `\nimport { Pagination } from '../components/Pagination';` : "";
  const pagProp = withPagination ? `\n  readonly pagination: Pagination;\n` : "";
  const pagInit = withPagination ? `\n    this.pagination = new Pagination(page);` : "";
  const pagMethod = withPagination ? `
  async goToNextPage(): Promise<boolean> {
    const hasNext = await this.pagination.hasNextPage();
    if (hasNext) await this.pagination.goToNext();
    return hasNext;
  }
` : "";

  return `import { Page } from 'playwright';
import { BasePage } from './BasePage';${pagImport}

export class ${pageName}Page extends BasePage {
${locators}
${pagProp}
  constructor(page: Page) {
    super(page);${pagInit}
  }

  async scrape(): Promise<Record<string, string>[]> {
    const results: Record<string, string>[] = [];
    const items = this.page.locator('.item, [data-item]');
    const count = await items.count();
    for (let i = 0; i < count; i++) {
      const item = items.nth(i);
      results.push({
${scrapeFields}
      });
    }
    return results;
  }
${pagMethod}}
`;
}

function getPaginationTs(): string {
  return `import { Page, Locator } from 'playwright';

export class Pagination {
  readonly nextButton: Locator;
  readonly prevButton: Locator;
  readonly currentPage: Locator;

  constructor(private page: Page, scope?: Locator) {
    const root = scope ?? page;
    this.nextButton = root.locator('[aria-label="Next page"], a[rel="next"], .pagination-next');
    this.prevButton = root.locator('[aria-label="Previous page"], a[rel="prev"], .pagination-prev');
    this.currentPage = root.locator('[aria-current="page"], .pagination .active');
  }

  async hasNextPage(): Promise<boolean> { return this.nextButton.isVisible(); }

  async goToNext(): Promise<void> {
    await this.nextButton.click();
    await this.page.waitForLoadState('networkidle');
  }

  async getCurrentPageNumber(): Promise<number> {
    const text = await this.currentPage.textContent();
    return parseInt(text ?? '1', 10);
  }
}
`;
}

function getSchemaTs(pageName: string, fields: string[]): string {
  const fieldDefs = fields.map((f) => `  ${f}: z.string(),`).join("\n");
  return `import { z } from 'zod';

export const ${pageName}Schema = z.object({
${fieldDefs}
});

export type ${pageName}Data = z.infer<typeof ${pageName}Schema>;
`;
}

function getBrowserTs(): string {
  return `import { chromium, Browser, Page } from 'playwright';

export interface BrowserOptions {
  headless?: boolean;
  timeout?: number;
}

export async function launchBrowser(options: BrowserOptions = {}): Promise<Browser> {
  return chromium.launch({
    headless: options.headless ?? true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
}

export async function createPage(browser: Browser, options: BrowserOptions = {}): Promise<Page> {
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (compatible; ScrapeBot/1.0)',
  });
  const page = await context.newPage();
  page.setDefaultTimeout(options.timeout ?? 30000);
  return page;
}
`;
}

function getRetryTs(): string {
  return `export interface RetryOptions {
  maxAttempts?: number;
  baseDelay?: number;
  maxDelay?: number;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {},
): Promise<T> {
  const { maxAttempts = 3, baseDelay = 1000, maxDelay = 10000 } = options;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxAttempts) throw error;
      const delay = Math.min(baseDelay * Math.pow(2, attempt - 1), maxDelay);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}
`;
}

function getStorageTs(): string {
  return `import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export function writeJson(data: unknown[], filename: string, outputDir = './data'): void {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  const path = join(outputDir, \`\${filename}.json\`);
  writeFileSync(path, JSON.stringify(data, null, 2));
  console.log(\`Wrote \${data.length} records to \${path}\`);
}

export function writeCsv(data: Record<string, unknown>[], filename: string, outputDir = './data'): void {
  if (!existsSync(outputDir)) mkdirSync(outputDir, { recursive: true });
  if (data.length === 0) return;
  const headers = Object.keys(data[0]);
  const rows = data.map(row => headers.map(h => JSON.stringify(row[h] ?? '')).join(','));
  const csv = [headers.join(','), ...rows].join('\\n');
  const path = join(outputDir, \`\${filename}.csv\`);
  writeFileSync(path, csv);
  console.log(\`Wrote \${data.length} records to \${path}\`);
}
`;
}

function getScraperTs(siteName: string, pages: string[], url: string, withValidation: boolean): string {
  const pageImports = pages.map((p) => `import { ${p}Page } from '../pages/${p}Page';`).join("\n");
  const schemaImports = withValidation
    ? pages.map((p) => `import { ${p}Schema } from '../schemas/${toKebabCase(p)}.schema';`).join("\n") + "\n"
    : "";

  const scrapeBlocks = pages.map((p) => {
    const v = p.charAt(0).toLowerCase() + p.slice(1);
    const validate = withValidation ? `\n      const validated${p} = ${v}Data.map(item => ${p}Schema.parse(item));` : "";
    const ref = withValidation ? `validated${p}` : `${v}Data`;
    return `      // Scrape ${p}
      const ${v}Page = new ${p}Page(page);
      await ${v}Page.navigate('${url}');
      const ${v}Data = await withRetry(() => ${v}Page.scrape());${validate}
      writeJson(${ref}, '${toKebabCase(p)}');
      writeCsv(${ref} as Record<string, unknown>[], '${toKebabCase(p)}');`;
  }).join("\n\n");

  return `import { launchBrowser, createPage } from '../utils/browser';
import { writeJson, writeCsv } from '../utils/storage';
import { withRetry } from '../utils/retry';
${pageImports}
${schemaImports}
export class ${siteName}Scraper {
  async run(): Promise<void> {
    const browser = await launchBrowser({ headless: process.env.HEADLESS !== 'false' });
    try {
      const page = await createPage(browser);

${scrapeBlocks}

      console.log('Scraping complete.');
    } finally {
      await browser.close();
    }
  }
}
`;
}

function getIndexTs(siteName: string): string {
  return `import { ${siteName}Scraper } from './scrapers/${siteName}Scraper';
import 'dotenv/config';

async function main() {
  const scraper = new ${siteName}Scraper();
  await scraper.run();
}

main().catch(console.error);
`;
}

function getPackageJson(name: string, withValidation: boolean): string {
  const deps: Record<string, string> = { playwright: "^1.48.0", dotenv: "^16.4.0" };
  if (withValidation) deps["zod"] = "^3.23.0";
  const pkg = {
    name,
    version: "0.1.0",
    private: true,
    scripts: { start: "tsx src/index.ts", build: "tsc", dev: "tsx watch src/index.ts" },
    dependencies: deps,
    devDependencies: { typescript: "^5.6.0", tsx: "^4.19.0" },
  };
  return JSON.stringify(pkg, null, 2) + "\n";
}

function getTsconfigJson(): string {
  return `{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true
  },
  "include": ["src/**/*.ts"]
}
`;
}

function getDockerfile(): string {
  return `FROM mcr.microsoft.com/playwright:v1.48.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc
CMD ["node", "dist/index.js"]
`;
}

function getDockerComposeYml(): string {
  return `services:
  scraper:
    build: .
    environment:
      - NODE_ENV=production
      - BASE_URL=\${BASE_URL}
    volumes:
      - ./data:/app/data
      - ./screenshots:/app/screenshots
`;
}

function getEnvExample(): string {
  return `BASE_URL=https://example.com
HEADLESS=true
MAX_PAGES=10
REQUEST_DELAY=1000
`;
}

// === File Generation ===
function generateFiles(options: ScaffoldOptions): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const base = options.path;
  const siteName = toPascalCase(options.name);
  const hasPagination = options.pages.length > 1;

  // Pages
  files.push({ path: `${base}/src/pages/BasePage.ts`, content: getBasePageTs() });
  for (const p of options.pages) {
    files.push({ path: `${base}/src/pages/${p}Page.ts`, content: getPageTs(p, options.fields, hasPagination) });
  }

  // Components
  files.push({ path: `${base}/src/components/Pagination.ts`, content: getPaginationTs() });

  // Schemas (optional)
  if (options.withValidation) {
    for (const p of options.pages) {
      files.push({ path: `${base}/src/schemas/${toKebabCase(p)}.schema.ts`, content: getSchemaTs(p, options.fields) });
    }
  }

  // Utils
  files.push({ path: `${base}/src/utils/browser.ts`, content: getBrowserTs() });
  files.push({ path: `${base}/src/utils/retry.ts`, content: getRetryTs() });
  files.push({ path: `${base}/src/utils/storage.ts`, content: getStorageTs() });

  // Scraper orchestrator
  files.push({
    path: `${base}/src/scrapers/${siteName}Scraper.ts`,
    content: getScraperTs(siteName, options.pages, options.url, options.withValidation),
  });

  // Entry point
  files.push({ path: `${base}/src/index.ts`, content: getIndexTs(siteName) });

  // Config files
  files.push({ path: `${base}/package.json`, content: getPackageJson(options.name, options.withValidation) });
  files.push({ path: `${base}/tsconfig.json`, content: getTsconfigJson() });
  files.push({ path: `${base}/.env.example`, content: getEnvExample() });

  // Docker (optional)
  if (options.withDocker) {
    files.push({ path: `${base}/Dockerfile`, content: getDockerfile() });
    files.push({ path: `${base}/docker-compose.yml`, content: getDockerComposeYml() });
  }

  return files;
}

// === Directory Creation ===
async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) throw error;
  }
}

async function writeFiles(files: GeneratedFile[]): Promise<void> {
  for (const file of files) {
    const dir = file.path.substring(0, file.path.lastIndexOf("/"));
    await ensureDir(dir);
    await Deno.writeTextFile(file.path, file.content);
  }
}

// === Scaffold ===
async function scaffold(options: ScaffoldOptions): Promise<GeneratedFile[]> {
  const base = options.path;
  await ensureDir(`${base}/data`);
  await ensureDir(`${base}/screenshots`);
  const files = generateFiles(options);
  await writeFiles(files);
  return files;
}

// === Output Formatting ===
function formatHumanOutput(options: ScaffoldOptions, files: GeneratedFile[]): void {
  console.log("\nSCRAPER PROJECT SCAFFOLDED");
  console.log("==========================\n");
  console.log(`Project:    ${options.name}`);
  console.log(`Location:   ${options.path}`);
  console.log(`Target URL: ${options.url}`);
  console.log(`Pages:      ${options.pages.join(", ")}`);
  console.log(`Fields:     ${options.fields.join(", ")}`);
  console.log(`Docker:     ${options.withDocker ? "yes" : "no"}`);
  console.log(`Validation: ${options.withValidation ? "yes" : "no"}`);
  console.log("\nFILES CREATED:\n");
  for (const file of files) {
    console.log(`  ${file.path.replace(options.path + "/", "")}`);
  }
  console.log("\nNEXT STEPS:");
  console.log(`  cd ${options.path}`);
  console.log("  npm install");
  console.log("  npx playwright install chromium");
  console.log("  npm run dev\n");
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Web Scraper Project Scaffolder

Usage:
  deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts --name <name> [options]

Options:
  --name <name>       Project name (required)
  --path <path>       Target directory (default: ./)
  --url <url>         Target site base URL (default: https://example.com)
  --pages <pages>     Comma-separated page names (e.g., ProductListing,ProductDetail)
  --fields <fields>   Comma-separated data fields (e.g., title,price,rating)
  --no-docker         Skip Docker setup
  --no-validation     Skip Zod validation setup
  --json              Output as JSON
  -h, --help          Show this help

Examples:
  # Basic scraper
  deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts --name my-scraper

  # With specific pages and fields
  deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts \\
    --name product-scraper --url https://shop.example.com \\
    --pages ProductListing,ProductDetail --fields title,price,rating

  # Without Docker or validation
  deno run --allow-read --allow-write scripts/scaffold-scraper-project.ts \\
    --name simple-scraper --no-docker --no-validation

Generated Structure:
  src/pages/BasePage.ts            Abstract base with navigation helpers
  src/pages/[PageName]Page.ts      One page object per --pages entry
  src/components/Pagination.ts     Reusable pagination component
  src/schemas/[name].schema.ts     Zod schemas (unless --no-validation)
  src/utils/browser.ts             Browser launch configuration
  src/utils/retry.ts               Retry with exponential backoff
  src/utils/storage.ts             JSON/CSV writer utilities
  src/scrapers/[Site]Scraper.ts    Main scraper orchestrator
  src/index.ts                     Entry point
  data/                            Output directory
  screenshots/                     Debug screenshots
  Dockerfile                       Playwright build (unless --no-docker)
  docker-compose.yml               Service config (unless --no-docker)
  package.json, tsconfig.json, .env.example
`);
}

// === CLI Handler ===
function parseArgs(args: string[]): ScaffoldOptions | null {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) return null;

  const options: ScaffoldOptions = {
    name: "",
    path: ".",
    url: "https://example.com",
    pages: [],
    fields: [],
    withDocker: true,
    withValidation: true,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--name" && i + 1 < args.length) options.name = args[++i];
    else if (arg === "--path" && i + 1 < args.length) options.path = args[++i];
    else if (arg === "--url" && i + 1 < args.length) options.url = args[++i];
    else if (arg === "--pages" && i + 1 < args.length) options.pages = args[++i].split(",").map((s) => s.trim());
    else if (arg === "--fields" && i + 1 < args.length) options.fields = args[++i].split(",").map((s) => s.trim());
    else if (arg === "--no-docker") options.withDocker = false;
    else if (arg === "--no-validation") options.withValidation = false;
  }

  if (!options.name) {
    console.error("Error: --name is required");
    return null;
  }

  if (options.pages.length === 0) options.pages = ["Main"];
  if (options.fields.length === 0) options.fields = ["title", "url"];
  return options;
}

// === Entry Point ===
async function main(): Promise<void> {
  const options = parseArgs(Deno.args);
  if (!options) { printHelp(); Deno.exit(0); }

  const files = await scaffold(options);

  if (Deno.args.includes("--json")) {
    console.log(JSON.stringify({
      name: options.name,
      path: options.path,
      url: options.url,
      pages: options.pages,
      fields: options.fields,
      withDocker: options.withDocker,
      withValidation: options.withValidation,
      filesCreated: files.map((f) => f.path),
    }, null, 2));
  } else {
    formatHumanOutput(options, files);
  }
}

if (import.meta.main) {
  main();
}
