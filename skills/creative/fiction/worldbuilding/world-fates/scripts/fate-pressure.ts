#!/usr/bin/env -S deno run --allow-read

/**
 * Fate Pressure Calculator
 *
 * Calculates current fate pressure for entities based on:
 * - Power level (1-10)
 * - Tenure modifier (0.5x - 2.5x)
 * - Vulnerability score (0-10)
 * - Protection factor (1-10)
 * - Fortune buffer (0-5)
 * - Risk exposure accumulation
 *
 * Usage:
 *   deno run --allow-read fate-pressure.ts --power 7 --tenure 40 --vulns 3 --prots 2 --fortune 2
 *   deno run --allow-read fate-pressure.ts --interactive
 *   deno run --allow-read fate-pressure.ts --json
 */

interface FatePressureInput {
  powerLevel: number;
  tenureYears: number;
  vulnerabilities: string[];
  protections: string[];
  fortuneBuffer: number;
  exposureLog: { date: string; event: string; pressure: number }[];
}

interface FatePressureResult {
  components: {
    powerLevel: number;
    tenureModifier: number;
    vulnerabilityScore: number;
    protectionFactor: number;
    fortuneBuffer: number;
    riskExposure: number;
  };
  fatePressure: number;
  state: string;
  stateDescription: string;
  interpretation: string;
}

// Tenure modifiers based on duration
function getTenureModifier(years: number): number {
  if (years < 1) return 0.5;
  if (years <= 5) return 1.0;
  if (years <= 20) return 1.5;
  if (years <= 50) return 2.0;
  return 2.5;
}

// Calculate vulnerability score based on type keywords
function calculateVulnerabilityScore(vulnerabilities: string[]): number {
  let score = 0;
  for (const v of vulnerabilities) {
    const lower = v.toLowerCase();
    if (lower.includes("secret") || lower.includes("hidden")) {
      score += 3;
    } else if (lower.includes("flaw") || lower.includes("weakness") || lower.includes("addiction")) {
      score += 2;
    } else if (lower.includes("conflict") || lower.includes("war") || lower.includes("feud")) {
      score += 1.5;
    } else if (lower.includes("enemy") || lower.includes("rival") || lower.includes("opponent")) {
      score += 1;
    } else if (lower.includes("depends") || lower.includes("relies") || lower.includes("needs")) {
      score += 1;
    } else {
      score += 1; // Default weight
    }
  }
  return Math.min(score, 10);
}

// Calculate protection factor based on type keywords
function calculateProtectionFactor(protections: string[]): number {
  let factor = 1; // Base protection (everyone has at least 1)
  for (const p of protections) {
    const lower = p.toLowerCase();
    if (lower.includes("divine") || lower.includes("god") || lower.includes("blessed")) {
      factor += 3;
    } else if (lower.includes("magical") || lower.includes("enchant") || lower.includes("ward")) {
      factor += 3;
    } else if (lower.includes("fortif") || lower.includes("stronghold") || lower.includes("castle")) {
      factor += 2;
    } else if (lower.includes("popular") || lower.includes("beloved") || lower.includes("supported")) {
      factor += 2;
    } else if (lower.includes("ally") || lower.includes("loyal") || lower.includes("friend")) {
      factor += 1;
    } else if (lower.includes("network") || lower.includes("spies") || lower.includes("intelligence")) {
      factor += 1;
    } else {
      factor += 0.5; // Default weight
    }
  }
  return Math.min(factor, 10);
}

// Calculate total risk exposure from log
function calculateRiskExposure(
  exposureLog: { date: string; event: string; pressure: number }[]
): number {
  return exposureLog.reduce((sum, entry) => sum + entry.pressure, 0);
}

// Main calculation
function calculateFatePressure(input: FatePressureInput): FatePressureResult {
  const tenureModifier = getTenureModifier(input.tenureYears);
  const vulnerabilityScore = calculateVulnerabilityScore(input.vulnerabilities);
  const protectionFactor = calculateProtectionFactor(input.protections);
  const riskExposure = calculateRiskExposure(input.exposureLog);

  // Core formula:
  // (Power × TenureMod × VulnScore/10) / (ProtFactor × max(Fortune, 0.5)) + Exposure
  const numerator = input.powerLevel * tenureModifier * (vulnerabilityScore / 10);
  const denominator = protectionFactor * Math.max(input.fortuneBuffer, 0.5);
  let fatePressure = (numerator / denominator) + riskExposure;

  // Clamp to 0-1 range
  fatePressure = Math.min(Math.max(fatePressure, 0), 1);

  // Determine state
  let state: string;
  let stateDescription: string;
  let interpretation: string;

  if (fatePressure < 0.2) {
    state = "F1";
    stateDescription = "Stable Ascent";
    interpretation = "This entity is relatively stable. Monitor for changes but no immediate action needed.";
  } else if (fatePressure < 0.35) {
    state = "F2";
    stateDescription = "Peak Power";
    interpretation = "At peak influence. Consider surfacing hidden vulnerabilities or introducing rivals.";
  } else if (fatePressure < 0.6) {
    state = "F3";
    stateDescription = "Overextension";
    interpretation = "High pressure. Fate-shift likely if pressure continues. Consider Tier 2 choices.";
  } else if (fatePressure < 0.85) {
    state = "F4";
    stateDescription = "Precarious Position";
    interpretation = "Critical pressure. Fate-offered choices should be generated. Death rolls possible.";
  } else {
    state = "F5";
    stateDescription = "Fall in Progress";
    interpretation = "Terminal pressure. Focus on managing the transition and documenting the fall.";
  }

  return {
    components: {
      powerLevel: input.powerLevel,
      tenureModifier,
      vulnerabilityScore,
      protectionFactor,
      fortuneBuffer: input.fortuneBuffer,
      riskExposure,
    },
    fatePressure,
    state,
    stateDescription,
    interpretation,
  };
}

function formatResult(result: FatePressureResult, entityName?: string): string {
  const lines: string[] = [];

  lines.push(`FATE PRESSURE${entityName ? `: ${entityName}` : ""}`);
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Current State: ${result.state} - ${result.stateDescription}`);
  lines.push(`Fate Pressure: ${(result.fatePressure * 100).toFixed(1)}%`);
  lines.push("");
  lines.push("COMPONENT BREAKDOWN");
  lines.push("-".repeat(50));
  lines.push(`  Power Level:        ${result.components.powerLevel}/10`);
  lines.push(`  Tenure Modifier:    ${result.components.tenureModifier}x`);
  lines.push(`  Vulnerability Score: ${result.components.vulnerabilityScore.toFixed(1)}/10`);
  lines.push(`  Protection Factor:   ${result.components.protectionFactor.toFixed(1)}/10`);
  lines.push(`  Fortune Buffer:      ${result.components.fortuneBuffer}/5`);
  lines.push(`  Risk Exposure:       +${(result.components.riskExposure * 100).toFixed(1)}%`);
  lines.push("");
  lines.push("INTERPRETATION");
  lines.push("-".repeat(50));
  lines.push(`  ${result.interpretation}`);
  lines.push("");

  // Add specific recommendations based on state
  lines.push("RECOMMENDATIONS");
  lines.push("-".repeat(50));

  if (result.fatePressure < 0.3) {
    lines.push("  - Log exposure events as they occur");
    lines.push("  - Re-assess after significant events");
  } else if (result.fatePressure < 0.6) {
    lines.push("  - Consider fate-choice.ts for dramatic moments");
    lines.push("  - Track vulnerabilities carefully");
    lines.push("  - Fate-shifts at Moderate or Minor severity possible");
  } else if (result.fatePressure < 0.85) {
    lines.push("  - Run fate-choice.ts to generate Tier 2 choice");
    lines.push("  - Death/fall rolls active if in danger");
    lines.push("  - Consider voluntary NPC transition option");
  } else {
    lines.push("  - Fall is in progress or imminent");
    lines.push("  - Run propose-shift.ts to document the end");
    lines.push("  - Focus on managing consequences for world");
  }

  return lines.join("\n");
}

function showUsage() {
  console.log(`
Fate Pressure Calculator
========================

Calculates fate pressure for entities based on power, tenure,
vulnerabilities, protections, fortune, and exposure.

Usage:
  deno run --allow-read fate-pressure.ts [options]

Options:
  --power <n>       Power level (1-10, default: 5)
  --tenure <years>  Years in power (default: 5)
  --vulns <n>       Number of vulnerabilities (default: 0)
  --prots <n>       Number of protections (default: 0)
  --fortune <n>     Fortune buffer (0-5, default: 3)
  --exposure <n>    Accumulated exposure (0-1, default: 0)
  --name <name>     Entity name for output
  --json            Output as JSON

Examples:
  deno run --allow-read fate-pressure.ts --power 7 --tenure 40 --vulns 5 --prots 3 --fortune 2
  deno run --allow-read fate-pressure.ts --power 9 --tenure 100 --vulns 8 --fortune 0 --name "The Eternal Emperor"

Formula:
  Pressure = (Power × TenureMod × VulnScore/10) / (ProtFactor × Fortune) + Exposure

Tenure Modifiers:
  < 1 year:   0.5x
  1-5 years:  1.0x
  5-20 years: 1.5x
  20-50 years: 2.0x
  50+ years:  2.5x

States:
  F1 (0-20%):  Stable Ascent
  F2 (20-35%): Peak Power
  F3 (35-60%): Overextension
  F4 (60-85%): Precarious Position
  F5 (85%+):  Fall in Progress
`);
}

function main() {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  // Parse arguments
  let power = 5;
  let tenure = 5;
  let vulnCount = 0;
  let protCount = 0;
  let fortune = 3;
  let exposure = 0;
  let name = "";
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--power":
        power = parseInt(args[++i]) || 5;
        break;
      case "--tenure":
        tenure = parseInt(args[++i]) || 5;
        break;
      case "--vulns":
        vulnCount = parseInt(args[++i]) || 0;
        break;
      case "--prots":
        protCount = parseInt(args[++i]) || 0;
        break;
      case "--fortune":
        fortune = parseFloat(args[++i]) ?? 3;
        break;
      case "--exposure":
        exposure = parseFloat(args[++i]) || 0;
        break;
      case "--name":
        name = args[++i] || "";
        break;
      case "--json":
        jsonOutput = true;
        break;
    }
  }

  // Clamp values
  power = Math.min(Math.max(power, 1), 10);
  fortune = Math.min(Math.max(fortune, 0), 5);
  exposure = Math.min(Math.max(exposure, 0), 1);

  // Create synthetic vulnerabilities and protections
  const vulnerabilities: string[] = [];
  for (let i = 0; i < vulnCount; i++) {
    vulnerabilities.push(`vulnerability_${i + 1}`);
  }

  const protections: string[] = [];
  for (let i = 0; i < protCount; i++) {
    protections.push(`protection_${i + 1}`);
  }

  // Create exposure log entry if exposure provided
  const exposureLog: { date: string; event: string; pressure: number }[] = [];
  if (exposure > 0) {
    exposureLog.push({
      date: new Date().toISOString().split("T")[0],
      event: "Accumulated exposure",
      pressure: exposure,
    });
  }

  const input: FatePressureInput = {
    powerLevel: power,
    tenureYears: tenure,
    vulnerabilities,
    protections,
    fortuneBuffer: fortune,
    exposureLog,
  };

  const result = calculateFatePressure(input);

  if (jsonOutput) {
    console.log(JSON.stringify({ name: name || undefined, ...result }, null, 2));
  } else {
    console.log(formatResult(result, name || undefined));
  }
}

main();
