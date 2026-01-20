#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * bulk-preprocess.ts - Bulk Ebook Preprocessing
 *
 * Runs deterministic (non-LLM) processing on the ebook collection,
 * generating parsed JSON files ready for agent analysis.
 *
 * Usage:
 *   deno run -A bulk-preprocess.ts                         # Process all books
 *   deno run -A bulk-preprocess.ts --category other_nonfiction
 *   deno run -A bulk-preprocess.ts --book-id 74           # Single book
 *   deno run -A bulk-preprocess.ts --resume               # Skip already processed
 *   deno run -A bulk-preprocess.ts --dry-run              # Show what would be processed
 */

import {
  openCalibreDb,
  closeCalibreDb,
  getBookById,
  type CalibreBook,
} from "./calibre-db.ts";
import { parseBook, type ParsedBook } from "./ea-parse.ts";

// === CONFIGURATION ===
// Set these paths via environment variables or modify defaults for your setup.

const EBOOKS_ROOT = Deno.env.get("EBOOKS_ROOT") || ".";
const BOOKS_DIR = Deno.env.get("BOOKS_DIR") || `${EBOOKS_ROOT}/books`;
const PREPROCESSED_DIR = Deno.env.get("PREPROCESSED_DIR") || `${EBOOKS_ROOT}/preprocessed`;
const CLASSIFICATION_INDEX = Deno.env.get("CLASSIFICATION_INDEX") || `${EBOOKS_ROOT}/book-classification-index.json`;
const CALIBRE_DB = Deno.env.get("CALIBRE_DB") || `${BOOKS_DIR}/metadata.db`;

const DEFAULT_CHUNK_SIZE = 1500;
const DEFAULT_OVERLAP = 150;
const DEFAULT_PARALLEL = 4;

// === INTERFACES ===

interface ClassificationEntry {
  book_id: number;
  title: string;
  author: string;
  category: string;
  confidence: number;
  classification_source: string;
  llm_reasoning?: string;
  source_tags?: string[];
  matched_rules?: string[];
  classified_at: string;
}

interface ClassificationIndex {
  version: string;
  generated: string;
  collection_path: string;
  categories: Record<string, { name: string; description: string }>;
  statistics: {
    total_books: number;
    classified_from_tags: number;
    classified_by_llm: number;
    category_counts: Record<string, number>;
  };
  books: ClassificationEntry[];
}

interface BookMetadataOutput {
  book_id: number;
  title: string;
  author: string;
  category: string;
  confidence: number;
  tags: string[];
  description?: string;
  isbn?: string;
  publisher?: string;
  series?: string;
  series_index?: number;
  formats: string[];
  paths: Record<string, string>;
}

interface BookStatsOutput {
  book_id: number;
  word_count: number;
  character_count: number;
  chapter_count: number;
  chunk_count: number;
  avg_chunk_size: number;
  preprocessed_at: string;
}

interface ManifestEntry {
  status: "processed" | "failed" | "skipped";
  title?: string;
  author?: string;
  category?: string;
  processed_at?: string;
  error?: string;
}

interface Manifest {
  version: string;
  generated_at: string;
  last_updated: string;
  total_books: number;
  processed: number;
  failed: number;
  skipped: number;
  books: Record<string, ManifestEntry>;
}

interface ProcessingOptions {
  category?: string;
  bookId?: number;
  resume: boolean;
  dryRun: boolean;
  chunkSize: number;
  overlap: number;
  parallel: number;
  preferFormat: "txt" | "epub";
}

// === HELPERS ===

async function ensureDir(path: string): Promise<void> {
  try {
    await Deno.mkdir(path, { recursive: true });
  } catch (e) {
    if (!(e instanceof Deno.errors.AlreadyExists)) {
      throw e;
    }
  }
}

async function fileExists(path: string): Promise<boolean> {
  try {
    await Deno.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function findBookFiles(
  bookPath: string
): Promise<Record<string, string>> {
  const result: Record<string, string> = {};
  const fullPath = `${BOOKS_DIR}/${bookPath}`;

  try {
    for await (const entry of Deno.readDir(fullPath)) {
      if (entry.isFile) {
        const ext = entry.name.split(".").pop()?.toLowerCase();
        if (ext && ["txt", "epub", "azw3", "mobi", "pdf"].includes(ext)) {
          result[ext] = `${fullPath}/${entry.name}`;
        }
      }
    }
  } catch {
    // Directory doesn't exist or can't be read
  }

  return result;
}

function countWords(text: string): number {
  return text.split(/\s+/).filter((w) => w.length > 0).length;
}

// === MANIFEST MANAGEMENT ===

async function loadManifest(): Promise<Manifest> {
  const manifestPath = `${PREPROCESSED_DIR}/_manifest.json`;

  if (await fileExists(manifestPath)) {
    const content = await Deno.readTextFile(manifestPath);
    return JSON.parse(content);
  }

  return {
    version: "1.0.0",
    generated_at: new Date().toISOString(),
    last_updated: new Date().toISOString(),
    total_books: 0,
    processed: 0,
    failed: 0,
    skipped: 0,
    books: {},
  };
}

async function saveManifest(manifest: Manifest): Promise<void> {
  manifest.last_updated = new Date().toISOString();

  // Recalculate counts
  manifest.processed = Object.values(manifest.books).filter(
    (b) => b.status === "processed"
  ).length;
  manifest.failed = Object.values(manifest.books).filter(
    (b) => b.status === "failed"
  ).length;
  manifest.skipped = Object.values(manifest.books).filter(
    (b) => b.status === "skipped"
  ).length;

  await ensureDir(PREPROCESSED_DIR);
  await Deno.writeTextFile(
    `${PREPROCESSED_DIR}/_manifest.json`,
    JSON.stringify(manifest, null, 2)
  );
}

// === PROCESSING ===

async function processBook(
  classification: ClassificationEntry,
  calibreBook: CalibreBook,
  options: ProcessingOptions
): Promise<{ success: boolean; error?: string }> {
  const bookDir = `${PREPROCESSED_DIR}/${classification.book_id}`;

  // Find text file
  const files = await findBookFiles(calibreBook.path);
  const textFile =
    files[options.preferFormat] || files.txt || files.epub;

  if (!textFile) {
    return {
      success: false,
      error: `No ${options.preferFormat}/txt/epub file found`,
    };
  }

  // Parse the book
  let parsed: ParsedBook;
  try {
    parsed = await parseBook(textFile, {
      chunkSize: options.chunkSize,
      overlap: options.overlap,
    });
  } catch (e) {
    return {
      success: false,
      error: `Parse error: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // Ensure output directory
  await ensureDir(bookDir);

  // Build metadata output (merging Calibre + classification data)
  const metadata: BookMetadataOutput = {
    book_id: classification.book_id,
    title: calibreBook.title,
    author: calibreBook.author,
    category: classification.category,
    confidence: classification.confidence,
    tags: calibreBook.tags,
    description: calibreBook.description,
    isbn: calibreBook.isbn,
    publisher: calibreBook.publisher,
    series: calibreBook.series,
    series_index: calibreBook.series_index,
    formats: Object.keys(files),
    paths: files,
  };

  // Calculate stats
  const fullText = parsed.chunks.map((c) => c.text).join("");
  const stats: BookStatsOutput = {
    book_id: classification.book_id,
    word_count: countWords(fullText),
    character_count: parsed.metadata.total_characters,
    chapter_count: parsed.chapters.length,
    chunk_count: parsed.chunks.length,
    avg_chunk_size: Math.round(
      parsed.metadata.total_characters / Math.max(parsed.chunks.length, 1)
    ),
    preprocessed_at: new Date().toISOString(),
  };

  // Build parsed output with book_id added
  const parsedOutput = {
    book_id: classification.book_id,
    source_file: textFile,
    metadata: parsed.metadata,
    chapters: parsed.chapters,
    chunks: parsed.chunks,
    total_characters: parsed.metadata.total_characters,
  };

  // Write output files
  await Deno.writeTextFile(
    `${bookDir}/parsed.json`,
    JSON.stringify(parsedOutput, null, 2)
  );
  await Deno.writeTextFile(
    `${bookDir}/metadata.json`,
    JSON.stringify(metadata, null, 2)
  );
  await Deno.writeTextFile(
    `${bookDir}/stats.json`,
    JSON.stringify(stats, null, 2)
  );

  return { success: true };
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`bulk-preprocess.ts - Bulk Ebook Preprocessing

Usage:
  deno run -A bulk-preprocess.ts [options]

Options:
  --category <cat>     Filter by category (fiction, other_nonfiction, etc.)
  --book-id <id>       Process single book by Calibre ID
  --resume             Skip books already in preprocessed/
  --dry-run            Show what would be processed, don't execute
  --chunk-size <n>     Characters per chunk (default: ${DEFAULT_CHUNK_SIZE})
  --overlap <n>        Overlap between chunks (default: ${DEFAULT_OVERLAP})
  --parallel <n>       Concurrent books to process (default: ${DEFAULT_PARALLEL})
  --format <fmt>       Prefer txt or epub (default: txt)

Examples:
  deno run -A bulk-preprocess.ts --category other_nonfiction --dry-run
  deno run -A bulk-preprocess.ts --book-id 74
  deno run -A bulk-preprocess.ts --resume --parallel 8
`);
    Deno.exit(0);
  }

  // Parse options
  const options: ProcessingOptions = {
    category: undefined,
    bookId: undefined,
    resume: args.includes("--resume"),
    dryRun: args.includes("--dry-run"),
    chunkSize: DEFAULT_CHUNK_SIZE,
    overlap: DEFAULT_OVERLAP,
    parallel: DEFAULT_PARALLEL,
    preferFormat: "txt",
  };

  const categoryIdx = args.indexOf("--category");
  if (categoryIdx !== -1) {
    options.category = args[categoryIdx + 1];
  }

  const bookIdIdx = args.indexOf("--book-id");
  if (bookIdIdx !== -1) {
    options.bookId = parseInt(args[bookIdIdx + 1]);
  }

  const chunkSizeIdx = args.indexOf("--chunk-size");
  if (chunkSizeIdx !== -1) {
    options.chunkSize = parseInt(args[chunkSizeIdx + 1]);
  }

  const overlapIdx = args.indexOf("--overlap");
  if (overlapIdx !== -1) {
    options.overlap = parseInt(args[overlapIdx + 1]);
  }

  const parallelIdx = args.indexOf("--parallel");
  if (parallelIdx !== -1) {
    options.parallel = parseInt(args[parallelIdx + 1]);
  }

  const formatIdx = args.indexOf("--format");
  if (formatIdx !== -1) {
    options.preferFormat = args[formatIdx + 1] as "txt" | "epub";
  }

  // Load classification index
  console.log("Loading classification index...");
  const indexContent = await Deno.readTextFile(CLASSIFICATION_INDEX);
  const classificationIndex: ClassificationIndex = JSON.parse(indexContent);

  // Filter books
  let books = classificationIndex.books;

  if (options.bookId !== undefined) {
    books = books.filter((b) => b.book_id === options.bookId);
  }

  if (options.category) {
    books = books.filter((b) => b.category === options.category);
  }

  console.log(`Found ${books.length} books to process`);

  if (books.length === 0) {
    console.log("No books match the criteria");
    Deno.exit(0);
  }

  // Load manifest
  const manifest = await loadManifest();
  manifest.total_books = classificationIndex.statistics.total_books;

  // Filter out already processed if --resume
  if (options.resume) {
    const before = books.length;
    books = books.filter((b) => {
      const existing = manifest.books[String(b.book_id)];
      return !existing || existing.status !== "processed";
    });
    console.log(`Resuming: ${before - books.length} already processed, ${books.length} remaining`);
  }

  // Dry run - just show what would be processed
  if (options.dryRun) {
    console.log("\n=== DRY RUN ===");
    console.log(`Would process ${books.length} books:`);
    for (const book of books.slice(0, 20)) {
      console.log(`  [${book.book_id}] ${book.title} by ${book.author} (${book.category})`);
    }
    if (books.length > 20) {
      console.log(`  ... and ${books.length - 20} more`);
    }
    console.log("\nCategory breakdown:");
    const byCategory: Record<string, number> = {};
    for (const book of books) {
      byCategory[book.category] = (byCategory[book.category] || 0) + 1;
    }
    for (const [cat, count] of Object.entries(byCategory)) {
      console.log(`  ${cat}: ${count}`);
    }
    Deno.exit(0);
  }

  // Open Calibre DB
  console.log("Opening Calibre database...");
  const db = openCalibreDb(CALIBRE_DB);

  // Process books
  await ensureDir(PREPROCESSED_DIR);

  let processed = 0;
  let failed = 0;
  let skipped = 0;
  const startTime = Date.now();

  // Process in batches for controlled concurrency
  for (let i = 0; i < books.length; i += options.parallel) {
    const batch = books.slice(i, i + options.parallel);
    const results = await Promise.all(
      batch.map(async (classification) => {
        const bookId = classification.book_id;
        const calibreBook = getBookById(db, bookId);

        if (!calibreBook) {
          return {
            bookId,
            classification,
            success: false,
            error: "Book not found in Calibre DB",
          };
        }

        const result = await processBook(classification, calibreBook, options);
        return { bookId, classification, calibreBook, ...result };
      })
    );

    // Update manifest and print progress
    for (const result of results) {
      const entry: ManifestEntry = {
        status: result.success ? "processed" : "failed",
        title: result.classification.title,
        author: result.classification.author,
        category: result.classification.category,
      };

      if (result.success) {
        entry.processed_at = new Date().toISOString();
        processed++;
      } else {
        entry.error = result.error;
        failed++;
      }

      manifest.books[String(result.bookId)] = entry;
    }

    // Progress update
    const elapsed = (Date.now() - startTime) / 1000;
    const rate = (processed + failed) / elapsed;
    const remaining = books.length - (processed + failed + skipped);
    const eta = remaining / rate;

    console.log(
      `Progress: ${processed + failed}/${books.length} ` +
      `(${processed} ok, ${failed} failed) ` +
      `[${rate.toFixed(1)}/s, ETA: ${Math.round(eta)}s]`
    );

    // Save manifest periodically
    if ((i + options.parallel) % 50 === 0 || i + options.parallel >= books.length) {
      await saveManifest(manifest);
    }
  }

  // Final manifest save
  await saveManifest(manifest);

  // Close database
  closeCalibreDb(db);

  // Summary
  const elapsed = (Date.now() - startTime) / 1000;
  console.log("\n=== COMPLETE ===");
  console.log(`Processed: ${processed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Time: ${elapsed.toFixed(1)}s`);
  console.log(`Rate: ${((processed + failed) / elapsed).toFixed(1)} books/s`);
  console.log(`\nOutput: ${PREPROCESSED_DIR}/`);
  console.log(`Manifest: ${PREPROCESSED_DIR}/_manifest.json`);
}

main();
