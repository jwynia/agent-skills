#!/usr/bin/env -S deno run --allow-read

/**
 * Fate Roll - The Wheel of Fortune
 *
 * Rolls against fate pressure to determine if a fate-shift occurs.
 * Uses weighted probability based on accumulated pressure.
 *
 * Usage:
 *   deno run --allow-read fate-roll.ts --pressure 0.65
 *   deno run --allow-read fate-roll.ts --pressure 0.75 --danger --fortune 0
 *   deno run --allow-read fate-roll.ts --pressure 0.80 --danger --fortune 0 --name "Kaira the Bold"
 *   deno run --allow-read fate-roll.ts --seed 12345 --pressure 0.65
 */

interface FateRollResult {
  roll: number;
  threshold: number;
  shiftTriggered: boolean;
  severity: "none" | "minor" | "moderate" | "major" | "catastrophic";
  deathEligible: boolean;
  deathRoll?: number;
  deathThreshold?: number;
  deathOccurs?: boolean;
  fortuneDecrement?: boolean;
}

// Seeded random for reproducibility
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  d100(): number {
    return Math.floor(this.next() * 100) + 1;
  }
}

function rollFate(
  fatePressure: number,
  inDanger: boolean,
  fortuneBuffer: number,
  rng: SeededRandom
): FateRollResult {
  const roll = rng.d100();
  const threshold = fatePressure * 100;
  const shiftTriggered = roll < threshold;

  let severity: FateRollResult["severity"] = "none";
  if (shiftTriggered) {
    if (roll < threshold * 0.25) {
      severity = "catastrophic";
    } else if (roll < threshold * 0.50) {
      severity = "major";
    } else if (roll < threshold * 0.75) {
      severity = "moderate";
    } else {
      severity = "minor";
    }
  }

  // Death eligibility: in danger + pressure > 0.5 + fortune < 1
  const deathEligible = inDanger && fatePressure > 0.5 && fortuneBuffer < 1;

  let deathRoll: number | undefined;
  let deathThreshold: number | undefined;
  let deathOccurs: boolean | undefined;
  let fortuneDecrement: boolean | undefined;

  if (deathEligible && shiftTriggered) {
    deathRoll = rng.next();
    // Death threshold: (pressure - 0.5) × 2 × (1 - fortune/5)
    deathThreshold = (fatePressure - 0.5) * 2 * (1 - fortuneBuffer / 5);
    deathOccurs = deathRoll < deathThreshold;

    // If death avoided, fortune decreases
    if (!deathOccurs) {
      fortuneDecrement = true;
    }
  }

  return {
    roll,
    threshold,
    shiftTriggered,
    severity,
    deathEligible,
    deathRoll,
    deathThreshold,
    deathOccurs,
    fortuneDecrement,
  };
}

function formatRollResult(result: FateRollResult, entityName?: string): string {
  const lines: string[] = [];

  lines.push(`FATE ROLL${entityName ? `: ${entityName}` : ""}`);
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`Roll: ${result.roll} vs Threshold ${result.threshold.toFixed(0)}`);
  lines.push("");

  if (result.shiftTriggered) {
    lines.push("THE WHEEL TURNS");
    lines.push("-".repeat(50));
    lines.push(`Fate-shift triggered. Severity: ${result.severity.toUpperCase()}`);
    lines.push("");

    switch (result.severity) {
      case "catastrophic":
        lines.push("The wheel turns heavily. A catastrophic fate-shift is warranted.");
        lines.push("Consider: death, complete fall, total collapse, destruction.");
        break;
      case "major":
        lines.push("A major turn of the wheel. Significant consequences follow.");
        lines.push("Consider: serious wound, major loss, significant decline, defeat.");
        break;
      case "moderate":
        lines.push("The wheel moves. A moderate setback occurs.");
        lines.push("Consider: vulnerability exposed, resource lost, ally turns.");
        break;
      case "minor":
        lines.push("A warning from fate. Minor consequences manifest.");
        lines.push("Consider: reputation damage, small loss, omen of worse to come.");
        break;
    }

    if (result.deathEligible) {
      lines.push("");
      lines.push("DEATH ROLL");
      lines.push("-".repeat(50));
      lines.push("Death eligibility: YES (in danger, pressure > 50%, fortune depleted)");
      lines.push(
        `Death roll: ${(result.deathRoll! * 100).toFixed(1)}% vs threshold ${(result.deathThreshold! * 100).toFixed(1)}%`
      );

      if (result.deathOccurs) {
        lines.push("");
        lines.push("*** DEATH OCCURS ***");
        lines.push("The wheel of fate turns completely. The entity meets their end.");
        lines.push("");
        lines.push("Next steps:");
        lines.push("  1. Run propose-shift.ts to generate death proposal");
        lines.push("  2. Determine narrative hook for the death");
        lines.push("  3. Submit for human approval");
      } else {
        lines.push("");
        lines.push("Death avoided. Fate grants a reprieve this time.");
        if (result.fortuneDecrement) {
          lines.push("Fortune buffer should decrease by 1 (narrow escape).");
        }
      }
    }
  } else {
    lines.push("THE WHEEL HOLDS");
    lines.push("-".repeat(50));
    lines.push("No fate-shift triggered. The entity continues.");
    lines.push("");
    lines.push("Pressure continues to accumulate unless addressed.");
    lines.push("Re-roll at next trigger point (session end, arc completion, etc.).");
  }

  lines.push("");
  lines.push("NEXT STEPS");
  lines.push("-".repeat(50));
  if (result.shiftTriggered) {
    lines.push("1. Determine appropriate shift type based on severity");
    lines.push("2. Consider running fate-choice.ts for Tier 2 choice");
    lines.push("3. Run propose-shift.ts to generate formal proposal");
    lines.push("4. Submit for human approval before applying");
  } else {
    lines.push("1. Continue tracking exposure events");
    lines.push("2. Update vulnerability/protection if changed");
    lines.push("3. Re-roll at next trigger point");
  }

  return lines.join("\n");
}

function showUsage() {
  console.log(`
Fate Roll - The Wheel of Fortune
=================================

Rolls against fate pressure to determine if a fate-shift occurs.

Usage:
  deno run --allow-read fate-roll.ts [options]

Options:
  --pressure <0-1>  Fate pressure (required)
  --danger          Entity is in active danger (enables death roll)
  --fortune <0-5>   Fortune buffer (default: 3)
  --name <name>     Entity name for output
  --seed <n>        Random seed for reproducibility
  --json            Output as JSON

Examples:
  deno run --allow-read fate-roll.ts --pressure 0.65
  deno run --allow-read fate-roll.ts --pressure 0.75 --danger --fortune 0
  deno run --allow-read fate-roll.ts --pressure 0.80 --danger --fortune 0 --name "Kaira"

Mechanics:
  - Roll d100 vs (pressure × 100)
  - If roll < threshold: fate-shift triggered

Severity (based on roll vs threshold):
  < 25%: Catastrophic
  < 50%: Major
  < 75%: Moderate
  < 100%: Minor

Death Eligibility (all required):
  - Entity in danger (--danger flag)
  - Fate pressure > 0.5
  - Fortune buffer < 1

Death Threshold:
  (pressure - 0.5) × 2 × (1 - fortune/5)
`);
}

function main() {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  // Parse arguments
  let pressure = -1;
  let danger = false;
  let fortune = 3;
  let name = "";
  let seed = Date.now();
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--pressure":
        pressure = parseFloat(args[++i]) || -1;
        break;
      case "--danger":
        danger = true;
        break;
      case "--fortune":
        fortune = parseFloat(args[++i]) ?? 3;
        break;
      case "--name":
        name = args[++i] || "";
        break;
      case "--seed":
        seed = parseInt(args[++i]) || Date.now();
        break;
      case "--json":
        jsonOutput = true;
        break;
    }
  }

  if (pressure < 0 || pressure > 1) {
    console.error("Error: --pressure required (value between 0 and 1)");
    console.error("Example: --pressure 0.65");
    Deno.exit(1);
  }

  // Clamp fortune
  fortune = Math.min(Math.max(fortune, 0), 5);

  const rng = new SeededRandom(seed);
  const result = rollFate(pressure, danger, fortune, rng);

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          name: name || undefined,
          fatePressure: pressure,
          inDanger: danger,
          fortuneBuffer: fortune,
          seed,
          ...result,
        },
        null,
        2
      )
    );
  } else {
    console.log(formatRollResult(result, name || undefined));
  }
}

main();
