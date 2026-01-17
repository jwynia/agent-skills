#!/usr/bin/env -S deno run --allow-run --allow-net

/**
 * Container Image Security Scanner
 *
 * Wraps Trivy for vulnerability scanning of container images.
 * Provides human-readable output with remediation suggestions.
 *
 * Usage:
 *   deno run --allow-run --allow-net scripts/scan-image.ts <image-name>
 *
 * Examples:
 *   deno run --allow-run --allow-net scripts/scan-image.ts node:20-slim
 *   deno run --allow-run --allow-net scripts/scan-image.ts mcr.microsoft.com/devcontainers/base:ubuntu
 *
 * Requires Trivy to be installed:
 *   brew install trivy
 *   # or
 *   curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
 */

interface Vulnerability {
  VulnerabilityID: string;
  PkgName: string;
  InstalledVersion: string;
  FixedVersion?: string;
  Severity: string;
  Title?: string;
  Description?: string;
  PrimaryURL?: string;
}

interface ScanResult {
  Target: string;
  Type: string;
  Vulnerabilities?: Vulnerability[];
}

interface TrivyOutput {
  Results?: ScanResult[];
}

const SEVERITY_ORDER = ["CRITICAL", "HIGH", "MEDIUM", "LOW", "UNKNOWN"];
const SEVERITY_EMOJI: Record<string, string> = {
  CRITICAL: "🔴",
  HIGH: "🟠",
  MEDIUM: "🟡",
  LOW: "🔵",
  UNKNOWN: "⚪",
};

async function checkTrivyInstalled(): Promise<boolean> {
  try {
    const command = new Deno.Command("trivy", {
      args: ["--version"],
      stdout: "null",
      stderr: "null",
    });
    const { code } = await command.output();
    return code === 0;
  } catch {
    return false;
  }
}

async function scanImage(imageName: string): Promise<TrivyOutput | null> {
  console.log(`\n🔍 Scanning image: ${imageName}\n`);
  console.log("This may take a moment for first scan (downloading vulnerability database)...\n");

  try {
    const command = new Deno.Command("trivy", {
      args: [
        "image",
        "--format", "json",
        "--severity", "CRITICAL,HIGH,MEDIUM,LOW",
        imageName,
      ],
      stdout: "piped",
      stderr: "piped",
    });

    const { code, stdout, stderr } = await command.output();

    if (code !== 0) {
      const errorText = new TextDecoder().decode(stderr);
      console.error(`❌ Trivy scan failed:\n${errorText}`);
      return null;
    }

    const outputText = new TextDecoder().decode(stdout);
    return JSON.parse(outputText);
  } catch (error) {
    console.error(`❌ Error running Trivy: ${error}`);
    return null;
  }
}

function summarizeVulnerabilities(results: ScanResult[]): Map<string, Vulnerability[]> {
  const bySeverity = new Map<string, Vulnerability[]>();

  for (const severity of SEVERITY_ORDER) {
    bySeverity.set(severity, []);
  }

  for (const result of results) {
    if (!result.Vulnerabilities) continue;

    for (const vuln of result.Vulnerabilities) {
      const list = bySeverity.get(vuln.Severity) || [];
      list.push(vuln);
      bySeverity.set(vuln.Severity, list);
    }
  }

  return bySeverity;
}

function printSummary(bySeverity: Map<string, Vulnerability[]>): void {
  console.log("─".repeat(60));
  console.log("\n📊 VULNERABILITY SUMMARY\n");

  let total = 0;
  let fixable = 0;

  for (const severity of SEVERITY_ORDER) {
    const vulns = bySeverity.get(severity) || [];
    if (vulns.length === 0) continue;

    const fixableCount = vulns.filter(v => v.FixedVersion).length;
    total += vulns.length;
    fixable += fixableCount;

    console.log(
      `${SEVERITY_EMOJI[severity]} ${severity.padEnd(10)} ${vulns.length.toString().padStart(4)} vulnerabilities (${fixableCount} fixable)`
    );
  }

  console.log("─".repeat(40));
  console.log(`   TOTAL:      ${total} vulnerabilities`);
  console.log(`   FIXABLE:    ${fixable} have patches available`);
}

function printDetails(bySeverity: Map<string, Vulnerability[]>, showAll: boolean): void {
  console.log("\n📋 VULNERABILITY DETAILS\n");

  // Show CRITICAL and HIGH by default, all if requested
  const severitiesToShow = showAll
    ? SEVERITY_ORDER
    : ["CRITICAL", "HIGH"];

  for (const severity of severitiesToShow) {
    const vulns = bySeverity.get(severity) || [];
    if (vulns.length === 0) continue;

    console.log(`\n${SEVERITY_EMOJI[severity]} ${severity} (${vulns.length})\n`);
    console.log("─".repeat(60));

    // Group by package
    const byPackage = new Map<string, Vulnerability[]>();
    for (const vuln of vulns) {
      const list = byPackage.get(vuln.PkgName) || [];
      list.push(vuln);
      byPackage.set(vuln.PkgName, list);
    }

    for (const [pkg, pkgVulns] of byPackage) {
      const firstVuln = pkgVulns[0];
      console.log(`\n  📦 ${pkg} (${firstVuln.InstalledVersion})`);

      if (firstVuln.FixedVersion) {
        console.log(`     💡 Fix: Upgrade to ${firstVuln.FixedVersion}`);
      }

      for (const vuln of pkgVulns.slice(0, 3)) { // Show max 3 per package
        console.log(`     • ${vuln.VulnerabilityID}`);
        if (vuln.Title) {
          const title = vuln.Title.length > 60
            ? vuln.Title.substring(0, 60) + "..."
            : vuln.Title;
          console.log(`       ${title}`);
        }
      }

      if (pkgVulns.length > 3) {
        console.log(`     ... and ${pkgVulns.length - 3} more`);
      }
    }
  }

  if (!showAll) {
    const mediumLow = (bySeverity.get("MEDIUM")?.length || 0) +
      (bySeverity.get("LOW")?.length || 0);
    if (mediumLow > 0) {
      console.log(`\n📝 ${mediumLow} MEDIUM/LOW vulnerabilities not shown. Use --all to see all.`);
    }
  }
}

function printRecommendations(bySeverity: Map<string, Vulnerability[]>): void {
  console.log("\n💡 RECOMMENDATIONS\n");
  console.log("─".repeat(60));

  const critical = bySeverity.get("CRITICAL") || [];
  const high = bySeverity.get("HIGH") || [];

  if (critical.length > 0) {
    console.log("\n🔴 CRITICAL ISSUES - Address immediately:\n");

    // Find packages with critical vulns that have fixes
    const fixableCritical = critical.filter(v => v.FixedVersion);
    const uniquePackages = [...new Set(fixableCritical.map(v => v.PkgName))];

    if (uniquePackages.length > 0) {
      console.log("   Update these packages:");
      for (const pkg of uniquePackages.slice(0, 5)) {
        const vuln = fixableCritical.find(v => v.PkgName === pkg);
        if (vuln) {
          console.log(`   • ${pkg}: ${vuln.InstalledVersion} → ${vuln.FixedVersion}`);
        }
      }
      if (uniquePackages.length > 5) {
        console.log(`   ... and ${uniquePackages.length - 5} more`);
      }
    }

    const unfixableCritical = critical.filter(v => !v.FixedVersion);
    if (unfixableCritical.length > 0) {
      console.log(`\n   ⚠️  ${unfixableCritical.length} critical vulnerabilities have no fix yet.`);
      console.log("   Consider using a different base image or monitoring for patches.");
    }
  }

  if (high.length > 0 && critical.length === 0) {
    console.log("\n🟠 HIGH PRIORITY - Plan to address soon:\n");
    const fixableHigh = high.filter(v => v.FixedVersion);
    console.log(`   ${fixableHigh.length} of ${high.length} have available fixes.`);
  }

  // General recommendations
  console.log("\n📝 GENERAL RECOMMENDATIONS:\n");

  console.log("   1. Update base image regularly");
  console.log("      Use specific version tags and update periodically");
  console.log("");
  console.log("   2. Use minimal base images");
  console.log("      Consider: -slim, -alpine, or distroless variants");
  console.log("");
  console.log("   3. Multi-stage builds");
  console.log("      Don't include build tools in final image");
  console.log("");
  console.log("   4. Regular scanning");
  console.log("      Integrate trivy into CI/CD pipeline");
}

async function main() {
  const args = Deno.args;
  const showAll = args.includes("--all");
  const imageName = args.filter(a => !a.startsWith("--"))[0];

  if (!imageName) {
    console.log(`
🔍 Container Image Security Scanner

Usage:
  deno run --allow-run --allow-net scan-image.ts <image-name> [--all]

Examples:
  scan-image.ts node:20-slim
  scan-image.ts mcr.microsoft.com/devcontainers/base:ubuntu
  scan-image.ts my-app:latest --all

Options:
  --all    Show all vulnerabilities (default shows only CRITICAL and HIGH)

Requires Trivy: brew install trivy
`);
    Deno.exit(1);
  }

  // Check if Trivy is installed
  const trivyInstalled = await checkTrivyInstalled();
  if (!trivyInstalled) {
    console.error(`
❌ Trivy not found

Install Trivy to use this scanner:

  macOS:   brew install trivy
  Linux:   curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh
  Docker:  docker run aquasec/trivy image ${imageName}

More info: https://github.com/aquasecurity/trivy
`);
    Deno.exit(1);
  }

  // Run scan
  const output = await scanImage(imageName);
  if (!output) {
    Deno.exit(1);
  }

  if (!output.Results || output.Results.length === 0) {
    console.log("✅ No vulnerabilities found!");
    Deno.exit(0);
  }

  // Process results
  const bySeverity = summarizeVulnerabilities(output.Results);

  // Check if any vulnerabilities
  let totalVulns = 0;
  for (const vulns of bySeverity.values()) {
    totalVulns += vulns.length;
  }

  if (totalVulns === 0) {
    console.log("✅ No vulnerabilities found!");
    Deno.exit(0);
  }

  // Print results
  printSummary(bySeverity);
  printDetails(bySeverity, showAll);
  printRecommendations(bySeverity);

  // Exit code based on severity
  const critical = bySeverity.get("CRITICAL") || [];
  const high = bySeverity.get("HIGH") || [];

  if (critical.length > 0) {
    console.log("\n🔴 CRITICAL vulnerabilities found - exit code 2");
    Deno.exit(2);
  } else if (high.length > 0) {
    console.log("\n🟠 HIGH vulnerabilities found - exit code 1");
    Deno.exit(1);
  }

  console.log("\n✅ No CRITICAL or HIGH vulnerabilities");
}

main();
