#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * PWA Manifest Generator
 *
 * Generates a complete manifest.json for Progressive Web Apps.
 * Supports interactive mode and parameter-based generation.
 *
 * Usage:
 *   deno run --allow-read --allow-write manifest-generator.ts --interactive
 *   deno run --allow-read --allow-write manifest-generator.ts --name "My App" --short-name "App"
 *   deno run --allow-read manifest-generator.ts --validate manifest.json
 */

// === INTERFACES ===

interface ManifestIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: string;
}

interface ManifestScreenshot {
  src: string;
  sizes: string;
  type: string;
  form_factor?: "narrow" | "wide";
  label?: string;
}

interface WebAppManifest {
  name: string;
  short_name: string;
  description?: string;
  start_url: string;
  display: "fullscreen" | "standalone" | "minimal-ui" | "browser";
  orientation?: "any" | "natural" | "landscape" | "portrait" | "portrait-primary" | "portrait-secondary" | "landscape-primary" | "landscape-secondary";
  background_color: string;
  theme_color: string;
  scope?: string;
  icons: ManifestIcon[];
  screenshots?: ManifestScreenshot[];
  categories?: string[];
  shortcuts?: Array<{
    name: string;
    short_name?: string;
    description?: string;
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

interface GeneratorConfig {
  name: string;
  shortName: string;
  description?: string;
  startUrl?: string;
  display?: WebAppManifest["display"];
  orientation?: WebAppManifest["orientation"];
  backgroundColor?: string;
  themeColor?: string;
  scope?: string;
  iconSizes?: string[];
  iconPath?: string;
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

// === DEFAULTS ===

const DEFAULT_CONFIG: Partial<GeneratorConfig> = {
  startUrl: "/",
  display: "standalone",
  orientation: "any",
  backgroundColor: "#ffffff",
  themeColor: "#4285f4",
  scope: "/",
  iconSizes: ["192x192", "512x512"],
  iconPath: "/icons/icon-{size}.png",
};

const REQUIRED_ICON_SIZES = ["192x192", "512x512"];

const RECOMMENDED_ICON_SIZES = [
  "48x48",
  "72x72",
  "96x96",
  "128x128",
  "144x144",
  "192x192",
  "256x256",
  "384x384",
  "512x512",
];

// === VALIDATION ===

function validateManifest(manifest: Partial<WebAppManifest>): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required fields
  if (!manifest.name) {
    errors.push("Missing required field: name");
  } else if (manifest.name.length > 45) {
    warnings.push("name is longer than 45 characters, may be truncated");
  }

  if (!manifest.short_name) {
    errors.push("Missing required field: short_name");
  } else if (manifest.short_name.length > 12) {
    warnings.push("short_name is longer than 12 characters, may be truncated on home screen");
  }

  if (!manifest.start_url) {
    errors.push("Missing required field: start_url");
  }

  if (!manifest.display) {
    errors.push("Missing required field: display");
  } else if (!["fullscreen", "standalone", "minimal-ui", "browser"].includes(manifest.display)) {
    errors.push(`Invalid display value: ${manifest.display}`);
  }

  if (!manifest.background_color) {
    warnings.push("Missing background_color - splash screen may look generic");
  }

  if (!manifest.theme_color) {
    warnings.push("Missing theme_color - browser UI won't match app theme");
  }

  // Icons validation
  if (!manifest.icons || manifest.icons.length === 0) {
    errors.push("Missing required field: icons (at least one icon required)");
  } else {
    const sizes = manifest.icons.map(i => i.sizes);

    if (!sizes.includes("192x192")) {
      errors.push("Missing required icon size: 192x192");
    }

    if (!sizes.includes("512x512")) {
      errors.push("Missing required icon size: 512x512");
    }

    for (const icon of manifest.icons) {
      if (!icon.src) {
        errors.push("Icon missing src property");
      }
      if (!icon.sizes) {
        errors.push("Icon missing sizes property");
      }
      if (!icon.type) {
        warnings.push(`Icon ${icon.src} missing type property (should be image/png or image/svg+xml)`);
      }
    }
  }

  // Scope validation
  if (manifest.scope && manifest.start_url) {
    if (!manifest.start_url.startsWith(manifest.scope)) {
      warnings.push("start_url should be within scope");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

// === GENERATION ===

function generateManifest(config: GeneratorConfig): WebAppManifest {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };

  const iconSizes = mergedConfig.iconSizes || REQUIRED_ICON_SIZES;
  const iconPath = mergedConfig.iconPath || "/icons/icon-{size}.png";

  const icons: ManifestIcon[] = iconSizes.map(size => ({
    src: iconPath.replace("{size}", size),
    sizes: size,
    type: "image/png",
    purpose: "any maskable",
  }));

  const manifest: WebAppManifest = {
    name: config.name,
    short_name: config.shortName,
    start_url: mergedConfig.startUrl!,
    display: mergedConfig.display!,
    background_color: mergedConfig.backgroundColor!,
    theme_color: mergedConfig.themeColor!,
    icons,
  };

  if (config.description) {
    manifest.description = config.description;
  }

  if (mergedConfig.orientation && mergedConfig.orientation !== "any") {
    manifest.orientation = mergedConfig.orientation;
  }

  if (mergedConfig.scope) {
    manifest.scope = mergedConfig.scope;
  }

  return manifest;
}

// === INTERACTIVE MODE ===

async function promptInteractive(): Promise<GeneratorConfig> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  async function prompt(question: string, defaultValue?: string): Promise<string> {
    const suffix = defaultValue ? ` [${defaultValue}]` : "";
    await Deno.stdout.write(encoder.encode(`${question}${suffix}: `));

    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);
    const input = decoder.decode(buf.subarray(0, n!)).trim();

    return input || defaultValue || "";
  }

  console.log("\n=== PWA Manifest Generator ===\n");

  const name = await prompt("App name (full)");
  if (!name) {
    console.error("Error: App name is required");
    Deno.exit(1);
  }

  const shortName = await prompt("Short name (for home screen)", name.slice(0, 12));
  const description = await prompt("Description (optional)");
  const startUrl = await prompt("Start URL", "/");
  const display = await prompt("Display mode (standalone/fullscreen/minimal-ui/browser)", "standalone");
  const themeColor = await prompt("Theme color (hex)", "#4285f4");
  const backgroundColor = await prompt("Background color (hex)", "#ffffff");
  const iconPath = await prompt("Icon path pattern", "/icons/icon-{size}.png");

  return {
    name,
    shortName,
    description: description || undefined,
    startUrl,
    display: display as WebAppManifest["display"],
    themeColor,
    backgroundColor,
    iconPath,
    iconSizes: RECOMMENDED_ICON_SIZES,
  };
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): { config: Partial<GeneratorConfig>; mode: "generate" | "validate" | "interactive"; validatePath?: string; output?: string } {
  const config: Partial<GeneratorConfig> = {};
  let mode: "generate" | "validate" | "interactive" = "generate";
  let validatePath: string | undefined;
  let output: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;
      case "--interactive":
      case "-i":
        mode = "interactive";
        break;
      case "--validate":
        mode = "validate";
        validatePath = nextArg;
        i++;
        break;
      case "--name":
        config.name = nextArg;
        i++;
        break;
      case "--short-name":
        config.shortName = nextArg;
        i++;
        break;
      case "--description":
        config.description = nextArg;
        i++;
        break;
      case "--start-url":
        config.startUrl = nextArg;
        i++;
        break;
      case "--display":
        config.display = nextArg as WebAppManifest["display"];
        i++;
        break;
      case "--theme-color":
        config.themeColor = nextArg;
        i++;
        break;
      case "--background-color":
        config.backgroundColor = nextArg;
        i++;
        break;
      case "--output":
      case "-o":
        output = nextArg;
        i++;
        break;
      case "--json":
        // Output JSON (default behavior)
        break;
    }
  }

  return { config, mode, validatePath, output };
}

function printHelp(): void {
  console.log(`
PWA Manifest Generator

Generate or validate Progressive Web App manifest files.

USAGE:
  manifest-generator.ts [OPTIONS]

MODES:
  --interactive, -i     Interactive prompts for all fields
  --validate <file>     Validate an existing manifest.json

OPTIONS:
  --name <name>         Full app name (required for generation)
  --short-name <name>   Short name for home screen
  --description <desc>  App description
  --start-url <url>     Start URL (default: /)
  --display <mode>      Display mode: standalone, fullscreen, minimal-ui, browser
  --theme-color <hex>   Theme color (default: #4285f4)
  --background-color <hex>  Background color (default: #ffffff)
  --output, -o <file>   Output file path (default: stdout)
  --help, -h            Show this help

EXAMPLES:
  # Interactive mode
  manifest-generator.ts --interactive

  # Generate with parameters
  manifest-generator.ts --name "My Recipe App" --short-name "Recipes" --theme-color "#ff6b6b"

  # Validate existing manifest
  manifest-generator.ts --validate public/manifest.json

  # Save to file
  manifest-generator.ts --name "My App" --short-name "App" -o public/manifest.json
`);
}

// === MAIN ===

async function main(): Promise<void> {
  const { config, mode, validatePath, output } = parseArgs(Deno.args);

  if (mode === "validate" && validatePath) {
    // Validate mode
    try {
      const content = await Deno.readTextFile(validatePath);
      const manifest = JSON.parse(content);
      const result = validateManifest(manifest);

      console.log("\n=== Manifest Validation ===\n");
      console.log(`File: ${validatePath}`);
      console.log(`Status: ${result.valid ? "VALID" : "INVALID"}\n`);

      if (result.errors.length > 0) {
        console.log("ERRORS:");
        result.errors.forEach(e => console.log(`  - ${e}`));
        console.log();
      }

      if (result.warnings.length > 0) {
        console.log("WARNINGS:");
        result.warnings.forEach(w => console.log(`  - ${w}`));
        console.log();
      }

      if (result.valid && result.warnings.length === 0) {
        console.log("No issues found!");
      }

      Deno.exit(result.valid ? 0 : 1);
    } catch (error) {
      console.error(`Error reading manifest: ${error}`);
      Deno.exit(1);
    }
  }

  let finalConfig: GeneratorConfig;

  if (mode === "interactive") {
    finalConfig = await promptInteractive();
  } else {
    // Parameter mode
    if (!config.name) {
      console.error("Error: --name is required. Use --interactive for guided input or --help for options.");
      Deno.exit(1);
    }

    finalConfig = {
      name: config.name,
      shortName: config.shortName || config.name.slice(0, 12),
      ...config,
    } as GeneratorConfig;
  }

  const manifest = generateManifest(finalConfig);
  const validation = validateManifest(manifest);

  if (!validation.valid) {
    console.error("Generated manifest has errors:");
    validation.errors.forEach(e => console.error(`  - ${e}`));
    Deno.exit(1);
  }

  const jsonOutput = JSON.stringify(manifest, null, 2);

  if (output) {
    await Deno.writeTextFile(output, jsonOutput);
    console.log(`Manifest written to ${output}`);

    if (validation.warnings.length > 0) {
      console.log("\nWarnings:");
      validation.warnings.forEach(w => console.log(`  - ${w}`));
    }
  } else {
    console.log(jsonOutput);
  }
}

main();
