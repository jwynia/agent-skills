#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-scratch.ts - Create DOCX from scratch using JSON specification
 *
 * Creates Word documents programmatically from a JSON specification
 * using the docx library. Supports paragraphs, tables, images, headers, and footers.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-scratch.ts <spec.json> <output.docx>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read specification file and image assets
 *   --allow-write: Write output DOCX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { dirname, resolve } from "jsr:@std/path@1.0.8";
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  BorderStyle,
  Header,
  Footer,
  PageBreak,
  ImageRun,
  ExternalHyperlink,
  // deno-lint-ignore no-explicit-any
} from "npm:docx@9.0.2" as any;

// === Types ===
export interface TextRunSpec {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  fontSize?: number; // points
  font?: string;
  color?: string; // hex without #
  highlight?: string;
  superScript?: boolean;
  subScript?: boolean;
}

export interface HyperlinkSpec {
  text: string;
  url: string;
  bold?: boolean;
  italic?: boolean;
}

export interface ImageSpec {
  path: string;
  width: number; // pixels
  height: number; // pixels
  altText?: string;
}

export interface ParagraphSpec {
  text?: string;
  runs?: (TextRunSpec | HyperlinkSpec | ImageSpec)[];
  heading?: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: "left" | "center" | "right" | "justify";
  bullet?: boolean;
  numbering?: boolean;
  spacing?: {
    before?: number;
    after?: number;
    line?: number;
  };
  indent?: {
    left?: number;
    right?: number;
    firstLine?: number;
  };
  pageBreakBefore?: boolean;
}

export interface TableCellSpec {
  content: ParagraphSpec[];
  width?: number; // percentage or points
  rowSpan?: number;
  colSpan?: number;
  shading?: string; // hex color
  verticalAlign?: "top" | "center" | "bottom";
}

export interface TableRowSpec {
  cells: TableCellSpec[];
  isHeader?: boolean;
}

export interface TableSpec {
  rows: TableRowSpec[];
  width?: number; // percentage
  borders?: boolean;
}

export interface HeaderFooterSpec {
  paragraphs: ParagraphSpec[];
}

export interface SectionSpec {
  content: (ParagraphSpec | TableSpec | { pageBreak: true })[];
  header?: HeaderFooterSpec;
  footer?: HeaderFooterSpec;
}

export interface DocumentSpec {
  title?: string;
  subject?: string;
  creator?: string;
  description?: string;
  styles?: {
    defaultFont?: string;
    defaultFontSize?: number;
  };
  sections: SectionSpec[];
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
${SCRIPT_NAME} v${VERSION} - Create DOCX from scratch using JSON specification

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <spec.json> <output.docx>

Arguments:
  <spec.json>      Path to JSON specification file
  <output.docx>    Path for output Word document

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "title": "Document Title",
    "creator": "Author Name",
    "sections": [
      {
        "content": [
          {
            "text": "Hello World",
            "heading": 1
          },
          {
            "runs": [
              { "text": "Bold text", "bold": true },
              { "text": " and ", "italic": true },
              { "text": "normal text" }
            ]
          }
        ]
      }
    ]
  }

Examples:
  # Generate document
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.docx

  # With verbose output
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.docx -v
`);
}

// === Conversion Helpers ===
function getAlignment(align?: string): typeof AlignmentType[keyof typeof AlignmentType] | undefined {
  switch (align) {
    case "left": return AlignmentType.LEFT;
    case "center": return AlignmentType.CENTER;
    case "right": return AlignmentType.RIGHT;
    case "justify": return AlignmentType.JUSTIFIED;
    default: return undefined;
  }
}

function getHeadingLevel(level?: number): typeof HeadingLevel[keyof typeof HeadingLevel] | undefined {
  switch (level) {
    case 1: return HeadingLevel.HEADING_1;
    case 2: return HeadingLevel.HEADING_2;
    case 3: return HeadingLevel.HEADING_3;
    case 4: return HeadingLevel.HEADING_4;
    case 5: return HeadingLevel.HEADING_5;
    case 6: return HeadingLevel.HEADING_6;
    default: return undefined;
  }
}

// === Element Builders ===
function buildTextRun(spec: TextRunSpec): typeof TextRun {
  return new TextRun({
    text: spec.text,
    bold: spec.bold,
    italics: spec.italic,
    underline: spec.underline ? {} : undefined,
    strike: spec.strike,
    size: spec.fontSize ? spec.fontSize * 2 : undefined, // points to half-points
    font: spec.font,
    color: spec.color,
    highlight: spec.highlight,
    superScript: spec.superScript,
    subScript: spec.subScript,
  });
}

async function buildImageRun(spec: ImageSpec, specDir: string): Promise<typeof ImageRun> {
  const imagePath = resolve(specDir, spec.path);
  const imageData = await Deno.readFile(imagePath);

  return new ImageRun({
    data: imageData,
    transformation: {
      width: spec.width,
      height: spec.height,
    },
    altText: spec.altText ? { title: spec.altText, description: spec.altText } : undefined,
  });
}

function buildHyperlink(spec: HyperlinkSpec): typeof ExternalHyperlink {
  return new ExternalHyperlink({
    link: spec.url,
    children: [
      new TextRun({
        text: spec.text,
        bold: spec.bold,
        italics: spec.italic,
        style: "Hyperlink",
      }),
    ],
  });
}

function isHyperlink(spec: TextRunSpec | HyperlinkSpec | ImageSpec): spec is HyperlinkSpec {
  return "url" in spec;
}

function isImage(spec: TextRunSpec | HyperlinkSpec | ImageSpec): spec is ImageSpec {
  return "path" in spec && "width" in spec;
}

// deno-lint-ignore no-explicit-any
async function buildParagraph(spec: ParagraphSpec, specDir: string): Promise<any> {
  // deno-lint-ignore no-explicit-any
  const children: any[] = [];

  if (spec.pageBreakBefore) {
    children.push(new PageBreak());
  }

  if (spec.text) {
    children.push(new TextRun(spec.text));
  }

  if (spec.runs) {
    for (const run of spec.runs) {
      if (isImage(run)) {
        children.push(await buildImageRun(run, specDir));
      } else if (isHyperlink(run)) {
        children.push(buildHyperlink(run));
      } else {
        children.push(buildTextRun(run));
      }
    }
  }

  return new Paragraph({
    children,
    heading: getHeadingLevel(spec.heading),
    alignment: getAlignment(spec.alignment),
    bullet: spec.bullet ? { level: 0 } : undefined,
    numbering: spec.numbering ? { reference: "default-numbering", level: 0 } : undefined,
    spacing: spec.spacing ? {
      before: spec.spacing.before,
      after: spec.spacing.after,
      line: spec.spacing.line,
    } : undefined,
    indent: spec.indent ? {
      left: spec.indent.left,
      right: spec.indent.right,
      firstLine: spec.indent.firstLine,
    } : undefined,
  });
}

// deno-lint-ignore no-explicit-any
async function buildTableCell(spec: TableCellSpec, specDir: string): Promise<any> {
  const paragraphs = await Promise.all(
    spec.content.map((p) => buildParagraph(p, specDir))
  );

  return new TableCell({
    children: paragraphs,
    width: spec.width ? { size: spec.width, type: WidthType.PERCENTAGE } : undefined,
    rowSpan: spec.rowSpan,
    columnSpan: spec.colSpan,
    shading: spec.shading ? { fill: spec.shading } : undefined,
    verticalAlign: spec.verticalAlign === "center" ? "center" :
                   spec.verticalAlign === "bottom" ? "bottom" : undefined,
  });
}

// deno-lint-ignore no-explicit-any
async function buildTable(spec: TableSpec, specDir: string): Promise<any> {
  const rows = await Promise.all(
    spec.rows.map(async (rowSpec) => {
      const cells = await Promise.all(
        rowSpec.cells.map((c) => buildTableCell(c, specDir))
      );
      return new TableRow({
        children: cells,
        tableHeader: rowSpec.isHeader,
      });
    })
  );

  return new Table({
    rows,
    width: spec.width ? { size: spec.width, type: WidthType.PERCENTAGE } : undefined,
    borders: spec.borders === false ? {
      top: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.NONE },
      insideVertical: { style: BorderStyle.NONE },
    } : undefined,
  });
}

function isTable(item: ParagraphSpec | TableSpec | { pageBreak: true }): item is TableSpec {
  return "rows" in item;
}

function isPageBreak(item: ParagraphSpec | TableSpec | { pageBreak: true }): item is { pageBreak: true } {
  return "pageBreak" in item;
}

// deno-lint-ignore no-explicit-any
async function buildHeaderFooter(spec: HeaderFooterSpec, specDir: string): Promise<any[]> {
  return Promise.all(spec.paragraphs.map((p) => buildParagraph(p, specDir)));
}

// === Core Logic ===
export async function generateFromSpec(
  spec: DocumentSpec,
  outputPath: string,
  options: { verbose?: boolean; specDir?: string } = {}
): Promise<void> {
  const { verbose = false, specDir = "." } = options;

  if (verbose) {
    console.error(`Creating document with ${spec.sections.length} section(s)`);
  }

  // Build sections
  // deno-lint-ignore no-explicit-any
  const sections: any[] = [];

  for (let i = 0; i < spec.sections.length; i++) {
    const sectionSpec = spec.sections[i];
    // deno-lint-ignore no-explicit-any
    const children: any[] = [];

    if (verbose) {
      console.error(`Processing section ${i + 1}: ${sectionSpec.content.length} items`);
    }

    for (const item of sectionSpec.content) {
      if (isPageBreak(item)) {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      } else if (isTable(item)) {
        children.push(await buildTable(item, specDir));
      } else {
        children.push(await buildParagraph(item, specDir));
      }
    }

    // deno-lint-ignore no-explicit-any
    const section: any = { children };

    // Add header
    if (sectionSpec.header) {
      section.headers = {
        default: new Header({
          children: await buildHeaderFooter(sectionSpec.header, specDir),
        }),
      };
    }

    // Add footer
    if (sectionSpec.footer) {
      section.footers = {
        default: new Footer({
          children: await buildHeaderFooter(sectionSpec.footer, specDir),
        }),
      };
    }

    sections.push(section);
  }

  // Create document
  const doc = new Document({
    title: spec.title,
    subject: spec.subject,
    creator: spec.creator,
    description: spec.description,
    styles: spec.styles ? {
      default: {
        document: {
          run: {
            font: spec.styles.defaultFont,
            size: spec.styles.defaultFontSize ? spec.styles.defaultFontSize * 2 : undefined,
          },
        },
      },
    } : undefined,
    sections,
  });

  // Write output
  const buffer = await Packer.toBuffer(doc);
  await Deno.writeFile(outputPath, new Uint8Array(buffer));

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
    console.error("Error: Both spec.json and output.docx are required\n");
    printHelp();
    Deno.exit(1);
  }

  const specPath = positionalArgs[0];
  const outputPath = positionalArgs[1];

  try {
    const specText = await Deno.readTextFile(specPath);
    const spec = JSON.parse(specText) as DocumentSpec;

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
