---
name: web-search-brave
description: "Search the web using Brave Search API for fast, privacy-respecting results with localization, freshness filtering, and extra snippets. Use when you need web search results with country/language targeting or time-based filtering. Requires BRAVE_API_KEY. Keywords: brave, web search, localized search, privacy search, freshness filtering."
license: MIT
compatibility: Requires BRAVE_API_KEY environment variable and internet access
metadata:
  author: agent-skills
  version: "1.0"
  type: utility
  mode: generative
  domain: research
---

# Web Search (Brave Search API)

Search the web using Brave's Search API. Returns web results with descriptions, optional extra snippets, and support for country/language targeting.

**Note:** This skill requires a Brave Search API key. For basic web search using the agent's built-in capability, see `web-search`. For AI-optimized results with relevance scores, see `web-search-tavily`.

## When to Use This Skill

Use this skill when:
- You need to find current information not in your training data
- The user asks about recent events, news, or updates
- You need localized search results for a specific country or language
- You want a privacy-respecting search alternative
- Research requires real-time web data
- Keywords mentioned: search, look up, find online, current, latest, news

Do NOT use this skill when:
- Information is already in your knowledge base and doesn't need verification
- The user asks about historical facts that don't change
- You're working with local files or code (use other tools)
- A more specific skill exists for the task (e.g., documentation lookup)
- You need AI-generated answer summaries (use `web-search-tavily` instead)

## Prerequisites

Before using this skill, ensure:
- **BRAVE_API_KEY** environment variable is set with a valid API key
- **Deno** is installed (for running the search script)
- **Internet access** is available

Get a Brave Search API key at: https://brave.com/search/api/

## Quick Start

Run a simple search:

```bash
deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "your search query"
```

Example with freshness filter:

```bash
deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "React 19 new features" --freshness pw
```

## Script Usage

```bash
deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts [options] "query"
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `--results <n>` | Number of results to return (max 20) | 5 |
| `--freshness <range>` | Time filter: `pd`, `pw`, `pm`, or `py` | none |
| `--country <code>` | Country code for localized results (e.g., US, GB, DE) | none |
| `--lang <code>` | Search language (e.g., en, fr, de) | none |
| `--safesearch <level>` | Safe search: `off`, `moderate`, or `strict` | moderate |
| `--extra-snippets` | Include additional content snippets | false |
| `--offset <n>` | Pagination offset | 0 |
| `--json` | Output as JSON (for programmatic use) | false |
| `--help` | Show help message | - |

## Search Parameters

### Freshness Values

Filter results by recency:
- **pd**: Past day (last 24 hours)
- **pw**: Past week (last 7 days)
- **pm**: Past month (last 30 days)
- **py**: Past year (last 365 days)

### Country Codes

Use standard 2-character country codes to get localized results:
- `US` (United States), `GB` (United Kingdom), `DE` (Germany), `FR` (France), `JP` (Japan), etc.

### Safe Search Levels

- **off**: No filtering
- **moderate** (default): Filters explicit content
- **strict**: Strictest filtering

## Output Format

### Human-Readable Output (default)

```
Search: "React 19 new features"

Found 5 results in 189ms

1. React 19 Release Notes
   https://react.dev/blog/2024/04/25/react-19
   React 19 is now available on npm! This release includes...
   Age: 2 months ago

2. What's New in React 19
   https://example.com/react-19-features
   A comprehensive overview of React 19's new features...
```

### JSON Output (--json)

```json
{
  "query": "React 19 new features",
  "results": [
    {
      "title": "React 19 Release Notes",
      "url": "https://react.dev/blog/2024/04/25/react-19",
      "description": "React 19 is now available on npm...",
      "age": "2 months ago",
      "language": "en",
      "family_friendly": true
    }
  ],
  "response_time": 189,
  "total_results": 1250000
}
```

### Result Fields

| Field | Type | Description |
|-------|------|-------------|
| `title` | string | Page title |
| `url` | string | Source URL |
| `description` | string | Relevant excerpt from the page |
| `extra_snippets` | string[] | Additional content snippets (only with --extra-snippets) |
| `age` | string | How old the result is (e.g., "2 hours ago") |
| `language` | string | Language of the result |
| `family_friendly` | boolean | Whether the result is family-friendly |

## Examples

### Example 1: Current Events Search

**Scenario**: Find recent news about a technology topic

```bash
scripts/search.ts "OpenAI GPT-5 announcement" --freshness pw --results 10
```

**Expected output**: Recent web results about GPT-5 from the past week

### Example 2: Documentation Lookup

**Scenario**: Find specific technical documentation

```bash
scripts/search.ts "Deno deploy edge functions tutorial" --results 10 --extra-snippets
```

**Expected output**: Comprehensive results with extra snippets from documentation and tutorial sites

### Example 3: Localized Search

**Scenario**: Find results targeted to a specific country and language

```bash
scripts/search.ts "aktuelle Nachrichten" --country DE --lang de --freshness pd
```

**Expected output**: German-language results from Germany from the past day

### Example 4: Filtered Search with JSON Output

**Scenario**: Get structured results with strict safe search

```bash
scripts/search.ts "machine learning tutorials" --safesearch strict --extra-snippets --json
```

**Expected output**: JSON results with extra snippets, filtered for safe content

## Common Issues and Solutions

### Issue: "BRAVE_API_KEY environment variable is not set"

**Symptoms**: Script exits immediately with API key error

**Solution**:
1. Get an API key from https://brave.com/search/api/
2. Set the environment variable:
   ```bash
   export BRAVE_API_KEY="your-api-key-here"
   ```
3. Or run with the variable inline:
   ```bash
   BRAVE_API_KEY="your-key" deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "query"
   ```

### Issue: "Invalid Brave Search API key"

**Symptoms**: 401 authentication error

**Solution**:
1. Verify your API key is correct (no extra spaces)
2. Check if your API key has expired
3. Verify your Brave Search API subscription is active

### Issue: "Brave Search API rate limit exceeded"

**Symptoms**: 429 error response

**Solution**:
1. Wait a moment and retry
2. Reduce request frequency
3. Consider upgrading your Brave Search API plan for higher limits

### Issue: No results returned

**Symptoms**: Empty results array

**Solution**:
1. Try broader search terms
2. Remove country or language filters that might be too restrictive
3. Remove or widen the freshness filter
4. Check if the topic exists online

## Limitations

This skill has the following limitations:
- Requires active internet connection
- API rate limits apply based on your Brave Search API plan
- Results depend on Brave's index coverage
- Cannot access paywalled or login-required content
- No built-in AI-generated answer summaries (use `web-search-tavily` for that)
- Maximum 20 results per request
- Extra snippets require a paid API plan

## Related Skills

- **web-search**: Basic web search using the agent's built-in capability
- **web-search-tavily**: AI-optimized search with relevance scores and answer summaries
- **research-workflow**: For comprehensive research projects that use multiple searches with planning and synthesis
