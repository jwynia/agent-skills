#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Skill Scaffolder
 *
 * Generates skill directory structure and template files.
 * Creates SKILL.md, scripts/, and data/ directories with templates.
 *
 * Usage:
 *   deno run --allow-read --allow-write scaffold.ts skill-name
 *   deno run --allow-read --allow-write scaffold.ts skill-name --type diagnostic
 *   deno run --allow-read --allow-write scaffold.ts skill-name --dry-run
 */

interface ScaffoldConfig {
  skillName: string;
  skillType: "diagnostic" | "generator" | "utility";
  statePrefix: string;
  stateCount: number;
  includeScript: boolean;
  includeData: boolean;
  domain: string;
  cluster: string | null;
  outputDir: string;
}

const SKILL_TYPES = ["diagnostic", "generator", "utility"];

function toTitleCase(str: string): string {
  return str
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function toPrefix(str: string): string {
  // First letter of each word, uppercase
  const words = str.split("-");
  if (words.length === 1) {
    return str.charAt(0).toUpperCase();
  }
  return words.map((w) => w.charAt(0).toUpperCase()).join("");
}

function generateSkillMd(config: ScaffoldConfig): string {
  const title = toTitleCase(config.skillName);
  const prefix = config.statePrefix;

  let content = `---
name: ${config.skillName}
description: [TODO: One sentence starting with action verb - "Diagnose...", "Generate...", "Transform..."]
license: MIT
metadata:
  author: [TODO: your-name]
  version: "1.0"
  domain: ${config.domain}
`;

  if (config.cluster) {
    content += `  cluster: ${config.cluster}\n`;
  }

  if (config.skillType === "utility") {
    content += `  type: utility\n`;
  }

  content += `---

# ${title}: [Subtitle]

You [TODO: role description]. Your role is to [TODO: specific function].

## Core Principle

**[TODO: Bold statement capturing the diagnostic/functional essence]**

## The States

`;

  // Generate state templates
  for (let i = 1; i <= config.stateCount; i++) {
    content += `### State ${prefix}${i}: [State Name]
**Symptoms:** [What the user notices]
**Key Questions:** [What to ask to diagnose]
**Interventions:** [What framework/tool to apply]

`;
  }

  content += `## Diagnostic Process

When a writer presents a ${config.skillName.replace("-", " ")} problem:

1. **Listen for symptoms** - What specifically feels wrong?
2. **Identify the state** - Match symptoms to states above
3. **Ask key questions** - Gather information needed for diagnosis
4. **Recommend intervention** - Point to specific framework/tool
5. **Suggest first step** - What's the minimal viable fix?

## Key Questions

### For [Category A]
- [Question 1]?
- [Question 2]?
- [Question 3]?

### For [Category B]
- [Question 4]?
- [Question 5]?
- [Question 6]?

## Anti-Patterns

### The [Anti-Pattern Name]
**Problem:** [What goes wrong]
**Fix:** [How to fix it]

### The [Another Anti-Pattern]
**Problem:** [What goes wrong]
**Fix:** [How to fix it]

`;

  if (config.includeScript) {
    content += `## Available Tools

### ${config.skillName.replace(/-/g, "_")}.ts
[TODO: Description of what this script does]

\`\`\`bash
deno run --allow-read scripts/${config.skillName.replace(/-/g, "_")}.ts
deno run --allow-read scripts/${config.skillName.replace(/-/g, "_")}.ts --option value
\`\`\`

**Output:** [What the script produces]

`;
  }

  content += `## Example Interaction

**Writer:** "[Example problem statement]"

**Your approach:**
1. Identify State ${prefix}[N] ([State Name])
2. Ask: "[Clarifying question]"
3. [Action you take]
4. Suggest: "[Specific recommendation]"

## What You Do NOT Do

- You do not [boundary 1]
- You do not [boundary 2]
- You diagnose, recommend, and explain—the writer decides

## Integration with story-sense

| story-sense State | May Lead to ${title} |
|-------------------|${"-".repeat(title.length + 14)}|
| State [N] | ${prefix}[N] when [condition] |

## Integration with [Other Skill]

[TODO: How this skill connects to other skills in the cluster]
`;

  return content;
}

function generateScriptTemplate(skillName: string): string {
  const scriptName = skillName.replace(/-/g, "_");
  const resultType = toTitleCase(skillName).replace(/ /g, "") + "Result";

  return `#!/usr/bin/env -S deno run --allow-read

/**
 * ${toTitleCase(skillName)} Generator
 *
 * [TODO: Description of what this script does]
 *
 * Usage:
 *   deno run --allow-read ${scriptName}.ts
 *   deno run --allow-read ${scriptName}.ts --option value
 *   deno run --allow-read ${scriptName}.ts "input" --json
 */

// === INTERFACES ===

interface ${resultType} {
  name: string;
  // TODO: Add result fields
}

// === DATA ===

const DATA: Record<string, string[]> = {
  category_one: [
    "Item with specific detail",
    "Another concrete item",
    // TODO: Add more items (target 30+ for functional, 75+ for production)
  ],
};

// === UTILITIES ===

function randomFrom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

// === CORE LOGIC ===

function generate(
  input: string | null,
  option: string | null
): ${resultType} {
  // TODO: Implement generation logic

  return {
    name: input || "Default",
  };
}

// === FORMATTING ===

function formatResult(result: ${resultType}): string {
  const lines: string[] = [];

  lines.push(\`# ${toTitleCase(skillName)}: \${result.name}\\n\`);
  lines.push("## Section\\n");
  lines.push("[TODO: Format output]");
  lines.push("");

  return lines.join("\\n");
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(\`${toTitleCase(skillName)} Generator

[TODO: Description]

Usage:
  deno run --allow-read ${scriptName}.ts [options] [input]

Options:
  --option S    [Description]
  --json        Output as JSON

Examples:
  deno run --allow-read ${scriptName}.ts
  deno run --allow-read ${scriptName}.ts "Custom Input"
\`);
    Deno.exit(0);
  }

  // Parse arguments
  const optionIndex = args.indexOf("--option");
  const jsonOutput = args.includes("--json");

  const option = optionIndex !== -1 && args[optionIndex + 1]
    ? args[optionIndex + 1]
    : null;

  // Find positional argument
  const skipIndices = new Set<number>();
  if (optionIndex !== -1) {
    skipIndices.add(optionIndex);
    skipIndices.add(optionIndex + 1);
  }

  let positionalArg: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      positionalArg = args[i];
      break;
    }
  }

  // Generate
  const result = generate(positionalArg, option);

  // Output
  if (jsonOutput) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatResult(result));
  }
}

main();
`;
}

function generateDataTemplate(skillName: string): string {
  return JSON.stringify(
    {
      _meta: {
        description: `Data for ${toTitleCase(skillName)} skill`,
        usage: "Load with Deno.readTextFile and JSON.parse",
      },
      category_one: [
        "Specific item with enough detail to spark ideas",
        "Another item that is 20-60 characters ideally",
        "Items should be concrete not vague",
      ],
      category_two: [
        "Different category of items",
        "Organized by type for easier selection",
      ],
    },
    null,
    2
  );
}

async function createDirectory(path: string, dryRun: boolean): Promise<void> {
  if (dryRun) {
    console.log(`  [dry-run] Would create directory: ${path}`);
    return;
  }

  try {
    await Deno.mkdir(path, { recursive: true });
    console.log(`  Created directory: ${path}`);
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) {
      throw e;
    }
  }
}

async function writeFile(
  path: string,
  content: string,
  dryRun: boolean
): Promise<void> {
  if (dryRun) {
    console.log(`  [dry-run] Would create file: ${path}`);
    console.log(`  [dry-run] Content preview: ${content.slice(0, 100)}...`);
    return;
  }

  // Check if file exists
  try {
    await Deno.stat(path);
    console.log(`  Skipped (exists): ${path}`);
    return;
  } catch {
    // File doesn't exist, create it
  }

  await Deno.writeTextFile(path, content);
  console.log(`  Created file: ${path}`);
}

async function scaffold(config: ScaffoldConfig, dryRun: boolean): Promise<void> {
  const skillDir = `${config.outputDir}/${config.skillName}`;

  console.log(`\nScaffolding skill: ${config.skillName}`);
  console.log(`Type: ${config.skillType}`);
  console.log(`Domain: ${config.domain}`);
  if (config.cluster) {
    console.log(`Cluster: ${config.cluster}`);
  }
  console.log(`Location: ${skillDir}\n`);

  // Create directories
  await createDirectory(skillDir, dryRun);
  await createDirectory(`${skillDir}/scripts`, dryRun);

  if (config.includeData) {
    await createDirectory(`${skillDir}/data`, dryRun);
  }

  // Create SKILL.md
  const skillMd = generateSkillMd(config);
  await writeFile(`${skillDir}/SKILL.md`, skillMd, dryRun);

  // Create script template
  if (config.includeScript) {
    const scriptName = config.skillName.replace(/-/g, "_");
    const script = generateScriptTemplate(config.skillName);
    await writeFile(`${skillDir}/scripts/${scriptName}.ts`, script, dryRun);
  }

  // Create data template
  if (config.includeData) {
    const data = generateDataTemplate(config.skillName);
    await writeFile(`${skillDir}/data/${config.skillName.replace(/-/g, "-")}-data.json`, data, dryRun);
  }

  console.log("\nScaffolding complete!");
  console.log("\nNext steps:");
  console.log("1. Edit SKILL.md - fill in [TODO] sections");
  console.log("2. Define your states with symptoms/questions/interventions");
  console.log("3. Implement script logic if applicable");
  console.log("4. Run validate-skill.ts to check completeness");
}

function main(): void {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Skill Scaffolder

Generates skill directory structure and template files.

Usage:
  deno run --allow-read --allow-write scaffold.ts <skill-name> [options]

Options:
  --type T      Skill type: diagnostic, generator, utility
                Default: diagnostic

  --domain D    Domain for the skill (fiction, research, agile-software, etc.)
                Default: custom

  --cluster C   Parent skill if part of a cluster (optional)

  --out O       Output directory for the skill
                Default: current directory

  --states N    Number of state templates to generate
                Default: 5

  --no-script   Don't create script template
  --no-data     Don't create data directory/template

  --dry-run     Preview without creating files

Examples:
  deno run --allow-read --allow-write scaffold.ts dialogue --domain fiction --cluster story-sense
  deno run --allow-read --allow-write scaffold.ts sprint-health --domain agile-software
  deno run --allow-read --allow-write scaffold.ts my-skill --dry-run
`);
    Deno.exit(0);
  }

  // Parse arguments
  const typeIndex = args.indexOf("--type");
  const statesIndex = args.indexOf("--states");
  const domainIndex = args.indexOf("--domain");
  const clusterIndex = args.indexOf("--cluster");
  const outIndex = args.indexOf("--out");
  const dryRun = args.includes("--dry-run");
  const noScript = args.includes("--no-script");
  const noData = args.includes("--no-data");

  const skillType = typeIndex !== -1 && args[typeIndex + 1]
    ? args[typeIndex + 1] as "diagnostic" | "generator" | "utility"
    : "diagnostic";

  const stateCount = statesIndex !== -1 && args[statesIndex + 1]
    ? parseInt(args[statesIndex + 1]) || 5
    : 5;

  const domain = domainIndex !== -1 && args[domainIndex + 1]
    ? args[domainIndex + 1]
    : "custom";

  const cluster = clusterIndex !== -1 && args[clusterIndex + 1]
    ? args[clusterIndex + 1]
    : null;

  const scriptDir = new URL(".", import.meta.url).pathname;
  const defaultOutDir = Deno.cwd();
  const outputDir = outIndex !== -1 && args[outIndex + 1]
    ? (args[outIndex + 1].startsWith("/") ? args[outIndex + 1] : `${scriptDir}${args[outIndex + 1]}`)
    : defaultOutDir;

  if (!SKILL_TYPES.includes(skillType)) {
    console.error(`Error: Invalid skill type '${skillType}'`);
    console.error(`Valid types: ${SKILL_TYPES.join(", ")}`);
    Deno.exit(1);
  }

  // Find skill name (first positional argument)
  const skipIndices = new Set<number>();
  if (typeIndex !== -1) {
    skipIndices.add(typeIndex);
    skipIndices.add(typeIndex + 1);
  }
  if (statesIndex !== -1) {
    skipIndices.add(statesIndex);
    skipIndices.add(statesIndex + 1);
  }
  if (domainIndex !== -1) {
    skipIndices.add(domainIndex);
    skipIndices.add(domainIndex + 1);
  }
  if (clusterIndex !== -1) {
    skipIndices.add(clusterIndex);
    skipIndices.add(clusterIndex + 1);
  }
  if (outIndex !== -1) {
    skipIndices.add(outIndex);
    skipIndices.add(outIndex + 1);
  }

  let skillName: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      skillName = args[i];
      break;
    }
  }

  if (!skillName) {
    console.error("Error: No skill name specified");
    console.error("Usage: scaffold.ts <skill-name>");
    Deno.exit(1);
  }

  // Validate skill name
  if (!/^[a-z][a-z0-9-]*$/.test(skillName)) {
    console.error("Error: Skill name must be lowercase with hyphens only");
    console.error("Example: my-skill-name");
    Deno.exit(1);
  }

  const config: ScaffoldConfig = {
    skillName,
    skillType,
    statePrefix: toPrefix(skillName),
    stateCount,
    includeScript: !noScript,
    includeData: !noData && skillType !== "utility",
    domain,
    cluster,
    outputDir,
  };

  scaffold(config, dryRun);
}

main();
