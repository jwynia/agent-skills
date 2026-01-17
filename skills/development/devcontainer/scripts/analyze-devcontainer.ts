#!/usr/bin/env -S deno run --allow-read

/**
 * Devcontainer Analyzer
 *
 * Analyzes devcontainer.json for common issues and optimization opportunities.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze-devcontainer.ts [path-to-devcontainer.json]
 *
 * If no path provided, searches for .devcontainer/devcontainer.json in current directory.
 */

interface DevcontainerConfig {
  name?: string;
  image?: string;
  build?: {
    dockerfile?: string;
    context?: string;
    args?: Record<string, string>;
  };
  dockerComposeFile?: string | string[];
  service?: string;
  runServices?: string[];
  workspaceFolder?: string;
  workspaceMount?: string;
  forwardPorts?: (number | string)[];
  portsAttributes?: Record<string, unknown>;
  otherPortsAttributes?: unknown;
  features?: Record<string, unknown>;
  overrideFeatureInstallOrder?: string[];
  customizations?: {
    vscode?: {
      extensions?: string[];
      settings?: Record<string, unknown>;
    };
    [key: string]: unknown;
  };
  remoteUser?: string;
  containerUser?: string;
  remoteEnv?: Record<string, string | null>;
  containerEnv?: Record<string, string>;
  updateRemoteUserUID?: boolean;
  userEnvProbe?: string;
  overrideCommand?: boolean;
  shutdownAction?: string;
  init?: boolean;
  privileged?: boolean;
  capAdd?: string[];
  securityOpt?: string[];
  mounts?: unknown[];
  onCreateCommand?: string | string[] | Record<string, string | string[]>;
  updateContentCommand?: string | string[] | Record<string, string | string[]>;
  postCreateCommand?: string | string[] | Record<string, string | string[]>;
  postStartCommand?: string | string[] | Record<string, string | string[]>;
  postAttachCommand?: string | string[] | Record<string, string | string[]>;
  waitFor?: string;
  hostRequirements?: {
    cpus?: number;
    memory?: string;
    storage?: string;
    gpu?: boolean | string | { cores?: number; memory?: string };
  };
}

interface Issue {
  severity: "error" | "warning" | "info";
  category: string;
  message: string;
  suggestion?: string;
}

function analyzeConfig(config: DevcontainerConfig, filePath: string): Issue[] {
  const issues: Issue[] = [];

  // Check for multiple build approaches
  const buildApproaches = [
    config.image !== undefined,
    config.build?.dockerfile !== undefined,
    config.dockerComposeFile !== undefined,
  ].filter(Boolean).length;

  if (buildApproaches === 0) {
    issues.push({
      severity: "error",
      category: "Configuration",
      message: "No container source specified",
      suggestion: "Add 'image', 'build.dockerfile', or 'dockerComposeFile' to define the container source",
    });
  } else if (buildApproaches > 1) {
    issues.push({
      severity: "warning",
      category: "Configuration",
      message: "Multiple build approaches specified (image, dockerfile, dockerComposeFile)",
      suggestion: "Use only ONE approach: image for pre-built, build.dockerfile for custom, or dockerComposeFile for multi-service",
    });
  }

  // Check Docker Compose configuration
  if (config.dockerComposeFile && !config.service) {
    issues.push({
      severity: "error",
      category: "Docker Compose",
      message: "dockerComposeFile specified but no 'service' defined",
      suggestion: "Add 'service' to specify which Compose service to attach to",
    });
  }

  // Analyze features
  if (config.features) {
    const featureCount = Object.keys(config.features).length;
    if (featureCount > 10) {
      issues.push({
        severity: "warning",
        category: "Performance",
        message: `High number of features (${featureCount}) may slow container startup`,
        suggestion: "Review if all features are necessary. Consider consolidating or moving to Dockerfile",
      });
    }

    // Check for potentially conflicting features
    const featureKeys = Object.keys(config.features);
    const pythonFeatures = featureKeys.filter(f => f.includes("python"));
    const nodeFeatures = featureKeys.filter(f => f.includes("node"));

    if (pythonFeatures.length > 1) {
      issues.push({
        severity: "warning",
        category: "Features",
        message: "Multiple Python-related features detected",
        suggestion: "This may cause version conflicts. Use a single Python feature with explicit version",
      });
    }

    if (nodeFeatures.length > 1) {
      issues.push({
        severity: "warning",
        category: "Features",
        message: "Multiple Node.js-related features detected",
        suggestion: "This may cause version conflicts. Use a single Node feature with explicit version",
      });
    }
  }

  // Analyze extensions
  const extensions = config.customizations?.vscode?.extensions || [];
  if (extensions.length > 30) {
    issues.push({
      severity: "warning",
      category: "Performance",
      message: `High number of extensions (${extensions.length}) may slow VS Code startup`,
      suggestion: "Review extensions periodically. Remove unused ones. Consider workspace recommendations instead",
    });
  }

  // Check extension format
  const malformedExtensions = extensions.filter(ext => !ext.includes("."));
  if (malformedExtensions.length > 0) {
    issues.push({
      severity: "error",
      category: "Extensions",
      message: `Malformed extension IDs: ${malformedExtensions.join(", ")}`,
      suggestion: "Extension IDs should be in format 'publisher.extension-name'",
    });
  }

  // Analyze lifecycle commands
  const analyzeCommand = (
    name: string,
    cmd: string | string[] | Record<string, string | string[]> | undefined
  ) => {
    if (!cmd) return;

    const cmdStr = typeof cmd === "string" ? cmd : JSON.stringify(cmd);

    // Check for slow operations in postCreateCommand
    if (name === "postCreateCommand") {
      if (cmdStr.includes("npm install") || cmdStr.includes("yarn install") || cmdStr.includes("pnpm install")) {
        issues.push({
          severity: "warning",
          category: "Performance",
          message: "npm/yarn/pnpm install in postCreateCommand runs every container creation",
          suggestion: "Move to Dockerfile after COPY package*.json to cache dependency installation",
        });
      }

      if (cmdStr.includes("pip install") && !cmdStr.includes("requirements.txt")) {
        issues.push({
          severity: "info",
          category: "Performance",
          message: "pip install in postCreateCommand",
          suggestion: "Consider moving to Dockerfile with COPY requirements.txt for caching",
        });
      }

      if (cmdStr.includes("apt-get") || cmdStr.includes("apt ")) {
        issues.push({
          severity: "warning",
          category: "Performance",
          message: "apt-get in postCreateCommand runs every container creation",
          suggestion: "Move system package installation to Dockerfile for caching",
        });
      }
    }

    // Very long commands might indicate complexity
    if (cmdStr.length > 500) {
      issues.push({
        severity: "info",
        category: "Maintainability",
        message: `${name} is very long (${cmdStr.length} chars)`,
        suggestion: "Consider moving to a shell script for readability and maintainability",
      });
    }
  };

  analyzeCommand("onCreateCommand", config.onCreateCommand);
  analyzeCommand("updateContentCommand", config.updateContentCommand);
  analyzeCommand("postCreateCommand", config.postCreateCommand);
  analyzeCommand("postStartCommand", config.postStartCommand);
  analyzeCommand("postAttachCommand", config.postAttachCommand);

  // Check user configuration
  if (!config.remoteUser && !config.containerUser) {
    issues.push({
      severity: "info",
      category: "Security",
      message: "No remoteUser specified",
      suggestion: "Consider setting remoteUser to avoid running as root. Default devcontainer images have 'vscode' user",
    });
  }

  // Check for privileged mode
  if (config.privileged) {
    issues.push({
      severity: "warning",
      category: "Security",
      message: "Container runs in privileged mode",
      suggestion: "Privileged mode grants full host access. Use only if absolutely necessary (e.g., Docker-in-Docker)",
    });
  }

  // Check for port forwarding issues
  if (config.forwardPorts && config.forwardPorts.length > 20) {
    issues.push({
      severity: "warning",
      category: "Configuration",
      message: `Large number of forwarded ports (${config.forwardPorts.length})`,
      suggestion: "Review if all ports need explicit forwarding. VS Code auto-forwards detected ports",
    });
  }

  // Check workspace configuration
  if (config.dockerComposeFile && !config.workspaceFolder) {
    issues.push({
      severity: "warning",
      category: "Docker Compose",
      message: "Using Docker Compose without explicit workspaceFolder",
      suggestion: "Set workspaceFolder to ensure consistent workspace location across environments",
    });
  }

  // Check for missing name
  if (!config.name) {
    issues.push({
      severity: "info",
      category: "Configuration",
      message: "No 'name' specified for devcontainer",
      suggestion: "Add a descriptive name to identify this devcontainer in VS Code",
    });
  }

  // Check for Codespaces compatibility
  if (config.mounts && Array.isArray(config.mounts)) {
    const hostMounts = config.mounts.filter(m => {
      const mountStr = typeof m === "string" ? m : JSON.stringify(m);
      return mountStr.includes("/home/") || mountStr.includes("/Users/") || mountStr.includes("C:\\");
    });

    if (hostMounts.length > 0) {
      issues.push({
        severity: "warning",
        category: "Codespaces",
        message: "Host-specific mount paths detected",
        suggestion: "Hardcoded host paths will fail in GitHub Codespaces. Use environment variables or conditional mounts",
      });
    }
  }

  return issues;
}

function formatIssue(issue: Issue): string {
  const severityEmoji = {
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  let output = `${severityEmoji[issue.severity]} [${issue.category}] ${issue.message}`;
  if (issue.suggestion) {
    output += `\n   💡 ${issue.suggestion}`;
  }
  return output;
}

function printSummary(issues: Issue[]): void {
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");

  console.log("\n📊 Summary");
  console.log("─".repeat(40));
  console.log(`   Errors:   ${errors.length}`);
  console.log(`   Warnings: ${warnings.length}`);
  console.log(`   Info:     ${infos.length}`);

  if (errors.length === 0 && warnings.length === 0) {
    console.log("\n✅ No critical issues found!");
  } else if (errors.length > 0) {
    console.log("\n🔴 Fix errors before proceeding");
  } else {
    console.log("\n🟡 Review warnings for potential improvements");
  }
}

async function main() {
  // Determine file path
  let filePath = Deno.args[0];

  if (!filePath) {
    // Try common locations
    const commonPaths = [
      ".devcontainer/devcontainer.json",
      ".devcontainer.json",
      "devcontainer.json",
    ];

    for (const path of commonPaths) {
      try {
        await Deno.stat(path);
        filePath = path;
        break;
      } catch {
        // File doesn't exist, try next
      }
    }
  }

  if (!filePath) {
    console.error("❌ No devcontainer.json found");
    console.error("   Usage: deno run --allow-read analyze-devcontainer.ts [path]");
    console.error("   Or run from a directory containing .devcontainer/devcontainer.json");
    Deno.exit(1);
  }

  console.log(`\n🔍 Analyzing: ${filePath}\n`);
  console.log("─".repeat(60));

  // Read and parse file
  let config: DevcontainerConfig;
  try {
    const content = await Deno.readTextFile(filePath);
    // Remove comments (JSON with comments support)
    const cleanContent = content
      .replace(/\/\/.*$/gm, "") // Single-line comments
      .replace(/\/\*[\s\S]*?\*\//g, ""); // Multi-line comments
    config = JSON.parse(cleanContent);
  } catch (error) {
    if (error instanceof SyntaxError) {
      console.error(`❌ Invalid JSON in ${filePath}`);
      console.error(`   ${error.message}`);
      Deno.exit(1);
    }
    throw error;
  }

  // Analyze
  const issues = analyzeConfig(config, filePath);

  // Group by severity
  const errors = issues.filter(i => i.severity === "error");
  const warnings = issues.filter(i => i.severity === "warning");
  const infos = issues.filter(i => i.severity === "info");

  // Print issues
  if (errors.length > 0) {
    console.log("\n🔴 ERRORS\n");
    errors.forEach(i => console.log(formatIssue(i) + "\n"));
  }

  if (warnings.length > 0) {
    console.log("\n🟡 WARNINGS\n");
    warnings.forEach(i => console.log(formatIssue(i) + "\n"));
  }

  if (infos.length > 0) {
    console.log("\nℹ️  INFO\n");
    infos.forEach(i => console.log(formatIssue(i) + "\n"));
  }

  printSummary(issues);

  // Exit with error code if there are errors
  if (errors.length > 0) {
    Deno.exit(1);
  }
}

main();
