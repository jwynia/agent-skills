#!/usr/bin/env -S deno run --allow-read

/**
 * analyze-template.ts - Extract content and structure from PDF files
 *
 * Extracts text, metadata, form fields, and page information from PDF
 * documents for template analysis and content planning.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze-template.ts <input.pdf> [options]
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *   --pretty         Pretty-print JSON output
 *   --page <num>     Analyze only specific page (1-indexed)
 *
 * Permissions:
 *   --allow-read: Read PDF file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename } from "jsr:@std/path@1.0.8";
import { extractText, getDocumentProxy } from "npm:unpdf@0.11.0";
import { PDFDocument } from "npm:pdf-lib@1.17.1";

// === Types ===

export interface FormFieldInfo {
  name: string;
  type: "text" | "checkbox" | "radio" | "dropdown" | "button" | "signature" | "unknown";
  value?: string | boolean;
  options?: string[];
  required?: boolean;
  readOnly?: boolean;
}

export interface PageInfo {
  pageNumber: number;
  width: number;
  height: number;
  text: string;
  rotation: number;
}

export interface PlaceholderInfo {
  tag: string;
  location: string;
  pageNumber: number;
}

export interface PDFInventory {
  filename: string;
  pageCount: number;
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  producer?: string;
  creationDate?: string;
  modificationDate?: string;
  pages: PageInfo[];
  formFields: FormFieldInfo[];
  placeholders: PlaceholderInfo[];
  hasFormFields: boolean;
  isEncrypted: boolean;
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  pretty: boolean;
  page?: number;
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
${SCRIPT_NAME} v${VERSION} - Extract content and structure from PDF files

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input.pdf> [options]

Arguments:
  <input.pdf>      Path to the PDF file to analyze

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output (to stderr)
  --pretty         Pretty-print JSON output (default: compact)
  --page <num>     Analyze only specific page (1-indexed)

Examples:
  # Analyze PDF
  deno run --allow-read scripts/${SCRIPT_NAME}.ts document.pdf > inventory.json

  # With verbose output
  deno run --allow-read scripts/${SCRIPT_NAME}.ts document.pdf -v --pretty

  # Analyze specific page
  deno run --allow-read scripts/${SCRIPT_NAME}.ts document.pdf --page 1
`);
}

// === Utility Functions ===

function findPlaceholders(text: string, pageNumber: number): PlaceholderInfo[] {
  const placeholders: PlaceholderInfo[] = [];
  let match;

  const regex = new RegExp(PLACEHOLDER_REGEX.source, "g");
  while ((match = regex.exec(text)) !== null) {
    placeholders.push({
      tag: match[0],
      location: `page ${pageNumber}`,
      pageNumber,
    });
  }

  return placeholders;
}

function formatDate(date: Date | undefined): string | undefined {
  if (!date) return undefined;
  try {
    return date.toISOString();
  } catch {
    return undefined;
  }
}

// === Core Logic ===

export async function analyzePDF(
  pdfPath: string,
  options: { verbose?: boolean; pageFilter?: number } = {}
): Promise<PDFInventory> {
  const { verbose = false, pageFilter } = options;

  // Read the PDF file
  const data = await Deno.readFile(pdfPath);
  const filename = basename(pdfPath);

  if (verbose) {
    console.error(`Analyzing: ${filename}`);
  }

  // Load with pdf-lib for metadata and form fields
  let pdfDoc: PDFDocument;
  let isEncrypted = false;

  try {
    pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
  } catch (error) {
    if (String(error).includes("encrypted")) {
      isEncrypted = true;
      // Try loading without encryption check
      pdfDoc = await PDFDocument.load(data, { ignoreEncryption: true });
    } else {
      throw error;
    }
  }

  const pageCount = pdfDoc.getPageCount();

  if (verbose) {
    console.error(`Pages: ${pageCount}`);
  }

  // Extract metadata
  const title = pdfDoc.getTitle();
  const author = pdfDoc.getAuthor();
  const subject = pdfDoc.getSubject();
  const creator = pdfDoc.getCreator();
  const producer = pdfDoc.getProducer();
  const creationDate = formatDate(pdfDoc.getCreationDate());
  const modificationDate = formatDate(pdfDoc.getModificationDate());

  if (verbose && title) {
    console.error(`Title: ${title}`);
  }

  // Extract form fields
  const formFields: FormFieldInfo[] = [];
  let hasFormFields = false;

  try {
    const form = pdfDoc.getForm();
    const fields = form.getFields();
    hasFormFields = fields.length > 0;

    for (const field of fields) {
      const name = field.getName();
      const fieldType = field.constructor.name;

      // deno-lint-ignore no-explicit-any
      const fieldInfo: FormFieldInfo = {
        name,
        type: "unknown",
      };

      // Determine field type and extract value
      if (fieldType.includes("Text")) {
        fieldInfo.type = "text";
        try {
          // deno-lint-ignore no-explicit-any
          fieldInfo.value = (field as any).getText();
        } catch { /* field may not support getText */ }
      } else if (fieldType.includes("CheckBox")) {
        fieldInfo.type = "checkbox";
        try {
          // deno-lint-ignore no-explicit-any
          fieldInfo.value = (field as any).isChecked();
        } catch { /* field may not support isChecked */ }
      } else if (fieldType.includes("Radio")) {
        fieldInfo.type = "radio";
        try {
          // deno-lint-ignore no-explicit-any
          fieldInfo.value = (field as any).getSelected();
          // deno-lint-ignore no-explicit-any
          fieldInfo.options = (field as any).getOptions();
        } catch { /* field may not support these methods */ }
      } else if (fieldType.includes("Dropdown") || fieldType.includes("OptionList")) {
        fieldInfo.type = "dropdown";
        try {
          // deno-lint-ignore no-explicit-any
          fieldInfo.value = (field as any).getSelected()?.[0];
          // deno-lint-ignore no-explicit-any
          fieldInfo.options = (field as any).getOptions();
        } catch { /* field may not support these methods */ }
      } else if (fieldType.includes("Button")) {
        fieldInfo.type = "button";
      } else if (fieldType.includes("Signature")) {
        fieldInfo.type = "signature";
      }

      // Check if read-only
      try {
        // deno-lint-ignore no-explicit-any
        fieldInfo.readOnly = (field as any).isReadOnly?.();
      } catch { /* method may not exist */ }

      formFields.push(fieldInfo);
    }
  } catch {
    // No form or form access failed
    if (verbose) {
      console.error("No form fields or form access failed");
    }
  }

  if (verbose) {
    console.error(`Form fields: ${formFields.length}`);
  }

  // Extract text using unpdf
  const pages: PageInfo[] = [];
  const allPlaceholders: PlaceholderInfo[] = [];

  try {
    const pdf = await getDocumentProxy(new Uint8Array(data));

    for (let i = 1; i <= pageCount; i++) {
      if (pageFilter && i !== pageFilter) continue;

      // Get page dimensions from pdf-lib
      const pdfPage = pdfDoc.getPage(i - 1);
      const { width, height } = pdfPage.getSize();
      const rotation = pdfPage.getRotation().angle;

      // Extract text for this page
      const { text } = await extractText(pdf, { mergePages: false });
      const pageText = Array.isArray(text) ? text[i - 1] || "" : (i === 1 ? text : "");

      const pageInfo: PageInfo = {
        pageNumber: i,
        width,
        height,
        text: pageText,
        rotation,
      };

      pages.push(pageInfo);

      // Find placeholders in text
      const placeholders = findPlaceholders(pageText, i);
      allPlaceholders.push(...placeholders);

      if (verbose) {
        console.error(`Page ${i}: ${pageText.length} chars, ${placeholders.length} placeholders`);
      }
    }
  } catch (error) {
    if (verbose) {
      console.error(`Text extraction failed: ${error}`);
    }
    // Fall back to just page info without text
    for (let i = 1; i <= pageCount; i++) {
      if (pageFilter && i !== pageFilter) continue;

      const pdfPage = pdfDoc.getPage(i - 1);
      const { width, height } = pdfPage.getSize();
      const rotation = pdfPage.getRotation().angle;

      pages.push({
        pageNumber: i,
        width,
        height,
        text: "",
        rotation,
      });
    }
  }

  if (verbose) {
    console.error(`Total placeholders: ${allPlaceholders.length}`);
  }

  return {
    filename,
    pageCount,
    title,
    author,
    subject,
    creator,
    producer,
    creationDate,
    modificationDate,
    pages,
    formFields,
    placeholders: allPlaceholders,
    hasFormFields,
    isEncrypted,
  };
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose", "pretty"],
    string: ["page"],
    alias: { help: "h", verbose: "v" },
    default: { verbose: false, pretty: false },
  }) as unknown as ParsedArgs;

  // Convert page to number if provided
  if (parsed.page) {
    parsed.page = parseInt(String(parsed.page), 10);
  }

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
    const inventory = await analyzePDF(inputPath, {
      verbose: parsed.verbose,
      pageFilter: parsed.page,
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
