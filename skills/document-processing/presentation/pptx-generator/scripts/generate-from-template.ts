#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-from-template.ts - Generate PPTX from existing templates
 *
 * Modifies existing PowerPoint templates using two patterns:
 * 1. Analyze & Replace: Find and replace tagged content (e.g., {{TITLE}})
 * 2. Slide Library: Select and combine slides from template into new presentation
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-from-template.ts <template.pptx> <spec.json> <output.pptx>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read template and specification files
 *   --allow-write: Write output PPTX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename } from "jsr:@std/path@1.0.8";
import JSZip from "npm:jszip@3.10.1";
import { DOMParser, XMLSerializer } from "npm:@xmldom/xmldom@0.9.6";

// === Types ===

export interface TextReplacement {
  /** The tag to find and replace (e.g., "{{TITLE}}" or just "TITLE") */
  tag: string;
  /** The replacement text */
  value: string;
  /** Optional: only apply to specific slides (1-indexed) */
  slideNumbers?: number[];
}

export interface SlideSelection {
  /** Path to source template (can be same as master or different) */
  sourceTemplate?: string;
  /** Which slide to copy (1-indexed) */
  slideNumber: number;
  /** Position in output (1-indexed, appends if omitted) */
  insertAt?: number;
}

export interface TemplateSpec {
  /** Path to the master template file (can be overridden by CLI) */
  masterTemplate?: string;
  /** Text replacements to apply */
  textReplacements?: TextReplacement[];
  /** Slides to select and combine (slide library mode) */
  slideSelections?: SlideSelection[];
  /** Which slides from master to include (1-indexed, all if omitted) */
  includeSlides?: number[];
  /** Which slides to exclude from master (1-indexed) */
  excludeSlides?: number[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-from-template";

// XML Namespaces
const NS = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
  ct: "http://schemas.openxmlformats.org/package/2006/content-types",
};

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate PPTX from existing templates

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <template.pptx> <spec.json> <output.pptx>

Arguments:
  <template.pptx>  Path to the master template PowerPoint file
  <spec.json>      Path to JSON specification for replacements/selections
  <output.pptx>    Path for output PowerPoint file

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format (Text Replacement):
  {
    "textReplacements": [
      { "tag": "{{TITLE}}", "value": "Q4 2024 Results" },
      { "tag": "{{DATE}}", "value": "December 2024" },
      { "tag": "{{AUTHOR}}", "value": "John Smith", "slideNumbers": [1] }
    ]
  }

Specification Format (Slide Library):
  {
    "slideSelections": [
      { "slideNumber": 1 },
      { "slideNumber": 5 },
      { "slideNumber": 12 }
    ],
    "textReplacements": [
      { "tag": "{{TITLE}}", "value": "Custom Presentation" }
    ]
  }

Examples:
  # Replace text in template
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.pptx replacements.json output.pptx

  # Combine slides from library
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    slide-library.pptx selections.json custom-deck.pptx -v
`);
}

// === Utility Functions ===

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

function getSlideFiles(zip: JSZip): string[] {
  const slideFiles: string[] = [];
  zip.forEach((relativePath) => {
    const match = relativePath.match(/^ppt\/slides\/slide(\d+)\.xml$/);
    if (match) {
      slideFiles.push(relativePath);
    }
  });
  // Sort by slide number
  slideFiles.sort((a, b) => {
    const numA = parseInt(a.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    const numB = parseInt(b.match(/slide(\d+)\.xml$/)?.[1] || "0", 10);
    return numA - numB;
  });
  return slideFiles;
}

// === Text Replacement ===

function replaceTextInXml(
  xmlContent: string,
  replacements: TextReplacement[]
): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Find all text elements
  const textElements = getElementsByTagNameNS(doc, NS.a, "t");

  for (const textEl of textElements as { textContent: string | null }[]) {
    let text = textEl.textContent || "";

    for (const replacement of replacements) {
      // Normalize tag format - support both {{TAG}} and TAG formats
      const tag = replacement.tag.startsWith("{{")
        ? replacement.tag
        : `{{${replacement.tag}}}`;

      if (text.includes(tag)) {
        text = text.replace(new RegExp(escapeRegExp(tag), "g"), replacement.value);
      }
    }

    if (textEl.textContent !== text) {
      textEl.textContent = text;
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// === Slide Management ===

interface SlideInfo {
  slideXml: string;
  relsXml: string | null;
  slideNumber: number;
}

async function extractSlide(
  zip: JSZip,
  slideNumber: number
): Promise<SlideInfo | null> {
  const slidePath = `ppt/slides/slide${slideNumber}.xml`;
  const relsPath = `ppt/slides/_rels/slide${slideNumber}.xml.rels`;

  const slideFile = zip.file(slidePath);
  if (!slideFile) return null;

  const slideXml = await slideFile.async("string");
  const relsFile = zip.file(relsPath);
  const relsXml = relsFile ? await relsFile.async("string") : null;

  return { slideXml, relsXml, slideNumber };
}

async function updatePresentationXml(
  zip: JSZip,
  slideCount: number
): Promise<void> {
  const presPath = "ppt/presentation.xml";
  const presFile = zip.file(presPath);
  if (!presFile) return;

  const presXml = await presFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(presXml, "text/xml");

  // Find sldIdLst and update
  // deno-lint-ignore no-explicit-any
  const sldIdLst = getElementsByTagNameNS(doc, NS.p, "sldIdLst")[0] as any;
  if (sldIdLst) {
    // Clear existing entries
    while (sldIdLst.firstChild) {
      sldIdLst.removeChild(sldIdLst.firstChild);
    }

    // Add new slide references
    for (let i = 1; i <= slideCount; i++) {
      // deno-lint-ignore no-explicit-any
      const sldId = (doc as any).createElementNS(NS.p, "p:sldId");
      sldId.setAttribute("id", String(255 + i));
      sldId.setAttributeNS(NS.r, "r:id", `rId${i + 1}`);
      sldIdLst.appendChild(sldId);
    }
  }

  const serializer = new XMLSerializer();
  zip.file(presPath, serializer.serializeToString(doc));
}

async function updatePresentationRels(
  zip: JSZip,
  slideCount: number
): Promise<void> {
  const relsPath = "ppt/_rels/presentation.xml.rels";
  const relsFile = zip.file(relsPath);
  if (!relsFile) return;

  const relsXml = await relsFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(relsXml, "text/xml");

  // deno-lint-ignore no-explicit-any
  const relationships = (doc as any).documentElement;
  if (!relationships) return;

  // Remove existing slide relationships
  const existingRels = getElementsByTagNameNS(doc, NS.rel, "Relationship");
  const slideRelType =
    "http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide";

  // deno-lint-ignore no-explicit-any
  for (const rel of existingRels as any[]) {
    if (rel.getAttribute("Type") === slideRelType) {
      relationships.removeChild(rel);
    }
  }

  // Add new slide relationships
  for (let i = 1; i <= slideCount; i++) {
    // deno-lint-ignore no-explicit-any
    const rel = (doc as any).createElementNS(NS.rel, "Relationship");
    rel.setAttribute("Id", `rId${i + 1}`);
    rel.setAttribute("Type", slideRelType);
    rel.setAttribute("Target", `slides/slide${i}.xml`);
    relationships.appendChild(rel);
  }

  const serializer = new XMLSerializer();
  zip.file(relsPath, serializer.serializeToString(doc));
}

async function updateContentTypes(
  zip: JSZip,
  slideCount: number
): Promise<void> {
  const ctPath = "[Content_Types].xml";
  const ctFile = zip.file(ctPath);
  if (!ctFile) return;

  const ctXml = await ctFile.async("string");
  const parser = new DOMParser();
  const doc = parser.parseFromString(ctXml, "text/xml");

  // deno-lint-ignore no-explicit-any
  const types = (doc as any).documentElement;
  if (!types) return;

  // Remove existing slide overrides
  // deno-lint-ignore no-explicit-any
  const overrides = (doc as any).getElementsByTagName("Override");
  // deno-lint-ignore no-explicit-any
  const toRemove: any[] = [];
  for (let i = 0; i < overrides.length; i++) {
    const override = overrides[i];
    const partName = override.getAttribute("PartName") || "";
    if (partName.match(/\/ppt\/slides\/slide\d+\.xml$/)) {
      toRemove.push(override);
    }
  }
  for (const el of toRemove) {
    types.removeChild(el);
  }

  // Add new slide overrides
  const slideContentType =
    "application/vnd.openxmlformats-officedocument.presentationml.slide+xml";
  for (let i = 1; i <= slideCount; i++) {
    // deno-lint-ignore no-explicit-any
    const override = (doc as any).createElement("Override");
    override.setAttribute("PartName", `/ppt/slides/slide${i}.xml`);
    override.setAttribute("ContentType", slideContentType);
    types.appendChild(override);
  }

  const serializer = new XMLSerializer();
  zip.file(ctPath, serializer.serializeToString(doc));
}

// === Core Logic ===

export async function generateFromTemplate(
  templatePath: string,
  spec: TemplateSpec,
  outputPath: string,
  options: { verbose?: boolean } = {}
): Promise<void> {
  const { verbose = false } = options;

  // Read template
  const templateData = await Deno.readFile(templatePath);
  const zip = await JSZip.loadAsync(templateData);

  if (verbose) {
    console.error(`Loaded template: ${basename(templatePath)}`);
  }

  // Get all slide files
  const allSlideFiles = getSlideFiles(zip);
  const totalSlides = allSlideFiles.length;

  if (verbose) {
    console.error(`Template has ${totalSlides} slides`);
  }

  // Determine which slides to include
  let slidesToInclude: number[];

  if (spec.slideSelections && spec.slideSelections.length > 0) {
    // Slide library mode: use selected slides
    slidesToInclude = spec.slideSelections.map((s) => s.slideNumber);
    if (verbose) {
      console.error(`Slide library mode: selecting slides ${slidesToInclude.join(", ")}`);
    }
  } else if (spec.includeSlides && spec.includeSlides.length > 0) {
    // Include specific slides
    slidesToInclude = spec.includeSlides;
  } else if (spec.excludeSlides && spec.excludeSlides.length > 0) {
    // Exclude specific slides
    slidesToInclude = [];
    for (let i = 1; i <= totalSlides; i++) {
      if (!spec.excludeSlides.includes(i)) {
        slidesToInclude.push(i);
      }
    }
  } else {
    // Include all slides
    slidesToInclude = [];
    for (let i = 1; i <= totalSlides; i++) {
      slidesToInclude.push(i);
    }
  }

  // Extract selected slides
  const selectedSlides: SlideInfo[] = [];
  for (const slideNum of slidesToInclude) {
    const slideInfo = await extractSlide(zip, slideNum);
    if (slideInfo) {
      selectedSlides.push(slideInfo);
    } else if (verbose) {
      console.error(`Warning: Slide ${slideNum} not found`);
    }
  }

  if (verbose) {
    console.error(`Selected ${selectedSlides.length} slides`);
  }

  // Apply text replacements
  const replacements = spec.textReplacements || [];
  if (replacements.length > 0 && verbose) {
    console.error(`Applying ${replacements.length} text replacements`);
  }

  // Remove all existing slide files
  const filesToRemove: string[] = [];
  zip.forEach((path) => {
    if (path.match(/^ppt\/slides\/slide\d+\.xml$/) ||
        path.match(/^ppt\/slides\/_rels\/slide\d+\.xml\.rels$/)) {
      filesToRemove.push(path);
    }
  });
  for (const path of filesToRemove) {
    zip.remove(path);
  }

  // Add selected slides with new numbering
  for (let i = 0; i < selectedSlides.length; i++) {
    const slide = selectedSlides[i];
    const newSlideNum = i + 1;

    // Filter replacements for this slide
    const slideReplacements = replacements.filter(
      (r) => !r.slideNumbers || r.slideNumbers.includes(slide.slideNumber)
    );

    // Apply text replacements
    let slideXml = slide.slideXml;
    if (slideReplacements.length > 0) {
      slideXml = replaceTextInXml(slideXml, slideReplacements);
    }

    // Write slide with new number
    zip.file(`ppt/slides/slide${newSlideNum}.xml`, slideXml);

    // Write relationships if present
    if (slide.relsXml) {
      zip.file(`ppt/slides/_rels/slide${newSlideNum}.xml.rels`, slide.relsXml);
    }

    if (verbose) {
      console.error(
        `Wrote slide ${newSlideNum} (from original slide ${slide.slideNumber})`
      );
    }
  }

  // Update presentation.xml with new slide list
  await updatePresentationXml(zip, selectedSlides.length);

  // Update presentation.xml.rels
  await updatePresentationRels(zip, selectedSlides.length);

  // Update [Content_Types].xml
  await updateContentTypes(zip, selectedSlides.length);

  // Write output file
  const outputData = await zip.generateAsync({
    type: "uint8array",
    compression: "DEFLATE",
    compressionOptions: { level: 6 },
  });

  await Deno.writeFile(outputPath, outputData);

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

  if (positionalArgs.length < 3) {
    console.error(
      "Error: template.pptx, spec.json, and output.pptx are required\n"
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
