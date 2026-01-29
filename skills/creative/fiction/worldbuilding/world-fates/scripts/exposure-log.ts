#!/usr/bin/env -S deno run --allow-read

/**
 * Exposure Log - Track Risk Events
 *
 * Logs risk exposure events that increase fate pressure.
 * Categorizes events and suggests pressure increments.
 *
 * Usage:
 *   deno run --allow-read exposure-log.ts --event "Survived assassination attempt"
 *   deno run --allow-read exposure-log.ts --event "Secret revealed publicly" --pressure 0.20
 *   deno run --allow-read exposure-log.ts --list
 */

interface ExposureCategory {
  base: number;
  description: string;
  keywords: string[];
}

const EXPOSURE_CATEGORIES: { [key: string]: ExposureCategory } = {
  combat: {
    base: 0.10,
    description: "Active combat, violence, or physical danger",
    keywords: ["combat", "battle", "fight", "wound", "attack", "assassination", "duel"],
  },
  intrigue: {
    base: 0.05,
    description: "Political maneuvering, subtle threats",
    keywords: ["intrigue", "politics", "scheme", "plot", "manipulat", "negotiat"],
  },
  betrayal: {
    base: 0.15,
    description: "Trust violated, ally turns against",
    keywords: ["betray", "turned", "abandon", "traitor", "double-cross"],
  },
  revelation: {
    base: 0.20,
    description: "Secret exposed, truth revealed",
    keywords: ["secret", "reveal", "exposed", "discover", "truth", "uncover"],
  },
  overreach: {
    base: 0.10,
    description: "Hubris, overconfident action",
    keywords: ["hubris", "overconfident", "reckless", "arrogant", "foolish"],
  },
  loss: {
    base: 0.08,
    description: "Resource, ally, or territory lost",
    keywords: ["lost", "death of", "defeat", "lose", "fallen"],
  },
  challenge: {
    base: 0.12,
    description: "Direct challenge to power or status",
    keywords: ["challenge", "rival", "contest", "dispute", "claim"],
  },
  narrow_escape: {
    base: 0.05,
    description: "Survived dangerous situation",
    keywords: ["narrow", "escape", "surviv", "barely", "close call"],
  },
};

function categorizeEvent(eventDescription: string): {
  category: string;
  suggestedPressure: number;
  categoryData: ExposureCategory;
} {
  const lower = eventDescription.toLowerCase();

  for (const [category, data] of Object.entries(EXPOSURE_CATEGORIES)) {
    for (const keyword of data.keywords) {
      if (lower.includes(keyword)) {
        return { category, suggestedPressure: data.base, categoryData: data };
      }
    }
  }

  // Default to intrigue if no match
  return {
    category: "intrigue",
    suggestedPressure: 0.05,
    categoryData: EXPOSURE_CATEGORIES.intrigue,
  };
}

function getDate(): string {
  return new Date().toISOString().split("T")[0];
}

function formatExposureEntry(
  event: string,
  category: string,
  pressure: number,
  name?: string
): string {
  const date = getDate();
  const lines: string[] = [];

  lines.push("EXPOSURE EVENT LOGGED");
  lines.push("=".repeat(50));
  lines.push("");
  if (name) {
    lines.push(`Entity: ${name}`);
  }
  lines.push(`Date: ${date}`);
  lines.push(`Event: ${event}`);
  lines.push(`Category: ${category}`);
  lines.push(`Pressure Increment: +${(pressure * 100).toFixed(1)}%`);
  lines.push("");
  lines.push("WORLD BIBLE ENTRY FORMAT");
  lines.push("-".repeat(50));
  lines.push("Add to entity's Risk Exposure Log section:");
  lines.push("");
  lines.push(`- ${date}: ${event} (+${(pressure * 100).toFixed(0)}% pressure)`);
  lines.push("");
  lines.push("CUMULATIVE EFFECT");
  lines.push("-".repeat(50));
  lines.push("This event adds to the entity's total fate pressure.");
  lines.push("Run fate-pressure.ts to see current total.");

  return lines.join("\n");
}

function showUsage() {
  console.log(`
Exposure Log - Track Risk Events
=================================

Logs risk exposure events that increase fate pressure.

Usage:
  deno run --allow-read exposure-log.ts [options]

Required:
  --event <text>    Description of the exposure event

Optional:
  --pressure <n>    Override suggested pressure increment (0.01-0.30)
  --name <name>     Entity name for context
  --json            Output as JSON for programmatic use

Information:
  --list            List all exposure categories and base pressures

Categories and Base Pressures:
  combat:        +10%  Active combat, violence, physical danger
  intrigue:      +5%   Political maneuvering, subtle threats
  betrayal:      +15%  Trust violated, ally turns against
  revelation:    +20%  Secret exposed, truth revealed
  overreach:     +10%  Hubris, overconfident action
  loss:          +8%   Resource, ally, or territory lost
  challenge:     +12%  Direct challenge to power or status
  narrow_escape: +5%   Survived dangerous situation

Examples:
  deno run --allow-read exposure-log.ts --event "Survived assassination attempt"
  deno run --allow-read exposure-log.ts --event "Secret revealed publicly" --name "Lord Varen"
  deno run --allow-read exposure-log.ts --event "Lost the Battle of the Crossing" --pressure 0.15
`);
}

function main() {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    showUsage();
    Deno.exit(0);
  }

  if (args.includes("--list")) {
    console.log("Exposure Categories");
    console.log("=".repeat(50));
    console.log("");
    for (const [category, data] of Object.entries(EXPOSURE_CATEGORIES)) {
      console.log(`${category.toUpperCase()}`);
      console.log(`  Base pressure: +${(data.base * 100).toFixed(0)}%`);
      console.log(`  Description: ${data.description}`);
      console.log(`  Keywords: ${data.keywords.join(", ")}`);
      console.log("");
    }
    Deno.exit(0);
  }

  // Parse arguments
  let event = "";
  let customPressure: number | undefined;
  let name = "";
  let jsonOutput = false;

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case "--event":
        event = args[++i] || "";
        break;
      case "--pressure":
        customPressure = parseFloat(args[++i]);
        break;
      case "--name":
        name = args[++i] || "";
        break;
      case "--json":
        jsonOutput = true;
        break;
    }
  }

  if (!event) {
    console.error("Error: --event required");
    console.error('Example: --event "Survived assassination attempt"');
    Deno.exit(1);
  }

  const { category, suggestedPressure, categoryData } = categorizeEvent(event);
  const pressure = customPressure !== undefined ? customPressure : suggestedPressure;

  // Clamp pressure
  const clampedPressure = Math.min(Math.max(pressure, 0.01), 0.30);

  if (jsonOutput) {
    console.log(
      JSON.stringify(
        {
          date: getDate(),
          entity: name || undefined,
          event,
          category,
          pressure: clampedPressure,
          categoryDescription: categoryData.description,
        },
        null,
        2
      )
    );
  } else {
    console.log(formatExposureEntry(event, category, clampedPressure, name || undefined));
  }
}

main();
