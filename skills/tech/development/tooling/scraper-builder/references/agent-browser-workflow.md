# Agent-Browser Site Analysis Workflow

The `agent-browser` CLI tool enables AI agents to analyze websites by capturing accessibility tree snapshots. This document describes the complete workflow for using agent-browser to discover page structure, identify selectors, and generate PageObject classes.

## Overview

Agent-browser works by:
1. Launching a browser session (like Playwright, but controlled via CLI)
2. Capturing accessibility tree snapshots (not screenshots or DOM dumps)
3. Returning structured JSON with element references and roles
4. Supporting interactions (click, type, scroll) to test dynamic behavior

The accessibility tree is approximately 93% smaller than the full DOM, making it efficient for AI agents to process without vision models.

## Installation

If `agent-browser` is not already available, install it as a skill:

```bash
npx skills add vercel-labs/agent-browser
```

This adds the `agent-browser` CLI commands to the agent's environment. Verify installation by running `agent-browser --help`.

## Core Commands

### Navigation

```bash
# Open a URL in the browser
agent-browser open https://example.com/products

# Wait for the page to stabilize
agent-browser wait --load networkidle
```

### Snapshots

```bash
# Full page snapshot with interactive element references
agent-browser snapshot -i --json

# Scoped snapshot (specific section)
agent-browser snapshot -i --json -s "main"
agent-browser snapshot -i --json -s "nav"
agent-browser snapshot -i --json -s "form"

# Text-only snapshot (no element refs)
agent-browser snapshot --json
```

### Interactions

```bash
# Click an element by reference
agent-browser click @e3

# Type text into an input
agent-browser type @e5 "search query"

# Scroll the page
agent-browser scroll down 500

# Press a key
agent-browser press Enter

# Wait after interaction
agent-browser wait --load networkidle
agent-browser wait 2000  # explicit ms delay
```

### Data Extraction

```bash
# Get text content of an element
agent-browser get text body --json
agent-browser get text "main" --json

# Get an attribute
agent-browser get attr "img.product" src --json
```

### Session Management

```bash
# Close the browser
agent-browser close
```

## Snapshot Output Format

Interactive snapshots return JSON with element references:

```json
{
  "url": "https://example.com/products",
  "title": "Products - Example Store",
  "elements": [
    {
      "ref": "@e1",
      "role": "link",
      "name": "Home",
      "selector": "nav a:first-child"
    },
    {
      "ref": "@e2",
      "role": "searchbox",
      "name": "Search products",
      "selector": "input[type=\"search\"]"
    },
    {
      "ref": "@e3",
      "role": "button",
      "name": "Next Page",
      "selector": "button.pagination-next"
    },
    {
      "ref": "@e4",
      "role": "heading",
      "name": "Electronics",
      "selector": "h2.category-title"
    }
  ]
}
```

### Element Properties

| Property | Description |
|----------|-------------|
| `ref` | Stable reference within the snapshot (`@e1`, `@e2`, etc.) |
| `role` | ARIA role (button, link, heading, textbox, listitem, etc.) |
| `name` | Accessible name (button text, label, alt text) |
| `selector` | CSS selector that agent-browser computed for the element |

**Important:** Element refs (`@e1`) are stable within a single snapshot but may change between snapshots (after navigation or DOM mutations).

## Complete Analysis Workflow

### Step 1: Initial Reconnaissance

Navigate to the target page and capture the full structure:

```bash
agent-browser open https://example.com/products
agent-browser wait --load networkidle
agent-browser snapshot -i --json > full-snapshot.json
```

### Step 2: Section Analysis

Capture scoped snapshots for focused analysis of different page regions:

```bash
# Navigation structure
agent-browser snapshot -i --json -s "nav" > nav-snapshot.json

# Main content area (where data lives)
agent-browser snapshot -i --json -s "main" > main-snapshot.json

# Footer (often has pagination)
agent-browser snapshot -i --json -s "footer" > footer-snapshot.json

# Any sidebar filters
agent-browser snapshot -i --json -s "aside" > sidebar-snapshot.json
```

### Step 3: Semantic Grouping

From the snapshot data, the AI agent groups elements by purpose:

| Group | Roles to Look For |
|-------|-------------------|
| Navigation | `link` in `nav` scope, breadcrumbs |
| Data display | `listitem`, `heading`, elements in `main` scope |
| Actions | `button`, `link` with action verbs |
| Inputs | `textbox`, `searchbox`, `combobox` |
| Pagination | `button`/`link` with "Next"/"Previous" names |

### Step 4: Dynamic Behavior Discovery

Test interactions to understand page behavior:

```bash
# Test pagination
agent-browser click @e3  # Click "Next Page" button
agent-browser wait --load networkidle
agent-browser snapshot -i --json > after-pagination.json

# Compare: Did the URL change? Did content update?
# If elements changed, this confirms dynamic pagination

# Test search
agent-browser open https://example.com/products  # Reset
agent-browser wait --load networkidle
agent-browser type @e2 "laptop"
agent-browser press Enter
agent-browser wait --load networkidle
agent-browser snapshot -i --json > after-search.json
```

### Step 5: Selector Validation

Verify discovered selectors work by interacting with them:

```bash
# Click a discovered element to confirm it's interactive
agent-browser click @e4

# Extract text to confirm content is readable
agent-browser get text ".product-card:first-child" --json
```

### Step 6: Generate Page Objects

The AI agent uses the collected snapshots to:

1. **Map elements to locators** — Use the `selector` property from snapshots
2. **Determine data fields** — Headings, text content, and attributes become field names
3. **Identify components** — Pagination, tables, and repeated patterns become components
4. **Create the scrape flow** — Navigation order and pagination strategy

## Mapping Snapshots to PageObjects

### From Snapshot to Locator

```json
{"ref": "@e4", "role": "heading", "name": "Product Title", "selector": "h2.product-title"}
```

Maps to:

```typescript
readonly productTitle: Locator;
// In constructor:
this.productTitle = page.locator('h2.product-title');
```

### From Roles to Methods

| Snapshot Pattern | PageObject Method |
|------------------|-------------------|
| Multiple `listitem` elements | `scrapeItems(): Promise<Item[]>` |
| `button` named "Next" | `goToNextPage(): Promise<void>` |
| `searchbox` element | `search(query: string): Promise<void>` |
| `link` to detail page | `goToDetail(index: number): Promise<void>` |

## Limitations

1. **Accessibility tree gaps** — Some elements may not appear in the accessibility tree if they lack ARIA roles. Fall back to full-page snapshot or scoped CSS selectors.

2. **Dynamic content** — SPAs that load content lazily may not show all elements in the initial snapshot. Scroll and wait before re-snapshotting.

3. **Shadow DOM** — Elements inside shadow roots may not be discoverable via standard snapshots. Use Playwright's `pierce` selector engine as a fallback.

4. **Element ref instability** — Refs change between snapshots. Don't store refs across navigation; re-snapshot after each page change.

5. **Rate limiting** — Agent-browser opens a real browser session. Avoid rapid-fire commands; include waits between interactions.

## See Also

- `pageobject-pattern.md` — How to structure generated page objects
- `playwright-selectors.md` — Selector resilience strategies
- `../SKILL.md` — Generation Mode 1 overview
