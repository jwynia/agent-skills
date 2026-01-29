#!/usr/bin/env -S deno run --allow-read

/**
 * analyze-template.ts - Extract text content and structure from DOCX files
 *
 * Extracts paragraphs, tables, headers, footers, and placeholders from Word documents
 * for template analysis and content replacement planning.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze-template.ts <input.docx> [options]
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *   --pretty         Pretty-print JSON output
 *
 * Permissions:
 *   --allow-read: Read DOCX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename } from "jsr:@std/path@1.0.8";
import JSZip from "npm:jszip@3.10.1";
import { DOMParser } from "npm:@xmldom/xmldom@0.9.6";

// === Types ===
export interface TextRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
}

export interface ParagraphInfo {
  index: number;
  style?: string;
  alignment?: "left" | "center" | "right" | "justify";
  runs: TextRun[];
  fullText: string;
  isListItem: boolean;
  listLevel?: number;
}

export interface TableCellInfo {
  row: number;
  col: number;
  text: string;
  paragraphs: ParagraphInfo[];
}

export interface TableInfo {
  index: number;
  rows: number;
  cols: number;
  cells: TableCellInfo[];
}

export interface HeaderFooterInfo {
  type: "header" | "footer";
  section: "default" | "first" | "even";
  paragraphs: ParagraphInfo[];
}

export interface PlaceholderInfo {
  tag: string;
  location: string;
  paragraphIndex?: number;
  tableIndex?: number;
  cellLocation?: string;
}

export interface DocumentInventory {
  filename: string;
  paragraphCount: number;
  tableCount: number;
  imageCount: number;
  paragraphs: ParagraphInfo[];
  tables: TableInfo[];
  headersFooters: HeaderFooterInfo[];
  placeholders: PlaceholderInfo[];
  styles: string[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  pretty: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "analyze-template";

const NS = {
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
};

// Placeholder pattern: {{PLACEHOLDER}} or ${placeholder}
const PLACEHOLDER_REGEX = /\{\{([^}]+)\}\}|\$\{([^}]+)\}/g;

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Extract text content from DOCX templates

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input.docx> [options]

Arguments:
  <input.docx>     Path to the Word document to analyze

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output (to stderr)
  --pretty         Pretty-print JSON output (default: compact)

Examples:
  # Analyze document
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.docx > inventory.json

  # With verbose output
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.docx -v --pretty
`);
}

// === Utility Functions ===
// deno-lint-ignore no-explicit-any
function getElementsByTagNameNS(parent: any, ns: string, localName: string): any[] {
  const elements = parent.getElementsByTagNameNS(ns, localName);
  // deno-lint-ignore no-explicit-any
  return Array.from(elements) as any[];
}

// deno-lint-ignore no-explicit-any
function getTextContent(element: any): string {
  const textElements = getElementsByTagNameNS(element, NS.w, "t");
  return textElements.map((t) => t.textContent || "").join("");
}

// === Parsing Functions ===
// deno-lint-ignore no-explicit-any
function parseTextRun(rElement: any): TextRun {
  const run: TextRun = {
    text: getTextContent(rElement),
  };

  const rPr = getElementsByTagNameNS(rElement, NS.w, "rPr")[0];
  if (rPr) {
    // Bold
    if (getElementsByTagNameNS(rPr, NS.w, "b").length > 0) {
      run.bold = true;
    }
    // Italic
    if (getElementsByTagNameNS(rPr, NS.w, "i").length > 0) {
      run.italic = true;
    }
    // Underline
    if (getElementsByTagNameNS(rPr, NS.w, "u").length > 0) {
      run.underline = true;
    }
    // Font size
    const sz = getElementsByTagNameNS(rPr, NS.w, "sz")[0];
    if (sz) {
      const val = sz.getAttribute("w:val");
      if (val) run.fontSize = parseInt(val, 10) / 2; // Half-points to points
    }
    // Font family
    const rFonts = getElementsByTagNameNS(rPr, NS.w, "rFonts")[0];
    if (rFonts) {
      run.fontFamily = rFonts.getAttribute("w:ascii") || rFonts.getAttribute("w:hAnsi");
    }
    // Color
    const color = getElementsByTagNameNS(rPr, NS.w, "color")[0];
    if (color) {
      run.color = color.getAttribute("w:val");
    }
  }

  return run;
}

// deno-lint-ignore no-explicit-any
function parseParagraph(pElement: any, index: number): ParagraphInfo {
  const runs = getElementsByTagNameNS(pElement, NS.w, "r").map(parseTextRun);
  const fullText = runs.map((r) => r.text).join("");

  const para: ParagraphInfo = {
    index,
    runs,
    fullText,
    isListItem: false,
  };

  const pPr = getElementsByTagNameNS(pElement, NS.w, "pPr")[0];
  if (pPr) {
    // Style
    const pStyle = getElementsByTagNameNS(pPr, NS.w, "pStyle")[0];
    if (pStyle) {
      para.style = pStyle.getAttribute("w:val");
    }
    // Alignment
    const jc = getElementsByTagNameNS(pPr, NS.w, "jc")[0];
    if (jc) {
      const val = jc.getAttribute("w:val");
      if (val === "left" || val === "center" || val === "right" || val === "both") {
        para.alignment = val === "both" ? "justify" : val;
      }
    }
    // List item
    const numPr = getElementsByTagNameNS(pPr, NS.w, "numPr")[0];
    if (numPr) {
      para.isListItem = true;
      const ilvl = getElementsByTagNameNS(numPr, NS.w, "ilvl")[0];
      if (ilvl) {
        para.listLevel = parseInt(ilvl.getAttribute("w:val") || "0", 10);
      }
    }
  }

  return para;
}

// deno-lint-ignore no-explicit-any
function parseTable(tblElement: any, index: number): TableInfo {
  const rows = getElementsByTagNameNS(tblElement, NS.w, "tr");
  const cells: TableCellInfo[] = [];
  let maxCols = 0;

  rows.forEach((row, rowIndex) => {
    const tcs = getElementsByTagNameNS(row, NS.w, "tc");
    maxCols = Math.max(maxCols, tcs.length);

    tcs.forEach((tc, colIndex) => {
      const paragraphs = getElementsByTagNameNS(tc, NS.w, "p").map((p, i) =>
        parseParagraph(p, i)
      );
      cells.push({
        row: rowIndex,
        col: colIndex,
        text: paragraphs.map((p) => p.fullText).join("\n"),
        paragraphs,
      });
    });
  });

  return {
    index,
    rows: rows.length,
    cols: maxCols,
    cells,
  };
}

function findPlaceholders(
  text: string,
  location: string,
  paragraphIndex?: number,
  tableIndex?: number,
  cellLocation?: string
): PlaceholderInfo[] {
  const placeholders: PlaceholderInfo[] = [];
  let match;

  while ((match = PLACEHOLDER_REGEX.exec(text)) !== null) {
    placeholders.push({
      tag: match[0],
      location,
      paragraphIndex,
      tableIndex,
      cellLocation,
    });
  }

  return placeholders;
}

// deno-lint-ignore no-explicit-any
async function parseDocumentPart(
  zip: JSZip,
  partPath: string,
  type: "header" | "footer",
  section: "default" | "first" | "even"
): Promise<HeaderFooterInfo | null> {
  const file = zip.file(partPath);
  if (!file) return null;

  const xml = await file.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(xml, "text/xml");

  const paragraphs = getElementsByTagNameNS(doc, NS.w, "p").map((p, i) =>
    parseParagraph(p, i)
  );

  return {
    type,
    section,
    paragraphs,
  };
}

// === Core Logic ===
export async function analyzeDocument(
  docxPath: string,
  options: { verbose?: boolean } = {}
): Promise<DocumentInventory> {
  const { verbose = false } = options;

  // Read the DOCX file
  const data = await Deno.readFile(docxPath);
  const zip = await JSZip.loadAsync(data);

  const filename = basename(docxPath);

  // Parse main document
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) {
    throw new Error("Invalid DOCX: missing word/document.xml");
  }

  const documentXml = await documentFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(documentXml, "text/xml");

  // Parse paragraphs
  const bodyParagraphs = getElementsByTagNameNS(doc, NS.w, "p");
  const paragraphs: ParagraphInfo[] = [];
  const allPlaceholders: PlaceholderInfo[] = [];

  let paragraphIndex = 0;
  for (const p of bodyParagraphs) {
    // Skip paragraphs inside tables (they're handled separately)
    // deno-lint-ignore no-explicit-any
    let parent = (p as any).parentNode;
    let inTable = false;
    while (parent) {
      if (parent.localName === "tc") {
        inTable = true;
        break;
      }
      parent = parent.parentNode;
    }

    if (!inTable) {
      const para = parseParagraph(p, paragraphIndex);
      paragraphs.push(para);

      // Find placeholders
      const placeholders = findPlaceholders(
        para.fullText,
        "paragraph",
        paragraphIndex
      );
      allPlaceholders.push(...placeholders);

      paragraphIndex++;
    }
  }

  if (verbose) {
    console.error(`Found ${paragraphs.length} paragraphs`);
  }

  // Parse tables
  const tableElements = getElementsByTagNameNS(doc, NS.w, "tbl");
  const tables = tableElements.map((tbl, i) => {
    const table = parseTable(tbl, i);

    // Find placeholders in table cells
    for (const cell of table.cells) {
      const placeholders = findPlaceholders(
        cell.text,
        "table",
        undefined,
        i,
        `R${cell.row + 1}C${cell.col + 1}`
      );
      allPlaceholders.push(...placeholders);
    }

    return table;
  });

  if (verbose) {
    console.error(`Found ${tables.length} tables`);
  }

  // Count images
  let imageCount = 0;
  zip.forEach((path) => {
    if (path.startsWith("word/media/")) {
      imageCount++;
    }
  });

  if (verbose) {
    console.error(`Found ${imageCount} images`);
  }

  // Parse headers and footers
  const headersFooters: HeaderFooterInfo[] = [];
  const headerFooterFiles = [
    { path: "word/header1.xml", type: "header" as const, section: "default" as const },
    { path: "word/header2.xml", type: "header" as const, section: "first" as const },
    { path: "word/header3.xml", type: "header" as const, section: "even" as const },
    { path: "word/footer1.xml", type: "footer" as const, section: "default" as const },
    { path: "word/footer2.xml", type: "footer" as const, section: "first" as const },
    { path: "word/footer3.xml", type: "footer" as const, section: "even" as const },
  ];

  for (const { path, type, section } of headerFooterFiles) {
    const hf = await parseDocumentPart(zip, path, type, section);
    if (hf && hf.paragraphs.length > 0) {
      headersFooters.push(hf);

      // Find placeholders in headers/footers
      for (const para of hf.paragraphs) {
        const placeholders = findPlaceholders(
          para.fullText,
          `${type}-${section}`,
          para.index
        );
        allPlaceholders.push(...placeholders);
      }
    }
  }

  // Collect unique styles
  const styles = new Set<string>();
  for (const para of paragraphs) {
    if (para.style) styles.add(para.style);
  }

  if (verbose) {
    console.error(`Found ${allPlaceholders.length} placeholders`);
  }

  return {
    filename,
    paragraphCount: paragraphs.length,
    tableCount: tables.length,
    imageCount,
    paragraphs,
    tables,
    headersFooters,
    placeholders: allPlaceholders,
    styles: Array.from(styles),
  };
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose", "pretty"],
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
    const inventory = await analyzeDocument(inputPath, {
      verbose: parsed.verbose,
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
