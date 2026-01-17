#!/usr/bin/env -S deno run --allow-run

/**
 * GitHub Workflow Audit
 *
 * Audits current GitHub state against healthy workflow indicators.
 * Use this for state diagnosis and health checks.
 *
 * Usage:
 *   deno run --allow-run gh-audit.ts
 *   deno run --allow-run gh-audit.ts --json
 *   deno run --allow-run gh-audit.ts --stale 30
 *   deno run --allow-run gh-audit.ts --verbose
 */

// === INTERFACES ===

interface Issue {
  number: number;
  title: string;
  state: string;
  createdAt: string;
  updatedAt: string;
  labels: { name: string }[];
  milestone: { title: string } | null;
  assignees: { login: string }[];
}

interface PullRequest {
  number: number;
  title: string;
  state: string;
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  headRefName: string;
  baseRefName: string;
  body: string;
}

interface Commit {
  sha: string;
  message: string;
  authoredDate: string;
  authors: { name: string }[];
}

interface AuditCheck {
  category: string;
  check: string;
  status: "pass" | "fail" | "warn" | "info";
  message: string;
  details?: string[];
  recommendation?: string;
}

interface AuditReport {
  timestamp: string;
  repository: string;
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  score: number;
  state: string;
  checks: AuditCheck[];
  staleItems: {
    issues: { number: number; title: string; daysSinceUpdate: number }[];
    prs: { number: number; title: string; daysSinceUpdate: number }[];
  };
}

interface AuditOptions {
  staleDays: number;
  verbose: boolean;
  json: boolean;
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

function daysSince(dateString: string): number {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// === DATA FETCHING ===

async function getRepoName(): Promise<string> {
  const result = await runCommand([
    "gh",
    "repo",
    "view",
    "--json",
    "nameWithOwner",
    "--jq",
    ".nameWithOwner",
  ]);
  return result.output || "unknown";
}

async function getOpenIssues(): Promise<Issue[]> {
  const result = await runCommand([
    "gh",
    "issue",
    "list",
    "--state",
    "open",
    "--limit",
    "100",
    "--json",
    "number,title,state,createdAt,updatedAt,labels,milestone,assignees",
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

async function getOpenPRs(): Promise<PullRequest[]> {
  const result = await runCommand([
    "gh",
    "pr",
    "list",
    "--state",
    "open",
    "--limit",
    "50",
    "--json",
    "number,title,state,isDraft,createdAt,updatedAt,headRefName,baseRefName,body",
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

async function getRecentCommits(): Promise<Commit[]> {
  const result = await runCommand([
    "gh",
    "api",
    "repos/{owner}/{repo}/commits",
    "--jq",
    ".[0:20] | map({sha: .sha, message: .commit.message, authoredDate: .commit.author.date, authors: [{name: .commit.author.name}]})",
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

async function getDefaultBranch(): Promise<string> {
  const result = await runCommand([
    "gh",
    "repo",
    "view",
    "--json",
    "defaultBranchRef",
    "--jq",
    ".defaultBranchRef.name",
  ]);
  return result.output || "main";
}

async function getLabels(): Promise<string[]> {
  const result = await runCommand([
    "gh",
    "label",
    "list",
    "--limit",
    "100",
    "--json",
    "name",
    "--jq",
    ".[].name",
  ]);

  if (!result.success || !result.output) {
    return [];
  }

  return result.output.split("\n").filter(Boolean);
}

async function getMilestones(): Promise<{ title: string; state: string }[]> {
  const result = await runCommand([
    "gh",
    "api",
    "repos/{owner}/{repo}/milestones",
    "--jq",
    "map({title: .title, state: .state})",
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

// === AUDIT CHECKS ===

function auditIssues(issues: Issue[], staleDays: number): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // Issue count check
  const issueCount = issues.length;
  if (issueCount === 0) {
    checks.push({
      category: "Issues",
      check: "Open issue count",
      status: "info",
      message: "No open issues",
    });
  } else if (issueCount > 50) {
    checks.push({
      category: "Issues",
      check: "Open issue count",
      status: "warn",
      message: `${issueCount} open issues (consider grooming)`,
      recommendation: "Review and close or icebox stale issues",
    });
  } else {
    checks.push({
      category: "Issues",
      check: "Open issue count",
      status: "pass",
      message: `${issueCount} open issues`,
    });
  }

  // Label coverage
  const unlabeledIssues = issues.filter(i => i.labels.length === 0);
  if (unlabeledIssues.length === 0) {
    checks.push({
      category: "Issues",
      check: "Label coverage",
      status: "pass",
      message: "All issues have labels",
    });
  } else {
    checks.push({
      category: "Issues",
      check: "Label coverage",
      status: "warn",
      message: `${unlabeledIssues.length} issues without labels`,
      details: unlabeledIssues.slice(0, 5).map(i => `#${i.number}: ${i.title}`),
      recommendation: "Add type and priority labels to unlabeled issues",
    });
  }

  // Milestone usage
  const issuesWithMilestone = issues.filter(i => i.milestone !== null);
  const milestoneRatio = issues.length > 0 ? issuesWithMilestone.length / issues.length : 1;

  if (issues.length === 0 || milestoneRatio >= 0.5) {
    checks.push({
      category: "Issues",
      check: "Milestone usage",
      status: milestoneRatio >= 0.7 ? "pass" : "info",
      message: `${issuesWithMilestone.length}/${issues.length} issues assigned to milestones`,
    });
  } else {
    checks.push({
      category: "Issues",
      check: "Milestone usage",
      status: "warn",
      message: `Only ${issuesWithMilestone.length}/${issues.length} issues have milestones`,
      recommendation: "Assign high-priority issues to a milestone",
    });
  }

  // Stale issues
  const staleIssues = issues.filter(i => daysSince(i.updatedAt) > staleDays);
  if (staleIssues.length === 0) {
    checks.push({
      category: "Issues",
      check: `Stale issues (>${staleDays} days)`,
      status: "pass",
      message: "No stale issues",
    });
  } else {
    checks.push({
      category: "Issues",
      check: `Stale issues (>${staleDays} days)`,
      status: "warn",
      message: `${staleIssues.length} stale issues`,
      details: staleIssues.slice(0, 5).map(i => `#${i.number}: ${i.title} (${daysSince(i.updatedAt)} days)`),
      recommendation: "Review stale issues: close, icebox, or update",
    });
  }

  return checks;
}

function auditPRs(prs: PullRequest[], staleDays: number): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // PR count
  const prCount = prs.length;
  if (prCount === 0) {
    checks.push({
      category: "Pull Requests",
      check: "Open PR count",
      status: "pass",
      message: "No open PRs",
    });
  } else if (prCount > 10) {
    checks.push({
      category: "Pull Requests",
      check: "Open PR count",
      status: "warn",
      message: `${prCount} open PRs (consider merging or closing)`,
      recommendation: "Review and merge or close stale PRs",
    });
  } else {
    checks.push({
      category: "Pull Requests",
      check: "Open PR count",
      status: "pass",
      message: `${prCount} open PRs`,
    });
  }

  // Draft PRs
  const draftPRs = prs.filter(p => p.isDraft);
  const oldDrafts = draftPRs.filter(p => daysSince(p.createdAt) > 14);

  if (oldDrafts.length > 0) {
    checks.push({
      category: "Pull Requests",
      check: "Old draft PRs",
      status: "warn",
      message: `${oldDrafts.length} draft PRs older than 14 days`,
      details: oldDrafts.map(p => `#${p.number}: ${p.title}`),
      recommendation: "Complete or close old draft PRs",
    });
  } else if (draftPRs.length > 0) {
    checks.push({
      category: "Pull Requests",
      check: "Draft PRs",
      status: "info",
      message: `${draftPRs.length} draft PRs (all recent)`,
    });
  }

  // PR descriptions
  const shortDescriptionPRs = prs.filter(p => !p.body || p.body.length < 50);
  if (shortDescriptionPRs.length > 0) {
    checks.push({
      category: "Pull Requests",
      check: "PR descriptions",
      status: "warn",
      message: `${shortDescriptionPRs.length} PRs with short/missing descriptions`,
      details: shortDescriptionPRs.map(p => `#${p.number}: ${p.title}`),
      recommendation: "Add context to PR descriptions (what, why, how to test)",
    });
  } else if (prs.length > 0) {
    checks.push({
      category: "Pull Requests",
      check: "PR descriptions",
      status: "pass",
      message: "All PRs have descriptions",
    });
  }

  // Issue linkage (check for "Closes #", "Fixes #", etc. in body)
  const unlinkedPRs = prs.filter(p => {
    if (!p.body) return true;
    const linkPattern = /(close[sd]?|fix(es|ed)?|resolve[sd]?)\s+#\d+/i;
    return !linkPattern.test(p.body);
  });

  if (unlinkedPRs.length > 0 && prs.length > 0) {
    checks.push({
      category: "Pull Requests",
      check: "Issue linkage",
      status: "warn",
      message: `${unlinkedPRs.length} PRs not linked to issues`,
      details: unlinkedPRs.slice(0, 5).map(p => `#${p.number}: ${p.title}`),
      recommendation: "Link PRs to issues with 'Closes #' or 'Fixes #'",
    });
  } else if (prs.length > 0) {
    checks.push({
      category: "Pull Requests",
      check: "Issue linkage",
      status: "pass",
      message: "All PRs linked to issues",
    });
  }

  return checks;
}

async function auditBranches(commits: Commit[], defaultBranch: string): Promise<AuditCheck[]> {
  const checks: AuditCheck[] = [];

  // Get recent commits to default branch
  const result = await runCommand([
    "git",
    "log",
    `origin/${defaultBranch}`,
    "--oneline",
    "-20",
    "--format=%H %s",
  ]);

  if (!result.success) {
    checks.push({
      category: "Branches",
      check: "Branch analysis",
      status: "info",
      message: "Could not analyze branch commits",
    });
    return checks;
  }

  const commitLines = result.output.split("\n").filter(Boolean);

  // Check for merge commits (indicates PR workflow)
  const mergeCommits = commitLines.filter(line =>
    line.includes("Merge pull request") || line.includes("Merge branch")
  );

  // Check for direct commits (non-merge)
  const directCommits = commitLines.filter(line =>
    !line.includes("Merge pull request") &&
    !line.includes("Merge branch") &&
    !line.includes("Merge remote")
  );

  if (directCommits.length === 0 && mergeCommits.length > 0) {
    checks.push({
      category: "Branches",
      check: "Feature branch workflow",
      status: "pass",
      message: "All recent changes via PRs",
    });
  } else if (directCommits.length > mergeCommits.length) {
    checks.push({
      category: "Branches",
      check: "Feature branch workflow",
      status: "fail",
      message: `${directCommits.length} direct commits vs ${mergeCommits.length} merges`,
      details: directCommits.slice(0, 3).map(c => c.substring(0, 80)),
      recommendation: "Use feature branches and PRs instead of direct commits",
    });
  } else {
    checks.push({
      category: "Branches",
      check: "Feature branch workflow",
      status: "warn",
      message: `${directCommits.length} direct commits, ${mergeCommits.length} merges`,
      recommendation: "Prefer PRs over direct commits for traceability",
    });
  }

  return checks;
}

function auditLabelsAndMilestones(labels: string[], milestones: { title: string; state: string }[]): AuditCheck[] {
  const checks: AuditCheck[] = [];

  // Check for type labels
  const hasTypeLabels = labels.some(l => l.startsWith("type:") || ["bug", "feature", "enhancement"].includes(l));
  if (hasTypeLabels) {
    checks.push({
      category: "Organization",
      check: "Type labels",
      status: "pass",
      message: "Type labels configured",
    });
  } else {
    checks.push({
      category: "Organization",
      check: "Type labels",
      status: "warn",
      message: "No type labels found",
      recommendation: "Create type labels (type:feature, type:bug, type:task)",
    });
  }

  // Check for priority labels
  const hasPriorityLabels = labels.some(l => l.startsWith("priority:") || l.includes("priority"));
  if (hasPriorityLabels) {
    checks.push({
      category: "Organization",
      check: "Priority labels",
      status: "pass",
      message: "Priority labels configured",
    });
  } else {
    checks.push({
      category: "Organization",
      check: "Priority labels",
      status: "info",
      message: "No priority labels found",
      recommendation: "Consider adding priority labels for triage",
    });
  }

  // Check for active milestones
  const activeMilestones = milestones.filter(m => m.state === "open");
  if (activeMilestones.length > 0) {
    checks.push({
      category: "Organization",
      check: "Active milestones",
      status: "pass",
      message: `${activeMilestones.length} active milestone(s)`,
      details: activeMilestones.map(m => m.title),
    });
  } else {
    checks.push({
      category: "Organization",
      check: "Active milestones",
      status: "info",
      message: "No active milestones",
      recommendation: "Create a milestone for current work focus",
    });
  }

  return checks;
}

// === REPORT GENERATION ===

function determineState(checks: AuditCheck[]): string {
  const failures = checks.filter(c => c.status === "fail");
  const warnings = checks.filter(c => c.status === "warn");

  // Check for specific state indicators
  const branchFail = failures.some(c => c.check.includes("branch workflow"));
  const prDescriptionWarn = warnings.some(c => c.check.includes("PR descriptions"));
  const staleWarn = warnings.some(c => c.check.includes("Stale"));
  const labelWarn = warnings.some(c => c.check.includes("Label coverage"));

  if (branchFail) {
    return "GH4: Feature Branch Violations";
  }
  if (prDescriptionWarn || warnings.some(c => c.check.includes("Issue linkage"))) {
    return "GH5: PR Without Context";
  }
  if (staleWarn) {
    return "GH6: Stale Issues/PRs";
  }
  if (labelWarn || warnings.some(c => c.check.includes("Milestone usage"))) {
    return "GH3: Backlog Chaos";
  }

  if (failures.length === 0 && warnings.length <= 2) {
    return "GH8: Workflow Healthy";
  }

  return "Multiple issues detected";
}

function calculateScore(checks: AuditCheck[]): number {
  const total = checks.filter(c => c.status !== "info").length;
  if (total === 0) return 100;

  const passed = checks.filter(c => c.status === "pass").length;
  const warnings = checks.filter(c => c.status === "warn").length;

  const score = (passed + warnings * 0.5) / total;
  return Math.round(score * 100);
}

async function generateReport(options: AuditOptions): Promise<AuditReport> {
  const repoName = await getRepoName();
  const issues = await getOpenIssues();
  const prs = await getOpenPRs();
  const commits = await getRecentCommits();
  const defaultBranch = await getDefaultBranch();
  const labels = await getLabels();
  const milestones = await getMilestones();

  const checks: AuditCheck[] = [
    ...auditIssues(issues, options.staleDays),
    ...auditPRs(prs, options.staleDays),
    ...(await auditBranches(commits, defaultBranch)),
    ...auditLabelsAndMilestones(labels, milestones),
  ];

  // Collect stale items
  const staleIssues = issues
    .filter(i => daysSince(i.updatedAt) > options.staleDays)
    .map(i => ({
      number: i.number,
      title: i.title,
      daysSinceUpdate: daysSince(i.updatedAt),
    }));

  const stalePRs = prs
    .filter(p => daysSince(p.updatedAt) > options.staleDays)
    .map(p => ({
      number: p.number,
      title: p.title,
      daysSinceUpdate: daysSince(p.updatedAt),
    }));

  return {
    timestamp: new Date().toISOString(),
    repository: repoName,
    summary: {
      total: checks.length,
      passed: checks.filter(c => c.status === "pass").length,
      failed: checks.filter(c => c.status === "fail").length,
      warnings: checks.filter(c => c.status === "warn").length,
    },
    score: calculateScore(checks),
    state: determineState(checks),
    checks,
    staleItems: {
      issues: staleIssues,
      prs: stalePRs,
    },
  };
}

function formatReport(report: AuditReport, verbose: boolean): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("GITHUB WORKFLOW AUDIT");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push(`Repository: ${report.repository}`);
  lines.push(`Timestamp: ${report.timestamp}`);
  lines.push("");

  lines.push("-".repeat(60));
  lines.push("SUMMARY");
  lines.push("-".repeat(60));
  lines.push(`Score: ${report.score}/100`);
  lines.push(`State: ${report.state}`);
  lines.push("");
  lines.push(`Checks: ${report.summary.total}`);
  lines.push(`  Passed: ${report.summary.passed}`);
  lines.push(`  Failed: ${report.summary.failed}`);
  lines.push(`  Warnings: ${report.summary.warnings}`);
  lines.push("");

  // Group by category
  const categories = [...new Set(report.checks.map(c => c.category))];

  for (const category of categories) {
    const categoryChecks = report.checks.filter(c => c.category === category);
    lines.push("-".repeat(60));
    lines.push(category.toUpperCase());
    lines.push("-".repeat(60));

    for (const check of categoryChecks) {
      const statusIcon = {
        pass: "[PASS]",
        fail: "[FAIL]",
        warn: "[WARN]",
        info: "[INFO]",
      }[check.status];

      lines.push(`${statusIcon} ${check.check}`);
      lines.push(`       ${check.message}`);

      if (verbose && check.details) {
        for (const detail of check.details) {
          lines.push(`       - ${detail}`);
        }
      }

      if (check.recommendation && check.status !== "pass") {
        lines.push(`       Recommendation: ${check.recommendation}`);
      }
      lines.push("");
    }
  }

  // Failures and warnings summary
  const actionItems = report.checks.filter(c => c.status === "fail" || c.status === "warn");
  if (actionItems.length > 0) {
    lines.push("=".repeat(60));
    lines.push("ACTION ITEMS");
    lines.push("=".repeat(60));
    for (const item of actionItems) {
      const icon = item.status === "fail" ? "[FAIL]" : "[WARN]";
      lines.push(`${icon} ${item.check}: ${item.recommendation || item.message}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): AuditOptions {
  const options: AuditOptions = {
    staleDays: 30,
    verbose: false,
    json: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;
      case "--stale":
      case "-s":
        if (nextArg && !isNaN(parseInt(nextArg))) {
          options.staleDays = parseInt(nextArg);
          i++;
        }
        break;
      case "--verbose":
      case "-v":
        options.verbose = true;
        break;
      case "--json":
        options.json = true;
        break;
    }
  }

  return options;
}

function printHelp(): void {
  console.log(`
GitHub Workflow Audit

Audits current GitHub state against healthy workflow indicators.

USAGE:
  gh-audit.ts [OPTIONS]

OPTIONS:
  --stale, -s <days>   Days threshold for stale items (default: 30)
  --verbose, -v        Show detailed item-by-item analysis
  --json               Output as JSON
  --help, -h           Show this help

CHECKS PERFORMED:
  Issues:
    - Open issue count
    - Label coverage
    - Milestone assignment
    - Stale issue detection

  Pull Requests:
    - Open PR count
    - Draft PR age
    - Description quality
    - Issue linkage

  Branches:
    - Feature branch workflow usage
    - Direct commits to main

  Organization:
    - Type labels configured
    - Priority labels configured
    - Active milestones

EXAMPLES:
  # Basic audit
  gh-audit.ts

  # Verbose output with 60-day stale threshold
  gh-audit.ts --verbose --stale 60

  # JSON output for CI/CD
  gh-audit.ts --json
`);
}

// === MAIN ===

async function main(): Promise<void> {
  const options = parseArgs(Deno.args);

  const report = await generateReport(options);

  if (options.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(formatReport(report, options.verbose));
  }

  // Exit with error if failures
  if (report.summary.failed > 0) {
    Deno.exit(1);
  }
}

main();
