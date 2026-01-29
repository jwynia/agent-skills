---
name: web-search
description: "Search the web using the agent's built-in WebSearch tool. Use when you need to find current information, verify facts, or research topics. No API key required. Keywords: search, web, internet, lookup, find, research, current events, facts."
license: MIT
compatibility: Works with any agent that has WebSearch capability
metadata:
  author: jwynia
  version: "1.0"
---

# Web Search

Search the web using the agent's built-in WebSearch capability. No external API keys required.

## When to Use This Skill

Use this skill when:
- You need to find current information not in your training data
- The user asks about recent events, news, or updates
- You need to verify facts or find sources
- Research requires real-time web data

Do NOT use this skill when:
- Information is already in your knowledge base
- You're working with local files or code
- You need advanced filtering (use `web-search-tavily` instead)
- A more specific research skill applies

## How to Search

Use the agent's built-in **WebSearch** tool directly. The tool accepts a query string and returns relevant web results.

### Basic Search

Simply invoke WebSearch with your query:

```
Query: "React 19 new features"
```

### Effective Query Strategies

**Be specific and include context:**
- Bad: "react hooks"
- Good: "React 19 useActionState hook tutorial"

**Include the year for current information:**
- Bad: "best TypeScript practices"
- Good: "TypeScript best practices 2025"

**Use domain-specific terms:**
- Bad: "how to make website fast"
- Good: "web performance optimization Core Web Vitals"

### When to Search Multiple Times

Search iteratively when:
1. Initial results are too broad → Refine with more specific terms
2. Looking for multiple perspectives → Search different phrasings
3. Verifying facts → Search for corroborating sources
4. Deep research → Start broad, then drill into specifics

## Output Handling

After receiving search results:

1. **Cite sources** - Always include URLs when sharing information
2. **Synthesize** - Combine information from multiple results
3. **Verify** - Cross-reference claims across sources
4. **Date-check** - Note publication dates for time-sensitive information

### Source Attribution Format

When sharing information from search results:

```
According to [Source Name](URL), ...

Sources:
- [Title 1](url1)
- [Title 2](url2)
```

## Limitations

- Results depend on the agent's WebSearch implementation
- Cannot access paywalled or login-required content
- May not have the most recent information (depends on indexing)
- No domain filtering or relevance scoring (use `web-search-tavily` for these features)

## Related Skills

- **web-search-tavily** - Advanced search with API key, domain filtering, and relevance scores
- **research-workflow** - Structured research with planning and synthesis
- **fact-check** - Verify specific claims against sources
- **claim-investigation** - Investigate viral claims and social media content
