#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * GitHub Project Initialization
 *
 * Initializes GitHub project with labels, issue/PR templates, and branch protection.
 * Use this to resolve GH2 state (Workflow Not Established).
 *
 * Usage:
 *   deno run --allow-run --allow-read --allow-write gh-init-project.ts
 *   deno run --allow-run --allow-read --allow-write gh-init-project.ts --labels standard --templates --protection
 *   deno run --allow-run --allow-read --allow-write gh-init-project.ts --mode team --labels standard
 *   deno run --allow-run --allow-read --allow-write gh-init-project.ts --dry-run
 */

// === INTERFACES ===

interface Label {
  name: string;
  description: string;
  color: string;
}

interface LabelScheme {
  name: string;
  description: string;
  labels: Label[];
}

interface InitOptions {
  labels: "standard" | "simple" | "minimal" | "none";
  templates: boolean;
  protection: boolean;
  mode: "solo" | "team";
  dryRun: boolean;
}

interface InitResult {
  labelsCreated: string[];
  labelsFailed: string[];
  templatesCreated: string[];
  protectionEnabled: boolean;
  errors: string[];
}

// === LABEL SCHEMES ===

const LABEL_SCHEMES: Record<string, LabelScheme> = {
  standard: {
    name: "Standard",
    description: "Comprehensive label scheme for structured workflows",
    labels: [
      // Type labels
      { name: "type:feature", description: "New functionality", color: "0E8A16" },
      { name: "type:bug", description: "Something broken", color: "D73A4A" },
      { name: "type:task", description: "Maintenance, docs, infrastructure", color: "0075CA" },
      { name: "type:question", description: "Needs discussion or clarification", color: "D876E3" },
      // Status labels
      { name: "status:needs-triage", description: "New, not yet reviewed", color: "FBCA04" },
      { name: "status:ready", description: "Ready to work on", color: "C2E0C6" },
      { name: "status:in-progress", description: "Currently being worked on", color: "1D76DB" },
      { name: "status:blocked", description: "Waiting on something", color: "B60205" },
      { name: "status:stale", description: "No activity, needs review", color: "D4C5F9" },
      // Priority labels
      { name: "priority:critical", description: "Must be done immediately", color: "B60205" },
      { name: "priority:high", description: "Should be done soon", color: "D93F0B" },
      { name: "priority:medium", description: "Normal priority", color: "FBCA04" },
      { name: "priority:low", description: "Nice to have, can wait", color: "0E8A16" },
      // Special labels
      { name: "icebox", description: "Deferred indefinitely", color: "EDEDED" },
      { name: "decision", description: "Contains a key decision", color: "5319E7" },
      { name: "good-first-issue", description: "Good for newcomers", color: "7057FF" },
    ],
  },
  simple: {
    name: "Simple",
    description: "Minimal labels for solo developers",
    labels: [
      { name: "type:feature", description: "New functionality", color: "0E8A16" },
      { name: "type:bug", description: "Something broken", color: "D73A4A" },
      { name: "type:task", description: "Maintenance, docs, infrastructure", color: "0075CA" },
      { name: "priority:high", description: "Do this first", color: "D93F0B" },
      { name: "priority:low", description: "Nice to have", color: "0E8A16" },
      { name: "icebox", description: "Deferred indefinitely", color: "EDEDED" },
    ],
  },
  minimal: {
    name: "Minimal",
    description: "Bare minimum labels",
    labels: [
      { name: "bug", description: "Something broken", color: "D73A4A" },
      { name: "feature", description: "New functionality", color: "0E8A16" },
      { name: "icebox", description: "Deferred", color: "EDEDED" },
    ],
  },
};

// Team-specific labels to add when mode is team
const TEAM_LABELS: Label[] = [
  { name: "status:needs-review", description: "Waiting for code review", color: "FBCA04" },
  { name: "status:changes-requested", description: "Reviewer requested changes", color: "D93F0B" },
  { name: "needs:discussion", description: "Requires team input", color: "D876E3" },
];

// === TEMPLATES ===

const FEATURE_TEMPLATE = `---
name: Feature Request
about: Propose a new feature or enhancement
title: '[FEATURE] '
labels: ['type:feature', 'status:needs-triage']
assignees: ''
---

## Problem
<!-- What problem does this feature solve? Who has this problem? -->

## Proposed Solution
<!-- How should this work? Be specific about behavior. -->

## Alternatives Considered
<!-- What other approaches did you consider? Why not those? -->

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Context References
<!-- Link to requirements doc, discussion, or context/decisions.md if relevant -->
`;

const BUG_TEMPLATE = `---
name: Bug Report
about: Report something that's broken
title: '[BUG] '
labels: ['type:bug', 'status:needs-triage']
assignees: ''
---

## Description
<!-- What's broken? Be specific. -->

## Steps to Reproduce
1.
2.
3.

## Expected Behavior
<!-- What should happen? -->

## Actual Behavior
<!-- What actually happens? Include error messages if any. -->

## Environment
- OS:
- Version/Commit:

## Additional Context
<!-- Screenshots, logs, or other relevant information -->
`;

const TASK_TEMPLATE = `---
name: Task
about: Maintenance, documentation, or infrastructure work
title: '[TASK] '
labels: ['type:task']
assignees: ''
---

## Description
<!-- What needs to be done? -->

## Motivation
<!-- Why is this needed? What problem does it solve? -->

## Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2

## Notes
<!-- Any additional context or constraints -->
`;

const PR_TEMPLATE = `## Summary
<!-- Brief description of what this PR does -->

## Related Issue
<!-- Use closing keyword: Closes #, Fixes #, or Resolves # -->
Closes #

## Changes
<!-- Bullet list of specific changes made -->
-
-

## Why
<!-- Motivation for these changes. What problem does this solve? -->

## How to Test
<!-- Steps for reviewer to verify the changes work -->
1.
2.

## Context References
<!-- Link to ADR, requirements doc, or context/decisions.md if architectural -->

## Checklist
- [ ] Tests pass
- [ ] Code follows project conventions
- [ ] PR is appropriately scoped (not too large)
- [ ] Issue is linked with closing keyword
- [ ] Self-reviewed (read diff as if someone else wrote it)
`;

// === UTILITIES ===

async function runCommand(
  cmd: string[]
): Promise<{ success: boolean; output: string; error: string }> {
  try {
    const command = new Deno.Command(cmd[0], {
      args: cmd.slice(1),
      stdout: "piped",
      stderr: "piped",
    });

    const { success, stdout, stderr } = await command.output();

    return {
      success,
      output: new TextDecoder().decode(stdout).trim(),
      error: new TextDecoder().decode(stderr).trim(),
    };
  } catch {
    return {
      success: false,
      output: "",
      error: "Command not found or failed to execute",
    };
  }
}

async function ensureDirectory(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (error) {
    if (!(error instanceof Deno.errors.AlreadyExists)) {
      throw error;
    }
  }
}

async function writeFile(path: string, content: string, dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.log(`[DRY RUN] Would write: ${path}`);
    return true;
  }

  try {
    await Deno.writeTextFile(path, content);
    return true;
  } catch (error) {
    console.error(`Failed to write ${path}: ${error}`);
    return false;
  }
}

// === INITIALIZATION FUNCTIONS ===

async function createLabels(
  scheme: LabelScheme,
  mode: "solo" | "team",
  dryRun: boolean
): Promise<{ created: string[]; failed: string[] }> {
  const created: string[] = [];
  const failed: string[] = [];

  let labels = [...scheme.labels];

  // Add team labels if in team mode
  if (mode === "team") {
    labels = [...labels, ...TEAM_LABELS];
  }

  for (const label of labels) {
    if (dryRun) {
      console.log(`[DRY RUN] Would create label: ${label.name} (${label.description})`);
      created.push(label.name);
      continue;
    }

    const result = await runCommand([
      "gh",
      "label",
      "create",
      label.name,
      "--description",
      label.description,
      "--color",
      label.color,
      "--force", // Update if exists
    ]);

    if (result.success || result.error.includes("already exists")) {
      created.push(label.name);
    } else {
      failed.push(`${label.name}: ${result.error}`);
    }
  }

  return { created, failed };
}

async function createTemplates(dryRun: boolean): Promise<string[]> {
  const created: string[] = [];

  // Ensure .github/ISSUE_TEMPLATE directory exists
  if (!dryRun) {
    await ensureDirectory(".github/ISSUE_TEMPLATE");
  }

  // Create issue templates
  const templates = [
    { path: ".github/ISSUE_TEMPLATE/feature.md", content: FEATURE_TEMPLATE },
    { path: ".github/ISSUE_TEMPLATE/bug.md", content: BUG_TEMPLATE },
    { path: ".github/ISSUE_TEMPLATE/task.md", content: TASK_TEMPLATE },
    { path: ".github/pull_request_template.md", content: PR_TEMPLATE },
  ];

  for (const template of templates) {
    if (await writeFile(template.path, template.content, dryRun)) {
      created.push(template.path);
    }
  }

  return created;
}

async function enableBranchProtection(dryRun: boolean): Promise<boolean> {
  if (dryRun) {
    console.log("[DRY RUN] Would enable branch protection on main/master");
    return true;
  }

  // Get default branch
  const branchResult = await runCommand([
    "gh",
    "repo",
    "view",
    "--json",
    "defaultBranchRef",
    "--jq",
    ".defaultBranchRef.name",
  ]);

  const defaultBranch = branchResult.output || "main";

  // Enable basic branch protection
  // Note: This requires admin access to the repository
  const result = await runCommand([
    "gh",
    "api",
    `repos/{owner}/{repo}/branches/${defaultBranch}/protection`,
    "-X",
    "PUT",
    "-H",
    "Accept: application/vnd.github+json",
    "-f",
    "required_status_checks=null",
    "-f",
    "enforce_admins=null",
    "-f",
    "required_pull_request_reviews=null",
    "-f",
    "restrictions=null",
    "-F",
    "required_linear_history=true",
    "-F",
    "allow_force_pushes=false",
    "-F",
    "allow_deletions=false",
  ]);

  return result.success;
}

// === MAIN INITIALIZATION ===

async function initialize(options: InitOptions): Promise<InitResult> {
  const result: InitResult = {
    labelsCreated: [],
    labelsFailed: [],
    templatesCreated: [],
    protectionEnabled: false,
    errors: [],
  };

  console.log("");
  console.log("=".repeat(50));
  console.log("GITHUB PROJECT INITIALIZATION");
  console.log("=".repeat(50));
  console.log("");

  if (options.dryRun) {
    console.log("[DRY RUN MODE - No changes will be made]");
    console.log("");
  }

  // Create labels
  if (options.labels !== "none") {
    const scheme = LABEL_SCHEMES[options.labels];
    if (scheme) {
      console.log(`Creating labels (${scheme.name} scheme)...`);
      const { created, failed } = await createLabels(scheme, options.mode, options.dryRun);
      result.labelsCreated = created;
      result.labelsFailed = failed;
      console.log(`  Created: ${created.length} labels`);
      if (failed.length > 0) {
        console.log(`  Failed: ${failed.length} labels`);
        result.errors.push(...failed);
      }
      console.log("");
    }
  }

  // Create templates
  if (options.templates) {
    console.log("Creating issue and PR templates...");
    result.templatesCreated = await createTemplates(options.dryRun);
    console.log(`  Created: ${result.templatesCreated.length} templates`);
    console.log("");
  }

  // Enable branch protection
  if (options.protection) {
    console.log("Enabling branch protection...");
    result.protectionEnabled = await enableBranchProtection(options.dryRun);
    if (result.protectionEnabled) {
      console.log("  Branch protection enabled");
    } else {
      console.log("  Failed to enable branch protection (may require admin access)");
      result.errors.push("Branch protection requires admin access");
    }
    console.log("");
  }

  // Summary
  console.log("-".repeat(50));
  console.log("SUMMARY");
  console.log("-".repeat(50));
  console.log(`Labels created: ${result.labelsCreated.length}`);
  console.log(`Templates created: ${result.templatesCreated.length}`);
  console.log(`Branch protection: ${result.protectionEnabled ? "enabled" : "not enabled"}`);

  if (result.errors.length > 0) {
    console.log("");
    console.log("Errors:");
    for (const error of result.errors) {
      console.log(`  - ${error}`);
    }
  }

  console.log("");
  console.log("-".repeat(50));
  console.log("NEXT STEPS");
  console.log("-".repeat(50));
  console.log("1. Review created templates in .github/");
  console.log("2. Customize templates if needed");
  console.log("3. Document workflow in context/architecture.md");
  console.log("4. Create first milestone for current work phase");
  console.log("");

  return result;
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): InitOptions {
  const options: InitOptions = {
    labels: "standard",
    templates: false,
    protection: false,
    mode: "solo",
    dryRun: false,
  };

  // If no args, use sensible defaults
  if (args.length === 0 || (args.length === 1 && args[0] === "--help")) {
    // Will show help or run with defaults
  }

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;
      case "--labels":
      case "-l":
        if (nextArg && ["standard", "simple", "minimal", "none"].includes(nextArg)) {
          options.labels = nextArg as "standard" | "simple" | "minimal" | "none";
          i++;
        }
        break;
      case "--templates":
      case "-t":
        options.templates = true;
        break;
      case "--protection":
      case "-p":
        options.protection = true;
        break;
      case "--mode":
      case "-m":
        if (nextArg && ["solo", "team"].includes(nextArg)) {
          options.mode = nextArg as "solo" | "team";
          i++;
        }
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--all":
        options.templates = true;
        options.protection = true;
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
GitHub Project Initialization

Initialize GitHub project with labels, templates, and branch protection.

USAGE:
  gh-init-project.ts [OPTIONS]

OPTIONS:
  --labels, -l <scheme>   Label scheme: standard, simple, minimal, none (default: standard)
  --templates, -t         Create issue and PR templates
  --protection, -p        Enable branch protection on default branch
  --mode, -m <mode>       Mode: solo or team (default: solo)
  --all                   Enable templates and protection
  --dry-run               Show what would be done without making changes
  --help, -h              Show this help

LABEL SCHEMES:
  standard   Full scheme: type, status, priority labels (16 labels)
  simple     Minimal for solo: type, priority, icebox (6 labels)
  minimal    Bare minimum: bug, feature, icebox (3 labels)
  none       Don't create any labels

MODE DIFFERENCES:
  solo       Standard labels only
  team       Adds status:needs-review, status:changes-requested, needs:discussion

TEMPLATES CREATED:
  .github/ISSUE_TEMPLATE/feature.md    Feature request
  .github/ISSUE_TEMPLATE/bug.md        Bug report
  .github/ISSUE_TEMPLATE/task.md       Task/chore
  .github/pull_request_template.md     PR template with context references

EXAMPLES:
  # Initialize with standard labels and templates
  gh-init-project.ts --labels standard --templates

  # Full initialization for team
  gh-init-project.ts --mode team --all

  # Preview what would be created
  gh-init-project.ts --all --dry-run

  # Minimal solo setup
  gh-init-project.ts --labels simple --templates
`);
}

// === MAIN ===

async function main(): Promise<void> {
  // Check if we can access gh
  const ghCheck = await runCommand(["gh", "auth", "status"]);
  if (!ghCheck.success && !ghCheck.error.includes("Logged in")) {
    console.error("Error: GitHub CLI not authenticated. Run 'gh auth login' first.");
    Deno.exit(1);
  }

  // Check if we're in a repo
  const repoCheck = await runCommand(["gh", "repo", "view", "--json", "name"]);
  if (!repoCheck.success) {
    console.error("Error: Not in a GitHub repository. Run 'gh repo create' or add a remote first.");
    Deno.exit(1);
  }

  const options = parseArgs(Deno.args);

  // If no specific options, show interactive prompt or use defaults
  if (!options.templates && !options.protection && options.labels === "standard") {
    console.log("No options specified. Using defaults:");
    console.log("  --labels standard --templates");
    console.log("");
    console.log("Use --help to see all options, or --all for full initialization.");
    console.log("");
    options.templates = true;
  }

  const result = await initialize(options);

  // Exit with error if there were failures
  if (result.errors.length > 0 && result.labelsCreated.length === 0 && result.templatesCreated.length === 0) {
    Deno.exit(1);
  }
}

main();
