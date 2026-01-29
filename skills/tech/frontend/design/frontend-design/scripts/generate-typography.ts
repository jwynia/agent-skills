#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-typography.ts - Typography System Generator
 *
 * Generates typography systems with font stacks, scales, and responsive sizing.
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { resolve } from "jsr:@std/path@1.0.8";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-typography";

type Scale = "minor-second" | "major-second" | "minor-third" | "major-third" | "perfect-fourth" | "golden-ratio";
type LineHeight = "tight" | "normal" | "relaxed";
type OutputFormat = "css" | "scss" | "tailwind" | "tokens";

const SCALE_RATIOS: Record<Scale, number> = {
  "minor-second": 1.067,
  "major-second": 1.125,
  "minor-third": 1.2,
  "major-third": 1.25,
  "perfect-fourth": 1.333,
  "golden-ratio": 1.618,
};

const LINE_HEIGHTS: Record<LineHeight, number> = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

// === Types ===
export interface TypographySpec {
  fonts: {
    display?: string;
    body?: string;
    mono?: string;
  };
  scale?: Scale;
  baseSize?: number;
  lineHeights?: LineHeight;
  responsive?: boolean;
  outputFormat: OutputFormat;
  includeUtilities?: boolean;
}

export interface GeneratedTypography {
  fontFamilies: {
    display: string;
    body: string;
    mono: string;
  };
  fontSizes: Record<string, { size: string; lineHeight: string }>;
  fontWeights: Record<string, number>;
  letterSpacing: Record<string, string>;
  responsive?: {
    sm: Record<string, string>;
    md: Record<string, string>;
    lg: Record<string, string>;
  };
}

interface GenerateOptions {
  specFile?: string;
  display?: string;
  body?: string;
  mono?: string;
  scale: Scale;
  base: number;
  lineHeight: LineHeight;
  responsive: boolean;
  format: OutputFormat;
  output?: string;
}

// === Font Stacks ===

const FALLBACK_STACKS = {
  serif: "Georgia, Cambria, 'Times New Roman', Times, serif",
  sansSerif: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
  mono: "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
};

function createFontStack(font: string | undefined, type: "display" | "body" | "mono"): string {
  if (!font) {
    if (type === "mono") return FALLBACK_STACKS.mono;
    return FALLBACK_STACKS.sansSerif;
  }

  // Wrap font name in quotes if it contains spaces
  const fontName = font.includes(" ") ? `'${font}'` : font;

  // Determine fallback based on font characteristics
  const isSerif = /serif|georgia|times|garamond|palatino|baskerville/i.test(font);
  const isMono = /mono|code|courier|consolas/i.test(font);

  if (isMono || type === "mono") {
    return `${fontName}, ${FALLBACK_STACKS.mono}`;
  }
  if (isSerif) {
    return `${fontName}, ${FALLBACK_STACKS.serif}`;
  }
  return `${fontName}, ${FALLBACK_STACKS.sansSerif}`;
}

// === Scale Generation ===

function generateFontSizes(baseSize: number, ratio: number, lineHeight: number): Record<string, { size: string; lineHeight: string }> {
  const sizes: Record<string, { size: string; lineHeight: string }> = {};

  // Generate sizes from xs to 6xl
  const steps = [
    { name: "xs", step: -2 },
    { name: "sm", step: -1 },
    { name: "base", step: 0 },
    { name: "lg", step: 1 },
    { name: "xl", step: 2 },
    { name: "2xl", step: 3 },
    { name: "3xl", step: 4 },
    { name: "4xl", step: 5 },
    { name: "5xl", step: 6 },
    { name: "6xl", step: 7 },
  ];

  for (const { name, step } of steps) {
    const size = baseSize * Math.pow(ratio, step);
    // Larger text needs tighter line height
    const adjustedLineHeight = step >= 3 ? lineHeight * 0.85 : lineHeight;

    sizes[name] = {
      size: `${(size / 16).toFixed(3)}rem`,
      lineHeight: adjustedLineHeight.toFixed(2),
    };
  }

  return sizes;
}

function generateFontWeights(): Record<string, number> {
  return {
    thin: 100,
    extralight: 200,
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
    black: 900,
  };
}

function generateLetterSpacing(): Record<string, string> {
  return {
    tighter: "-0.05em",
    tight: "-0.025em",
    normal: "0",
    wide: "0.025em",
    wider: "0.05em",
    widest: "0.1em",
  };
}

function generateResponsiveSizes(
  fontSizes: Record<string, { size: string; lineHeight: string }>
): GeneratedTypography["responsive"] {
  const responsive: GeneratedTypography["responsive"] = {
    sm: {},
    md: {},
    lg: {},
  };

  // At smaller screens, reduce large text sizes
  for (const [name, { size }] of Object.entries(fontSizes)) {
    const remValue = parseFloat(size);

    if (remValue > 2) {
      // Large text scales down on smaller screens
      responsive!.sm[name] = `${(remValue * 0.7).toFixed(3)}rem`;
      responsive!.md[name] = `${(remValue * 0.85).toFixed(3)}rem`;
      responsive!.lg[name] = size;
    } else if (remValue > 1.5) {
      responsive!.sm[name] = `${(remValue * 0.85).toFixed(3)}rem`;
      responsive!.md[name] = `${(remValue * 0.92).toFixed(3)}rem`;
      responsive!.lg[name] = size;
    } else {
      // Smaller text stays consistent
      responsive!.sm[name] = size;
      responsive!.md[name] = size;
      responsive!.lg[name] = size;
    }
  }

  return responsive;
}

// === Core Generation Function ===

export async function generateTypography(options: GenerateOptions): Promise<GeneratedTypography> {
  let spec: TypographySpec;

  if (options.specFile) {
    const specContent = await Deno.readTextFile(resolve(options.specFile));
    spec = JSON.parse(specContent);
  } else {
    spec = {
      fonts: {
        display: options.display,
        body: options.body,
        mono: options.mono,
      },
      scale: options.scale,
      baseSize: options.base,
      lineHeights: options.lineHeight,
      responsive: options.responsive,
      outputFormat: options.format,
    };
  }

  const ratio = SCALE_RATIOS[spec.scale || "major-third"];
  const baseSize = spec.baseSize || 16;
  const lineHeight = LINE_HEIGHTS[spec.lineHeights || "normal"];

  const typography: GeneratedTypography = {
    fontFamilies: {
      display: createFontStack(spec.fonts.display, "display"),
      body: createFontStack(spec.fonts.body, "body"),
      mono: createFontStack(spec.fonts.mono, "mono"),
    },
    fontSizes: generateFontSizes(baseSize, ratio, lineHeight),
    fontWeights: generateFontWeights(),
    letterSpacing: generateLetterSpacing(),
  };

  if (spec.responsive) {
    typography.responsive = generateResponsiveSizes(typography.fontSizes);
  }

  return typography;
}

// === Output Formatting ===

function formatAsCSS(typography: GeneratedTypography, responsive: boolean): string {
  const lines: string[] = [
    "/* Typography System - Generated by generate-typography */",
    "",
    ":root {",
    "  /* Font Families */",
    `  --font-display: ${typography.fontFamilies.display};`,
    `  --font-body: ${typography.fontFamilies.body};`,
    `  --font-mono: ${typography.fontFamilies.mono};`,
    "",
    "  /* Font Sizes */",
  ];

  for (const [name, { size, lineHeight }] of Object.entries(typography.fontSizes)) {
    lines.push(`  --text-${name}: ${size};`);
    lines.push(`  --leading-${name}: ${lineHeight};`);
  }

  lines.push("");
  lines.push("  /* Font Weights */");
  for (const [name, weight] of Object.entries(typography.fontWeights)) {
    lines.push(`  --font-${name}: ${weight};`);
  }

  lines.push("");
  lines.push("  /* Letter Spacing */");
  for (const [name, spacing] of Object.entries(typography.letterSpacing)) {
    lines.push(`  --tracking-${name}: ${spacing};`);
  }

  lines.push("}");

  if (responsive && typography.responsive) {
    lines.push("");
    lines.push("/* Responsive Font Sizes */");

    lines.push("@media (max-width: 640px) {");
    lines.push("  :root {");
    for (const [name, size] of Object.entries(typography.responsive.sm)) {
      lines.push(`    --text-${name}: ${size};`);
    }
    lines.push("  }");
    lines.push("}");

    lines.push("");
    lines.push("@media (min-width: 641px) and (max-width: 1024px) {");
    lines.push("  :root {");
    for (const [name, size] of Object.entries(typography.responsive.md)) {
      lines.push(`    --text-${name}: ${size};`);
    }
    lines.push("  }");
    lines.push("}");
  }

  // Add utility classes
  lines.push("");
  lines.push("/* Utility Classes */");
  lines.push(".font-display { font-family: var(--font-display); }");
  lines.push(".font-body { font-family: var(--font-body); }");
  lines.push(".font-mono { font-family: var(--font-mono); }");

  return lines.join("\n");
}

function formatAsSCSS(typography: GeneratedTypography): string {
  const lines: string[] = [
    "// Typography System - Generated by generate-typography",
    "",
    "// Font Families",
    `$font-display: ${typography.fontFamilies.display};`,
    `$font-body: ${typography.fontFamilies.body};`,
    `$font-mono: ${typography.fontFamilies.mono};`,
    "",
    "// Font Sizes",
  ];

  for (const [name, { size, lineHeight }] of Object.entries(typography.fontSizes)) {
    lines.push(`$text-${name}: ${size};`);
    lines.push(`$leading-${name}: ${lineHeight};`);
  }

  lines.push("");
  lines.push("// Font Weights");
  for (const [name, weight] of Object.entries(typography.fontWeights)) {
    lines.push(`$font-${name}: ${weight};`);
  }

  lines.push("");
  lines.push("// Letter Spacing");
  for (const [name, spacing] of Object.entries(typography.letterSpacing)) {
    lines.push(`$tracking-${name}: ${spacing};`);
  }

  lines.push("");
  lines.push("// Maps for iteration");
  lines.push("$font-sizes: (");
  for (const [name, { size }] of Object.entries(typography.fontSizes)) {
    lines.push(`  '${name}': ${size},`);
  }
  lines.push(");");

  return lines.join("\n");
}

function formatAsTailwind(typography: GeneratedTypography): string {
  const fontFamily = {
    display: [typography.fontFamilies.display.split(",")[0].replace(/['"]/g, "").trim()],
    body: [typography.fontFamilies.body.split(",")[0].replace(/['"]/g, "").trim()],
    mono: [typography.fontFamilies.mono.split(",")[0].replace(/['"]/g, "").trim()],
  };

  const fontSize: Record<string, [string, { lineHeight: string }]> = {};
  for (const [name, { size, lineHeight }] of Object.entries(typography.fontSizes)) {
    fontSize[name] = [size, { lineHeight }];
  }

  const config = {
    fontFamily,
    fontSize,
    fontWeight: typography.fontWeights,
    letterSpacing: typography.letterSpacing,
  };

  return `// Tailwind Typography Config - Generated by generate-typography
// Add to tailwind.config.js theme.extend

module.exports = {
  theme: {
    extend: ${JSON.stringify(config, null, 6).replace(/"([^"]+)":/g, "$1:")}
  }
};`;
}

function formatAsTokens(typography: GeneratedTypography): string {
  const tokens = {
    typography: {
      fontFamilies: {
        display: { value: typography.fontFamilies.display, type: "fontFamilies" },
        body: { value: typography.fontFamilies.body, type: "fontFamilies" },
        mono: { value: typography.fontFamilies.mono, type: "fontFamilies" },
      },
      fontSize: {} as Record<string, { value: string; type: string }>,
      lineHeight: {} as Record<string, { value: string; type: string }>,
      fontWeight: {} as Record<string, { value: number; type: string }>,
      letterSpacing: {} as Record<string, { value: string; type: string }>,
    },
  };

  for (const [name, { size, lineHeight }] of Object.entries(typography.fontSizes)) {
    tokens.typography.fontSize[name] = { value: size, type: "fontSizes" };
    tokens.typography.lineHeight[name] = { value: lineHeight, type: "lineHeights" };
  }

  for (const [name, weight] of Object.entries(typography.fontWeights)) {
    tokens.typography.fontWeight[name] = { value: weight, type: "fontWeights" };
  }

  for (const [name, spacing] of Object.entries(typography.letterSpacing)) {
    tokens.typography.letterSpacing[name] = { value: spacing, type: "letterSpacing" };
  }

  return JSON.stringify(tokens, null, 2);
}

function formatOutput(typography: GeneratedTypography, options: GenerateOptions): string {
  switch (options.format) {
    case "css":
      return formatAsCSS(typography, options.responsive);
    case "scss":
      return formatAsSCSS(typography);
    case "tailwind":
      return formatAsTailwind(typography);
    case "tokens":
      return formatAsTokens(typography);
    default:
      return JSON.stringify(typography, null, 2);
  }
}

// === Help Text ===

function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Typography System Generator

Generates typography systems with font stacks, scales, and responsive sizing.

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts [options] [output]

Arguments:
  [output]             Output file path (optional, prints to stdout if omitted)

Options:
  -h, --help           Show this help message
  -v, --version        Show version
  --spec <file>        JSON specification file
  --display <font>     Display/heading font family
  --body <font>        Body text font family
  --mono <font>        Monospace font family
  --scale <type>       Type scale (see below)
  --base <px>          Base font size in px (default: 16)
  --line-height <type> Line height: tight, normal, relaxed (default: normal)
  --responsive         Generate responsive breakpoints
  --format <type>      Output: css, scss, tailwind, tokens (default: css)

Type Scales:
  minor-second   1.067  Subtle, conservative
  major-second   1.125  Balanced, professional
  minor-third    1.200  Clear hierarchy
  major-third    1.250  Strong presence (default)
  perfect-fourth 1.333  Bold, impactful
  golden-ratio   1.618  Dramatic, artistic

Examples:
  # Generate with custom fonts
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --display "Playfair Display" --body "Inter" --scale major-third

  # Generate responsive system
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --display "Space Grotesk" --responsive --format css typography.css

  # Generate Tailwind config
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    --display "DM Sans" --body "DM Sans" --format tailwind
`);
}

// === Main CLI Handler ===

async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "version", "responsive"],
    string: ["spec", "display", "body", "mono", "scale", "base", "line-height", "format"],
    alias: { h: "help", v: "version" },
    default: {
      scale: "major-third",
      base: "16",
      "line-height": "normal",
      format: "css",
      responsive: false,
    },
  });

  if (parsed.help) {
    printHelp();
    Deno.exit(0);
  }

  if (parsed.version) {
    console.log(`${SCRIPT_NAME} v${VERSION}`);
    Deno.exit(0);
  }

  const validScales: Scale[] = [
    "minor-second",
    "major-second",
    "minor-third",
    "major-third",
    "perfect-fourth",
    "golden-ratio",
  ];

  const validLineHeights: LineHeight[] = ["tight", "normal", "relaxed"];
  const validFormats: OutputFormat[] = ["css", "scss", "tailwind", "tokens"];

  if (!validScales.includes(parsed.scale as Scale)) {
    console.error(`Error: Invalid scale '${parsed.scale}'`);
    console.error(`Valid scales: ${validScales.join(", ")}`);
    Deno.exit(1);
  }

  if (!validLineHeights.includes(parsed["line-height"] as LineHeight)) {
    console.error(`Error: Invalid line-height '${parsed["line-height"]}'`);
    console.error(`Valid line-heights: ${validLineHeights.join(", ")}`);
    Deno.exit(1);
  }

  if (!validFormats.includes(parsed.format as OutputFormat)) {
    console.error(`Error: Invalid format '${parsed.format}'`);
    console.error(`Valid formats: ${validFormats.join(", ")}`);
    Deno.exit(1);
  }

  const baseSize = parseInt(parsed.base, 10);
  if (isNaN(baseSize) || baseSize < 10 || baseSize > 32) {
    console.error("Error: Base size must be between 10 and 32");
    Deno.exit(1);
  }

  const options: GenerateOptions = {
    specFile: parsed.spec,
    display: parsed.display,
    body: parsed.body,
    mono: parsed.mono,
    scale: parsed.scale as Scale,
    base: baseSize,
    lineHeight: parsed["line-height"] as LineHeight,
    responsive: parsed.responsive,
    format: parsed.format as OutputFormat,
    output: parsed._[0] as string | undefined,
  };

  try {
    const typography = await generateTypography(options);
    const output = formatOutput(typography, options);

    if (options.output) {
      await Deno.writeTextFile(resolve(options.output), output);
      console.log(`Typography written to: ${options.output}`);
    } else {
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
