#!/usr/bin/env -S deno run --allow-read

/**
 * {{SCRIPT_TITLE}}
 *
 * {{SCRIPT_DESCRIPTION}}
 *
 * Usage:
 *   deno run --allow-read {{SCRIPT_NAME}}.ts                    # Default behavior
 *   deno run --allow-read {{SCRIPT_NAME}}.ts --option value     # With options
 *   deno run --allow-read {{SCRIPT_NAME}}.ts "input"            # With positional arg
 *   deno run --allow-read {{SCRIPT_NAME}}.ts --json             # JSON output
 */

// === INTERFACES ===

interface {{RESULT_TYPE}} {
  name: string;
  // Add result fields
}

// === DATA ===
// Inline data for simple cases, or load from ../data/ for complex cases

const DATA: Record<string, string[]> = {
  category_one: [
    "Item with specific detail",
    "Another concrete item",
    "Third item for variety",
  ],
  category_two: [
    "Different category item",
    "Second item here",
  ],
};

// === UTILITIES ===

function randomFrom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

// For loading external data files
async function loadData<T>(filename: string): Promise<T> {
  const scriptDir = new URL(".", import.meta.url).pathname;
  const dataPath = `${scriptDir}../data/${filename}`;
  try {
    const text = await Deno.readTextFile(dataPath);
    return JSON.parse(text);
  } catch (e) {
    console.error(`Error loading ${dataPath}: ${e}`);
    Deno.exit(1);
  }
}

// === CORE LOGIC ===

function generate(
  input: string | null,
  option: string | null
): {{RESULT_TYPE}} {
  // Generation logic here

  return {
    name: input || "Default",
    // Populate result
  };
}

// === FORMATTING ===

function formatResult(result: {{RESULT_TYPE}}): string {
  const lines: string[] = [];

  lines.push(`# {{OUTPUT_TITLE}}: ${result.name}\n`);

  // Format sections
  lines.push("## Section\n");
  lines.push("Content here");
  lines.push("");

  return lines.join("\n");
}

function formatBrief(result: {{RESULT_TYPE}}): string {
  return `${result.name} [brief output]`;
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`{{SCRIPT_TITLE}}

{{SCRIPT_DESCRIPTION}}

Usage:
  deno run --allow-read {{SCRIPT_NAME}}.ts [options] [input]

Options:
  --option S    Description of option
                Available: value1, value2, value3
                Default: value1

  --count N     Number of results to generate
                Default: 1

  --brief       Short output format
  --json        Output as JSON

Examples:
  deno run --allow-read {{SCRIPT_NAME}}.ts
  deno run --allow-read {{SCRIPT_NAME}}.ts --option value2
  deno run --allow-read {{SCRIPT_NAME}}.ts "Custom Input" --json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const optionIndex = args.indexOf("--option");
  const countIndex = args.indexOf("--count");
  const jsonOutput = args.includes("--json");
  const briefOutput = args.includes("--brief");

  const option = optionIndex !== -1 && args[optionIndex + 1]
    ? args[optionIndex + 1]
    : null;

  const count = countIndex !== -1 && args[countIndex + 1]
    ? parseInt(args[countIndex + 1]) || 1
    : 1;

  // Build skip indices for positional arg detection
  const skipIndices = new Set<number>();
  if (optionIndex !== -1) {
    skipIndices.add(optionIndex);
    skipIndices.add(optionIndex + 1);
  }
  if (countIndex !== -1) {
    skipIndices.add(countIndex);
    skipIndices.add(countIndex + 1);
  }

  // Find positional argument (first arg that's not a flag)
  let positionalArg: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      positionalArg = args[i];
      break;
    }
  }

  // Generate results
  const results: {{RESULT_TYPE}}[] = [];
  for (let i = 0; i < count; i++) {
    results.push(generate(positionalArg, option));
  }

  // Output
  if (jsonOutput) {
    console.log(JSON.stringify(count === 1 ? results[0] : results, null, 2));
  } else if (briefOutput) {
    for (const result of results) {
      console.log(formatBrief(result));
    }
  } else {
    for (const result of results) {
      console.log(formatResult(result));
      if (results.length > 1) {
        console.log("---\n");
      }
    }
  }
}

main();
