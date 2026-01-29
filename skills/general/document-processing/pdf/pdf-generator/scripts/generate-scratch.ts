#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-scratch.ts - Create PDF from scratch using JSON specification
 *
 * Creates PDF documents programmatically from a JSON specification
 * using pdf-lib. Supports text, images, shapes, and form fields.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-scratch.ts <spec.json> <output.pdf>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read specification file and image assets
 *   --allow-write: Write output PDF file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { dirname, resolve } from "jsr:@std/path@1.0.8";
import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PageSizes,
  // deno-lint-ignore no-explicit-any
} from "npm:pdf-lib@1.17.1" as any;

// === Types ===

export interface TextElement {
  type: "text";
  x: number;
  y: number;
  text: string;
  fontSize?: number;
  font?: "Helvetica" | "HelveticaBold" | "HelveticaOblique" | "TimesRoman" | "TimesBold" | "Courier" | "CourierBold";
  color?: { r: number; g: number; b: number };
  maxWidth?: number;
  lineHeight?: number;
  rotate?: number;
}

export interface ImageElement {
  type: "image";
  x: number;
  y: number;
  path: string;
  width?: number;
  height?: number;
  opacity?: number;
  rotate?: number;
}

export interface RectangleElement {
  type: "rectangle";
  x: number;
  y: number;
  width: number;
  height: number;
  color?: { r: number; g: number; b: number };
  borderColor?: { r: number; g: number; b: number };
  borderWidth?: number;
  opacity?: number;
}

export interface LineElement {
  type: "line";
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color?: { r: number; g: number; b: number };
  thickness?: number;
  opacity?: number;
}

export interface CircleElement {
  type: "circle";
  x: number;
  y: number;
  radius: number;
  color?: { r: number; g: number; b: number };
  borderColor?: { r: number; g: number; b: number };
  borderWidth?: number;
  opacity?: number;
}

export interface TableElement {
  type: "table";
  x: number;
  y: number;
  rows: string[][];
  columnWidths: number[];
  rowHeight?: number;
  fontSize?: number;
  headerBackground?: { r: number; g: number; b: number };
  borderColor?: { r: number; g: number; b: number };
  padding?: number;
}

export type PageElement = TextElement | ImageElement | RectangleElement | LineElement | CircleElement | TableElement;

export interface PageSpec {
  size?: "A4" | "Letter" | "Legal" | [number, number];
  margins?: { top?: number; right?: number; bottom?: number; left?: number };
  elements: PageElement[];
}

export interface PDFSpec {
  title?: string;
  author?: string;
  subject?: string;
  creator?: string;
  pages: PageSpec[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-scratch";

const FONT_MAP: Record<string, typeof StandardFonts[keyof typeof StandardFonts]> = {
  "Helvetica": StandardFonts.Helvetica,
  "HelveticaBold": StandardFonts.HelveticaBold,
  "HelveticaOblique": StandardFonts.HelveticaOblique,
  "TimesRoman": StandardFonts.TimesRoman,
  "TimesBold": StandardFonts.TimesBold,
  "Courier": StandardFonts.Courier,
  "CourierBold": StandardFonts.CourierBold,
};

const PAGE_SIZES: Record<string, [number, number]> = {
  "A4": PageSizes.A4,
  "Letter": PageSizes.Letter,
  "Legal": PageSizes.Legal,
};

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Create PDF from scratch using JSON specification

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <spec.json> <output.pdf>

Arguments:
  <spec.json>      Path to JSON specification file
  <output.pdf>     Path for output PDF file

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "title": "My Document",
    "author": "Author Name",
    "pages": [
      {
        "size": "A4",
        "elements": [
          {
            "type": "text",
            "x": 50,
            "y": 750,
            "text": "Hello World",
            "fontSize": 24,
            "font": "HelveticaBold",
            "color": { "r": 0, "g": 0, "b": 0.5 }
          },
          {
            "type": "rectangle",
            "x": 50,
            "y": 700,
            "width": 200,
            "height": 2,
            "color": { "r": 0, "g": 0, "b": 0 }
          }
        ]
      }
    ]
  }

Supported Elements:
  - text: Text with font, size, color options
  - image: PNG/JPEG images from file
  - rectangle: Filled or outlined rectangles
  - line: Straight lines
  - circle: Filled or outlined circles
  - table: Basic table layout (manual positioning)

Examples:
  # Generate PDF
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.pdf

  # With verbose output
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.pdf -v
`);
}

// === Utility Functions ===

function getColor(color?: { r: number; g: number; b: number }): ReturnType<typeof rgb> {
  if (!color) return rgb(0, 0, 0);
  return rgb(color.r, color.g, color.b);
}

// === Element Drawing Functions ===

// deno-lint-ignore no-explicit-any
async function drawText(page: any, element: TextElement, fonts: Map<string, any>): Promise<void> {
  const fontName = element.font || "Helvetica";
  const font = fonts.get(fontName);
  const fontSize = element.fontSize || 12;

  const options: Record<string, unknown> = {
    x: element.x,
    y: element.y,
    size: fontSize,
    font,
    color: getColor(element.color),
  };

  if (element.maxWidth) {
    options.maxWidth = element.maxWidth;
    options.lineHeight = element.lineHeight || fontSize * 1.2;
  }

  if (element.rotate) {
    options.rotate = degrees(element.rotate);
  }

  page.drawText(element.text, options);
}

// deno-lint-ignore no-explicit-any
async function drawImage(page: any, element: ImageElement, pdfDoc: any, specDir: string): Promise<void> {
  const imagePath = resolve(specDir, element.path);
  const imageData = await Deno.readFile(imagePath);

  const ext = element.path.toLowerCase().split(".").pop();
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
  const width = element.width || dims.width;
  const height = element.height || dims.height;

  const options: Record<string, unknown> = {
    x: element.x,
    y: element.y,
    width,
    height,
  };

  if (element.opacity !== undefined) {
    options.opacity = element.opacity;
  }

  if (element.rotate) {
    options.rotate = degrees(element.rotate);
  }

  page.drawImage(image, options);
}

// deno-lint-ignore no-explicit-any
function drawRectangle(page: any, element: RectangleElement): void {
  const options: Record<string, unknown> = {
    x: element.x,
    y: element.y,
    width: element.width,
    height: element.height,
  };

  if (element.color) {
    options.color = getColor(element.color);
  }

  if (element.borderColor) {
    options.borderColor = getColor(element.borderColor);
    options.borderWidth = element.borderWidth || 1;
  }

  if (element.opacity !== undefined) {
    options.opacity = element.opacity;
  }

  page.drawRectangle(options);
}

// deno-lint-ignore no-explicit-any
function drawLine(page: any, element: LineElement): void {
  const options: Record<string, unknown> = {
    start: { x: element.startX, y: element.startY },
    end: { x: element.endX, y: element.endY },
    color: getColor(element.color),
    thickness: element.thickness || 1,
  };

  if (element.opacity !== undefined) {
    options.opacity = element.opacity;
  }

  page.drawLine(options);
}

// deno-lint-ignore no-explicit-any
function drawCircle(page: any, element: CircleElement): void {
  const options: Record<string, unknown> = {
    x: element.x,
    y: element.y,
    size: element.radius,
  };

  if (element.color) {
    options.color = getColor(element.color);
  }

  if (element.borderColor) {
    options.borderColor = getColor(element.borderColor);
    options.borderWidth = element.borderWidth || 1;
  }

  if (element.opacity !== undefined) {
    options.opacity = element.opacity;
  }

  page.drawCircle(options);
}

// deno-lint-ignore no-explicit-any
async function drawTable(page: any, element: TableElement, fonts: Map<string, any>): Promise<void> {
  const font = fonts.get("Helvetica");
  const fontSize = element.fontSize || 10;
  const rowHeight = element.rowHeight || 20;
  const padding = element.padding || 5;
  const borderColor = getColor(element.borderColor || { r: 0, g: 0, b: 0 });

  let currentY = element.y;

  for (let rowIndex = 0; rowIndex < element.rows.length; rowIndex++) {
    const row = element.rows[rowIndex];
    let currentX = element.x;

    for (let colIndex = 0; colIndex < row.length; colIndex++) {
      const cellWidth = element.columnWidths[colIndex] || 100;
      const cellText = row[colIndex];

      // Draw cell background for header
      if (rowIndex === 0 && element.headerBackground) {
        page.drawRectangle({
          x: currentX,
          y: currentY - rowHeight,
          width: cellWidth,
          height: rowHeight,
          color: getColor(element.headerBackground),
        });
      }

      // Draw cell border
      page.drawRectangle({
        x: currentX,
        y: currentY - rowHeight,
        width: cellWidth,
        height: rowHeight,
        borderColor,
        borderWidth: 0.5,
      });

      // Draw cell text
      page.drawText(cellText, {
        x: currentX + padding,
        y: currentY - rowHeight + padding + 2,
        size: fontSize,
        font,
        color: rgb(0, 0, 0),
      });

      currentX += cellWidth;
    }

    currentY -= rowHeight;
  }
}

// === Core Logic ===

export async function generateFromSpec(
  spec: PDFSpec,
  outputPath: string,
  options: { verbose?: boolean; specDir?: string } = {}
): Promise<void> {
  const { verbose = false, specDir = "." } = options;

  // Create document
  const pdfDoc = await PDFDocument.create();

  // Set metadata
  if (spec.title) pdfDoc.setTitle(spec.title);
  if (spec.author) pdfDoc.setAuthor(spec.author);
  if (spec.subject) pdfDoc.setSubject(spec.subject);
  if (spec.creator) pdfDoc.setCreator(spec.creator);

  // Embed fonts
  // deno-lint-ignore no-explicit-any
  const fonts = new Map<string, any>();
  for (const [name, fontEnum] of Object.entries(FONT_MAP)) {
    fonts.set(name, await pdfDoc.embedFont(fontEnum));
  }

  if (verbose) {
    console.error(`Creating PDF with ${spec.pages.length} page(s)`);
  }

  // Process each page
  for (let pageIndex = 0; pageIndex < spec.pages.length; pageIndex++) {
    const pageSpec = spec.pages[pageIndex];

    // Determine page size
    let pageSize: [number, number] = PageSizes.A4;
    if (pageSpec.size) {
      if (Array.isArray(pageSpec.size)) {
        pageSize = pageSpec.size;
      } else if (PAGE_SIZES[pageSpec.size]) {
        pageSize = PAGE_SIZES[pageSpec.size];
      }
    }

    const page = pdfDoc.addPage(pageSize);

    if (verbose) {
      console.error(`Page ${pageIndex + 1}: ${pageSpec.elements.length} elements`);
    }

    // Draw elements
    for (const element of pageSpec.elements) {
      try {
        switch (element.type) {
          case "text":
            await drawText(page, element, fonts);
            break;
          case "image":
            await drawImage(page, element, pdfDoc, specDir);
            break;
          case "rectangle":
            drawRectangle(page, element);
            break;
          case "line":
            drawLine(page, element);
            break;
          case "circle":
            drawCircle(page, element);
            break;
          case "table":
            await drawTable(page, element, fonts);
            break;
          default:
            if (verbose) {
              console.error(`Unknown element type: ${(element as PageElement).type}`);
            }
        }
      } catch (error) {
        if (verbose) {
          console.error(`Error drawing element: ${error}`);
        }
      }
    }
  }

  // Write output
  const pdfBytes = await pdfDoc.save();
  await Deno.writeFile(outputPath, pdfBytes);

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
    console.error("Error: Both spec.json and output.pdf are required\n");
    printHelp();
    Deno.exit(1);
  }

  const specPath = positionalArgs[0];
  const outputPath = positionalArgs[1];

  try {
    const specText = await Deno.readTextFile(specPath);
    const spec = JSON.parse(specText) as PDFSpec;

    const specDir = dirname(resolve(specPath));

    await generateFromSpec(spec, outputPath, {
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
