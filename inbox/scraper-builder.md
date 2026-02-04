<img src="https://r2cdn.perplexity.ai/pplx-full-logo-primary-dark%402x.png" style="height:64px;margin-right:32px"/>

# What are the best options for building web scrapers in Typescript that run locally in Docker against Playwright or similar browser setups? I'm aiming to build site-specific scrapers that implement the PageObject pattern.

Based on my research of current tools and best practices, here are the best options for building TypeScript web scrapers with Playwright in Docker using the PageObject pattern:

## Best Frameworks \& Libraries

### 1. **Playwright (Primary Choice)**

Playwright is the leading solution for TypeScript-based web scraping in 2026. It offers:[^1_1][^1_2]

- **Native TypeScript support** with excellent type definitions
- **Cross-browser automation** (Chromium, Firefox, WebKit)
- **Built-in auto-waiting** that reduces flaky scrapers
- **Resilient element handling** with multiple selector strategies
- **Official Docker images** from Microsoft (`mcr.microsoft.com/playwright`)


### 2. **Puppeteer**

A solid alternative focusing specifically on Chromium:

- Lighter weight than Playwright
- Excellent for Chromium-only projects
- Strong TypeScript support
- Simpler API surface
- Works well in headless Docker environments


### 3. **Crawlee** (Formerly Apify SDK)

Purpose-built for web scraping at scale:

- Built on top of Playwright/Puppeteer
- Automatic retries and error handling
- Request queue management
- Data storage abstraction
- TypeScript-first design


## PageObject Pattern Implementation

Based on current best practices, here's how to structure your scraper with PageObjects:[^1_3][^1_4]

### Base Page Class Structure

```typescript
// pages/BasePage.ts
import { Page, Locator } from '@playwright/test';

export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async navigate(url: string): Promise<void> {
    await this.page.goto(url, { waitUntil: 'networkidle' });
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `screenshots/${name}.png` });
  }
}
```


### Site-Specific Scraper Example

```typescript
// pages/ProductListingPage.ts
import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProductListingPage extends BasePage {
  readonly productCards: Locator;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('.product-card');
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.nextButton = page.locator('button:has-text("Next")');
  }

  async scrapeProducts() {
    const products = [];
    const count = await this.productCards.count();
    
    for (let i = 0; i < count; i++) {
      const card = this.productCards.nth(i);
      const title = await card.locator('[data-testid="product-title"]').textContent();
      const price = await card.locator('[data-testid="product-price"]').textContent();
      
      products.push({ title, price });
    }
    
    return products;
  }

  async goToNextPage(): Promise<boolean> {
    if (await this.nextButton.isVisible()) {
      await this.nextButton.click();
      await this.waitForPageLoad();
      return true;
    }
    return false;
  }
}
```


### Reusable Components Pattern

```typescript
// components/DataTable.ts
import { Page, Locator } from '@playwright/test';

export class DataTable {
  readonly page: Page;
  readonly table: Locator;
  readonly rows: Locator;

  constructor(page: Page, tableSelector: string) {
    this.page = page;
    this.table = page.locator(tableSelector);
    this.rows = this.table.locator('tbody tr');
  }

  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async getCellValue(rowIndex: number, columnIndex: number): Promise<string> {
    const cell = this.rows.nth(rowIndex).locator('td').nth(columnIndex);
    return (await cell.textContent()) ?? '';
  }

  async extractAllRows() {
    const data = [];
    const count = await this.getRowCount();
    
    for (let i = 0; i < count; i++) {
      const cells = this.rows.nth(i).locator('td');
      const cellCount = await cells.count();
      const row = [];
      
      for (let j = 0; j < cellCount; j++) {
        row.push(await cells.nth(j).textContent());
      }
      data.push(row);
    }
    
    return data;
  }
}
```


## Docker Setup

### Dockerfile

```dockerfile
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Run scraper
CMD ["node", "dist/index.js"]
```


### Docker Compose Example

```yaml
version: '3.8'

services:
  scraper:
    build: .
    environment:
      - NODE_ENV=production
      - HEADLESS=true
    volumes:
      - ./data:/app/data
      - ./screenshots:/app/screenshots
    networks:
      - scraper-net

networks:
  scraper-net:
    driver: bridge
```


## Project Structure Recommendation

```
scraper-project/
├── src/
│   ├── pages/
│   │   ├── BasePage.ts
│   │   ├── ProductListingPage.ts
│   │   └── ProductDetailPage.ts
│   ├── components/
│   │   ├── Modal.ts
│   │   ├── DataTable.ts
│   │   └── SearchBar.ts
│   ├── utils/
│   │   ├── browser.ts
│   │   ├── retry.ts
│   │   └── storage.ts
│   ├── scrapers/
│   │   └── ProductScraper.ts
│   └── index.ts
├── tests/
├── data/
├── screenshots/
├── Dockerfile
├── docker-compose.yml
├── package.json
└── tsconfig.json
```


## Key Best Practices[^1_3]

1. **Single Responsibility**: Each PageObject represents one page or component
2. **No Assertions in PageObjects**: Keep business logic in scrapers, not page objects
3. **Lazy Initialization**: Initialize locators in constructor, interact in methods
4. **Meaningful Method Names**: Use action-oriented names like `scrapeProducts()`, `extractData()`
5. **Return Types**: Methods should return scraped data or next page objects
6. **Composition Over Inheritance**: Use component classes within page objects

## Additional Tools to Consider

- **Browserless**: Cloud-based headless browser service for scaling
- **Proxy rotation services**: IPRoyal, Bright Data for avoiding blocks
- **Data validation**: Zod or Yup for TypeScript schema validation
- **Queue management**: Bull or BullMQ for job scheduling in Docker

Would you like me to create a complete working example with a specific site pattern or dive deeper into any of these aspects?
<span style="display:none">[^1_10][^1_11][^1_12][^1_13][^1_14][^1_15][^1_5][^1_6][^1_7][^1_8][^1_9]</span>

<div align="center">⁂</div>

[^1_1]: https://www.testsprite.com/use-cases/en/the-top-cross-browser-UI-automation-tools

[^1_2]: https://www.firecrawl.dev/blog/browser-automation-tools-comparison-2025

[^1_3]: https://oneuptime.com/blog/post/2026-01-28-playwright-page-object-pattern/view

[^1_4]: https://playwright.dev/docs/pom

[^1_5]: https://www.freecodecamp.org/news/build-a-dynamic-web-scraper-app-with-playwright-and-react/

[^1_6]: https://github.com/mihneamanolache/web-scraper

[^1_7]: https://oxylabs.io/blog/playwright-web-scraping

[^1_8]: https://codesignal.com/learn/courses/mastering-test-patterns-with-playwright/lessons/introduction-to-the-page-object-model-with-playwright

[^1_9]: https://www.browserbase.com/blog/browser-automation-all-languages-with-stagehand

[^1_10]: https://iproyal.com/blog/playwright-web-scraping/

[^1_11]: https://www.youtube.com/watch?v=XBSpY_v21iI

[^1_12]: https://www.qable.io/blog/top-5-javascript-test-automation-frameworks-in-2026

[^1_13]: https://www.testmu.ai/learning-hub/playwright-docker/

[^1_14]: https://www.youtube.com/watch?v=iY0-9uaJzLg

[^1_15]: https://www.reddit.com/r/developer/comments/1pleb31/top_javascript_tools_every_developer_should/


---

# How could an agent use [https://skills.sh/vercel-labs/agent-browser/agent-browser](https://skills.sh/vercel-labs/agent-browser/agent-browser) to analyze a site and generate a PageObject scraper with selectors, etc?

Based on my research, here's how an AI agent can leverage **agent-browser** to analyze a website and generate PageObject scrapers with selectors:

## How Agent-Browser Works for Analysis

Agent-browser uses an **accessibility tree snapshot** approach that's fundamentally different from traditional DOM scraping. Here's the core workflow:[^2_1][^2_2]

### 1. **Snapshot → Analyze → Generate Pattern**

```bash
# Step 1: Navigate to the site
agent-browser open https://example.com/products

# Step 2: Get interactive snapshot with element references
agent-browser snapshot -i --json
```

**Output example:**

```json
{
  "elements": [
    {"ref": "@e1", "role": "button", "name": "Add to Cart", "selector": "button.add-to-cart"},
    {"ref": "@e2", "role": "textbox", "name": "Search", "selector": "input#search"},
    {"ref": "@e3", "role": "link", "name": "Next Page", "selector": "a.pagination-next"},
    {"ref": "@e4", "role": "heading", "name": "Product Title", "selector": "h2.product-title"}
  ]
}
```


### 2. **AI Agent Analysis Workflow**

The AI agent can follow this pattern to generate PageObject code:

```typescript
// The agent would:
// 1. Request snapshot with --json flag
// 2. Parse the accessibility tree
// 3. Group elements by semantic meaning
// 4. Generate PageObject classes with appropriate selectors
```


## Complete AI-Driven PageObject Generation System

Here's a practical implementation showing how an AI agent would use agent-browser:

### Agent Prompt Template

```typescript
/**
 * AI Agent Instructions for PageObject Generation
 * 
 * Given a target URL, you will:
 * 1. Use agent-browser to explore the page
 * 2. Identify interactive elements and data containers
 * 3. Generate TypeScript PageObject classes
 * 4. Validate selectors work across page states
 */

interface PageObjectGeneratorAgent {
  analyzeUrl(url: string): Promise<PageObjectCode>;
}
```


### Step-by-Step AI Agent Script

```bash
#!/bin/bash
# AI agent script to analyze a page and generate PageObject

URL="$1"
OUTPUT_DIR="./generated-pages"

echo "🔍 Analyzing $URL..."

# 1. Navigate to page
agent-browser open "$URL"

# 2. Get comprehensive snapshot
echo "📸 Capturing page structure..."
agent-browser snapshot -i --json > analysis.json

# 3. Get scoped snapshots for different sections
echo "🔍 Analyzing navigation..."
agent-browser snapshot -i --json -s "nav" > nav.json

echo "🔍 Analyzing main content..."
agent-browser snapshot -i --json -s "main" > main.json

echo "🔍 Analyzing forms..."
agent-browser snapshot -i --json -s "form" > forms.json

# 4. Test interactions to understand dynamic behavior
echo "🧪 Testing interactions..."
agent-browser click @e1  # Click first interactive element
agent-browser wait --load networkidle
agent-browser snapshot -i --json > after-interaction.json

# 5. Extract all text to understand data patterns
agent-browser get text body --json > text-content.json

# 6. Close browser
agent-browser close

echo "✅ Analysis complete. JSON files ready for PageObject generation."
```


### AI Agent PageObject Generator

Here's how an LLM-based agent would transform the snapshot data into PageObject code:

```typescript
// agent-pageobject-generator.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';

const execAsync = promisify(exec);

interface ElementSnapshot {
  ref: string;
  role: string;
  name: string;
  selector: string;
  attributes?: Record<string, string>;
}

interface SnapshotAnalysis {
  elements: ElementSnapshot[];
  url: string;
  title: string;
}

class AgentBrowserPageObjectGenerator {
  
  /**
   * Main orchestration method - AI agent would call this
   */
  async generatePageObject(url: string, pageName: string): Promise<string> {
    console.log(`🤖 AI Agent analyzing: ${url}`);
    
    // 1. Capture initial state
    const initialSnapshot = await this.captureSnapshot(url);
    
    // 2. Identify interactive patterns
    const interactions = await this.discoverInteractions(initialSnapshot);
    
    // 3. Group elements semantically
    const semanticGroups = this.groupElementsBySemantic(initialSnapshot.elements);
    
    // 4. Generate PageObject code
    const pageObjectCode = this.generateTypeScriptCode(
      pageName,
      semanticGroups,
      interactions
    );
    
    // 5. Generate validation tests
    const testCode = this.generateValidationTests(pageName, interactions);
    
    return pageObjectCode;
  }
  
  /**
   * Use agent-browser to capture page structure
   */
  async captureSnapshot(url: string): Promise<SnapshotAnalysis> {
    await execAsync(`agent-browser open "${url}"`);
    await execAsync('agent-browser wait --load networkidle');
    
    const { stdout } = await execAsync('agent-browser snapshot -i --json');
    const snapshot = JSON.parse(stdout);
    
    return snapshot;
  }
  
  /**
   * AI discovers what elements can be interacted with
   */
  async discoverInteractions(snapshot: SnapshotAnalysis): Promise<Array<{
    element: ElementSnapshot;
    actionType: string;
    result: string;
  }>> {
    const interactions = [];
    
    // Test buttons
    const buttons = snapshot.elements.filter(e => 
      e.role === 'button' || e.selector.includes('button')
    );
    
    for (const button of buttons.slice(0, 3)) {
      try {
        console.log(`🧪 Testing interaction with: ${button.name}`);
        
        // Capture before state
        await execAsync(`agent-browser snapshot -i --json > before-${button.ref}.json`);
        
        // Perform interaction
        await execAsync(`agent-browser click ${button.ref}`);
        await execAsync('agent-browser wait 1000');
        
        // Capture after state
        const { stdout } = await execAsync('agent-browser snapshot -i --json');
        const afterSnapshot = JSON.parse(stdout);
        
        interactions.push({
          element: button,
          actionType: 'click',
          result: this.compareSnapshots(snapshot, afterSnapshot)
        });
      } catch (error) {
        console.log(`⚠️  Could not interact with ${button.name}`);
      }
    }
    
    return interactions;
  }
  
  /**
   * Group elements by their semantic purpose
   */
  groupElementsBySemantic(elements: ElementSnapshot[]): Map<string, ElementSnapshot[]> {
    const groups = new Map<string, ElementSnapshot[]>();
    
    // Navigation elements
    groups.set('navigation', elements.filter(e => 
      e.role === 'link' && (
        e.selector.includes('nav') || 
        e.name.toLowerCase().includes('menu')
      )
    ));
    
    // Form inputs
    groups.set('inputs', elements.filter(e => 
      e.role === 'textbox' || 
      e.role === 'searchbox' ||
      e.selector.includes('input')
    ));
    
    // Buttons
    groups.set('buttons', elements.filter(e => 
      e.role === 'button' || 
      e.selector.includes('button')
    ));
    
    // Data display elements (lists, cards, tables)
    groups.set('dataElements', elements.filter(e => 
      e.role === 'listitem' ||
      e.selector.includes('.card') ||
      e.selector.includes('.product')
    ));
    
    return groups;
  }
  
  /**
   * Generate TypeScript PageObject code
   */
  generateTypeScriptCode(
    pageName: string, 
    groups: Map<string, ElementSnapshot[]>,
    interactions: Array<any>
  ): string {
    const className = this.toPascalCase(pageName);
    
    let code = `import { Page, Locator } from '@playwright/test';\n`;
    code += `import { BasePage } from './BasePage';\n\n`;
    code += `export class ${className} extends BasePage {\n`;
    
    // Generate locator properties
    code += `  // Locators\n`;
    for (const [groupName, elements] of groups) {
      elements.forEach((element, index) => {
        const propName = this.toValidPropertyName(element.name || `${groupName}${index}`);
        code += `  readonly ${propName}: Locator;\n`;
      });
    }
    
    code += `\n  constructor(page: Page) {\n`;
    code += `    super(page);\n`;
    
    // Initialize locators
    for (const [groupName, elements] of groups) {
      elements.forEach((element, index) => {
        const propName = this.toValidPropertyName(element.name || `${groupName}${index}`);
        // Prefer data-testid, then CSS selector, then text matching
        const selector = this.generateRobustSelector(element);
        code += `    this.${propName} = page.locator('${selector}');\n`;
      });
    }
    
    code += `  }\n\n`;
    
    // Generate action methods based on discovered interactions
    code += `  // Actions\n`;
    
    // Add common scraping methods
    code += this.generateScrapingMethods(groups);
    
    code += `}\n`;
    
    return code;
  }
  
  /**
   * Generate robust selector with fallbacks
   */
  generateRobustSelector(element: ElementSnapshot): string {
    // Priority: data-testid > id > unique class > role + name
    if (element.attributes?.['data-testid']) {
      return `[data-testid="${element.attributes['data-testid']}"]`;
    }
    
    if (element.selector.includes('#')) {
      return element.selector;
    }
    
    if (element.role && element.name) {
      return `${element.role}:has-text("${element.name}")`;
    }
    
    return element.selector;
  }
  
  /**
   * Generate scraping methods
   */
  generateScrapingMethods(groups: Map<string, ElementSnapshot[]>): string {
    let methods = '';
    
    // If there are data elements (cards, list items), generate collection method
    const dataElements = groups.get('dataElements') || [];
    if (dataElements.length > 0) {
      methods += `  async scrapeItems(): Promise<Array<Record<string, string>>> {\n`;
      methods += `    const items = [];\n`;
      methods += `    const container = this.page.locator('${dataElements[^2_0].selector}').first();\n`;
      methods += `    const count = await container.count();\n`;
      methods += `    \n`;
      methods += `    for (let i = 0; i < count; i++) {\n`;
      methods += `      const item = container.nth(i);\n`;
      methods += `      const data = {\n`;
      methods += `        // Extract text from common patterns\n`;
      methods += `        title: await item.locator('h1, h2, h3, .title').first().textContent() || '',\n`;
      methods += `        description: await item.locator('p, .description').first().textContent() || '',\n`;
      methods += `      };\n`;
      methods += `      items.push(data);\n`;
      methods += `    }\n`;
      methods += `    \n`;
      methods += `    return items;\n`;
      methods += `  }\n\n`;
    }
    
    // Generate search method if search input exists
    const inputs = groups.get('inputs') || [];
    const searchInput = inputs.find(e => 
      e.name.toLowerCase().includes('search') ||
      e.attributes?.placeholder?.toLowerCase().includes('search')
    );
    
    if (searchInput) {
      const propName = this.toValidPropertyName(searchInput.name || 'searchInput');
      methods += `  async search(query: string): Promise<void> {\n`;
      methods += `    await this.${propName}.fill(query);\n`;
      methods += `    await this.${propName}.press('Enter');\n`;
      methods += `    await this.waitForPageLoad();\n`;
      methods += `  }\n\n`;
    }
    
    return methods;
  }
  
  /**
   * Generate validation tests
   */
  generateValidationTests(pageName: string, interactions: Array<any>): string {
    const className = this.toPascalCase(pageName);
    
    let testCode = `import { test, expect } from '@playwright/test';\n`;
    testCode += `import { ${className} } from './pages/${className}';\n\n`;
    testCode += `test.describe('${className} - Generated Tests', () => {\n`;
    testCode += `  test('should load page and verify selectors', async ({ page }) => {\n`;
    testCode += `    const pageObj = new ${className}(page);\n`;
    testCode += `    await pageObj.navigate('YOUR_URL_HERE');\n`;
    testCode += `    \n`;
    testCode += `    // Verify key elements are present\n`;
    testCode += `    // Add your assertions here\n`;
    testCode += `  });\n`;
    testCode += `});\n`;
    
    return testCode;
  }
  
  // Helper methods
  private toPascalCase(str: string): string {
    return str.replace(/(?:^\w|[A-Z]|\b\w)/g, (letter, index) => 
      letter.toUpperCase()
    ).replace(/\s+/g, '');
  }
  
  private toValidPropertyName(str: string): string {
    return str
      .replace(/[^a-zA-Z0-9]/g, '_')
      .replace(/^[0-9]/, '_$&')
      .toLowerCase();
  }
  
  private compareSnapshots(before: SnapshotAnalysis, after: SnapshotAnalysis): string {
    // Simple comparison - in real implementation, would be more sophisticated
    if (before.url !== after.url) return 'navigation_occurred';
    if (before.elements.length !== after.elements.length) return 'dom_changed';
    return 'no_visible_change';
  }
}

// Usage example
const generator = new AgentBrowserPageObjectGenerator();
generator.generatePageObject('https://example.com/products', 'ProductListing')
  .then(code => {
    console.log('✅ Generated PageObject:\n');
    console.log(code);
  });
```


## Key Advantages for AI Agents[^2_3][^2_1]

1. **93% Less Context** - Accessibility tree is much smaller than full DOM
2. **No Vision Model Needed** - Text-based snapshots instead of screenshots
3. **Stable References** - `@e1`, `@e2` refs are consistent within a snapshot
4. **JSON Output** - Easy for AI to parse and analyze (`--json` flag)
5. **Session Management** - Test multiple pages in parallel

## Practical AI Agent Workflow

```typescript
// High-level agent orchestration
async function aiGeneratePageObject(url: string) {
  // 1. Initial reconnaissance
  const snapshot = await agentBrowser.snapshot(url);
  
  // 2. AI analyzes structure
  const analysis = await llm.analyze(`
    Given this page snapshot: ${JSON.stringify(snapshot)}
    
    Identify:
    - All interactive elements (buttons, inputs, links)
    - Data display patterns (cards, tables, lists)
    - Navigation elements
    - Form structures
    
    Generate appropriate PageObject locators and methods.
  `);
  
  // 3. AI generates code
  const pageObjectCode = await llm.generateCode(analysis);
  
  // 4. Validate with agent-browser
  await validateSelectors(pageObjectCode);
  
  return pageObjectCode;
}
```

This approach lets AI agents **discover** page structure dynamically rather than requiring manual selector writing, making it perfect for generating site-specific scrapers automatically.

Would you like me to create a complete working example that integrates agent-browser with an LLM to automatically generate PageObject scrapers?
<span style="display:none">[^2_10][^2_11][^2_12][^2_13][^2_14][^2_15][^2_4][^2_5][^2_6][^2_7][^2_8][^2_9]</span>

<div align="center">⁂</div>

[^2_1]: https://www.reddit.com/r/ClaudeAI/comments/1qazrbr/agentbrowser_vercels_new_cli_that_works_with/

[^2_2]: https://github.com/vercel-labs/agent-browser

[^2_3]: https://www.reddit.com/r/GithubCopilot/comments/1qs84xq/give_your_coding_agent_browser_superpowers_with/

[^2_4]: https://mcpservers.org/claude-skills/vercel/agent-browser

[^2_5]: https://github.com/Agenty/scrapingai

[^2_6]: https://www.confluent.io/blog/real-time-web-scraping/

[^2_7]: https://www.facebook.com/groups/itpinoynz/posts/3957532311057019/

[^2_8]: https://docs.browser-use.com/customize/agent/all-parameters

[^2_9]: https://www.capsolver.com/blog/web-scraping/make-ai-agent

[^2_10]: https://help.apiyi.com/en/agent-browser-ai-browser-automation-cli-guide-en.html

[^2_11]: https://huggingface.co/docs/smolagents/v1.12.0/en/examples/web_browser

[^2_12]: https://scrapegraphai.com/blog/ai-agent-webscraping

[^2_13]: https://vercel.com/docs/agent

[^2_14]: https://www.linkedin.com/pulse/design-patterns-building-ai-agent-browser-automation-rohit-kelapure-g5ckc

[^2_15]: https://www.reddit.com/r/AI_Agents/comments/1huc7ga/how_to_build_an_ai_agent_to_scrape_and_structure/

