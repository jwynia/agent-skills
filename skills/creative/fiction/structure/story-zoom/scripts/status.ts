#!/usr/bin/env -S deno run --allow-read

/**
 * status.ts - Display change log summary for story-zoom
 *
 * Reads the change log and shows what's changed since the last review.
 * Useful for LLM to quickly understand what needs attention.
 *
 * Usage:
 *   deno run --allow-read status.ts [project-path]
 *   deno run --allow-read status.ts [project-path] --all
 *   deno run --allow-read status.ts [project-path] --json
 */

interface ChangeEntry {
  file: string;
  time: string;
  kind: "create" | "modify" | "remove";
}

interface LastReview {
  timestamp: string;
  note?: string;
}

interface StatusSummary {
  project: string;
  lastReview: string;
  changesSinceReview: number;
  totalChanges: number;
  byLevel: Record<string, ChangeEntry[]>;
  byKind: Record<string, number>;
  recentChanges: ChangeEntry[];
}

function showUsage(): void {
  console.log(`
Story-Zoom Status
=================

Shows changes since last review.

Usage:
  deno run --allow-read status.ts [project-path] [options]

Options:
  --all       Show all changes, not just since last review
  --json      Output as JSON (useful for LLM processing)
  --help, -h  Show this help

Example:
  deno run --allow-read status.ts ./my-novel
  deno run --allow-read status.ts ./my-novel --json
`);
}

function getLevel(file: string): string {
  const dir = file.split("/")[0];
  const levelMap: Record<string, string> = {
    pitch: "L1 Pitch",
    structure: "L2 Structure",
    scenes: "L3 Scenes",
    entities: "L4 Entities",
    manuscript: "L5 Manuscript",
  };
  return levelMap[dir] || "Unknown";
}

async function readChangeLog(path: string): Promise<ChangeEntry[]> {
  try {
    const content = await Deno.readTextFile(path);
    const lines = content.trim().split("\n").filter((l) => l.length > 0);
    return lines.map((line) => JSON.parse(line) as ChangeEntry);
  } catch {
    return [];
  }
}

async function readLastReview(path: string): Promise<LastReview | null> {
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content) as LastReview;
  } catch {
    return null;
  }
}

async function getStatus(projectPath: string, showAll: boolean): Promise<StatusSummary> {
  const basePath = projectPath.endsWith("/") ? projectPath.slice(0, -1) : projectPath;
  const projectName = basePath.split("/").pop() || "Unknown";

  const changeLogPath = `${basePath}/story-state/change-log.jsonl`;
  const lastReviewPath = `${basePath}/story-state/last-review.json`;

  const allChanges = await readChangeLog(changeLogPath);
  const lastReview = await readLastReview(lastReviewPath);

  const lastReviewTime = lastReview?.timestamp || new Date(0).toISOString();

  // Filter changes since last review
  const recentChanges = showAll
    ? allChanges
    : allChanges.filter((c) => c.time > lastReviewTime);

  // Group by level
  const byLevel: Record<string, ChangeEntry[]> = {};
  for (const change of recentChanges) {
    const level = getLevel(change.file);
    if (!byLevel[level]) {
      byLevel[level] = [];
    }
    byLevel[level].push(change);
  }

  // Count by kind
  const byKind: Record<string, number> = { create: 0, modify: 0, remove: 0 };
  for (const change of recentChanges) {
    byKind[change.kind]++;
  }

  return {
    project: projectName,
    lastReview: lastReviewTime,
    changesSinceReview: recentChanges.length,
    totalChanges: allChanges.length,
    byLevel,
    byKind,
    recentChanges: recentChanges.slice(-20), // Last 20 changes
  };
}

function formatStatus(status: StatusSummary, showAll: boolean): string {
  const lines: string[] = [];

  lines.push(`Story-Zoom Status: ${status.project}`);
  lines.push(`${"=".repeat(40)}`);
  lines.push(``);

  if (!showAll) {
    lines.push(`Last Review: ${status.lastReview}`);
    lines.push(`Changes Since Review: ${status.changesSinceReview}`);
  } else {
    lines.push(`Total Changes Logged: ${status.totalChanges}`);
  }

  lines.push(``);

  if (status.changesSinceReview === 0 && !showAll) {
    lines.push(`No changes since last review.`);
    return lines.join("\n");
  }

  // By kind
  lines.push(`By Type:`);
  lines.push(`  Created: ${status.byKind.create}`);
  lines.push(`  Modified: ${status.byKind.modify}`);
  lines.push(`  Removed: ${status.byKind.remove}`);
  lines.push(``);

  // By level
  lines.push(`By Level:`);
  const levels = ["L1 Pitch", "L2 Structure", "L3 Scenes", "L4 Entities", "L5 Manuscript"];
  for (const level of levels) {
    const count = status.byLevel[level]?.length || 0;
    if (count > 0) {
      lines.push(`  ${level}: ${count} changes`);
      for (const change of status.byLevel[level].slice(-5)) {
        lines.push(`    - [${change.kind}] ${change.file}`);
      }
    }
  }
  lines.push(``);

  // Recent changes
  if (status.recentChanges.length > 0) {
    lines.push(`Recent Changes (last ${Math.min(20, status.recentChanges.length)}):`);
    for (const change of status.recentChanges.slice(-10)) {
      const time = change.time.split("T")[0];
      lines.push(`  [${time}] ${change.kind}: ${change.file}`);
    }
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  const showAll = args.includes("--all");
  const jsonOutput = args.includes("--json");

  // Find project path
  let projectPath = ".";
  for (const arg of args) {
    if (!arg.startsWith("--")) {
      projectPath = arg;
      break;
    }
  }

  try {
    const status = await getStatus(projectPath, showAll);

    if (jsonOutput) {
      console.log(JSON.stringify(status, null, 2));
    } else {
      console.log(formatStatus(status, showAll));
    }
  } catch (e) {
    console.error(`Error reading story state: ${e}`);
    console.error(`\nMake sure story-state/ exists. Run init.ts first.`);
    Deno.exit(1);
  }
}

main();
