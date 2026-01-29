#!/usr/bin/env -S deno run --allow-read

/**
 * analyze-styles.ts - CSS Style Auditor
 *
 * Analyzes CSS files to extract color, typography, spacing patterns
 * and identify design inconsistencies.
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename, extname, resolve } from "jsr:@std/path@1.0.8";
import { walk } from "jsr:@std/fs@1.0.8/walk";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "analyze-styles";

// === Types ===
export interface ColorUsage {
  value: string;
  normalizedHex: string;
  count: number;
  locations: string[];
  suggestedTokenName?: string;
}

export interface TypographyUsage {
  property: "font-family" | "font-size" | "font-weight" | "line-height";
  value: string;
  count: number;
  locations: string[];
}

export interface SpacingUsage {
  property: string;
  value: string;
  count: number;
  locations: string[];
}

export interface StyleInconsistency {
  type: "color" | "font" | "spacing" | "z-index";
  description: string;
  values: string[];
  suggestion: string;
}

export interface StyleAuditResult {
  filename: string;
  summary: {
    totalSelectors: number;
    totalDeclarations: number;
    uniqueColors: number;
    uniqueFonts: number;
    uniqueSpacingValues: number;
  };
  colors: ColorUsage[];
  typography: TypographyUsage[];
  spacing: SpacingUsage[];
  inconsistencies: StyleInconsistency[];
  recommendations: string[];
}

interface AnalyzeOptions {
  input: string;
  tokensFile?: string;
  pretty: boolean;
  format: "json" | "summary";
}

// === Color Utilities ===

const COLOR_REGEX =
  /#(?:[0-9a-fA-F]{3}){1,2}\b|rgb\([^)]+\)|rgba\([^)]+\)|hsl\([^)]+\)|hsla\([^)]+\)|(?:transparent|currentColor|inherit)\b/gi;

const NAMED_COLORS: Record<string, string> = {
  black: "#000000",
  white: "#ffffff",
  red: "#ff0000",
  green: "#008000",
  blue: "#0000ff",
  yellow: "#ffff00",
  cyan: "#00ffff",
  magenta: "#ff00ff",
  gray: "#808080",
  grey: "#808080",
};

function normalizeColor(color: string): string {
  const lower = color.toLowerCase().trim();

  // Handle named colors
  if (NAMED_COLORS[lower]) {
    return NAMED_COLORS[lower];
  }

  // Handle hex shorthand
  if (/^#[0-9a-f]{3}$/i.test(lower)) {
    const r = lower[1];
    const g = lower[2];
    const b = lower[3];
    return `#${r}${r}${g}${g}${b}${b}`;
  }

  // Handle rgb/rgba
  const rgbMatch = lower.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, "0");
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, "0");
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, "0");
    return `#${r}${g}${b}`;
  }

  // Already normalized hex or other
  return lower;
}

function suggestTokenName(hex: string, index: number): string {
  // Simple heuristic based on luminance
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  if (luminance > 0.9) return `color-light-${index}`;
  if (luminance < 0.1) return `color-dark-${index}`;
  if (r > g && r > b) return `color-red-${index}`;
  if (g > r && g > b) return `color-green-${index}`;
  if (b > r && b > g) return `color-blue-${index}`;
  return `color-neutral-${index}`;
}

// === CSS Parsing ===

interface Declaration {
  property: string;
  value: string;
  selector: string;
}

function parseCSS(css: string): Declaration[] {
  const declarations: Declaration[] = [];
  let currentSelector = "";

  // Remove comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Simple regex-based parser (handles most common cases)
  const ruleRegex = /([^{]+)\{([^}]+)\}/g;
  let match;

  while ((match = ruleRegex.exec(cleaned)) !== null) {
    currentSelector = match[1].trim();
    const body = match[2];

    // Parse declarations
    const declRegex = /([a-z-]+)\s*:\s*([^;]+);?/gi;
    let declMatch;

    while ((declMatch = declRegex.exec(body)) !== null) {
      declarations.push({
        property: declMatch[1].toLowerCase().trim(),
        value: declMatch[2].trim(),
        selector: currentSelector,
      });
    }
  }

  return declarations;
}

// === Analysis Functions ===

function analyzeColors(declarations: Declaration[]): ColorUsage[] {
  const colorMap = new Map<string, ColorUsage>();

  const colorProperties = [
    "color",
    "background-color",
    "background",
    "border-color",
    "border",
    "border-top-color",
    "border-right-color",
    "border-bottom-color",
    "border-left-color",
    "outline-color",
    "box-shadow",
    "text-shadow",
    "fill",
    "stroke",
  ];

  for (const decl of declarations) {
    if (colorProperties.some((p) => decl.property.includes(p))) {
      const colors = decl.value.match(COLOR_REGEX) || [];

      for (const color of colors) {
        if (color === "transparent" || color === "currentColor" || color === "inherit") {
          continue;
        }

        const normalized = normalizeColor(color);
        const location = `${decl.selector}:${decl.property}`;

        if (colorMap.has(normalized)) {
          const existing = colorMap.get(normalized)!;
          existing.count++;
          if (!existing.locations.includes(location)) {
            existing.locations.push(location);
          }
        } else {
          colorMap.set(normalized, {
            value: color,
            normalizedHex: normalized,
            count: 1,
            locations: [location],
          });
        }
      }
    }
  }

  // Add suggested token names
  const colors = Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  colors.forEach((c, i) => {
    c.suggestedTokenName = suggestTokenName(c.normalizedHex, i + 1);
  });

  return colors;
}

function analyzeTypography(declarations: Declaration[]): TypographyUsage[] {
  const typoMap = new Map<string, TypographyUsage>();
  const typoProperties = ["font-family", "font-size", "font-weight", "line-height"];

  for (const decl of declarations) {
    if (typoProperties.includes(decl.property)) {
      const key = `${decl.property}:${decl.value}`;
      const location = `${decl.selector}:${decl.property}`;

      if (typoMap.has(key)) {
        const existing = typoMap.get(key)!;
        existing.count++;
        if (!existing.locations.includes(location)) {
          existing.locations.push(location);
        }
      } else {
        typoMap.set(key, {
          property: decl.property as TypographyUsage["property"],
          value: decl.value,
          count: 1,
          locations: [location],
        });
      }
    }
  }

  return Array.from(typoMap.values()).sort((a, b) => b.count - a.count);
}

function analyzeSpacing(declarations: Declaration[]): SpacingUsage[] {
  const spacingMap = new Map<string, SpacingUsage>();
  const spacingProperties = [
    "margin",
    "margin-top",
    "margin-right",
    "margin-bottom",
    "margin-left",
    "padding",
    "padding-top",
    "padding-right",
    "padding-bottom",
    "padding-left",
    "gap",
    "row-gap",
    "column-gap",
  ];

  for (const decl of declarations) {
    if (spacingProperties.includes(decl.property)) {
      const key = `${decl.property}:${decl.value}`;
      const location = `${decl.selector}:${decl.property}`;

      if (spacingMap.has(key)) {
        const existing = spacingMap.get(key)!;
        existing.count++;
        if (!existing.locations.includes(location)) {
          existing.locations.push(location);
        }
      } else {
        spacingMap.set(key, {
          property: decl.property,
          value: decl.value,
          count: 1,
          locations: [location],
        });
      }
    }
  }

  return Array.from(spacingMap.values()).sort((a, b) => b.count - a.count);
}

function findInconsistencies(
  colors: ColorUsage[],
  typography: TypographyUsage[],
  spacing: SpacingUsage[]
): StyleInconsistency[] {
  const inconsistencies: StyleInconsistency[] = [];

  // Check for similar but different colors
  const hexColors = colors.map((c) => c.normalizedHex);
  for (let i = 0; i < hexColors.length; i++) {
    for (let j = i + 1; j < hexColors.length; j++) {
      const c1 = hexColors[i];
      const c2 = hexColors[j];
      if (c1 && c2 && areColorsSimilar(c1, c2)) {
        inconsistencies.push({
          type: "color",
          description: `Similar colors found that could be consolidated`,
          values: [c1, c2],
          suggestion: `Consider using a single color token for these similar values`,
        });
      }
    }
  }

  // Check for too many unique font families
  const fontFamilies = typography.filter((t) => t.property === "font-family");
  if (fontFamilies.length > 3) {
    inconsistencies.push({
      type: "font",
      description: `Too many font families (${fontFamilies.length}) - consider limiting to 2-3`,
      values: fontFamilies.map((f) => f.value),
      suggestion: "Use a display font, body font, and optionally a monospace font",
    });
  }

  // Check for inconsistent spacing values
  const spacingValues = [...new Set(spacing.map((s) => s.value))];
  if (spacingValues.length > 10) {
    inconsistencies.push({
      type: "spacing",
      description: `Many unique spacing values (${spacingValues.length}) - consider a consistent scale`,
      values: spacingValues.slice(0, 10),
      suggestion: "Use a spacing scale (4px, 8px, 12px, 16px, 24px, 32px, etc.)",
    });
  }

  return inconsistencies;
}

function areColorsSimilar(hex1: string, hex2: string): boolean {
  if (!hex1.startsWith("#") || !hex2.startsWith("#")) return false;

  const r1 = parseInt(hex1.slice(1, 3), 16);
  const g1 = parseInt(hex1.slice(3, 5), 16);
  const b1 = parseInt(hex1.slice(5, 7), 16);

  const r2 = parseInt(hex2.slice(1, 3), 16);
  const g2 = parseInt(hex2.slice(3, 5), 16);
  const b2 = parseInt(hex2.slice(5, 7), 16);

  const distance = Math.sqrt(
    Math.pow(r1 - r2, 2) + Math.pow(g1 - g2, 2) + Math.pow(b1 - b2, 2)
  );

  // Colors within distance of 30 are considered similar
  return distance > 0 && distance < 30;
}

function generateRecommendations(
  result: Omit<StyleAuditResult, "recommendations">
): string[] {
  const recommendations: string[] = [];

  // Color recommendations
  if (result.colors.length > 15) {
    recommendations.push(
      `Consider reducing color palette from ${result.colors.length} to 10-15 colors with a design token system`
    );
  }

  // Typography recommendations
  const genericFonts = result.typography.filter(
    (t) =>
      t.property === "font-family" &&
      /arial|helvetica|roboto|inter|system-ui/i.test(t.value)
  );
  if (genericFonts.length > 0) {
    recommendations.push(
      "Replace generic fonts (Arial, Helvetica, Roboto, Inter) with distinctive alternatives"
    );
  }

  // Spacing recommendations
  const pixelSpacing = result.spacing.filter((s) => /^\d+px$/.test(s.value));
  if (pixelSpacing.length > 5) {
    recommendations.push(
      "Convert pixel-based spacing to rem units for better accessibility"
    );
  }

  // Inconsistency-based recommendations
  if (result.inconsistencies.length > 0) {
    recommendations.push(
      `Address ${result.inconsistencies.length} design inconsistencies identified in the audit`
    );
  }

  return recommendations;
}

// === Core Analysis Function ===

export async function analyzeStyles(options: AnalyzeOptions): Promise<StyleAuditResult[]> {
  const results: StyleAuditResult[] = [];
  const inputPath = resolve(options.input);

  // Collect CSS files
  const cssFiles: string[] = [];

  try {
    const stat = await Deno.stat(inputPath);

    if (stat.isDirectory) {
      for await (const entry of walk(inputPath, {
        exts: [".css"],
        includeDirs: false,
      })) {
        cssFiles.push(entry.path);
      }
    } else if (stat.isFile && extname(inputPath) === ".css") {
      cssFiles.push(inputPath);
    } else {
      throw new Error(`Input must be a CSS file or directory: ${inputPath}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File or directory not found: ${inputPath}`);
    }
    throw error;
  }

  if (cssFiles.length === 0) {
    throw new Error(`No CSS files found in: ${inputPath}`);
  }

  // Analyze each file
  for (const file of cssFiles) {
    const css = await Deno.readTextFile(file);
    const declarations = parseCSS(css);

    const colors = analyzeColors(declarations);
    const typography = analyzeTypography(declarations);
    const spacing = analyzeSpacing(declarations);
    const inconsistencies = findInconsistencies(colors, typography, spacing);

    const uniqueSelectors = new Set(declarations.map((d) => d.selector));

    const partialResult = {
      filename: basename(file),
      summary: {
        totalSelectors: uniqueSelectors.size,
        totalDeclarations: declarations.length,
        uniqueColors: colors.length,
        uniqueFonts: typography.filter((t) => t.property === "font-family").length,
        uniqueSpacingValues: spacing.length,
      },
      colors,
      typography,
      spacing,
      inconsistencies,
    };

    results.push({
      ...partialResult,
      recommendations: generateRecommendations(partialResult),
    });
  }

  return results;
}

// === Output Formatting ===

function formatSummary(results: StyleAuditResult[]): string {
  const lines: string[] = [];

  for (const result of results) {
    lines.push(`\n${"=".repeat(60)}`);
    lines.push(`FILE: ${result.filename}`);
    lines.push("=".repeat(60));

    lines.push("\nSUMMARY:");
    lines.push(`  Selectors: ${result.summary.totalSelectors}`);
    lines.push(`  Declarations: ${result.summary.totalDeclarations}`);
    lines.push(`  Unique Colors: ${result.summary.uniqueColors}`);
    lines.push(`  Unique Fonts: ${result.summary.uniqueFonts}`);
    lines.push(`  Unique Spacing: ${result.summary.uniqueSpacingValues}`);

    if (result.colors.length > 0) {
      lines.push("\nTOP COLORS:");
      result.colors.slice(0, 5).forEach((c) => {
        lines.push(`  ${c.normalizedHex} (${c.count}x) → ${c.suggestedTokenName}`);
      });
    }

    if (result.typography.length > 0) {
      lines.push("\nTYPOGRAPHY:");
      result.typography
        .filter((t) => t.property === "font-family")
        .slice(0, 3)
        .forEach((t) => {
          lines.push(`  ${t.value} (${t.count}x)`);
        });
    }

    if (result.inconsistencies.length > 0) {
      lines.push("\nINCONSISTENCIES:");
      result.inconsistencies.forEach((i) => {
        lines.push(`  [${i.type.toUpperCase()}] ${i.description}`);
      });
    }

    if (result.recommendations.length > 0) {
      lines.push("\nRECOMMENDATIONS:");
      result.recommendations.forEach((r) => {
        lines.push(`  • ${r}`);
      });
    }
  }

  return lines.join("\n");
}

// === Help Text ===

function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - CSS Style Auditor

Analyzes CSS files to extract color, typography, spacing patterns
and identify design inconsistencies.

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input> [options]

Arguments:
  <input>              CSS file or directory containing CSS files

Options:
  -h, --help           Show this help message
  -v, --version        Show version
  --tokens <file>      Compare against existing design tokens file
  --pretty             Pretty-print JSON output
  --format <type>      Output format: json (default), summary

Examples:
  # Analyze a single CSS file
  deno run --allow-read scripts/${SCRIPT_NAME}.ts styles.css

  # Analyze all CSS in a directory with pretty output
  deno run --allow-read scripts/${SCRIPT_NAME}.ts ./src --pretty

  # Get a human-readable summary
  deno run --allow-read scripts/${SCRIPT_NAME}.ts ./src --format summary

  # Compare against existing tokens
  deno run --allow-read scripts/${SCRIPT_NAME}.ts styles.css --tokens tokens.json
`);
}

// === Main CLI Handler ===

async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "version", "pretty"],
    string: ["tokens", "format"],
    alias: { h: "help", v: "version" },
    default: { format: "json", pretty: false },
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

  const options: AnalyzeOptions = {
    input,
    tokensFile: parsed.tokens,
    pretty: parsed.pretty,
    format: parsed.format as "json" | "summary",
  };

  try {
    const results = await analyzeStyles(options);

    if (options.format === "summary") {
      console.log(formatSummary(results));
    } else {
      const output = options.pretty
        ? JSON.stringify(results, null, 2)
        : JSON.stringify(results);
      console.log(output);
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
