#!/usr/bin/env -S deno run --allow-read

/**
 * Project Analyzer
 *
 * Detects project type, domains, and tech stack by scanning
 * indicator files, file extensions, and installed skills.
 *
 * Usage:
 *   deno run --allow-read analyze-project.ts
 *   deno run --allow-read analyze-project.ts --path /some/project
 *   deno run --allow-read analyze-project.ts --json
 */

// === INTERFACES ===

interface ProjectPattern {
  indicators: string[];
  requiredIndicators: number;
  extensions: string[];
  domains: string[];
  techStack: string[];
  packageJsonDeps?: string[];
  skillSignals?: string[];
  highMdRatio?: boolean;
}

interface ProjectPatterns {
  _meta: { description: string; usage: string; version: string };
  [key: string]: ProjectPattern | { description: string; usage: string; version: string };
}

interface ProjectContext {
  type: string;
  domains: string[];
  techStack: string[];
  fileTypes: Record<string, number>;
  hasContextNetwork: boolean;
  skillsInstalled: string[];
  projectPath: string;
  matchedPatterns: string[];
}

// === DATA LOADING ===

async function loadPatterns(): Promise<ProjectPatterns> {
  const scriptDir = new URL(".", import.meta.url).pathname;
  const dataPath = `${scriptDir}../data/project-patterns.json`;
  try {
    const text = await Deno.readTextFile(dataPath);
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error loading project-patterns.json: ${e}`);
    Deno.exit(1);
  }
}

// === UTILITIES ===

async function exists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function countFilesByExtension(
  dir: string,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<Record<string, number>> {
  const counts: Record<string, number> = {};

  if (currentDepth >= maxDepth) return counts;

  try {
    for await (const entry of Deno.readDir(dir)) {
      // Skip hidden dirs, node_modules, target, etc.
      if (entry.name.startsWith(".") || entry.name === "node_modules" ||
          entry.name === "target" || entry.name === "dist" ||
          entry.name === "__pycache__" || entry.name === "vendor") {
        continue;
      }

      if (entry.isFile) {
        const ext = entry.name.includes(".")
          ? "." + entry.name.split(".").pop()!
          : "(none)";
        counts[ext] = (counts[ext] || 0) + 1;
      } else if (entry.isDirectory) {
        const subCounts = await countFilesByExtension(
          `${dir}/${entry.name}`,
          maxDepth,
          currentDepth + 1
        );
        for (const [ext, count] of Object.entries(subCounts)) {
          counts[ext] = (counts[ext] || 0) + count;
        }
      }
    }
  } catch {
    // Permission or access error, skip
  }

  return counts;
}

async function getInstalledSkills(projectPath: string): Promise<string[]> {
  const skillsDir = `${projectPath}/.claude/skills`;
  const skills: string[] = [];

  try {
    for await (const entry of Deno.readDir(skillsDir)) {
      if (entry.isDirectory && !entry.name.startsWith(".")) {
        // Verify it has a SKILL.md
        if (await exists(`${skillsDir}/${entry.name}/SKILL.md`)) {
          skills.push(entry.name);
        }
      }
    }
  } catch {
    // No skills directory
  }

  return skills.sort();
}

async function readPackageJsonDeps(projectPath: string): Promise<string[]> {
  try {
    const text = await Deno.readTextFile(`${projectPath}/package.json`);
    const pkg = JSON.parse(text);
    const deps = Object.keys(pkg.dependencies || {});
    const devDeps = Object.keys(pkg.devDependencies || {});
    return [...deps, ...devDeps];
  } catch {
    return [];
  }
}

// === CORE LOGIC ===

async function analyzeProject(projectPath: string): Promise<ProjectContext> {
  const patterns = await loadPatterns();
  const fileTypes = await countFilesByExtension(projectPath);
  const installedSkills = await getInstalledSkills(projectPath);
  const hasContextNetwork = await exists(`${projectPath}/.context-network.md`);
  const packageDeps = await readPackageJsonDeps(projectPath);

  const matchedPatterns: string[] = [];
  const allDomains = new Set<string>();
  const allTechStack = new Set<string>();

  // Score each pattern
  for (const [patternName, pattern] of Object.entries(patterns)) {
    if (patternName === "_meta") continue;
    const p = pattern as ProjectPattern;

    // Check indicator files
    let indicatorHits = 0;
    for (const indicator of p.indicators) {
      if (await exists(`${projectPath}/${indicator}`)) {
        indicatorHits++;
      }
    }

    // Check package.json deps if pattern specifies them
    let depsMatch = true;
    if (p.packageJsonDeps && p.packageJsonDeps.length > 0) {
      depsMatch = p.packageJsonDeps.some(dep => packageDeps.includes(dep));
      if (!depsMatch) continue;
    }

    // Check skill signals (for creative patterns)
    let skillSignalMatch = false;
    if (p.skillSignals && p.skillSignals.length > 0) {
      const matchCount = p.skillSignals.filter(s => installedSkills.includes(s)).length;
      skillSignalMatch = matchCount >= 2;
    }

    // Check high markdown ratio
    let mdRatioMatch = false;
    if (p.highMdRatio) {
      const totalFiles = Object.values(fileTypes).reduce((a, b) => a + b, 0);
      const mdFiles = fileTypes[".md"] || 0;
      mdRatioMatch = totalFiles > 0 && mdFiles / totalFiles > 0.5;
    }

    // Determine if pattern matches
    const indicatorsMet = indicatorHits >= p.requiredIndicators;
    const hasExtensions = p.extensions.some(ext => (fileTypes[ext] || 0) > 0);

    if (
      (indicatorsMet && p.requiredIndicators > 0) ||
      (skillSignalMatch) ||
      (mdRatioMatch && p.highMdRatio) ||
      (indicatorsMet && hasExtensions && p.requiredIndicators === 0)
    ) {
      matchedPatterns.push(patternName);
      for (const domain of p.domains) allDomains.add(domain);
      for (const tech of p.techStack) allTechStack.add(tech);
    }
  }

  // Determine primary type
  let type = "unknown";
  if (matchedPatterns.length === 0) {
    type = "unknown";
  } else if (matchedPatterns.length === 1) {
    type = matchedPatterns[0];
  } else {
    // Multiple matches - prefer more specific patterns
    const softwarePatterns = matchedPatterns.filter(p => p.startsWith("software."));
    const creativePatterns = matchedPatterns.filter(p => p.startsWith("creative."));

    if (softwarePatterns.length > 0 && creativePatterns.length === 0) {
      // Pick most specific software pattern
      type = softwarePatterns.find(p => p !== "software.typescript") || softwarePatterns[0];
    } else if (creativePatterns.length > 0 && softwarePatterns.length === 0) {
      type = creativePatterns[0];
    } else {
      type = "mixed";
    }
  }

  return {
    type,
    domains: [...allDomains].sort(),
    techStack: [...allTechStack].sort(),
    fileTypes,
    hasContextNetwork,
    skillsInstalled: installedSkills,
    projectPath,
    matchedPatterns,
  };
}

// === FORMATTING ===

function formatResult(ctx: ProjectContext): string {
  const lines: string[] = [];

  lines.push(`# Project Analysis: ${ctx.projectPath}\n`);
  lines.push(`**Type:** ${ctx.type}`);
  lines.push(`**Domains:** ${ctx.domains.join(", ") || "(none detected)"}`);
  lines.push(`**Tech Stack:** ${ctx.techStack.join(", ") || "(none detected)"}`);
  lines.push(`**Context Network:** ${ctx.hasContextNetwork ? "Yes" : "No"}`);
  lines.push(`**Matched Patterns:** ${ctx.matchedPatterns.join(", ") || "(none)"}`);
  lines.push("");

  lines.push(`## File Types\n`);
  const sorted = Object.entries(ctx.fileTypes).sort((a, b) => b[1] - a[1]);
  for (const [ext, count] of sorted.slice(0, 15)) {
    lines.push(`  ${ext}: ${count}`);
  }
  lines.push("");

  lines.push(`## Installed Skills (${ctx.skillsInstalled.length})\n`);
  if (ctx.skillsInstalled.length === 0) {
    lines.push("  (none)");
  } else {
    for (const skill of ctx.skillsInstalled) {
      lines.push(`  - ${skill}`);
    }
  }

  return lines.join("\n");
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Project Analyzer

Detects project type, domains, tech stack, and installed skills.

Usage:
  deno run --allow-read analyze-project.ts [options]

Options:
  --path P    Project path to analyze (default: current directory)
  --json      Output as JSON

Examples:
  deno run --allow-read analyze-project.ts
  deno run --allow-read analyze-project.ts --path /my/project --json
`);
    Deno.exit(0);
  }

  const pathIndex = args.indexOf("--path");
  const projectPath = pathIndex !== -1 && args[pathIndex + 1]
    ? args[pathIndex + 1]
    : Deno.cwd();
  const jsonOutput = args.includes("--json");

  const result = await analyzeProject(projectPath);

  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatResult(result));
  }
}

main();
