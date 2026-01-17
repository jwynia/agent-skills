#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Propose Fate-Shift
 *
 * Generates a proposal document for human review before applying
 * changes to the world bible.
 *
 * Usage:
 *   deno run --allow-read --allow-write propose-shift.ts \
 *     --name "Character Name" --type fall --severity major
 *   deno run --allow-read --allow-write propose-shift.ts \
 *     --name "Character Name" --type death --pressure 0.82 --roll 15 --output proposal.md
 */

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface ShiftTypeData {
  description: string;
  severities: { [key: string]: string };
  eligibility?: {
    requiresDanger?: boolean;
    minPressure?: number;
    maxFortuneBuffer?: number;
  };
  narrativeHooks: string[];
}

interface ShiftTypesData {
  character: { [key: string]: ShiftTypeData };
  faction: { [key: string]: ShiftTypeData };
  location: { [key: string]: ShiftTypeData };
}

// Seeded random
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

async function loadShiftTypes(): Promise<ShiftTypesData | null> {
  try {
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const dataPath = join(scriptDir, "..", "data", "shift-types.json");
    const text = await Deno.readTextFile(dataPath);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function getDate(): string {
  return new Date().toISOString().split("T")[0];
}

function generateProposal(
  name: string,
  category: "character" | "faction" | "location",
  shiftType: string,
  severity: string,
  pressure: number,
  roll: number | undefined,
  trigger: string,
  vulnerabilities: string[],
  shiftData: ShiftTypeData,
  rng: SeededRandom
): string {
  const date = getDate();
  const threshold = pressure * 100;
  const narrativeHook = rng.pick(shiftData.narrativeHooks);
  const severityDesc = shiftData.severities[severity] || "Consequences to be determined.";

  const lines: string[] = [];

  lines.push(`# Fate-Shift Proposal: ${name}`);
  lines.push("");
  lines.push(`**Date Generated:** ${date}`);
  lines.push(`**Trigger:** ${trigger}`);
  lines.push(`**Fate Pressure at Assessment:** ${(pressure * 100).toFixed(1)}%`);
  lines.push("");

  lines.push("## Current State Summary");
  lines.push("");
  lines.push(`${name} is a ${category} currently under significant fate pressure.`);
  lines.push("The wheel of fortune has turned against them.");
  lines.push("");

  lines.push("## Vulnerability Analysis");
  lines.push("");
  if (vulnerabilities.length > 0) {
    lines.push("The following vulnerabilities contributed to this fate-shift:");
    for (const v of vulnerabilities) {
      lines.push(`- ${v}`);
    }
  } else {
    lines.push("Vulnerabilities should be documented from the entity's world bible entry.");
  }
  lines.push("");

  lines.push("## The Fate Roll");
  lines.push("");
  if (roll !== undefined) {
    lines.push(`- **Roll:** ${roll}`);
    lines.push(`- **Threshold:** ${threshold.toFixed(0)}`);
  } else {
    lines.push("- **Roll:** [Not recorded - manual proposal]");
    lines.push(`- **Threshold:** ${threshold.toFixed(0)} (based on pressure)`);
  }
  lines.push(`- **Severity:** ${severity.toUpperCase()}`);
  lines.push("");

  lines.push("## Proposed Fate-Shift");
  lines.push("");
  lines.push(`${name} experiences a ${severity} ${shiftType}.`);
  lines.push("");
  lines.push(`**${shiftData.description}**`);
  lines.push("");
  lines.push(severityDesc);
  lines.push("");

  lines.push("### Type");
  lines.push("");
  lines.push(shiftType);
  lines.push("");

  lines.push("### Narrative Hook");
  lines.push("");
  lines.push(narrativeHook);
  lines.push("");

  lines.push("### Consequences");
  lines.push("");
  lines.push(`- **For ${name}:** ${severityDesc}`);

  if (category === "character") {
    lines.push(`- **For the world:** Power vacuum in ${name}'s sphere of influence. Allies and enemies respond.`);
    lines.push("- **For campaigns:** Review active campaigns involving this character for impact.");
  } else if (category === "faction") {
    lines.push(`- **For the world:** ${name}'s ${shiftType} creates opportunities for rivals and instability for allies.`);
    lines.push("- **For campaigns:** Review campaigns with faction involvement for necessary adjustments.");
  } else {
    lines.push(`- **For the world:** The ${shiftType} of ${name} ripples outward, affecting connected locations.`);
    lines.push("- **For campaigns:** Review campaigns set in or connected to this location.");
  }
  lines.push("");

  lines.push("## Alternative Options");
  lines.push("");
  lines.push(`1. Reduce severity to ${getLesserSeverity(severity)} with slower progression`);
  lines.push(`2. Change type to ${getAlternativeType(shiftType, category)} with equivalent severity`);
  lines.push("3. Defer decision and increase pressure by 0.1 for next assessment");
  lines.push("");

  lines.push("## Approval Required");
  lines.push("");
  lines.push("- [ ] Approve as proposed");
  lines.push("- [ ] Approve with modifications: _______________");
  lines.push("- [ ] Reject and explain: _______________");
  lines.push("- [ ] Defer decision to later");
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push(`*Generated by world-fates skill on ${date}*`);

  return lines.join("\n");
}

function getLesserSeverity(severity: string): string {
  const order = ["minor", "moderate", "major", "catastrophic"];
  const index = order.indexOf(severity);
  return index > 0 ? order[index - 1] : "warning sign";
}

function getAlternativeType(shiftType: string, category: string): string {
  const alternatives: { [key: string]: { [key: string]: string[] } } = {
    character: {
      death: ["fall", "exile"],
      fall: ["diminishment", "exile"],
      corruption: ["transformation", "fall"],
      exile: ["fall", "diminishment"],
      transformation: ["corruption", "diminishment"],
      diminishment: ["fall", "transformation"],
    },
    faction: {
      collapse: ["schism", "decline"],
      schism: ["decline", "reformation"],
      absorption: ["decline", "defeat"],
      decline: ["defeat", "schism"],
      reformation: ["schism", "decline"],
      defeat: ["decline", "absorption"],
    },
    location: {
      destruction: ["disaster", "conquest"],
      conquest: ["decline", "isolation"],
      disaster: ["decline", "destruction"],
      decline: ["isolation", "disaster"],
      transformation: ["decline", "isolation"],
      isolation: ["decline", "transformation"],
    },
  };

  const categoryAlts = alternatives[category] || {};
  const typeAlts = categoryAlts[shiftType] || [];
  return typeAlts[0] || "different fate";
}

function showUsage() {
  console.log(`
Propose Fate-Shift
==================

Generates a fate-shift proposal for human review.

Usage:
  deno run --allow-read --allow-write propose-shift.ts [options]

Required:
  --name <name>         Entity name
  --type <type>         Shift type (death, fall, corruption, etc.)
  --severity <level>    Severity (minor, moderate, major, catastrophic)

Optional:
  --category <cat>      Entity category (character, faction, location; default: character)
  --pressure <0-1>      Fate pressure (default: 0.65)
  --roll <1-100>        The roll that triggered this
  --trigger <text>      What triggered assessment (default: "Manual assessment")
  --vulns <csv>         Comma-separated vulnerabilities
  --output <file>       Output file path
  --seed <n>            Random seed

Shift Types by Category:
  character: death, fall, corruption, exile, transformation, diminishment
  faction:   collapse, schism, absorption, decline, reformation, defeat
  location:  destruction, conquest, disaster, decline, transformation, isolation

Severity Levels:
  minor       - Warning sign, reputation damage
  moderate    - Setback, resource lost
  major       - Significant loss, recovery difficult
  catastrophic - Total loss, no return

Examples:
  deno run --allow-read --allow-write propose-shift.ts --name "Lord Varen" --type fall --severity major
  deno run --allow-read --allow-write propose-shift.ts --name "The Iron Guild" --category faction --type decline --severity moderate
  deno run --allow-read --allow-write propose-shift.ts --name "Kaira" --type death --severity catastrophic --pressure 0.82 --roll 15
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  // Load shift types
  const shiftTypesData = await loadShiftTypes();

  // Parse arguments
  let name = "";
  let category: "character" | "faction" | "location" = "character";
  let shiftType = "";
  let severity = "";
  let pressure = 0.65;
  let roll: number | undefined;
  let trigger = "Manual assessment";
  let vulnsStr = "";
  let output = "";
  let seed = Date.now();

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--name":
        name = args[++i] || "";
        break;
      case "--category":
        category = (args[++i] || "character") as "character" | "faction" | "location";
        break;
      case "--type":
        shiftType = args[++i] || "";
        break;
      case "--severity":
        severity = args[++i] || "";
        break;
      case "--pressure":
        pressure = parseFloat(args[++i]) || 0.65;
        break;
      case "--roll":
        roll = parseInt(args[++i]);
        break;
      case "--trigger":
        trigger = args[++i] || "Manual assessment";
        break;
      case "--vulns":
        vulnsStr = args[++i] || "";
        break;
      case "--output":
        output = args[++i] || "";
        break;
      case "--seed":
        seed = parseInt(args[++i]) || Date.now();
        break;
    }
  }

  if (!name) {
    console.error("Error: --name required");
    Deno.exit(1);
  }

  if (!shiftType) {
    console.error("Error: --type required");
    Deno.exit(1);
  }

  if (!severity) {
    console.error("Error: --severity required");
    Deno.exit(1);
  }

  const vulnerabilities = vulnsStr ? vulnsStr.split(",").map((v) => v.trim()) : [];
  const rng = new SeededRandom(seed);

  // Get shift type data
  let shiftData: ShiftTypeData;
  if (shiftTypesData && shiftTypesData[category] && shiftTypesData[category][shiftType]) {
    shiftData = shiftTypesData[category][shiftType];
  } else {
    // Fallback
    shiftData = {
      description: `A ${shiftType} affecting ${category}`,
      severities: {
        minor: "Minor consequences",
        moderate: "Moderate consequences",
        major: "Major consequences",
        catastrophic: "Catastrophic consequences",
      },
      narrativeHooks: ["The circumstances unfold through play"],
    };
  }

  const proposal = generateProposal(
    name,
    category,
    shiftType,
    severity,
    pressure,
    roll,
    trigger,
    vulnerabilities,
    shiftData,
    rng
  );

  if (output) {
    await Deno.writeTextFile(output, proposal);
    console.log(`Proposal written to: ${output}`);
  } else {
    console.log(proposal);
  }
}

main();
