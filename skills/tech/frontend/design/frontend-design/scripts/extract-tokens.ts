#!/usr/bin/env -S deno run --allow-read

/**
 * extract-tokens.ts - Design Token Extractor
 *
 * Extracts design tokens from CSS files containing CSS custom properties
 * and outputs in various standardized formats.
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename, extname, resolve } from "jsr:@std/path@1.0.8";
import { walk } from "jsr:@std/fs@1.0.8/walk";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "extract-tokens";

type OutputFormat = "css" | "scss" | "tailwind" | "style-dictionary" | "tokens-studio" | "json";

// === Types ===
export interface TokenValue {
  value: string;
  type: string;
  description?: string;
  usageCount?: number;
}

export interface ExtractedTokens {
  source: string;
  format: OutputFormat;
  tokens: {
    color: Record<string, TokenValue>;
    typography: Record<string, TokenValue>;
    spacing: Record<string, TokenValue>;
    shadow: Record<string, TokenValue>;
    border: Record<string, TokenValue>;
    animation: Record<string, TokenValue>;
    other: Record<string, TokenValue>;
  };
  unmapped: Array<{
    property: string;
    value: string;
    count: number;
    suggestion: string;
  }>;
}

interface ExtractOptions {
  input: string;
  format: OutputFormat;
  outputCss: boolean;
  pretty: boolean;
}

// === Token Classification ===

const TOKEN_PATTERNS: Record<string, RegExp[]> = {
  color: [
    /color/i,
    /background/i,
    /border-color/i,
    /fill/i,
    /stroke/i,
    /shadow/i,
    /bg/i,
    /fg/i,
    /text(?!-)/i,
  ],
  typography: [
    /font/i,
    /text-/i,
    /line-height/i,
    /letter-spacing/i,
    /word-spacing/i,
  ],
  spacing: [
    /space/i,
    /gap/i,
    /margin/i,
    /padding/i,
    /inset/i,
  ],
  shadow: [
    /shadow/i,
    /elevation/i,
  ],
  border: [
    /border/i,
    /radius/i,
    /outline/i,
  ],
  animation: [
    /duration/i,
    /timing/i,
    /easing/i,
    /delay/i,
    /transition/i,
    /animation/i,
  ],
};

function classifyToken(name: string, value: string): string {
  // Check name patterns
  for (const [category, patterns] of Object.entries(TOKEN_PATTERNS)) {
    if (patterns.some((p) => p.test(name))) {
      return category;
    }
  }

  // Check value patterns
  if (/^#|^rgb|^hsl|^oklch|transparent|currentColor/i.test(value)) {
    return "color";
  }
  if (/^\d+(\.\d+)?(px|rem|em|%)$/.test(value)) {
    if (/radius/i.test(name)) return "border";
    return "spacing";
  }
  if (/^\d+(\.\d+)?(ms|s)$/.test(value)) {
    return "animation";
  }
  if (/^(sans-serif|serif|monospace|cursive|fantasy|system-ui)/i.test(value)) {
    return "typography";
  }

  return "other";
}

function inferTokenType(category: string, value: string): string {
  if (category === "color") return "color";
  if (category === "typography") {
    if (/^\d/.test(value)) return "dimension";
    return "fontFamily";
  }
  if (category === "spacing") return "dimension";
  if (category === "shadow") return "shadow";
  if (category === "border") return "dimension";
  if (category === "animation") return "duration";
  return "other";
}

// === CSS Parsing ===

interface CSSVariable {
  name: string;
  value: string;
  count: number;
}

function extractCSSVariables(css: string): CSSVariable[] {
  const variables = new Map<string, CSSVariable>();

  // Remove comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Find variable definitions (--name: value)
  const varDefRegex = /(--[\w-]+)\s*:\s*([^;]+);/g;
  let match;

  while ((match = varDefRegex.exec(cleaned)) !== null) {
    const name = match[1].trim();
    const value = match[2].trim();

    if (variables.has(name)) {
      variables.get(name)!.count++;
    } else {
      variables.set(name, { name, value, count: 1 });
    }
  }

  return Array.from(variables.values());
}

function extractRepeatedValues(css: string): Map<string, number> {
  const valueCount = new Map<string, number>();

  // Remove comments
  const cleaned = css.replace(/\/\*[\s\S]*?\*\//g, "");

  // Find all property values
  const declRegex = /[a-z-]+\s*:\s*([^;{}]+);/gi;
  let match;

  while ((match = declRegex.exec(cleaned)) !== null) {
    const value = match[1].trim();
    // Skip var() references and very short values
    if (!value.startsWith("var(") && value.length > 2) {
      valueCount.set(value, (valueCount.get(value) || 0) + 1);
    }
  }

  return valueCount;
}

// === Token Extraction ===

export async function extractTokens(options: ExtractOptions): Promise<ExtractedTokens> {
  const inputPath = resolve(options.input);

  // Collect CSS files
  const cssContents: string[] = [];
  let sourceName = "";

  try {
    const stat = await Deno.stat(inputPath);

    if (stat.isDirectory) {
      sourceName = basename(inputPath);
      for await (const entry of walk(inputPath, {
        exts: [".css"],
        includeDirs: false,
      })) {
        cssContents.push(await Deno.readTextFile(entry.path));
      }
    } else if (stat.isFile && extname(inputPath) === ".css") {
      sourceName = basename(inputPath);
      cssContents.push(await Deno.readTextFile(inputPath));
    } else {
      throw new Error(`Input must be a CSS file or directory: ${inputPath}`);
    }
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) {
      throw new Error(`File or directory not found: ${inputPath}`);
    }
    throw error;
  }

  if (cssContents.length === 0) {
    throw new Error(`No CSS files found in: ${inputPath}`);
  }

  const combinedCSS = cssContents.join("\n");

  // Extract CSS variables
  const cssVariables = extractCSSVariables(combinedCSS);

  // Extract repeated values that could become tokens
  const repeatedValues = extractRepeatedValues(combinedCSS);

  // Classify tokens
  const tokens: ExtractedTokens["tokens"] = {
    color: {},
    typography: {},
    spacing: {},
    shadow: {},
    border: {},
    animation: {},
    other: {},
  };

  for (const variable of cssVariables) {
    const category = classifyToken(variable.name, variable.value);
    const tokenName = variable.name.replace(/^--/, "");

    tokens[category as keyof typeof tokens][tokenName] = {
      value: variable.value,
      type: inferTokenType(category, variable.value),
      usageCount: variable.count,
    };
  }

  // Find unmapped repeated values
  const unmapped: ExtractedTokens["unmapped"] = [];
  for (const [value, count] of repeatedValues) {
    if (count >= 3) {
      // Value used 3+ times
      const category = classifyToken("", value);
      const suggestion = `--${category}-${unmapped.length + 1}`;

      // Check if this value is already a token
      const isTokenized = Object.values(tokens).some((cat) =>
        Object.values(cat).some((t) => t.value === value)
      );

      if (!isTokenized) {
        unmapped.push({
          property: category,
          value,
          count,
          suggestion,
        });
      }
    }
  }

  return {
    source: sourceName,
    format: options.format,
    tokens,
    unmapped: unmapped.sort((a, b) => b.count - a.count).slice(0, 20),
  };
}

// === Output Formatting ===

function formatAsCSS(tokens: ExtractedTokens): string {
  const lines: string[] = ["/* Design Tokens - Generated by extract-tokens */", "", ":root {"];

  for (const [category, categoryTokens] of Object.entries(tokens.tokens)) {
    const entries = Object.entries(categoryTokens);
    if (entries.length === 0) continue;

    lines.push(`  /* ${category} */`);
    for (const [name, token] of entries) {
      lines.push(`  --${name}: ${token.value};`);
    }
    lines.push("");
  }

  lines.push("}");
  return lines.join("\n");
}

function formatAsSCSS(tokens: ExtractedTokens): string {
  const lines: string[] = ["// Design Tokens - Generated by extract-tokens", ""];

  for (const [category, categoryTokens] of Object.entries(tokens.tokens)) {
    const entries = Object.entries(categoryTokens);
    if (entries.length === 0) continue;

    lines.push(`// ${category}`);
    for (const [name, token] of entries) {
      const scssName = name.replace(/-/g, "_");
      lines.push(`$${scssName}: ${token.value};`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatAsTailwind(tokens: ExtractedTokens): string {
  const config: Record<string, Record<string, string>> = {
    colors: {},
    spacing: {},
    fontFamily: {},
    fontSize: {},
    boxShadow: {},
    borderRadius: {},
    transitionDuration: {},
  };

  for (const [name, token] of Object.entries(tokens.tokens.color)) {
    config.colors[name] = token.value;
  }

  for (const [name, token] of Object.entries(tokens.tokens.spacing)) {
    config.spacing[name] = token.value;
  }

  for (const [name, token] of Object.entries(tokens.tokens.typography)) {
    if (token.type === "fontFamily") {
      config.fontFamily[name] = token.value;
    } else {
      config.fontSize[name] = token.value;
    }
  }

  for (const [name, token] of Object.entries(tokens.tokens.shadow)) {
    config.boxShadow[name] = token.value;
  }

  for (const [name, token] of Object.entries(tokens.tokens.border)) {
    config.borderRadius[name] = token.value;
  }

  for (const [name, token] of Object.entries(tokens.tokens.animation)) {
    config.transitionDuration[name] = token.value;
  }

  // Remove empty categories
  for (const key of Object.keys(config)) {
    if (Object.keys(config[key]).length === 0) {
      delete config[key];
    }
  }

  return `// Tailwind Config Extension - Generated by extract-tokens
// Add this to your tailwind.config.js theme.extend

module.exports = {
  theme: {
    extend: ${JSON.stringify(config, null, 6).replace(/"([^"]+)":/g, "$1:")}
  }
};`;
}

function formatAsStyleDictionary(tokens: ExtractedTokens): string {
  const sdTokens: Record<string, unknown> = {};

  for (const [category, categoryTokens] of Object.entries(tokens.tokens)) {
    if (Object.keys(categoryTokens).length === 0) continue;

    sdTokens[category] = {};
    for (const [name, token] of Object.entries(categoryTokens)) {
      (sdTokens[category] as Record<string, unknown>)[name] = {
        value: token.value,
        type: token.type,
      };
    }
  }

  return JSON.stringify(sdTokens, null, 2);
}

function formatAsTokensStudio(tokens: ExtractedTokens): string {
  const tsTokens: Record<string, unknown> = {};

  for (const [category, categoryTokens] of Object.entries(tokens.tokens)) {
    if (Object.keys(categoryTokens).length === 0) continue;

    tsTokens[category] = {};
    for (const [name, token] of Object.entries(categoryTokens)) {
      (tsTokens[category] as Record<string, unknown>)[name] = {
        value: token.value,
        type: token.type,
        $extensions: {
          "studio.tokens": {
            modify: {},
          },
        },
      };
    }
  }

  return JSON.stringify(tsTokens, null, 2);
}

function formatOutput(tokens: ExtractedTokens, options: ExtractOptions): string {
  switch (options.format) {
    case "css":
      return formatAsCSS(tokens);
    case "scss":
      return formatAsSCSS(tokens);
    case "tailwind":
      return formatAsTailwind(tokens);
    case "style-dictionary":
      return formatAsStyleDictionary(tokens);
    case "tokens-studio":
      return formatAsTokensStudio(tokens);
    case "json":
    default:
      return options.pretty
        ? JSON.stringify(tokens, null, 2)
        : JSON.stringify(tokens);
  }
}

// === Help Text ===

function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Design Token Extractor

Extracts design tokens from CSS files containing CSS custom properties
and outputs in various standardized formats.

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input> [options]

Arguments:
  <input>              CSS file or directory containing CSS files

Options:
  -h, --help           Show this help message
  -v, --version        Show version
  --format <type>      Output format: css, scss, tailwind, style-dictionary,
                       tokens-studio, json (default: json)
  --output-css         Also output CSS variables (with json format)
  --pretty             Pretty-print JSON output

Formats:
  css              CSS custom properties (:root { --token: value; })
  scss             SCSS variables ($token: value;)
  tailwind         Tailwind config extension object
  style-dictionary Style Dictionary JSON format
  tokens-studio    Tokens Studio JSON format
  json             Raw JSON with all metadata

Examples:
  # Extract tokens as CSS variables
  deno run --allow-read scripts/${SCRIPT_NAME}.ts styles.css --format css

  # Extract to Tailwind config
  deno run --allow-read scripts/${SCRIPT_NAME}.ts ./src --format tailwind

  # Extract to Style Dictionary format
  deno run --allow-read scripts/${SCRIPT_NAME}.ts ./src --format style-dictionary

  # Get raw JSON with unmapped values
  deno run --allow-read scripts/${SCRIPT_NAME}.ts styles.css --pretty
`);
}

// === Main CLI Handler ===

async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "version", "pretty", "output-css"],
    string: ["format"],
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

  const validFormats: OutputFormat[] = [
    "css",
    "scss",
    "tailwind",
    "style-dictionary",
    "tokens-studio",
    "json",
  ];

  if (!validFormats.includes(parsed.format as OutputFormat)) {
    console.error(`Error: Invalid format '${parsed.format}'`);
    console.error(`Valid formats: ${validFormats.join(", ")}`);
    Deno.exit(1);
  }

  const options: ExtractOptions = {
    input,
    format: parsed.format as OutputFormat,
    outputCss: parsed["output-css"],
    pretty: parsed.pretty,
  };

  try {
    const tokens = await extractTokens(options);
    console.log(formatOutput(tokens, options));
  } catch (error) {
    console.error(`Error: ${(error as Error).message}`);
    Deno.exit(1);
  }
}

// === Entry Point ===

if (import.meta.main) {
  main(Deno.args);
}
