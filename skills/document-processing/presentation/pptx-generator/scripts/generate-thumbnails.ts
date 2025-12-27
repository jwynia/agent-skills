#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * generate-thumbnails.ts - Extract and display PPTX slide information
 *
 * Extracts thumbnail and slide metadata from PowerPoint files.
 * Provides visual preview information for template analysis.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-thumbnails.ts <input.pptx> [options]
 *
 * Options:
 *   -h, --help         Show help
 *   -v, --verbose      Enable verbose output
 *   --extract-thumb    Extract presentation thumbnail to file
 *   --extract-images   Extract all embedded images
 *   --output-dir <dir> Output directory for extracted files (default: current dir)
 *   --info             Show slide information in JSON format
 *
 * Permissions:
 *   --allow-read: Read PPTX file
 *   --allow-write: Write extracted files
 *
 * Note: Full slide-by-slide thumbnail rendering requires external tools
 * like LibreOffice. This script extracts built-in previews and metadata.
 */

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";
import { basename, join } from "jsr:@std/path@1.0.8";
import JSZip from "npm:jszip@3.10.1";
import { DOMParser } from "npm:@xmldom/xmldom@0.9.6";

// === Types ===

export interface SlideInfo {
  slideNumber: number;
  title?: string;
  textPreview?: string;
  shapeCount: number;
  imageCount: number;
  hasNotes: boolean;
}

export interface EmbeddedImage {
  filename: string;
  path: string;
  size: number;
  type: string;
}

export interface PresentationInfo {
  filename: string;
  slideCount: number;
  slideWidth: number;
  slideHeight: number;
  aspectRatio: string;
  hasThumbnail: boolean;
  thumbnailPath?: string;
  slides: SlideInfo[];
  embeddedImages: EmbeddedImage[];
}

interface ParsedArgs {
  help: boolean;
  verbose: boolean;
  "extract-thumb": boolean;
  "extract-images": boolean;
  "output-dir": string;
  info: boolean;
  _: (string | number)[];
}

// === Constants ===
const VERSION = "1.0.0";
const SCRIPT_NAME = "generate-thumbnails";

const NS = {
  a: "http://schemas.openxmlformats.org/drawingml/2006/main",
  p: "http://schemas.openxmlformats.org/presentationml/2006/main",
  r: "http://schemas.openxmlformats.org/officeDocument/2006/relationships",
};

const EMU_PER_INCH = 914400;

// === Help Text ===
function printHelp(): void {
  console.log(`
${SCRIPT_NAME} v${VERSION} - Extract thumbnails and slide info from PPTX

Usage:
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts <input.pptx> [options]

Arguments:
  <input.pptx>       Path to the PowerPoint file to analyze

Options:
  -h, --help         Show this help message
  -v, --verbose      Enable verbose output
  --extract-thumb    Extract presentation thumbnail to file
  --extract-images   Extract all embedded images
  --output-dir <dir> Output directory (default: current directory)
  --info             Output presentation info as JSON (default behavior)

Output:
  By default, outputs JSON with presentation metadata including:
  - Slide count and dimensions
  - Per-slide information (title, text preview, shape/image counts)
  - List of embedded images

Examples:
  # Get presentation info
  deno run --allow-read scripts/${SCRIPT_NAME}.ts template.pptx

  # Extract thumbnail
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.pptx --extract-thumb --output-dir ./previews

  # Extract all embedded images
  deno run --allow-read --allow-write scripts/${SCRIPT_NAME}.ts \\
    template.pptx --extract-images --output-dir ./images

Note:
  For full slide-by-slide thumbnail rendering, use LibreOffice:
    libreoffice --headless --convert-to pdf template.pptx
    pdftoppm -png template.pdf slide
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

function emuToInches(emu: number): number {
  return Math.round((emu / EMU_PER_INCH) * 1000) / 1000;
}

function getAspectRatio(width: number, height: number): string {
  const ratio = width / height;
  if (Math.abs(ratio - 16 / 9) < 0.01) return "16:9";
  if (Math.abs(ratio - 4 / 3) < 0.01) return "4:3";
  if (Math.abs(ratio - 16 / 10) < 0.01) return "16:10";
  return `${width.toFixed(2)}:${height.toFixed(2)}`;
}

// === Slide Analysis ===

function extractSlideTitle(slideXml: string): string | undefined {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, "text/xml");

  // Look for title placeholder
  const shapes = getElementsByTagNameNS(doc, NS.p, "sp");

  for (const shape of shapes) {
    // Check if this is a title placeholder
    const nvSpPr = getElementsByTagNameNS(shape, NS.p, "nvSpPr")[0];
    if (!nvSpPr) continue;

    const nvPr = getElementsByTagNameNS(nvSpPr, NS.p, "nvPr")[0];
    if (!nvPr) continue;

    const ph = getElementsByTagNameNS(nvPr, NS.p, "ph")[0];
    if (!ph) continue;

    const phType = ph.getAttribute("type");
    if (phType === "title" || phType === "ctrTitle") {
      // Extract text from this shape
      const txBody = getElementsByTagNameNS(shape, NS.p, "txBody")[0];
      if (!txBody) continue;

      const textElements = getElementsByTagNameNS(txBody, NS.a, "t");
      const text = textElements
        .map((t) => t.textContent || "")
        .join("")
        .trim();

      if (text) return text;
    }
  }

  return undefined;
}

function extractTextPreview(slideXml: string, maxLength = 100): string | undefined {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, "text/xml");

  const textElements = getElementsByTagNameNS(doc, NS.a, "t");
  const allText = textElements
    .map((t) => t.textContent || "")
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (!allText) return undefined;

  if (allText.length <= maxLength) return allText;
  return allText.substring(0, maxLength - 3) + "...";
}

function countShapes(slideXml: string): number {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, "text/xml");
  return getElementsByTagNameNS(doc, NS.p, "sp").length;
}

function countImages(slideXml: string): number {
  const parser = new DOMParser();
  const doc = parser.parseFromString(slideXml, "text/xml");
  return getElementsByTagNameNS(doc, NS.p, "pic").length;
}

// === Core Logic ===

export async function analyzePresentationThumbnails(
  pptxPath: string,
  options: { verbose?: boolean } = {}
): Promise<PresentationInfo> {
  const { verbose = false } = options;

  // Read the PPTX file
  const data = await Deno.readFile(pptxPath);
  const zip = await JSZip.loadAsync(data);

  const filename = basename(pptxPath);

  // Check for thumbnail
  const thumbnailFile = zip.file("docProps/thumbnail.jpeg") ||
    zip.file("docProps/thumbnail.png");
  const hasThumbnail = thumbnailFile !== null;

  if (verbose) {
    console.error(`Thumbnail present: ${hasThumbnail}`);
  }

  // Get presentation dimensions
  let slideWidth = 10;
  let slideHeight = 5.625;

  const presFile = zip.file("ppt/presentation.xml");
  if (presFile) {
    const presXml = await presFile.async("string");
    const parser = new DOMParser();
    const doc = parser.parseFromString(presXml, "text/xml");

    const sldSz = getElementsByTagNameNS(doc, NS.p, "sldSz")[0];
    if (sldSz) {
      const cx = parseInt(sldSz.getAttribute("cx") || "9144000", 10);
      const cy = parseInt(sldSz.getAttribute("cy") || "5143500", 10);
      slideWidth = emuToInches(cx);
      slideHeight = emuToInches(cy);
    }
  }

  // Find all slide files
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

  if (verbose) {
    console.error(`Found ${slideFiles.length} slides`);
  }

  // Analyze each slide
  const slides: SlideInfo[] = [];

  for (let i = 0; i < slideFiles.length; i++) {
    const slideNum = i + 1;
    const slideFile = zip.file(slideFiles[i]);
    if (!slideFile) continue;

    const slideXml = await slideFile.async("string");

    // Check for notes
    const notesPath = `ppt/notesSlides/notesSlide${slideNum}.xml`;
    const hasNotes = zip.file(notesPath) !== null;

    const slideInfo: SlideInfo = {
      slideNumber: slideNum,
      title: extractSlideTitle(slideXml),
      textPreview: extractTextPreview(slideXml),
      shapeCount: countShapes(slideXml),
      imageCount: countImages(slideXml),
      hasNotes,
    };

    slides.push(slideInfo);

    if (verbose) {
      console.error(
        `Slide ${slideNum}: "${slideInfo.title || "(no title)"}" - ${slideInfo.shapeCount} shapes, ${slideInfo.imageCount} images`
      );
    }
  }

  // Find embedded images
  const embeddedImages: EmbeddedImage[] = [];
  const mediaRegex = /^ppt\/media\/(.+)$/;

  zip.forEach((path, file) => {
    const match = path.match(mediaRegex);
    if (match && !file.dir) {
      const filename = match[1];
      const ext = filename.split(".").pop()?.toLowerCase() || "";

      let type = "unknown";
      if (["png", "jpg", "jpeg", "gif", "bmp", "tiff"].includes(ext)) {
        type = "image";
      } else if (["wmf", "emf"].includes(ext)) {
        type = "vector";
      } else if (["mp4", "mov", "avi", "wmv"].includes(ext)) {
        type = "video";
      }

      embeddedImages.push({
        filename,
        path,
        size: 0, // Size is not available without decompressing
        type,
      });
    }
  });

  if (verbose) {
    console.error(`Found ${embeddedImages.length} embedded media files`);
  }

  return {
    filename,
    slideCount: slideFiles.length,
    slideWidth,
    slideHeight,
    aspectRatio: getAspectRatio(slideWidth, slideHeight),
    hasThumbnail,
    thumbnailPath: hasThumbnail
      ? thumbnailFile?.name.endsWith(".png")
        ? "docProps/thumbnail.png"
        : "docProps/thumbnail.jpeg"
      : undefined,
    slides,
    embeddedImages,
  };
}

export async function extractThumbnail(
  pptxPath: string,
  outputDir: string,
  options: { verbose?: boolean } = {}
): Promise<string | null> {
  const { verbose = false } = options;

  const data = await Deno.readFile(pptxPath);
  const zip = await JSZip.loadAsync(data);

  const thumbnailJpeg = zip.file("docProps/thumbnail.jpeg");
  const thumbnailPng = zip.file("docProps/thumbnail.png");
  const thumbnailFile = thumbnailJpeg || thumbnailPng;

  if (!thumbnailFile) {
    if (verbose) {
      console.error("No thumbnail found in presentation");
    }
    return null;
  }

  const ext = thumbnailJpeg ? "jpeg" : "png";
  const baseName = basename(pptxPath, ".pptx");
  const outputPath = join(outputDir, `${baseName}-thumbnail.${ext}`);

  const thumbData = await thumbnailFile.async("uint8array");
  await Deno.writeFile(outputPath, thumbData);

  if (verbose) {
    console.error(`Extracted thumbnail to: ${outputPath}`);
  }

  return outputPath;
}

export async function extractEmbeddedImages(
  pptxPath: string,
  outputDir: string,
  options: { verbose?: boolean } = {}
): Promise<string[]> {
  const { verbose = false } = options;

  const data = await Deno.readFile(pptxPath);
  const zip = await JSZip.loadAsync(data);

  const baseName = basename(pptxPath, ".pptx");
  const extractedPaths: string[] = [];

  const mediaRegex = /^ppt\/media\/(.+)$/;

  const files: { path: string; filename: string; file: JSZip.JSZipObject }[] = [];
  zip.forEach((path, file) => {
    const match = path.match(mediaRegex);
    if (match && !file.dir) {
      files.push({ path, filename: match[1], file });
    }
  });

  for (const { filename, file } of files) {
    const outputPath = join(outputDir, `${baseName}-${filename}`);
    const fileData = await file.async("uint8array");
    await Deno.writeFile(outputPath, fileData);
    extractedPaths.push(outputPath);

    if (verbose) {
      console.error(`Extracted: ${outputPath}`);
    }
  }

  if (verbose) {
    console.error(`Extracted ${extractedPaths.length} media files`);
  }

  return extractedPaths;
}

// === Main CLI Handler ===
async function main(args: string[]): Promise<void> {
  const parsed = parseArgs(args, {
    boolean: ["help", "verbose", "extract-thumb", "extract-images", "info"],
    string: ["output-dir"],
    alias: { help: "h", verbose: "v" },
    default: {
      verbose: false,
      "extract-thumb": false,
      "extract-images": false,
      "output-dir": ".",
      info: true,
    },
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
  const outputDir = parsed["output-dir"];

  try {
    // Always analyze the presentation
    const info = await analyzePresentationThumbnails(inputPath, {
      verbose: parsed.verbose,
    });

    // Extract thumbnail if requested
    if (parsed["extract-thumb"]) {
      const thumbPath = await extractThumbnail(inputPath, outputDir, {
        verbose: parsed.verbose,
      });
      if (thumbPath) {
        info.thumbnailPath = thumbPath;
      }
    }

    // Extract images if requested
    if (parsed["extract-images"]) {
      const extractedPaths = await extractEmbeddedImages(inputPath, outputDir, {
        verbose: parsed.verbose,
      });
      // Update sizes for extracted images
      for (const embeddedImage of info.embeddedImages) {
        const extractedPath = extractedPaths.find((p) =>
          p.includes(embeddedImage.filename)
        );
        if (extractedPath) {
          try {
            const stat = await Deno.stat(extractedPath);
            embeddedImage.size = stat.size;
          } catch {
            // Ignore stat errors
          }
        }
      }
    }

    // Output info as JSON
    console.log(JSON.stringify(info, null, 2));
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
