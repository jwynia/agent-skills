#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * init.ts - Initialize story-state directory for a story project
 *
 * Creates the story-state/ directory structure and initial files.
 * Also creates the standard story directory structure if it doesn't exist.
 *
 * Usage:
 *   deno run --allow-read --allow-write init.ts [project-path]
 */

const STORY_DIRS = ["pitch", "structure", "scenes", "entities", "manuscript"];

interface ProjectInfo {
  name: string;
  path: string;
  existingDirs: string[];
  createdDirs: string[];
}

function showUsage(): void {
  console.log(`
Story-Zoom Initializer
======================

Creates story-state/ directory and optionally the standard story structure.

Usage:
  deno run --allow-read --allow-write init.ts [project-path]

If no path provided, initializes in current directory.

Creates:
  story-state/
    change-log.jsonl    Append-only change record
    state.md            LLM-maintained dashboard
    last-review.json    Timestamp of last LLM review

Optionally creates (if missing):
  pitch/                L1: tagline, logline, synopsis
  structure/            L2: outline, beats, acts
  scenes/               L3: scene files
  entities/             L4: characters, locations, items
  manuscript/           L5: actual prose

Example:
  deno run --allow-read --allow-write init.ts ./my-novel
`);
}

async function dirExists(path: string): Promise<boolean> {
  try {
    const stat = await Deno.stat(path);
    return stat.isDirectory;
  } catch {
    return false;
  }
}

async function initProject(projectPath: string): Promise<ProjectInfo> {
  const basePath = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;
  const projectName = basePath.split("/").pop() || "Untitled Project";

  const info: ProjectInfo = {
    name: projectName,
    path: basePath,
    existingDirs: [],
    createdDirs: [],
  };

  // Create base directory if needed
  await Deno.mkdir(basePath, { recursive: true });

  // Check which story directories exist
  for (const dir of STORY_DIRS) {
    const fullPath = `${basePath}/${dir}`;
    if (await dirExists(fullPath)) {
      info.existingDirs.push(dir);
    }
  }

  // Create story-state directory
  const storyStatePath = `${basePath}/story-state`;
  await Deno.mkdir(storyStatePath, { recursive: true });
  info.createdDirs.push("story-state");

  // Create initial change-log.jsonl (empty)
  const changeLogPath = `${storyStatePath}/change-log.jsonl`;
  try {
    await Deno.stat(changeLogPath);
    // File exists, don't overwrite
  } catch {
    await Deno.writeTextFile(changeLogPath, "");
  }

  // Create initial last-review.json
  const lastReviewPath = `${storyStatePath}/last-review.json`;
  try {
    await Deno.stat(lastReviewPath);
  } catch {
    const lastReview = {
      timestamp: new Date().toISOString(),
      note: "Initial setup - baseline established",
    };
    await Deno.writeTextFile(lastReviewPath, JSON.stringify(lastReview, null, 2));
  }

  // Create initial state.md
  const statePath = `${storyStatePath}/state.md`;
  try {
    await Deno.stat(statePath);
  } catch {
    const stateContent = `# Story State: ${projectName}

**Last Review:** ${new Date().toISOString()}
**Health:** Green (newly initialized)

## Level Summary

| Level | Directory | Files | Status | Notes |
|-------|-----------|-------|--------|-------|
| L1 Pitch | pitch/ | - | - | ${info.existingDirs.includes("pitch") ? "Exists" : "Not created"} |
| L2 Structure | structure/ | - | - | ${info.existingDirs.includes("structure") ? "Exists" : "Not created"} |
| L3 Scenes | scenes/ | - | - | ${info.existingDirs.includes("scenes") ? "Exists" : "Not created"} |
| L4 Entities | entities/ | - | - | ${info.existingDirs.includes("entities") ? "Exists" : "Not created"} |
| L5 Manuscript | manuscript/ | - | - | ${info.existingDirs.includes("manuscript") ? "Exists" : "Not created"} |

## Active Concerns

None - freshly initialized.

## Recent Resolutions

- [${new Date().toISOString().split("T")[0]}] Initialized story-state tracking

## Next Steps

1. Start the watcher daemon: \`deno run --allow-read --allow-write scripts/watcher.ts ${basePath}\`
2. Create story files in the appropriate directories
3. Run \`/story-zoom review\` periodically to check for drift
`;
    await Deno.writeTextFile(statePath, stateContent);
  }

  return info;
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  const projectPath = args[0] || ".";

  console.log(`Story-Zoom Initializer`);
  console.log(`======================\n`);

  const info = await initProject(projectPath);

  console.log(`Project: ${info.name}`);
  console.log(`Path: ${info.path}`);
  console.log(`\nCreated:`);
  console.log(`  story-state/change-log.jsonl`);
  console.log(`  story-state/last-review.json`);
  console.log(`  story-state/state.md`);

  if (info.existingDirs.length > 0) {
    console.log(`\nExisting story directories:`);
    for (const dir of info.existingDirs) {
      console.log(`  ${dir}/`);
    }
  }

  const missingDirs = STORY_DIRS.filter((d) => !info.existingDirs.includes(d));
  if (missingDirs.length > 0) {
    console.log(`\nMissing story directories (create as needed):`);
    for (const dir of missingDirs) {
      console.log(`  ${dir}/`);
    }
  }

  console.log(`\nNext steps:`);
  console.log(`  1. Create story directories as needed`);
  console.log(`  2. Start watcher: deno run --allow-read --allow-write scripts/watcher.ts ${info.path}`);
  console.log(`  3. Use /story-zoom review to check synchronization`);
}

main();
