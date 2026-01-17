#!/usr/bin/env -S deno run --allow-run --allow-read --allow-write

/**
 * GitHub to Context Network Sync
 *
 * Generates context network updates from GitHub state.
 * Bridges GitHub work items with context/status.md and context/decisions.md.
 *
 * Usage:
 *   deno run --allow-run --allow-read --allow-write gh-sync-context.ts
 *   deno run --allow-run gh-sync-context.ts --dry-run
 *   deno run --allow-run --allow-read --allow-write gh-sync-context.ts --status --decisions
 *   deno run --allow-run --allow-read --allow-write gh-sync-context.ts --output ./context
 */

// === INTERFACES ===

interface Issue {
  number: number;
  title: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  labels: { name: string }[];
  milestone: { title: string } | null;
  body: string | null;
  url: string;
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  mergedAt: string | null;
  createdAt: string;
  headRefName: string;
  body: string | null;
  url: string;
}

interface Milestone {
  title: string;
  state: string;
  description: string | null;
  dueOn: string | null;
  openIssues: number;
  closedIssues: number;
}

interface SyncOptions {
  status: boolean;
  decisions: boolean;
  outputDir: string;
  dryRun: boolean;
}

interface StatusUpdate {
  currentMilestone: string | null;
  activeIssues: { number: number; title: string; labels: string[] }[];
  activePRs: { number: number; title: string; branch: string }[];
  recentlyCompleted: { number: number; title: string; closedAt: string }[];
  timestamp: string;
}

interface DecisionCandidate {
  source: "issue" | "pr";
  number: number;
  title: string;
  body: string | null;
  closedAt: string;
  url: string;
}

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

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
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

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toISOString().split("T")[0];
}

// === DATA FETCHING ===

async function getRepoInfo(): Promise<{ name: string; owner: string }> {
  const result = await runCommand([
    "gh",
    "repo",
    "view",
    "--json",
    "name,owner",
  ]);

  if (!result.success || !result.output) {
    return { name: "unknown", owner: "unknown" };
  }

  try {
    const data = JSON.parse(result.output);
    return { name: data.name, owner: data.owner?.login || "unknown" };
  } catch {
    return { name: "unknown", owner: "unknown" };
  }
}

async function getOpenIssues(): Promise<Issue[]> {
  const result = await runCommand([
    "gh",
    "issue",
    "list",
    "--state",
    "open",
    "--limit",
    "50",
    "--json",
    "number,title,state,createdAt,updatedAt,closedAt,labels,milestone,body,url",
  ]);

  if (!result.success || !result.output) {
    return [];
  }

  try {
    return JSON.parse(result.output);
  } catch {
    return [];
  }
}

async function getRecentlyClosedIssues(days: number = 14): Promise<Issue[]> {
  // Get closed issues, then filter by date client-side
  const result = await runCommand([
    "gh",
    "issue",
    "list",
    "--state",
    "closed",
    "--limit",
    "50",
    "--json",
    "number,title,state,createdAt,updatedAt,closedAt,labels,milestone,body,url",
  ]);

  if (!result.success || !result.output) {
    return [];
  }

  try {
    const issues: Issue[] = JSON.parse(result.output);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return issues.filter(i => {
      if (!i.closedAt) return false;
      return new Date(i.closedAt) >= cutoff;
    });
  } catch {
    return [];
  }
}

async function getOpenPRs(): Promise<PullRequest[]> {
  const result = await runCommand([
    "gh",
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    "20",
    "--json",
    "number,title,state,mergedAt,createdAt,headRefName,body,url",
  ]);

  if (!result.success || !result.output) {
    return [];
  }

  try {
    return JSON.parse(result.output);
  } catch {
    return [];
  }
}

async function getRecentlyMergedPRs(days: number = 14): Promise<PullRequest[]> {
  const result = await runCommand([
    "gh",
    "pr",
    "list",
    "--state",
    "merged",
    "--limit",
    "30",
    "--json",
    "number,title,state,mergedAt,createdAt,headRefName,body,url",
  ]);

  if (!result.success || !result.output) {
    return [];
  }

  try {
    const prs: PullRequest[] = JSON.parse(result.output);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return prs.filter(p => {
      if (!p.mergedAt) return false;
      return new Date(p.mergedAt) >= cutoff;
    });
  } catch {
    return [];
  }
}

async function getActiveMilestone(): Promise<Milestone | null> {
  const result = await runCommand([
    "gh",
    "api",
    "repos/{owner}/{repo}/milestones",
    "--jq",
    "map(select(.state == \"open\")) | sort_by(.due_on) | .[0] | {title: .title, state: .state, description: .description, dueOn: .due_on, openIssues: .open_issues, closedIssues: .closed_issues}",
  ]);

  if (!result.success || !result.output || result.output === "null") {
    return null;
  }

  try {
    return JSON.parse(result.output);
  } catch {
    return null;
  }
}

// === STATUS GENERATION ===

async function generateStatusUpdate(): Promise<StatusUpdate> {
  const openIssues = await getOpenIssues();
  const openPRs = await getOpenPRs();
  const recentlyClosed = await getRecentlyClosedIssues(7);
  const milestone = await getActiveMilestone();

  // Sort issues by priority (critical > high > medium > low > unlabeled)
  const priorityOrder = ["priority:critical", "priority:high", "priority:medium", "priority:low"];

  const sortedIssues = openIssues.sort((a, b) => {
    const aLabels = a.labels.map(l => l.name);
    const bLabels = b.labels.map(l => l.name);

    const aPriority = priorityOrder.findIndex(p => aLabels.includes(p));
    const bPriority = priorityOrder.findIndex(p => bLabels.includes(p));

    // -1 means no priority label, put at end
    const aScore = aPriority === -1 ? 999 : aPriority;
    const bScore = bPriority === -1 ? 999 : bPriority;

    return aScore - bScore;
  });

  return {
    currentMilestone: milestone?.title || null,
    activeIssues: sortedIssues.slice(0, 10).map(i => ({
      number: i.number,
      title: i.title,
      labels: i.labels.map(l => l.name),
    })),
    activePRs: openPRs.map(p => ({
      number: p.number,
      title: p.title,
      branch: p.headRefName,
    })),
    recentlyCompleted: recentlyClosed.slice(0, 5).map(i => ({
      number: i.number,
      title: i.title,
      closedAt: i.closedAt!,
    })),
    timestamp: new Date().toISOString(),
  };
}

function formatStatusMarkdown(status: StatusUpdate, repoInfo: { name: string; owner: string }): string {
  const lines: string[] = [];

  lines.push("## GitHub Sync");
  lines.push("");
  lines.push(`*Last synced: ${formatDate(status.timestamp)}*`);
  lines.push("");

  // Current Milestone
  if (status.currentMilestone) {
    lines.push(`### Current Milestone: ${status.currentMilestone}`);
    lines.push("");
  }

  // Active Issues
  lines.push("### Active Issues");
  lines.push("");
  if (status.activeIssues.length === 0) {
    lines.push("No open issues.");
  } else {
    for (const issue of status.activeIssues) {
      const labels = issue.labels.length > 0 ? ` (${issue.labels.join(", ")})` : "";
      lines.push(`- [#${issue.number}](https://github.com/${repoInfo.owner}/${repoInfo.name}/issues/${issue.number}): ${issue.title}${labels}`);
    }
  }
  lines.push("");

  // Active PRs
  if (status.activePRs.length > 0) {
    lines.push("### Active Pull Requests");
    lines.push("");
    for (const pr of status.activePRs) {
      lines.push(`- [#${pr.number}](https://github.com/${repoInfo.owner}/${repoInfo.name}/pull/${pr.number}): ${pr.title} (\`${pr.branch}\`)`);
    }
    lines.push("");
  }

  // Recently Completed
  if (status.recentlyCompleted.length > 0) {
    lines.push("### Recently Completed (Last 7 Days)");
    lines.push("");
    for (const issue of status.recentlyCompleted) {
      lines.push(`- [#${issue.number}](https://github.com/${repoInfo.owner}/${repoInfo.name}/issues/${issue.number}): ${issue.title} (${formatDate(issue.closedAt)})`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// === DECISION EXTRACTION ===

async function extractDecisionCandidates(): Promise<DecisionCandidate[]> {
  const candidates: DecisionCandidate[] = [];

  // Get closed issues with "decision" label
  const issueResult = await runCommand([
    "gh",
    "issue",
    "list",
    "--state",
    "closed",
    "--label",
    "decision",
    "--limit",
    "20",
    "--json",
    "number,title,body,closedAt,url",
  ]);

  if (issueResult.success && issueResult.output) {
    try {
      const issues = JSON.parse(issueResult.output);
      for (const issue of issues) {
        candidates.push({
          source: "issue",
          number: issue.number,
          title: issue.title,
          body: issue.body,
          closedAt: issue.closedAt,
          url: issue.url,
        });
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Also look for PRs with "decision" or "architecture" in title/body
  const prResult = await runCommand([
    "gh",
    "pr",
    "list",
    "--state",
    "merged",
    "--limit",
    "30",
    "--json",
    "number,title,body,mergedAt,url",
  ]);

  if (prResult.success && prResult.output) {
    try {
      const prs = JSON.parse(prResult.output);
      for (const pr of prs) {
        // Check if PR body contains decision-related keywords
        const bodyLower = (pr.body || "").toLowerCase();
        const titleLower = pr.title.toLowerCase();

        if (
          bodyLower.includes("decision") ||
          bodyLower.includes("adr") ||
          bodyLower.includes("architecture") ||
          titleLower.includes("decision") ||
          titleLower.includes("adr")
        ) {
          candidates.push({
            source: "pr",
            number: pr.number,
            title: pr.title,
            body: pr.body,
            closedAt: pr.mergedAt,
            url: pr.url,
          });
        }
      }
    } catch {
      // Ignore parse errors
    }
  }

  // Sort by date, most recent first
  return candidates.sort((a, b) =>
    new Date(b.closedAt).getTime() - new Date(a.closedAt).getTime()
  );
}

function formatDecisionCandidates(candidates: DecisionCandidate[]): string {
  const lines: string[] = [];

  lines.push("## Decision Candidates from GitHub");
  lines.push("");
  lines.push("*These items were found in GitHub and may contain decisions worth documenting.*");
  lines.push("*Review and extract key decisions to `context/decisions.md`.*");
  lines.push("");

  if (candidates.length === 0) {
    lines.push("No decision candidates found.");
    lines.push("");
    lines.push("Tip: Use the `decision` label on issues that contain key decisions.");
    return lines.join("\n");
  }

  for (const candidate of candidates) {
    const sourceLabel = candidate.source === "issue" ? "Issue" : "PR";
    lines.push(`### ${sourceLabel} #${candidate.number}: ${candidate.title}`);
    lines.push("");
    lines.push(`- **Closed:** ${formatDate(candidate.closedAt)}`);
    lines.push(`- **Link:** ${candidate.url}`);
    lines.push("");

    if (candidate.body) {
      // Extract first 500 chars of body as preview
      const preview = candidate.body.substring(0, 500);
      const truncated = candidate.body.length > 500 ? "..." : "";
      lines.push("**Preview:**");
      lines.push("```");
      lines.push(preview + truncated);
      lines.push("```");
      lines.push("");
    }

    lines.push("---");
    lines.push("");
  }

  return lines.join("\n");
}

// === FILE OPERATIONS ===

async function updateStatusFile(
  statusContent: string,
  outputDir: string,
  dryRun: boolean
): Promise<boolean> {
  const statusPath = `${outputDir}/status.md`;

  if (dryRun) {
    console.log(`[DRY RUN] Would update: ${statusPath}`);
    console.log("");
    console.log("--- Content Preview ---");
    console.log(statusContent);
    console.log("--- End Preview ---");
    return true;
  }

  // Check if status.md exists
  const exists = await fileExists(statusPath);

  if (exists) {
    // Read existing file
    const existing = await Deno.readTextFile(statusPath);

    // Find or create GitHub Sync section
    const syncMarker = "## GitHub Sync";
    const syncIndex = existing.indexOf(syncMarker);

    let newContent: string;
    if (syncIndex !== -1) {
      // Find the next ## heading or end of file
      const nextHeading = existing.indexOf("\n## ", syncIndex + 1);
      const endIndex = nextHeading !== -1 ? nextHeading : existing.length;

      // Replace the GitHub Sync section
      newContent = existing.substring(0, syncIndex) + statusContent + existing.substring(endIndex);
    } else {
      // Append to end
      newContent = existing.trimEnd() + "\n\n" + statusContent;
    }

    await Deno.writeTextFile(statusPath, newContent);
  } else {
    // Create new file with header
    await ensureDirectory(outputDir);
    const header = "# Status\n\nCurrent project state and recent changes.\n\n";
    await Deno.writeTextFile(statusPath, header + statusContent);
  }

  console.log(`Updated: ${statusPath}`);
  return true;
}

async function writeDecisionCandidates(
  content: string,
  outputDir: string,
  dryRun: boolean
): Promise<boolean> {
  const date = new Date().toISOString().split("T")[0];
  const candidatesPath = `${outputDir}/decision-candidates-${date}.md`;

  if (dryRun) {
    console.log(`[DRY RUN] Would write: ${candidatesPath}`);
    console.log("");
    console.log("--- Content Preview ---");
    console.log(content);
    console.log("--- End Preview ---");
    return true;
  }

  await ensureDirectory(outputDir);
  await Deno.writeTextFile(candidatesPath, content);
  console.log(`Created: ${candidatesPath}`);
  return true;
}

// === MAIN SYNC ===

async function sync(options: SyncOptions): Promise<void> {
  console.log("");
  console.log("=".repeat(50));
  console.log("GITHUB TO CONTEXT NETWORK SYNC");
  console.log("=".repeat(50));
  console.log("");

  if (options.dryRun) {
    console.log("[DRY RUN MODE - No files will be modified]");
    console.log("");
  }

  const repoInfo = await getRepoInfo();
  console.log(`Repository: ${repoInfo.owner}/${repoInfo.name}`);
  console.log(`Output directory: ${options.outputDir}`);
  console.log("");

  // Generate and write status update
  if (options.status) {
    console.log("-".repeat(50));
    console.log("SYNCING STATUS");
    console.log("-".repeat(50));

    const status = await generateStatusUpdate();
    const statusMarkdown = formatStatusMarkdown(status, repoInfo);
    await updateStatusFile(statusMarkdown, options.outputDir, options.dryRun);
    console.log("");

    console.log("Status summary:");
    console.log(`  Current milestone: ${status.currentMilestone || "none"}`);
    console.log(`  Open issues: ${status.activeIssues.length}`);
    console.log(`  Open PRs: ${status.activePRs.length}`);
    console.log(`  Recently completed: ${status.recentlyCompleted.length}`);
    console.log("");
  }

  // Extract and write decision candidates
  if (options.decisions) {
    console.log("-".repeat(50));
    console.log("EXTRACTING DECISION CANDIDATES");
    console.log("-".repeat(50));

    const candidates = await extractDecisionCandidates();
    const decisionsMarkdown = formatDecisionCandidates(candidates);
    await writeDecisionCandidates(decisionsMarkdown, options.outputDir, options.dryRun);
    console.log("");

    console.log(`Found ${candidates.length} decision candidates`);
    if (candidates.length > 0) {
      console.log("Review the generated file and extract key decisions to decisions.md");
    }
    console.log("");
  }

  console.log("-".repeat(50));
  console.log("SYNC COMPLETE");
  console.log("-".repeat(50));
  console.log("");
  console.log("Next steps:");
  console.log("1. Review generated/updated files");
  console.log("2. Move key decisions to context/decisions.md");
  console.log("3. Update context/architecture.md if workflow changed");
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): SyncOptions {
  const options: SyncOptions = {
    status: false,
    decisions: false,
    outputDir: "context",
    dryRun: false,
  };

  // Default to status if no specific options
  let hasSpecificOption = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;
      case "--status":
      case "-s":
        options.status = true;
        hasSpecificOption = true;
        break;
      case "--decisions":
      case "-d":
        options.decisions = true;
        hasSpecificOption = true;
        break;
      case "--output":
      case "-o":
        if (nextArg) {
          options.outputDir = nextArg;
          i++;
        }
        break;
      case "--dry-run":
        options.dryRun = true;
        break;
      case "--all":
        options.status = true;
        options.decisions = true;
        hasSpecificOption = true;
        break;
    }
  }

  // Default to status sync if no specific option given
  if (!hasSpecificOption) {
    options.status = true;
  }

  return options;
}

function printHelp(): void {
  console.log(`
GitHub to Context Network Sync

Generates context network updates from GitHub state.

USAGE:
  gh-sync-context.ts [OPTIONS]

OPTIONS:
  --status, -s         Sync status.md with current GitHub state
  --decisions, -d      Extract decision candidates from labeled issues/PRs
  --all                Sync both status and decisions
  --output, -o <dir>   Output directory (default: context)
  --dry-run            Show what would be written without writing
  --help, -h           Show this help

WHAT IT DOES:

  Status sync (--status):
    - Updates or creates ## GitHub Sync section in status.md
    - Lists current milestone, active issues, active PRs
    - Shows recently completed items (last 7 days)
    - Preserves other content in status.md

  Decision extraction (--decisions):
    - Finds closed issues with "decision" label
    - Finds merged PRs with decision/architecture keywords
    - Creates decision-candidates-{date}.md for review
    - You manually move relevant decisions to decisions.md

EXAMPLES:
  # Sync status to context/status.md
  gh-sync-context.ts

  # Preview what would be synced
  gh-sync-context.ts --dry-run

  # Sync both status and extract decisions
  gh-sync-context.ts --all

  # Custom output directory
  gh-sync-context.ts --status --output ./docs/context

TIPS:
  - Use the "decision" label on issues that contain key decisions
  - Run weekly as part of context sync ceremony
  - Review decision candidates and extract to decisions.md
`);
}

// === MAIN ===

async function main(): Promise<void> {
  // Check gh is available
  const ghCheck = await runCommand(["gh", "auth", "status"]);
  if (!ghCheck.success && !ghCheck.error.includes("Logged in")) {
    console.error("Error: GitHub CLI not authenticated. Run 'gh auth login' first.");
    Deno.exit(1);
  }

  const options = parseArgs(Deno.args);
  await sync(options);
}

main();
