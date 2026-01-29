#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-from-template.ts - Generate XLSX from existing templates
 *
 * Modifies existing Excel templates using placeholder replacement.
 * Finds and replaces tagged content (e.g., {{TITLE}}, ${date}) in cells
 * across all sheets. Preserves formulas, formatting, and structure.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-from-template.ts <template.xlsx> <spec.json> <output.xlsx>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read template and specification files
 *   --allow-write: Write output XLSX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename } from "jsr:@std/path@1.0.8";
// deno-lint-ignore no-explicit-any
import * as XLSX from "npm:xlsx@0.18.5" as any;

// === Types ===

export interface TextReplacement {
  /** The tag to find and replace (e.g., "{{TITLE}}" or "${date}") */
  tag: string;
  /** The replacement value */
  value: string | number | boolean;
  /** Optional: only apply to specific sheets */
  sheets?: string[];
  /** Optional: only apply to specific cell range (e.g., "A1:D10") */
  range?: string;
}

export interface CellUpdate {
  /** Sheet name */
  sheet: string;
  /** Cell address (e.g., "A1") */
  address: string;
  /** New value */
  value: string | number | boolean | null;
  /** Optional formula (without = sign) */
  formula?: string;
}

export interface TemplateSpec {
  /** Text replacements to apply */
  textReplacements?: TextReplacement[];
  /** Direct cell updates */
  cellUpdates?: CellUpdate[];
  /** Sheets to include (all if omitted) */
  includeSheets?: string[];
  /** Sheets to exclude */
  excludeSheets?: string[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-from-template";

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate XLSX from existing templates

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <template.xlsx> <spec.json> <output.xlsx>

Arguments:
  <template.xlsx>  Path to the template Excel file
  <spec.json>      Path to JSON specification for replacements
  <output.xlsx>    Path for output Excel file

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "textReplacements": [
      { "tag": "{{TITLE}}", "value": "Q4 2024 Report" },
      { "tag": "{{DATE}}", "value": "2024-12-15" },
      { "tag": "\${author}", "value": "Finance Team", "sheets": ["Summary"] }
    ],
    "cellUpdates": [
      { "sheet": "Data", "address": "B5", "value": 1250000 },
      { "sheet": "Data", "address": "C5", "formula": "B5*1.1" }
    ]
  }

Examples:
  # Replace text in template
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.xlsx replacements.json output.xlsx

  # With verbose output
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.xlsx replacements.json output.xlsx -v
`);
}

// === Utility Functions ===

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getCellType(value: unknown): string {
  if (typeof value === "string") return "s";
  if (typeof value === "number") return "n";
  if (typeof value === "boolean") return "b";
  if (value instanceof Date) return "d";
  return "s";
}

function isInRange(address: string, range: string): boolean {
  const decoded = XLSX.utils.decode_range(range);
  const cell = XLSX.utils.decode_cell(address);
  return (
    cell.r >= decoded.s.r &&
    cell.r <= decoded.e.r &&
    cell.c >= decoded.s.c &&
    cell.c <= decoded.e.c
  );
}

// === Core Logic ===

interface ReplacementStats {
  replacements: number;
  updates: number;
}

export async function generateFromTemplate(
  templatePath: string,
  spec: TemplateSpec,
  outputPath: string,
  options: { verbose?: boolean } = {}
): Promise<ReplacementStats> {
  const { verbose = false } = options;

  // Read template
  const templateData = await Deno.readFile(templatePath);
  const workbook = XLSX.read(templateData, {
    type: "array",
    cellFormula: true,
    cellStyles: true,
    cellNF: true,
  });

  if (verbose) {
    console.error(`Loaded template: ${basename(templatePath)}`);
    console.error(`Sheets: ${workbook.SheetNames.join(", ")}`);
  }

  const textReplacements = spec.textReplacements || [];
  const cellUpdates = spec.cellUpdates || [];

  if (verbose) {
    console.error(`Text replacements: ${textReplacements.length}`);
    console.error(`Cell updates: ${cellUpdates.length}`);
  }

  let totalReplacements = 0;
  let totalUpdates = 0;

  // Determine which sheets to process
  let sheetsToProcess = [...workbook.SheetNames];
  if (spec.includeSheets && spec.includeSheets.length > 0) {
    sheetsToProcess = sheetsToProcess.filter((s) =>
      spec.includeSheets!.includes(s)
    );
  }
  if (spec.excludeSheets && spec.excludeSheets.length > 0) {
    sheetsToProcess = sheetsToProcess.filter(
      (s) => !spec.excludeSheets!.includes(s)
    );
  }

  // Process each sheet
  for (const sheetName of sheetsToProcess) {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const ref = worksheet["!ref"];
    if (!ref) continue;

    if (verbose) {
      console.error(`Processing sheet: ${sheetName}`);
    }

    let sheetReplacements = 0;

    // Process text replacements
    for (const key of Object.keys(worksheet)) {
      if (key.startsWith("!")) continue;

      const cell = worksheet[key];
      if (!cell || cell.t !== "s" || typeof cell.v !== "string") continue;

      let text = cell.v;
      const originalText = text;

      for (const replacement of textReplacements) {
        // Check sheet filter
        if (replacement.sheets && !replacement.sheets.includes(sheetName)) {
          continue;
        }

        // Check range filter
        if (replacement.range && !isInRange(key, replacement.range)) {
          continue;
        }

        // Perform replacement
        if (text.includes(replacement.tag)) {
          const regex = new RegExp(escapeRegExp(replacement.tag), "g");
          const matches = text.match(regex);
          if (matches) {
            sheetReplacements += matches.length;
          }
          text = text.replace(regex, String(replacement.value));
        }
      }

      if (text !== originalText) {
        // If the entire cell was a placeholder and replacement is a number, use number type
        if (
          originalText.trim() === textReplacements.find((r) => originalText.includes(r.tag))?.tag &&
          typeof textReplacements.find((r) => originalText.includes(r.tag))?.value === "number"
        ) {
          cell.t = "n";
          cell.v = Number(text);
        } else {
          cell.v = text;
        }
        // Clear any cached value
        delete cell.w;
      }
    }

    if (verbose && sheetReplacements > 0) {
      console.error(`  ${sheetReplacements} replacements`);
    }
    totalReplacements += sheetReplacements;
  }

  // Process direct cell updates
  for (const update of cellUpdates) {
    const worksheet = workbook.Sheets[update.sheet];
    if (!worksheet) {
      if (verbose) {
        console.error(`Warning: Sheet "${update.sheet}" not found`);
      }
      continue;
    }

    if (update.formula) {
      worksheet[update.address] = {
        t: "n",
        f: update.formula,
      };
    } else if (update.value !== null && update.value !== undefined) {
      worksheet[update.address] = {
        t: getCellType(update.value),
        v: update.value,
      };
    } else {
      // Clear the cell
      delete worksheet[update.address];
    }

    totalUpdates++;
  }

  if (verbose) {
    console.error(`Total replacements: ${totalReplacements}`);
    console.error(`Total updates: ${totalUpdates}`);
  }

  // Write output file
  const xlsxData = XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx",
    compression: true,
  });

  await Deno.writeFile(outputPath, new Uint8Array(xlsxData));

  if (verbose) {
    console.error(`Wrote ${outputPath}`);
  }

  return { replacements: totalReplacements, updates: totalUpdates };
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

  if (positionalArgs.length < 3) {
    console.error(
      "Error: template.xlsx, spec.json, and output.xlsx are required\n"
    );
    printHelp();
    Deno.exit(1);
  }

  const templatePath = positionalArgs[0];
  const specPath = positionalArgs[1];
  const outputPath = positionalArgs[2];

  try {
    // Read specification
    const specText = await Deno.readTextFile(specPath);
    const spec = JSON.parse(specText) as TemplateSpec;

    await generateFromTemplate(templatePath, spec, outputPath, {
      verbose: parsed.verbose,
    });

    console.log(`Created: ${outputPath}`);
  } catch (error) {
    console.error(
      "Error:",
      error instanceof Error ? error.message : String(error)
    );
    Deno.exit(1);
  }
}

// === Entry Point ===
if (import.meta.main) {
  main(Deno.args);
}
