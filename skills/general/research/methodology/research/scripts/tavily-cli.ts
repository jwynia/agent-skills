/**
 * Tavily Search CLI
 *
 * A standalone CLI script for searching the web using Tavily's AI-optimized search API.
 * Provides high-quality results optimized for LLM consumption.
 *
 * Usage:
 *   deno run --allow-net --allow-env tavily-cli.ts "your search query"
 *   deno run --allow-net --allow-env tavily-cli.ts "your search query" --answer
 *   deno run --allow-net --allow-env tavily-cli.ts "your search query" --depth advanced
 *
 * Requires: TAVILY_API_KEY environment variable
 */

interface TavilyResult {
  title: string;
  url: string;
  content: string;
  score?: number;
  published_date?: string;
  raw_content?: string;
}

interface TavilyResponse {
  results: TavilyResult[];
  answer?: string;
  query: string;
  response_time?: number;
}

interface SearchOptions {
  query: string;
  maxResults?: number;
  topic?: "general" | "news" | "finance";
  includeAnswer?: boolean;
  includeRawContent?: boolean;
  searchDepth?: "basic" | "advanced";
  timeRange?: "day" | "week" | "month" | "year";
  days?: number;
  includeDomains?: string[];
  excludeDomains?: string[];
}

async function tavilySearch(options: SearchOptions): Promise<TavilyResponse> {
  const apiKey = Deno.env.get("TAVILY_API_KEY");
  if (!apiKey) {
    throw new Error("TAVILY_API_KEY environment variable is not set");
  }

  const requestBody: Record<string, unknown> = {
    query: options.query,
    max_results: options.maxResults ?? 5,
    topic: options.topic ?? "general",
    include_answer: options.includeAnswer ?? false,
    include_raw_content: options.includeRawContent ?? false,
    search_depth: options.searchDepth ?? "basic",
  };

  if (options.timeRange) {
    requestBody.time_range = options.timeRange;
  }
  if (options.topic === "news" && options.days !== undefined) {
    requestBody.days = options.days;
  }
  if (options.includeDomains && options.includeDomains.length > 0) {
    requestBody.include_domains = options.includeDomains;
  }
  if (options.excludeDomains && options.excludeDomains.length > 0) {
    requestBody.exclude_domains = options.excludeDomains;
  }

  const startTime = Date.now();

  const response = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      api_key: apiKey,
      ...requestBody,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    if (response.status === 401) {
      throw new Error("Invalid Tavily API key");
    } else if (response.status === 429) {
      throw new Error("Tavily API rate limit exceeded");
    } else if (response.status === 400) {
      throw new Error(`Bad request: ${errorText}`);
    }
    throw new Error(`Tavily API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const endTime = Date.now();

  return {
    results: data.results?.map((r: TavilyResult) => ({
      title: r.title || "",
      url: r.url || "",
      content: r.content || "",
      score: r.score,
      published_date: r.published_date,
      raw_content: r.raw_content,
    })) || [],
    answer: data.answer,
    query: data.query || options.query,
    response_time: endTime - startTime,
  };
}

function printHelp() {
  console.log(`
Tavily Search CLI - AI-optimized web search

Usage:
  deno run --allow-net --allow-env tavily-cli.ts "search query" [options]

Options:
  --answer           Include AI-generated answer summary
  --depth <level>    Search depth: basic (default) or advanced
  --results <n>      Number of results (default: 5)
  --topic <type>     Topic: general (default), news, or finance
  --time <range>     Time filter: day, week, month, or year
  --include <domain> Only include these domains (comma-separated)
  --exclude <domain> Exclude these domains (comma-separated)
  --raw              Include raw page content
  --json             Output as JSON
  --help             Show this help

Examples:
  deno run --allow-net --allow-env tavily-cli.ts "Hono framework Deno setup"
  deno run --allow-net --allow-env tavily-cli.ts "latest AI news" --topic news --time week
  deno run --allow-net --allow-env tavily-cli.ts "React best practices" --answer --depth advanced

Environment:
  TAVILY_API_KEY     Required. Get one at https://tavily.com
`);
}

// Main CLI
if (import.meta.main) {
  const args = Deno.args;

  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  const options: SearchOptions = {
    query: "",
    maxResults: 5,
    topic: "general",
    includeAnswer: false,
    includeRawContent: false,
    searchDepth: "basic",
  };

  let outputJson = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--answer") {
      options.includeAnswer = true;
    } else if (arg === "--raw") {
      options.includeRawContent = true;
    } else if (arg === "--json") {
      outputJson = true;
    } else if (arg === "--depth" && args[i + 1]) {
      options.searchDepth = args[++i] as "basic" | "advanced";
    } else if (arg === "--results" && args[i + 1]) {
      options.maxResults = parseInt(args[++i], 10);
    } else if (arg === "--topic" && args[i + 1]) {
      options.topic = args[++i] as "general" | "news" | "finance";
    } else if (arg === "--time" && args[i + 1]) {
      options.timeRange = args[++i] as "day" | "week" | "month" | "year";
    } else if (arg === "--include" && args[i + 1]) {
      options.includeDomains = args[++i].split(",");
    } else if (arg === "--exclude" && args[i + 1]) {
      options.excludeDomains = args[++i].split(",");
    } else if (!arg.startsWith("--")) {
      options.query = arg;
    }
  }

  if (!options.query) {
    console.error("Error: No search query provided");
    printHelp();
    Deno.exit(1);
  }

  try {
    const result = await tavilySearch(options);

    if (outputJson) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`\n🔍 Search: "${result.query}"\n`);
      console.log(`Found ${result.results.length} results in ${result.response_time}ms\n`);

      if (result.answer) {
        console.log("📝 AI Answer:");
        console.log("─".repeat(60));
        console.log(result.answer);
        console.log("─".repeat(60));
        console.log();
      }

      for (const [i, r] of result.results.entries()) {
        console.log(`${i + 1}. ${r.title}`);
        console.log(`   ${r.url}`);
        console.log(`   ${r.content.slice(0, 200)}${r.content.length > 200 ? "..." : ""}`);
        if (r.score) {
          console.log(`   Score: ${r.score.toFixed(3)}`);
        }
        console.log();
      }
    }
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    Deno.exit(1);
  }
}

export { tavilySearch, type SearchOptions, type TavilyResponse, type TavilyResult };
