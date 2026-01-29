#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Godot Import File Generator CLI
 *
 * Generate Godot .import files with optimal settings for different asset types.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-import-files.ts \
 *     --input ./sprites/player.png --preset pixel-art
 *
 * Permissions:
 *   --allow-read: Read image files for dimension detection
 *   --allow-write: Write .import files
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-import-files";

// === Import Presets ===
const IMPORT_PRESETS: Record<string, Record<string, unknown>> = {
  "pixel-art": {
    "dest_files": [],
    "generator_parameters": {},
    "importer": "texture",
    "type": "CompressedTexture2D",
    "uid": "",
    "params": {
      "compress/channel_pack": 0,
      "compress/hdr_compression": 1,
      "compress/high_quality": false,
      "compress/lossy_quality": 0.7,
      "compress/mode": 0, // Lossless
      "compress/normal_map": 0,
      "detect_3d/compress_to": 0,
      "editor/convert_colors_with_editor_theme": false,
      "editor/scale_with_editor_scale": false,
      "mipmaps/generate": false,
      "mipmaps/limit": -1,
      "process/fix_alpha_border": true,
      "process/hdr_as_srgb": false,
      "process/hdr_clamp_exposure": false,
      "process/normal_map_invert_y": false,
      "process/premult_alpha": false,
      "process/size_limit": 0,
      "roughness/mode": 0,
      "roughness/src_normal": "",
    },
  },
  "hd-sprite": {
    "dest_files": [],
    "generator_parameters": {},
    "importer": "texture",
    "type": "CompressedTexture2D",
    "uid": "",
    "params": {
      "compress/channel_pack": 0,
      "compress/hdr_compression": 1,
      "compress/high_quality": true,
      "compress/lossy_quality": 0.7,
      "compress/mode": 2, // VRAM Compressed
      "compress/normal_map": 0,
      "detect_3d/compress_to": 0,
      "editor/convert_colors_with_editor_theme": false,
      "editor/scale_with_editor_scale": false,
      "mipmaps/generate": true,
      "mipmaps/limit": -1,
      "process/fix_alpha_border": true,
      "process/hdr_as_srgb": false,
      "process/hdr_clamp_exposure": false,
      "process/normal_map_invert_y": false,
      "process/premult_alpha": false,
      "process/size_limit": 0,
      "roughness/mode": 0,
      "roughness/src_normal": "",
    },
  },
  ui: {
    "dest_files": [],
    "generator_parameters": {},
    "importer": "texture",
    "type": "CompressedTexture2D",
    "uid": "",
    "params": {
      "compress/channel_pack": 0,
      "compress/hdr_compression": 1,
      "compress/high_quality": false,
      "compress/lossy_quality": 0.7,
      "compress/mode": 0, // Lossless
      "compress/normal_map": 0,
      "detect_3d/compress_to": 0,
      "editor/convert_colors_with_editor_theme": false,
      "editor/scale_with_editor_scale": false,
      "mipmaps/generate": false,
      "mipmaps/limit": -1,
      "process/fix_alpha_border": true,
      "process/hdr_as_srgb": false,
      "process/hdr_clamp_exposure": false,
      "process/normal_map_invert_y": false,
      "process/premult_alpha": false,
      "process/size_limit": 0,
      "roughness/mode": 0,
      "roughness/src_normal": "",
    },
  },
};

// === Types ===
interface ImportOptions {
  input: string;
  preset?: string;
  frames?: number;
  columns?: number;
  fps?: number;
}

interface ImportResult {
  success: boolean;
  input: string;
  importFile: string;
  preset: string;
  error?: string;
}

// === Generate UID ===
function generateUID(): string {
  // Generate a Godot-style UID
  const chars = "0123456789abcdefghijklmnopqrstuvwxyz";
  let uid = "uid://";
  for (let i = 0; i < 13; i++) {
    uid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uid;
}

// === Serialize Godot Config ===
function serializeGodotConfig(data: Record<string, unknown>, indent = 0): string {
  const lines: string[] = [];
  const prefix = "  ".repeat(indent);

  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      continue;
    }

    if (typeof value === "object" && !Array.isArray(value)) {
      lines.push(`${prefix}${key}={`);
      lines.push(serializeGodotConfig(value as Record<string, unknown>, indent + 1));
      lines.push(`${prefix}}`);
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${prefix}${key}=[]`);
      } else {
        lines.push(`${prefix}${key}=[${value.map((v) => JSON.stringify(v)).join(", ")}]`);
      }
    } else if (typeof value === "string") {
      lines.push(`${prefix}${key}="${value}"`);
    } else if (typeof value === "boolean") {
      lines.push(`${prefix}${key}=${value}`);
    } else {
      lines.push(`${prefix}${key}=${value}`);
    }
  }

  return lines.join("\n");
}

// === Generate Import File Content ===
function generateImportContent(
  sourcePath: string,
  preset: Record<string, unknown>
): string {
  const fileName = sourcePath.split("/").pop() ?? sourcePath;
  const uid = generateUID();

  const lines: string[] = [
    "[remap]",
    "",
    `importer="${preset.importer}"`,
    `type="${preset.type}"`,
    `uid="${uid}"`,
    `path="res://.godot/imported/${fileName}-${uid.replace("uid://", "")}.ctex"`,
    "",
    "[deps]",
    "",
    `source_file="res://${sourcePath}"`,
    `dest_files=["res://.godot/imported/${fileName}-${uid.replace("uid://", "")}.ctex"]`,
    "",
    "[params]",
    "",
  ];

  // Add parameters
  const params = preset.params as Record<string, unknown>;
  for (const [key, value] of Object.entries(params)) {
    if (typeof value === "string") {
      lines.push(`${key}="${value}"`);
    } else if (typeof value === "boolean") {
      lines.push(`${key}=${value}`);
    } else {
      lines.push(`${key}=${value}`);
    }
  }

  return lines.join("\n");
}

// === Core Generation ===
export async function generateImportFile(options: ImportOptions): Promise<ImportResult> {
  const preset = options.preset ?? "pixel-art";
  const presetConfig = IMPORT_PRESETS[preset];

  if (!presetConfig) {
    return {
      success: false,
      input: options.input,
      importFile: "",
      preset,
      error: `Unknown preset: ${preset}. Available: ${Object.keys(IMPORT_PRESETS).join(", ")}`,
    };
  }

  try {
    // Check if input file exists
    await Deno.stat(options.input);

    const importPath = `${options.input}.import`;
    const content = generateImportContent(options.input, presetConfig);

    await Deno.writeTextFile(importPath, content);

    return {
      success: true,
      input: options.input,
      importFile: importPath,
      preset,
    };
  } catch (error) {
    return {
      success: false,
      input: options.input,
      importFile: "",
      preset,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// === Batch Generation ===
async function generateForDirectory(
  dir: string,
  preset: string
): Promise<ImportResult[]> {
  const results: ImportResult[] = [];

  for await (const entry of Deno.readDir(dir)) {
    if (entry.isFile && entry.name.endsWith(".png")) {
      const result = await generateImportFile({
        input: `${dir}/${entry.name}`,
        preset,
      });
      results.push(result);
    }
  }

  return results;
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate Godot .import files

Usage:
  deno run --allow-read --allow-write scripts/generate-import-files.ts [options]

Required:
  --input <path>      Input image file or directory

Optional:
  --preset <name>     Preset: pixel-art (default), hd-sprite, ui
  --frames <n>        Animation frame count (for sprite sheets)
  --columns <n>       Sprite sheet columns
  --fps <n>           Animation FPS (default: 12)
  --json              Output result as JSON
  -h, --help          Show this help

Presets:
  pixel-art   Nearest filter, lossless, no mipmaps (for pixel art)
  hd-sprite   Linear filter, VRAM compressed, mipmaps (for HD sprites)
  ui          Linear filter, lossless, no mipmaps (for UI elements)

Note:
  For sprite sheet animation setup, use the metadata JSON from
  pack-spritesheet.ts to configure SpriteFrames in Godot.

Examples:
  # Single file with pixel art preset
  ./scripts/generate-import-files.ts --input ./sprites/player.png --preset pixel-art

  # Directory of HD sprites
  ./scripts/generate-import-files.ts --input ./hd-sprites/ --preset hd-sprite

  # UI elements
  ./scripts/generate-import-files.ts --input ./ui/icons/ --preset ui
`);
}

// === Argument Parsing ===
function parseArgs(args: string[]): (ImportOptions & { outputJson?: boolean }) | null {
  const options: Partial<ImportOptions & { outputJson?: boolean }> = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      return null;
    } else if (arg === "--input" && args[i + 1]) {
      options.input = args[++i];
    } else if (arg === "--preset" && args[i + 1]) {
      options.preset = args[++i];
    } else if (arg === "--frames" && args[i + 1]) {
      options.frames = parseInt(args[++i], 10);
    } else if (arg === "--columns" && args[i + 1]) {
      options.columns = parseInt(args[++i], 10);
    } else if (arg === "--fps" && args[i + 1]) {
      options.fps = parseInt(args[++i], 10);
    } else if (arg === "--json") {
      options.outputJson = true;
    }
  }

  return options as ImportOptions & { outputJson?: boolean };
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

  const outputJson = options.outputJson;
  const preset = options.preset ?? "pixel-art";

  // Check if input is directory or file
  let results: ImportResult[];

  try {
    const stat = await Deno.stat(options.input);

    if (stat.isDirectory) {
      if (!outputJson) {
        console.log(`\nGenerating .import files for directory: ${options.input}`);
        console.log(`Preset: ${preset}`);
      }
      results = await generateForDirectory(options.input, preset);
    } else {
      if (!outputJson) {
        console.log(`\nGenerating .import file for: ${options.input}`);
        console.log(`Preset: ${preset}`);
      }
      const result = await generateImportFile({ ...options, preset });
      results = [result];
    }
  } catch (error) {
    console.error(`Error: ${error instanceof Error ? error.message : error}`);
    Deno.exit(1);
  }

  if (outputJson) {
    console.log(JSON.stringify(results, null, 2));
  } else {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    console.log(`\nGenerated ${successful.length} import file(s)`);

    if (failed.length > 0) {
      console.log(`\nFailed (${failed.length}):`);
      for (const r of failed) {
        console.log(`  - ${r.input}: ${r.error}`);
      }
    }

    for (const r of successful) {
      console.log(`  ✓ ${r.importFile}`);
    }
  }

  if (results.some((r) => !r.success)) {
    Deno.exit(1);
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
