#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * watcher.ts - Simple file change logger for story-zoom
 *
 * Watches story directories and logs changes to change-log.jsonl.
 * Does NO semantic understanding - just records what changed and when.
 * The LLM skill does all the thinking.
 *
 * Usage:
 *   deno run --allow-read --allow-write watcher.ts ./story-project
 *   deno run --allow-read --allow-write watcher.ts ./story-project --log ./custom/change-log.jsonl
 */

const WATCH_DIRS = ["pitch", "structure", "scenes", "entities", "manuscript"];
const DEFAULT_LOG = "story-state/change-log.jsonl";

interface ChangeEntry {
  file: string;
  time: string;
  kind: "create" | "modify" | "remove";
}

function showUsage(): void {
  console.log(`
Story-Zoom File Watcher
=======================

Watches story directories and logs changes. Does no semantic analysis.

Usage:
  deno run --allow-read --allow-write watcher.ts <project-path> [options]

Options:
  --log <path>    Custom log file location (default: story-state/change-log.jsonl)
  --help, -h      Show this help

Watched directories:
  pitch/          L1: tagline, logline, synopsis
  structure/      L2: outline, beats, acts
  scenes/         L3: scene files
  entities/       L4: characters, locations, items
  manuscript/     L5: actual prose

Example:
  deno run --allow-read --allow-write watcher.ts ./my-novel
  deno run --allow-read --allow-write watcher.ts ./my-novel --log ./logs/changes.jsonl
`);
}

async function ensureDir(path: string): Promise<void> {
  const dir = path.substring(0, path.lastIndexOf("/"));
  if (dir) {
    try {
      await Deno.mkdir(dir, { recursive: true });
    } catch (e) {
      if (!(e instanceof Deno.errors.AlreadyExists)) {
        throw e;
      }
    }
  }
}

async function logChange(logFile: string, entry: ChangeEntry): Promise<void> {
  await ensureDir(logFile);
  await Deno.writeTextFile(logFile, JSON.stringify(entry) + "\n", { append: true });
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    showUsage();
    Deno.exit(0);
  }

  // Parse arguments
  const logIndex = args.indexOf("--log");
  const customLog = logIndex !== -1 ? args[logIndex + 1] : null;

  // Find project path (first non-flag argument)
  let projectPath: string | null = null;
  const skipIndices = new Set<number>();
  if (logIndex !== -1) {
    skipIndices.add(logIndex);
    skipIndices.add(logIndex + 1);
  }

  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      projectPath = args[i];
      break;
    }
  }

  if (!projectPath) {
    console.error("Error: Project path required");
    Deno.exit(1);
  }

  // Resolve paths
  const basePath = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;
  const logFile = customLog || `${basePath}/${DEFAULT_LOG}`;

  // Build watch paths (only directories that exist)
  const watchPaths: string[] = [];
  for (const dir of WATCH_DIRS) {
    const fullPath = `${basePath}/${dir}`;
    try {
      const stat = await Deno.stat(fullPath);
      if (stat.isDirectory) {
        watchPaths.push(fullPath);
      }
    } catch {
      // Directory doesn't exist, skip it
    }
  }

  if (watchPaths.length === 0) {
    console.error(`Error: No story directories found in ${basePath}`);
    console.error(`Expected directories: ${WATCH_DIRS.join(", ")}`);
    Deno.exit(1);
  }

  console.log(`Story-Zoom Watcher`);
  console.log(`==================`);
  console.log(`Project: ${basePath}`);
  console.log(`Log file: ${logFile}`);
  console.log(`Watching: ${watchPaths.map(p => p.replace(basePath + "/", "")).join(", ")}`);
  console.log(`\nPress Ctrl+C to stop.\n`);

  // Start watching
  const watcher = Deno.watchFs(watchPaths);

  for await (const event of watcher) {
    // Only log markdown files
    for (const path of event.paths) {
      if (path.endsWith(".md")) {
        // Map Deno event kinds to our simpler set
        let kind: "create" | "modify" | "remove";
        if (event.kind === "create") {
          kind = "create";
        } else if (event.kind === "remove") {
          kind = "remove";
        } else {
          kind = "modify";
        }

        const entry: ChangeEntry = {
          file: path.replace(basePath + "/", ""),
          time: new Date().toISOString(),
          kind,
        };

        await logChange(logFile, entry);
        console.log(`[${entry.time}] ${entry.kind}: ${entry.file}`);
      }
    }
  }
}

main();
