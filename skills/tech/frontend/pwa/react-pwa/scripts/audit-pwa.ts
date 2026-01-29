#!/usr/bin/env -S deno run --allow-read --allow-net

/**
 * Audit PWA Compliance
 *
 * Usage:
 *   deno run --allow-read --allow-net audit-pwa.ts --manifest public/manifest.webmanifest
 *   deno run --allow-read --allow-net audit-pwa.ts --url http://localhost:5173
 *
 * Permissions: --allow-read --allow-net
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

interface AuditResult {
  category: string;
  check: string;
  status: "pass" | "fail" | "warn" | "skip";
  message: string;
  fix?: string;
}

interface ManifestData {
  name?: string;
  short_name?: string;
  start_url?: string;
  display?: string;
  background_color?: string;
  theme_color?: string;
  icons?: Array<{
    src: string;
    sizes: string;
    type?: string;
    purpose?: string;
  }>;
  description?: string;
  orientation?: string;
  categories?: string[];
  screenshots?: unknown[];
  shortcuts?: unknown[];
}

function printHelp(): void {
  console.log(`
PWA Compliance Audit

USAGE:
  deno run --allow-read --allow-net audit-pwa.ts [OPTIONS]

OPTIONS:
  --manifest <path>       Path to manifest.webmanifest file
  --url <url>             URL to fetch manifest from (alternative to --manifest)
  --format <type>         Output format: summary|json|detailed (default: summary)
  --strict                Treat warnings as failures
  --help                  Show this help message

CHECKS:
  - Manifest presence and validity
  - Required fields (name, short_name, start_url, display, icons)
  - Icon requirements (192x192, 512x512, maskable)
  - Color values
  - Display modes
  - Installability criteria

EXAMPLES:
  # Audit local manifest
  audit-pwa.ts --manifest public/manifest.webmanifest

  # Audit running app
  audit-pwa.ts --url http://localhost:5173

  # Detailed output
  audit-pwa.ts --manifest public/manifest.json --format detailed
`);
}

function validateColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

async function loadManifest(
  path?: string,
  url?: string
): Promise<ManifestData | null> {
  try {
    if (path) {
      const content = await Deno.readTextFile(path);
      return JSON.parse(content);
    } else if (url) {
      const manifestUrl = url.endsWith("/")
        ? `${url}manifest.webmanifest`
        : `${url}/manifest.webmanifest`;
      const response = await fetch(manifestUrl);
      if (!response.ok) {
        // Try alternative name
        const altResponse = await fetch(
          url.endsWith("/") ? `${url}manifest.json` : `${url}/manifest.json`
        );
        if (!altResponse.ok) {
          console.error("Could not fetch manifest from URL");
          return null;
        }
        return await altResponse.json();
      }
      return await response.json();
    }
  } catch (error) {
    console.error("Error loading manifest:", error);
    return null;
  }
  return null;
}

function auditManifest(manifest: ManifestData): AuditResult[] {
  const results: AuditResult[] = [];

  // Required fields
  if (!manifest.name) {
    results.push({
      category: "Required Fields",
      check: "name",
      status: "fail",
      message: "Missing required 'name' field",
      fix: "Add 'name' field with full application name",
    });
  } else if (manifest.name.length > 45) {
    results.push({
      category: "Required Fields",
      check: "name",
      status: "warn",
      message: `Name is ${manifest.name.length} chars (recommended max 45)`,
    });
  } else {
    results.push({
      category: "Required Fields",
      check: "name",
      status: "pass",
      message: `Name: "${manifest.name}"`,
    });
  }

  if (!manifest.short_name) {
    results.push({
      category: "Required Fields",
      check: "short_name",
      status: "fail",
      message: "Missing required 'short_name' field",
      fix: "Add 'short_name' field (12 chars or less recommended)",
    });
  } else if (manifest.short_name.length > 12) {
    results.push({
      category: "Required Fields",
      check: "short_name",
      status: "warn",
      message: `Short name is ${manifest.short_name.length} chars (may be truncated on home screen)`,
    });
  } else {
    results.push({
      category: "Required Fields",
      check: "short_name",
      status: "pass",
      message: `Short name: "${manifest.short_name}"`,
    });
  }

  if (!manifest.start_url) {
    results.push({
      category: "Required Fields",
      check: "start_url",
      status: "fail",
      message: "Missing 'start_url' field",
      fix: "Add 'start_url': '/' or your app's entry point",
    });
  } else {
    results.push({
      category: "Required Fields",
      check: "start_url",
      status: "pass",
      message: `Start URL: ${manifest.start_url}`,
    });
  }

  // Display mode
  const validDisplayModes = ["fullscreen", "standalone", "minimal-ui", "browser"];
  if (!manifest.display) {
    results.push({
      category: "Display",
      check: "display",
      status: "fail",
      message: "Missing 'display' field",
      fix: "Add 'display': 'standalone' for app-like experience",
    });
  } else if (!validDisplayModes.includes(manifest.display)) {
    results.push({
      category: "Display",
      check: "display",
      status: "fail",
      message: `Invalid display mode: ${manifest.display}`,
      fix: `Use one of: ${validDisplayModes.join(", ")}`,
    });
  } else if (manifest.display === "browser") {
    results.push({
      category: "Display",
      check: "display",
      status: "warn",
      message: "Using 'browser' display mode - app will open in browser tab",
    });
  } else {
    results.push({
      category: "Display",
      check: "display",
      status: "pass",
      message: `Display mode: ${manifest.display}`,
    });
  }

  // Colors
  if (!manifest.background_color) {
    results.push({
      category: "Colors",
      check: "background_color",
      status: "warn",
      message: "Missing 'background_color' - splash screen may look inconsistent",
      fix: "Add 'background_color': '#ffffff' (or your preferred color)",
    });
  } else if (!validateColor(manifest.background_color)) {
    results.push({
      category: "Colors",
      check: "background_color",
      status: "fail",
      message: `Invalid background_color: ${manifest.background_color}`,
      fix: "Use hex format: #fff or #ffffff",
    });
  } else {
    results.push({
      category: "Colors",
      check: "background_color",
      status: "pass",
      message: `Background color: ${manifest.background_color}`,
    });
  }

  if (!manifest.theme_color) {
    results.push({
      category: "Colors",
      check: "theme_color",
      status: "warn",
      message: "Missing 'theme_color' - browser UI may not match app",
      fix: "Add 'theme_color': '#ffffff' (or your brand color)",
    });
  } else if (!validateColor(manifest.theme_color)) {
    results.push({
      category: "Colors",
      check: "theme_color",
      status: "fail",
      message: `Invalid theme_color: ${manifest.theme_color}`,
      fix: "Use hex format: #fff or #ffffff",
    });
  } else {
    results.push({
      category: "Colors",
      check: "theme_color",
      status: "pass",
      message: `Theme color: ${manifest.theme_color}`,
    });
  }

  // Icons
  if (!manifest.icons || manifest.icons.length === 0) {
    results.push({
      category: "Icons",
      check: "icons_present",
      status: "fail",
      message: "No icons defined",
      fix: "Add icons array with at least 192x192 and 512x512 PNG icons",
    });
  } else {
    results.push({
      category: "Icons",
      check: "icons_present",
      status: "pass",
      message: `${manifest.icons.length} icon(s) defined`,
    });

    // Check for required sizes
    const sizes = manifest.icons.map((i) => i.sizes);
    const has192 = sizes.some((s) => s?.includes("192x192"));
    const has512 = sizes.some((s) => s?.includes("512x512"));
    const hasMaskable = manifest.icons.some((i) =>
      i.purpose?.includes("maskable")
    );

    if (!has192) {
      results.push({
        category: "Icons",
        check: "icon_192",
        status: "fail",
        message: "Missing 192x192 icon (required for Android)",
        fix: "Add icon with sizes: '192x192'",
      });
    } else {
      results.push({
        category: "Icons",
        check: "icon_192",
        status: "pass",
        message: "192x192 icon present",
      });
    }

    if (!has512) {
      results.push({
        category: "Icons",
        check: "icon_512",
        status: "fail",
        message: "Missing 512x512 icon (required for splash screen)",
        fix: "Add icon with sizes: '512x512'",
      });
    } else {
      results.push({
        category: "Icons",
        check: "icon_512",
        status: "pass",
        message: "512x512 icon present",
      });
    }

    if (!hasMaskable) {
      results.push({
        category: "Icons",
        check: "icon_maskable",
        status: "warn",
        message: "No maskable icon - app icon may be cropped on some devices",
        fix: "Add icon with purpose: 'maskable' (ensure 80% safe zone)",
      });
    } else {
      results.push({
        category: "Icons",
        check: "icon_maskable",
        status: "pass",
        message: "Maskable icon present",
      });
    }
  }

  // Optional enhancements
  if (!manifest.description) {
    results.push({
      category: "Optional",
      check: "description",
      status: "warn",
      message: "No description - useful for app stores",
    });
  } else {
    results.push({
      category: "Optional",
      check: "description",
      status: "pass",
      message: "Description present",
    });
  }

  if (!manifest.screenshots || manifest.screenshots.length === 0) {
    results.push({
      category: "Optional",
      check: "screenshots",
      status: "warn",
      message: "No screenshots - improves install prompt on desktop",
    });
  } else {
    results.push({
      category: "Optional",
      check: "screenshots",
      status: "pass",
      message: `${manifest.screenshots.length} screenshot(s) present`,
    });
  }

  return results;
}

function formatSummary(results: AuditResult[]): string {
  const passed = results.filter((r) => r.status === "pass").length;
  const warned = results.filter((r) => r.status === "warn").length;
  const failed = results.filter((r) => r.status === "fail").length;

  const lines: string[] = [];
  lines.push("\n=== PWA Audit Summary ===\n");

  // Group by category
  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category);
    lines.push(`\n${category}:`);

    for (const result of categoryResults) {
      const icon =
        result.status === "pass"
          ? "✓"
          : result.status === "warn"
          ? "⚠"
          : result.status === "fail"
          ? "✗"
          : "○";
      lines.push(`  ${icon} ${result.check}: ${result.message}`);
      if (result.fix && result.status !== "pass") {
        lines.push(`    → Fix: ${result.fix}`);
      }
    }
  }

  lines.push("\n---");
  lines.push(
    `Results: ${passed} passed, ${warned} warnings, ${failed} failed`
  );

  if (failed === 0 && warned === 0) {
    lines.push("✓ PWA is fully compliant!");
  } else if (failed === 0) {
    lines.push("⚠ PWA is installable but has recommendations");
  } else {
    lines.push("✗ PWA has issues that prevent installation");
  }

  return lines.join("\n");
}

function formatDetailed(results: AuditResult[]): string {
  const lines: string[] = [];
  lines.push("\n=== PWA Audit Detailed Report ===\n");

  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category);
    lines.push(`\n## ${category}\n`);

    for (const result of categoryResults) {
      lines.push(`### ${result.check}`);
      lines.push(`Status: ${result.status.toUpperCase()}`);
      lines.push(`Message: ${result.message}`);
      if (result.fix) {
        lines.push(`Fix: ${result.fix}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["manifest", "url", "format"],
    boolean: ["help", "strict"],
    default: {
      format: "summary",
    },
  });

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  if (!args.manifest && !args.url) {
    console.error("Error: --manifest or --url is required");
    printHelp();
    Deno.exit(1);
  }

  const manifest = await loadManifest(args.manifest, args.url);

  if (!manifest) {
    console.error("Failed to load manifest");
    Deno.exit(1);
  }

  const results = auditManifest(manifest);

  if (args.format === "json") {
    console.log(JSON.stringify(results, null, 2));
  } else if (args.format === "detailed") {
    console.log(formatDetailed(results));
  } else {
    console.log(formatSummary(results));
  }

  const failed = results.filter((r) => r.status === "fail").length;
  const warned = results.filter((r) => r.status === "warn").length;

  if (failed > 0 || (args.strict && warned > 0)) {
    Deno.exit(1);
  }
}
