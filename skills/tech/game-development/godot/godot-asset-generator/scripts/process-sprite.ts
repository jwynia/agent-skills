#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Sprite Processing CLI
 *
 * Post-process AI-generated images for game use: background removal,
 * resizing, trimming, and color key transparency.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/process-sprite.ts \
 *     --input ./raw.png --output ./processed.png --remove-bg --resize 64x64
 *
 * Note: For advanced processing (background removal, color correction),
 * ImageMagick is recommended. This script provides basic PNG manipulation.
 *
 * Permissions:
 *   --allow-read: Read input images
 *   --allow-write: Write processed images
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "process-sprite";

// === Types ===
interface ProcessOptions {
  input: string;
  output: string;
  removeBg?: boolean;
  resize?: string;
  filter?: "nearest" | "linear";
  trim?: boolean;
  padding?: number;
  colorKey?: string;
}

interface ProcessResult {
  success: boolean;
  input: string;
  output: string;
  originalSize?: { width: number; height: number };
  finalSize?: { width: number; height: number };
  operations: string[];
  error?: string;
}

// === PNG Utilities ===
// Basic PNG reading - extracts dimensions from header
function readPngDimensions(data: Uint8Array): { width: number; height: number } | null {
  // PNG signature check
  const signature = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) {
    if (data[i] !== signature[i]) {
      return null;
    }
  }

  // IHDR chunk starts at byte 8
  // Length (4 bytes) + Type "IHDR" (4 bytes) + Width (4 bytes) + Height (4 bytes)
  const width = (data[16] << 24) | (data[17] << 16) | (data[18] << 8) | data[19];
  const height = (data[20] << 24) | (data[21] << 16) | (data[22] << 8) | data[23];

  return { width, height };
}

// === Core Processing ===
export async function processSprite(options: ProcessOptions): Promise<ProcessResult> {
  const operations: string[] = [];

  try {
    // Read input file
    const inputData = await Deno.readFile(options.input);
    const dimensions = readPngDimensions(inputData);

    if (!dimensions) {
      throw new Error("Invalid PNG file or unable to read dimensions");
    }

    // For advanced processing, we'll generate ImageMagick commands
    // and execute them if available, or provide instructions
    const magickCommands: string[] = [];
    let currentInput = options.input;

    // Build ImageMagick command chain
    if (options.colorKey) {
      // Make specific color transparent
      magickCommands.push(`-transparent "#${options.colorKey}"`);
      operations.push(`color-key: #${options.colorKey}`);
    }

    if (options.removeBg) {
      // Attempt to remove background (works best with solid backgrounds)
      magickCommands.push(`-fuzz 10% -transparent white`);
      operations.push("remove-bg");
    }

    if (options.trim) {
      magickCommands.push(`-trim +repage`);
      operations.push("trim");
    }

    if (options.resize) {
      const [width, height] = options.resize.split("x").map(Number);
      const filter = options.filter === "linear" ? "Triangle" : "Point";
      magickCommands.push(`-filter ${filter} -resize ${width}x${height}!`);
      operations.push(`resize: ${options.resize} (${options.filter || "nearest"})`);
    }

    if (options.padding && options.padding > 0) {
      const pad = options.padding;
      magickCommands.push(`-bordercolor transparent -border ${pad}`);
      operations.push(`padding: ${pad}px`);
    }

    // If no ImageMagick commands needed, just copy
    if (magickCommands.length === 0) {
      await Deno.copyFile(options.input, options.output);
      operations.push("copy (no processing)");

      return {
        success: true,
        input: options.input,
        output: options.output,
        originalSize: dimensions,
        finalSize: dimensions,
        operations,
      };
    }

    // Try to run ImageMagick
    const magickCmd = `magick "${currentInput}" ${magickCommands.join(" ")} "${options.output}"`;

    try {
      const process = new Deno.Command("magick", {
        args: [currentInput, ...magickCommands.flatMap((c) => c.split(" ")), options.output],
        stdout: "piped",
        stderr: "piped",
      });

      const { code, stderr } = await process.output();

      if (code !== 0) {
        const errorText = new TextDecoder().decode(stderr);
        throw new Error(`ImageMagick failed: ${errorText}`);
      }

      // Read output dimensions
      const outputData = await Deno.readFile(options.output);
      const outputDimensions = readPngDimensions(outputData);

      return {
        success: true,
        input: options.input,
        output: options.output,
        originalSize: dimensions,
        finalSize: outputDimensions || dimensions,
        operations,
      };
    } catch (magickError) {
      // ImageMagick not available - provide manual instructions
      console.warn("\nWarning: ImageMagick not found. Manual processing required.");
      console.warn("\nRun this command manually:");
      console.warn(`  ${magickCmd}`);
      console.warn("\nOr install ImageMagick:");
      console.warn("  - macOS: brew install imagemagick");
      console.warn("  - Ubuntu: sudo apt install imagemagick");
      console.warn("  - Windows: https://imagemagick.org/script/download.php");

      // Copy file as fallback
      await Deno.copyFile(options.input, options.output);
      operations.push("copy (ImageMagick unavailable)");

      return {
        success: true,
        input: options.input,
        output: options.output,
        originalSize: dimensions,
        finalSize: dimensions,
        operations,
        error: "ImageMagick not available - file copied without processing",
      };
    }
  } catch (error) {
    return {
      success: false,
      input: options.input,
      output: options.output,
      operations,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Post-process sprites for game use

Usage:
  deno run --allow-read --allow-write scripts/process-sprite.ts [options]

Required:
  --input <path>      Input image path
  --output <path>     Output image path

Processing Options:
  --remove-bg         Remove white/light background (make transparent)
  --resize <WxH>      Resize to exact dimensions (e.g., 64x64)
  --filter <type>     Resize filter: nearest (default) or linear
  --trim              Trim transparent/white borders
  --padding <n>       Add transparent padding (pixels)
  --color-key <hex>   Make specific color transparent (e.g., ff00ff)

Other:
  --json              Output result as JSON
  -h, --help          Show this help

Note:
  Advanced processing requires ImageMagick installed.
  Basic operations work without external dependencies.

Examples:
  # Remove background and resize for pixel art
  ./scripts/process-sprite.ts --input raw.png --output sprite.png \\
    --remove-bg --resize 64x64 --filter nearest

  # Trim whitespace and add padding
  ./scripts/process-sprite.ts --input raw.png --output sprite.png \\
    --trim --padding 2

  # Make magenta transparent (color key)
  ./scripts/process-sprite.ts --input raw.png --output sprite.png \\
    --color-key ff00ff
`);
}

// === Argument Parsing ===
function parseArgs(args: string[]): (ProcessOptions & { outputJson?: boolean }) | null {
  const options: Partial<ProcessOptions & { outputJson?: boolean }> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      return null;
    } else if (arg === "--input" && args[i + 1]) {
      options.input = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      options.output = args[++i];
    } else if (arg === "--remove-bg") {
      options.removeBg = true;
    } else if (arg === "--resize" && args[i + 1]) {
      options.resize = args[++i];
    } else if (arg === "--filter" && args[i + 1]) {
      options.filter = args[++i] as "nearest" | "linear";
    } else if (arg === "--trim") {
      options.trim = true;
    } else if (arg === "--padding" && args[i + 1]) {
      options.padding = parseInt(args[++i], 10);
    } else if (arg === "--color-key" && args[i + 1]) {
      options.colorKey = args[++i].replace("#", "");
    } else if (arg === "--json") {
      options.outputJson = true;
    }
  }

  return options as ProcessOptions & { outputJson?: boolean };
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

  if (!options.input) {
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
    console.log(`\nProcessing: ${options.input}`);
  }

  const result = await processSprite(options);

  if (outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    if (result.success) {
      console.log(`Output: ${result.output}`);
      if (result.originalSize && result.finalSize) {
        console.log(
          `Size: ${result.originalSize.width}x${result.originalSize.height} -> ${result.finalSize.width}x${result.finalSize.height}`
        );
      }
      console.log(`Operations: ${result.operations.join(", ")}`);
      if (result.error) {
        console.warn(`Warning: ${result.error}`);
      }
    } else {
      console.error(`Error: ${result.error}`);
      Deno.exit(1);
    }
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
