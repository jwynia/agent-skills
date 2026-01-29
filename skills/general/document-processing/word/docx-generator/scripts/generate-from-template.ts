#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-from-template.ts - Generate DOCX from existing templates
 *
 * Modifies existing Word templates using placeholder replacement.
 * Finds and replaces tagged content (e.g., {{TITLE}}, ${author}) in
 * paragraphs, tables, headers, and footers.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-from-template.ts <template.docx> <spec.json> <output.docx>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read template and specification files
 *   --allow-write: Write output DOCX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename, dirname, resolve } from "jsr:@std/path@1.0.8";
import JSZip from "npm:jszip@3.10.1";
import { DOMParser, XMLSerializer } from "npm:@xmldom/xmldom@0.9.6";

// === Types ===

export interface TextReplacement {
  /** The tag to find and replace (e.g., "{{TITLE}}" or "${author}") */
  tag: string;
  /** The replacement text */
  value: string;
}

export interface ImageReplacement {
  /** The placeholder tag for the image (e.g., "{{LOGO}}") */
  tag: string;
  /** Path to the image file (relative to spec file) */
  imagePath: string;
  /** Width in pixels */
  width: number;
  /** Height in pixels */
  height: number;
}

export interface TemplateSpec {
  /** Text replacements to apply */
  textReplacements?: TextReplacement[];
  /** Image replacements (replaces placeholder text with image) */
  imageReplacements?: ImageReplacement[];
  /** Whether to apply replacements in headers */
  includeHeaders?: boolean;
  /** Whether to apply replacements in footers */
  includeFooters?: boolean;
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
  w: "http://schemas.openxmlformats.org/wordprocessingml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
  rel: "http://schemas.openxmlformats.org/package/2006/relationships",
  wp: "http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing",
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  pic: "http://schemas.openxmlformats.org/drawingml/2006/picture",
};

// Placeholder patterns: {{PLACEHOLDER}} or ${placeholder}
const PLACEHOLDER_PATTERNS = [
  /\{\{([^}]+)\}\}/g,  // {{TAG}}
  /\$\{([^}]+)\}/g,     // ${tag}
];

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Generate DOCX from existing templates

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <template.docx> <spec.json> <output.docx>

Arguments:
  <template.docx>  Path to the template Word document
  <spec.json>      Path to JSON specification for replacements
  <output.docx>    Path for output Word document

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "textReplacements": [
      { "tag": "{{TITLE}}", "value": "Quarterly Report" },
      { "tag": "{{DATE}}", "value": "December 2024" },
      { "tag": "\${author}", "value": "John Smith" }
    ],
    "includeHeaders": true,
    "includeFooters": true
  }

Examples:
  # Replace text in template
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.docx replacements.json output.docx

  # With verbose output
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.docx replacements.json output.docx -v
`);
}

// === Utility Functions ===

// deno-lint-ignore no-explicit-any
function getElementsByTagNameNS(parent: any, ns: string, localName: string): any[] {
  const elements = parent.getElementsByTagNameNS(ns, localName);
  // deno-lint-ignore no-explicit-any
  return Array.from(elements) as any[];
}

function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// === Text Replacement ===

interface ReplacementResult {
  modified: boolean;
  replacementCount: number;
}

function replaceTextInXml(
  xmlContent: string,
  replacements: TextReplacement[],
  verbose: boolean = false
): { content: string; result: ReplacementResult } {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  let totalReplacements = 0;
  let modified = false;

  // Find all text elements
  const textElements = getElementsByTagNameNS(doc, NS.w, "t");

  // deno-lint-ignore no-explicit-any
  for (const textEl of textElements as any[]) {
    let text = textEl.textContent || "";
    const originalText = text;

    for (const replacement of replacements) {
      // The tag should match exactly as provided
      const tag = replacement.tag;

      if (text.includes(tag)) {
        const regex = new RegExp(escapeRegExp(tag), "g");
        const matches = text.match(regex);
        if (matches) {
          totalReplacements += matches.length;
        }
        text = text.replace(regex, replacement.value);
      }
    }

    if (text !== originalText) {
      textEl.textContent = text;
      modified = true;
    }
  }

  const serializer = new XMLSerializer();
  return {
    content: serializer.serializeToString(doc),
    result: { modified, replacementCount: totalReplacements },
  };
}

/**
 * Handle split placeholders across multiple text runs.
 * Word often splits text like "{{TITLE}}" into multiple runs like "<w:t>{{</w:t><w:t>TITLE</w:t><w:t>}}</w:t>"
 * This function consolidates runs within a paragraph before replacement.
 */
function consolidateTextRuns(xmlContent: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlContent, "text/xml");

  // Process each paragraph
  const paragraphs = getElementsByTagNameNS(doc, NS.w, "p");

  // deno-lint-ignore no-explicit-any
  for (const para of paragraphs as any[]) {
    const runs = getElementsByTagNameNS(para, NS.w, "r");

    // Collect all text content and check for split placeholders
    let fullText = "";
    // deno-lint-ignore no-explicit-any
    const textNodes: any[] = [];

    // deno-lint-ignore no-explicit-any
    for (const run of runs as any[]) {
      const tElements = getElementsByTagNameNS(run, NS.w, "t");
      for (const t of tElements) {
        fullText += t.textContent || "";
        textNodes.push(t);
      }
    }

    // Check if there are placeholders in the combined text that might be split
    const hasSplitPlaceholder = (
      (fullText.includes("{{") && fullText.includes("}}")) ||
      (fullText.includes("${") && fullText.includes("}"))
    );

    // Only consolidate if we have split placeholders and multiple text nodes
    if (hasSplitPlaceholder && textNodes.length > 1) {
      // Put all text in the first node and clear others
      if (textNodes.length > 0) {
        textNodes[0].textContent = fullText;
        for (let i = 1; i < textNodes.length; i++) {
          textNodes[i].textContent = "";
        }
      }
    }
  }

  const serializer = new XMLSerializer();
  return serializer.serializeToString(doc);
}

// === Core Logic ===

export async function generateFromTemplate(
  templatePath: string,
  spec: TemplateSpec,
  outputPath: string,
  options: { verbose?: boolean; specDir?: string } = {}
): Promise<void> {
  const { verbose = false } = options;

  // Read template
  const templateData = await Deno.readFile(templatePath);
  const zip = await JSZip.loadAsync(templateData);

  if (verbose) {
    console.error(`Loaded template: ${basename(templatePath)}`);
  }

  const replacements = spec.textReplacements || [];
  const includeHeaders = spec.includeHeaders !== false;
  const includeFooters = spec.includeFooters !== false;

  if (verbose) {
    console.error(`Processing ${replacements.length} text replacements`);
    console.error(`Include headers: ${includeHeaders}, Include footers: ${includeFooters}`);
  }

  let totalReplacements = 0;

  // Process main document
  const documentFile = zip.file("word/document.xml");
  if (documentFile) {
    let documentXml = await documentFile.async("string");

    // Consolidate split text runs
    documentXml = consolidateTextRuns(documentXml);

    // Apply replacements
    const { content, result } = replaceTextInXml(documentXml, replacements, verbose);
    zip.file("word/document.xml", content);
    totalReplacements += result.replacementCount;

    if (verbose && result.modified) {
      console.error(`Document: ${result.replacementCount} replacements`);
    }
  }

  // Process headers
  if (includeHeaders) {
    const headerFiles = ["word/header1.xml", "word/header2.xml", "word/header3.xml"];
    for (const headerPath of headerFiles) {
      const headerFile = zip.file(headerPath);
      if (headerFile) {
        let headerXml = await headerFile.async("string");
        headerXml = consolidateTextRuns(headerXml);
        const { content, result } = replaceTextInXml(headerXml, replacements, verbose);
        zip.file(headerPath, content);
        totalReplacements += result.replacementCount;

        if (verbose && result.modified) {
          console.error(`${headerPath}: ${result.replacementCount} replacements`);
        }
      }
    }
  }

  // Process footers
  if (includeFooters) {
    const footerFiles = ["word/footer1.xml", "word/footer2.xml", "word/footer3.xml"];
    for (const footerPath of footerFiles) {
      const footerFile = zip.file(footerPath);
      if (footerFile) {
        let footerXml = await footerFile.async("string");
        footerXml = consolidateTextRuns(footerXml);
        const { content, result } = replaceTextInXml(footerXml, replacements, verbose);
        zip.file(footerPath, content);
        totalReplacements += result.replacementCount;

        if (verbose && result.modified) {
          console.error(`${footerPath}: ${result.replacementCount} replacements`);
        }
      }
    }
  }

  if (verbose) {
    console.error(`Total replacements: ${totalReplacements}`);
  }

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
      "Error: template.docx, spec.json, and output.docx are required\n"
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
