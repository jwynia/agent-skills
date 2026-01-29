#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Generate a Web App Manifest for PWA
 *
 * Usage:
 *   deno run --allow-read --allow-write generate-manifest.ts \
 *     --name "My App" \
 *     --short-name "App" \
 *     --output public/manifest.webmanifest
 *
 * Permissions: --allow-read --allow-write
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface WebAppManifest {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation?: "any" | "natural" | "landscape" | "portrait";
  background_color: string;
  theme_color: string;
  icons: ManifestIcon[];
  categories?: string[];
  screenshots?: Array<{ src: string; sizes: string; type: string }>;
  shortcuts?: Array<{
    name: string;
    short_name?: string;
    url: string;
    icons?: ManifestIcon[];
  }>;
  related_applications?: Array<{
    platform: string;
    url: string;
    id?: string;
  }>;
  prefer_related_applications?: boolean;
}

const DEFAULT_ICONS: ManifestIcon[] = [
  { src: "pwa-64x64.png", sizes: "64x64", type: "image/png" },
  { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
  { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
  {
    src: "maskable-icon-512x512.png",
    sizes: "512x512",
    type: "image/png",
    purpose: "maskable",
  },
];

function printHelp(): void {
  console.log(`
Generate Web App Manifest

USAGE:
  deno run --allow-read --allow-write generate-manifest.ts [OPTIONS]

OPTIONS:
  --name <name>           Full application name (required)
  --short-name <name>     Short name for home screen (required)
  --description <desc>    Application description
  --theme <color>         Theme color (default: #ffffff)
  --background <color>    Background color (default: #ffffff)
  --display <mode>        Display mode: fullscreen|standalone|minimal-ui|browser (default: standalone)
  --orientation <mode>    Orientation: any|natural|landscape|portrait
  --start-url <url>       Start URL (default: /)
  --icons <path>          JSON file with custom icons array
  --output <path>         Output file path (default: manifest.webmanifest)
  --pretty                Pretty-print JSON output
  --help                  Show this help message

EXAMPLES:
  # Basic manifest
  generate-manifest.ts --name "My PWA" --short-name "PWA" --output public/manifest.webmanifest

  # Full configuration
  generate-manifest.ts \\
    --name "My Application" \\
    --short-name "MyApp" \\
    --description "A progressive web application" \\
    --theme "#3b82f6" \\
    --background "#ffffff" \\
    --display standalone \\
    --pretty \\
    --output public/manifest.webmanifest
`);
}

function validateColor(color: string): boolean {
  return /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(color);
}

function validateDisplayMode(
  mode: string
): mode is "fullscreen" | "standalone" | "minimal-ui" | "browser" {
  return ["fullscreen", "standalone", "minimal-ui", "browser"].includes(mode);
}

async function loadIconsFromFile(path: string): Promise<ManifestIcon[]> {
  try {
    const content = await Deno.readTextFile(path);
    const icons = JSON.parse(content);
    if (!Array.isArray(icons)) {
      throw new Error("Icons file must contain an array");
    }
    return icons;
  } catch (error) {
    console.error(`Error loading icons from ${path}:`, error);
    return DEFAULT_ICONS;
  }
}

export async function generateManifest(options: {
  name: string;
  shortName: string;
  description?: string;
  themeColor?: string;
  backgroundColor?: string;
  display?: string;
  orientation?: string;
  startUrl?: string;
  iconsPath?: string;
  output: string;
  pretty?: boolean;
}): Promise<void> {
  const themeColor = options.themeColor || "#ffffff";
  const backgroundColor = options.backgroundColor || "#ffffff";
  const display = options.display || "standalone";

  if (!validateColor(themeColor)) {
    console.error(`Invalid theme color: ${themeColor}. Use hex format (#fff or #ffffff)`);
    Deno.exit(1);
  }

  if (!validateColor(backgroundColor)) {
    console.error(`Invalid background color: ${backgroundColor}. Use hex format`);
    Deno.exit(1);
  }

  if (!validateDisplayMode(display)) {
    console.error(`Invalid display mode: ${display}`);
    Deno.exit(1);
  }

  const icons = options.iconsPath
    ? await loadIconsFromFile(options.iconsPath)
    : DEFAULT_ICONS;

  const manifest: WebAppManifest = {
    name: options.name,
    short_name: options.shortName,
    start_url: options.startUrl || "/",
    display,
    background_color: backgroundColor,
    theme_color: themeColor,
    icons,
  };

  if (options.description) {
    manifest.description = options.description;
  }

  if (
    options.orientation &&
    ["any", "natural", "landscape", "portrait"].includes(options.orientation)
  ) {
    manifest.orientation = options.orientation as WebAppManifest["orientation"];
  }

  const jsonContent = options.pretty
    ? JSON.stringify(manifest, null, 2)
    : JSON.stringify(manifest);

  await Deno.writeTextFile(options.output, jsonContent);
  console.log(`Manifest generated: ${options.output}`);
  console.log(`  Name: ${manifest.name}`);
  console.log(`  Short name: ${manifest.short_name}`);
  console.log(`  Display: ${manifest.display}`);
  console.log(`  Theme: ${manifest.theme_color}`);
  console.log(`  Icons: ${manifest.icons.length}`);
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: [
      "name",
      "short-name",
      "description",
      "theme",
      "background",
      "display",
      "orientation",
      "start-url",
      "icons",
      "output",
    ],
    boolean: ["help", "pretty"],
    default: {
      output: "manifest.webmanifest",
      theme: "#ffffff",
      background: "#ffffff",
      display: "standalone",
      "start-url": "/",
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

  await generateManifest({
    name: args.name,
    shortName: args["short-name"],
    description: args.description,
    themeColor: args.theme,
    backgroundColor: args.background,
    display: args.display,
    orientation: args.orientation,
    startUrl: args["start-url"],
    iconsPath: args.icons,
    output: args.output,
    pretty: args.pretty,
  });
}
