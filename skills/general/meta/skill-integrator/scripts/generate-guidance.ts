#!/usr/bin/env -S deno run --allow-read

/**
 * Guidance Generator
 *
 * Takes project context + skill metadata and produces trigger-based
 * usage guidance ready to insert into CLAUDE.md or AGENTS.md.
 *
 * Usage:
 *   deno run --allow-read generate-guidance.ts --project-context ctx.json --skills skills.json
 *   cat ctx.json | deno run --allow-read generate-guidance.ts --skills skills.json
 *   deno run --allow-read generate-guidance.ts --skill code-review --project-context ctx.json
 */

// === INTERFACES ===

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

interface ScoredSkill {
  skill: SkillInfo;
  score: number;
  reasons: string[];
  triggerCategory: string;
}

// === TRIGGER CATEGORIES ===

const TRIGGER_CATEGORIES: Record<string, {
  label: string;
  keywords: string[];
  types: string[];
  modes: string[];
  domains: string[];
}> = {
  planning: {
    label: "When Planning & Designing",
    keywords: ["requirements", "architecture", "design", "planning", "analysis", "decomposition", "breakdown"],
    types: ["diagnostic", "utility"],
    modes: ["diagnostic", "assistive"],
    domains: ["agile-software", "infrastructure"],
  },
  writing_code: {
    label: "When Writing Code",
    keywords: ["typescript", "rust", "python", "godot", "react", "electron", "coding", "implementation", "best-practices", "frontend"],
    types: ["diagnostic", "generator"],
    modes: ["diagnostic", "generative", "collaborative"],
    domains: ["web", "typescript", "rust", "python", "gamedev", "desktop", "frontend"],
  },
  writing_content: {
    label: "When Writing Content",
    keywords: ["drafting", "writing", "prose", "dialogue", "narrative", "fiction", "revision", "story", "chapter"],
    types: ["diagnostic", "generator"],
    modes: ["assistive", "collaborative", "generative"],
    domains: ["fiction", "narrative", "creative", "writing"],
  },
  stuck: {
    label: "When Stuck or Debugging",
    keywords: ["thinking", "debugging", "stuck", "breakdown", "decomposition", "brainstorming", "analysis"],
    types: ["diagnostic", "utility"],
    modes: ["diagnostic", "assistive"],
    domains: [],
  },
  reviewing: {
    label: "When Reviewing & Improving",
    keywords: ["review", "revision", "analysis", "evaluation", "check", "audit", "sensitivity", "fact"],
    types: ["diagnostic"],
    modes: ["evaluative", "diagnostic"],
    domains: [],
  },
  managing: {
    label: "When Managing the Project",
    keywords: ["context", "network", "agile", "workflow", "coordination", "bootstrap", "integration"],
    types: ["utility"],
    modes: ["generative", "diagnostic"],
    domains: ["infrastructure", "agile-software"],
  },
  worldbuilding: {
    label: "When Worldbuilding",
    keywords: ["world", "setting", "culture", "language", "religion", "governance", "economic", "settlement", "evolution"],
    types: ["diagnostic", "generator"],
    modes: ["generative", "diagnostic", "collaborative"],
    domains: ["fiction", "narrative", "creative"],
  },
  generating: {
    label: "When Generating Documents & Assets",
    keywords: ["pdf", "docx", "xlsx", "pptx", "presentation", "document", "spreadsheet", "ebook"],
    types: ["generator", "utility"],
    modes: ["generative"],
    domains: [],
  },
};

// === SCORING ===

function scoreSkill(skill: SkillInfo, context: ProjectContext): ScoredSkill {
  let score = 0;
  const reasons: string[] = [];

  // Domain overlap (heaviest weight: 0-0.4)
  const skillDomains = new Set([skill.domain]);
  for (const kw of skill.keywords) {
    if (context.domains.includes(kw)) {
      skillDomains.add(kw);
    }
  }
  const domainOverlap = context.domains.filter(d =>
    skillDomains.has(d) || skill.keywords.includes(d)
  ).length;
  if (domainOverlap > 0) {
    const domainScore = Math.min(domainOverlap * 0.15, 0.4);
    score += domainScore;
    reasons.push(`domain overlap (${domainOverlap} matches)`);
  }

  // Direct domain match
  if (context.domains.includes(skill.domain)) {
    score += 0.2;
    reasons.push(`direct domain match: ${skill.domain}`);
  }

  // Skill type appropriateness (0-0.2)
  // Diagnostic and utility skills are always somewhat useful
  if (skill.type === "diagnostic" || skill.type === "utility") {
    score += 0.1;
    reasons.push(`${skill.type} type is broadly useful`);
  }
  // Generators need domain match to be relevant
  if (skill.type === "generator" && domainOverlap === 0) {
    score -= 0.15;
    reasons.push("generator without domain match");
  }

  // Tech stack match (0-0.15)
  const techOverlap = context.techStack.filter(t =>
    skill.keywords.includes(t) || skill.name.includes(t)
  ).length;
  if (techOverlap > 0) {
    score += Math.min(techOverlap * 0.1, 0.15);
    reasons.push(`tech stack match (${techOverlap})`);
  }

  // Infrastructure skills get a baseline if project has skills
  if (skill.domain === "infrastructure" && context.skillsInstalled.length > 5) {
    score += 0.1;
    reasons.push("infrastructure skill for skill-heavy project");
  }

  // Context network relevance
  if (context.hasContextNetwork && skill.keywords.includes("context")) {
    score += 0.1;
    reasons.push("project uses context network");
  }

  // Determine trigger category
  let bestCategory = "managing";
  let bestCategoryScore = 0;

  for (const [catKey, cat] of Object.entries(TRIGGER_CATEGORIES)) {
    let catScore = 0;

    // Keyword match
    const kwMatches = cat.keywords.filter(kw =>
      skill.keywords.includes(kw) || skill.name.includes(kw)
    ).length;
    catScore += kwMatches * 2;

    // Type match
    if (cat.types.includes(skill.type)) catScore += 1;

    // Mode match
    if (cat.modes.includes(skill.mode)) catScore += 1;

    // Domain match
    if (cat.domains.includes(skill.domain)) catScore += 1;

    if (catScore > bestCategoryScore) {
      bestCategoryScore = catScore;
      bestCategory = catKey;
    }
  }

  return {
    skill,
    score: Math.max(0, Math.min(1, score)),
    reasons,
    triggerCategory: bestCategory,
  };
}

// === FORMATTING ===

function generateTriggerFormat(
  scoredSkills: ScoredSkill[],
  threshold: number
): string {
  const lines: string[] = [];
  const today = new Date().toISOString().split("T")[0];
  const relevant = scoredSkills.filter(s => s.score >= threshold);

  lines.push("## Installed Skills: Usage Guide");
  lines.push(`<!-- Generated by skill-integrator | Last updated: ${today} -->\n`);

  // Group by trigger category
  const grouped: Record<string, ScoredSkill[]> = {};
  for (const scored of relevant) {
    if (!grouped[scored.triggerCategory]) {
      grouped[scored.triggerCategory] = [];
    }
    grouped[scored.triggerCategory].push(scored);
  }

  // Output in a logical order
  const categoryOrder = [
    "planning", "writing_code", "writing_content",
    "stuck", "reviewing", "worldbuilding",
    "managing", "generating",
  ];

  for (const catKey of categoryOrder) {
    const skills = grouped[catKey];
    if (!skills || skills.length === 0) continue;

    const label = TRIGGER_CATEGORIES[catKey]?.label || catKey;
    lines.push(`### ${label}`);

    // Sort by score descending within category
    skills.sort((a, b) => b.score - a.score);

    for (const scored of skills) {
      // Create a concise trigger description from the skill's description
      let triggerDesc = scored.skill.description;
      // Truncate to first sentence or first "Use when" phrase
      const useWhenMatch = triggerDesc.match(/Use when[^.]+\./i);
      if (useWhenMatch) {
        triggerDesc = useWhenMatch[0];
      } else {
        const firstSentence = triggerDesc.split(". ")[0];
        if (firstSentence.length < 120) {
          triggerDesc = firstSentence;
        } else {
          triggerDesc = firstSentence.slice(0, 117) + "...";
        }
      }
      lines.push(`- **${scored.skill.name}**: ${triggerDesc}`);
    }
    lines.push("");
  }

  // Footer
  const totalInstalled = scoredSkills.length;
  lines.push(`[Full inventory: ${totalInstalled} skills installed in .claude/skills/]`);

  return lines.join("\n");
}

function generateDomainFormat(
  scoredSkills: ScoredSkill[],
  threshold: number
): string {
  const lines: string[] = [];
  const today = new Date().toISOString().split("T")[0];
  const relevant = scoredSkills.filter(s => s.score >= threshold);

  lines.push("## Installed Skills: By Domain");
  lines.push(`<!-- Generated by skill-integrator | Last updated: ${today} -->\n`);

  // Group by domain
  const grouped: Record<string, ScoredSkill[]> = {};
  for (const scored of relevant) {
    const domain = scored.skill.domain || "general";
    if (!grouped[domain]) grouped[domain] = [];
    grouped[domain].push(scored);
  }

  for (const [domain, skills] of Object.entries(grouped).sort()) {
    lines.push(`### ${domain}`);
    skills.sort((a, b) => b.score - a.score);
    for (const scored of skills) {
      lines.push(`- **${scored.skill.name}** (${scored.skill.type}): ${scored.skill.description.split(". ")[0]}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function generateTableFormat(
  scoredSkills: ScoredSkill[],
  threshold: number
): string {
  const lines: string[] = [];
  const today = new Date().toISOString().split("T")[0];
  const relevant = scoredSkills.filter(s => s.score >= threshold);

  lines.push("## Installed Skills: Relevance Table");
  lines.push(`<!-- Generated by skill-integrator | Last updated: ${today} -->\n`);

  lines.push("| Skill | Domain | Type | Score | Trigger |");
  lines.push("|-------|--------|------|-------|---------|");

  relevant.sort((a, b) => b.score - a.score);
  for (const scored of relevant) {
    const cat = TRIGGER_CATEGORIES[scored.triggerCategory]?.label || scored.triggerCategory;
    lines.push(
      `| ${scored.skill.name} | ${scored.skill.domain} | ${scored.skill.type} | ${scored.score.toFixed(2)} | ${cat} |`
    );
  }

  return lines.join("\n");
}

function generateSingleSkillGuidance(scored: ScoredSkill): string {
  const lines: string[] = [];
  const cat = TRIGGER_CATEGORIES[scored.triggerCategory]?.label || scored.triggerCategory;

  lines.push(`## Skill Integration: ${scored.skill.name}\n`);
  lines.push(`**Relevance Score:** ${scored.score.toFixed(2)}`);
  lines.push(`**Trigger Category:** ${cat}`);
  lines.push(`**Domain:** ${scored.skill.domain} | **Type:** ${scored.skill.type} | **Mode:** ${scored.skill.mode}`);
  lines.push("");

  lines.push("### Suggested Guidance Entry\n");
  lines.push("```markdown");

  let triggerDesc = scored.skill.description;
  const useWhenMatch = triggerDesc.match(/Use when[^.]+\./i);
  if (useWhenMatch) {
    triggerDesc = useWhenMatch[0];
  } else {
    triggerDesc = triggerDesc.split(". ")[0];
  }
  lines.push(`- **${scored.skill.name}**: ${triggerDesc}`);
  lines.push("```\n");

  lines.push("### Scoring Breakdown\n");
  for (const reason of scored.reasons) {
    lines.push(`- ${reason}`);
  }

  if (scored.skill.triggerPhrases.length > 0) {
    lines.push("\n### Trigger Phrases from Skill\n");
    for (const phrase of scored.skill.triggerPhrases.slice(0, 5)) {
      lines.push(`- ${phrase}`);
    }
  }

  return lines.join("\n");
}

// === DATA LOADING ===

async function loadJson<T>(path: string): Promise<T> {
  try {
    const text = await Deno.readTextFile(path);
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error loading ${path}: ${e}`);
    Deno.exit(1);
  }
}

async function readStdin(): Promise<string> {
  const decoder = new TextDecoder();
  const chunks: string[] = [];
  const reader = Deno.stdin.readable.getReader();

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }

  return chunks.join("");
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Guidance Generator

Generates trigger-based skill usage guidance for CLAUDE.md/AGENTS.md.

Usage:
  deno run --allow-read generate-guidance.ts --project-context ctx.json --skills skills.json
  deno run --allow-read generate-guidance.ts --skill code-review --project-context ctx.json --skills skills.json

Options:
  --project-context F   Path to project context JSON (from analyze-project.ts)
  --skills F            Path to skills JSON (from scan-skills.ts)
  --skill S             Generate guidance for a single skill only
  --format F            Output format: trigger (default), domain, table
  --threshold N         Minimum relevance score (default: 0.3)
  --json                Output scored data as JSON instead of markdown

Examples:
  deno run --allow-read generate-guidance.ts --project-context ctx.json --skills skills.json
  deno run --allow-read generate-guidance.ts --skill code-review --project-context ctx.json --skills skills.json
  deno run --allow-read generate-guidance.ts --format table --threshold 0.5 --project-context ctx.json --skills skills.json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const ctxIndex = args.indexOf("--project-context");
  const skillsIndex = args.indexOf("--skills");
  const skillIndex = args.indexOf("--skill");
  const formatIndex = args.indexOf("--format");
  const thresholdIndex = args.indexOf("--threshold");
  const jsonOutput = args.includes("--json");

  const format = formatIndex !== -1 && args[formatIndex + 1]
    ? args[formatIndex + 1]
    : "trigger";
  const threshold = thresholdIndex !== -1 && args[thresholdIndex + 1]
    ? parseFloat(args[thresholdIndex + 1])
    : 0.3;
  const singleSkill = skillIndex !== -1 && args[skillIndex + 1]
    ? args[skillIndex + 1]
    : null;

  // Load project context
  let context: ProjectContext;
  if (ctxIndex !== -1 && args[ctxIndex + 1]) {
    context = await loadJson<ProjectContext>(args[ctxIndex + 1]);
  } else {
    // Try reading from stdin
    try {
      const input = await readStdin();
      context = JSON.parse(input);
    } catch {
      console.error("Error: Provide --project-context or pipe JSON to stdin");
      Deno.exit(1);
    }
  }

  // Load skills data
  let skills: SkillInfo[];
  if (skillsIndex !== -1 && args[skillsIndex + 1]) {
    skills = await loadJson<SkillInfo[]>(args[skillsIndex + 1]);
  } else {
    console.error("Error: --skills argument is required");
    Deno.exit(1);
  }

  // Score all skills
  const scoredSkills = skills.map(skill => scoreSkill(skill, context));

  // Single skill mode
  if (singleSkill) {
    const scored = scoredSkills.find(s => s.skill.name === singleSkill);
    if (!scored) {
      console.error(`Skill not found: ${singleSkill}`);
      Deno.exit(1);
    }
    if (jsonOutput) {
      console.log(JSON.stringify(scored, null, 2));
    } else {
      console.log(generateSingleSkillGuidance(scored));
    }
    return;
  }

  // Full output
  if (jsonOutput) {
    console.log(JSON.stringify(scoredSkills.filter(s => s.score >= threshold), null, 2));
    return;
  }

  switch (format) {
    case "domain":
      console.log(generateDomainFormat(scoredSkills, threshold));
      break;
    case "table":
      console.log(generateTableFormat(scoredSkills, threshold));
      break;
    case "trigger":
    default:
      console.log(generateTriggerFormat(scoredSkills, threshold));
      break;
  }
}

main();
