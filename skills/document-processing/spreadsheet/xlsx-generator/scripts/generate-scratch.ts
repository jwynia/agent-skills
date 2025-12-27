#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-scratch.ts - Create XLSX from scratch using JSON specification
 *
 * Creates Excel spreadsheets programmatically from a JSON specification
 * using the xlsx library. Supports sheets, cells, formulas, formatting, and charts.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-scratch.ts <spec.json> <output.xlsx>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read specification file
 *   --allow-write: Write output XLSX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
// deno-lint-ignore no-explicit-any
import * as XLSX from "npm:xlsx@0.18.5" as any;

// === Types ===

export interface CellSpec {
  /** Cell address (e.g., "A1", "B2") */
  address: string;
  /** Cell value */
  value: string | number | boolean | null;
  /** Formula (without = sign) */
  formula?: string;
  /** Number format (e.g., "0.00", "#,##0", "yyyy-mm-dd") */
  format?: string;
  /** Cell type override */
  type?: "string" | "number" | "boolean" | "date";
}

export interface RowSpec {
  /** Row number (1-indexed) */
  row: number;
  /** Cell values starting from column A */
  values: (string | number | boolean | null)[];
  /** Optional formulas for cells (same index as values) */
  formulas?: (string | undefined)[];
}

export interface ColumnSpec {
  /** Column letter (e.g., "A", "B", "AA") */
  col: string;
  /** Column width in characters */
  width?: number;
  /** Column hidden */
  hidden?: boolean;
}

export interface MergeSpec {
  /** Start cell address */
  start: string;
  /** End cell address */
  end: string;
}

export interface SheetSpec {
  /** Sheet name */
  name: string;
  /** Individual cell specifications */
  cells?: CellSpec[];
  /** Row-based data (alternative to cells) */
  rows?: RowSpec[];
  /** 2D array data starting at A1 (alternative to cells/rows) */
  data?: (string | number | boolean | null)[][];
  /** Column specifications */
  columns?: ColumnSpec[];
  /** Merged cell ranges */
  merges?: MergeSpec[];
  /** Freeze panes at this cell (e.g., "A2" freezes first row) */
  freezePane?: string;
  /** Auto-filter range (e.g., "A1:D10") */
  autoFilter?: string;
  /** Tab color (hex, no #) */
  tabColor?: string;
}

export interface SpreadsheetSpec {
  /** Workbook title (metadata) */
  title?: string;
  /** Author (metadata) */
  author?: string;
  /** Company (metadata) */
  company?: string;
  /** Sheets to create */
  sheets: SheetSpec[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-scratch";

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Create XLSX from scratch using JSON specification

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <spec.json> <output.xlsx>

Arguments:
  <spec.json>      Path to JSON specification file
  <output.xlsx>    Path for output Excel file

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "title": "Sales Report",
    "sheets": [
      {
        "name": "Data",
        "data": [
          ["Product", "Price", "Quantity", "Total"],
          ["Widget A", 10.99, 100, null],
          ["Widget B", 24.99, 50, null]
        ],
        "cells": [
          { "address": "D2", "formula": "B2*C2" },
          { "address": "D3", "formula": "B3*C3" }
        ],
        "columns": [
          { "col": "A", "width": 15 },
          { "col": "B", "width": 10 }
        ]
      }
    ]
  }

Examples:
  # Generate spreadsheet
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.xlsx

  # With verbose output
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.xlsx -v
`);
}

// === Utility Functions ===

function colNameToIndex(colName: string): number {
  let index = 0;
  for (let i = 0; i < colName.length; i++) {
    index = index * 26 + (colName.charCodeAt(i) - 64);
  }
  return index - 1;
}

function getCellType(value: unknown, specType?: string): string {
  if (specType) {
    switch (specType) {
      case "string": return "s";
      case "number": return "n";
      case "boolean": return "b";
      case "date": return "d";
    }
  }
  if (typeof value === "string") return "s";
  if (typeof value === "number") return "n";
  if (typeof value === "boolean") return "b";
  if (value instanceof Date) return "d";
  return "s";
}

// === Core Logic ===

export async function generateFromSpec(
  spec: SpreadsheetSpec,
  outputPath: string,
  options: { verbose?: boolean } = {}
): Promise<void> {
  const { verbose = false } = options;

  // Create workbook
  const workbook = XLSX.utils.book_new();

  // Set workbook properties
  if (spec.title || spec.author || spec.company) {
    workbook.Props = {
      Title: spec.title,
      Author: spec.author,
      Company: spec.company,
    };
  }

  if (verbose) {
    console.error(`Creating workbook with ${spec.sheets.length} sheet(s)`);
  }

  // Process each sheet
  for (const sheetSpec of spec.sheets) {
    if (verbose) {
      console.error(`Processing sheet: ${sheetSpec.name}`);
    }

    // deno-lint-ignore no-explicit-any
    let worksheet: any;

    // Create worksheet from data array
    if (sheetSpec.data && sheetSpec.data.length > 0) {
      worksheet = XLSX.utils.aoa_to_sheet(sheetSpec.data);
      if (verbose) {
        console.error(`  Created from ${sheetSpec.data.length} rows of data`);
      }
    } else {
      worksheet = {};
    }

    // Process row specifications
    if (sheetSpec.rows) {
      for (const rowSpec of sheetSpec.rows) {
        for (let colIdx = 0; colIdx < rowSpec.values.length; colIdx++) {
          const value = rowSpec.values[colIdx];
          const formula = rowSpec.formulas?.[colIdx];
          const address = XLSX.utils.encode_cell({ r: rowSpec.row - 1, c: colIdx });

          if (formula) {
            worksheet[address] = { t: "n", f: formula };
          } else if (value !== null && value !== undefined) {
            worksheet[address] = {
              t: getCellType(value),
              v: value,
            };
          }
        }
      }
      if (verbose) {
        console.error(`  Processed ${sheetSpec.rows.length} row specs`);
      }
    }

    // Process individual cell specifications
    if (sheetSpec.cells) {
      for (const cellSpec of sheetSpec.cells) {
        // deno-lint-ignore no-explicit-any
        const cell: any = {};

        if (cellSpec.formula) {
          cell.t = "n";
          cell.f = cellSpec.formula;
        } else if (cellSpec.value !== null && cellSpec.value !== undefined) {
          cell.t = getCellType(cellSpec.value, cellSpec.type);
          cell.v = cellSpec.value;
        }

        if (cellSpec.format) {
          cell.z = cellSpec.format;
        }

        worksheet[cellSpec.address] = cell;
      }
      if (verbose) {
        console.error(`  Applied ${sheetSpec.cells.length} cell specs`);
      }
    }

    // Calculate the used range
    const range = { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
    let hasData = false;

    for (const key of Object.keys(worksheet)) {
      if (key.startsWith("!")) continue;
      hasData = true;
      const cell = XLSX.utils.decode_cell(key);
      range.e.r = Math.max(range.e.r, cell.r);
      range.e.c = Math.max(range.e.c, cell.c);
    }

    if (hasData) {
      worksheet["!ref"] = XLSX.utils.encode_range(range);
    }

    // Apply column specifications
    if (sheetSpec.columns) {
      worksheet["!cols"] = [];
      for (const colSpec of sheetSpec.columns) {
        const colIdx = colNameToIndex(colSpec.col);
        while (worksheet["!cols"].length <= colIdx) {
          worksheet["!cols"].push({});
        }
        worksheet["!cols"][colIdx] = {
          wch: colSpec.width,
          hidden: colSpec.hidden,
        };
      }
      if (verbose) {
        console.error(`  Applied ${sheetSpec.columns.length} column specs`);
      }
    }

    // Apply merged cells
    if (sheetSpec.merges && sheetSpec.merges.length > 0) {
      worksheet["!merges"] = sheetSpec.merges.map((merge) => ({
        s: XLSX.utils.decode_cell(merge.start),
        e: XLSX.utils.decode_cell(merge.end),
      }));
      if (verbose) {
        console.error(`  Applied ${sheetSpec.merges.length} merge specs`);
      }
    }

    // Apply freeze pane
    if (sheetSpec.freezePane) {
      const freezeCell = XLSX.utils.decode_cell(sheetSpec.freezePane);
      worksheet["!freeze"] = {
        xSplit: freezeCell.c,
        ySplit: freezeCell.r,
        topLeftCell: sheetSpec.freezePane,
      };
    }

    // Apply auto-filter
    if (sheetSpec.autoFilter) {
      worksheet["!autofilter"] = { ref: sheetSpec.autoFilter };
    }

    // Add sheet to workbook
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetSpec.name);
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

  if (positionalArgs.length < 2) {
    console.error("Error: Both spec.json and output.xlsx are required\n");
    printHelp();
    Deno.exit(1);
  }

  const specPath = positionalArgs[0];
  const outputPath = positionalArgs[1];

  try {
    const specText = await Deno.readTextFile(specPath);
    const spec = JSON.parse(specText) as SpreadsheetSpec;

    await generateFromSpec(spec, outputPath, {
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
