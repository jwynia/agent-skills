#!/usr/bin/env -S deno run --allow-read

/**
 * analyze-accessibility.ts - Design Accessibility Auditor
 *
 * Checks HTML/component files for design-related accessibility issues
 * including color contrast, focus states, touch targets, and motion.
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename, extname, resolve } from "jsr:@std/path@1.0.8";
import { walk } from "jsr:@std/fs@1.0.8/walk";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "analyze-accessibility";

// WCAG contrast ratios
const CONTRAST_AA_NORMAL = 4.5;
const CONTRAST_AA_LARGE = 3.0;
const CONTRAST_AAA_NORMAL = 7.0;
const CONTRAST_AAA_LARGE = 4.5;

// === Types ===
export interface A11yIssue {
  severity: "error" | "warning" | "info";
  category: "contrast" | "focus" | "motion" | "touch-target" | "semantics" | "images";
  element: string;
  line?: number;
  description: string;
  wcagCriteria: string;
  suggestion: string;
}

export interface A11yCheck {
  category: string;
  description: string;
  passed: boolean;
}

export interface AccessibilityAuditResult {
  filename: string;
  issues: A11yIssue[];
  warnings: A11yIssue[];
  passed: A11yCheck[];
  score: number;
}

interface AnalyzeOptions {
  input: string;
  level: "AA" | "AAA";
  format: "json" | "summary";
  pretty: boolean;
}

// === Color Utilities ===

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Try short hex
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) {
      return {
        r: parseInt(short[1] + short[1], 16),
        g: parseInt(short[2] + short[2], 16),
        b: parseInt(short[3] + short[3], 16),
      };
    }
    return null;
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

function getContrastRatio(color1: string, color2: string): number | null {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);

  if (!rgb1 || !rgb2) return null;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

// === Analysis Patterns ===

interface AnalysisPattern {
  pattern: RegExp;
  check: (match: RegExpMatchArray, content: string, lineNum: number) => A11yIssue | null;
}

const HTML_PATTERNS: AnalysisPattern[] = [
  // Missing alt text on images
  {
    pattern: /<img[^>]*(?!alt=)[^>]*>/gi,
    check: (match, _content, lineNum) => {
      if (!match[0].includes("alt=")) {
        return {
          severity: "error",
          category: "images",
          element: match[0].substring(0, 50) + "...",
          line: lineNum,
          description: "Image missing alt attribute",
          wcagCriteria: "1.1.1 Non-text Content",
          suggestion: 'Add alt="" for decorative images or descriptive alt text for informative images',
        };
      }
      return null;
    },
  },
  // Empty alt text should be intentional (for decorative images)
  {
    pattern: /<img[^>]*alt=""[^>]*>/gi,
    check: (match, _content, lineNum) => {
      // Check if it has role="presentation" or aria-hidden
      if (!match[0].includes('role="presentation"') && !match[0].includes("aria-hidden")) {
        return {
          severity: "info",
          category: "images",
          element: match[0].substring(0, 50) + "...",
          line: lineNum,
          description: "Image has empty alt - ensure this is decorative",
          wcagCriteria: "1.1.1 Non-text Content",
          suggestion: 'For decorative images, also add role="presentation" or aria-hidden="true"',
        };
      }
      return null;
    },
  },
  // Links without accessible names
  {
    pattern: /<a[^>]*>[\s]*<\/a>/gi,
    check: (match, _content, lineNum) => ({
      severity: "error",
      category: "semantics",
      element: match[0],
      line: lineNum,
      description: "Empty link - no accessible name",
      wcagCriteria: "2.4.4 Link Purpose",
      suggestion: "Add text content or aria-label to the link",
    }),
  },
  // Buttons without accessible names
  {
    pattern: /<button[^>]*>[\s]*<\/button>/gi,
    check: (match, _content, lineNum) => ({
      severity: "error",
      category: "semantics",
      element: match[0],
      line: lineNum,
      description: "Empty button - no accessible name",
      wcagCriteria: "4.1.2 Name, Role, Value",
      suggestion: "Add text content or aria-label to the button",
    }),
  },
  // Form inputs without labels
  {
    pattern: /<input[^>]*type=["'](?:text|email|password|tel|url|search|number)[^>]*>/gi,
    check: (match, content, lineNum) => {
      const idMatch = match[0].match(/id=["']([^"']+)["']/);
      if (idMatch) {
        const labelPattern = new RegExp(`for=["']${idMatch[1]}["']`);
        if (labelPattern.test(content)) {
          return null;
        }
      }
      if (match[0].includes("aria-label") || match[0].includes("aria-labelledby")) {
        return null;
      }
      return {
        severity: "error",
        category: "semantics",
        element: match[0].substring(0, 50) + "...",
        line: lineNum,
        description: "Form input missing associated label",
        wcagCriteria: "1.3.1 Info and Relationships",
        suggestion: "Add a <label> with matching for attribute, or use aria-label",
      };
    },
  },
  // Check for outline:none without alternative focus styles
  {
    pattern: /outline:\s*(?:none|0);?/gi,
    check: (match, _content, lineNum) => ({
      severity: "warning",
      category: "focus",
      element: "CSS rule",
      line: lineNum,
      description: "outline:none detected - ensure alternative focus indicator exists",
      wcagCriteria: "2.4.7 Focus Visible",
      suggestion: "Replace with visible focus styles (box-shadow, border, etc.)",
    }),
  },
  // Check for :focus without styles
  {
    pattern: /:focus\s*\{[^}]*\}/gi,
    check: (match, _content, lineNum) => {
      // Check if focus rule has meaningful styles
      const rule = match[0];
      if (
        rule.includes("outline") ||
        rule.includes("box-shadow") ||
        rule.includes("border") ||
        rule.includes("background")
      ) {
        return null; // Has focus styling
      }
      return {
        severity: "info",
        category: "focus",
        element: ":focus rule",
        line: lineNum,
        description: "Focus rule may lack visible indicator",
        wcagCriteria: "2.4.7 Focus Visible",
        suggestion: "Ensure :focus includes visible changes (outline, shadow, border)",
      };
    },
  },
  // Check for animations without reduced motion support
  {
    pattern: /@keyframes\s+[\w-]+/gi,
    check: (match, content, _lineNum) => {
      if (!content.includes("prefers-reduced-motion")) {
        return {
          severity: "warning",
          category: "motion",
          element: match[0],
          line: undefined,
          description: "Animation detected without prefers-reduced-motion support",
          wcagCriteria: "2.3.3 Animation from Interactions",
          suggestion:
            "Add @media (prefers-reduced-motion: reduce) to disable/reduce animations",
        };
      }
      return null;
    },
  },
  // Check for small touch targets
  {
    pattern: /(?:width|height|min-width|min-height):\s*(\d+)(px|rem)/gi,
    check: (match, _content, lineNum) => {
      const value = parseInt(match[1]);
      const unit = match[2];

      // Convert to px for comparison
      let pxValue = value;
      if (unit === "rem") {
        pxValue = value * 16;
      }

      // Only flag if it looks like a button/link target
      if (pxValue < 44) {
        return {
          severity: "info",
          category: "touch-target",
          element: `size: ${match[0]}`,
          line: lineNum,
          description: `Small dimension (${pxValue}px) - verify touch target is at least 44x44px`,
          wcagCriteria: "2.5.5 Target Size",
          suggestion: "Ensure interactive elements have at least 44x44px touch target",
        };
      }
      return null;
    },
  },
  // Check for text in SVGs without title/desc
  {
    pattern: /<svg[^>]*>[\s\S]*?<\/svg>/gi,
    check: (match, _content, lineNum) => {
      const svg = match[0];
      if (svg.includes("<text") && !svg.includes("<title") && !svg.includes("aria-label")) {
        return {
          severity: "warning",
          category: "images",
          element: "SVG with text",
          line: lineNum,
          description: "SVG with text content but no accessible name",
          wcagCriteria: "1.1.1 Non-text Content",
          suggestion: "Add <title> element or aria-label to SVG",
        };
      }
      return null;
    },
  },
  // Check for autoplay on video/audio
  {
    pattern: /<(?:video|audio)[^>]*autoplay[^>]*>/gi,
    check: (match, _content, lineNum) => {
      if (!match[0].includes("muted")) {
        return {
          severity: "error",
          category: "motion",
          element: match[0].substring(0, 50) + "...",
          line: lineNum,
          description: "Autoplay media without muted attribute",
          wcagCriteria: "1.4.2 Audio Control",
          suggestion: 'Add muted attribute or provide pause controls',
        };
      }
      return null;
    },
  },
];

// === Analysis Functions ===

function getLineNumber(content: string, index: number): number {
  return content.substring(0, index).split("\n").length;
}

function analyzeContent(content: string, filename: string): A11yIssue[] {
  const issues: A11yIssue[] = [];

  for (const { pattern, check } of HTML_PATTERNS) {
    // Reset regex
    pattern.lastIndex = 0;
    let match;

    while ((match = pattern.exec(content)) !== null) {
      const lineNum = getLineNumber(content, match.index);
      const issue = check(match, content, lineNum);
      if (issue) {
        issues.push(issue);
      }
    }
  }

  return issues;
}

function analyzeColorContrast(
  content: string,
  level: "AA" | "AAA"
): A11yIssue[] {
  const issues: A11yIssue[] = [];

  // Extract color pairs from inline styles
  const colorPairs: Array<{ fg: string; bg: string; context: string }> = [];

  // Look for color and background-color in same rule
  const ruleRegex = /\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(content)) !== null) {
    const rule = match[1];
    const colorMatch = rule.match(/(?:^|;)\s*color:\s*(#[a-f0-9]{3,6})/i);
    const bgMatch = rule.match(/background(?:-color)?:\s*(#[a-f0-9]{3,6})/i);

    if (colorMatch && bgMatch) {
      colorPairs.push({
        fg: colorMatch[1],
        bg: bgMatch[1],
        context: match[0].substring(0, 50),
      });
    }
  }

  // Check contrast for each pair
  const minRatio = level === "AAA" ? CONTRAST_AAA_NORMAL : CONTRAST_AA_NORMAL;

  for (const pair of colorPairs) {
    const ratio = getContrastRatio(pair.fg, pair.bg);
    if (ratio && ratio < minRatio) {
      issues.push({
        severity: "error",
        category: "contrast",
        element: pair.context,
        description: `Insufficient contrast ratio: ${ratio.toFixed(2)}:1 (requires ${minRatio}:1 for ${level})`,
        wcagCriteria: "1.4.3 Contrast (Minimum)",
        suggestion: `Increase contrast between ${pair.fg} and ${pair.bg}`,
      });
    }
  }

  return issues;
}

function generatePassedChecks(issues: A11yIssue[]): A11yCheck[] {
  const checks: A11yCheck[] = [];
  const categories = ["contrast", "focus", "motion", "touch-target", "semantics", "images"];

  for (const category of categories) {
    const categoryIssues = issues.filter((i) => i.category === category);
    const hasErrors = categoryIssues.some((i) => i.severity === "error");

    if (!hasErrors) {
      checks.push({
        category,
        description: `No ${category} errors detected`,
        passed: true,
      });
    }
  }

  return checks;
}

function calculateScore(issues: A11yIssue[]): number {
  // Start with 100, deduct points for issues
  let score = 100;

  for (const issue of issues) {
    switch (issue.severity) {
      case "error":
        score -= 15;
        break;
      case "warning":
        score -= 5;
        break;
      case "info":
        score -= 1;
        break;
    }
  }

  return Math.max(0, Math.min(100, score));
}

// === Core Analysis Function ===

export async function analyzeAccessibility(
  options: AnalyzeOptions
): Promise<AccessibilityAuditResult[]> {
  const results: AccessibilityAuditResult[] = [];
  const inputPath = resolve(options.input);

  // Supported extensions
  const exts = [".html", ".htm", ".tsx", ".jsx", ".vue", ".svelte", ".css"];

  // Collect files
  const files: string[] = [];

  try {
    const stat = await Deno.stat(inputPath);

    if (stat.isDirectory) {
      for await (const entry of walk(inputPath, {
        exts: exts.map((e) => e.slice(1)),
        includeDirs: false,
      })) {
        files.push(entry.path);
      }
    } else if (stat.isFile && exts.includes(extname(inputPath))) {
      files.push(inputPath);
    } else {
      throw new Error(`Input must be a supported file or directory: ${inputPath}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File or directory not found: ${inputPath}`);
    }
    throw error;
  }

  if (files.length === 0) {
    throw new Error(`No supported files found in: ${inputPath}`);
  }

  // Analyze each file
  for (const file of files) {
    const content = await Deno.readTextFile(file);

    const issues = [
      ...analyzeContent(content, basename(file)),
      ...analyzeColorContrast(content, options.level),
    ];

    const errors = issues.filter((i) => i.severity === "error");
    const warnings = issues.filter((i) => i.severity === "warning" || i.severity === "info");
    const passed = generatePassedChecks(issues);
    const score = calculateScore(issues);

    results.push({
      filename: basename(file),
      issues: errors,
      warnings,
      passed,
      score,
    });
  }

  return results;
}

// === Output Formatting ===

function formatSummary(results: AccessibilityAuditResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    lines.push(`\n${"=".repeat(60)}`);
    lines.push(`FILE: ${result.filename}`);
    lines.push(`SCORE: ${result.score}/100`);
    lines.push("=".repeat(60));

    if (result.issues.length > 0) {
      lines.push("\nERRORS:");
      for (const issue of result.issues) {
        lines.push(`  [${issue.category.toUpperCase()}] ${issue.description}`);
        if (issue.line) lines.push(`    Line: ${issue.line}`);
        lines.push(`    WCAG: ${issue.wcagCriteria}`);
        lines.push(`    Fix: ${issue.suggestion}`);
      }
    }

    if (result.warnings.length > 0) {
      lines.push("\nWARNINGS:");
      for (const warning of result.warnings) {
        lines.push(`  [${warning.category.toUpperCase()}] ${warning.description}`);
        if (warning.line) lines.push(`    Line: ${warning.line}`);
        lines.push(`    Fix: ${warning.suggestion}`);
      }
    }

    if (result.passed.length > 0) {
      lines.push("\nPASSED:");
      for (const check of result.passed) {
        lines.push(`  [OK] ${check.description}`);
      }
    }
  }

  // Summary
  const totalErrors = results.reduce((sum, r) => sum + r.issues.length, 0);
  const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0);
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

  lines.push(`\n${"=".repeat(60)}`);
  lines.push("SUMMARY");
  lines.push("=".repeat(60));
  lines.push(`Files analyzed: ${results.length}`);
  lines.push(`Total errors: ${totalErrors}`);
  lines.push(`Total warnings: ${totalWarnings}`);
  lines.push(`Average score: ${avgScore.toFixed(1)}/100`);

  return lines.join("\n");
}

// === Help Text ===

function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Design Accessibility Auditor

Checks HTML/component files for design-related accessibility issues
including color contrast, focus states, touch targets, and motion.

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input> [options]

Arguments:
  <input>              HTML/component file or directory

Options:
  -h, --help           Show this help message
  -v, --version        Show version
  --level <AA|AAA>     WCAG conformance level (default: AA)
  --format <type>      Output format: json (default), summary
  --pretty             Pretty-print JSON output

Supported Files:
  .html, .htm, .tsx, .jsx, .vue, .svelte, .css

Checks Performed:
  - Color contrast ratios
  - Focus indicator presence
  - Touch target sizes
  - Motion and animation accessibility
  - Image alt text
  - Form label associations
  - Semantic structure

Examples:
  # Audit a component file
  deno run --allow-read scripts/${SCRIPT_NAME}.ts Button.tsx

  # Audit all components with AAA level
  deno run --allow-read scripts/${SCRIPT_NAME}.ts ./src/components --level AAA

  # Get a human-readable summary
  deno run --allow-read scripts/${SCRIPT_NAME}.ts ./src --format summary
`);
}

// === Main CLI Handler ===

async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "version", "pretty"],
    string: ["level", "format"],
    alias: { h: "help", v: "version" },
    default: { level: "AA", format: "json", pretty: false },
  });

  if (parsed.help) {
    printHelp();
    Deno.exit(0);
  }

  if (parsed.version) {
    console.log(`${SCRIPT_NAME} v${VERSION}`);
    Deno.exit(0);
  }

  const input = parsed._[0] as string;

  if (!input) {
    console.error("Error: Input file or directory required");
    console.error("Use --help for usage information");
    Deno.exit(1);
  }

  if (!["AA", "AAA"].includes(parsed.level)) {
    console.error(`Error: Invalid level '${parsed.level}'. Use AA or AAA.`);
    Deno.exit(1);
  }

  const options: AnalyzeOptions = {
    input,
    level: parsed.level as "AA" | "AAA",
    format: parsed.format as "json" | "summary",
    pretty: parsed.pretty,
  };

  try {
    const results = await analyzeAccessibility(options);

    if (options.format === "summary") {
      console.log(formatSummary(results));
    } else {
      const output = options.pretty
        ? JSON.stringify(results, null, 2)
        : JSON.stringify(results);
      console.log(output);
    }

    // Exit with error code if there are issues
    const hasErrors = results.some((r) => r.issues.length > 0);
    if (hasErrors) {
      Deno.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

// === Entry Point ===

if (import.meta.main) {
  main(Deno.args);
}
