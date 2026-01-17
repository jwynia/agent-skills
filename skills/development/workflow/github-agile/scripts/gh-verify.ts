#!/usr/bin/env -S deno run --allow-run

/**
 * GitHub CLI Verification
 *
 * Verifies GitHub CLI installation and authentication status.
 * Use this to check GH0 state before any GitHub operations.
 *
 * Usage:
 *   deno run --allow-run gh-verify.ts
 *   deno run --allow-run gh-verify.ts --json
 *
 * Exit codes:
 *   0 - All good (gh installed, logged in, in repo)
 *   1 - gh CLI not installed
 *   2 - gh CLI installed but not logged in
 *   3 - Logged in but not in a git repository
 */

// === INTERFACES ===

interface VerifyResult {
  ghInstalled: boolean;
  ghVersion: string | null;
  authenticated: boolean;
  username: string | null;
  authMethod: string | null;
  inRepo: boolean;
  repoName: string | null;
  repoOwner: string | null;
  defaultBranch: string | null;
  recommendations: string[];
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

// === VERIFICATION CHECKS ===

async function checkGhInstalled(): Promise<{
  installed: boolean;
  version: string | null;
}> {
  const result = await runCommand(["gh", "--version"]);

  if (!result.success) {
    return { installed: false, version: null };
  }

  // Parse version from output like "gh version 2.40.1 (2024-01-01)"
  const versionMatch = result.output.match(/gh version (\S+)/);
  const version = versionMatch ? versionMatch[1] : result.output.split("\n")[0];

  return { installed: true, version };
}

async function checkAuthentication(): Promise<{
  authenticated: boolean;
  username: string | null;
  authMethod: string | null;
}> {
  const result = await runCommand(["gh", "auth", "status"]);

  if (!result.success && !result.output && !result.error) {
    return { authenticated: false, username: null, authMethod: null };
  }

  // gh auth status outputs to stderr on success (weird but true)
  const output = result.error || result.output;

  // Check for "Logged in to" pattern
  const loggedIn =
    output.includes("Logged in to") || output.includes("logged in");

  if (!loggedIn) {
    return { authenticated: false, username: null, authMethod: null };
  }

  // Parse username from "Logged in to github.com account username"
  const usernameMatch = output.match(/account\s+(\S+)/i);
  const username = usernameMatch ? usernameMatch[1] : null;

  // Parse auth method
  let authMethod: string | null = null;
  if (output.includes("oauth_token")) authMethod = "oauth_token";
  else if (output.includes("ssh")) authMethod = "ssh";
  else if (output.includes("token")) authMethod = "token";

  return { authenticated: true, username, authMethod };
}

async function checkRepository(): Promise<{
  inRepo: boolean;
  repoName: string | null;
  repoOwner: string | null;
  defaultBranch: string | null;
}> {
  // First check if we're in a git repo
  const gitCheck = await runCommand(["git", "rev-parse", "--is-inside-work-tree"]);

  if (!gitCheck.success || gitCheck.output !== "true") {
    return { inRepo: false, repoName: null, repoOwner: null, defaultBranch: null };
  }

  // Try to get repo info from gh
  const repoResult = await runCommand([
    "gh",
    "repo",
    "view",
    "--json",
    "name,owner,defaultBranchRef",
  ]);

  if (!repoResult.success) {
    // In a git repo but not linked to GitHub or no remote
    return { inRepo: true, repoName: null, repoOwner: null, defaultBranch: null };
  }

  try {
    const repoInfo = JSON.parse(repoResult.output);
    return {
      inRepo: true,
      repoName: repoInfo.name || null,
      repoOwner: repoInfo.owner?.login || null,
      defaultBranch: repoInfo.defaultBranchRef?.name || null,
    };
  } catch {
    return { inRepo: true, repoName: null, repoOwner: null, defaultBranch: null };
  }
}

// === MAIN VERIFICATION ===

async function verify(): Promise<VerifyResult> {
  const recommendations: string[] = [];

  // Check gh installation
  const { installed: ghInstalled, version: ghVersion } = await checkGhInstalled();

  if (!ghInstalled) {
    recommendations.push("Install GitHub CLI: https://cli.github.com/");
    recommendations.push("  macOS: brew install gh");
    recommendations.push("  Linux: sudo apt install gh");
    recommendations.push("  Windows: winget install --id GitHub.cli");
    return {
      ghInstalled: false,
      ghVersion: null,
      authenticated: false,
      username: null,
      authMethod: null,
      inRepo: false,
      repoName: null,
      repoOwner: null,
      defaultBranch: null,
      recommendations,
    };
  }

  // Check authentication
  const { authenticated, username, authMethod } = await checkAuthentication();

  if (!authenticated) {
    recommendations.push("Authenticate with GitHub: gh auth login");
    return {
      ghInstalled: true,
      ghVersion,
      authenticated: false,
      username: null,
      authMethod: null,
      inRepo: false,
      repoName: null,
      repoOwner: null,
      defaultBranch: null,
      recommendations,
    };
  }

  // Check repository context
  const { inRepo, repoName, repoOwner, defaultBranch } = await checkRepository();

  if (!inRepo) {
    recommendations.push("Initialize git repository: git init");
    recommendations.push("Or navigate to an existing git repository");
  } else if (!repoName) {
    recommendations.push("Link repository to GitHub: gh repo create --source=. --push");
    recommendations.push("Or add remote: git remote add origin <url>");
  }

  return {
    ghInstalled,
    ghVersion,
    authenticated,
    username,
    authMethod,
    inRepo,
    repoName,
    repoOwner,
    defaultBranch,
    recommendations,
  };
}

// === OUTPUT FORMATTING ===

function formatResult(result: VerifyResult): string {
  const lines: string[] = [];

  lines.push("=".repeat(50));
  lines.push("GITHUB CLI VERIFICATION");
  lines.push("=".repeat(50));
  lines.push("");

  // Installation status
  const installIcon = result.ghInstalled ? "[OK]" : "[FAIL]";
  lines.push(`${installIcon} GitHub CLI installed`);
  if (result.ghVersion) {
    lines.push(`     Version: ${result.ghVersion}`);
  }
  lines.push("");

  // Authentication status
  if (result.ghInstalled) {
    const authIcon = result.authenticated ? "[OK]" : "[FAIL]";
    lines.push(`${authIcon} Authentication`);
    if (result.authenticated) {
      lines.push(`     User: ${result.username || "unknown"}`);
      if (result.authMethod) {
        lines.push(`     Method: ${result.authMethod}`);
      }
    }
    lines.push("");
  }

  // Repository status
  if (result.authenticated) {
    const repoIcon = result.repoName ? "[OK]" : result.inRepo ? "[WARN]" : "[FAIL]";
    lines.push(`${repoIcon} Repository context`);
    if (result.repoName) {
      lines.push(`     Repo: ${result.repoOwner}/${result.repoName}`);
      if (result.defaultBranch) {
        lines.push(`     Default branch: ${result.defaultBranch}`);
      }
    } else if (result.inRepo) {
      lines.push("     Git repo exists but not linked to GitHub");
    } else {
      lines.push("     Not in a git repository");
    }
    lines.push("");
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push("-".repeat(50));
    lines.push("RECOMMENDATIONS");
    lines.push("-".repeat(50));
    for (const rec of result.recommendations) {
      lines.push(rec);
    }
    lines.push("");
  }

  // Overall status
  lines.push("-".repeat(50));
  if (!result.ghInstalled) {
    lines.push("Status: GH0 - No GitHub CLI");
    lines.push("Next: Install GitHub CLI");
  } else if (!result.authenticated) {
    lines.push("Status: GH0 - Not authenticated");
    lines.push("Next: Run 'gh auth login'");
  } else if (!result.inRepo) {
    lines.push("Status: GH1 - No repository");
    lines.push("Next: Initialize or navigate to a git repository");
  } else if (!result.repoName) {
    lines.push("Status: GH1 - Repository not linked to GitHub");
    lines.push("Next: Link with 'gh repo create' or add remote");
  } else {
    lines.push("Status: Ready for GitHub operations");
  }

  return lines.join("\n");
}

// === ARGUMENT PARSING ===

function parseArgs(args: string[]): { json: boolean } {
  let json = false;

  for (const arg of args) {
    switch (arg) {
      case "--help":
      case "-h":
        printHelp();
        Deno.exit(0);
        break;
      case "--json":
        json = true;
        break;
    }
  }

  return { json };
}

function printHelp(): void {
  console.log(`
GitHub CLI Verification

Verifies GitHub CLI installation and authentication status.

USAGE:
  gh-verify.ts [OPTIONS]

OPTIONS:
  --json       Output as JSON
  --help, -h   Show this help

EXIT CODES:
  0 - All good (gh installed, logged in, in repo with remote)
  1 - gh CLI not installed
  2 - gh CLI installed but not logged in
  3 - Logged in but not in a git repository or no GitHub remote

EXAMPLES:
  # Check status
  gh-verify.ts

  # JSON output for scripting
  gh-verify.ts --json
`);
}

// === MAIN ===

async function main(): Promise<void> {
  const { json } = parseArgs(Deno.args);

  const result = await verify();

  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatResult(result));
  }

  // Set exit code based on status
  if (!result.ghInstalled) {
    Deno.exit(1);
  } else if (!result.authenticated) {
    Deno.exit(2);
  } else if (!result.inRepo || !result.repoName) {
    Deno.exit(3);
  }

  Deno.exit(0);
}

main();
