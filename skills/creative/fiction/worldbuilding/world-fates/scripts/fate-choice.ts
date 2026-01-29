#!/usr/bin/env -S deno run --allow-read

/**
 * Fate Choice Generator - Tier 2 Dramatic Choices
 *
 * Generates dramatic choices when fate pressure is high.
 * One path leads to NPC-hood, one path faces the roll,
 * optional third path offers different trade-off.
 *
 * Usage:
 *   deno run --allow-read fate-choice.ts --name "Kaira the Bold" --pressure 0.72
 *   deno run --allow-read fate-choice.ts --name "Kaira" --pressure 0.72 --antagonist "The Dark Queen"
 *   deno run --allow-read fate-choice.ts --name "Kaira" --pressure 0.72 --pattern dark_bargain
 */

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface ChoicePattern {
  description: string;
  triggers: string[];
  paths: {
    [key: string]: {
      outcome: string;
      description: string;
      consequences: string[];
    };
  };
  examples: string[];
}

interface FateChoiceData {
  choice_patterns: { [key: string]: ChoicePattern };
  outcome_types: { [key: string]: unknown };
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

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }
}

async function loadChoiceData(): Promise<FateChoiceData | null> {
  try {
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const dataPath = join(scriptDir, "..", "data", "fate-choices.json");
    const text = await Deno.readTextFile(dataPath);
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function calculateDeathOdds(pressure: number, fortune: number): number {
  if (pressure <= 0.5 || fortune >= 1) return 0;
  return (pressure - 0.5) * 2 * (1 - fortune / 5) * 100;
}

function generateChoice(
  name: string,
  pressure: number,
  fortune: number,
  pattern: ChoicePattern,
  antagonist: string | undefined,
  rng: SeededRandom
): string {
  const lines: string[] = [];
  const deathOdds = calculateDeathOdds(pressure, fortune);

  lines.push(`FATE CHOICE: ${name}`);
  lines.push("=".repeat(50));
  lines.push("");
  lines.push(`The wheel turns. Fate pressure is ${(pressure * 100).toFixed(0)}%.`);
  lines.push("A choice presents itself:");
  lines.push("");

  // Get example and personalize with antagonist if provided
  let situation = rng.pick(pattern.examples);
  if (antagonist) {
    situation = situation.replace(/The Queen of Shadows|the demon|The emperor|the enemy/gi, antagonist);
  }
  lines.push(`"${situation}"`);
  lines.push("");

  // Generate paths
  const pathKeys = Object.keys(pattern.paths);
  const pathLabels = ["A", "B", "C"];

  for (let i = 0; i < pathKeys.length; i++) {
    const key = pathKeys[i];
    const path = pattern.paths[key];
    const label = pathLabels[i];

    lines.push(`${label}) ${key.toUpperCase().replace(/_/g, " ")}`);
    lines.push(`   ${path.description}`);

    for (const consequence of path.consequences) {
      let displayConsequence = consequence;

      // Replace placeholders with actual values
      if (consequence.includes("current odds")) {
        displayConsequence = consequence.replace("current odds", `${deathOdds.toFixed(0)}% death chance`);
      }

      lines.push(`   → ${displayConsequence}`);
    }
    lines.push("");
  }

  lines.push("-".repeat(50));
  lines.push("MECHANICS");
  lines.push("-".repeat(50));
  lines.push(`  Fate Pressure: ${(pressure * 100).toFixed(0)}%`);
  lines.push(`  Fortune Buffer: ${fortune}/5`);
  if (deathOdds > 0) {
    lines.push(`  Death Odds (if roll path): ${deathOdds.toFixed(0)}%`);
  } else {
    lines.push("  Death: Not eligible (fortune > 0 or pressure <= 50%)");
  }
  lines.push("");
  lines.push("NOTES FOR FACILITATOR");
  lines.push("-".repeat(50));
  lines.push("  - Present this choice at a dramatic moment");
  lines.push("  - The NPC path should feel like a real cost, not escape");
  lines.push("  - If they choose to roll, use fate-roll.ts with --danger flag");
  lines.push("  - Honor their choice—this IS the climax");

  return lines.join("\n");
}

function showUsage() {
  console.log(`
Fate Choice Generator
=====================

Generates Tier 2 dramatic choices for high-pressure situations.

Usage:
  deno run --allow-read fate-choice.ts [options]

Required:
  --name <name>        Entity name
  --pressure <0-1>     Fate pressure (should be > 0.6)

Optional:
  --fortune <0-5>      Fortune buffer (default: 0)
  --antagonist <name>  Name to use for tempter/threat
  --pattern <type>     Specific pattern to use
  --seed <n>           Random seed for reproducibility
  --list               List available patterns

Patterns:
  dark_bargain         A powerful entity offers safety at cost of service
  betrayal_escape      Survival requires betraying allies or principles
  corruption_temptation Power or victory available at moral cost
  succession_crisis    Position can only be kept by unacceptable means
  final_stand          No escape, only how the end comes
  prophetic_doom       Fate itself demands the character's end

Examples:
  deno run --allow-read fate-choice.ts --name "Kaira" --pressure 0.72
  deno run --allow-read fate-choice.ts --name "Lord Varen" --pressure 0.85 --antagonist "House Blackwood"
  deno run --allow-read fate-choice.ts --name "Captain Sera" --pressure 0.68 --pattern final_stand

Design Principles:
  - Every path should cost something
  - NPC path = survival but loss of player control
  - Roll path = keep control but risk death/fall
  - Third path = different trade-off
`);
}

async function main() {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  // Load choice data
  const choiceData = await loadChoiceData();
  if (!choiceData) {
    console.error("Warning: Could not load fate-choices.json, using defaults");
  }

  // Parse arguments
  let name = "";
  let pressure = -1;
  let fortune = 0;
  let antagonist: string | undefined;
  let patternName: string | undefined;
  let seed = Date.now();

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--name":
        name = args[++i] || "";
        break;
      case "--pressure":
        pressure = parseFloat(args[++i]) || -1;
        break;
      case "--fortune":
        fortune = parseFloat(args[++i]) ?? 0;
        break;
      case "--antagonist":
        antagonist = args[++i];
        break;
      case "--pattern":
        patternName = args[++i];
        break;
      case "--seed":
        seed = parseInt(args[++i]) || Date.now();
        break;
      case "--list":
        if (choiceData) {
          console.log("Available patterns:");
          for (const [key, pattern] of Object.entries(choiceData.choice_patterns)) {
            console.log(`  ${key}: ${pattern.description}`);
          }
        }
        Deno.exit(0);
    }
  }

  if (!name) {
    console.error("Error: --name required");
    Deno.exit(1);
  }

  if (pressure < 0 || pressure > 1) {
    console.error("Error: --pressure required (value between 0 and 1)");
    Deno.exit(1);
  }

  if (pressure < 0.5) {
    console.warn("Warning: Fate pressure < 50%. Tier 2 choices typically trigger at > 60%.");
  }

  // Clamp fortune
  fortune = Math.min(Math.max(fortune, 0), 5);

  const rng = new SeededRandom(seed);

  // Get or create pattern
  let pattern: ChoicePattern;

  if (choiceData && patternName && choiceData.choice_patterns[patternName]) {
    pattern = choiceData.choice_patterns[patternName];
  } else if (choiceData) {
    // Pick random pattern
    const patterns = Object.values(choiceData.choice_patterns);
    pattern = rng.pick(patterns);
  } else {
    // Fallback default pattern
    pattern = {
      description: "A powerful entity offers safety at the cost of service",
      triggers: ["high_pressure"],
      paths: {
        accept: {
          outcome: "npc_transition",
          description: "Accept the bargain. Survive, but serve.",
          consequences: [
            "Character becomes NPC in antagonist's service",
            "May appear as ally, enemy, or neutral figure later",
            "Player loses control but character persists",
          ],
        },
        refuse: {
          outcome: "fate_roll",
          description: "Refuse. Face what comes.",
          consequences: [
            "Roll death/fall check at current odds",
            "If survived: fortune buffer decreases",
            "If failed: death or major fall",
          ],
        },
        counter: {
          outcome: "complication",
          description: "Make a counter-offer. Change the terms.",
          consequences: [
            "Temporary reprieve",
            "New obligation or debt",
            "Fate pressure temporarily reduced but will return",
          ],
        },
      },
      examples: [
        "The Dark One offers sanctuary—serve them, lose yourself",
        "Your enemy offers pardon in exchange for eternal loyalty",
        "The power offers itself—take it and be changed forever",
      ],
    };
  }

  console.log(generateChoice(name, pressure, fortune, pattern, antagonist, rng));
}

main();
