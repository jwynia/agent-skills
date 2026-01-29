#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Generate Service Worker / VitePWA Configuration
 *
 * Usage:
 *   deno run --allow-read --allow-write generate-sw-config.ts \
 *     --strategy cache-first \
 *     --output vite-pwa.config.ts
 *
 * Permissions: --allow-read --allow-write
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

type CacheStrategy = "CacheFirst" | "NetworkFirst" | "StaleWhileRevalidate";

interface RuntimeCacheRule {
  urlPattern: string;
  handler: CacheStrategy;
  cacheName: string;
  maxEntries?: number;
  maxAgeSeconds?: number;
  networkTimeoutSeconds?: number;
}

interface PWAConfig {
  registerType: "autoUpdate" | "prompt";
  includeAssets: string[];
  workbox: {
    globPatterns: string[];
    runtimeCaching: RuntimeCacheRule[];
    navigateFallback?: string;
    navigateFallbackDenylist?: string[];
  };
  manifest: {
    name: string;
    short_name: string;
    theme_color: string;
    background_color: string;
    display: string;
    icons: Array<{ src: string; sizes: string; type: string; purpose?: string }>;
  };
}

const PRESET_CONFIGS: Record<string, Partial<RuntimeCacheRule>[]> = {
  "api-heavy": [
    {
      urlPattern: "^https://api\\.",
      handler: "NetworkFirst",
      cacheName: "api-cache",
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24,
      networkTimeoutSeconds: 3,
    },
    {
      urlPattern: "\\.(?:png|jpg|jpeg|svg|gif|webp)$",
      handler: "CacheFirst",
      cacheName: "images",
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
  ],
  "static-first": [
    {
      urlPattern: "\\.(?:js|css)$",
      handler: "CacheFirst",
      cacheName: "static-resources",
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24 * 30,
    },
    {
      urlPattern: "\\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$",
      handler: "CacheFirst",
      cacheName: "assets",
      maxEntries: 100,
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
  ],
  "network-first": [
    {
      urlPattern: ".*",
      handler: "NetworkFirst",
      cacheName: "all-cache",
      maxEntries: 200,
      maxAgeSeconds: 60 * 60 * 24,
      networkTimeoutSeconds: 5,
    },
  ],
  fonts: [
    {
      urlPattern: "^https://fonts\\.googleapis\\.com",
      handler: "StaleWhileRevalidate",
      cacheName: "google-fonts-stylesheets",
      maxEntries: 10,
    },
    {
      urlPattern: "^https://fonts\\.gstatic\\.com",
      handler: "CacheFirst",
      cacheName: "google-fonts-webfonts",
      maxEntries: 30,
      maxAgeSeconds: 60 * 60 * 24 * 365,
    },
  ],
};

function printHelp(): void {
  console.log(`
Generate VitePWA Service Worker Configuration

USAGE:
  deno run --allow-read --allow-write generate-sw-config.ts [OPTIONS]

OPTIONS:
  --name <name>           App name (required)
  --short-name <name>     Short name (required)
  --theme <color>         Theme color (default: #ffffff)
  --preset <type>         Cache preset: api-heavy|static-first|network-first|fonts
  --register <type>       Register type: autoUpdate|prompt (default: autoUpdate)
  --offline-page <path>   Offline fallback page path
  --output <path>         Output file path (default: pwa.config.ts)
  --format <type>         Output format: ts|json (default: ts)
  --help                  Show this help message

PRESETS:
  api-heavy       NetworkFirst for API, CacheFirst for images
  static-first    CacheFirst for JS/CSS/images
  network-first   NetworkFirst for everything
  fonts           Optimized caching for Google Fonts

EXAMPLES:
  # Basic config
  generate-sw-config.ts --name "My App" --short-name "App" --output pwa.config.ts

  # API-heavy app
  generate-sw-config.ts --name "My API App" --short-name "API" --preset api-heavy

  # With offline page
  generate-sw-config.ts --name "Offline App" --short-name "Off" --offline-page /offline.html
`);
}

function generateRuntimeCachingCode(rules: Partial<RuntimeCacheRule>[]): string {
  return rules
    .map((rule) => {
      const options: string[] = [];
      options.push(`cacheName: '${rule.cacheName}'`);

      const expiration: string[] = [];
      if (rule.maxEntries) {
        expiration.push(`maxEntries: ${rule.maxEntries}`);
      }
      if (rule.maxAgeSeconds) {
        expiration.push(`maxAgeSeconds: ${rule.maxAgeSeconds}`);
      }
      if (expiration.length > 0) {
        options.push(`expiration: { ${expiration.join(", ")} }`);
      }

      if (rule.networkTimeoutSeconds) {
        options.push(`networkTimeoutSeconds: ${rule.networkTimeoutSeconds}`);
      }

      return `{
      urlPattern: /${rule.urlPattern}/i,
      handler: '${rule.handler}',
      options: {
        ${options.join(",\n        ")}
      }
    }`;
    })
    .join(",\n    ");
}

function generateTypeScriptConfig(config: PWAConfig): string {
  const workboxConfig: string[] = [];

  workboxConfig.push(
    `globPatterns: ${JSON.stringify(config.workbox.globPatterns)}`
  );

  if (config.workbox.navigateFallback) {
    workboxConfig.push(`navigateFallback: '${config.workbox.navigateFallback}'`);
  }

  if (
    config.workbox.navigateFallbackDenylist &&
    config.workbox.navigateFallbackDenylist.length > 0
  ) {
    workboxConfig.push(
      `navigateFallbackDenylist: [${config.workbox.navigateFallbackDenylist
        .map((p) => `/${p}/`)
        .join(", ")}]`
    );
  }

  const runtimeCachingCode = generateRuntimeCachingCode(
    config.workbox.runtimeCaching as Partial<RuntimeCacheRule>[]
  );

  return `// Generated PWA Configuration for vite-plugin-pwa
// Add this to your vite.config.ts

import { VitePWA } from 'vite-plugin-pwa'

export const pwaConfig = VitePWA({
  registerType: '${config.registerType}',
  includeAssets: ${JSON.stringify(config.includeAssets)},
  workbox: {
    ${workboxConfig.join(",\n    ")},
    runtimeCaching: [
    ${runtimeCachingCode}
    ]
  },
  manifest: {
    name: '${config.manifest.name}',
    short_name: '${config.manifest.short_name}',
    theme_color: '${config.manifest.theme_color}',
    background_color: '${config.manifest.background_color}',
    display: '${config.manifest.display}',
    icons: ${JSON.stringify(config.manifest.icons, null, 6).replace(/\n/g, "\n    ")}
  }
})

// Usage in vite.config.ts:
// import { pwaConfig } from './pwa.config'
// export default defineConfig({ plugins: [react(), pwaConfig] })
`;
}

export function generateConfig(options: {
  name: string;
  shortName: string;
  themeColor?: string;
  preset?: string;
  registerType?: "autoUpdate" | "prompt";
  offlinePage?: string;
  output: string;
  format?: "ts" | "json";
}): PWAConfig {
  const runtimeCaching: RuntimeCacheRule[] = [];

  // Apply preset
  if (options.preset && PRESET_CONFIGS[options.preset]) {
    runtimeCaching.push(
      ...(PRESET_CONFIGS[options.preset] as RuntimeCacheRule[])
    );
  }

  // Add fonts caching by default if not already included
  if (options.preset !== "fonts") {
    runtimeCaching.push(...(PRESET_CONFIGS.fonts as RuntimeCacheRule[]));
  }

  const config: PWAConfig = {
    registerType: options.registerType || "autoUpdate",
    includeAssets: ["favicon.ico", "apple-touch-icon.png", "mask-icon.svg"],
    workbox: {
      globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      runtimeCaching,
    },
    manifest: {
      name: options.name,
      short_name: options.shortName,
      theme_color: options.themeColor || "#ffffff",
      background_color: "#ffffff",
      display: "standalone",
      icons: [
        { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
        { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
      ],
    },
  };

  if (options.offlinePage) {
    config.workbox.navigateFallback = options.offlinePage;
    config.workbox.navigateFallbackDenylist = ["^/api"];
  }

  return config;
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: [
      "name",
      "short-name",
      "theme",
      "preset",
      "register",
      "offline-page",
      "output",
      "format",
    ],
    boolean: ["help"],
    default: {
      output: "pwa.config.ts",
      theme: "#ffffff",
      register: "autoUpdate",
      format: "ts",
    },
  });

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  if (!args.name || !args["short-name"]) {
    console.error("Error: --name and --short-name are required");
    printHelp();
    Deno.exit(1);
  }

  const config = generateConfig({
    name: args.name,
    shortName: args["short-name"],
    themeColor: args.theme,
    preset: args.preset,
    registerType: args.register as "autoUpdate" | "prompt",
    offlinePage: args["offline-page"],
    output: args.output,
    format: args.format as "ts" | "json",
  });

  let content: string;
  if (args.format === "json") {
    content = JSON.stringify(config, null, 2);
  } else {
    content = generateTypeScriptConfig(config);
  }

  await Deno.writeTextFile(args.output, content);
  console.log(`Configuration generated: ${args.output}`);
  console.log(`  Preset: ${args.preset || "default"}`);
  console.log(`  Register type: ${config.registerType}`);
  console.log(`  Runtime caching rules: ${config.workbox.runtimeCaching.length}`);
}
