#!/usr/bin/env -S deno run --allow-read

/**
 * analyze-template.ts - Extract structure and content from XLSX files
 *
 * Extracts sheets, cells, formulas, named ranges, and placeholders from Excel
 * spreadsheets for template analysis and content replacement planning.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze-template.ts <input.xlsx> [options]
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *   --pretty         Pretty-print JSON output
 *   --sheet <name>   Analyze only specific sheet
 *
 * Permissions:
 *   --allow-read: Read XLSX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename } from "jsr:@std/path@1.0.8";
// deno-lint-ignore no-explicit-any
import * as XLSX from "npm:xlsx@0.18.5" as any;

// === Types ===

export interface CellInfo {
  address: string;
  row: number;
  col: number;
  value: string | number | boolean | null;
  formula?: string;
  type: "string" | "number" | "boolean" | "date" | "error" | "empty";
  format?: string;
}

export interface PlaceholderInfo {
  tag: string;
  location: string;
  sheet: string;
  address: string;
}

export interface SheetInfo {
  name: string;
  rowCount: number;
  colCount: number;
  usedRange: string;
  cells: CellInfo[];
  mergedCells: string[];
}

export interface NamedRange {
  name: string;
  ref: string;
  scope?: string;
}

export interface SpreadsheetInventory {
  filename: string;
  sheetCount: number;
  sheets: SheetInfo[];
  namedRanges: NamedRange[];
  placeholders: PlaceholderInfo[];
  hasFormulas: boolean;
  hasMacros: boolean;
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  pretty: boolean;
  sheet?: string;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "analyze-template";

// Placeholder patterns: {{PLACEHOLDER}} or ${placeholder}
const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}|\$\{([^}]+)\}/g;

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Extract structure from XLSX templates

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input.xlsx> [options]

Arguments:
  <input.xlsx>     Path to the Excel spreadsheet to analyze

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output (to stderr)
  --pretty         Pretty-print JSON output (default: compact)
  --sheet <name>   Analyze only specific sheet

Examples:
  # Analyze spreadsheet
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.xlsx > inventory.json

  # With verbose output
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.xlsx -v --pretty

  # Analyze specific sheet
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.xlsx --sheet "Data"
`);
}

// === Utility Functions ===

function getCellType(cell: XLSX.CellObject | undefined): CellInfo["type"] {
  if (!cell) return "empty";
  switch (cell.t) {
    case "s": return "string";
    case "n": return "number";
    case "b": return "boolean";
    case "d": return "date";
    case "e": return "error";
    default: return "empty";
  }
}

function getCellValue(cell: XLSX.CellObject | undefined): string | number | boolean | null {
  if (!cell) return null;
  if (cell.v === undefined || cell.v === null) return null;
  return cell.v;
}

function decodeRange(range: string): { startRow: number; startCol: number; endRow: number; endCol: number } {
  const decoded = XLSX.utils.decode_range(range);
  return {
    startRow: decoded.s.r,
    startCol: decoded.s.c,
    endRow: decoded.e.r,
    endCol: decoded.e.c,
  };
}

function findPlaceholders(
  text: string,
  sheet: string,
  address: string
): PlaceholderInfo[] {
  const placeholders: PlaceholderInfo[] = [];
  let match;

  const regex = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    placeholders.push({
      tag: match[0],
      location: `${sheet}!${address}`,
      sheet,
      address,
    });
  }

  return placeholders;
}

// === Core Logic ===

export async function analyzeSpreadsheet(
  xlsxPath: string,
  options: { verbose?: boolean; sheetFilter?: string } = {}
): Promise<SpreadsheetInventory> {
  const { verbose = false, sheetFilter } = options;

  // Read the XLSX file
  const data = await Deno.readFile(xlsxPath);
  const workbook = XLSX.read(data, { type: "array", cellFormula: true, cellStyles: true });

  const filename = basename(xlsxPath);

  if (verbose) {
    console.error(`Analyzing: ${filename}`);
    console.error(`Sheets: ${workbook.SheetNames.join(", ")}`);
  }

  const sheets: SheetInfo[] = [];
  const allPlaceholders: PlaceholderInfo[] = [];
  let hasFormulas = false;

  // Process each sheet
  for (const sheetName of workbook.SheetNames) {
    if (sheetFilter && sheetName !== sheetFilter) {
      continue;
    }

    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) continue;

    const ref = worksheet["!ref"];
    if (!ref) {
      // Empty sheet
      sheets.push({
        name: sheetName,
        rowCount: 0,
        colCount: 0,
        usedRange: "",
        cells: [],
        mergedCells: [],
      });
      continue;
    }

    const range = decodeRange(ref);
    const cells: CellInfo[] = [];

    // Iterate through all cells in range
    for (let row = range.startRow; row <= range.endRow; row++) {
      for (let col = range.startCol; col <= range.endCol; col++) {
        const address = XLSX.utils.encode_cell({ r: row, c: col });
        const cell = worksheet[address] as XLSX.CellObject | undefined;

        if (cell && cell.v !== undefined) {
          const cellInfo: CellInfo = {
            address,
            row: row + 1,  // 1-indexed for display
            col: col + 1,
            value: getCellValue(cell),
            type: getCellType(cell),
          };

          if (cell.f) {
            cellInfo.formula = cell.f;
            hasFormulas = true;
          }

          if (cell.z) {
            cellInfo.format = cell.z;
          }

          cells.push(cellInfo);

          // Check for placeholders in string values
          if (cellInfo.type === "string" && typeof cellInfo.value === "string") {
            const placeholders = findPlaceholders(cellInfo.value, sheetName, address);
            allPlaceholders.push(...placeholders);
          }
        }
      }
    }

    // Get merged cells
    const mergedCells: string[] = [];
    if (worksheet["!merges"]) {
      for (const merge of worksheet["!merges"]) {
        const startCell = XLSX.utils.encode_cell(merge.s);
        const endCell = XLSX.utils.encode_cell(merge.e);
        mergedCells.push(`${startCell}:${endCell}`);
      }
    }

    sheets.push({
      name: sheetName,
      rowCount: range.endRow - range.startRow + 1,
      colCount: range.endCol - range.startCol + 1,
      usedRange: ref,
      cells,
      mergedCells,
    });

    if (verbose) {
      console.error(`Sheet "${sheetName}": ${cells.length} cells, ${mergedCells.length} merged regions`);
    }
  }

  // Get named ranges
  const namedRanges: NamedRange[] = [];
  if (workbook.Workbook?.Names) {
    for (const name of workbook.Workbook.Names) {
      namedRanges.push({
        name: name.Name,
        ref: name.Ref,
        scope: name.Sheet !== undefined ? workbook.SheetNames[name.Sheet] : undefined,
      });
    }
  }

  // Check for macros
  const hasMacros = workbook.vbaraw !== undefined;

  if (verbose) {
    console.error(`Named ranges: ${namedRanges.length}`);
    console.error(`Placeholders found: ${allPlaceholders.length}`);
    console.error(`Has formulas: ${hasFormulas}`);
    console.error(`Has macros: ${hasMacros}`);
  }

  return {
    filename,
    sheetCount: sheets.length,
    sheets,
    namedRanges,
    placeholders: allPlaceholders,
    hasFormulas,
    hasMacros,
  };
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose", "pretty"],
    string: ["sheet"],
    alias: { help: "h", verbose: "v" },
    default: { verbose: false, pretty: false },
  }) as ParsedArgs;

  if (parsed.help) {
    printHelp();
    Deno.exit(0);
  }

  const positionalArgs = parsed._.map(String);

  if (positionalArgs.length === 0) {
    console.error("Error: No input file provided\n");
    printHelp();
    Deno.exit(1);
  }

  const inputPath = positionalArgs[0];

  try {
    const inventory = await analyzeSpreadsheet(inputPath, {
      verbose: parsed.verbose,
      sheetFilter: parsed.sheet,
    });

    const output = parsed.pretty
      ? JSON.stringify(inventory, null, 2)
      : JSON.stringify(inventory);
    console.log(output);
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
