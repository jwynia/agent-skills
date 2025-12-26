#!/usr/bin/env -S deno run --allow-read --allow-run

/**
 * Skill Validator CLI - Validate agentskills.io-compliant skills
 *
 * Validates a skill directory against the agentskills.io specification,
 * with additional checks beyond the basic spec.
 *
 * Usage:
 *   deno run --allow-read --allow-run scripts/validate-skill.ts ./path/to/skill
 *   # Or if executable: ./scripts/validate-skill.ts ./path/to/skill
 *
 * Performs:
 *   - skills-ref validation (if available)
 *   - Line count check (warns if >500)
 *   - Word count estimate
 *   - Referenced files existence
 *   - Second-person language detection
 *   - Trigger phrase detection in description
 */

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "validate-skill";
const MAX_LINES = 500;
const MAX_DESCRIPTION_LENGTH = 1024;
const MAX_NAME_LENGTH = 64;

// === Types ===
interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

interface Frontmatter {
  name?: string;
  description?: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  "allowed-tools"?: string;
}

// === YAML Parser (simple frontmatter extraction) ===
function parseFrontmatter(content: string): { frontmatter: Frontmatter; body: string } | null {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return null;

  const [, yamlContent, body] = match;
  const frontmatter: Frontmatter = {};

  // Simple YAML parsing for our needs
  const lines = yamlContent.split("\n");
  let currentKey = "";
  let inMetadata = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    if (line.startsWith("  ") && inMetadata) {
      // Metadata sub-key
      const subMatch = trimmed.match(/^(\w+):\s*["']?(.*)["']?$/);
      if (subMatch) {
        frontmatter.metadata = frontmatter.metadata || {};
        frontmatter.metadata[subMatch[1]] = subMatch[2].replace(/["']$/, "");
      }
    } else {
      inMetadata = false;
      const keyMatch = line.match(/^(\S+):\s*(.*)$/);
      if (keyMatch) {
        currentKey = keyMatch[1];
        const value = keyMatch[2].trim().replace(/^["']|["']$/g, "");

        if (currentKey === "metadata") {
          inMetadata = true;
          frontmatter.metadata = {};
        } else if (currentKey === "name") {
          frontmatter.name = value;
        } else if (currentKey === "description") {
          frontmatter.description = value;
        } else if (currentKey === "license") {
          frontmatter.license = value;
        } else if (currentKey === "compatibility") {
          frontmatter.compatibility = value;
        } else if (currentKey === "allowed-tools") {
          frontmatter["allowed-tools"] = value;
        }
      }
    }
  }

  return { frontmatter, body };
}

// === Validation Functions ===
function validateName(name: string | undefined, dirName: string): string[] {
  const errors: string[] = [];

  if (!name) {
    errors.push("Missing required field: name");
    return errors;
  }

  if (name.length > MAX_NAME_LENGTH) {
    errors.push(`Name exceeds ${MAX_NAME_LENGTH} characters (${name.length})`);
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

  if (name !== dirName) {
    errors.push(`Name "${name}" does not match directory name "${dirName}"`);
  }

  return errors;
}

function validateDescription(description: string | undefined): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!description) {
    errors.push("Missing required field: description");
    return { errors, warnings };
  }

  if (description.length > MAX_DESCRIPTION_LENGTH) {
    errors.push(`Description exceeds ${MAX_DESCRIPTION_LENGTH} characters (${description.length})`);
  }

  // Check for trigger phrases
  const hasTriggerPhrases =
    description.includes('"') ||
    description.includes("'") ||
    description.toLowerCase().includes("when") ||
    description.toLowerCase().includes("use this");

  if (!hasTriggerPhrases) {
    warnings.push("Description may lack trigger phrases. Consider adding specific scenarios.");
  }

  // Check for keywords
  if (description.length < 100) {
    warnings.push("Description is short. Consider adding more detail about when to use this skill.");
  }

  return { errors, warnings };
}

function checkSecondPerson(body: string): string[] {
  const warnings: string[] = [];
  const secondPersonPatterns = [
    /\byou should\b/gi,
    /\byou need to\b/gi,
    /\byou must\b/gi,
    /\byou can\b/gi,
    /\byou will\b/gi,
    /\byour\b/gi,
  ];

  for (const pattern of secondPersonPatterns) {
    const matches = body.match(pattern);
    if (matches && matches.length > 2) {
      warnings.push(`Found frequent second-person language ("${matches[0]}"). Consider using imperative form.`);
      break;
    }
  }

  return warnings;
}

function checkFileReferences(body: string, skillPath: string): string[] {
  const warnings: string[] = [];

  // Find markdown links and file paths
  const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
  const pathPattern = /(?:scripts|references|assets)\/[\w.-]+/g;

  const references = new Set<string>();

  let match;
  while ((match = linkPattern.exec(body)) !== null) {
    const path = match[2];
    if (!path.startsWith("http") && !path.startsWith("#")) {
      references.add(path);
    }
  }

  while ((match = pathPattern.exec(body)) !== null) {
    references.add(match[0]);
  }

  for (const ref of references) {
    try {
      Deno.statSync(`${skillPath}/${ref}`);
    } catch {
      warnings.push(`Referenced file not found: ${ref}`);
    }
  }

  return warnings;
}

// === Main Validation ===
async function validate(skillPath: string): Promise<ValidationResult> {
  const result: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    info: [],
  };

  // Get directory name
  const dirName = skillPath.split("/").filter(Boolean).pop() || "";

  // Check SKILL.md exists
  let skillMdPath = `${skillPath}/SKILL.md`;
  try {
    await Deno.stat(skillMdPath);
  } catch {
    // Try lowercase
    skillMdPath = `${skillPath}/skill.md`;
    try {
      await Deno.stat(skillMdPath);
      result.info.push("Found skill.md (lowercase). SKILL.md (uppercase) is preferred.");
    } catch {
      result.errors.push("SKILL.md file not found");
      result.valid = false;
      return result;
    }
  }

  // Read and parse SKILL.md
  const content = await Deno.readTextFile(skillMdPath);
  const parsed = parseFrontmatter(content);

  if (!parsed) {
    result.errors.push("Invalid SKILL.md format: missing or malformed frontmatter");
    result.valid = false;
    return result;
  }

  const { frontmatter, body } = parsed;

  // Validate name
  const nameErrors = validateName(frontmatter.name, dirName);
  result.errors.push(...nameErrors);

  // Validate description
  const { errors: descErrors, warnings: descWarnings } = validateDescription(frontmatter.description);
  result.errors.push(...descErrors);
  result.warnings.push(...descWarnings);

  // Check line count
  const lines = content.split("\n").length;
  if (lines > MAX_LINES) {
    result.warnings.push(`SKILL.md has ${lines} lines (>${MAX_LINES}). Consider moving content to references/.`);
  }
  result.info.push(`Line count: ${lines}`);

  // Estimate word count
  const words = body.split(/\s+/).filter(Boolean).length;
  result.info.push(`Word count (body): ~${words}`);
  if (words > 5000) {
    result.warnings.push(`Body has ~${words} words. Consider keeping under 5000 tokens.`);
  }

  // Check second-person language
  const secondPersonWarnings = checkSecondPerson(body);
  result.warnings.push(...secondPersonWarnings);

  // Check file references
  const refWarnings = checkFileReferences(body, skillPath);
  result.warnings.push(...refWarnings);

  // Try skills-ref validation
  try {
    const command = new Deno.Command("skills-ref", {
      args: ["validate", skillPath],
      stdout: "piped",
      stderr: "piped",
    });
    const { code, stdout, stderr } = await command.output();

    if (code === 0) {
      result.info.push("skills-ref validation: PASSED");
    } else {
      const errorOutput = new TextDecoder().decode(stderr) || new TextDecoder().decode(stdout);
      result.errors.push(`skills-ref validation failed: ${errorOutput.trim()}`);
    }
  } catch {
    result.info.push("skills-ref not available. Install from: https://github.com/agentskills/agentskills");
  }

  // Set final validity
  result.valid = result.errors.length === 0;

  return result;
}

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Validate agentskills.io skills

Usage:
  deno run --allow-read --allow-run scripts/validate-skill.ts <skill-path>

Arguments:
  <skill-path>    Path to skill directory containing SKILL.md

Checks Performed:
  - SKILL.md file exists
  - Frontmatter is valid (name, description)
  - Name matches directory name
  - Name format (lowercase, hyphens, 1-64 chars)
  - Description length (max 1024 chars)
  - Line count (warns if >500)
  - Second-person language patterns
  - Referenced files exist
  - skills-ref validation (if available)

Examples:
  ./scripts/validate-skill.ts ./skills/domain/my-skill
  deno run --allow-read --allow-run scripts/validate-skill.ts ./my-skill

Exit Codes:
  0 - Valid
  1 - Invalid (errors found)
`);
}

// === CLI Handler ===
async function main(args: string[]): Promise<void> {
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  const skillPath = args[0].replace(/\/$/, "");

  console.log(`Validating: ${skillPath}\n`);

  const result = await validate(skillPath);

  // Print info
  if (result.info.length > 0) {
    console.log("Info:");
    result.info.forEach(i => console.log(`  ${i}`));
    console.log();
  }

  // Print warnings
  if (result.warnings.length > 0) {
    console.log("Warnings:");
    result.warnings.forEach(w => console.log(`  - ${w}`));
    console.log();
  }

  // Print errors
  if (result.errors.length > 0) {
    console.log("Errors:");
    result.errors.forEach(e => console.log(`  - ${e}`));
    console.log();
  }

  // Print result
  if (result.valid) {
    console.log("Result: VALID");
    Deno.exit(0);
  } else {
    console.log("Result: INVALID");
    Deno.exit(1);
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
