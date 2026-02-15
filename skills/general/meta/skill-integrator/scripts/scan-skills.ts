#!/usr/bin/env -S deno run --allow-read

/**
 * Skill Scanner
 *
 * Reads all installed skill SKILL.md files, parses frontmatter,
 * and extracts metadata for integration analysis.
 *
 * Usage:
 *   deno run --allow-read scan-skills.ts
 *   deno run --allow-read scan-skills.ts --skill code-review
 *   deno run --allow-read scan-skills.ts --path /project/.claude/skills
 *   deno run --allow-read scan-skills.ts --json
 */

// === INTERFACES ===

interface SkillInfo {
  name: string;
  description: string;
  domain: string;
  type: string;
  mode: string;
  keywords: string[];
  triggerPhrases: string[];
  path: string;
  hasScripts: boolean;
  hasData: boolean;
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

function parseFrontmatter(content: string): Record<string, string> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};

  const result: Record<string, string> = {};
  const lines = match[1].split("\n");
  let inMetadata = false;

  for (const line of lines) {
    if (line.startsWith("metadata:")) {
      inMetadata = true;
      continue;
    }

    if (inMetadata && line.startsWith("  ")) {
      const metaMatch = line.match(/^\s+(\w+):\s*"?([^"]*)"?$/);
      if (metaMatch) {
        result[`metadata.${metaMatch[1]}`] = metaMatch[2].trim();
      }
    } else if (!line.startsWith(" ")) {
      inMetadata = false;
      const keyMatch = line.match(/^(\w+):\s*(.+)$/);
      if (keyMatch) {
        result[keyMatch[1]] = keyMatch[2].replace(/^"(.*)"$/, "$1").trim();
      }
    }
  }

  return result;
}

function extractTriggerPhrases(content: string): string[] {
  const triggers: string[] = [];

  // Extract from "When to Use" section
  const whenToUseMatch = content.match(/## When to Use[\s\S]*?(?=\n## )/i);
  if (whenToUseMatch) {
    const bullets = whenToUseMatch[0].match(/^-\s+(.+)$/gm);
    if (bullets) {
      triggers.push(...bullets.map(b => b.replace(/^-\s+/, "").trim()));
    }
  }

  // Extract from description field - split on commas and "when"
  const frontmatter = parseFrontmatter(content);
  if (frontmatter.description) {
    const desc = frontmatter.description;
    // Extract "Use when..." and "when..." phrases
    const whenPhrases = desc.match(/(?:Use )?when [^,.]+/gi);
    if (whenPhrases) {
      triggers.push(...whenPhrases.map(p => p.trim()));
    }
  }

  return triggers;
}

function extractKeywords(content: string, frontmatter: Record<string, string>): string[] {
  const keywords = new Set<string>();

  // From domain
  if (frontmatter["metadata.domain"]) {
    keywords.add(frontmatter["metadata.domain"]);
  }

  // From name
  const name = frontmatter.name || "";
  for (const word of name.split("-")) {
    if (word.length > 2) keywords.add(word.toLowerCase());
  }

  // From type and mode
  if (frontmatter["metadata.type"]) keywords.add(frontmatter["metadata.type"]);
  if (frontmatter["metadata.mode"]) {
    for (const m of frontmatter["metadata.mode"].split("+")) {
      keywords.add(m.trim());
    }
  }

  // Extract key terms from first paragraph after frontmatter
  const bodyStart = content.indexOf("---", 3);
  if (bodyStart !== -1) {
    const body = content.slice(bodyStart + 3).trim();
    const firstParagraph = body.split("\n\n")[0] || "";
    // Pull out significant words (skip common ones)
    const skipWords = new Set([
      "the", "a", "an", "and", "or", "but", "in", "on", "at", "to",
      "for", "of", "with", "by", "from", "is", "are", "was", "were",
      "be", "been", "being", "have", "has", "had", "do", "does", "did",
      "will", "would", "could", "should", "may", "might", "can", "this",
      "that", "these", "those", "it", "its", "you", "your", "when",
      "use", "using", "used",
    ]);
    const words = firstParagraph
      .replace(/[#*`\[\](){}|]/g, "")
      .split(/\s+/)
      .map(w => w.toLowerCase().replace(/[.,;:!?]/g, ""))
      .filter(w => w.length > 3 && !skipWords.has(w));
    for (const w of words.slice(0, 10)) {
      keywords.add(w);
    }
  }

  return [...keywords];
}

// === CORE LOGIC ===

async function scanSkill(skillPath: string): Promise<SkillInfo | null> {
  const skillMdPath = `${skillPath}/SKILL.md`;

  try {
    const content = await Deno.readTextFile(skillMdPath);
    const frontmatter = parseFrontmatter(content);

    const name = frontmatter.name || skillPath.split("/").pop() || "unknown";

    return {
      name,
      description: frontmatter.description || "",
      domain: frontmatter["metadata.domain"] || "general",
      type: frontmatter["metadata.type"] || "unknown",
      mode: frontmatter["metadata.mode"] || "unknown",
      keywords: extractKeywords(content, frontmatter),
      triggerPhrases: extractTriggerPhrases(content),
      path: skillPath,
      hasScripts: await exists(`${skillPath}/scripts`),
      hasData: await exists(`${skillPath}/data`),
    };
  } catch {
    return null;
  }
}

async function scanAllSkills(skillsDir: string): Promise<SkillInfo[]> {
  const skills: SkillInfo[] = [];

  try {
    for await (const entry of Deno.readDir(skillsDir)) {
      if (entry.isDirectory && !entry.name.startsWith(".")) {
        const skillPath = `${skillsDir}/${entry.name}`;
        if (await exists(`${skillPath}/SKILL.md`)) {
          const info = await scanSkill(skillPath);
          if (info) skills.push(info);
        }
      }
    }
  } catch (e) {
    console.error(`Error scanning skills directory: ${e}`);
  }

  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

// === FORMATTING ===

function formatSkillInfo(skill: SkillInfo): string {
  const lines: string[] = [];

  lines.push(`## ${skill.name}`);
  lines.push(`**Description:** ${skill.description || "(none)"}`);
  lines.push(`**Domain:** ${skill.domain} | **Type:** ${skill.type} | **Mode:** ${skill.mode}`);
  lines.push(`**Keywords:** ${skill.keywords.join(", ")}`);
  if (skill.triggerPhrases.length > 0) {
    lines.push(`**Triggers:**`);
    for (const trigger of skill.triggerPhrases.slice(0, 5)) {
      lines.push(`  - ${trigger}`);
    }
  }
  lines.push(`**Has Scripts:** ${skill.hasScripts ? "Yes" : "No"} | **Has Data:** ${skill.hasData ? "Yes" : "No"}`);
  lines.push("");

  return lines.join("\n");
}

function formatResults(skills: SkillInfo[]): string {
  const lines: string[] = [];

  lines.push(`# Installed Skills: ${skills.length} found\n`);

  // Summary by domain
  const domainCounts: Record<string, number> = {};
  for (const skill of skills) {
    domainCounts[skill.domain] = (domainCounts[skill.domain] || 0) + 1;
  }
  lines.push("## By Domain\n");
  for (const [domain, count] of Object.entries(domainCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${domain}: ${count}`);
  }
  lines.push("");

  // Summary by type
  const typeCounts: Record<string, number> = {};
  for (const skill of skills) {
    typeCounts[skill.type] = (typeCounts[skill.type] || 0) + 1;
  }
  lines.push("## By Type\n");
  for (const [type, count] of Object.entries(typeCounts).sort((a, b) => b[1] - a[1])) {
    lines.push(`  ${type}: ${count}`);
  }
  lines.push("");

  // Individual skills
  lines.push("## Skills\n");
  for (const skill of skills) {
    lines.push(formatSkillInfo(skill));
  }

  return lines.join("\n");
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Skill Scanner

Reads all installed skill SKILL.md files and extracts metadata.

Usage:
  deno run --allow-read scan-skills.ts [options]

Options:
  --path P      Path to skills directory (default: .claude/skills in cwd)
  --skill S     Scan a single skill by name
  --json        Output as JSON

Examples:
  deno run --allow-read scan-skills.ts
  deno run --allow-read scan-skills.ts --skill code-review --json
  deno run --allow-read scan-skills.ts --path /project/.claude/skills
`);
    Deno.exit(0);
  }

  const pathIndex = args.indexOf("--path");
  const skillsDir = pathIndex !== -1 && args[pathIndex + 1]
    ? args[pathIndex + 1]
    : `${Deno.cwd()}/.claude/skills`;

  const skillIndex = args.indexOf("--skill");
  const singleSkill = skillIndex !== -1 && args[skillIndex + 1]
    ? args[skillIndex + 1]
    : null;

  const jsonOutput = args.includes("--json");

  if (singleSkill) {
    const skillPath = `${skillsDir}/${singleSkill}`;
    const info = await scanSkill(skillPath);
    if (!info) {
      console.error(`Skill not found: ${singleSkill}`);
      Deno.exit(1);
    }
    if (jsonOutput) {
      console.log(JSON.stringify(info, null, 2));
    } else {
      console.log(formatSkillInfo(info));
    }
  } else {
    const skills = await scanAllSkills(skillsDir);
    if (jsonOutput) {
      console.log(JSON.stringify(skills, null, 2));
    } else {
      console.log(formatResults(skills));
    }
  }
}

main();
