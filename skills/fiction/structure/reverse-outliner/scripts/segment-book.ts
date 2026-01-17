#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Book Segmentation Script
 *
 * Parses raw book text into chapters and scenes.
 * Detects chapters via regex patterns and scenes via break markers or POV shifts.
 *
 * Usage:
 *   deno run --allow-read scripts/segment-book.ts book.txt
 *   deno run --allow-read scripts/segment-book.ts book.txt --output segments.json
 *   deno run --allow-read scripts/segment-book.ts book.txt --chapter-pattern "^CHAPTER"
 */

// === INTERFACES ===

interface Scene {
  id: string;
  startLine: number;
  endLine: number;
  wordCount: number;
  openingText: string;
  povCandidate: string | null;
}

interface Chapter {
  number: number;
  title: string;
  startLine: number;
  endLine: number;
  wordCount: number;
  scenes: Scene[];
}

interface SegmentationResult {
  title: string;
  totalWords: number;
  chapters: Chapter[];
  metadata: {
    totalChapters: number;
    totalScenes: number;
    avgSceneLength: number;
    segmentedAt: string;
  };
}

// === DEFAULT PATTERNS ===

const DEFAULT_CHAPTER_PATTERNS = [
  /^(Chapter|CHAPTER)\s+\d+/i,
  /^(Chapter|CHAPTER)\s+(One|Two|Three|Four|Five|Six|Seven|Eight|Nine|Ten|Eleven|Twelve|Thirteen|Fourteen|Fifteen|Sixteen|Seventeen|Eighteen|Nineteen|Twenty)/i,
  /^(PART|Part)\s+(ONE|TWO|THREE|I|II|III|IV|V|1|2|3|4|5)/i,
  /^\d+\s*$/,
  /^(PROLOGUE|EPILOGUE|Prologue|Epilogue)/i,
];

const DEFAULT_SCENE_BREAK_PATTERNS = [
  /^\s*\*\s*\*\s*\*\s*$/,
  /^\s*#\s*$/,
  /^\s*---\s*$/,
  /^\s*\* \* \*\s*$/,
  /^\s*~+\s*$/,
];

// Common first names for POV detection
const COMMON_NAMES = new Set([
  "John", "Jane", "Michael", "Sarah", "David", "Emily", "James", "Emma",
  "Robert", "Anna", "William", "Maria", "Thomas", "Elizabeth", "Jack", "Kate",
  "Alex", "Sam", "Chris", "Taylor", "Jordan", "Morgan", "Casey", "Quinn",
]);

// === UTILITIES ===

function countWords(text: string): number {
  return text.split(/\s+/).filter(w => w.length > 0).length;
}

function extractOpeningText(lines: string[], maxChars: number = 150): string {
  let text = "";
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed) {
      text += (text ? " " : "") + trimmed;
      if (text.length >= maxChars) {
        return text.substring(0, maxChars) + "...";
      }
    }
  }
  return text;
}

function detectPovCandidate(text: string): string | null {
  // Look for proper nouns in first few sentences
  const firstParagraph = text.split(/\n\s*\n/)[0] || text;
  const sentences = firstParagraph.split(/[.!?]+/).slice(0, 3);

  for (const sentence of sentences) {
    // Look for capitalized words that might be names
    const words = sentence.split(/\s+/);
    for (const word of words) {
      const cleaned = word.replace(/[^a-zA-Z]/g, "");
      if (cleaned.length > 2 && /^[A-Z][a-z]+$/.test(cleaned)) {
        // Check if it's a common name
        if (COMMON_NAMES.has(cleaned)) {
          return cleaned;
        }
      }
    }

    // Look for "I" as first-person POV indicator
    if (/\bI\b/.test(sentence)) {
      return "[First Person]";
    }
  }

  // Second pass: look for any capitalized word after common patterns
  const povPatterns = [
    /\b([A-Z][a-z]+)\s+(?:thought|felt|knew|wondered|watched|looked|stared)/,
    /\b([A-Z][a-z]+)'s\s+(?:eyes|heart|mind|stomach)/,
    /\b([A-Z][a-z]+)\s+(?:was|had been|stood|sat)/,
  ];

  for (const pattern of povPatterns) {
    const match = firstParagraph.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function isChapterHeading(line: string, patterns: RegExp[]): boolean {
  const trimmed = line.trim();
  if (!trimmed) return false;

  for (const pattern of patterns) {
    if (pattern.test(trimmed)) {
      return true;
    }
  }
  return false;
}

function isSceneBreak(line: string, patterns: RegExp[]): boolean {
  for (const pattern of patterns) {
    if (pattern.test(line)) {
      return true;
    }
  }
  return false;
}

function isBlankLineCluster(lines: string[], index: number, threshold: number = 3): boolean {
  let count = 0;
  for (let i = index; i < lines.length && i < index + threshold + 2; i++) {
    if (lines[i].trim() === "") {
      count++;
    } else {
      break;
    }
  }
  return count >= threshold;
}

// === CORE LOGIC ===

function segmentBook(
  text: string,
  options: {
    chapterPatterns?: RegExp[];
    sceneBreakPatterns?: RegExp[];
    blankLineThreshold?: number;
    title?: string;
  } = {}
): SegmentationResult {
  const chapterPatterns = options.chapterPatterns || DEFAULT_CHAPTER_PATTERNS;
  const sceneBreakPatterns = options.sceneBreakPatterns || DEFAULT_SCENE_BREAK_PATTERNS;
  const blankLineThreshold = options.blankLineThreshold || 3;

  const lines = text.split("\n");
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let currentSceneStartLine = 0;
  let sceneCounter = 0;
  let chapterNumber = 0;

  // First pass: find chapter boundaries
  const chapterBoundaries: { line: number; title: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (isChapterHeading(lines[i], chapterPatterns)) {
      chapterBoundaries.push({
        line: i,
        title: lines[i].trim(),
      });
    }
  }

  // If no chapters found, treat entire book as one chapter
  if (chapterBoundaries.length === 0) {
    chapterBoundaries.push({
      line: 0,
      title: "Full Text",
    });
  }

  // Process each chapter
  for (let chapterIdx = 0; chapterIdx < chapterBoundaries.length; chapterIdx++) {
    const chapterStart = chapterBoundaries[chapterIdx].line;
    const chapterEnd = chapterIdx < chapterBoundaries.length - 1
      ? chapterBoundaries[chapterIdx + 1].line - 1
      : lines.length - 1;

    chapterNumber++;
    const scenes: Scene[] = [];
    let sceneStartLine = chapterStart + 1; // Skip chapter heading

    // Find scene breaks within chapter
    for (let i = sceneStartLine; i <= chapterEnd; i++) {
      const isBreak = isSceneBreak(lines[i], sceneBreakPatterns) ||
        isBlankLineCluster(lines, i, blankLineThreshold);

      if (isBreak || i === chapterEnd) {
        // End current scene
        const sceneEndLine = isBreak ? i - 1 : i;

        if (sceneEndLine >= sceneStartLine) {
          const sceneLines = lines.slice(sceneStartLine, sceneEndLine + 1);
          const sceneText = sceneLines.join("\n");

          if (countWords(sceneText) > 10) { // Skip very short segments
            sceneCounter++;
            scenes.push({
              id: `ch${chapterNumber}-s${scenes.length + 1}`,
              startLine: sceneStartLine + 1, // Convert to 1-based
              endLine: sceneEndLine + 1,
              wordCount: countWords(sceneText),
              openingText: extractOpeningText(sceneLines),
              povCandidate: detectPovCandidate(sceneText),
            });
          }
        }

        // Start new scene after the break
        if (isBlankLineCluster(lines, i, blankLineThreshold)) {
          // Skip past all blank lines
          while (i <= chapterEnd && lines[i].trim() === "") {
            i++;
          }
          sceneStartLine = i;
          i--; // Adjust for loop increment
        } else {
          sceneStartLine = i + 1;
        }
      }
    }

    const chapterLines = lines.slice(chapterStart, chapterEnd + 1);
    const chapterText = chapterLines.join("\n");

    chapters.push({
      number: chapterNumber,
      title: chapterBoundaries[chapterIdx].title,
      startLine: chapterStart + 1,
      endLine: chapterEnd + 1,
      wordCount: countWords(chapterText),
      scenes: scenes.length > 0 ? scenes : [{
        id: `ch${chapterNumber}-s1`,
        startLine: chapterStart + 2,
        endLine: chapterEnd + 1,
        wordCount: countWords(chapterText),
        openingText: extractOpeningText(chapterLines.slice(1)),
        povCandidate: detectPovCandidate(chapterText),
      }],
    });
  }

  const totalWords = chapters.reduce((sum, ch) => sum + ch.wordCount, 0);
  const totalScenes = chapters.reduce((sum, ch) => sum + ch.scenes.length, 0);

  return {
    title: options.title || "Untitled",
    totalWords,
    chapters,
    metadata: {
      totalChapters: chapters.length,
      totalScenes,
      avgSceneLength: totalScenes > 0 ? Math.round(totalWords / totalScenes) : 0,
      segmentedAt: new Date().toISOString(),
    },
  };
}

// === CLI ===

function printHelp(): void {
  console.log(`Book Segmentation Script

Usage:
  deno run --allow-read scripts/segment-book.ts <book.txt> [options]

Options:
  --output <file>         Write output to JSON file (default: stdout)
  --chapter-pattern <rx>  Custom chapter detection regex
  --scene-break <marker>  Custom scene break marker (e.g., "***")
  --blank-threshold <n>   Number of blank lines to treat as scene break (default: 3)
  --title <title>         Book title for output metadata
  --help, -h              Show this help message

Examples:
  deno run --allow-read segment-book.ts novel.txt
  deno run --allow-read segment-book.ts novel.txt --output segments.json
  deno run --allow-read segment-book.ts novel.txt --chapter-pattern "^CHAPTER"
`);
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  let inputFile = "";
  let outputFile = "";
  let customChapterPattern: RegExp | null = null;
  let customSceneBreak = "";
  let blankThreshold = 3;
  let title = "";

  const skipIndices = new Set<number>();

  for (let i = 0; i < args.length; i++) {
    if (skipIndices.has(i)) continue;

    if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--chapter-pattern" && args[i + 1]) {
      customChapterPattern = new RegExp(args[i + 1], "i");
      skipIndices.add(i + 1);
    } else if (args[i] === "--scene-break" && args[i + 1]) {
      customSceneBreak = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--blank-threshold" && args[i + 1]) {
      blankThreshold = parseInt(args[i + 1], 10) || 3;
      skipIndices.add(i + 1);
    } else if (args[i] === "--title" && args[i + 1]) {
      title = args[i + 1];
      skipIndices.add(i + 1);
    } else if (!args[i].startsWith("--") && !inputFile) {
      inputFile = args[i];
    }
  }

  if (!inputFile) {
    console.error("Error: No input file provided");
    Deno.exit(1);
  }

  // Read input file
  let text: string;
  try {
    text = await Deno.readTextFile(inputFile);
  } catch (e) {
    console.error(`Error reading file: ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  }

  // Infer title from filename if not provided
  if (!title) {
    title = inputFile.split("/").pop()?.replace(/\.[^.]+$/, "") || "Untitled";
  }

  // Build options
  const options: Parameters<typeof segmentBook>[1] = {
    title,
    blankLineThreshold: blankThreshold,
  };

  if (customChapterPattern) {
    options.chapterPatterns = [customChapterPattern, ...DEFAULT_CHAPTER_PATTERNS];
  }

  if (customSceneBreak) {
    const escapedBreak = customSceneBreak.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    options.sceneBreakPatterns = [
      new RegExp(`^\\s*${escapedBreak}\\s*$`),
      ...DEFAULT_SCENE_BREAK_PATTERNS,
    ];
  }

  // Segment the book
  const result = segmentBook(text, options);

  // Output
  const jsonOutput = JSON.stringify(result, null, 2);

  if (outputFile) {
    await Deno.writeTextFile(outputFile, jsonOutput);
    console.log(`Segmentation complete: ${result.metadata.totalChapters} chapters, ${result.metadata.totalScenes} scenes`);
    console.log(`Output written to: ${outputFile}`);
  } else {
    console.log(jsonOutput);
  }
}

main();
