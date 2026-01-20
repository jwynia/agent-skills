#!/usr/bin/env -S deno run --allow-read

/**
 * ea-parse.ts - Ebook Parsing and Chunking
 *
 * Parses ebook files (txt, epub) into structured chunks with metadata
 * and position tracking for citation traceability.
 *
 * This is a DETERMINISTIC script - it handles mechanical text processing.
 * All semantic analysis is done by the LLM in later stages.
 *
 * Usage:
 *   deno run --allow-read scripts/ea-parse.ts <file>
 *   deno run --allow-read scripts/ea-parse.ts book.txt --chunk-size 1500
 *   deno run --allow-read scripts/ea-parse.ts book.txt --output parsed.json
 */

// === INTERFACES ===

interface BookMetadata {
  title: string;
  author: string;
  isbn?: string;
  publisher?: string;
  edition?: string;
  copyright_year?: number;
  file_path: string;
  file_format: "txt" | "epub";
  total_characters: number;
  total_chapters: number;
  parse_date: string;
}

interface Chapter {
  number: number;
  title: string;
  start_position: number;
  end_position: number;
}

interface TextChunk {
  id: string;
  text: string;
  start_position: number;
  end_position: number;
  chapter_number?: number;
  chapter_title?: string;
}

interface ParsedBook {
  metadata: BookMetadata;
  chapters: Chapter[];
  chunks: TextChunk[];
}

// === METADATA EXTRACTION ===

function extractMetadata(
  text: string,
  filePath: string,
  format: "txt" | "epub"
): BookMetadata {
  const lines = text.split("\n").slice(0, 100);

  let title = "";
  let author = "";
  let isbn = "";
  let publisher = "";
  let copyright_year: number | undefined;

  for (const line of lines) {
    const trimmed = line.trim();

    // Title patterns
    if (!title) {
      if (trimmed.toLowerCase().startsWith("title:")) {
        title = trimmed.slice(6).trim();
      } else if (trimmed.match(/^#\s+(.+)/)) {
        title = trimmed.replace(/^#\s+/, "");
      }
    }

    // Author patterns
    if (!author) {
      if (trimmed.toLowerCase().startsWith("author:")) {
        author = trimmed.slice(7).trim();
      } else if (trimmed.toLowerCase().startsWith("by ")) {
        author = trimmed.slice(3).trim();
      } else if (trimmed.includes("Names:") && trimmed.includes("author")) {
        author = trimmed
          .replace("Names:", "")
          .replace("author.", "")
          .replace(",", "")
          .trim();
      }
    }

    // ISBN patterns
    if (!isbn) {
      const isbnMatch = trimmed.match(/ISBN[-:\s]*(\d[\d-]+)/i);
      if (isbnMatch) {
        isbn = isbnMatch[1].replace(/-/g, "");
      }
    }

    // Publisher patterns
    if (!publisher) {
      if (
        trimmed.includes("BOOKS") ||
        trimmed.includes("Press") ||
        trimmed.includes("Publishers") ||
        trimmed.includes("Publishing")
      ) {
        publisher = trimmed;
      }
    }

    // Copyright year
    if (!copyright_year) {
      const copyrightMatch = trimmed.match(
        /(?:Copyright|©)\s*(\d{4})/i
      );
      if (copyrightMatch) {
        copyright_year = parseInt(copyrightMatch[1]);
      }
    }
  }

  // Extract from filename if not found in text
  if (!title || !author) {
    const filename = filePath.split("/").pop()?.replace(/\.(txt|epub)$/i, "") || "";
    // Common patterns: "Title - Author" or "Author - Title"
    const parts = filename.split(" - ");
    if (parts.length >= 2) {
      if (!title) title = parts[0].trim();
      if (!author) author = parts[1].trim();
    } else if (!title) {
      title = filename;
    }
  }

  return {
    title: title || "Unknown Title",
    author: author || "Unknown Author",
    isbn: isbn || undefined,
    publisher: publisher || undefined,
    copyright_year,
    file_path: filePath,
    file_format: format,
    total_characters: text.length,
    total_chapters: 0, // Will be updated after chapter detection
    parse_date: new Date().toISOString(),
  };
}

// === CHAPTER DETECTION ===

function detectChapters(text: string): Chapter[] {
  const chapters: Chapter[] = [];

  // Common chapter patterns
  const patterns = [
    /^(CHAPTER|Chapter)\s+(\d+|ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE|[IVX]+)[:\.\s]*(.*)/gim,
    /^(\d+)\.\s+([A-Z][A-Za-z\s]+)$/gm, // "1. Chapter Title"
    /^(Part|PART)\s+(\d+|ONE|TWO|THREE|[IVX]+)[:\.\s]*(.*)/gim,
  ];

  for (const pattern of patterns) {
    let match;
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const fullMatch = match[0];
      const position = match.index;

      // Extract chapter number
      let chapterNum = chapters.length + 1;
      const numStr = match[2];
      if (numStr) {
        const parsed = parseInt(numStr);
        if (!isNaN(parsed)) {
          chapterNum = parsed;
        } else {
          // Roman numeral or word conversion
          const wordMap: Record<string, number> = {
            ONE: 1, TWO: 2, THREE: 3, FOUR: 4, FIVE: 5,
            SIX: 6, SEVEN: 7, EIGHT: 8, NINE: 9, TEN: 10,
            ELEVEN: 11, TWELVE: 12, I: 1, II: 2, III: 3,
            IV: 4, V: 5, VI: 6, VII: 7, VIII: 8, IX: 9, X: 10,
          };
          chapterNum = wordMap[numStr.toUpperCase()] || chapters.length + 1;
        }
      }

      const title = match[3]?.trim() || fullMatch.trim();

      chapters.push({
        number: chapterNum,
        title: title,
        start_position: position,
        end_position: text.length, // Will be updated
      });
    }
  }

  // Sort by position and update end positions
  chapters.sort((a, b) => a.start_position - b.start_position);

  for (let i = 0; i < chapters.length - 1; i++) {
    chapters[i].end_position = chapters[i + 1].start_position;
  }

  return chapters;
}

// === TEXT CHUNKING ===

function chunkText(
  text: string,
  chapters: Chapter[],
  chunkSize: number,
  overlap: number
): TextChunk[] {
  const chunks: TextChunk[] = [];
  let chunkId = 0;

  // Skip front matter - find first substantial content
  let startPosition = 0;
  const firstChapterMatch = text.search(/\b(CHAPTER|Chapter)\s+(\d+|ONE|I\b)/i);
  if (firstChapterMatch > 0 && firstChapterMatch < text.length / 4) {
    startPosition = firstChapterMatch;
  }

  let position = startPosition;

  while (position < text.length) {
    const start = position;
    let end = Math.min(start + chunkSize, text.length);

    // Try to break at sentence boundaries
    if (end < text.length) {
      // Look backward for sentence ending
      for (let i = end; i > end - overlap && i > start + 100; i--) {
        const char = text[i];
        const nextChar = text[i + 1];
        if (
          (char === "." || char === "!" || char === "?") &&
          nextChar &&
          (nextChar === " " || nextChar === "\n")
        ) {
          end = i + 1;
          break;
        }
      }
    }

    // Also try to avoid breaking in middle of paragraph
    const lastParagraphBreak = text.lastIndexOf("\n\n", end);
    if (lastParagraphBreak > start + chunkSize / 2) {
      end = lastParagraphBreak;
    }

    const chunkText = text.slice(start, end);

    // Find which chapter this chunk belongs to
    let chapterNum: number | undefined;
    let chapterTitle: string | undefined;

    for (const chapter of chapters) {
      if (start >= chapter.start_position && start < chapter.end_position) {
        chapterNum = chapter.number;
        chapterTitle = chapter.title;
        break;
      }
    }

    chunks.push({
      id: `chunk-${chunkId}`,
      text: chunkText,
      start_position: start,
      end_position: end,
      chapter_number: chapterNum,
      chapter_title: chapterTitle,
    });

    // Move forward, accounting for overlap
    const advance = end - start - overlap;
    position += Math.max(advance, chunkSize / 2); // Ensure we always advance
    chunkId++;

    // Safety check
    if (position === start) {
      position += chunkSize;
    }
  }

  return chunks;
}

// === EPUB HANDLING ===

async function extractEpubText(filePath: string): Promise<string> {
  // For now, we'll note that epub support requires additional libraries
  // In a full implementation, this would use a library like epub.js or similar
  console.error(
    "Note: Full epub parsing requires additional setup. " +
    "For now, please convert epub to txt using calibre or similar tool."
  );

  // Try to read as plain text (works for some simple epubs)
  try {
    const content = await Deno.readTextFile(filePath);
    // Strip HTML tags if present
    return content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  } catch {
    throw new Error(
      `Cannot read epub file directly. Please convert to txt format first.\n` +
      `Suggested: ebook-convert "${filePath}" "${filePath.replace('.epub', '.txt')}"`
    );
  }
}

// === EXPORTS FOR MODULE USE ===

export {
  extractMetadata,
  detectChapters,
  chunkText,
  extractEpubText,
};

export type {
  BookMetadata,
  Chapter,
  TextChunk,
  ParsedBook,
};

/**
 * Parse a book file and return structured data.
 * This is the main entry point for programmatic use.
 */
export async function parseBook(
  filePath: string,
  options: {
    chunkSize?: number;
    overlap?: number;
    format?: "txt" | "epub";
  } = {}
): Promise<ParsedBook> {
  const { chunkSize = 1000, overlap = 100 } = options;
  const format: "txt" | "epub" = options.format ||
    (filePath.toLowerCase().endsWith(".epub") ? "epub" : "txt");

  let text: string;
  if (format === "epub") {
    text = await extractEpubText(filePath);
  } else {
    text = await Deno.readTextFile(filePath);
  }

  const metadata = extractMetadata(text, filePath, format);
  const chapters = detectChapters(text);
  metadata.total_chapters = chapters.length;

  const chunks = chunkText(text, chapters, chunkSize, overlap);

  return {
    metadata,
    chapters,
    chunks,
  };
}

// === MAIN (CLI) ===

async function main(): Promise<void> {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`ea-parse.ts - Ebook Parsing and Chunking

Usage:
  deno run --allow-read scripts/ea-parse.ts <file> [options]

Arguments:
  file                 Path to ebook file (txt or epub)

Options:
  --chunk-size <n>     Characters per chunk (default: 1000)
  --overlap <n>        Overlap between chunks (default: 100)
  --format <fmt>       Force format: txt or epub (auto-detect if not specified)
  --output <file>      Write JSON to file instead of stdout
  --json               Output as JSON (default)
  --summary            Output summary only, not full chunks

Examples:
  deno run --allow-read scripts/ea-parse.ts book.txt
  deno run --allow-read scripts/ea-parse.ts book.txt --chunk-size 1500 --overlap 150
  deno run --allow-read scripts/ea-parse.ts book.epub --output parsed.json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const chunkSizeIdx = args.indexOf("--chunk-size");
  const chunkSize = chunkSizeIdx !== -1 ? parseInt(args[chunkSizeIdx + 1]) : 1000;

  const overlapIdx = args.indexOf("--overlap");
  const overlap = overlapIdx !== -1 ? parseInt(args[overlapIdx + 1]) : 100;

  const formatIdx = args.indexOf("--format");
  const forcedFormat = formatIdx !== -1 ? args[formatIdx + 1] as "txt" | "epub" : null;

  const outputIdx = args.indexOf("--output");
  const outputFile = outputIdx !== -1 ? args[outputIdx + 1] : null;

  const summaryOnly = args.includes("--summary");

  // Find file argument (first non-flag argument)
  const skipIndices = new Set<number>();
  if (chunkSizeIdx !== -1) {
    skipIndices.add(chunkSizeIdx);
    skipIndices.add(chunkSizeIdx + 1);
  }
  if (overlapIdx !== -1) {
    skipIndices.add(overlapIdx);
    skipIndices.add(overlapIdx + 1);
  }
  if (formatIdx !== -1) {
    skipIndices.add(formatIdx);
    skipIndices.add(formatIdx + 1);
  }
  if (outputIdx !== -1) {
    skipIndices.add(outputIdx);
    skipIndices.add(outputIdx + 1);
  }

  let filePath: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      filePath = args[i];
      break;
    }
  }

  if (!filePath) {
    console.error("Error: No input file specified");
    Deno.exit(1);
  }

  // Detect format
  const format: "txt" | "epub" = forcedFormat ||
    (filePath.toLowerCase().endsWith(".epub") ? "epub" : "txt");

  // Read file
  let text: string;
  try {
    if (format === "epub") {
      text = await extractEpubText(filePath);
    } else {
      text = await Deno.readTextFile(filePath);
    }
  } catch (e) {
    console.error(`Error reading file: ${e}`);
    Deno.exit(1);
  }

  // Process
  const metadata = extractMetadata(text, filePath, format);
  const chapters = detectChapters(text);
  metadata.total_chapters = chapters.length;

  const chunks = chunkText(text, chapters, chunkSize, overlap);

  const result: ParsedBook = {
    metadata,
    chapters,
    chunks,
  };

  // Output
  let output: string;
  if (summaryOnly) {
    output = JSON.stringify({
      metadata,
      chapters,
      chunk_count: chunks.length,
      chunk_size: chunkSize,
      overlap: overlap,
    }, null, 2);
  } else {
    output = JSON.stringify(result, null, 2);
  }

  if (outputFile) {
    await Deno.writeTextFile(outputFile, output);
    console.log(`Parsed output written to: ${outputFile}`);
    console.log(`  - ${chunks.length} chunks created`);
    console.log(`  - ${chapters.length} chapters detected`);
    console.log(`  - ${metadata.total_characters} total characters`);
  } else {
    console.log(output);
  }
}

// Only run main() when executed directly, not when imported
if (import.meta.main) {
  main();
}
