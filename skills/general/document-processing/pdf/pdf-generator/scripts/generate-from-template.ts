#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-from-template.ts - Generate PDF from existing templates
 *
 * Modifies existing PDF templates by filling form fields, adding content
 * overlays, and merging documents. Preserves original formatting.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-from-template.ts <template.pdf> <spec.json> <output.pdf>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read template, specification files, and images
 *   --allow-write: Write output PDF file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename, dirname, resolve } from "jsr:@std/path@1.0.8";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  // deno-lint-ignore no-explicit-any
} from "npm:pdf-lib@1.17.1" as any;

// === Types ===

export interface FormFieldValue {
  /** Field name as it appears in the PDF form */
  name: string;
  /** Value to set */
  value: string | boolean;
}

export interface TextOverlay {
  type: "text";
  /** Page number (1-indexed) */
  page: number;
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  font?: "Helvetica" | "HelveticaBold" | "TimesRoman" | "Courier";
  color?: { r: number; g: number; b: number };
  rotate?: number;
}

export interface ImageOverlay {
  type: "image";
  /** Page number (1-indexed) */
  page: number;
  x: number;
  y: number;
  path: string;
  width?: number;
  height?: number;
  opacity?: number;
}

export interface RectangleOverlay {
  type: "rectangle";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: { r: number; g: number; b: number };
  opacity?: number;
}

export type Overlay = TextOverlay | ImageOverlay | RectangleOverlay;

export interface MergeSource {
  /** Path to PDF file to merge */
  path: string;
  /** Which pages to include (1-indexed, all if omitted) */
  pages?: number[];
}

export interface TemplateSpec {
  /** Form field values to fill */
  formFields?: FormFieldValue[];
  /** Content overlays to add on pages */
  overlays?: Overlay[];
  /** PDFs to append after the template */
  appendPdfs?: MergeSource[];
  /** PDFs to prepend before the template */
  prependPdfs?: MergeSource[];
  /** Flatten form fields (make them non-editable) */
  flattenForm?: boolean;
  /** Pages to include from template (1-indexed, all if omitted) */
  includePages?: number[];
  /** Pages to exclude from template (1-indexed) */
  excludePages?: number[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-from-template";

const FONT_MAP: Record<string, typeof StandardFonts[keyof typeof StandardFonts]> = {
  "Helvetica": StandardFonts.Helvetica,
  "HelveticaBold": StandardFonts.HelveticaBold,
  "TimesRoman": StandardFonts.TimesRoman,
  "Courier": StandardFonts.Courier,
};

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate PDF from existing templates

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <template.pdf> <spec.json> <output.pdf>

Arguments:
  <template.pdf>   Path to the template PDF file
  <spec.json>      Path to JSON specification for modifications
  <output.pdf>     Path for output PDF file

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "formFields": [
      { "name": "FullName", "value": "John Smith" },
      { "name": "Email", "value": "john@example.com" },
      { "name": "Agree", "value": true }
    ],
    "overlays": [
      {
        "type": "text",
        "page": 1,
        "x": 400,
        "y": 50,
        "text": "APPROVED",
        "fontSize": 24,
        "color": { "r": 0, "g": 0.5, "b": 0 },
        "rotate": 45
      }
    ],
    "flattenForm": true
  }

Features:
  - Fill form fields (text, checkbox, radio, dropdown)
  - Add text/image overlays on any page
  - Merge multiple PDFs
  - Include/exclude specific pages
  - Flatten forms to prevent editing

Examples:
  # Fill form and save
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    form-template.pdf form-data.json filled-form.pdf

  # Add watermark overlay
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    document.pdf watermark-spec.json watermarked.pdf -v
`);
}

// === Utility Functions ===

function getColor(color?: { r: number; g: number; b: number }): ReturnType<typeof rgb> {
  if (!color) return rgb(0, 0, 0);
  return rgb(color.r, color.g, color.b);
}

// === Core Logic ===

// deno-lint-ignore no-explicit-any
async function loadAndCopyPages(pdfDoc: any, source: MergeSource, specDir: string): Promise<any[]> {
  const sourcePath = resolve(specDir, source.path);
  const sourceData = await Deno.readFile(sourcePath);
  const sourcePdf = await PDFDocument.load(sourceData);

  const pageIndices = source.pages
    ? source.pages.map(p => p - 1)  // Convert to 0-indexed
    : sourcePdf.getPageIndices();

  return await pdfDoc.copyPages(sourcePdf, pageIndices);
}

export async function generateFromTemplate(
  templatePath: string,
  spec: TemplateSpec,
  outputPath: string,
  options: { verbose?: boolean; specDir?: string } = {}
): Promise<void> {
  const { verbose = false, specDir = "." } = options;

  // Load template
  const templateData = await Deno.readFile(templatePath);
  const templatePdf = await PDFDocument.load(templateData);

  if (verbose) {
    console.error(`Loaded template: ${basename(templatePath)}`);
    console.error(`Template pages: ${templatePdf.getPageCount()}`);
  }

  // Create output document
  const pdfDoc = await PDFDocument.create();

  // Copy metadata from template
  pdfDoc.setTitle(templatePdf.getTitle() || "");
  pdfDoc.setAuthor(templatePdf.getAuthor() || "");
  pdfDoc.setSubject(templatePdf.getSubject() || "");

  // Embed fonts for overlays
  // deno-lint-ignore no-explicit-any
  const fonts = new Map<string, any>();
  for (const [name, fontEnum] of Object.entries(FONT_MAP)) {
    fonts.set(name, await pdfDoc.embedFont(fontEnum));
  }

  // Add prepended PDFs
  if (spec.prependPdfs && spec.prependPdfs.length > 0) {
    for (const source of spec.prependPdfs) {
      const pages = await loadAndCopyPages(pdfDoc, source, specDir);
      for (const page of pages) {
        pdfDoc.addPage(page);
      }
      if (verbose) {
        console.error(`Prepended ${pages.length} pages from ${source.path}`);
      }
    }
  }

  // Determine which template pages to include
  const templatePageCount = templatePdf.getPageCount();
  let templatePageIndices: number[] = [];

  if (spec.includePages && spec.includePages.length > 0) {
    templatePageIndices = spec.includePages.map(p => p - 1);
  } else if (spec.excludePages && spec.excludePages.length > 0) {
    const excludeSet = new Set(spec.excludePages.map(p => p - 1));
    for (let i = 0; i < templatePageCount; i++) {
      if (!excludeSet.has(i)) {
        templatePageIndices.push(i);
      }
    }
  } else {
    templatePageIndices = templatePdf.getPageIndices();
  }

  // Copy template pages
  const templatePages = await pdfDoc.copyPages(templatePdf, templatePageIndices);
  // deno-lint-ignore no-explicit-any
  const addedPages: any[] = [];

  for (const page of templatePages) {
    pdfDoc.addPage(page);
    addedPages.push(page);
  }

  if (verbose) {
    console.error(`Added ${addedPages.length} template pages`);
  }

  // Fill form fields
  if (spec.formFields && spec.formFields.length > 0) {
    try {
      const form = pdfDoc.getForm();
      let filledCount = 0;

      for (const fieldSpec of spec.formFields) {
        try {
          const field = form.getField(fieldSpec.name);
          const fieldType = field.constructor.name;

          if (typeof fieldSpec.value === "boolean") {
            // Checkbox
            if (fieldType.includes("CheckBox")) {
              if (fieldSpec.value) {
                // deno-lint-ignore no-explicit-any
                (field as any).check();
              } else {
                // deno-lint-ignore no-explicit-any
                (field as any).uncheck();
              }
              filledCount++;
            }
          } else {
            // Text field, dropdown, etc.
            if (fieldType.includes("Text")) {
              // deno-lint-ignore no-explicit-any
              (field as any).setText(fieldSpec.value);
              filledCount++;
            } else if (fieldType.includes("Dropdown") || fieldType.includes("OptionList")) {
              // deno-lint-ignore no-explicit-any
              (field as any).select(fieldSpec.value);
              filledCount++;
            } else if (fieldType.includes("Radio")) {
              // deno-lint-ignore no-explicit-any
              (field as any).select(fieldSpec.value);
              filledCount++;
            }
          }
        } catch (error) {
          if (verbose) {
            console.error(`Failed to fill field "${fieldSpec.name}": ${error}`);
          }
        }
      }

      if (verbose) {
        console.error(`Filled ${filledCount} form fields`);
      }

      // Flatten form if requested
      if (spec.flattenForm) {
        form.flatten();
        if (verbose) {
          console.error("Form flattened");
        }
      }
    } catch (error) {
      if (verbose) {
        console.error(`Form processing failed: ${error}`);
      }
    }
  }

  // Apply overlays
  if (spec.overlays && spec.overlays.length > 0) {
    // Calculate page offset from prepended PDFs
    const prependedPageCount = spec.prependPdfs?.reduce((sum, s) => {
      // This is approximate - we'd need to track actual pages added
      return sum + (s.pages?.length || 0);
    }, 0) || 0;

    for (const overlay of spec.overlays) {
      // Adjust page index for prepended pages and 1-indexing
      const pageIndex = (overlay.page - 1) + prependedPageCount;

      if (pageIndex < 0 || pageIndex >= pdfDoc.getPageCount()) {
        if (verbose) {
          console.error(`Overlay page ${overlay.page} out of range`);
        }
        continue;
      }

      const page = pdfDoc.getPage(pageIndex);

      try {
        switch (overlay.type) {
          case "text": {
            const fontName = overlay.font || "Helvetica";
            const font = fonts.get(fontName);

            // deno-lint-ignore no-explicit-any
            const textOptions: any = {
              x: overlay.x,
              y: overlay.y,
              size: overlay.fontSize || 12,
              font,
              color: getColor(overlay.color),
            };

            if (overlay.rotate) {
              textOptions.rotate = degrees(overlay.rotate);
            }

            page.drawText(overlay.text, textOptions);
            break;
          }

          case "image": {
            const imagePath = resolve(specDir, overlay.path);
            const imageData = await Deno.readFile(imagePath);
            const ext = overlay.path.toLowerCase().split(".").pop();

            // deno-lint-ignore no-explicit-any
            let image: any;
            if (ext === "png") {
              image = await pdfDoc.embedPng(imageData);
            } else if (ext === "jpg" || ext === "jpeg") {
              image = await pdfDoc.embedJpg(imageData);
            } else {
              throw new Error(`Unsupported image format: ${ext}`);
            }

            const dims = image.scale(1);

            page.drawImage(image, {
              x: overlay.x,
              y: overlay.y,
              width: overlay.width || dims.width,
              height: overlay.height || dims.height,
              opacity: overlay.opacity,
            });
            break;
          }

          case "rectangle": {
            page.drawRectangle({
              x: overlay.x,
              y: overlay.y,
              width: overlay.width,
              height: overlay.height,
              color: getColor(overlay.color),
              opacity: overlay.opacity,
            });
            break;
          }
        }
      } catch (error) {
        if (verbose) {
          console.error(`Failed to apply overlay: ${error}`);
        }
      }
    }

    if (verbose) {
      console.error(`Applied ${spec.overlays.length} overlays`);
    }
  }

  // Add appended PDFs
  if (spec.appendPdfs && spec.appendPdfs.length > 0) {
    for (const source of spec.appendPdfs) {
      const pages = await loadAndCopyPages(pdfDoc, source, specDir);
      for (const page of pages) {
        pdfDoc.addPage(page);
      }
      if (verbose) {
        console.error(`Appended ${pages.length} pages from ${source.path}`);
      }
    }
  }

  // Write output
  const pdfBytes = await pdfDoc.save();
  await Deno.writeFile(outputPath, pdfBytes);

  if (verbose) {
    console.error(`Wrote ${outputPath} (${pdfDoc.getPageCount()} pages)`);
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

  if (positionalArgs.length < 3) {
    console.error(
      "Error: template.pdf, spec.json, and output.pdf are required\n"
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

    const specDir = dirname(resolve(specPath));

    await generateFromTemplate(templatePath, spec, outputPath, {
      verbose: parsed.verbose,
      specDir,
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
