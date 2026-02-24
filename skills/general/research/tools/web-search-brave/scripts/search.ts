#!/usr/bin/env -S deno run --allow-env --allow-net=api.search.brave.com

/**
 * Web Search CLI - Brave Search API Integration
 *
 * A standalone CLI script for searching the web using Brave's Search API.
 * Provides web results with descriptions, extra snippets, and localization options.
 *
 * Usage:
 *   deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "query"
 *   deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "query" --freshness pw
 *   deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts "query" --country US --lang en
 *   # Or if executable: ./scripts/search.ts "query"
 *
 * Environment Variables:
 *   BRAVE_API_KEY - Required. Your Brave Search API key from https://brave.com/search/api/
 *
 * Permissions:
 *   --allow-env: Read BRAVE_API_KEY environment variable
 *   --allow-net=api.search.brave.com: Make API requests to Brave Search
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "search";
const API_BASE = "https://api.search.brave.com/res/v1/web/search";

// === Types ===
export interface BraveResult {
  title: string;
  url: string;
  description: string;
  extra_snippets?: string[];
  age?: string;
  language?: string;
  family_friendly?: boolean;
}

export interface BraveResponse {
  results: BraveResult[];
  query: string;
  response_time?: number;
  total_results?: number;
}

export interface SearchOptions {
  query: string;
  count?: number;
  freshness?: "pd" | "pw" | "pm" | "py";
  country?: string;
  searchLang?: string;
  safesearch?: "off" | "moderate" | "strict";
  extraSnippets?: boolean;
  offset?: number;
}

// === Core Logic ===
export async function braveSearch(options: SearchOptions): Promise<BraveResponse> {
  const apiKey = Deno.env.get("BRAVE_API_KEY");
  if (!apiKey) {
    throw new Error("BRAVE_API_KEY environment variable is not set");
  }

  const params = new URLSearchParams();
  params.set("q", options.query);
  params.set("count", String(options.count ?? 5));

  if (options.freshness) {
    params.set("freshness", options.freshness);
  }
  if (options.country) {
    params.set("country", options.country);
  }
  if (options.searchLang) {
    params.set("search_lang", options.searchLang);
  }
  if (options.safesearch) {
    params.set("safesearch", options.safesearch);
  }
  if (options.extraSnippets) {
    params.set("extra_snippets", "true");
  }
  if (options.offset !== undefined && options.offset > 0) {
    params.set("offset", String(options.offset));
  }

  const startTime = Date.now();

  const response = await fetch(`${API_BASE}?${params.toString()}`, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip",
      "X-Subscription-Token": apiKey,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid Brave Search API key");
    } else if (response.status === 429) {
      throw new Error("Brave Search API rate limit exceeded");
    } else if (response.status === 400) {
      throw new Error(`Bad request: ${errorText}`);
    }
    throw new Error(`Brave Search API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const endTime = Date.now();

  const webResults = data.web?.results ?? [];

  return {
    results: webResults.map((r: Record<string, unknown>) => ({
      title: (r.title as string) || "",
      url: (r.url as string) || "",
      description: (r.description as string) || "",
      extra_snippets: r.extra_snippets as string[] | undefined,
      age: r.age as string | undefined,
      language: r.language as string | undefined,
      family_friendly: r.family_friendly as boolean | undefined,
    })),
    query: options.query,
    response_time: endTime - startTime,
    total_results: data.web?.total_count,
  };
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Web search using Brave Search API

Usage:
  deno run --allow-env --allow-net=api.search.brave.com scripts/search.ts [options] "query"

Arguments:
  "query"                The search query (required)

Options:
  --results <n>          Number of results (default: 5, max: 20)
  --freshness <range>    Time filter: pd (day), pw (week), pm (month), py (year)
  --country <code>       Country code (e.g., US, GB, DE)
  --lang <code>          Search language (e.g., en, fr, de)
  --safesearch <level>   Safe search: off, moderate (default), strict
  --extra-snippets       Include extra content snippets
  --offset <n>           Pagination offset (default: 0)
  --json                 Output as JSON
  -h, --help             Show this help

Environment:
  BRAVE_API_KEY   Required. Get one at https://brave.com/search/api/

Examples:
  # Basic search
  ./scripts/search.ts "React hooks tutorial"

  # Search recent results from past week
  ./scripts/search.ts "AI announcements" --freshness pw

  # Localized search
  ./scripts/search.ts "local news" --country DE --lang de

  # Paginated search with extra snippets
  ./scripts/search.ts "Deno deploy" --results 10 --extra-snippets --json
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
    count: 5,
  };

  let outputJson = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--json") {
      outputJson = true;
    } else if (arg === "--extra-snippets") {
      options.extraSnippets = true;
    } else if (arg === "--results" && args[i + 1]) {
      options.count = Math.min(parseInt(args[++i], 10), 20);
    } else if (arg === "--freshness" && args[i + 1]) {
      options.freshness = args[++i] as "pd" | "pw" | "pm" | "py";
    } else if (arg === "--country" && args[i + 1]) {
      options.country = args[++i];
    } else if (arg === "--lang" && args[i + 1]) {
      options.searchLang = args[++i];
    } else if (arg === "--safesearch" && args[i + 1]) {
      options.safesearch = args[++i] as "off" | "moderate" | "strict";
    } else if (arg === "--offset" && args[i + 1]) {
      options.offset = parseInt(args[++i], 10);
    } else if (!arg.startsWith("--") && !arg.startsWith("-")) {
      options.query = arg;
    }
  }

  if (!options.query) {
    console.error("Error: No search query provided\n");
    printHelp();
    Deno.exit(1);
  }

  try {
    const result = await braveSearch(options);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\nSearch: "${result.query}"\n`);
      console.log(`Found ${result.results.length} results in ${result.response_time}ms\n`);

      for (const [i, r] of result.results.entries()) {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   ${r.url}`);
        console.log(`   ${r.description.slice(0, 200)}${r.description.length > 200 ? "..." : ""}`);
        if (r.age) {
          console.log(`   Age: ${r.age}`);
        }
        if (r.extra_snippets && r.extra_snippets.length > 0) {
          console.log(`   Extra snippets:`);
          for (const snippet of r.extra_snippets) {
            console.log(`     - ${snippet.slice(0, 150)}${snippet.length > 150 ? "..." : ""}`);
          }
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
