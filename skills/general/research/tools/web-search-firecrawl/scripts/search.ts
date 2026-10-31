#!/usr/bin/env -S deno run --allow-env --allow-net=api.firecrawl.dev

/**
 * Web Search CLI - Firecrawl API Integration
 *
 * A standalone CLI script for searching the web using Firecrawl's search API.
 * Can also return the full content of each result page as clean Markdown.
 *
 * Usage:
 *   deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "query"
 *   deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "query" --scrape
 *   # Or if executable: ./scripts/search.ts "query"
 *
 * Environment Variables:
 *   FIRECRAWL_API_KEY - Required. Get a free key at https://www.firecrawl.dev/app/api-keys?utm_source=jwynia-agent-skills&utm_medium=integration
 *
 * Permissions:
 *   --allow-env: Read FIRECRAWL_API_KEY environment variable
 *   --allow-net=api.firecrawl.dev: Make API requests to Firecrawl
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "search";
const ORIGIN = "jwynia-agent-skills";

const TIME_RANGES: Record<string, string> = {
  day: "qdr:d",
  week: "qdr:w",
  month: "qdr:m",
  year: "qdr:y",
};

// === Types ===
export interface FirecrawlResult {
  title: string;
  url: string;
  content: string;
  markdown?: string;
}

export interface FirecrawlResponse {
  results: FirecrawlResult[];
  query: string;
  credits_used?: number;
  response_time?: number;
}

export interface SearchOptions {
  query: string;
  maxResults?: number;
  timeRange?: "day" | "week" | "month" | "year";
  includeDomains?: string[];
  excludeDomains?: string[];
  scrape?: boolean;
}

interface FirecrawlRawResult {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
  metadata?: { title?: string; sourceURL?: string; url?: string };
}

// === Core Logic ===
export async function firecrawlSearch(options: SearchOptions): Promise<FirecrawlResponse> {
  const apiKey = Deno.env.get("FIRECRAWL_API_KEY");
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY environment variable is not set");
  }

  const requestBody: Record<string, unknown> = {
    query: options.query,
    limit: options.maxResults ?? 5,
    sources: [{ type: "web" }],
    origin: ORIGIN,
  };

  if (options.timeRange) {
    requestBody.tbs = TIME_RANGES[options.timeRange];
  }
  if (options.includeDomains && options.includeDomains.length > 0) {
    requestBody.includeDomains = options.includeDomains;
  }
  if (options.excludeDomains && options.excludeDomains.length > 0) {
    requestBody.excludeDomains = options.excludeDomains;
  }
  if (options.scrape) {
    requestBody.scrapeOptions = { formats: ["markdown"], onlyMainContent: true };
  }

  const startTime = Date.now();

  const response = await fetch("https://api.firecrawl.dev/v2/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid Firecrawl API key");
    } else if (response.status === 402) {
      throw new Error("Firecrawl account is out of credits");
    } else if (response.status === 429) {
      throw new Error("Firecrawl API rate limit exceeded");
    } else if (response.status === 400) {
      throw new Error(`Bad request: ${errorText}`);
    }
    throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const endTime = Date.now();
  const items: FirecrawlRawResult[] = data.data?.web ?? [];

  return {
    results: items.map((r) => ({
      title: r.title || r.metadata?.title || "",
      url: r.url || r.metadata?.sourceURL || r.metadata?.url || "",
      content: r.description || "",
      markdown: r.markdown,
    })),
    query: options.query,
    credits_used: data.creditsUsed,
    response_time: endTime - startTime,
  };
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Web search using Firecrawl API

Usage:
  deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts [options] "query"

Arguments:
  "query"          The search query (required)

Options:
  --results <n>    Number of results (default: 5)
  --time <range>   Time filter: day, week, month, or year
  --include <dom>  Only include these domains (comma-separated)
  --exclude <dom>  Exclude these domains (comma-separated)
  --scrape         Include the full page content of each result as Markdown
  --json           Output as JSON
  -h, --help       Show this help

Environment:
  FIRECRAWL_API_KEY  Required. Get a free key at https://www.firecrawl.dev/app/api-keys?utm_source=jwynia-agent-skills&utm_medium=integration

Examples:
  # Basic search
  deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "React hooks tutorial"

  # Search and read the full content of each result
  deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "Deno 2 release notes" --scrape --results 3

  # Results from the last week
  deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "AI announcements" --time week

  # Only search specific domains
  deno run --allow-env --allow-net=api.firecrawl.dev scripts/search.ts "Deno deploy" --include deno.com,docs.deno.com
`);
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  const options: SearchOptions = {
    query: "",
    maxResults: 5,
    scrape: false,
  };

  let outputJson = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--scrape") {
      options.scrape = true;
    } else if (arg === "--json") {
      outputJson = true;
    } else if (arg === "--results" && args[i + 1]) {
      options.maxResults = parseInt(args[++i], 10);
    } else if (arg === "--time" && args[i + 1]) {
      options.timeRange = args[++i] as "day" | "week" | "month" | "year";
    } else if (arg === "--include" && args[i + 1]) {
      options.includeDomains = args[++i].split(",");
    } else if (arg === "--exclude" && args[i + 1]) {
      options.excludeDomains = args[++i].split(",");
    } else if (!arg.startsWith("--") && !arg.startsWith("-")) {
      options.query = arg;
    }
  }

  if (!options.query) {
    console.error("Error: No search query provided\n");
    printHelp();
    Deno.exit(1);
  }

  if (options.timeRange && !(options.timeRange in TIME_RANGES)) {
    console.error("Error: --time must be day, week, month, or year");
    Deno.exit(1);
  }

  try {
    const result = await firecrawlSearch(options);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nSearch: "${result.query}"\n`);
      console.log(`Found ${result.results.length} results in ${result.response_time}ms\n`);

      for (const [i, r] of result.results.entries()) {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   ${r.url}`);
        const snippet = r.content.replace(/\s+/g, " ").trim();
        console.log(`   ${snippet.slice(0, 200)}${snippet.length > 200 ? "..." : ""}`);
        if (r.markdown) {
          console.log(`   Page content: ${r.markdown.length} characters of Markdown (use --json)`);
        }
        console.log();
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
