#!/usr/bin/env -S deno run --allow-read

/**
 * Cache Strategy Advisor
 *
 * Recommends caching strategies based on app type and resource inventory.
 * Uses decision matrix from caching-strategies.json.
 *
 * Usage:
 *   deno run --allow-read cache-strategy-advisor.ts --app-type content-heavy
 *   deno run --allow-read cache-strategy-advisor.ts --app-type app-like
 *   deno run --allow-read cache-strategy-advisor.ts --resources resources.json
 */

// === INTERFACES ===

type AppType = "content-heavy" | "app-like" | "data-intensive" | "hybrid";
type CachingStrategy = "cache-first" | "network-first" | "stale-while-revalidate" | "network-only" | "cache-only";
type ResourceType = "html" | "css" | "js" | "images" | "fonts" | "api" | "video" | "audio" | "documents" | "third-party";

interface ResourceEntry {
  path: string;
  type: ResourceType;
  changeFrequency?: "never" | "rarely" | "sometimes" | "often" | "always";
  size?: "small" | "medium" | "large";
  critical?: boolean;
}

interface StrategyRecommendation {
  resourceType: ResourceType;
  strategy: CachingStrategy;
  cacheName: string;
  maxAge?: number;
  maxEntries?: number;
  reasoning: string;
}

interface AppTypeProfile {
  description: string;
  defaultStrategies: Record<ResourceType, CachingStrategy>;
  precacheRecommendation: string[];
  notes: string[];
}

// === DECISION MATRIX ===

const APP_TYPE_PROFILES: Record<AppType, AppTypeProfile> = {
  "content-heavy": {
    description: "Blogs, news sites, documentation - content changes but should be readable offline",
    defaultStrategies: {
      html: "network-first",
      css: "stale-while-revalidate",
      js: "stale-while-revalidate",
      images: "cache-first",
      fonts: "cache-first",
      api: "network-first",
      video: "cache-first",
      audio: "cache-first",
      documents: "cache-first",
      "third-party": "stale-while-revalidate",
    },
    precacheRecommendation: ["app shell", "critical CSS", "fonts", "logo"],
    notes: [
      "Use stale-while-revalidate for articles - fast load, eventual freshness",
      "Cache images aggressively with expiration",
      "Consider offline reading list feature",
    ],
  },
  "app-like": {
    description: "SPAs, dashboards, tools - app shell is stable, data is dynamic",
    defaultStrategies: {
      html: "cache-first",
      css: "cache-first",
      js: "cache-first",
      images: "cache-first",
      fonts: "cache-first",
      api: "network-first",
      video: "network-only",
      audio: "network-only",
      documents: "network-first",
      "third-party": "stale-while-revalidate",
    },
    precacheRecommendation: ["index.html", "app shell", "all JS bundles", "all CSS", "fonts", "icons"],
    notes: [
      "Precache the entire app shell for instant load",
      "API calls should be network-first with offline fallback",
      "Consider IndexedDB for offline data persistence",
    ],
  },
  "data-intensive": {
    description: "Forms, CRMs, data entry - user actions must work offline",
    defaultStrategies: {
      html: "cache-first",
      css: "cache-first",
      js: "cache-first",
      images: "cache-first",
      fonts: "cache-first",
      api: "network-first",
      video: "network-only",
      audio: "network-only",
      documents: "stale-while-revalidate",
      "third-party": "network-first",
    },
    precacheRecommendation: ["app shell", "form templates", "validation logic"],
    notes: [
      "Implement Background Sync for offline form submissions",
      "Use IndexedDB to queue offline actions",
      "Show sync status indicator to users",
      "Design conflict resolution strategy",
    ],
  },
  "hybrid": {
    description: "Mix of content and functionality - balance freshness and availability",
    defaultStrategies: {
      html: "stale-while-revalidate",
      css: "stale-while-revalidate",
      js: "stale-while-revalidate",
      images: "cache-first",
      fonts: "cache-first",
      api: "network-first",
      video: "cache-first",
      audio: "cache-first",
      documents: "stale-while-revalidate",
      "third-party": "stale-while-revalidate",
    },
    precacheRecommendation: ["critical path only", "offline fallback page"],
    notes: [
      "Use route-specific strategies",
      "Identify critical vs. nice-to-have offline content",
      "Consider lazy-caching for secondary content",
    ],
  },
};

const STRATEGY_DETAILS: Record<CachingStrategy, { description: string; tradeoffs: string; workboxClass: string }> = {
  "cache-first": {
    description: "Check cache first, fall back to network",
    tradeoffs: "Fast but may serve stale content",
    workboxClass: "CacheFirst",
  },
  "network-first": {
    description: "Try network first, fall back to cache",
    tradeoffs: "Fresh but slower, requires network for best experience",
    workboxClass: "NetworkFirst",
  },
  "stale-while-revalidate": {
    description: "Return cache immediately, update in background",
    tradeoffs: "Fast AND eventually fresh, but first view may be stale",
    workboxClass: "StaleWhileRevalidate",
  },
  "network-only": {
    description: "Always fetch from network",
    tradeoffs: "Always fresh but fails offline",
    workboxClass: "NetworkOnly",
  },
  "cache-only": {
    description: "Only serve from cache",
    tradeoffs: "Fast and reliable but never updates",
    workboxClass: "CacheOnly",
  },
};

const RESOURCE_TYPE_DEFAULTS: Record<ResourceType, { cacheName: string; maxAge: number; maxEntries: number }> = {
  html: { cacheName: "pages-cache", maxAge: 60 * 60, maxEntries: 50 },
  css: { cacheName: "static-cache", maxAge: 60 * 60 * 24 * 30, maxEntries: 30 },
  js: { cacheName: "static-cache", maxAge: 60 * 60 * 24 * 30, maxEntries: 30 },
  images: { cacheName: "image-cache", maxAge: 60 * 60 * 24 * 30, maxEntries: 100 },
  fonts: { cacheName: "font-cache", maxAge: 60 * 60 * 24 * 365, maxEntries: 10 },
  api: { cacheName: "api-cache", maxAge: 60 * 5, maxEntries: 50 },
  video: { cacheName: "media-cache", maxAge: 60 * 60 * 24 * 7, maxEntries: 20 },
  audio: { cacheName: "media-cache", maxAge: 60 * 60 * 24 * 7, maxEntries: 20 },
  documents: { cacheName: "document-cache", maxAge: 60 * 60 * 24, maxEntries: 30 },
  "third-party": { cacheName: "external-cache", maxAge: 60 * 60 * 24, maxEntries: 20 },
};

// === ANALYSIS ===

function analyzeAppType(appType: AppType): void {
  const profile = APP_TYPE_PROFILES[appType];

  console.log(`\n=== Cache Strategy Recommendations ===`);
  console.log(`\nApp Type: ${appType}`);
  console.log(`Description: ${profile.description}\n`);

  console.log("Resource Strategies:");
  console.log("-".repeat(70));

  const resourceTypes: ResourceType[] = ["html", "css", "js", "images", "fonts", "api", "video", "audio", "documents", "third-party"];

  for (const resourceType of resourceTypes) {
    const strategy = profile.defaultStrategies[resourceType];
    const details = STRATEGY_DETAILS[strategy];
    const defaults = RESOURCE_TYPE_DEFAULTS[resourceType];

    console.log(`\n${resourceType.toUpperCase()}`);
    console.log(`  Strategy: ${strategy}`);
    console.log(`  ${details.description}`);
    console.log(`  Cache: ${defaults.cacheName}, max ${defaults.maxEntries} entries, ${formatAge(defaults.maxAge)}`);
  }

  console.log("\n" + "-".repeat(70));
  console.log("\nPrecache Recommendations:");
  profile.precacheRecommendation.forEach(item => console.log(`  - ${item}`));

  console.log("\nNotes:");
  profile.notes.forEach(note => console.log(`  - ${note}`));

  console.log("\n" + "-".repeat(70));
  generateWorkboxConfig(appType);
}

function analyzeResources(resources: ResourceEntry[]): void {
  console.log(`\n=== Resource-Specific Recommendations ===\n`);
  console.log(`Analyzing ${resources.length} resources...\n`);

  const recommendations: StrategyRecommendation[] = [];

  for (const resource of resources) {
    const recommendation = recommendStrategy(resource);
    recommendations.push(recommendation);
  }

  // Group by strategy
  const byStrategy = new Map<CachingStrategy, StrategyRecommendation[]>();
  for (const rec of recommendations) {
    const existing = byStrategy.get(rec.strategy) || [];
    existing.push(rec);
    byStrategy.set(rec.strategy, existing);
  }

  for (const [strategy, recs] of byStrategy) {
    const details = STRATEGY_DETAILS[strategy];
    console.log(`\n${strategy.toUpperCase()}`);
    console.log(`  ${details.description}`);
    console.log(`  Resources:`);
    for (const rec of recs) {
      console.log(`    - ${rec.resourceType}: ${rec.reasoning}`);
    }
  }
}

function recommendStrategy(resource: ResourceEntry): StrategyRecommendation {
  const defaults = RESOURCE_TYPE_DEFAULTS[resource.type];
  let strategy: CachingStrategy;
  let reasoning: string;

  // Decision logic based on change frequency and criticality
  if (resource.changeFrequency === "never" || resource.changeFrequency === "rarely") {
    strategy = "cache-first";
    reasoning = "Rarely changes, prioritize speed";
  } else if (resource.changeFrequency === "always") {
    strategy = "network-only";
    reasoning = "Always needs fresh data";
  } else if (resource.critical) {
    strategy = "stale-while-revalidate";
    reasoning = "Critical resource, balance speed and freshness";
  } else if (resource.type === "api") {
    strategy = "network-first";
    reasoning = "API data should be fresh when possible";
  } else if (resource.size === "large") {
    strategy = "cache-first";
    reasoning = "Large resource, avoid repeated downloads";
  } else {
    strategy = "stale-while-revalidate";
    reasoning = "Default balanced approach";
  }

  return {
    resourceType: resource.type,
    strategy,
    cacheName: defaults.cacheName,
    maxAge: defaults.maxAge,
    maxEntries: defaults.maxEntries,
    reasoning,
  };
}

function formatAge(seconds: number): string {
  if (seconds >= 60 * 60 * 24 * 365) {
    return `${Math.round(seconds / (60 * 60 * 24 * 365))} year(s)`;
  } else if (seconds >= 60 * 60 * 24) {
    return `${Math.round(seconds / (60 * 60 * 24))} day(s)`;
  } else if (seconds >= 60 * 60) {
    return `${Math.round(seconds / (60 * 60))} hour(s)`;
  } else if (seconds >= 60) {
    return `${Math.round(seconds / 60)} minute(s)`;
  }
  return `${seconds} seconds`;
}

function generateWorkboxConfig(appType: AppType): void {
  const profile = APP_TYPE_PROFILES[appType];

  console.log("\nWorkbox Configuration:");
  console.log("```javascript");
  console.log("// workbox-config.js or vite.config.ts runtimeCaching");
  console.log("runtimeCaching: [");

  const routes: Array<{ pattern: string; handler: string; cacheName: string; maxEntries: number; maxAge: number }> = [
    { pattern: "/*.html", handler: STRATEGY_DETAILS[profile.defaultStrategies.html].workboxClass, cacheName: "pages-cache", maxEntries: 50, maxAge: 3600 },
    { pattern: "/*.{css,js}", handler: STRATEGY_DETAILS[profile.defaultStrategies.css].workboxClass, cacheName: "static-cache", maxEntries: 60, maxAge: 2592000 },
    { pattern: "/*.{png,jpg,jpeg,svg,gif,webp}", handler: STRATEGY_DETAILS[profile.defaultStrategies.images].workboxClass, cacheName: "image-cache", maxEntries: 100, maxAge: 2592000 },
    { pattern: "/*.{woff,woff2,ttf,eot}", handler: STRATEGY_DETAILS[profile.defaultStrategies.fonts].workboxClass, cacheName: "font-cache", maxEntries: 10, maxAge: 31536000 },
    { pattern: "/api/*", handler: STRATEGY_DETAILS[profile.defaultStrategies.api].workboxClass, cacheName: "api-cache", maxEntries: 50, maxAge: 300 },
  ];

  for (const route of routes) {
    console.log(`  {`);
    console.log(`    urlPattern: new RegExp('${route.pattern.replace(/\*/g, ".*")}'),`);
    console.log(`    handler: '${route.handler}',`);
    console.log(`    options: {`);
    console.log(`      cacheName: '${route.cacheName}',`);
    console.log(`      expiration: {`);
    console.log(`        maxEntries: ${route.maxEntries},`);
    console.log(`        maxAgeSeconds: ${route.maxAge}`);
    console.log(`      }`);
    console.log(`    }`);
    console.log(`  },`);
  }

  console.log("]");
  console.log("```");
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): { appType?: AppType; resourcesFile?: string; json?: boolean } {
  let appType: AppType | undefined;
  let resourcesFile: string | undefined;
  let json = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;
      case "--app-type":
      case "-t":
        appType = nextArg as AppType;
        i++;
        break;
      case "--resources":
      case "-r":
        resourcesFile = nextArg;
        i++;
        break;
      case "--json":
        json = true;
        break;
    }
  }

  return { appType, resourcesFile, json };
}

function printHelp(): void {
  console.log(`
Cache Strategy Advisor

Recommend caching strategies based on app type or resource inventory.

USAGE:
  cache-strategy-advisor.ts [OPTIONS]

OPTIONS:
  --app-type, -t <type>     App type for strategy recommendations:
                            content-heavy, app-like, data-intensive, hybrid

  --resources, -r <file>    JSON file with resource inventory

  --json                    Output as JSON (for automation)

  --help, -h                Show this help

APP TYPES:
  content-heavy      Blogs, news, docs - readable offline
  app-like           SPAs, dashboards - stable shell, dynamic data
  data-intensive     Forms, CRMs - offline actions must work
  hybrid             Mix of content and functionality

RESOURCE FILE FORMAT:
  [
    {
      "path": "/api/users",
      "type": "api",
      "changeFrequency": "often",
      "critical": true
    },
    {
      "path": "/images/*.png",
      "type": "images",
      "changeFrequency": "rarely",
      "size": "large"
    }
  ]

  Types: html, css, js, images, fonts, api, video, audio, documents, third-party
  Change Frequency: never, rarely, sometimes, often, always
  Size: small, medium, large

EXAMPLES:
  # Get recommendations for a content-heavy site
  cache-strategy-advisor.ts --app-type content-heavy

  # Analyze specific resources
  cache-strategy-advisor.ts --resources resources.json

  # Output as JSON
  cache-strategy-advisor.ts --app-type app-like --json
`);
}

// === MAIN ===

async function main(): Promise<void> {
  const { appType, resourcesFile, json } = parseArgs(Deno.args);

  if (!appType && !resourcesFile) {
    console.log("Specify --app-type or --resources. Use --help for options.");
    Deno.exit(1);
  }

  if (resourcesFile) {
    try {
      const content = await Deno.readTextFile(resourcesFile);
      const resources: ResourceEntry[] = JSON.parse(content);

      if (json) {
        const recommendations = resources.map(r => recommendStrategy(r));
        console.log(JSON.stringify(recommendations, null, 2));
      } else {
        analyzeResources(resources);
      }
    } catch (error) {
      console.error(`Error reading resources file: ${error}`);
      Deno.exit(1);
    }
  } else if (appType) {
    if (!APP_TYPE_PROFILES[appType]) {
      console.error(`Unknown app type: ${appType}`);
      console.error("Valid types: content-heavy, app-like, data-intensive, hybrid");
      Deno.exit(1);
    }

    if (json) {
      const profile = APP_TYPE_PROFILES[appType];
      console.log(JSON.stringify({ appType, profile }, null, 2));
    } else {
      analyzeAppType(appType);
    }
  }
}

main();
