#!/usr/bin/env -S deno run --allow-env --allow-net

/**
 * [Script Name] - [Brief description]
 *
 * A standalone CLI script for [purpose].
 *
 * Usage:
 *   deno run --allow-env --allow-net scripts/[name].ts [options] <args>
 *   # Or if executable: ./scripts/[name].ts [args]
 *
 * Environment Variables:
 *   [VAR_NAME] - [Description of required env var]
 *
 * Permissions:
 *   --allow-env: [Why needed]
 *   --allow-net: [Why needed]
 *
 * Dependencies: (auto-cached by Deno on first run)
 *   - jsr:@std/cli (argument parsing)
 */

// === Dependencies (pinned versions for reproducibility) ===
// Use jsr: for Deno/TS packages, npm: for Node packages
import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

// === Types ===
interface ScriptOptions {
  help: boolean;
  verbose: boolean;
  // Add script-specific options here
}

interface ParsedArgs extends ScriptOptions {
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "script-name";

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - [Brief description]

Usage:
  deno run --allow-env --allow-net scripts/${SCRIPT_NAME}.ts [options] <args>

Arguments:
  <arg>          [Description of positional argument]

Options:
  -h, --help     Show this help message
  -v, --verbose  Enable verbose output

Examples:
  # Basic usage
  deno run --allow-env scripts/${SCRIPT_NAME}.ts "example"

  # With options
  deno run --allow-env scripts/${SCRIPT_NAME}.ts --verbose "example"
`);
}

// === Core Logic ===
// Export core functions for testing and library use

export async function doSomething(input: string, verbose = false): Promise<string> {
  if (verbose) {
    console.error(`Processing: ${input}`);
  }

  // Implementation here
  return `Result: ${input}`;
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose"],
    alias: { help: "h", verbose: "v" },
    default: { verbose: false },
  }) as ParsedArgs;

  if (parsed.help) {
    printHelp();
    Deno.exit(0);
  }

  const positionalArgs = parsed._.map(String);

  if (positionalArgs.length === 0) {
    console.error("Error: No arguments provided\n");
    printHelp();
    Deno.exit(1);
  }

  try {
    const result = await doSomething(positionalArgs[0], parsed.verbose);
    console.log(result);
  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : String(error));
    Deno.exit(1);
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
