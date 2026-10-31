---
name: web-search-firecrawl
description: "Search the web using the Firecrawl API, and optionally get the full content of each result page as clean Markdown. Use when you need search results plus the text of the pages themselves, including JavaScript-rendered pages, or when you need domain or time filtering. Requires FIRECRAWL_API_KEY. Keywords: firecrawl, web search, scrape, page content, markdown, domain filtering."
license: MIT
compatibility: Requires FIRECRAWL_API_KEY environment variable and internet access
metadata:
  author: agent-skills
  version: "1.0"
  type: utility
  mode: generative
  domain: research
---

# Web Search (Firecrawl API)

Search the web using Firecrawl's search API. Returns titles, URLs and descriptions, and with `--scrape` it also returns the full content of each result page as Markdown, so the agent can read the sources instead of relying on short snippets.

**Note:** This skill requires a Firecrawl API key. For basic web search using the agent's built-in capability, see `web-search`.

## When to Use This Skill

Use this skill when:
- You need to find current information not in your training data
- You need to read the full text of the pages a search returns, not only snippets
- Source pages are JavaScript-rendered and come back empty or partial with a plain fetch
- You need to limit results to specific domains or a recent time range
- Keywords mentioned: search, look up, find online, read the page, full article, scrape

Do NOT use this skill when:
- Information is already in your knowledge base and doesn't need verification
- The user asks about historical facts that don't change
- You're working with local files or code (use other tools)
- A more specific skill exists for the task (e.g., documentation lookup)

## Prerequisites

Before using this skill, ensure:
- **FIRECRAWL_API_KEY** environment variable is set with a valid API key
- **Deno** is installed (for running the search script)
- **Internet access** is available

Get a free Firecrawl API key at: https://www.firecrawl.dev/app/api-keys?utm_source=jwynia-agent-skills&utm_medium=integration

## Quick Start

Run a simple search:

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "your search query"
```

Example with the full page content of each result:

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "Deno 2 release notes" --scrape --results 3 --json
```

## Script Usage

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts [options] "query"
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--results <n>` | Number of results to return | 5 |
| `--time <range>` | Time filter: `day`, `week`, `month`, or `year` | none |
| `--include <domains>` | Only include these domains (comma-separated) | none |
| `--exclude <domains>` | Exclude these domains (comma-separated) | none |
| `--scrape` | Include the full page content of each result as Markdown | false |
| `--json` | Output as JSON (for programmatic use) | false |
| `--help` | Show help message | - |

## Search Parameters

### Page Content (--scrape)

Without `--scrape`, each result has a title, URL and short description. With `--scrape`, Firecrawl also loads each result page (rendering JavaScript where needed) and returns its main content as Markdown in the `markdown` field. Use it when the answer has to come from the source text, for example when checking a quote, a number or a changelog entry.

Search costs 2 Firecrawl credits per 10 results, rounded up. Each scraped page adds 1 credit, and a PDF result adds 1 credit per PDF page, so one long report can cost more than the search itself. Keep `--results` small when using `--scrape`.

### Time Range

Filter results by recency:
- **day**: Last 24 hours
- **week**: Last 7 days
- **month**: Last 30 days
- **year**: Last 365 days

### Domain Filtering

Control which sites appear in results:

```bash
# Only search official sources
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "world population 2024" --include un.org,worldbank.org

# Exclude social media
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "AI news" --exclude twitter.com,reddit.com
```

## Output Format

### Human-Readable Output (default)

```
Search: "Deno 2 new features"

Found 5 results in 883ms

1. Deno, the drop-in JavaScript runtime for Node developers
   https://deno.com/
   A drop-in JavaScript runtime with built-in TypeScript, npm support, and security by default. Run your existing Node project on Deno with no setup.

...

5. Deno 2 is coming... What is it and should you use it? - YouTube
   https://www.youtube.com/watch?v=hsAMAGgAXL8
   The key features of Deno 2 · Performance enhancements and new capabilities · How Deno compares to Node.js and other runtime environments · Real- ...
```

With `--scrape`, each result also shows how much page content came back. Use `--json` to get the content itself.

### JSON Output (--json)

```json
{
  "results": [
    {
      "title": "Announcing Deno 2",
      "url": "https://deno.com/blog/v2.0",
      "content": "# Announcing Deno 2 ...",
      "markdown": "... full page content as Markdown ..."
    }
  ],
  "query": "Deno 2 release notes",
  "credits_used": 5,
  "response_time": 1736
}
```

### Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title |
| `url` | string | Source URL |
| `content` | string | Description or excerpt from the page |
| `markdown` | string | Full page content as Markdown (only with --scrape) |

## Examples

### Example 1: Read the Sources, Not Just Snippets

**Scenario**: Answer a question from the release notes themselves

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "Deno 2 release notes" --scrape --results 3 --json
```

**Expected output**: Three results, each with the page's main content as Markdown

### Example 2: Documentation Lookup

**Scenario**: Find specific technical documentation

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "Deno deploy edge functions tutorial" --include deno.com,docs.deno.com --results 10
```

**Expected output**: Results from the Deno documentation and blog only

### Example 3: Fact Verification

**Scenario**: Verify a specific claim or statistic

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "world population 2024" --include un.org,worldbank.org --json
```

**Expected output**: JSON results from authoritative sources for programmatic verification

### Example 4: Recent Coverage

**Scenario**: Find what was published about a topic this week

```bash
deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "AI announcements" --time week
```

**Expected output**: Results published in the last 7 days

## Common Issues and Solutions

### Issue: "FIRECRAWL_API_KEY environment variable is not set"

**Symptoms**: Script exits immediately with API key error

**Solution**:
1. Get an API key from https://www.firecrawl.dev/app/api-keys?utm_source=jwynia-agent-skills&utm_medium=integration
2. Set the environment variable:
   ```bash
   export FIRECRAWL_API_KEY="fc-your-api-key-here"
   ```
3. Or run with the variable inline:
   ```bash
   FIRECRAWL_API_KEY="fc-your-key" deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "query"
   ```

### Issue: "Invalid Firecrawl API key"

**Symptoms**: 401 authentication error

**Solution**:
1. Verify your API key is correct (no extra spaces)
2. Check that the key hasn't been deleted in your Firecrawl dashboard

### Issue: "Firecrawl account is out of credits"

**Symptoms**: 402 error response

**Solution**:
1. Check your remaining credits in the Firecrawl dashboard
2. Drop `--scrape` or lower `--results` to use fewer credits per search

### Issue: "Firecrawl API rate limit exceeded"

**Symptoms**: 429 error response

**Solution**:
1. Wait a moment and retry
2. Reduce request frequency

### Issue: No results returned

**Symptoms**: Empty results array

**Solution**:
1. Try broader search terms
2. Remove domain or time filters that might be too restrictive

## Limitations

This skill has the following limitations:
- Requires active internet connection
- API rate limits and credits apply based on your Firecrawl plan
- `--scrape` uses more credits and takes longer than a plain search
- Scraped pages can run past 100,000 characters each, so write `--json` output to a file when using `--scrape`
- Cannot access paywalled content

## Related Skills

- **web-search**: Built-in web search with no API key
- **research-workflow**: For research projects that use multiple searches with planning and synthesis
