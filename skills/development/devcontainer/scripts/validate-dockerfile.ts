#!/usr/bin/env -S deno run --allow-read

/**
 * Dockerfile Validator
 *
 * Validates Dockerfiles for common anti-patterns, security issues,
 * and optimization opportunities.
 *
 * Usage:
 *   deno run --allow-read scripts/validate-dockerfile.ts [path-to-dockerfile]
 *
 * If no path provided, searches for Dockerfile or .devcontainer/Dockerfile
 */

interface Issue {
  severity: "error" | "warning" | "info";
  category: string;
  line?: number;
  message: string;
  suggestion?: string;
}

interface DockerfileInstruction {
  line: number;
  instruction: string;
  args: string;
  raw: string;
}

function parseDockerfile(content: string): DockerfileInstruction[] {
  const instructions: DockerfileInstruction[] = [];
  const lines = content.split("\n");

  let currentInstruction = "";
  let currentLine = 0;
  let instructionStart = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (trimmed === "" || trimmed.startsWith("#")) {
      continue;
    }

    // Handle line continuation
    if (currentInstruction) {
      currentInstruction += " " + trimmed.replace(/\\$/, "");
      if (!trimmed.endsWith("\\")) {
        // End of multi-line instruction
        const match = currentInstruction.match(/^(\w+)\s+(.*)/s);
        if (match) {
          instructions.push({
            line: instructionStart + 1,
            instruction: match[1].toUpperCase(),
            args: match[2].trim(),
            raw: currentInstruction,
          });
        }
        currentInstruction = "";
      }
    } else if (trimmed.endsWith("\\")) {
      // Start of multi-line instruction
      currentInstruction = trimmed.replace(/\\$/, "");
      instructionStart = i;
    } else {
      // Single-line instruction
      const match = trimmed.match(/^(\w+)\s*(.*)/);
      if (match) {
        instructions.push({
          line: i + 1,
          instruction: match[1].toUpperCase(),
          args: match[2].trim(),
          raw: trimmed,
        });
      }
    }
  }

  return instructions;
}

function validateDockerfile(content: string, filePath: string): Issue[] {
  const issues: Issue[] = [];
  const instructions = parseDockerfile(content);
  const lines = content.split("\n");

  // Track state
  let hasFrom = false;
  let lastFromLine = 0;
  let hasUser = false;
  let copyAllBeforeDeps = false;
  let runCount = 0;
  let fromCount = 0;

  // Check for FROM instruction
  const fromInstructions = instructions.filter(i => i.instruction === "FROM");
  if (fromInstructions.length === 0) {
    issues.push({
      severity: "error",
      category: "Structure",
      message: "No FROM instruction found",
      suggestion: "Every Dockerfile must start with a FROM instruction",
    });
  } else {
    hasFrom = true;
    fromCount = fromInstructions.length;
    lastFromLine = fromInstructions[fromInstructions.length - 1].line;
  }

  // Analyze each instruction
  for (let i = 0; i < instructions.length; i++) {
    const inst = instructions[i];

    switch (inst.instruction) {
      case "FROM": {
        // Check for :latest tag
        if (inst.args.includes(":latest") || (!inst.args.includes(":") && !inst.args.includes("@"))) {
          const tag = inst.args.includes(":latest") ? ":latest" : "no tag (defaults to :latest)";
          issues.push({
            severity: "warning",
            category: "Reproducibility",
            line: inst.line,
            message: `Base image uses ${tag}`,
            suggestion: "Pin to a specific version for reproducible builds (e.g., node:20-slim, python:3.11)",
          });
        }

        // Check for common large base images
        const largeImages = ["ubuntu", "debian", "centos", "fedora"];
        const baseImage = inst.args.split(":")[0].split("/").pop() || "";
        if (largeImages.includes(baseImage.toLowerCase()) && !inst.args.includes("slim")) {
          issues.push({
            severity: "info",
            category: "Optimization",
            line: inst.line,
            message: `Using full ${baseImage} base image`,
            suggestion: "Consider using slim variant or language-specific images (e.g., python:3.11-slim) for smaller size",
          });
        }

        // Check for microsoft devcontainer images (good!)
        if (inst.args.includes("mcr.microsoft.com/devcontainers")) {
          issues.push({
            severity: "info",
            category: "Best Practice",
            line: inst.line,
            message: "Using official devcontainer base image (good!)",
          });
        }
        break;
      }

      case "RUN": {
        runCount++;

        // Check for apt-get without cleanup
        if (inst.args.includes("apt-get install") && !inst.args.includes("rm -rf /var/lib/apt/lists")) {
          issues.push({
            severity: "warning",
            category: "Optimization",
            line: inst.line,
            message: "apt-get install without cleaning apt cache",
            suggestion: "Add '&& rm -rf /var/lib/apt/lists/*' in the same RUN to reduce layer size",
          });
        }

        // Check for apt-get update in separate RUN
        if (inst.args.trim() === "apt-get update" || inst.args.trim().startsWith("apt-get update &&") === false) {
          if (inst.args.includes("apt-get update") && !inst.args.includes("apt-get install")) {
            issues.push({
              severity: "warning",
              category: "Optimization",
              line: inst.line,
              message: "apt-get update in separate RUN from install",
              suggestion: "Combine 'apt-get update && apt-get install' in one RUN to ensure fresh package lists",
            });
          }
        }

        // Check for pip install without cache disable
        if (inst.args.includes("pip install") && !inst.args.includes("--no-cache-dir")) {
          issues.push({
            severity: "info",
            category: "Optimization",
            line: inst.line,
            message: "pip install without --no-cache-dir",
            suggestion: "Add --no-cache-dir to reduce image size",
          });
        }

        // Check for npm install without cache clean
        if (inst.args.includes("npm install") && !inst.args.includes("npm cache clean")) {
          issues.push({
            severity: "info",
            category: "Optimization",
            line: inst.line,
            message: "npm install without cache cleanup",
            suggestion: "Consider adding 'npm cache clean --force' if image size is a concern",
          });
        }

        // Check for curl/wget without cleanup
        if ((inst.args.includes("curl") || inst.args.includes("wget")) && inst.args.includes("-o")) {
          if (!inst.args.includes("rm ")) {
            issues.push({
              severity: "info",
              category: "Optimization",
              line: inst.line,
              message: "Downloaded file may remain in image",
              suggestion: "If downloading and extracting, remove the archive in the same RUN",
            });
          }
        }
        break;
      }

      case "COPY": {
        // Check for COPY . . before dependency files
        if (inst.args === ". ." || inst.args === ". /app" || inst.args.match(/^\.\s+\/\w+$/)) {
          // Check if this is before package.json/requirements.txt copies
          const laterCopies = instructions.slice(i + 1).filter(x => x.instruction === "COPY");
          const depFileCopies = laterCopies.filter(c =>
            c.args.includes("package") ||
            c.args.includes("requirements") ||
            c.args.includes("Gemfile") ||
            c.args.includes("go.mod") ||
            c.args.includes("Cargo.toml")
          );

          if (depFileCopies.length === 0) {
            // Check if dep files are copied BEFORE this COPY . .
            const earlierCopies = instructions.slice(0, i).filter(x => x.instruction === "COPY");
            const earlierDepCopies = earlierCopies.filter(c =>
              c.args.includes("package") ||
              c.args.includes("requirements") ||
              c.args.includes("Gemfile") ||
              c.args.includes("go.mod") ||
              c.args.includes("Cargo.toml")
            );

            if (earlierDepCopies.length === 0) {
              issues.push({
                severity: "warning",
                category: "Caching",
                line: inst.line,
                message: "'COPY . .' without prior dependency file copy",
                suggestion: "Copy package.json/requirements.txt first, install deps, then COPY . . for better cache utilization",
              });
              copyAllBeforeDeps = true;
            }
          }
        }
        break;
      }

      case "ADD": {
        // ADD is often unnecessary
        if (!inst.args.includes("http") && !inst.args.includes(".tar") && !inst.args.includes(".gz")) {
          issues.push({
            severity: "info",
            category: "Best Practice",
            line: inst.line,
            message: "ADD used instead of COPY",
            suggestion: "Prefer COPY unless you need ADD's auto-extraction or URL features",
          });
        }
        break;
      }

      case "USER": {
        hasUser = true;
        if (inst.args.toLowerCase() === "root") {
          // Check if there are commands after this that need root
          const laterInstructions = instructions.slice(i + 1);
          const hasLaterUserSwitch = laterInstructions.some(x => x.instruction === "USER" && x.args.toLowerCase() !== "root");
          if (!hasLaterUserSwitch) {
            issues.push({
              severity: "warning",
              category: "Security",
              line: inst.line,
              message: "Container may run as root",
              suggestion: "Switch to a non-root user before the final CMD/ENTRYPOINT",
            });
          }
        }
        break;
      }

      case "ENV": {
        // Check for sensitive-looking environment variables
        const sensitivePatterns = ["password", "secret", "key", "token", "credential", "api_key"];
        const argsLower = inst.args.toLowerCase();
        if (sensitivePatterns.some(p => argsLower.includes(p))) {
          issues.push({
            severity: "warning",
            category: "Security",
            line: inst.line,
            message: "Potentially sensitive value in ENV",
            suggestion: "Don't bake secrets into images. Use runtime environment variables or secrets management",
          });
        }
        break;
      }

      case "EXPOSE": {
        // Just informational
        break;
      }

      case "WORKDIR": {
        // Good practice
        break;
      }

      case "CMD":
      case "ENTRYPOINT": {
        // Check for shell form vs exec form
        if (!inst.args.startsWith("[")) {
          issues.push({
            severity: "info",
            category: "Best Practice",
            line: inst.line,
            message: `${inst.instruction} uses shell form`,
            suggestion: "Consider exec form (JSON array) for proper signal handling: [\"executable\", \"param1\"]",
          });
        }
        break;
      }

      case "HEALTHCHECK": {
        // Good practice
        issues.push({
          severity: "info",
          category: "Best Practice",
          line: inst.line,
          message: "HEALTHCHECK defined (good!)",
        });
        break;
      }
    }
  }

  // Global checks

  // No USER instruction
  if (!hasUser && hasFrom) {
    issues.push({
      severity: "warning",
      category: "Security",
      message: "No USER instruction - container will run as root",
      suggestion: "Add 'USER <username>' to run as non-root. Devcontainer images have 'vscode' user available",
    });
  }

  // Too many RUN instructions
  if (runCount > 10) {
    issues.push({
      severity: "info",
      category: "Optimization",
      message: `High number of RUN instructions (${runCount})`,
      suggestion: "Consider combining related RUN commands with && to reduce layers",
    });
  }

  // Multi-stage build detection
  if (fromCount > 1) {
    issues.push({
      severity: "info",
      category: "Best Practice",
      message: `Multi-stage build detected (${fromCount} stages)`,
    });
  }

  // Check for .dockerignore mention
  // This is a heuristic - we can't actually check for the file
  issues.push({
    severity: "info",
    category: "Reminder",
    message: "Ensure .dockerignore exists",
    suggestion: "Exclude node_modules, .git, build artifacts from the build context",
  });

  return issues;
}

function formatIssue(issue: Issue): string {
  const severityEmoji = {
    error: "❌",
    warning: "⚠️",
    info: "ℹ️",
  };

  let output = `${severityEmoji[issue.severity]} [${issue.category}]`;
  if (issue.line) {
    output += ` Line ${issue.line}:`;
  }
  output += ` ${issue.message}`;
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
    console.log("\n🔴 Fix errors before building");
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
      "Dockerfile",
      ".devcontainer/Dockerfile",
      "docker/Dockerfile",
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
    console.error("❌ No Dockerfile found");
    console.error("   Usage: deno run --allow-read validate-dockerfile.ts [path]");
    console.error("   Or run from a directory containing Dockerfile");
    Deno.exit(1);
  }

  console.log(`\n🔍 Validating: ${filePath}\n`);
  console.log("─".repeat(60));

  // Read file
  let content: string;
  try {
    content = await Deno.readTextFile(filePath);
  } catch (error) {
    console.error(`❌ Cannot read ${filePath}`);
    console.error(`   ${error}`);
    Deno.exit(1);
  }

  // Validate
  const issues = validateDockerfile(content, filePath);

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
