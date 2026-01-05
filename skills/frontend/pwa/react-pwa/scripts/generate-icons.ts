#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run --allow-env

/**
 * Generate PWA Icon Set from Source Image
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run --allow-env generate-icons.ts \
 *     --input logo.png \
 *     --output public/
 *
 * Permissions: --allow-read --allow-write --allow-run --allow-env
 * Dependencies: sharp (installed via npm)
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { ensureDir } from "jsr:@std/fs@1.0.8/ensure-dir";
import { join, extname } from "jsr:@std/path@1.0.8";

interface IconConfig {
  name: string;
  size: number;
  purpose?: "any" | "maskable";
}

const DEFAULT_ICONS: IconConfig[] = [
  { name: "pwa-64x64.png", size: 64 },
  { name: "pwa-192x192.png", size: 192 },
  { name: "pwa-512x512.png", size: 512 },
  { name: "apple-touch-icon.png", size: 180 },
  { name: "maskable-icon-512x512.png", size: 512, purpose: "maskable" },
];

const FAVICON_SIZES = [16, 32, 48];

function printHelp(): void {
  console.log(`
Generate PWA Icon Set

USAGE:
  deno run --allow-read --allow-write --allow-run --allow-env generate-icons.ts [OPTIONS]

OPTIONS:
  --input <path>          Source image (PNG or SVG, min 512x512) (required)
  --output <dir>          Output directory (required)
  --sizes <list>          Comma-separated sizes (default: 64,192,512)
  --maskable              Also generate maskable icons
  --favicon               Generate favicon.ico
  --apple-touch           Generate apple-touch-icon.png
  --all                   Generate all icon types
  --help                  Show this help message

REQUIREMENTS:
  - Source image should be at least 512x512 pixels
  - For maskable icons, use an image with padding (safe zone is center 80%)
  - Requires sharp: npm install sharp

EXAMPLES:
  # Basic icons
  generate-icons.ts --input logo.png --output public/

  # All icon types
  generate-icons.ts --input logo.svg --output public/ --all

  # Custom sizes
  generate-icons.ts --input logo.png --output public/ --sizes 128,256,512
`);
}

async function checkSharpAvailable(): Promise<boolean> {
  const command = new Deno.Command("npm", {
    args: ["list", "sharp"],
    stdout: "null",
    stderr: "null",
  });

  try {
    const { success } = await command.output();
    return success;
  } catch {
    return false;
  }
}

async function resizeImage(
  inputPath: string,
  outputPath: string,
  size: number,
  _purpose?: string
): Promise<void> {
  // Use Node.js sharp via subprocess since Deno doesn't have native image processing
  const script = `
    const sharp = require('sharp');
    sharp('${inputPath}')
      .resize(${size}, ${size}, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png()
      .toFile('${outputPath}')
      .then(() => console.log('Generated: ${outputPath}'))
      .catch(err => { console.error(err); process.exit(1); });
  `;

  const command = new Deno.Command("node", {
    args: ["-e", script],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { success } = await command.output();
  if (!success) {
    throw new Error(`Failed to generate ${outputPath}`);
  }
}

async function generateFavicon(
  inputPath: string,
  outputPath: string
): Promise<void> {
  // Generate favicon.ico with multiple sizes
  const script = `
    const sharp = require('sharp');
    const fs = require('fs');
    const path = require('path');

    async function generateFavicon() {
      const sizes = [16, 32, 48];
      const buffers = await Promise.all(
        sizes.map(size =>
          sharp('${inputPath}')
            .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
            .png()
            .toBuffer()
        )
      );

      // For simplicity, just use 32x32 as ico (proper ICO generation needs a library)
      await sharp('${inputPath}')
        .resize(32, 32, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toFile('${outputPath.replace(".ico", ".png")}');

      console.log('Generated: ${outputPath.replace(".ico", ".png")} (use as favicon)');
    }

    generateFavicon().catch(err => { console.error(err); process.exit(1); });
  `;

  const command = new Deno.Command("node", {
    args: ["-e", script],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { success } = await command.output();
  if (!success) {
    throw new Error(`Failed to generate favicon`);
  }
}

export async function generateIcons(options: {
  input: string;
  output: string;
  sizes?: number[];
  maskable?: boolean;
  favicon?: boolean;
  appleTouch?: boolean;
  all?: boolean;
}): Promise<void> {
  // Check if input file exists
  try {
    await Deno.stat(options.input);
  } catch {
    console.error(`Input file not found: ${options.input}`);
    Deno.exit(1);
  }

  // Check for sharp
  const hasSharp = await checkSharpAvailable();
  if (!hasSharp) {
    console.error("Error: sharp is not installed.");
    console.error("Install it with: npm install sharp");
    Deno.exit(1);
  }

  // Ensure output directory exists
  await ensureDir(options.output);

  const sizes = options.sizes || [64, 192, 512];
  const generateAll = options.all;
  const generateMaskable = generateAll || options.maskable;
  const generateFaviconFile = generateAll || options.favicon;
  const generateAppleTouch = generateAll || options.appleTouch;

  console.log(`Generating icons from: ${options.input}`);
  console.log(`Output directory: ${options.output}`);
  console.log(`Sizes: ${sizes.join(", ")}`);
  console.log("");

  // Generate standard PWA icons
  for (const size of sizes) {
    const outputPath = join(options.output, `pwa-${size}x${size}.png`);
    await resizeImage(options.input, outputPath, size);
  }

  // Generate maskable icons
  if (generateMaskable) {
    for (const size of sizes.filter((s) => s >= 192)) {
      const outputPath = join(options.output, `maskable-icon-${size}x${size}.png`);
      await resizeImage(options.input, outputPath, size, "maskable");
    }
  }

  // Generate apple-touch-icon
  if (generateAppleTouch) {
    const outputPath = join(options.output, "apple-touch-icon.png");
    await resizeImage(options.input, outputPath, 180);
  }

  // Generate favicon
  if (generateFaviconFile) {
    const outputPath = join(options.output, "favicon.ico");
    await generateFavicon(options.input, outputPath);
  }

  console.log("");
  console.log("Icon generation complete!");
  console.log("");
  console.log("Add to your manifest.json icons array:");
  console.log(
    JSON.stringify(
      sizes.map((size) => ({
        src: `pwa-${size}x${size}.png`,
        sizes: `${size}x${size}`,
        type: "image/png",
      })),
      null,
      2
    )
  );

  if (generateMaskable) {
    console.log("");
    console.log("Maskable icon for manifest:");
    console.log(
      JSON.stringify(
        {
          src: "maskable-icon-512x512.png",
          sizes: "512x512",
          type: "image/png",
          purpose: "maskable",
        },
        null,
        2
      )
    );
  }
}

if (import.meta.main) {
  const args = parseArgs(Deno.args, {
    string: ["input", "output", "sizes"],
    boolean: ["help", "maskable", "favicon", "apple-touch", "all"],
    default: {
      sizes: "64,192,512",
    },
  });

  if (args.help) {
    printHelp();
    Deno.exit(0);
  }

  if (!args.input || !args.output) {
    console.error("Error: --input and --output are required");
    printHelp();
    Deno.exit(1);
  }

  const sizes = args.sizes.split(",").map((s: string) => parseInt(s.trim(), 10));

  await generateIcons({
    input: args.input,
    output: args.output,
    sizes,
    maskable: args.maskable,
    favicon: args.favicon,
    appleTouch: args["apple-touch"],
    all: args.all,
  });
}
