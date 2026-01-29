#!/usr/bin/env -S deno run --allow-read

/**
 * Skill Validator
 *
 * Validates skill completeness and pattern conformance.
 * Checks for required frontmatter, state definitions, script docs, and integrations.
 *
 * Usage:
 *   deno run --allow-read validate-skill.ts ../worldbuilding
 *   deno run --allow-read validate-skill.ts --all
 *   deno run --allow-read validate-skill.ts ../conlang --json
 */

interface ValidationResult {
  skillPath: string;
  skillName: string;
  valid: boolean;
  score: number;
  maxScore: number;
  maturityScore: MaturityScore;
  maturityLevel: string;
  checks: CheckResult[];
  summary: string;
}

interface CheckResult {
  category: string;
  check: string;
  passed: boolean;
  message: string;
  weight: number;
  dimension?: "completeness" | "quality" | "usability";
}

interface MaturityScore {
  completeness: { score: number; max: number };
  quality: { score: number; max: number };
  usability: { score: number; max: number };
  total: number;
}

// Required frontmatter fields
const REQUIRED_FRONTMATTER = ["name", "description", "license"];
const REQUIRED_METADATA = ["author", "version", "domain"];
const REQUIRED_METADATA_NEW = ["type", "mode"]; // New required fields

// Valid type and mode values
const VALID_TYPES = ["diagnostic", "generator", "utility"];
const VALID_MODES = ["diagnostic", "assistive", "collaborative", "evaluative", "application", "generative"];

// Skill types detected from frontmatter
type SkillType = "diagnostic" | "generator" | "utility";

function detectSkillType(frontmatter: Record<string, unknown>): SkillType {
  const metadata = frontmatter.metadata as Record<string, string> | undefined;

  // Check for explicit type in metadata
  if (metadata?.type === "utility") return "utility";
  if (metadata?.type === "generator") return "generator";
  if (metadata?.type === "diagnostic") return "diagnostic";

  // Fallback detection based on mode
  if (metadata?.mode === "generative") return "generator";

  // Default to diagnostic
  return "diagnostic";
}

// Required sections vary by skill type
const REQUIRED_SECTIONS: Record<SkillType, string[]> = {
  diagnostic: [
    "Core Principle",
    "State",
    "Diagnostic Process",
    "What You Do NOT Do",
    "Integration",
  ],
  generator: [
    "Core Principle",
    "What You Do NOT Do",
  ],
  utility: [
    "Core Principle",
  ],
};

const RECOMMENDED_SECTIONS: Record<SkillType, string[]> = {
  diagnostic: [
    "Available Tools",
    "Anti-Pattern",
    "Example",
    "Key Question",
  ],
  generator: [
    "Available Tools",
    "Example",
    "Integration",
  ],
  utility: [
    "Available Tools",
    "Example",
    "Integration",
  ],
};

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function readSkillMd(skillPath: string): Promise<string | null> {
  const path = `${skillPath}/SKILL.md`;
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
}

function parseFrontmatter(content: string): Record<string, unknown> | null {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return null;

  const frontmatter: Record<string, unknown> = {};
  const lines = match[1].split("\n");

  let currentKey = "";
  let inMetadata = false;
  const metadata: Record<string, string> = {};

  for (const line of lines) {
    if (line.startsWith("metadata:")) {
      inMetadata = true;
      continue;
    }

    if (inMetadata && line.startsWith("  ")) {
      const metaMatch = line.match(/^\s+(\w+):\s*"?([^"]*)"?$/);
      if (metaMatch) {
        metadata[metaMatch[1]] = metaMatch[2];
      }
    } else if (!line.startsWith(" ")) {
      inMetadata = false;
      const keyMatch = line.match(/^(\w+):\s*(.*)$/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        frontmatter[currentKey] = keyMatch[2].replace(/^"(.*)"$/, "$1");
      }
    }
  }

  if (Object.keys(metadata).length > 0) {
    frontmatter.metadata = metadata;
  }

  return frontmatter;
}

function checkSection(content: string, sectionName: string): boolean {
  // Look for ## Section or # Section patterns
  const pattern = new RegExp(`^##?\\s+.*${sectionName}`, "im");
  return pattern.test(content);
}

function countStates(content: string): number {
  // Count ### State patterns
  const matches = content.match(/^###\s+State\s+\w+\d+/gim);
  return matches ? matches.length : 0;
}

function hasStateComponents(content: string): {
  hasSymptoms: boolean;
  hasQuestions: boolean;
  hasInterventions: boolean;
} {
  return {
    hasSymptoms: /\*\*Symptoms:\*\*/i.test(content),
    hasQuestions: /\*\*Key Questions:\*\*/i.test(content),
    hasInterventions: /\*\*Interventions:\*\*/i.test(content),
  };
}

function countAntiPatterns(content: string): number {
  // Count ### The [Name] patterns in Anti-Patterns section
  const antiPatternSection = content.match(/## Anti-Patterns[\s\S]*?(?=\n## |$)/i);
  if (!antiPatternSection) return 0;

  const matches = antiPatternSection[0].match(/^###\s+The\s+/gim);
  return matches ? matches.length : 0;
}

function checkStateNamingConvention(content: string): {
  consistent: boolean;
  prefix: string | null;
  issues: string[];
} {
  const stateMatches = content.match(/^###\s+State\s+([A-Z]+)(\d+(?:\.\d+)?)/gim);
  if (!stateMatches || stateMatches.length === 0) {
    return { consistent: true, prefix: null, issues: [] };
  }

  const prefixes = new Set<string>();
  const issues: string[] = [];

  for (const match of stateMatches) {
    const prefixMatch = match.match(/State\s+([A-Z]+)\d/i);
    if (prefixMatch) {
      prefixes.add(prefixMatch[1].toUpperCase());
    }
  }

  if (prefixes.size > 1) {
    issues.push(`Multiple prefixes found: ${[...prefixes].join(", ")}`);
  }

  const prefix = prefixes.size === 1 ? [...prefixes][0] : null;
  return {
    consistent: prefixes.size <= 1,
    prefix,
    issues,
  };
}

function hasIntegrationGraph(content: string): {
  hasInbound: boolean;
  hasOutbound: boolean;
  hasComplementary: boolean;
} {
  const integrationSection = content.match(/## Integration[\s\S]*?(?=\n## |$)/i);
  if (!integrationSection) {
    return { hasInbound: false, hasOutbound: false, hasComplementary: false };
  }

  const section = integrationSection[0];
  return {
    hasInbound: /### Inbound/i.test(section) || /From Other Skills/i.test(section),
    hasOutbound: /### Outbound/i.test(section) || /To Other Skills/i.test(section),
    hasComplementary: /### Complementary/i.test(section) || /Complementary Skills/i.test(section),
  };
}

function hasOutputPersistence(content: string): boolean {
  return /## Output Persistence/i.test(content);
}

function hasQuickReference(content: string): boolean {
  return /## Quick Reference/i.test(content) || /### Quick Reference/i.test(content);
}

function hasDecisionTree(content: string): boolean {
  return /decision tree/i.test(content) || /routing logic/i.test(content) || /when to use/i.test(content);
}

function calculateMaturityLevel(score: number): string {
  if (score >= 18) return "Battle-Tested";
  if (score >= 13) return "Stable";
  if (score >= 8) return "Developing";
  return "Draft";
}

async function getScripts(skillPath: string): Promise<string[]> {
  const scriptsPath = `${skillPath}/scripts`;
  const scripts: string[] = [];

  try {
    for await (const entry of Deno.readDir(scriptsPath)) {
      if (entry.isFile && entry.name.endsWith(".ts")) {
        scripts.push(entry.name);
      }
    }
  } catch {
    // No scripts directory
  }

  return scripts;
}

async function getDataFiles(skillPath: string): Promise<string[]> {
  const dataPath = `${skillPath}/data`;
  const files: string[] = [];

  try {
    for await (const entry of Deno.readDir(dataPath)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        files.push(entry.name);
      }
    }
  } catch {
    // No data directory
  }

  return files;
}

function scriptDocumented(content: string, scriptName: string): boolean {
  const baseName = scriptName.replace(".ts", "");
  return content.includes(`${baseName}.ts`) || content.includes(`### ${baseName}`);
}

async function validateSkill(skillPath: string): Promise<ValidationResult> {
  const checks: CheckResult[] = [];
  const skillName = skillPath.split("/").pop() || "unknown";

  // Check SKILL.md exists
  const content = await readSkillMd(skillPath);
  if (!content) {
    return {
      skillPath,
      skillName,
      valid: false,
      score: 0,
      maxScore: 100,
      checks: [
        {
          category: "Structure",
          check: "SKILL.md exists",
          passed: false,
          message: "SKILL.md not found",
          weight: 20,
        },
      ],
      summary: "SKILL.md not found - cannot validate",
    };
  }

  checks.push({
    category: "Structure",
    check: "SKILL.md exists",
    passed: true,
    message: "SKILL.md found",
    weight: 5,
  });

  // Check frontmatter
  const frontmatter = parseFrontmatter(content);
  if (!frontmatter) {
    checks.push({
      category: "Frontmatter",
      check: "Valid frontmatter",
      passed: false,
      message: "Could not parse frontmatter",
      weight: 10,
    });
  } else {
    checks.push({
      category: "Frontmatter",
      check: "Valid frontmatter",
      passed: true,
      message: "Frontmatter parsed successfully",
      weight: 5,
    });

    // Check required fields
    for (const field of REQUIRED_FRONTMATTER) {
      const has = field in frontmatter;
      checks.push({
        category: "Frontmatter",
        check: `Has ${field}`,
        passed: has,
        message: has ? `${field} present` : `Missing ${field}`,
        weight: 3,
      });
    }

    // Check metadata
    const metadata = frontmatter.metadata as Record<string, string> | undefined;
    for (const field of REQUIRED_METADATA) {
      const has = metadata && field in metadata;
      checks.push({
        category: "Frontmatter",
        check: `Has metadata.${field}`,
        passed: !!has,
        message: has ? `metadata.${field} present` : `Missing metadata.${field}`,
        weight: 2,
      });
    }

    // Check new required metadata: type and mode
    for (const field of REQUIRED_METADATA_NEW) {
      const has = metadata && field in metadata;
      const value = metadata?.[field];
      let valid = false;
      let message = "";

      if (!has) {
        message = `Missing metadata.${field} (REQUIRED)`;
      } else if (field === "type") {
        valid = VALID_TYPES.includes(value);
        message = valid
          ? `type: ${value}`
          : `Invalid type: ${value}. Must be: ${VALID_TYPES.join(" | ")}`;
      } else if (field === "mode") {
        // Mode can be compound (e.g., "diagnostic+generative")
        const modes = value.split("+").map((m: string) => m.trim());
        valid = modes.every((m: string) => VALID_MODES.includes(m));
        message = valid
          ? `mode: ${value}`
          : `Invalid mode: ${value}. Must be: ${VALID_MODES.join(" | ")}`;
      }

      checks.push({
        category: "Frontmatter",
        check: `Has valid metadata.${field}`,
        passed: has && valid,
        message,
        weight: 3,
        dimension: "quality",
      });
    }
  }

  // Detect skill type for appropriate validation
  const skillType = frontmatter ? detectSkillType(frontmatter) : "diagnostic";

  checks.push({
    category: "Type",
    check: "Skill type detected",
    passed: true,
    message: `Detected as ${skillType} skill`,
    weight: 0, // Informational only
  });

  // Check required sections for this skill type
  for (const section of REQUIRED_SECTIONS[skillType]) {
    const has = checkSection(content, section);
    checks.push({
      category: "Structure",
      check: `Has ${section} section`,
      passed: has,
      message: has ? `${section} section found` : `Missing ${section} section`,
      weight: 5,
    });
  }

  // Check recommended sections for this skill type
  for (const section of RECOMMENDED_SECTIONS[skillType]) {
    const has = checkSection(content, section);
    checks.push({
      category: "Recommended",
      check: `Has ${section} section`,
      passed: has,
      message: has ? `${section} section found` : `Could add ${section} section`,
      weight: 2,
    });
  }

  // Only check states for diagnostic skills
  if (skillType === "diagnostic") {
    const stateCount = countStates(content);
    checks.push({
      category: "Diagnostic",
      check: "Has defined states",
      passed: stateCount >= 3,
      message:
        stateCount >= 3
          ? `${stateCount} states defined`
          : `Only ${stateCount} states (recommend 3-7)`,
      weight: 5,
    });

    // Check state components
    const components = hasStateComponents(content);
    checks.push({
      category: "Diagnostic",
      check: "States have symptoms",
      passed: components.hasSymptoms,
      message: components.hasSymptoms
        ? "States include symptoms"
        : "States missing symptoms",
      weight: 3,
    });
    checks.push({
      category: "Diagnostic",
      check: "States have key questions",
      passed: components.hasQuestions,
      message: components.hasQuestions
        ? "States include key questions"
        : "States missing key questions",
      weight: 3,
    });
    checks.push({
      category: "Diagnostic",
      check: "States have interventions",
      passed: components.hasInterventions,
      message: components.hasInterventions
        ? "States include interventions"
        : "States missing interventions",
      weight: 3,
      dimension: "completeness",
    });

    // Check state naming convention
    const stateNaming = checkStateNamingConvention(content);
    checks.push({
      category: "Quality",
      check: "Consistent state naming",
      passed: stateNaming.consistent,
      message: stateNaming.consistent
        ? stateNaming.prefix
          ? `Consistent prefix: ${stateNaming.prefix}`
          : "No states to check"
        : stateNaming.issues.join(", "),
      weight: 2,
      dimension: "quality",
    });
  }

  // Check anti-patterns (all skill types)
  const antiPatternCount = countAntiPatterns(content);
  const minAntiPatterns = skillType === "diagnostic" ? 3 : 2;
  checks.push({
    category: "Completeness",
    check: "Has anti-patterns",
    passed: antiPatternCount >= minAntiPatterns,
    message: antiPatternCount >= minAntiPatterns
      ? `${antiPatternCount} anti-patterns documented`
      : `Only ${antiPatternCount} anti-patterns (minimum: ${minAntiPatterns})`,
    weight: 4,
    dimension: "completeness",
  });

  // Check integration graph structure
  const integration = hasIntegrationGraph(content);
  const hasAnyIntegration = integration.hasInbound || integration.hasOutbound;
  checks.push({
    category: "Quality",
    check: "Has integration connections",
    passed: hasAnyIntegration,
    message: hasAnyIntegration
      ? `Integration: ${[
          integration.hasInbound ? "inbound" : "",
          integration.hasOutbound ? "outbound" : "",
          integration.hasComplementary ? "complementary" : "",
        ]
          .filter(Boolean)
          .join(", ")}`
      : "Missing integration connections (need inbound OR outbound)",
    weight: 2,
    dimension: "quality",
  });

  // Check usability features
  const hasOutput = hasOutputPersistence(content);
  checks.push({
    category: "Usability",
    check: "Has output persistence",
    passed: hasOutput,
    message: hasOutput
      ? "Output persistence section present"
      : "Missing output persistence section",
    weight: 2,
    dimension: "usability",
  });

  const hasQuickRef = hasQuickReference(content);
  checks.push({
    category: "Usability",
    check: "Has quick reference",
    passed: hasQuickRef,
    message: hasQuickRef
      ? "Quick reference section present"
      : "No quick reference section",
    weight: 2,
    dimension: "usability",
  });

  const hasRouting = hasDecisionTree(content);
  checks.push({
    category: "Usability",
    check: "Has decision guidance",
    passed: hasRouting,
    message: hasRouting
      ? "Decision/routing logic present"
      : "No decision tree or routing logic",
    weight: 2,
    dimension: "usability",
  });

  // Check scripts
  const scripts = await getScripts(skillPath);
  checks.push({
    category: "Tools",
    check: "Has scripts",
    passed: scripts.length > 0,
    message:
      scripts.length > 0
        ? `${scripts.length} script(s): ${scripts.join(", ")}`
        : "No scripts found",
    weight: 3,
  });

  // Check script documentation
  for (const script of scripts) {
    const documented = scriptDocumented(content, script);
    checks.push({
      category: "Tools",
      check: `${script} documented`,
      passed: documented,
      message: documented
        ? `${script} documented in SKILL.md`
        : `${script} not documented in SKILL.md`,
      weight: 2,
    });
  }

  // Check data files
  const dataFiles = await getDataFiles(skillPath);
  if (dataFiles.length > 0) {
    checks.push({
      category: "Data",
      check: "Has data files",
      passed: true,
      message: `${dataFiles.length} data file(s): ${dataFiles.join(", ")}`,
      weight: 2,
    });
  }

  // Calculate legacy score
  let score = 0;
  let maxScore = 0;
  for (const check of checks) {
    maxScore += check.weight;
    if (check.passed) {
      score += check.weight;
    }
  }

  // Calculate 20-point maturity score by dimension
  const maturityScore: MaturityScore = {
    completeness: { score: 0, max: 11 },
    quality: { score: 0, max: 5 },
    usability: { score: 0, max: 4 },
    total: 0,
  };

  // Count dimension scores based on passed checks
  for (const check of checks) {
    if (check.dimension && check.passed) {
      // Map weight to maturity points (simplified: passed = 1 point per check)
      if (check.dimension === "completeness") {
        maturityScore.completeness.score = Math.min(
          maturityScore.completeness.score + 1,
          maturityScore.completeness.max
        );
      } else if (check.dimension === "quality") {
        maturityScore.quality.score = Math.min(
          maturityScore.quality.score + 1,
          maturityScore.quality.max
        );
      } else if (check.dimension === "usability") {
        maturityScore.usability.score = Math.min(
          maturityScore.usability.score + 1,
          maturityScore.usability.max
        );
      }
    }
  }

  // Also count core sections toward completeness
  const hasCorePrinciple = checks.some(c => c.check.includes("Core Principle") && c.passed);
  const hasStates = checks.some(c => c.check.includes("defined states") && c.passed);
  const hasProcess = checks.some(c => c.check.includes("Diagnostic Process") && c.passed);
  const hasBoundaries = checks.some(c => c.check.includes("What You Do NOT Do") && c.passed);
  const hasExamples = checks.some(c => c.check.includes("Example") && c.passed);

  if (hasCorePrinciple) maturityScore.completeness.score = Math.min(maturityScore.completeness.score + 1, 11);
  if (hasStates) maturityScore.completeness.score = Math.min(maturityScore.completeness.score + 2, 11);
  if (hasProcess) maturityScore.completeness.score = Math.min(maturityScore.completeness.score + 1, 11);
  if (hasBoundaries) maturityScore.completeness.score = Math.min(maturityScore.completeness.score + 1, 11);
  if (hasExamples) maturityScore.completeness.score = Math.min(maturityScore.completeness.score + 2, 11);

  // Quality: self-contained (assumed if SKILL.md exists), type+mode, state naming, integration, tools documented
  const hasTypeMode = checks.filter(c => c.check.includes("metadata.type") || c.check.includes("metadata.mode")).every(c => c.passed);
  const hasToolsDocs = checks.filter(c => c.check.includes("documented")).every(c => c.passed);

  maturityScore.quality.score = Math.min(maturityScore.quality.score + 1, 5); // Self-contained baseline
  if (hasTypeMode) maturityScore.quality.score = Math.min(maturityScore.quality.score + 1, 5);
  if (hasToolsDocs) maturityScore.quality.score = Math.min(maturityScore.quality.score + 1, 5);

  maturityScore.total =
    maturityScore.completeness.score +
    maturityScore.quality.score +
    maturityScore.usability.score;

  const maturityLevel = calculateMaturityLevel(maturityScore.total);

  const percentage = Math.round((score / maxScore) * 100);
  const valid = percentage >= 70;

  let summary: string;
  if (maturityScore.total >= 18) {
    summary = "Battle-Tested - production proven";
  } else if (maturityScore.total >= 13) {
    summary = "Stable - production ready";
  } else if (maturityScore.total >= 8) {
    summary = "Developing - functional but incomplete";
  } else {
    summary = "Draft - needs significant work";
  }

  return {
    skillPath,
    skillName,
    valid,
    score,
    maxScore,
    maturityScore,
    maturityLevel,
    checks,
    summary: `${maturityScore.total}/20 ${maturityLevel} - ${summary}`,
  };
}

function formatResult(result: ValidationResult): string {
  const lines: string[] = [];

  const statusIcon = result.valid ? "✓" : "⚠";
  lines.push(`# Skill Validation: ${result.skillName}\n`);
  lines.push(`${statusIcon} **${result.summary}**\n`);

  // Maturity score breakdown
  lines.push(`## Maturity Score: ${result.maturityScore.total}/20 (${result.maturityLevel})\n`);
  lines.push(`| Dimension | Score |`);
  lines.push(`|-----------|-------|`);
  lines.push(`| Completeness | ${result.maturityScore.completeness.score}/${result.maturityScore.completeness.max} |`);
  lines.push(`| Quality | ${result.maturityScore.quality.score}/${result.maturityScore.quality.max} |`);
  lines.push(`| Usability | ${result.maturityScore.usability.score}/${result.maturityScore.usability.max} |`);
  lines.push("");

  // Group by category
  const categories = new Map<string, CheckResult[]>();
  for (const check of result.checks) {
    if (!categories.has(check.category)) {
      categories.set(check.category, []);
    }
    categories.get(check.category)!.push(check);
  }

  for (const [category, checks] of categories) {
    const passed = checks.filter((c) => c.passed).length;
    const total = checks.length;
    lines.push(`## ${category} (${passed}/${total})\n`);

    for (const check of checks) {
      const icon = check.passed ? "✓" : "✗";
      lines.push(`${icon} ${check.check}: ${check.message}`);
    }
    lines.push("");
  }

  // Failed checks summary
  const failed = result.checks.filter((c) => !c.passed);
  if (failed.length > 0) {
    lines.push("## To Fix\n");
    for (const check of failed) {
      if (check.weight >= 3) {
        lines.push(`- [ ] ${check.check}`);
      }
    }
  }

  return lines.join("\n");
}

async function getAllSkills(basePath: string): Promise<string[]> {
  const skills: string[] = [];

  try {
    for await (const entry of Deno.readDir(basePath)) {
      if (entry.isDirectory && !entry.name.startsWith(".")) {
        const skillMdPath = `${basePath}/${entry.name}/SKILL.md`;
        if (await fileExists(skillMdPath)) {
          skills.push(`${basePath}/${entry.name}`);
        }
      }
    }
  } catch {
    // Directory doesn't exist
  }

  return skills;
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Skill Validator

Validates skill completeness and pattern conformance.

Usage:
  deno run --allow-read validate-skill.ts <skill-path>
  deno run --allow-read validate-skill.ts --all
  deno run --allow-read validate-skill.ts <skill-path> --json

Options:
  --all       Validate all skills in a directory
  --dir D     Directory to scan for skills (default: ../fiction or ..)
  --json      Output as JSON

Examples:
  deno run --allow-read validate-skill.ts /path/to/skill
  deno run --allow-read validate-skill.ts --all --dir ../fiction
  deno run --allow-read validate-skill.ts skill-name --json
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");
  const validateAll = args.includes("--all");

  // Parse --dir option
  const dirIndex = args.indexOf("--dir");
  const scriptDir = new URL(".", import.meta.url).pathname;
  const skillsDir = `${scriptDir}../..`; // skills/ directory

  let targetDir: string;
  if (dirIndex !== -1 && args[dirIndex + 1]) {
    const dirArg = args[dirIndex + 1];
    targetDir = dirArg.startsWith("/") ? dirArg : `${scriptDir}${dirArg}`;
  } else {
    // Default: look in parent skills/ directory
    targetDir = skillsDir;
  }

  let skillPaths: string[] = [];

  if (validateAll) {
    // Find all skills in target directory (recursively check subdirs)
    skillPaths = await getAllSkills(targetDir);

    // Also check subdirectories (like fiction/, research/, etc.)
    try {
      for await (const entry of Deno.readDir(targetDir)) {
        if (entry.isDirectory && !entry.name.startsWith(".") && entry.name !== "skill-builder") {
          const subSkills = await getAllSkills(`${targetDir}/${entry.name}`);
          skillPaths.push(...subSkills);
        }
      }
    } catch {
      // Directory doesn't exist or not readable
    }
  } else {
    // Find skill path argument (skip flags and their values)
    const skipIndices = new Set<number>();
    if (dirIndex !== -1) {
      skipIndices.add(dirIndex);
      skipIndices.add(dirIndex + 1);
    }

    let skillPath: string | null = null;
    for (let i = 0; i < args.length; i++) {
      if (!args[i].startsWith("--") && !skipIndices.has(i)) {
        skillPath = args[i];
        break;
      }
    }

    if (!skillPath) {
      console.error("Error: No skill path specified");
      console.error("Usage: validate-skill.ts <skill-path> or --all");
      Deno.exit(1);
    }

    // Resolve path - try multiple strategies
    if (skillPath.startsWith("/")) {
      // Absolute path
      skillPaths = [skillPath];
    } else if (skillPath.startsWith("..") || skillPath.startsWith("./")) {
      // Relative to script location
      skillPaths = [`${scriptDir}${skillPath}`];
    } else {
      // Try to find skill by name in skills directory tree
      // First check direct child
      let found = false;
      if (await fileExists(`${skillsDir}/${skillPath}/SKILL.md`)) {
        skillPaths = [`${skillsDir}/${skillPath}`];
        found = true;
      } else {
        // Check in subdirectories (fiction/skillname, research/skillname, etc.)
        try {
          for await (const entry of Deno.readDir(skillsDir)) {
            if (entry.isDirectory && !entry.name.startsWith(".")) {
              if (await fileExists(`${skillsDir}/${entry.name}/${skillPath}/SKILL.md`)) {
                skillPaths = [`${skillsDir}/${entry.name}/${skillPath}`];
                found = true;
                break;
              }
            }
          }
        } catch {
          // Directory not readable
        }
      }

      if (!found) {
        console.error(`Error: Could not find skill '${skillPath}'`);
        Deno.exit(1);
      }
    }
  }

  const results: ValidationResult[] = [];
  for (const path of skillPaths) {
    results.push(await validateSkill(path));
  }

  if (jsonOutput) {
    console.log(JSON.stringify(results.length === 1 ? results[0] : results, null, 2));
  } else {
    for (const result of results) {
      console.log(formatResult(result));
      if (results.length > 1) {
        console.log("\n---\n");
      }
    }

    // Summary if multiple
    if (results.length > 1) {
      const valid = results.filter((r) => r.valid).length;
      console.log(`\n## Summary: ${valid}/${results.length} skills valid`);
    }
  }
}

main();
