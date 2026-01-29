#!/usr/bin/env -S deno run --allow-read

/**
 * analyze-template.ts - Extract text inventory from PPTX templates
 *
 * Extracts all text shapes, positions, and content from a PowerPoint file
 * for template analysis and content replacement planning.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze-template.ts <input.pptx> [options]
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *   --slide <n>      Only analyze specific slide number (1-indexed)
 *   --json           Output as JSON (default)
 *   --pretty         Pretty-print JSON output
 *
 * Permissions:
 *   --allow-read: Read PPTX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename } from "jsr:@std/path@1.0.8";
import JSZip from "npm:jszip@3.10.1";
import { DOMParser } from "npm:@xmldom/xmldom@0.9.6";

// === Types ===
export interface Position {
  x: number; // inches
  y: number; // inches
  width: number; // inches
  height: number; // inches
}

export interface Paragraph {
  text: string;
  bullet: boolean;
  level: number;
  alignment?: "left" | "center" | "right" | "justify";
  fontSize?: number; // points
  fontFamily?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  color?: string; // hex RGB
}

export interface TextElement {
  slideNumber: number;
  shapeId: string;
  shapeName: string;
  placeholderType?: string;
  position: Position;
  paragraphs: Paragraph[];
}

export interface ImageElement {
  slideNumber: number;
  shapeId: string;
  position: Position;
  relationshipId: string;
  filename?: string;
}

export interface TemplateInventory {
  filename: string;
  slideCount: number;
  slideWidth: number; // inches
  slideHeight: number; // inches
  textElements: TextElement[];
  images: ImageElement[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  slide?: number;
  json: boolean;
  pretty: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "analyze-template";

// EMU (English Metric Units) to inches conversion
const EMU_PER_INCH = 914400;

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Extract text inventory from PPTX templates

Usage:
  deno run --allow-read scripts/${SCRIPT_NAME}.ts <input.pptx> [options]

Arguments:
  <input.pptx>     Path to the PowerPoint file to analyze

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output (to stderr)
  --slide <n>      Only analyze specific slide number (1-indexed)
  --pretty         Pretty-print JSON output (default: compact)

Examples:
  # Analyze entire presentation
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.pptx > inventory.json

  # Analyze specific slide with verbose output
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.pptx --slide 1 -v --pretty

  # Pipe to jq for further processing
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.pptx | jq '.textElements'
`);
}

// === Utility Functions ===
function emuToInches(emu: number): number {
  return Math.round((emu / EMU_PER_INCH) * 1000) / 1000;
}

// deno-lint-ignore no-explicit-any
function getAttr(element: any, name: string): string | null {
  return element.getAttribute(name);
}

// deno-lint-ignore no-explicit-any
function getNumAttr(element: any, name: string): number | null {
  const val = element.getAttribute(name);
  return val ? parseInt(val, 10) : null;
}

// deno-lint-ignore no-explicit-any
function getElementsByTagNameNS(
  parent: any,
  ns: string,
  localName: string
  // deno-lint-ignore no-explicit-any
): any[] {
  const elements = parent.getElementsByTagNameNS(ns, localName);
  // deno-lint-ignore no-explicit-any
  return Array.from(elements) as any[];
}

// === XML Namespaces ===
const NS = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
};

// === Core Logic ===

// deno-lint-ignore no-explicit-any
function parsePosition(spElement: any): Position | null {
  // Find xfrm element (transform) - can be in spPr or within the shape
  const xfrmElements = getElementsByTagNameNS(spElement, NS.a, "xfrm");
  if (xfrmElements.length === 0) return null;

  const xfrm = xfrmElements[0];
  const off = getElementsByTagNameNS(xfrm, NS.a, "off")[0];
  const ext = getElementsByTagNameNS(xfrm, NS.a, "ext")[0];

  if (!off || !ext) return null;

  const x = getNumAttr(off, "x");
  const y = getNumAttr(off, "y");
  const cx = getNumAttr(ext, "cx");
  const cy = getNumAttr(ext, "cy");

  if (x === null || y === null || cx === null || cy === null) return null;

  return {
    x: emuToInches(x),
    y: emuToInches(y),
    width: emuToInches(cx),
    height: emuToInches(cy),
  };
}

// deno-lint-ignore no-explicit-any
function parseTextRun(rElement: any): { text: string; props: Partial<Paragraph> } {
  const props: Partial<Paragraph> = {};

  // Get text content
  const tElements = getElementsByTagNameNS(rElement, NS.a, "t");
  const text = tElements.map((t) => t.textContent || "").join("");

  // Get run properties
  const rPrElements = getElementsByTagNameNS(rElement, NS.a, "rPr");
  if (rPrElements.length > 0) {
    const rPr = rPrElements[0];

    // Font size (in hundredths of a point)
    const sz = getNumAttr(rPr, "sz");
    if (sz) props.fontSize = sz / 100;

    // Bold
    const b = getAttr(rPr, "b");
    if (b === "1" || b === "true") props.bold = true;

    // Italic
    const i = getAttr(rPr, "i");
    if (i === "1" || i === "true") props.italic = true;

    // Underline
    const u = getAttr(rPr, "u");
    if (u && u !== "none") props.underline = true;

    // Font family
    const latin = getElementsByTagNameNS(rPr, NS.a, "latin")[0];
    if (latin) {
      const typeface = getAttr(latin, "typeface");
      if (typeface) props.fontFamily = typeface;
    }

    // Color
    const srgbClr = getElementsByTagNameNS(rPr, NS.a, "srgbClr")[0];
    if (srgbClr) {
      const val = getAttr(srgbClr, "val");
      if (val) props.color = val;
    }
  }

  return { text, props };
}

// deno-lint-ignore no-explicit-any
function parseParagraph(pElement: any): Paragraph {
  const paragraph: Paragraph = {
    text: "",
    bullet: false,
    level: 0,
  };

  // Get paragraph properties
  const pPrElements = getElementsByTagNameNS(pElement, NS.a, "pPr");
  if (pPrElements.length > 0) {
    const pPr = pPrElements[0];

    // Indentation level
    const lvl = getNumAttr(pPr, "lvl");
    if (lvl !== null) paragraph.level = lvl;

    // Alignment
    const algn = getAttr(pPr, "algn");
    if (algn) {
      const alignMap: Record<string, Paragraph["alignment"]> = {
        l: "left",
        ctr: "center",
        r: "right",
        just: "justify",
      };
      paragraph.alignment = alignMap[algn] || "left";
    }

    // Check for bullet
    const buNone = getElementsByTagNameNS(pPr, NS.a, "buNone");
    const buChar = getElementsByTagNameNS(pPr, NS.a, "buChar");
    const buAutoNum = getElementsByTagNameNS(pPr, NS.a, "buAutoNum");
    paragraph.bullet = buNone.length === 0 && (buChar.length > 0 || buAutoNum.length > 0);
  }

  // Get text runs
  const runs = getElementsByTagNameNS(pElement, NS.a, "r");
  const textParts: string[] = [];
  let lastProps: Partial<Paragraph> = {};

  for (const run of runs) {
    const { text, props } = parseTextRun(run);
    textParts.push(text);
    // Use properties from first run with non-empty text
    if (text.trim() && Object.keys(lastProps).length === 0) {
      lastProps = props;
    }
  }

  paragraph.text = textParts.join("");
  Object.assign(paragraph, lastProps);

  return paragraph;
}

// deno-lint-ignore no-explicit-any
function parseShape(
  spElement: any,
  slideNumber: number
): TextElement | null {
  // Get shape ID and name from nvSpPr
  const nvSpPr = getElementsByTagNameNS(spElement, NS.p, "nvSpPr")[0];
  if (!nvSpPr) return null;

  const cNvPr = getElementsByTagNameNS(nvSpPr, NS.p, "cNvPr")[0];
  if (!cNvPr) return null;

  const shapeId = getAttr(cNvPr, "id") || "unknown";
  const shapeName = getAttr(cNvPr, "name") || "";

  // Check for placeholder type
  let placeholderType: string | undefined;
  const nvPr = getElementsByTagNameNS(nvSpPr, NS.p, "nvPr")[0];
  if (nvPr) {
    const ph = getElementsByTagNameNS(nvPr, NS.p, "ph")[0];
    if (ph) {
      placeholderType = getAttr(ph, "type") || "body";
    }
  }

  // Get position
  const position = parsePosition(spElement);
  if (!position) return null;

  // Get text body
  const txBody = getElementsByTagNameNS(spElement, NS.p, "txBody")[0];
  if (!txBody) return null;

  // Parse paragraphs
  const pElements = getElementsByTagNameNS(txBody, NS.a, "p");
  const paragraphs: Paragraph[] = [];

  for (const p of pElements) {
    const paragraph = parseParagraph(p);
    // Only include paragraphs with actual text
    if (paragraph.text.trim()) {
      paragraphs.push(paragraph);
    }
  }

  // Skip shapes with no text
  if (paragraphs.length === 0) return null;

  return {
    slideNumber,
    shapeId: `shape-${shapeId}`,
    shapeName,
    placeholderType,
    position,
    paragraphs,
  };
}

// deno-lint-ignore no-explicit-any
function parsePicture(
  picElement: any,
  slideNumber: number
): ImageElement | null {
  // Get picture ID from nvPicPr
  const nvPicPr = getElementsByTagNameNS(picElement, NS.p, "nvPicPr")[0];
  if (!nvPicPr) return null;

  const cNvPr = getElementsByTagNameNS(nvPicPr, NS.p, "cNvPr")[0];
  if (!cNvPr) return null;

  const shapeId = getAttr(cNvPr, "id") || "unknown";

  // Get position
  const position = parsePosition(picElement);
  if (!position) return null;

  // Get relationship ID for the image
  const blipFill = getElementsByTagNameNS(picElement, NS.p, "blipFill")[0];
  if (!blipFill) return null;

  const blip = getElementsByTagNameNS(blipFill, NS.a, "blip")[0];
  if (!blip) return null;

  const relationshipId = blip.getAttributeNS(NS.r, "embed") || "";

  return {
    slideNumber,
    shapeId: `image-${shapeId}`,
    position,
    relationshipId,
  };
}

function parseSlide(
  slideXml: string,
  slideNumber: number
): { textElements: TextElement[]; images: ImageElement[] } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, "text/xml");

  const textElements: TextElement[] = [];
  const images: ImageElement[] = [];

  // Parse shapes (sp elements)
  const shapes = getElementsByTagNameNS(doc, NS.p, "sp");
  for (const shape of shapes) {
    const textElement = parseShape(shape, slideNumber);
    if (textElement) {
      textElements.push(textElement);
    }
  }

  // Parse pictures (pic elements)
  const pictures = getElementsByTagNameNS(doc, NS.p, "pic");
  for (const pic of pictures) {
    const imageElement = parsePicture(pic, slideNumber);
    if (imageElement) {
      images.push(imageElement);
    }
  }

  // Sort by position (top to bottom, left to right)
  textElements.sort((a, b) => {
    const yDiff = a.position.y - b.position.y;
    if (Math.abs(yDiff) > 0.5) return yDiff; // Different rows
    return a.position.x - b.position.x; // Same row, sort by x
  });

  return { textElements, images };
}

function parsePresentationSize(
  presentationXml: string
): { width: number; height: number } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(presentationXml, "text/xml");

  const sldSz = getElementsByTagNameNS(doc, NS.p, "sldSz")[0];
  if (!sldSz) {
    // Default to 16:9
    return { width: 10, height: 5.625 };
  }

  const cx = getNumAttr(sldSz, "cx") || 9144000; // Default 10"
  const cy = getNumAttr(sldSz, "cy") || 5143500; // Default 5.625"

  return {
    width: emuToInches(cx),
    height: emuToInches(cy),
  };
}

export async function analyzeTemplate(
  pptxPath: string,
  options: { verbose?: boolean; slideNumber?: number } = {}
): Promise<TemplateInventory> {
  const { verbose = false, slideNumber } = options;

  // Read the PPTX file
  const data = await Deno.readFile(pptxPath);
  const zip = await JSZip.loadAsync(data);

  // Get presentation size
  const presentationFile = zip.file("ppt/presentation.xml");
  let slideWidth = 10;
  let slideHeight = 5.625;

  if (presentationFile) {
    const presentationXml = await presentationFile.async("string");
    const size = parsePresentationSize(presentationXml);
    slideWidth = size.width;
    slideHeight = size.height;
  }

  // Find all slide files
  const slideFiles: string[] = [];
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push(relativePath);
    }
  });

  // Sort slides by number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    return numA - numB;
  });

  if (verbose) {
    console.error(`Found ${slideFiles.length} slides`);
  }

  const allTextElements: TextElement[] = [];
  const allImages: ImageElement[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const slideNum = i + 1;

    // Skip if filtering to specific slide
    if (slideNumber !== undefined && slideNum !== slideNumber) {
      continue;
    }

    const slideFile = zip.file(slideFiles[i]);
    if (!slideFile) continue;

    const slideXml = await slideFile.async("string");
    const { textElements, images } = parseSlide(slideXml, slideNum);

    if (verbose) {
      console.error(
        `Slide ${slideNum}: ${textElements.length} text elements, ${images.length} images`
      );
    }

    allTextElements.push(...textElements);
    allImages.push(...images);
  }

  return {
    filename: basename(pptxPath),
    slideCount: slideFiles.length,
    slideWidth,
    slideHeight,
    textElements: allTextElements,
    images: allImages,
  };
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose", "json", "pretty"],
    string: ["slide"],
    alias: { help: "h", verbose: "v" },
    default: { verbose: false, json: true, pretty: false },
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
  const slideNumber = parsed.slide ? parseInt(parsed.slide as unknown as string, 10) : undefined;

  try {
    const inventory = await analyzeTemplate(inputPath, {
      verbose: parsed.verbose,
      slideNumber,
    });

    // Output as JSON
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
