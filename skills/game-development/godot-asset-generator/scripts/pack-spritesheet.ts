#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Sprite Sheet Packer CLI
 *
 * Pack multiple sprite images into a single sprite sheet with metadata.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/pack-spritesheet.ts \
 *     --input "./sprites/*.png" --output ./sheet.png --columns 4
 *
 * Note: Requires ImageMagick for actual image composition.
 * Without ImageMagick, generates metadata and montage command.
 *
 * Permissions:
 *   --allow-read: Read input images
 *   --allow-write: Write sprite sheet and metadata
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "pack-spritesheet";

// === Types ===
interface PackOptions {
  inputPattern: string;
  output: string;
  columns?: number;
  padding?: number;
  powerOfTwo?: boolean;
  metadata?: string;
}

interface FrameInfo {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SheetMetadata {
  image: string;
  size: { width: number; height: number };
  frameSize: { width: number; height: number };
  columns: number;
  rows: number;
  padding: number;
  frames: FrameInfo[];
}

interface PackResult {
  success: boolean;
  output: string;
  metadata?: SheetMetadata;
  error?: string;
}

// === PNG Utilities ===
function readPngDimensions(data: Uint8Array): { width: number; height: number } | null {
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (data[i] !== signature[i]) {
      return null;
    }
  }
  const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
  const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];
  return { width, height };
}

// === File Globbing ===
async function expandGlob(pattern: string): Promise<string[]> {
  const files: string[] = [];

  // Simple glob expansion for *.png patterns
  if (pattern.includes("*")) {
    const dir = pattern.substring(0, pattern.lastIndexOf("/")) || ".";
    const filePattern = pattern.substring(pattern.lastIndexOf("/") + 1);
    const regex = new RegExp("^" + filePattern.replace(/\*/g, ".*") + "$");

    for await (const entry of Deno.readDir(dir)) {
      if (entry.isFile && regex.test(entry.name)) {
        files.push(`${dir}/${entry.name}`);
      }
    }
  } else {
    // Single file
    files.push(pattern);
  }

  return files.sort();
}

// === Power of Two ===
function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) {
    p *= 2;
  }
  return p;
}

// === Core Packing ===
export async function packSpritesheet(options: PackOptions): Promise<PackResult> {
  try {
    // Expand glob pattern
    const files = await expandGlob(options.inputPattern);

    if (files.length === 0) {
      throw new Error(`No files found matching: ${options.inputPattern}`);
    }

    console.log(`Found ${files.length} sprites to pack`);

    // Read dimensions from first sprite (assume all same size)
    const firstData = await Deno.readFile(files[0]);
    const frameDimensions = readPngDimensions(firstData);

    if (!frameDimensions) {
      throw new Error(`Unable to read dimensions from: ${files[0]}`);
    }

    const frameWidth = frameDimensions.width;
    const frameHeight = frameDimensions.height;
    const padding = options.padding ?? 0;

    // Calculate grid layout
    const columns = options.columns ?? Math.ceil(Math.sqrt(files.length));
    const rows = Math.ceil(files.length / columns);

    // Calculate sheet dimensions
    let sheetWidth = columns * (frameWidth + padding) + padding;
    let sheetHeight = rows * (frameHeight + padding) + padding;

    if (options.powerOfTwo) {
      sheetWidth = nextPowerOfTwo(sheetWidth);
      sheetHeight = nextPowerOfTwo(sheetHeight);
    }

    // Build frame metadata
    const frames: FrameInfo[] = [];
    for (let i = 0; i < files.length; i++) {
      const col = i % columns;
      const row = Math.floor(i / columns);
      const name = files[i].split("/").pop()?.replace(/\.png$/i, "") ?? `frame_${i}`;

      frames.push({
        name,
        x: padding + col * (frameWidth + padding),
        y: padding + row * (frameHeight + padding),
        width: frameWidth,
        height: frameHeight,
      });
    }

    const metadata: SheetMetadata = {
      image: options.output.split("/").pop() ?? options.output,
      size: { width: sheetWidth, height: sheetHeight },
      frameSize: { width: frameWidth, height: frameHeight },
      columns,
      rows,
      padding,
      frames,
    };

    // Try to create sprite sheet with ImageMagick
    const montageArgs = [
      "-background",
      "transparent",
      "-geometry",
      `${frameWidth}x${frameHeight}+${padding}+${padding}`,
      "-tile",
      `${columns}x`,
      ...files,
      options.output,
    ];

    try {
      const process = new Deno.Command("magick", {
        args: ["montage", ...montageArgs],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await process.output();

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        throw new Error(`ImageMagick montage failed: ${errorText}`);
      }

      console.log(`Created sprite sheet: ${options.output}`);
    } catch (magickError) {
      console.warn("\nWarning: ImageMagick not found. Manual creation required.");
      console.warn("\nRun this command to create the sprite sheet:");
      console.warn(`  magick montage ${montageArgs.join(" ")}`);
      console.warn("\nMetadata file will still be generated.");
    }

    // Save metadata
    if (options.metadata) {
      await Deno.writeTextFile(options.metadata, JSON.stringify(metadata, null, 2));
      console.log(`Metadata saved: ${options.metadata}`);
    }

    return {
      success: true,
      output: options.output,
      metadata,
    };
  } catch (error) {
    return {
      success: false,
      output: options.output,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Pack sprites into a sprite sheet

Usage:
  deno run --allow-read --allow-write scripts/pack-spritesheet.ts [options]

Required:
  --input <pattern>   Input files (glob pattern, e.g., "./sprites/*.png")
  --output <path>     Output sprite sheet path

Optional:
  --columns <n>       Number of columns (default: auto square)
  --padding <n>       Padding between sprites in pixels (default: 0)
  --power-of-two      Force power-of-two dimensions
  --metadata <path>   Output JSON metadata path
  --json              Output result as JSON
  -h, --help          Show this help

Note:
  Requires ImageMagick for sprite sheet creation.
  Metadata is always generated even without ImageMagick.

Output Metadata Format:
  {
    "image": "sheet.png",
    "size": { "width": 256, "height": 128 },
    "frameSize": { "width": 64, "height": 64 },
    "columns": 4,
    "rows": 2,
    "frames": [
      { "name": "idle", "x": 0, "y": 0, "width": 64, "height": 64 },
      ...
    ]
  }

Examples:
  # Basic packing
  ./scripts/pack-spritesheet.ts --input "./sprites/*.png" --output ./sheet.png

  # With specific columns and metadata
  ./scripts/pack-spritesheet.ts --input "./walk-*.png" --output ./walk.png \\
    --columns 4 --metadata ./walk.json

  # Power of two for GPU optimization
  ./scripts/pack-spritesheet.ts --input "./sprites/*.png" --output ./sheet.png \\
    --power-of-two --padding 2
`);
}

// === Argument Parsing ===
function parseArgs(args: string[]): (PackOptions & { outputJson?: boolean }) | null {
  const options: Partial<PackOptions & { outputJson?: boolean }> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      return null;
    } else if (arg === "--input" && args[i + 1]) {
      options.inputPattern = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === "--columns" && args[i + 1]) {
      options.columns = parseInt(args[++i], 10);
    } else if (arg === "--padding" && args[i + 1]) {
      options.padding = parseInt(args[++i], 10);
    } else if (arg === "--power-of-two") {
      options.powerOfTwo = true;
    } else if (arg === "--metadata" && args[i + 1]) {
      options.metadata = args[++i];
    } else if (arg === "--json") {
      options.outputJson = true;
    }
  }

  return options as PackOptions & { outputJson?: boolean };
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  const options = parseArgs(args);

  if (!options) {
    printHelp();
    Deno.exit(0);
  }

  if (!options.inputPattern) {
    console.error("Error: --input is required");
    Deno.exit(1);
  }
  if (!options.output) {
    console.error("Error: --output is required");
    Deno.exit(1);
  }

  const outputJson = options.outputJson;
  delete options.outputJson;

  if (!outputJson) {
    console.log(`\nPacking sprites: ${options.inputPattern}`);
  }

  const result = await packSpritesheet(options);

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.success && result.metadata) {
      console.log(`\nSprite sheet: ${result.output}`);
      console.log(`Size: ${result.metadata.size.width}x${result.metadata.size.height}`);
      console.log(`Grid: ${result.metadata.columns}x${result.metadata.rows}`);
      console.log(`Frames: ${result.metadata.frames.length}`);
    } else if (!result.success) {
      console.error(`Error: ${result.error}`);
      Deno.exit(1);
    }
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
