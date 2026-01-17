#!/usr/bin/env -S deno run --allow-read --allow-write --allow-run

/**
 * Reverse Outline Orchestrator
 *
 * Runs the full pipeline from book.txt to outline.md:
 *   book.txt -> segment -> analyze -> detect genre -> track characters -> generate outline
 *
 * Usage:
 *   deno run --allow-read --allow-write --allow-run scripts/reverse-outline.ts book.txt
 *   deno run --allow-read --allow-write --allow-run scripts/reverse-outline.ts book.txt --output ./outlines/
 */

import { dirname, join, basename } from "https://deno.land/std@0.208.0/path/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";

// === CONFIGURATION ===

const SCRIPT_DIR = dirname(new URL(import.meta.url).pathname);

// === UTILITIES ===

async function runScript(
  scriptName: string,
  args: string[],
  description: string
): Promise<void> {
  console.log(`\n[${description}]`);

  const scriptPath = join(SCRIPT_DIR, scriptName);

  const command = new Deno.Command("deno", {
    args: [
      "run",
      "--allow-read",
      "--allow-write",
      scriptPath,
      ...args,
    ],
    stdout: "inherit",
    stderr: "inherit",
  });

  const { code } = await command.output();

  if (code !== 0) {
    throw new Error(`Script ${scriptName} failed with code ${code}`);
  }
}

function inferBookName(inputPath: string): string {
  const base = basename(inputPath);
  return base.replace(/\.[^.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "-");
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`Reverse Outline Orchestrator

Runs the complete reverse-outline pipeline:
  1. Segment book into chapters and scenes
  2. Analyze scene structure (Goal/Conflict/Disaster)
  3. Detect genre and map Key Moments
  4. Track character arcs
  5. Generate markdown outline

Usage:
  deno run --allow-read --allow-write --allow-run scripts/reverse-outline.ts <book.txt> [options]

Options:
  --output <dir>         Output directory (default: ./reverse-outlines/{book-name}/)
  --depth <level>        Analysis depth: quick, standard, detailed (default: standard)
  --protagonist <name>   Specify protagonist name (overrides detection)
  --genre <type>         Override genre detection
  --help, -h             Show this help message

Examples:
  deno run --allow-read --allow-write --allow-run reverse-outline.ts novel.txt
  deno run --allow-read --allow-write --allow-run reverse-outline.ts novel.txt --output ./outlines/
  deno run --allow-read --allow-write --allow-run reverse-outline.ts novel.txt --protagonist "Sarah"
`);
    Deno.exit(0);
  }

  // Parse arguments
  let inputFile = "";
  let outputDir = "";
  let depth = "standard";
  let protagonistName = "";
  let genreOverride = "";

  const skipIndices = new Set<number>();

  for (let i = 0; i < args.length; i++) {
    if (skipIndices.has(i)) continue;

    if (args[i] === "--output" && args[i + 1]) {
      outputDir = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--depth" && args[i + 1]) {
      depth = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--protagonist" && args[i + 1]) {
      protagonistName = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--genre" && args[i + 1]) {
      genreOverride = args[i + 1];
      skipIndices.add(i + 1);
    } else if (!args[i].startsWith("--") && !inputFile) {
      inputFile = args[i];
    }
  }

  if (!inputFile) {
    console.error("Error: No input file provided");
    Deno.exit(1);
  }

  // Verify input file exists
  try {
    await Deno.stat(inputFile);
  } catch {
    console.error(`Error: Input file not found: ${inputFile}`);
    Deno.exit(1);
  }

  // Set up output directory
  const bookName = inferBookName(inputFile);
  if (!outputDir) {
    outputDir = `./reverse-outlines/${bookName}`;
  }

  const analysisDir = join(outputDir, "analysis");
  await ensureDir(analysisDir);

  console.log("=".repeat(60));
  console.log(`Reverse Outline: ${bookName}`);
  console.log("=".repeat(60));
  console.log(`Input: ${inputFile}`);
  console.log(`Output: ${outputDir}`);
  console.log(`Depth: ${depth}`);

  // File paths
  const segmentsFile = join(analysisDir, "segments.json");
  const scenesFile = join(analysisDir, "scenes.json");
  const genreFile = join(analysisDir, "genre.json");
  const charactersFile = join(analysisDir, "characters.json");
  const outlineFile = join(outputDir, "outline.md");

  try {
    // Step 1: Segment book
    await runScript("segment-book.ts", [
      inputFile,
      "--output", segmentsFile,
      "--title", bookName,
    ], "Step 1/5: Segmenting book into chapters and scenes");

    // Step 2: Analyze scenes
    await runScript("analyze-scene-batch.ts", [
      segmentsFile,
      inputFile,
      "--output", scenesFile,
      "--depth", depth,
    ], "Step 2/5: Analyzing scene structure (Goal/Conflict/Disaster)");

    // Step 3: Detect genre
    await runScript("detect-genre.ts", [
      inputFile,
      "--output", genreFile,
    ], "Step 3/5: Detecting genre and mapping Key Moments");

    // Step 4: Track characters
    const characterArgs = [
      segmentsFile,
      inputFile,
      "--output", charactersFile,
    ];
    if (protagonistName) {
      characterArgs.push("--protagonist", protagonistName);
    }
    await runScript("track-characters.ts", characterArgs,
      "Step 4/5: Tracking character arcs");

    // Step 5: Generate outline
    await runScript("generate-outline.ts", [
      "--segments", segmentsFile,
      "--scenes", scenesFile,
      "--genre", genreFile,
      "--characters", charactersFile,
      "--output", outlineFile,
      "--depth", depth,
    ], "Step 5/5: Generating markdown outline");

    console.log("\n" + "=".repeat(60));
    console.log("COMPLETE");
    console.log("=".repeat(60));
    console.log(`\nOutput files:`);
    console.log(`  Outline:    ${outlineFile}`);
    console.log(`  Segments:   ${segmentsFile}`);
    console.log(`  Scenes:     ${scenesFile}`);
    console.log(`  Genre:      ${genreFile}`);
    console.log(`  Characters: ${charactersFile}`);
    console.log("");

  } catch (e) {
    console.error(`\nPipeline failed: ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  }
}

main();
