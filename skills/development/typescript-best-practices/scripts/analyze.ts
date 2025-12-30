#!/usr/bin/env -S deno run --allow-read

/**
 * TypeScript Code Analyzer
 *
 * Static analysis for TypeScript code quality issues.
 * Detects common anti-patterns and suggests improvements.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze.ts <path> [options]
 *
 * Options:
 *   --strict      Enable all checks
 *   --json        Output JSON for programmatic use
 *   --fix-hints   Show suggested fixes
 *   -h, --help    Show help
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "analyze";

// === Types ===
interface AnalyzeOptions {
  path: string;
  strict: boolean;
  json: boolean;
  fixHints: boolean;
}

interface Issue {
  severity: "critical" | "high" | "medium" | "low";
  category: string;
  message: string;
  file: string;
  line: number;
  column: number;
  code: string;
  fix?: string;
}

interface AnalysisResult {
  path: string;
  filesAnalyzed: number;
  issues: Issue[];
  summary: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

// === Patterns to Detect ===
const PATTERNS: Array<{
  name: string;
  pattern: RegExp;
  severity: Issue["severity"];
  category: string;
  message: string;
  fix: string;
}> = [
  {
    name: "any-type",
    pattern: /:\s*any\b(?!\s*\[)/g,
    severity: "critical",
    category: "Type Safety",
    message: "Avoid using 'any' type - it disables type checking",
    fix: "Use 'unknown' and narrow with type guards, or define a specific type",
  },
  {
    name: "any-array",
    pattern: /:\s*any\s*\[\]/g,
    severity: "critical",
    category: "Type Safety",
    message: "Avoid using 'any[]' type",
    fix: "Use 'unknown[]' or define a specific array type",
  },
  {
    name: "non-null-assertion",
    pattern: /\w+!/g,
    severity: "high",
    category: "Type Safety",
    message: "Non-null assertion (!) can cause runtime errors",
    fix: "Use optional chaining (?.) or add proper null checks",
  },
  {
    name: "type-assertion-as",
    pattern: /\bas\s+(?!const\b)\w+/g,
    severity: "medium",
    category: "Type Safety",
    message: "Type assertions with 'as' bypass type checking",
    fix: "Use type guards to narrow types safely",
  },
  {
    name: "object-any",
    pattern: /:\s*object\b/g,
    severity: "medium",
    category: "Type Safety",
    message: "The 'object' type is too broad",
    fix: "Define a specific interface or use Record<string, unknown>",
  },
  {
    name: "Function-type",
    pattern: /:\s*Function\b/g,
    severity: "medium",
    category: "Type Safety",
    message: "The 'Function' type is too broad",
    fix: "Define a specific function signature: (arg: Type) => ReturnType",
  },
  {
    name: "implicit-any-param",
    pattern: /\(\s*\w+\s*\)\s*=>/g,
    severity: "medium",
    category: "Type Safety",
    message: "Arrow function parameter may have implicit 'any'",
    fix: "Add explicit parameter type: (param: Type) =>",
  },
  {
    name: "ts-ignore",
    pattern: /@ts-ignore/g,
    severity: "high",
    category: "Type Safety",
    message: "@ts-ignore suppresses all errors on the next line",
    fix: "Use @ts-expect-error with explanation, or fix the type error",
  },
  {
    name: "ts-nocheck",
    pattern: /@ts-nocheck/g,
    severity: "critical",
    category: "Type Safety",
    message: "@ts-nocheck disables type checking for entire file",
    fix: "Remove @ts-nocheck and fix type errors properly",
  },
  {
    name: "console-log",
    pattern: /console\.(log|debug|info)\(/g,
    severity: "low",
    category: "Code Quality",
    message: "Console statements should be removed in production",
    fix: "Use a proper logging library or remove before commit",
  },
  {
    name: "todo-comment",
    pattern: /\/\/\s*(TODO|FIXME|HACK|XXX):/gi,
    severity: "low",
    category: "Code Quality",
    message: "Unresolved TODO/FIXME comment",
    fix: "Address the TODO or create an issue to track it",
  },
  {
    name: "var-keyword",
    pattern: /\bvar\s+\w+/g,
    severity: "medium",
    category: "Code Quality",
    message: "'var' has function scope which can cause bugs",
    fix: "Use 'const' for constants or 'let' for variables",
  },
  {
    name: "triple-slash",
    pattern: /\/\/\/\s*<reference/g,
    severity: "low",
    category: "Code Quality",
    message: "Triple-slash references are outdated",
    fix: "Use ES module imports instead",
  },
  {
    name: "eval-usage",
    pattern: /\beval\s*\(/g,
    severity: "critical",
    category: "Security",
    message: "eval() is a security risk and prevents optimization",
    fix: "Use safer alternatives like JSON.parse() or Function constructor",
  },
  {
    name: "new-Function",
    pattern: /new\s+Function\s*\(/g,
    severity: "high",
    category: "Security",
    message: "new Function() is similar to eval() - security risk",
    fix: "Define functions statically when possible",
  },
  {
    name: "innerHTML",
    pattern: /\.innerHTML\s*=/g,
    severity: "high",
    category: "Security",
    message: "innerHTML can introduce XSS vulnerabilities",
    fix: "Use textContent for text, or sanitize HTML input",
  },
  {
    name: "async-no-await",
    pattern: /async\s+(?:function\s+\w+|\w+\s*=\s*async)\s*\([^)]*\)\s*(?::\s*\w+)?\s*\{[^}]*\}/g,
    severity: "medium",
    category: "Async",
    message: "Async function may not contain await",
    fix: "Remove async keyword if not needed, or add await",
  },
  {
    name: "promise-constructor",
    pattern: /new\s+Promise\s*\(\s*(?:async|function)/g,
    severity: "medium",
    category: "Async",
    message: "Unnecessary Promise constructor (async executor or can be simplified)",
    fix: "Use async/await directly instead of wrapping in new Promise",
  },
  {
    name: "for-in-array",
    pattern: /for\s*\(\s*(?:const|let|var)\s+\w+\s+in\s+\w+\)/g,
    severity: "medium",
    category: "Iteration",
    message: "for...in iterates over all enumerable properties, not just indices",
    fix: "Use for...of for arrays, or Object.keys/entries for objects",
  },
  {
    name: "delete-operator",
    pattern: /\bdelete\s+\w+(\.\w+|\[\w+\])/g,
    severity: "low",
    category: "Performance",
    message: "delete operator can deoptimize objects",
    fix: "Set property to undefined, or use object destructuring with rest",
  },
  {
    name: "magic-number",
    pattern: /(?<![\w.])(?:0|[1-9]\d{2,})(?!\d)/g,
    severity: "low",
    category: "Code Quality",
    message: "Magic numbers reduce code readability",
    fix: "Extract to a named constant with descriptive name",
  },
];

// === File Discovery ===
async function findTypeScriptFiles(path: string): Promise<string[]> {
  const files: string[] = [];

  try {
    const stat = await Deno.stat(path);

    if (stat.isFile && (path.endsWith(".ts") || path.endsWith(".tsx"))) {
      files.push(path);
    } else if (stat.isDirectory) {
      for await (const entry of Deno.readDir(path)) {
        // Skip node_modules and hidden directories
        if (entry.name.startsWith(".") || entry.name === "node_modules") {
          continue;
        }

        const fullPath = `${path}/${entry.name}`;

        if (entry.isFile && (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx"))) {
          // Skip .d.ts declaration files
          if (!entry.name.endsWith(".d.ts")) {
            files.push(fullPath);
          }
        } else if (entry.isDirectory) {
          const subFiles = await findTypeScriptFiles(fullPath);
          files.push(...subFiles);
        }
      }
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      console.error(`Error: Path not found: ${path}`);
      Deno.exit(1);
    }
    throw error;
  }

  return files;
}

// === Analysis ===
function analyzeFile(
  filePath: string,
  content: string,
  options: AnalyzeOptions
): Issue[] {
  const issues: Issue[] = [];
  const lines = content.split("\n");

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const line = lines[lineNum];

    // Skip comment-only lines for some checks
    const trimmedLine = line.trim();
    const isCommentLine = trimmedLine.startsWith("//") || trimmedLine.startsWith("/*");

    for (const pattern of PATTERNS) {
      // Skip low severity in non-strict mode
      if (!options.strict && pattern.severity === "low") {
        continue;
      }

      // Reset regex lastIndex
      pattern.pattern.lastIndex = 0;

      let match;
      while ((match = pattern.pattern.exec(line)) !== null) {
        // Skip certain patterns in comments
        if (isCommentLine && !["todo-comment", "ts-ignore", "ts-nocheck"].includes(pattern.name)) {
          continue;
        }

        // Skip non-null assertion false positives (! in strings, comments, etc.)
        if (pattern.name === "non-null-assertion") {
          // Check if it's part of !== or !=
          const before = line.substring(0, match.index);
          const after = line.substring(match.index + match[0].length);
          if (before.endsWith("!") || after.startsWith("=")) {
            continue;
          }
          // Check if inside string
          const beforeQuotes = (before.match(/"/g) || []).length;
          const beforeSingleQuotes = (before.match(/'/g) || []).length;
          if (beforeQuotes % 2 === 1 || beforeSingleQuotes % 2 === 1) {
            continue;
          }
        }

        issues.push({
          severity: pattern.severity,
          category: pattern.category,
          message: pattern.message,
          file: filePath,
          line: lineNum + 1,
          column: match.index + 1,
          code: match[0],
          fix: options.fixHints ? pattern.fix : undefined,
        });
      }
    }
  }

  return issues;
}

async function analyze(options: AnalyzeOptions): Promise<AnalysisResult> {
  const files = await findTypeScriptFiles(options.path);

  if (files.length === 0) {
    console.error(`No TypeScript files found in: ${options.path}`);
    Deno.exit(1);
  }

  const allIssues: Issue[] = [];

  for (const file of files) {
    const content = await Deno.readTextFile(file);
    const issues = analyzeFile(file, content, options);
    allIssues.push(...issues);
  }

  // Sort by severity
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  allIssues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const summary = {
    critical: allIssues.filter((i) => i.severity === "critical").length,
    high: allIssues.filter((i) => i.severity === "high").length,
    medium: allIssues.filter((i) => i.severity === "medium").length,
    low: allIssues.filter((i) => i.severity === "low").length,
  };

  return {
    path: options.path,
    filesAnalyzed: files.length,
    issues: allIssues,
    summary,
  };
}

// === Output Formatting ===
function formatHumanOutput(result: AnalysisResult, showFixes: boolean): void {
  console.log("\nTYPESCRIPT ANALYSIS REPORT");
  console.log("==========================\n");
  console.log(`Path: ${result.path}`);
  console.log(`Files analyzed: ${result.filesAnalyzed}`);
  console.log();

  const total = result.summary.critical + result.summary.high + result.summary.medium + result.summary.low;

  console.log("ISSUES BY SEVERITY");
  console.log(`  Critical: ${result.summary.critical}`);
  console.log(`  High: ${result.summary.high}`);
  console.log(`  Medium: ${result.summary.medium}`);
  console.log(`  Low: ${result.summary.low}`);
  console.log(`  Total: ${total}`);
  console.log();

  if (result.issues.length === 0) {
    console.log("No issues found!");
    return;
  }

  console.log("ISSUES:");
  console.log();

  for (const issue of result.issues) {
    const severityLabel = `[${issue.severity.toUpperCase()}]`.padEnd(10);
    console.log(`${severityLabel} ${issue.category}: ${issue.message}`);
    console.log(`           File: ${issue.file}:${issue.line}:${issue.column}`);
    console.log(`           Code: ${issue.code}`);
    if (showFixes && issue.fix) {
      console.log(`           Fix: ${issue.fix}`);
    }
    console.log();
  }
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - TypeScript Code Analyzer

Usage:
  deno run --allow-read scripts/analyze.ts <path> [options]

Arguments:
  <path>          File or directory to analyze

Options:
  --strict        Enable all checks (including low severity)
  --json          Output JSON for programmatic use
  --fix-hints     Show suggested fixes for each issue
  -h, --help      Show this help

Examples:
  # Analyze a single file
  deno run --allow-read scripts/analyze.ts ./src/utils.ts

  # Analyze a directory
  deno run --allow-read scripts/analyze.ts ./src

  # Strict mode with fix hints
  deno run --allow-read scripts/analyze.ts ./src --strict --fix-hints

  # JSON output for CI integration
  deno run --allow-read scripts/analyze.ts ./src --json

Checks Performed:
  Type Safety:
    - any type usage
    - Non-null assertions (!)
    - Type assertions (as)
    - Broad types (object, Function)
    - @ts-ignore / @ts-nocheck

  Code Quality:
    - var keyword usage
    - Console statements
    - TODO/FIXME comments
    - Magic numbers

  Security:
    - eval() usage
    - innerHTML assignments
    - new Function()

  Async:
    - Unnecessary Promise constructors
    - Async functions without await

  Iteration:
    - for...in on arrays
`);
}

// === CLI Handler ===
function parseArgs(args: string[]): AnalyzeOptions | null {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    return null;
  }

  const options: AnalyzeOptions = {
    path: "",
    strict: false,
    json: false,
    fixHints: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--strict") {
      options.strict = true;
    } else if (arg === "--json") {
      options.json = true;
    } else if (arg === "--fix-hints") {
      options.fixHints = true;
    } else if (!arg.startsWith("-")) {
      options.path = arg;
    }
  }

  if (!options.path) {
    console.error("Error: Path is required");
    return null;
  }

  return options;
}

// === Entry Point ===
async function main(): Promise<void> {
  const options = parseArgs(Deno.args);

  if (!options) {
    printHelp();
    Deno.exit(0);
  }

  const result = await analyze(options);

  if (options.json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    formatHumanOutput(result, options.fixHints);
  }

  // Exit with error code if critical issues found
  if (result.summary.critical > 0) {
    Deno.exit(1);
  }
}

if (import.meta.main) {
  main();
}
