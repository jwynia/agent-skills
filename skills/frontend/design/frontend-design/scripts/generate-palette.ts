#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-palette.ts - Color Palette Generator
 *
 * Generates cohesive color palettes from seed colors or themes,
 * with shade scales and semantic color variants.
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { resolve } from "jsr:@std/path@1.0.8";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-palette";

type Theme = "warm" | "cool" | "neutral" | "vibrant" | "muted" | "dark" | "light";
type Style = "minimalist" | "bold" | "organic" | "corporate" | "playful";
type OutputFormat = "css" | "scss" | "tailwind" | "tokens" | "json";

// === Types ===
export interface PaletteSpec {
  seedColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
  };
  theme?: Theme;
  style?: Style;
  generateShades?: boolean;
  generateSemantics?: boolean;
  contrastTarget?: "AA" | "AAA";
  outputFormat: OutputFormat;
}

export interface GeneratedPalette {
  primary: Record<string, string>;
  secondary?: Record<string, string>;
  accent?: Record<string, string>;
  neutral: Record<string, string>;
  semantic?: {
    success: Record<string, string>;
    warning: Record<string, string>;
    error: Record<string, string>;
    info: Record<string, string>;
  };
}

interface GenerateOptions {
  specFile?: string;
  seed?: string;
  theme?: Theme;
  style?: Style;
  shades: boolean;
  semantic: boolean;
  contrast: "AA" | "AAA";
  format: OutputFormat;
  output?: string;
}

// === Color Utilities ===

interface HSL {
  h: number;
  s: number;
  l: number;
}

interface RGB {
  r: number;
  g: number;
  b: number;
}

function hexToRgb(hex: string): RGB {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) {
    // Handle shorthand
    const short = /^#?([a-f\d])([a-f\d])([a-f\d])$/i.exec(hex);
    if (short) {
      return {
        r: parseInt(short[1] + short[1], 16),
        g: parseInt(short[2] + short[2], 16),
        b: parseInt(short[3] + short[3], 16),
      };
    }
    throw new Error(`Invalid hex color: ${hex}`);
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
}

function rgbToHex(rgb: RGB): string {
  const toHex = (n: number) =>
    Math.round(Math.max(0, Math.min(255, n)))
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

function rgbToHsl(rgb: RGB): HSL {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) {
    return { h: 0, s: 0, l };
  }

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      break;
    case g:
      h = ((b - r) / d + 2) / 6;
      break;
    case b:
      h = ((r - g) / d + 4) / 6;
      break;
  }

  return { h: h * 360, s, l };
}

function hslToRgb(hsl: HSL): RGB {
  const { h, s, l } = hsl;

  if (s === 0) {
    const gray = Math.round(l * 255);
    return { r: gray, g: gray, b: gray };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hNorm = h / 360;

  return {
    r: Math.round(hue2rgb(p, q, hNorm + 1 / 3) * 255),
    g: Math.round(hue2rgb(p, q, hNorm) * 255),
    b: Math.round(hue2rgb(p, q, hNorm - 1 / 3) * 255),
  };
}

function adjustHsl(hex: string, hDelta: number, sDelta: number, lDelta: number): string {
  const rgb = hexToRgb(hex);
  const hsl = rgbToHsl(rgb);

  hsl.h = (hsl.h + hDelta + 360) % 360;
  hsl.s = Math.max(0, Math.min(1, hsl.s + sDelta));
  hsl.l = Math.max(0, Math.min(1, hsl.l + lDelta));

  return rgbToHex(hslToRgb(hsl));
}

// === Shade Generation ===

function generateShadeScale(baseColor: string): Record<string, string> {
  const rgb = hexToRgb(baseColor);
  const hsl = rgbToHsl(rgb);

  const shades: Record<string, string> = {};

  // Generate shades from 50 (lightest) to 950 (darkest)
  const levels = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
  const baseLightness = hsl.l;

  for (const level of levels) {
    // Map level to lightness: 50 -> ~0.97, 500 -> base, 950 -> ~0.05
    let targetL: number;
    if (level <= 500) {
      // Lighter shades
      targetL = baseLightness + ((1 - baseLightness) * (500 - level)) / 500 * 0.9;
    } else {
      // Darker shades
      targetL = baseLightness - (baseLightness * (level - 500)) / 500 * 0.9;
    }

    // Adjust saturation slightly - more saturated in mid-tones
    const satAdjust = level >= 300 && level <= 700 ? 0.05 : -0.05;

    const newHsl = {
      h: hsl.h,
      s: Math.max(0, Math.min(1, hsl.s + satAdjust)),
      l: Math.max(0.03, Math.min(0.97, targetL)),
    };

    shades[level.toString()] = rgbToHex(hslToRgb(newHsl));
  }

  return shades;
}

// === Theme-based Color Generation ===

function generateThemeColors(theme: Theme): { primary: string; hueShift: number } {
  const themeSeeds: Record<Theme, { primary: string; hueShift: number }> = {
    warm: { primary: "#e07020", hueShift: 30 },
    cool: { primary: "#2563eb", hueShift: -20 },
    neutral: { primary: "#64748b", hueShift: 0 },
    vibrant: { primary: "#8b5cf6", hueShift: 40 },
    muted: { primary: "#78716c", hueShift: 15 },
    dark: { primary: "#1e293b", hueShift: 10 },
    light: { primary: "#f1f5f9", hueShift: 5 },
  };

  return themeSeeds[theme];
}

function applyStyle(color: string, style?: Style): string {
  if (!style) return color;

  const adjustments: Record<Style, { h: number; s: number; l: number }> = {
    minimalist: { h: 0, s: -0.2, l: 0.1 },
    bold: { h: 0, s: 0.15, l: -0.05 },
    organic: { h: 15, s: -0.1, l: 0.05 },
    corporate: { h: 0, s: -0.1, l: 0 },
    playful: { h: 10, s: 0.1, l: 0.05 },
  };

  const adj = adjustments[style];
  return adjustHsl(color, adj.h, adj.s, adj.l);
}

// === Semantic Colors ===

function generateSemanticColors(): GeneratedPalette["semantic"] {
  return {
    success: generateShadeScale("#22c55e"),
    warning: generateShadeScale("#f59e0b"),
    error: generateShadeScale("#ef4444"),
    info: generateShadeScale("#3b82f6"),
  };
}

// === Neutral Colors ===

function generateNeutralScale(primary: string): Record<string, string> {
  const rgb = hexToRgb(primary);
  const hsl = rgbToHsl(rgb);

  // Use a desaturated version of primary hue for neutrals
  const neutralHsl: HSL = {
    h: hsl.h,
    s: 0.05, // Very low saturation
    l: 0.5,
  };

  const base = rgbToHex(hslToRgb(neutralHsl));
  return generateShadeScale(base);
}

// === Complementary Colors ===

function generateSecondaryColor(primary: string): string {
  // Analogous color (30 degrees)
  return adjustHsl(primary, 30, 0, 0);
}

function generateAccentColor(primary: string): string {
  // Complementary color (180 degrees) with adjusted saturation
  return adjustHsl(primary, 180, 0.1, 0.05);
}

// === Core Generation Function ===

export async function generatePalette(options: GenerateOptions): Promise<GeneratedPalette> {
  let spec: PaletteSpec;

  if (options.specFile) {
    const specContent = await Deno.readTextFile(resolve(options.specFile));
    spec = JSON.parse(specContent);
  } else {
    spec = {
      seedColors: options.seed ? { primary: options.seed } : undefined,
      theme: options.theme,
      style: options.style,
      generateShades: options.shades,
      generateSemantics: options.semantic,
      contrastTarget: options.contrast,
      outputFormat: options.format,
    };
  }

  // Determine primary color
  let primaryColor: string;

  if (spec.seedColors?.primary) {
    primaryColor = spec.seedColors.primary;
  } else if (spec.theme) {
    primaryColor = generateThemeColors(spec.theme).primary;
  } else {
    primaryColor = "#2563eb"; // Default blue
  }

  // Apply style adjustments
  if (spec.style) {
    primaryColor = applyStyle(primaryColor, spec.style);
  }

  // Generate palette
  const palette: GeneratedPalette = {
    primary: spec.generateShades
      ? generateShadeScale(primaryColor)
      : { DEFAULT: primaryColor },
    neutral: generateNeutralScale(primaryColor),
  };

  // Secondary color
  const secondaryColor = spec.seedColors?.secondary || generateSecondaryColor(primaryColor);
  if (spec.style) {
    palette.secondary = spec.generateShades
      ? generateShadeScale(applyStyle(secondaryColor, spec.style))
      : { DEFAULT: applyStyle(secondaryColor, spec.style) };
  } else {
    palette.secondary = spec.generateShades
      ? generateShadeScale(secondaryColor)
      : { DEFAULT: secondaryColor };
  }

  // Accent color
  const accentColor = spec.seedColors?.accent || generateAccentColor(primaryColor);
  if (spec.style) {
    palette.accent = spec.generateShades
      ? generateShadeScale(applyStyle(accentColor, spec.style))
      : { DEFAULT: applyStyle(accentColor, spec.style) };
  } else {
    palette.accent = spec.generateShades
      ? generateShadeScale(accentColor)
      : { DEFAULT: accentColor };
  }

  // Semantic colors
  if (spec.generateSemantics) {
    palette.semantic = generateSemanticColors();
  }

  return palette;
}

// === Output Formatting ===

function formatAsCSS(palette: GeneratedPalette): string {
  const lines: string[] = [
    "/* Color Palette - Generated by generate-palette */",
    "",
    ":root {",
  ];

  const formatColor = (name: string, colors: Record<string, string>) => {
    for (const [shade, hex] of Object.entries(colors)) {
      if (shade === "DEFAULT") {
        lines.push(`  --color-${name}: ${hex};`);
      } else {
        lines.push(`  --color-${name}-${shade}: ${hex};`);
      }
    }
  };

  formatColor("primary", palette.primary);
  lines.push("");
  if (palette.secondary) formatColor("secondary", palette.secondary);
  lines.push("");
  if (palette.accent) formatColor("accent", palette.accent);
  lines.push("");
  formatColor("neutral", palette.neutral);

  if (palette.semantic) {
    lines.push("");
    lines.push("  /* Semantic */");
    formatColor("success", palette.semantic.success);
    formatColor("warning", palette.semantic.warning);
    formatColor("error", palette.semantic.error);
    formatColor("info", palette.semantic.info);
  }

  lines.push("}");
  return lines.join("\n");
}

function formatAsSCSS(palette: GeneratedPalette): string {
  const lines: string[] = ["// Color Palette - Generated by generate-palette", ""];

  const formatColor = (name: string, colors: Record<string, string>) => {
    for (const [shade, hex] of Object.entries(colors)) {
      if (shade === "DEFAULT") {
        lines.push(`$color-${name}: ${hex};`);
      } else {
        lines.push(`$color-${name}-${shade}: ${hex};`);
      }
    }
  };

  formatColor("primary", palette.primary);
  lines.push("");
  if (palette.secondary) formatColor("secondary", palette.secondary);
  lines.push("");
  if (palette.accent) formatColor("accent", palette.accent);
  lines.push("");
  formatColor("neutral", palette.neutral);

  if (palette.semantic) {
    lines.push("");
    lines.push("// Semantic");
    formatColor("success", palette.semantic.success);
    formatColor("warning", palette.semantic.warning);
    formatColor("error", palette.semantic.error);
    formatColor("info", palette.semantic.info);
  }

  return lines.join("\n");
}

function formatAsTailwind(palette: GeneratedPalette): string {
  const config: Record<string, unknown> = {
    primary: palette.primary,
    secondary: palette.secondary,
    accent: palette.accent,
    neutral: palette.neutral,
  };

  if (palette.semantic) {
    Object.assign(config, {
      success: palette.semantic.success,
      warning: palette.semantic.warning,
      error: palette.semantic.error,
      info: palette.semantic.info,
    });
  }

  return `// Tailwind Color Config - Generated by generate-palette
// Add to tailwind.config.js theme.extend.colors

module.exports = {
  theme: {
    extend: {
      colors: ${JSON.stringify(config, null, 8).replace(/"([^"]+)":/g, "$1:")}
    }
  }
};`;
}

function formatAsTokens(palette: GeneratedPalette): string {
  const tokens: Record<string, unknown> = {
    color: {
      primary: {},
      secondary: {},
      accent: {},
      neutral: {},
    },
  };

  const formatTokens = (name: string, colors: Record<string, string>) => {
    for (const [shade, hex] of Object.entries(colors)) {
      (tokens.color as Record<string, Record<string, unknown>>)[name][shade] = {
        value: hex,
        type: "color",
      };
    }
  };

  formatTokens("primary", palette.primary);
  if (palette.secondary) formatTokens("secondary", palette.secondary);
  if (palette.accent) formatTokens("accent", palette.accent);
  formatTokens("neutral", palette.neutral);

  if (palette.semantic) {
    (tokens.color as Record<string, unknown>).semantic = {};
    for (const [name, colors] of Object.entries(palette.semantic)) {
      (tokens.color as Record<string, Record<string, unknown>>).semantic[name] = {};
      for (const [shade, hex] of Object.entries(colors)) {
        ((tokens.color as Record<string, Record<string, unknown>>).semantic[name] as Record<string, unknown>)[shade] = {
          value: hex,
          type: "color",
        };
      }
    }
  }

  return JSON.stringify(tokens, null, 2);
}

function formatOutput(palette: GeneratedPalette, format: OutputFormat): string {
  switch (format) {
    case "css":
      return formatAsCSS(palette);
    case "scss":
      return formatAsSCSS(palette);
    case "tailwind":
      return formatAsTailwind(palette);
    case "tokens":
      return formatAsTokens(palette);
    case "json":
    default:
      return JSON.stringify(palette, null, 2);
  }
}

// === Help Text ===

function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Color Palette Generator

Generates cohesive color palettes from seed colors or themes,
with shade scales and semantic color variants.

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts [options] [output]

Arguments:
  [output]             Output file path (optional, prints to stdout if omitted)

Options:
  -h, --help           Show this help message
  -v, --version        Show version
  --spec <file>        JSON specification file
  --seed <color>       Primary seed color (hex)
  --theme <type>       Theme: warm, cool, neutral, vibrant, muted, dark, light
  --style <type>       Style: minimalist, bold, organic, corporate, playful
  --shades             Generate 50-950 shade scale
  --semantic           Generate semantic colors (success, warning, error, info)
  --contrast <level>   Target contrast: AA (default), AAA
  --format <type>      Output: css, scss, tailwind, tokens, json (default: css)

Examples:
  # Generate from seed color with shades
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts --seed "#2563eb" --shades

  # Generate warm theme with semantic colors
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts --theme warm --semantic --format css

  # Generate from spec file
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts --spec palette-spec.json palette.css

  # Generate Tailwind config
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts --seed "#8b5cf6" --shades --format tailwind
`);
}

// === Main CLI Handler ===

async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "version", "shades", "semantic"],
    string: ["spec", "seed", "theme", "style", "contrast", "format"],
    alias: { h: "help", v: "version" },
    default: { contrast: "AA", format: "css", shades: false, semantic: false },
  });

  if (parsed.help) {
    printHelp();
    Deno.exit(0);
  }

  if (parsed.version) {
    console.log(`${SCRIPT_NAME} v${VERSION}`);
    Deno.exit(0);
  }

  const validThemes: Theme[] = ["warm", "cool", "neutral", "vibrant", "muted", "dark", "light"];
  const validStyles: Style[] = ["minimalist", "bold", "organic", "corporate", "playful"];
  const validFormats: OutputFormat[] = ["css", "scss", "tailwind", "tokens", "json"];

  if (parsed.theme && !validThemes.includes(parsed.theme as Theme)) {
    console.error(`Error: Invalid theme '${parsed.theme}'`);
    console.error(`Valid themes: ${validThemes.join(", ")}`);
    Deno.exit(1);
  }

  if (parsed.style && !validStyles.includes(parsed.style as Style)) {
    console.error(`Error: Invalid style '${parsed.style}'`);
    console.error(`Valid styles: ${validStyles.join(", ")}`);
    Deno.exit(1);
  }

  if (!validFormats.includes(parsed.format as OutputFormat)) {
    console.error(`Error: Invalid format '${parsed.format}'`);
    console.error(`Valid formats: ${validFormats.join(", ")}`);
    Deno.exit(1);
  }

  if (!parsed.spec && !parsed.seed && !parsed.theme) {
    console.error("Error: Provide --spec, --seed, or --theme");
    console.error("Use --help for usage information");
    Deno.exit(1);
  }

  const options: GenerateOptions = {
    specFile: parsed.spec,
    seed: parsed.seed,
    theme: parsed.theme as Theme | undefined,
    style: parsed.style as Style | undefined,
    shades: parsed.shades,
    semantic: parsed.semantic,
    contrast: parsed.contrast as "AA" | "AAA",
    format: parsed.format as OutputFormat,
    output: parsed._[0] as string | undefined,
  };

  try {
    const palette = await generatePalette(options);
    const output = formatOutput(palette, options.format);

    if (options.output) {
      await Deno.writeTextFile(resolve(options.output), output);
      console.log(`Palette written to: ${options.output}`);
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
