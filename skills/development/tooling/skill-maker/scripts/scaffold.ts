#!/usr/bin/env -S deno run --allow-write --allow-read

/**
 * Skill Scaffold CLI - Create new agentskills.io-compliant skill structure
 *
 * Creates a new skill directory with SKILL.md template and optional subdirectories.
 *
 * Usage:
 *   deno run --allow-write --allow-read scripts/scaffold.ts --name "my-skill" --description "..." --path "./skills/domain/"
 *   # Or if executable: ./scripts/scaffold.ts --name "my-skill" --description "..." --path "./skills/domain/"
 *
 * Options:
 *   --name         Required. Skill name (lowercase, hyphens, 1-64 chars)
 *   --description  Required. Initial skill description
 *   --path         Required. Parent directory for the skill
 *   --with-scripts    Create scripts/ directory
 *   --with-references Create references/ directory
 *   --with-assets     Create assets/ directory
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "scaffold";

// === Types ===
interface ScaffoldOptions {
  name: string;
  description: string;
  path: string;
  withScripts: boolean;
  withReferences: boolean;
  withAssets: boolean;
}

// === Validation ===
function validateName(name: string): string[] {
  const errors: string[] = [];

  if (!name) {
    errors.push("Name is required");
    return errors;
  }

  if (name.length > 64) {
    errors.push(`Name exceeds 64 characters (${name.length})`);
  }

  if (name !== name.toLowerCase()) {
    errors.push("Name must be lowercase");
  }

  if (!/^[a-z0-9-]+$/.test(name)) {
    errors.push("Name may only contain lowercase letters, numbers, and hyphens");
  }

  if (name.startsWith("-") || name.endsWith("-")) {
    errors.push("Name cannot start or end with a hyphen");
  }

  if (name.includes("--")) {
    errors.push("Name cannot contain consecutive hyphens");
  }

  return errors;
}

function validateDescription(description: string): string[] {
  const errors: string[] = [];

  if (!description) {
    errors.push("Description is required");
    return errors;
  }

  if (description.length > 1024) {
    errors.push(`Description exceeds 1024 characters (${description.length})`);
  }

  return errors;
}

// === Template Generation ===
function generateSkillMd(name: string, description: string): string {
  return `---
name: ${name}
description: ${description}
license: MIT
metadata:
  author: ""
  version: "1.0"
---

# ${name.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}

[Brief description of what this skill does and why it exists]

## When to Use This Skill

Use this skill when:
- [Specific scenario 1]
- [Specific scenario 2]
- [User mentions keywords like: keyword1, keyword2]

Do NOT use this skill when:
- [Out of scope scenario 1]
- [Out of scope scenario 2]

## Prerequisites

Before using this skill:
- [Prerequisite 1]
- [Prerequisite 2]

## Instructions

### Step 1: [First Step]

[Clear, actionable instructions]

**Example**:
\`\`\`
[Code or command example]
\`\`\`

### Step 2: [Second Step]

[Clear, actionable instructions]

### Step 3: [Third Step]

[Clear, actionable instructions]

## Examples

### Example 1: [Common Use Case]

**Scenario**: [Describe the scenario]

**Input**:
\`\`\`
[What the user provides]
\`\`\`

**Output**:
\`\`\`
[Expected result]
\`\`\`

## Common Issues

### Issue: [Common problem]

**Symptoms**: [How to identify]

**Solution**:
1. [Step to resolve]
2. [Step to resolve]

## Additional Resources

[Pointers to reference files, if any]

---

<!-- Validation Checklist:
- [ ] Frontmatter has name and description
- [ ] Name matches folder name
- [ ] Description includes what + when + keywords
- [ ] Instructions are actionable
- [ ] At least one example with input/output
- [ ] File is under 500 lines
-->
`;
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Create agentskills.io skill structure

Usage:
  deno run --allow-write --allow-read scripts/scaffold.ts [options]

Required Options:
  --name <name>         Skill name (lowercase, hyphens, 1-64 chars)
  --description <desc>  Initial skill description (max 1024 chars)
  --path <dir>          Parent directory for the skill

Optional Flags:
  --with-scripts        Create scripts/ directory
  --with-references     Create references/ directory
  --with-assets         Create assets/ directory
  -h, --help            Show this help

Examples:
  # Minimal skill
  ./scripts/scaffold.ts --name "my-skill" --description "Does X when Y" --path "./skills/domain/"

  # Skill with all directories
  ./scripts/scaffold.ts --name "pdf-processor" \\
    --description "Process PDF files. Use when extracting text or merging PDFs." \\
    --path "./skills/data/" \\
    --with-scripts --with-references --with-assets

Output Structure:
  my-skill/
  ├── SKILL.md           # Starter template
  ├── scripts/           # If --with-scripts
  ├── references/        # If --with-references
  └── assets/            # If --with-assets

Name Rules:
  - 1-64 characters
  - Lowercase letters, numbers, hyphens only
  - Cannot start/end with hyphen
  - Cannot have consecutive hyphens (--)
  - Must match the directory name
`);
}

// === Main Logic ===
async function scaffold(options: ScaffoldOptions): Promise<void> {
  // Validate inputs
  const nameErrors = validateName(options.name);
  if (nameErrors.length > 0) {
    console.error("Invalid skill name:");
    nameErrors.forEach(e => console.error(`  - ${e}`));
    Deno.exit(1);
  }

  const descErrors = validateDescription(options.description);
  if (descErrors.length > 0) {
    console.error("Invalid description:");
    descErrors.forEach(e => console.error(`  - ${e}`));
    Deno.exit(1);
  }

  // Construct skill path
  const skillPath = `${options.path.replace(/\/$/, "")}/${options.name}`;

  // Check if directory already exists
  try {
    const stat = await Deno.stat(skillPath);
    if (stat.isDirectory) {
      console.error(`Error: Directory already exists: ${skillPath}`);
      Deno.exit(1);
    }
  } catch {
    // Directory doesn't exist, which is what we want
  }

  // Create directories
  console.log(`Creating skill: ${options.name}`);
  console.log(`Location: ${skillPath}`);
  console.log();

  await Deno.mkdir(skillPath, { recursive: true });
  console.log(`  Created ${skillPath}/`);

  if (options.withScripts) {
    await Deno.mkdir(`${skillPath}/scripts`, { recursive: true });
    console.log(`  Created ${skillPath}/scripts/`);
  }

  if (options.withReferences) {
    await Deno.mkdir(`${skillPath}/references`, { recursive: true });
    console.log(`  Created ${skillPath}/references/`);
  }

  if (options.withAssets) {
    await Deno.mkdir(`${skillPath}/assets`, { recursive: true });
    console.log(`  Created ${skillPath}/assets/`);
  }

  // Create SKILL.md
  const skillMdContent = generateSkillMd(options.name, options.description);
  await Deno.writeTextFile(`${skillPath}/SKILL.md`, skillMdContent);
  console.log(`  Created ${skillPath}/SKILL.md`);

  console.log();
  console.log("Done! Next steps:");
  console.log(`  1. Edit ${skillPath}/SKILL.md to add instructions`);
  console.log(`  2. Add any scripts, references, or assets`);
  console.log(`  3. Validate: deno run --allow-read --allow-run scripts/validate-skill.ts ${skillPath}`);
}

// === CLI Handler ===
function main(args: string[]): void {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  const options: ScaffoldOptions = {
    name: "",
    description: "",
    path: "",
    withScripts: false,
    withReferences: false,
    withAssets: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    if (arg === "--name" && args[i + 1]) {
      options.name = args[++i];
    } else if (arg === "--description" && args[i + 1]) {
      options.description = args[++i];
    } else if (arg === "--path" && args[i + 1]) {
      options.path = args[++i];
    } else if (arg === "--with-scripts") {
      options.withScripts = true;
    } else if (arg === "--with-references") {
      options.withReferences = true;
    } else if (arg === "--with-assets") {
      options.withAssets = true;
    }
  }

  // Validate required options
  if (!options.name) {
    console.error("Error: --name is required");
    Deno.exit(1);
  }
  if (!options.description) {
    console.error("Error: --description is required");
    Deno.exit(1);
  }
  if (!options.path) {
    console.error("Error: --path is required");
    Deno.exit(1);
  }

  scaffold(options);
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
