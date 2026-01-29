#!/usr/bin/env -S deno run --allow-read

/**
 * Check Mastra Version Patterns
 *
 * This script detects mixing of v1 Beta and stable (0.24.x) patterns
 * that would cause runtime errors.
 *
 * Usage:
 *   deno run --allow-read scripts/check-version-patterns.ts ./src/mastra/
 *   deno run --allow-read scripts/check-version-patterns.ts ./src/mastra/tools/
 *
 * Detects:
 *   - Mixed tool signatures (v1 vs stable)
 *   - Deprecated imports from @mastra/core root
 *   - Deprecated memory options (threadId/resourceId)
 *   - Deprecated telemetry config
 *   - Legacy workflow data access patterns
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

interface VersionIssue {
  file: string;
  line: number;
  pattern: "v1" | "stable" | "deprecated";
  issue: string;
  found: string;
  fix: string;
}

const PATTERNS = {
  // Tool signature patterns
  v1ToolSignature: {
    pattern: /execute:\s*async\s*\(\s*(\w+)\s*,\s*(\w+)\s*\)\s*=>/g,
    version: "v1" as const,
    description: "v1 Beta tool signature: execute(inputData, context)",
  },
  stableToolSignature: {
    pattern: /execute:\s*async\s*\(\s*\{\s*context/g,
    version: "stable" as const,
    description: "Stable tool signature: execute({ context, ... })",
  },

  // Import patterns
  deprecatedImport: {
    pattern: /import\s*\{[^}]+\}\s*from\s*["']@mastra\/core["']/g,
    version: "deprecated" as const,
    description: "Deprecated root import",
    fix: 'Use subpath imports: @mastra/core/agent, @mastra/core/tools, etc.',
  },

  // Memory option patterns
  deprecatedMemory: {
    pattern: /threadId:\s*["'][^"']+["']/g,
    version: "deprecated" as const,
    description: "Deprecated threadId option",
    fix: "Use memory: { thread: '...', resource: '...' }",
  },
  deprecatedResource: {
    pattern: /resourceId:\s*["'][^"']+["']/g,
    version: "deprecated" as const,
    description: "Deprecated resourceId option",
    fix: "Use memory: { thread: '...', resource: '...' }",
  },

  // Telemetry config
  deprecatedTelemetry: {
    pattern: /telemetry:\s*\{/g,
    version: "deprecated" as const,
    description: "Deprecated telemetry config",
    fix: "Use observability: { default: { enabled: true } }",
  },

  // Legacy workflow patterns
  legacyTriggerData: {
    pattern: /context\.triggerData/g,
    version: "stable" as const,
    description: "Legacy triggerData access",
    fix: "Use getInitData() to access original workflow input",
  },
  legacyStepsAccess: {
    pattern: /context\.steps\.\w+\.output/g,
    version: "stable" as const,
    description: "Legacy steps.*.output access",
    fix: 'Use inputData or getStepResult("step-id")',
  },

  // v1 specific patterns
  v1RuntimeContext: {
    pattern: /RequestContext/g,
    version: "v1" as const,
    description: "v1 Beta RequestContext (renamed from RuntimeContext)",
  },
};

async function main() {
  const args = parse(Deno.args, {
    string: ["format", "target"],
    boolean: ["help", "fix"],
    default: {
      format: "text",
      target: "v1",
    },
  });

  if (args.help || args._.length === 0) {
    console.log(`
Check Mastra Version Patterns

Detects mixing of v1 Beta and stable (0.24.x) patterns that cause runtime errors.

Usage:
  deno run --allow-read scripts/check-version-patterns.ts <path> [options]

Arguments:
  <path>          Path to file or directory to check

Options:
  --target        Target version: v1 (default), stable
  --format        Output format: text (default), json
  --help          Show this help

Examples:
  deno run --allow-read scripts/check-version-patterns.ts ./src/mastra/
  deno run --allow-read scripts/check-version-patterns.ts ./src/mastra/tools/ --target v1
`);
    Deno.exit(0);
  }

  const targetPath = String(args._[0]);
  const targetVersion = args.target as "v1" | "stable";
  const issues: VersionIssue[] = [];

  const stat = await Deno.stat(targetPath);

  if (stat.isFile) {
    const fileIssues = await checkFile(targetPath, targetVersion);
    issues.push(...fileIssues);
  } else if (stat.isDirectory) {
    for await (const entry of walk(targetPath, {
      exts: [".ts", ".tsx"],
      includeDirs: false,
    })) {
      const fileIssues = await checkFile(entry.path, targetVersion);
      issues.push(...fileIssues);
    }
  }

  // Output results
  if (args.format === "json") {
    console.log(JSON.stringify({ issues, targetVersion }, null, 2));
  } else {
    outputText(issues, targetVersion);
  }

  // Exit with error if critical issues found
  const criticalCount = issues.filter(
    (i) => i.pattern !== targetVersion && i.pattern !== "deprecated"
  ).length;

  if (criticalCount > 0) {
    Deno.exit(1);
  }
}

async function checkFile(
  filePath: string,
  targetVersion: "v1" | "stable"
): Promise<VersionIssue[]> {
  const issues: VersionIssue[] = [];
  const content = await Deno.readTextFile(filePath);
  const lines = content.split("\n");

  // Check each pattern
  for (const [name, config] of Object.entries(PATTERNS)) {
    const pattern = new RegExp(config.pattern.source, config.pattern.flags);
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const lineNumber = content.substring(0, match.index).split("\n").length;
      const line = lines[lineNumber - 1];

      // Determine if this is an issue based on target version
      let isIssue = false;
      let issueDescription = "";
      let fix = "";

      if (config.version === "deprecated") {
        isIssue = true;
        issueDescription = config.description;
        fix = (config as any).fix || "Update to current API";
      } else if (config.version !== targetVersion) {
        isIssue = true;
        issueDescription = `${config.description} (targeting ${targetVersion})`;
        fix = targetVersion === "v1"
          ? "Update to v1 Beta pattern"
          : "Update to stable pattern";
      }

      if (isIssue) {
        issues.push({
          file: filePath,
          line: lineNumber,
          pattern: config.version,
          issue: issueDescription,
          found: match[0].substring(0, 50) + (match[0].length > 50 ? "..." : ""),
          fix,
        });
      }
    }
  }

  // Check for mixed signatures in the same file
  const hasV1Signature = PATTERNS.v1ToolSignature.pattern.test(content);
  const hasStableSignature = PATTERNS.stableToolSignature.pattern.test(content);

  if (hasV1Signature && hasStableSignature) {
    issues.push({
      file: filePath,
      line: 0,
      pattern: "deprecated",
      issue: "File contains both v1 and stable tool signatures - this will cause errors",
      found: "Mixed signatures detected",
      fix: `Convert all tools to ${targetVersion} signature`,
    });
  }

  return issues;
}

function outputText(issues: VersionIssue[], targetVersion: string) {
  console.log(`\n🔍 Version Pattern Check (target: ${targetVersion})\n`);

  if (issues.length === 0) {
    console.log("✅ No version conflicts found");
    return;
  }

  // Group by file
  const byFile = new Map<string, VersionIssue[]>();
  for (const issue of issues) {
    const existing = byFile.get(issue.file) || [];
    existing.push(issue);
    byFile.set(issue.file, existing);
  }

  for (const [file, fileIssues] of byFile) {
    console.log(`📄 ${file}`);

    for (const issue of fileIssues) {
      const icon = issue.pattern === "deprecated" ? "⚠️" : "❌";
      console.log(`   ${icon} Line ${issue.line}: ${issue.issue}`);
      console.log(`      Found: ${issue.found}`);
      console.log(`      Fix: ${issue.fix}`);
    }

    console.log();
  }

  // Summary
  const deprecated = issues.filter((i) => i.pattern === "deprecated").length;
  const wrongVersion = issues.filter((i) => i.pattern !== "deprecated" && i.pattern !== targetVersion).length;

  console.log("📊 Summary:");
  console.log(`   Deprecated patterns: ${deprecated}`);
  console.log(`   Wrong version patterns: ${wrongVersion}`);

  if (wrongVersion > 0) {
    console.log(`\n❌ Found ${wrongVersion} patterns incompatible with ${targetVersion}`);
  }
}

// Run main function
main();
