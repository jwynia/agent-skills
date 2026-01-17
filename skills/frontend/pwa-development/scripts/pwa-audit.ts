#!/usr/bin/env -S deno run --allow-read

/**
 * PWA Audit
 *
 * Validates PWA configuration against best practices checklist.
 * Checks manifest, service worker setup, and common issues.
 *
 * Usage:
 *   deno run --allow-read pwa-audit.ts --manifest public/manifest.json
 *   deno run --allow-read pwa-audit.ts --project-root ./
 *   deno run --allow-read pwa-audit.ts --json
 */

// === INTERFACES ===

interface AuditResult {
  category: string;
  check: string;
  status: "pass" | "fail" | "warn" | "skip";
  message: string;
  fix?: string;
}

interface AuditReport {
  timestamp: string;
  manifestPath?: string;
  projectRoot?: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
    skipped: number;
  };
  results: AuditResult[];
  score: number;
}

interface ManifestIcon {
  src: string;
  sizes: string;
  type?: string;
  purpose?: string;
}

interface WebAppManifest {
  name?: string;
  short_name?: string;
  description?: string;
  start_url?: string;
  display?: string;
  orientation?: string;
  background_color?: string;
  theme_color?: string;
  scope?: string;
  icons?: ManifestIcon[];
  screenshots?: unknown[];
  shortcuts?: unknown[];
  categories?: string[];
}

// === AUDIT CHECKS ===

function auditManifest(manifest: WebAppManifest | null, manifestPath?: string): AuditResult[] {
  const results: AuditResult[] = [];

  if (!manifest) {
    results.push({
      category: "Manifest",
      check: "Manifest exists",
      status: "fail",
      message: manifestPath ? `Could not read manifest at ${manifestPath}` : "No manifest path provided",
      fix: "Create a manifest.json file and link it with <link rel=\"manifest\" href=\"/manifest.json\">",
    });
    return results;
  }

  // Required fields
  results.push({
    category: "Manifest",
    check: "name field",
    status: manifest.name ? "pass" : "fail",
    message: manifest.name ? `name: "${manifest.name}"` : "Missing name field",
    fix: "Add 'name' field with full app name (max 45 characters)",
  });

  results.push({
    category: "Manifest",
    check: "short_name field",
    status: manifest.short_name ? "pass" : "fail",
    message: manifest.short_name ? `short_name: "${manifest.short_name}"` : "Missing short_name field",
    fix: "Add 'short_name' field (max 12 characters for home screen)",
  });

  if (manifest.short_name && manifest.short_name.length > 12) {
    results.push({
      category: "Manifest",
      check: "short_name length",
      status: "warn",
      message: `short_name is ${manifest.short_name.length} characters (recommended max: 12)`,
      fix: "Shorten short_name to 12 characters or less",
    });
  }

  results.push({
    category: "Manifest",
    check: "start_url field",
    status: manifest.start_url ? "pass" : "fail",
    message: manifest.start_url ? `start_url: "${manifest.start_url}"` : "Missing start_url field",
    fix: "Add 'start_url' field (typically '/' or '/index.html')",
  });

  results.push({
    category: "Manifest",
    check: "display field",
    status: manifest.display ? "pass" : "fail",
    message: manifest.display ? `display: "${manifest.display}"` : "Missing display field",
    fix: "Add 'display' field: 'standalone', 'fullscreen', 'minimal-ui', or 'browser'",
  });

  if (manifest.display && !["standalone", "fullscreen", "minimal-ui", "browser"].includes(manifest.display)) {
    results.push({
      category: "Manifest",
      check: "display value",
      status: "fail",
      message: `Invalid display value: "${manifest.display}"`,
      fix: "Use one of: standalone, fullscreen, minimal-ui, browser",
    });
  }

  // Colors
  results.push({
    category: "Manifest",
    check: "background_color field",
    status: manifest.background_color ? "pass" : "warn",
    message: manifest.background_color ? `background_color: "${manifest.background_color}"` : "Missing background_color",
    fix: "Add 'background_color' for splash screen",
  });

  results.push({
    category: "Manifest",
    check: "theme_color field",
    status: manifest.theme_color ? "pass" : "warn",
    message: manifest.theme_color ? `theme_color: "${manifest.theme_color}"` : "Missing theme_color",
    fix: "Add 'theme_color' to style browser UI",
  });

  // Icons
  if (!manifest.icons || manifest.icons.length === 0) {
    results.push({
      category: "Manifest",
      check: "icons field",
      status: "fail",
      message: "No icons defined",
      fix: "Add icons array with at least 192x192 and 512x512 PNG icons",
    });
  } else {
    results.push({
      category: "Manifest",
      check: "icons field",
      status: "pass",
      message: `${manifest.icons.length} icon(s) defined`,
    });

    const sizes = manifest.icons.map(i => i.sizes);

    results.push({
      category: "Manifest",
      check: "192x192 icon",
      status: sizes.some(s => s?.includes("192")) ? "pass" : "fail",
      message: sizes.some(s => s?.includes("192")) ? "192x192 icon present" : "Missing 192x192 icon",
      fix: "Add icon with sizes: '192x192'",
    });

    results.push({
      category: "Manifest",
      check: "512x512 icon",
      status: sizes.some(s => s?.includes("512")) ? "pass" : "fail",
      message: sizes.some(s => s?.includes("512")) ? "512x512 icon present" : "Missing 512x512 icon",
      fix: "Add icon with sizes: '512x512' (required for splash screen)",
    });

    // Check for maskable icon
    const hasMaskable = manifest.icons.some(i => i.purpose?.includes("maskable"));
    results.push({
      category: "Manifest",
      check: "maskable icon",
      status: hasMaskable ? "pass" : "warn",
      message: hasMaskable ? "Maskable icon present" : "No maskable icon defined",
      fix: "Add icon with purpose: 'maskable' for adaptive icons on Android",
    });
  }

  // Scope
  if (manifest.scope && manifest.start_url) {
    const scopeValid = manifest.start_url.startsWith(manifest.scope);
    results.push({
      category: "Manifest",
      check: "scope contains start_url",
      status: scopeValid ? "pass" : "warn",
      message: scopeValid ? "start_url is within scope" : "start_url may be outside scope",
      fix: "Ensure start_url path begins with scope path",
    });
  }

  // Optional but recommended
  results.push({
    category: "Manifest",
    check: "description field",
    status: manifest.description ? "pass" : "warn",
    message: manifest.description ? "Description present" : "Missing description (recommended)",
    fix: "Add 'description' for app stores and search results",
  });

  results.push({
    category: "Manifest",
    check: "screenshots field",
    status: manifest.screenshots && manifest.screenshots.length > 0 ? "pass" : "warn",
    message: manifest.screenshots?.length ? `${manifest.screenshots.length} screenshot(s)` : "No screenshots (recommended for richer install UI)",
    fix: "Add 'screenshots' array for enhanced install experience",
  });

  return results;
}

function auditIosCompatibility(manifest: WebAppManifest | null): AuditResult[] {
  const results: AuditResult[] = [];

  results.push({
    category: "iOS Compatibility",
    check: "apple-touch-icon reminder",
    status: "warn",
    message: "Verify <link rel=\"apple-touch-icon\"> exists in HTML",
    fix: "Add <link rel=\"apple-touch-icon\" href=\"/apple-touch-icon.png\"> (180x180)",
  });

  results.push({
    category: "iOS Compatibility",
    check: "apple-mobile-web-app-capable reminder",
    status: "warn",
    message: "Verify meta tag exists for standalone mode on iOS",
    fix: "Add <meta name=\"apple-mobile-web-app-capable\" content=\"yes\">",
  });

  results.push({
    category: "iOS Compatibility",
    check: "apple-mobile-web-app-status-bar-style reminder",
    status: "warn",
    message: "Consider status bar styling for iOS",
    fix: "Add <meta name=\"apple-mobile-web-app-status-bar-style\" content=\"default\">",
  });

  if (manifest?.theme_color) {
    results.push({
      category: "iOS Compatibility",
      check: "theme-color meta tag reminder",
      status: "warn",
      message: "iOS needs theme-color as meta tag, not just manifest",
      fix: `Add <meta name="theme-color" content="${manifest.theme_color}">`,
    });
  }

  results.push({
    category: "iOS Compatibility",
    check: "iOS limitations awareness",
    status: "warn",
    message: "iOS has PWA limitations: no beforeinstallprompt, limited background sync, storage eviction after 7 days",
    fix: "Test on real iOS devices. Consider manual 'Add to Home Screen' instructions for iOS users.",
  });

  return results;
}

function auditBestPractices(): AuditResult[] {
  const results: AuditResult[] = [];

  results.push({
    category: "Best Practices",
    check: "HTTPS requirement",
    status: "warn",
    message: "Service workers require HTTPS (except localhost)",
    fix: "Ensure production deployment uses HTTPS",
  });

  results.push({
    category: "Best Practices",
    check: "Offline fallback page reminder",
    status: "warn",
    message: "Verify offline.html or offline fallback exists",
    fix: "Create offline.html and cache it in service worker install event",
  });

  results.push({
    category: "Best Practices",
    check: "Cache versioning reminder",
    status: "warn",
    message: "Verify cache names include version for updates",
    fix: "Use cache names like 'app-cache-v1' and delete old caches on activate",
  });

  results.push({
    category: "Best Practices",
    check: "Update notification reminder",
    status: "warn",
    message: "Consider notifying users when new version is available",
    fix: "Implement 'New version available' UI instead of silent updates",
  });

  results.push({
    category: "Best Practices",
    check: "Lighthouse audit reminder",
    status: "warn",
    message: "Run Lighthouse PWA audit in Chrome DevTools",
    fix: "Open DevTools > Lighthouse > Check 'Progressive Web App' > Analyze",
  });

  return results;
}

// === REPORT GENERATION ===

function generateReport(results: AuditResult[], manifestPath?: string, projectRoot?: string): AuditReport {
  const summary = {
    total: results.length,
    passed: results.filter(r => r.status === "pass").length,
    failed: results.filter(r => r.status === "fail").length,
    warnings: results.filter(r => r.status === "warn").length,
    skipped: results.filter(r => r.status === "skip").length,
  };

  // Score: pass = 1, warn = 0.5, fail = 0
  const maxScore = summary.total;
  const actualScore = summary.passed + (summary.warnings * 0.5);
  const score = Math.round((actualScore / maxScore) * 100);

  return {
    timestamp: new Date().toISOString(),
    manifestPath,
    projectRoot,
    summary,
    results,
    score,
  };
}

function formatReport(report: AuditReport): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("PWA AUDIT REPORT");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push(`Timestamp: ${report.timestamp}`);
  if (report.manifestPath) lines.push(`Manifest: ${report.manifestPath}`);
  if (report.projectRoot) lines.push(`Project Root: ${report.projectRoot}`);
  lines.push("");

  lines.push("-".repeat(60));
  lines.push("SUMMARY");
  lines.push("-".repeat(60));
  lines.push(`Score: ${report.score}/100`);
  lines.push(`Total Checks: ${report.summary.total}`);
  lines.push(`  Passed: ${report.summary.passed}`);
  lines.push(`  Failed: ${report.summary.failed}`);
  lines.push(`  Warnings: ${report.summary.warnings}`);
  lines.push("");

  // Group by category
  const categories = [...new Set(report.results.map(r => r.category))];

  for (const category of categories) {
    const categoryResults = report.results.filter(r => r.category === category);
    lines.push("-".repeat(60));
    lines.push(category.toUpperCase());
    lines.push("-".repeat(60));

    for (const result of categoryResults) {
      const statusIcon = {
        pass: "[PASS]",
        fail: "[FAIL]",
        warn: "[WARN]",
        skip: "[SKIP]",
      }[result.status];

      lines.push(`${statusIcon} ${result.check}`);
      lines.push(`       ${result.message}`);
      if (result.status !== "pass" && result.fix) {
        lines.push(`       Fix: ${result.fix}`);
      }
      lines.push("");
    }
  }

  // Failures summary
  const failures = report.results.filter(r => r.status === "fail");
  if (failures.length > 0) {
    lines.push("=".repeat(60));
    lines.push("REQUIRED FIXES");
    lines.push("=".repeat(60));
    for (const failure of failures) {
      lines.push(`- ${failure.check}: ${failure.fix}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): { manifestPath?: string; projectRoot?: string; json?: boolean } {
  let manifestPath: string | undefined;
  let projectRoot: string | undefined;
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
      case "--manifest":
      case "-m":
        manifestPath = nextArg;
        i++;
        break;
      case "--project-root":
      case "-p":
        projectRoot = nextArg;
        i++;
        break;
      case "--json":
        json = true;
        break;
    }
  }

  return { manifestPath, projectRoot, json };
}

function printHelp(): void {
  console.log(`
PWA Audit

Validate PWA configuration against best practices checklist.

USAGE:
  pwa-audit.ts [OPTIONS]

OPTIONS:
  --manifest, -m <path>      Path to manifest.json file
  --project-root, -p <path>  Project root directory (auto-finds manifest)
  --json                     Output as JSON
  --help, -h                 Show this help

CHECKS PERFORMED:
  Manifest:
    - Required fields (name, short_name, start_url, display, icons)
    - Icon sizes (192x192, 512x512, maskable)
    - Colors (background_color, theme_color)
    - Scope and start_url alignment

  iOS Compatibility:
    - Apple-specific meta tags reminders
    - iOS limitations awareness

  Best Practices:
    - HTTPS requirement
    - Offline fallback
    - Cache versioning
    - Update notification

EXAMPLES:
  # Audit a specific manifest
  pwa-audit.ts --manifest public/manifest.json

  # Auto-find manifest in project
  pwa-audit.ts --project-root ./

  # JSON output for CI/CD
  pwa-audit.ts --manifest manifest.json --json
`);
}

// === MAIN ===

async function main(): Promise<void> {
  let { manifestPath, projectRoot, json } = parseArgs(Deno.args);

  // Auto-find manifest if project root provided
  if (projectRoot && !manifestPath) {
    const possiblePaths = [
      `${projectRoot}/manifest.json`,
      `${projectRoot}/public/manifest.json`,
      `${projectRoot}/static/manifest.json`,
      `${projectRoot}/src/manifest.json`,
    ];

    for (const path of possiblePaths) {
      try {
        await Deno.stat(path);
        manifestPath = path;
        break;
      } catch {
        // Continue to next path
      }
    }
  }

  // Read manifest
  let manifest: WebAppManifest | null = null;
  if (manifestPath) {
    try {
      const content = await Deno.readTextFile(manifestPath);
      manifest = JSON.parse(content);
    } catch {
      // Will be reported as failure in audit
    }
  }

  // Run audits
  const results: AuditResult[] = [
    ...auditManifest(manifest, manifestPath),
    ...auditIosCompatibility(manifest),
    ...auditBestPractices(),
  ];

  const report = generateReport(results, manifestPath, projectRoot);

  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report));
  }

  // Exit with error if any failures
  if (report.summary.failed > 0) {
    Deno.exit(1);
  }
}

main();
