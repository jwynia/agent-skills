#!/usr/bin/env -S deno run --allow-env --allow-net --allow-read --allow-write

/**
 * Batch Image Generation CLI
 *
 * Generate multiple images from a specification file with rate limiting
 * and progress tracking.
 *
 * Usage:
 *   deno run --allow-env --allow-net --allow-read --allow-write scripts/batch-generate.ts \
 *     --spec ./batch-spec.json --output ./generated/
 *
 * Permissions:
 *   --allow-env: Read API key environment variables
 *   --allow-net: Make API requests
 *   --allow-read: Read specification file
 *   --allow-write: Save generated images and progress
 */

import { generateImage } from "./generate-image.ts";

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "batch-generate";

// === Types ===
interface AssetSpec {
  name: string;
  prompt: string;
  size?: string;
  model?: string;
}

interface BatchSpec {
  provider: "dalle" | "replicate" | "fal";
  model?: string;
  style?: string;
  basePrompt?: string;
  size?: string;
  assets: AssetSpec[];
}

interface BatchResult {
  spec: string;
  outputDir: string;
  totalAssets: number;
  successful: number;
  failed: number;
  durationMs: number;
  results: Array<{
    name: string;
    success: boolean;
    output?: string;
    error?: string;
    durationMs: number;
  }>;
}

interface ProgressState {
  completed: string[];
  failed: string[];
}

// === Progress Tracking ===
async function loadProgress(progressFile: string): Promise<ProgressState> {
  try {
    const content = await Deno.readTextFile(progressFile);
    return JSON.parse(content);
  } catch {
    return { completed: [], failed: [] };
  }
}

async function saveProgress(progressFile: string, state: ProgressState): Promise<void> {
  await Deno.writeTextFile(progressFile, JSON.stringify(state, null, 2));
}

// === Core Batch Generation ===
export async function batchGenerate(
  spec: BatchSpec,
  outputDir: string,
  options: {
    concurrency?: number;
    delay?: number;
    resume?: boolean;
    progressFile?: string;
  } = {}
): Promise<BatchResult> {
  const startTime = Date.now();
  const concurrency = options.concurrency ?? 2;
  const delay = options.delay ?? 1000;
  const progressFile = options.progressFile || `${outputDir}/.batch-progress.json`;

  // Load progress if resuming
  let progress: ProgressState = { completed: [], failed: [] };
  if (options.resume) {
    progress = await loadProgress(progressFile);
  }

  // Ensure output directory exists
  await Deno.mkdir(outputDir, { recursive: true });

  const results: BatchResult["results"] = [];
  let successful = 0;
  let failed = 0;

  // Filter out already completed assets if resuming
  const assetsToProcess = options.resume
    ? spec.assets.filter((a) => !progress.completed.includes(a.name))
    : spec.assets;

  console.log(`\nBatch generation: ${assetsToProcess.length} assets`);
  console.log(`Provider: ${spec.provider}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Concurrency: ${concurrency}, Delay: ${delay}ms\n`);

  // Process in batches based on concurrency
  for (let i = 0; i < assetsToProcess.length; i += concurrency) {
    const batch = assetsToProcess.slice(i, i + concurrency);

    const batchPromises = batch.map(async (asset) => {
      const assetStart = Date.now();

      // Build full prompt
      let fullPrompt = asset.prompt;
      if (spec.basePrompt) {
        fullPrompt = `${spec.basePrompt}, ${asset.prompt}`;
      }

      const outputPath = `${outputDir}/${asset.name}.png`;

      console.log(`[${i + batch.indexOf(asset) + 1}/${assetsToProcess.length}] Generating: ${asset.name}`);

      const result = await generateImage({
        provider: spec.provider,
        prompt: fullPrompt,
        output: outputPath,
        model: asset.model || spec.model,
        size: asset.size || spec.size,
        style: spec.style,
      });

      const assetResult = {
        name: asset.name,
        success: result.success,
        output: result.success ? outputPath : undefined,
        error: result.error,
        durationMs: Date.now() - assetStart,
      };

      if (result.success) {
        successful++;
        progress.completed.push(asset.name);
        console.log(`  ✓ ${asset.name} (${assetResult.durationMs}ms)`);
      } else {
        failed++;
        progress.failed.push(asset.name);
        console.log(`  ✗ ${asset.name}: ${result.error}`);
      }

      // Save progress after each asset
      await saveProgress(progressFile, progress);

      return assetResult;
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);

    // Delay between batches (not after last batch)
    if (i + concurrency < assetsToProcess.length) {
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Add results for previously completed assets if resuming
  if (options.resume) {
    for (const name of progress.completed) {
      if (!results.find((r) => r.name === name)) {
        results.push({
          name,
          success: true,
          output: `${outputDir}/${name}.png`,
          durationMs: 0,
        });
        successful++;
      }
    }
  }

  return {
    spec: options.progressFile || "inline",
    outputDir,
    totalAssets: spec.assets.length,
    successful,
    failed,
    durationMs: Date.now() - startTime,
    results,
  };
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Batch image generation

Usage:
  deno run --allow-env --allow-net --allow-read --allow-write scripts/batch-generate.ts [options]

Required:
  --spec <path>       Path to batch specification JSON
  --output <dir>      Output directory for generated images

Optional:
  --concurrency <n>   Parallel requests (default: 2)
  --delay <ms>        Delay between batches in ms (default: 1000)
  --resume            Resume from last successful (reads progress file)
  --json              Output results as JSON
  -h, --help          Show this help

Batch Spec Format:
  {
    "provider": "dalle" | "replicate" | "fal",
    "model": "optional-model-name",
    "style": "pixel-art" | "hand-drawn" | "painterly" | "vector",
    "basePrompt": "prefix added to all prompts",
    "size": "1024x1024",
    "assets": [
      { "name": "asset-name", "prompt": "specific prompt" },
      { "name": "another", "prompt": "another prompt", "size": "512x512" }
    ]
  }

Examples:
  # Basic batch generation
  ./scripts/batch-generate.ts --spec ./batch.json --output ./sprites/

  # With rate limiting
  ./scripts/batch-generate.ts --spec ./batch.json --output ./sprites/ \\
    --concurrency 1 --delay 2000

  # Resume interrupted batch
  ./scripts/batch-generate.ts --spec ./batch.json --output ./sprites/ --resume
`);
}

// === Argument Parsing ===
interface BatchOptions {
  specPath: string;
  outputDir: string;
  concurrency: number;
  delay: number;
  resume: boolean;
  outputJson: boolean;
}

function parseArgs(args: string[]): BatchOptions | null {
  const options: Partial<BatchOptions> = {
    concurrency: 2,
    delay: 1000,
    resume: false,
    outputJson: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "-h" || arg === "--help") {
      return null;
    } else if (arg === "--spec" && args[i + 1]) {
      options.specPath = args[++i];
    } else if (arg === "--output" && args[i + 1]) {
      options.outputDir = args[++i];
    } else if (arg === "--concurrency" && args[i + 1]) {
      options.concurrency = parseInt(args[++i], 10);
    } else if (arg === "--delay" && args[i + 1]) {
      options.delay = parseInt(args[++i], 10);
    } else if (arg === "--resume") {
      options.resume = true;
    } else if (arg === "--json") {
      options.outputJson = true;
    }
  }

  return options as BatchOptions;
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

  if (!options.specPath) {
    console.error("Error: --spec is required");
    Deno.exit(1);
  }
  if (!options.outputDir) {
    console.error("Error: --output is required");
    Deno.exit(1);
  }

  // Load spec
  let spec: BatchSpec;
  try {
    const content = await Deno.readTextFile(options.specPath);
    spec = JSON.parse(content);
  } catch (error) {
    console.error(`Error reading spec file: ${error instanceof Error ? error.message : error}`);
    Deno.exit(1);
  }

  // Validate spec
  if (!spec.provider) {
    console.error("Error: spec must include 'provider'");
    Deno.exit(1);
  }
  if (!spec.assets || !Array.isArray(spec.assets) || spec.assets.length === 0) {
    console.error("Error: spec must include non-empty 'assets' array");
    Deno.exit(1);
  }

  const result = await batchGenerate(spec, options.outputDir, {
    concurrency: options.concurrency,
    delay: options.delay,
    resume: options.resume,
    progressFile: `${options.outputDir}/.batch-progress.json`,
  });

  if (options.outputJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log("\n" + "=".repeat(50));
    console.log("Batch Complete");
    console.log("=".repeat(50));
    console.log(`Total: ${result.totalAssets}`);
    console.log(`Successful: ${result.successful}`);
    console.log(`Failed: ${result.failed}`);
    console.log(`Duration: ${(result.durationMs / 1000).toFixed(1)}s`);

    if (result.failed > 0) {
      console.log("\nFailed assets:");
      for (const r of result.results.filter((r) => !r.success)) {
        console.log(`  - ${r.name}: ${r.error}`);
      }
    }
  }

  if (result.failed > 0) {
    Deno.exit(1);
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
