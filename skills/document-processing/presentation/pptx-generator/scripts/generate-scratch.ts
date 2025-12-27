#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-scratch.ts - Create PPTX from scratch using JSON specification
 *
 * Creates PowerPoint presentations programmatically from a JSON specification
 * using PptxGenJS. Supports text, images, tables, shapes, and charts.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-scratch.ts <spec.json> <output.pptx>
 *
 * Options:
 *   -h, --help       Show help
 *   -v, --verbose    Enable verbose output
 *
 * Permissions:
 *   --allow-read: Read specification file and image assets
 *   --allow-write: Write output PPTX file
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { dirname, resolve } from "jsr:@std/path@1.0.8";
// deno-lint-ignore no-explicit-any
const PptxGenJS: any = (await import("npm:pptxgenjs@3.12.0")).default;

// === Types ===

export interface TextOptions {
  text: string;
  fontSize?: number;
  fontFace?: string;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: "left" | "center" | "right" | "justify";
  valign?: "top" | "middle" | "bottom";
  breakLine?: boolean;
  bullet?: boolean | { type?: string; code?: string };
  paraSpaceAfter?: number;
  paraSpaceBefore?: number;
}

export interface ImageOptions {
  path?: string;
  data?: string; // base64
  sizing?: {
    type: "contain" | "cover" | "crop";
    w?: number;
    h?: number;
  };
  hyperlink?: { url: string };
}

export interface TableCell {
  text: string;
  options?: {
    bold?: boolean;
    color?: string;
    fill?: string;
    fontSize?: number;
    align?: "left" | "center" | "right";
    valign?: "top" | "middle" | "bottom";
    colspan?: number;
    rowspan?: number;
  };
}

export interface TableOptions {
  rows: (string | TableCell)[][];
  colW?: number[];
  rowH?: number[];
  border?: { pt?: number; color?: string };
  fill?: string;
  fontSize?: number;
  fontFace?: string;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
}

export interface ShapeOptions {
  type:
    | "rect"
    | "roundRect"
    | "ellipse"
    | "triangle"
    | "line"
    | "arrow"
    | "star";
  fill?: string;
  line?: { color?: string; width?: number; dashType?: string };
  text?: string;
  fontSize?: number;
  fontFace?: string;
  color?: string;
  align?: "left" | "center" | "right";
  valign?: "top" | "middle" | "bottom";
}

export interface ChartOptions {
  type: "bar" | "line" | "pie" | "doughnut" | "area" | "scatter";
  data: {
    name: string;
    labels: string[];
    values: number[];
  }[];
  title?: string;
  showLegend?: boolean;
  legendPos?: "b" | "l" | "r" | "t" | "tr";
  showTitle?: boolean;
  showValue?: boolean;
  catAxisTitle?: string;
  valAxisTitle?: string;
}

export interface ElementSpec {
  type: "text" | "image" | "table" | "shape" | "chart";
  x: number; // inches
  y: number; // inches
  w: number; // inches
  h: number; // inches
  options: TextOptions | ImageOptions | TableOptions | ShapeOptions | ChartOptions;
}

export interface SlideSpec {
  layout?: "blank" | "title" | "titleAndContent" | "section" | "twoColumn";
  background?: {
    color?: string;
    image?: string;
  };
  masterName?: string;
  elements: ElementSpec[];
}

export interface PresentationSpec {
  title?: string;
  subject?: string;
  author?: string;
  company?: string;
  layout?: {
    width?: number; // inches, default 10
    height?: number; // inches, default 5.625 (16:9)
  };
  theme?: {
    headFontFace?: string;
    bodyFontFace?: string;
  };
  slides: SlideSpec[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  _: (string | number)[];
}

// Use 'any' for PptxGenJS types to avoid namespace issues
// deno-lint-ignore no-explicit-any
type Slide = any;
// deno-lint-ignore no-explicit-any
type Pptx = any;

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-scratch";

// Shape type mapping
const SHAPE_MAP: Record<string, string> = {
  rect: "rect",
  roundRect: "roundRect",
  ellipse: "ellipse",
  triangle: "triangle",
  line: "line",
  arrow: "rightArrow",
  star: "star5",
};

// Chart type mapping
const CHART_MAP: Record<string, string> = {
  bar: "bar",
  line: "line",
  pie: "pie",
  doughnut: "doughnut",
  area: "area",
  scatter: "scatter",
};

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Create PPTX from scratch using JSON specification

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <spec.json> <output.pptx>

Arguments:
  <spec.json>      Path to JSON specification file
  <output.pptx>    Path for output PowerPoint file

Options:
  -h, --help       Show this help message
  -v, --verbose    Enable verbose output

Specification Format:
  {
    "title": "Presentation Title",
    "author": "Author Name",
    "slides": [
      {
        "layout": "blank",
        "background": { "color": "FFFFFF" },
        "elements": [
          {
            "type": "text",
            "x": 1, "y": 1, "w": 8, "h": 1,
            "options": {
              "text": "Hello World",
              "fontSize": 44,
              "bold": true,
              "color": "003366"
            }
          }
        ]
      }
    ]
  }

Examples:
  # Generate from specification
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.pptx

  # With verbose output
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts spec.json output.pptx -v
`);
}

// === Core Logic ===

function addTextElement(slide: Slide, element: ElementSpec): void {
  const opts = element.options as TextOptions;
  slide.addText(opts.text, {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
    fontSize: opts.fontSize,
    fontFace: opts.fontFace,
    color: opts.color,
    bold: opts.bold,
    italic: opts.italic,
    underline: opts.underline ? { style: "sng" } : undefined,
    align: opts.align,
    valign: opts.valign,
    bullet: opts.bullet,
    paraSpaceAfter: opts.paraSpaceAfter,
    paraSpaceBefore: opts.paraSpaceBefore,
  });
}

async function addImageElement(
  slide: Slide,
  element: ElementSpec,
  specDir: string
): Promise<void> {
  const opts = element.options as ImageOptions;

  // deno-lint-ignore no-explicit-any
  const imageProps: any = {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
    sizing: opts.sizing,
    hyperlink: opts.hyperlink,
  };

  if (opts.data) {
    imageProps.data = opts.data;
  } else if (opts.path) {
    const imagePath = resolve(specDir, opts.path);
    const imageData = await Deno.readFile(imagePath);
    const base64 = btoa(String.fromCharCode(...imageData));
    const ext = opts.path.split(".").pop()?.toLowerCase() || "png";
    imageProps.data = `image/${ext};base64,${base64}`;
  }

  slide.addImage(imageProps);
}

function addTableElement(slide: Slide, element: ElementSpec): void {
  const opts = element.options as TableOptions;

  // Convert rows to pptxgen format
  const tableRows = opts.rows.map((row) =>
    row.map((cell) => {
      if (typeof cell === "string") {
        return { text: cell };
      }
      return {
        text: cell.text,
        options: {
          bold: cell.options?.bold,
          color: cell.options?.color,
          fill: cell.options?.fill ? { color: cell.options.fill } : undefined,
          fontSize: cell.options?.fontSize,
          align: cell.options?.align,
          valign: cell.options?.valign,
          colspan: cell.options?.colspan,
          rowspan: cell.options?.rowspan,
        },
      };
    })
  );

  slide.addTable(tableRows, {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
    colW: opts.colW,
    rowH: opts.rowH,
    border: opts.border,
    fill: opts.fill ? { color: opts.fill } : undefined,
    fontSize: opts.fontSize,
    fontFace: opts.fontFace,
    color: opts.color,
    align: opts.align,
    valign: opts.valign,
  });
}

function addShapeElement(slide: Slide, element: ElementSpec): void {
  const opts = element.options as ShapeOptions;
  const shapeType = SHAPE_MAP[opts.type] || "rect";

  // deno-lint-ignore no-explicit-any
  const shapeProps: any = {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
    fill: opts.fill ? { color: opts.fill } : undefined,
    line: opts.line
      ? {
          color: opts.line.color,
          width: opts.line.width,
          dashType: opts.line.dashType,
        }
      : undefined,
  };

  if (opts.text) {
    slide.addText(opts.text, {
      ...shapeProps,
      shape: shapeType,
      fontSize: opts.fontSize,
      fontFace: opts.fontFace,
      color: opts.color,
      align: opts.align,
      valign: opts.valign,
    });
  } else {
    slide.addShape(shapeType, shapeProps);
  }
}

function addChartElement(slide: Slide, element: ElementSpec): void {
  const opts = element.options as ChartOptions;
  const chartType = CHART_MAP[opts.type] || "bar";

  const chartData = opts.data.map((series) => ({
    name: series.name,
    labels: series.labels,
    values: series.values,
  }));

  slide.addChart(chartType, chartData, {
    x: element.x,
    y: element.y,
    w: element.w,
    h: element.h,
    title: opts.title,
    showLegend: opts.showLegend,
    legendPos: opts.legendPos,
    showTitle: opts.showTitle,
    showValue: opts.showValue,
    catAxisTitle: opts.catAxisTitle,
    valAxisTitle: opts.valAxisTitle,
  });
}

export async function generateFromSpec(
  spec: PresentationSpec,
  outputPath: string,
  options: { verbose?: boolean; specDir?: string } = {}
): Promise<void> {
  const { verbose = false, specDir = "." } = options;

  // Create presentation
  const pptx: Pptx = new PptxGenJS();

  // Set metadata
  if (spec.title) pptx.title = spec.title;
  if (spec.subject) pptx.subject = spec.subject;
  if (spec.author) pptx.author = spec.author;
  if (spec.company) pptx.company = spec.company;

  // Set layout
  if (spec.layout) {
    if (spec.layout.width && spec.layout.height) {
      pptx.defineLayout({
        name: "CUSTOM",
        width: spec.layout.width,
        height: spec.layout.height,
      });
      pptx.layout = "CUSTOM";
    }
  }

  if (verbose) {
    console.error(`Creating presentation with ${spec.slides.length} slides`);
  }

  // Process each slide
  for (let i = 0; i < spec.slides.length; i++) {
    const slideSpec = spec.slides[i];

    if (verbose) {
      console.error(
        `Processing slide ${i + 1}: ${slideSpec.elements.length} elements`
      );
    }

    // Add slide
    const slide: Slide = pptx.addSlide();

    // Set background
    if (slideSpec.background) {
      if (slideSpec.background.color) {
        slide.background = { color: slideSpec.background.color };
      } else if (slideSpec.background.image) {
        const imagePath = resolve(specDir, slideSpec.background.image);
        const imageData = await Deno.readFile(imagePath);
        const base64 = btoa(String.fromCharCode(...imageData));
        const ext = slideSpec.background.image.split(".").pop()?.toLowerCase() || "png";
        slide.background = { data: `image/${ext};base64,${base64}` };
      }
    }

    // Add elements
    for (const element of slideSpec.elements) {
      switch (element.type) {
        case "text":
          addTextElement(slide, element);
          break;
        case "image":
          await addImageElement(slide, element, specDir);
          break;
        case "table":
          addTableElement(slide, element);
          break;
        case "shape":
          addShapeElement(slide, element);
          break;
        case "chart":
          addChartElement(slide, element);
          break;
        default:
          if (verbose) {
            console.error(`Unknown element type: ${(element as ElementSpec).type}`);
          }
      }
    }
  }

  // Write output file
  const buffer = await pptx.write({ outputType: "nodebuffer" });
  await Deno.writeFile(outputPath, new Uint8Array(buffer as ArrayBuffer));

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
    console.error("Error: Both spec.json and output.pptx are required\n");
    printHelp();
    Deno.exit(1);
  }

  const specPath = positionalArgs[0];
  const outputPath = positionalArgs[1];

  try {
    // Read and parse specification
    const specText = await Deno.readTextFile(specPath);
    const spec = JSON.parse(specText) as PresentationSpec;

    // Get directory of spec file for resolving relative paths
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
