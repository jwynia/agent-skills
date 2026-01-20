#!/usr/bin/env -S deno run -A

/**
 * bc-list-books.ts - Book Listing and Filtering CLI
 *
 * List and filter books from a Calibre metadata.db database.
 *
 * Usage:
 *   deno run -A bc-list-books.ts <metadata.db> [options]
 *
 * Options:
 *   --tag <name>       Filter by tag name
 *   --search <query>   Search by title
 *   --author <name>    Filter by author name
 *   --has-tags         Only books with tags
 *   --no-tags          Only books without tags
 *   --limit <n>        Limit results
 *   --format <type>    Output format: table (default), json, csv
 *   --stats            Show statistics only
 *   --tags-list        Show all tags with counts
 */

import {
  openCalibreDb,
  closeCalibreDb,
  getBooks,
  getAllTags,
  getStats,
  type CalibreBook,
  type GetBooksOptions,
} from "./calibre-db.ts";

function parseArgs(args: string[]): {
  dbPath: string;
  options: GetBooksOptions;
  format: "table" | "json" | "csv";
  showStats: boolean;
  showTagsList: boolean;
} {
  const dbPath = args[0];
  if (!dbPath) {
    console.error("Error: Database path required");
    console.error("Usage: deno run -A bc-list-books.ts <metadata.db> [options]");
    console.error("");
    console.error("Options:");
    console.error("  --tag <name>       Filter by tag name");
    console.error("  --search <query>   Search by title");
    console.error("  --author <name>    Filter by author name");
    console.error("  --has-tags         Only books with tags");
    console.error("  --no-tags          Only books without tags");
    console.error("  --limit <n>        Limit results");
    console.error("  --format <type>    Output format: table (default), json, csv");
    console.error("  --stats            Show statistics only");
    console.error("  --tags-list        Show all tags with counts");
    Deno.exit(1);
  }

  const options: GetBooksOptions = {};
  let format: "table" | "json" | "csv" = "table";
  let showStats = false;
  let showTagsList = false;

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--tag":
        options.tagFilter = args[++i];
        break;
      case "--search":
        options.titleSearch = args[++i];
        break;
      case "--author":
        options.authorFilter = args[++i];
        break;
      case "--has-tags":
        options.hasTagsOnly = true;
        break;
      case "--no-tags":
        options.noTagsOnly = true;
        break;
      case "--limit":
        options.limit = parseInt(args[++i], 10);
        break;
      case "--format":
        format = args[++i] as "table" | "json" | "csv";
        break;
      case "--stats":
        showStats = true;
        break;
      case "--tags-list":
        showTagsList = true;
        break;
    }
  }

  return { dbPath, options, format, showStats, showTagsList };
}

function formatTable(books: CalibreBook[]): void {
  console.log("ID\tTitle\tAuthor\tTags");
  console.log("---\t-----\t------\t----");
  for (const book of books) {
    const title = book.title.length > 50 ? book.title.slice(0, 47) + "..." : book.title;
    const author = book.author.length > 25 ? book.author.slice(0, 22) + "..." : book.author;
    const tags = book.tags.slice(0, 3).join(", ") + (book.tags.length > 3 ? "..." : "");
    console.log(`${book.id}\t${title}\t${author}\t${tags}`);
  }
  console.log(`\n${books.length} books`);
}

function formatJson(books: CalibreBook[]): void {
  console.log(JSON.stringify(books, null, 2));
}

function formatCsv(books: CalibreBook[]): void {
  console.log("id,title,author,tags,description,publisher,isbn,series");
  for (const book of books) {
    const escapeCsv = (s: string | undefined) => {
      if (!s) return "";
      if (s.includes(",") || s.includes('"') || s.includes("\n")) {
        return `"${s.replace(/"/g, '""')}"`;
      }
      return s;
    };
    console.log(
      [
        book.id,
        escapeCsv(book.title),
        escapeCsv(book.author),
        escapeCsv(book.tags.join("; ")),
        escapeCsv(book.description?.slice(0, 200)),
        escapeCsv(book.publisher),
        escapeCsv(book.isbn),
        escapeCsv(book.series),
      ].join(",")
    );
  }
}

if (import.meta.main) {
  const { dbPath, options, format, showStats, showTagsList } = parseArgs(Deno.args);

  const db = openCalibreDb(dbPath);

  try {
    if (showStats) {
      const stats = getStats(db);
      console.log("Database Statistics:");
      console.log(`  Total books: ${stats.totalBooks}`);
      console.log(`  Books with tags: ${stats.booksWithTags}`);
      console.log(`  Books without tags: ${stats.booksWithoutTags}`);
      console.log(`  Total unique tags: ${stats.totalTags}`);
      console.log(`  Total authors: ${stats.totalAuthors}`);
    } else if (showTagsList) {
      const tags = getAllTags(db);
      if (format === "json") {
        console.log(JSON.stringify(tags, null, 2));
      } else if (format === "csv") {
        console.log("id,name,count");
        for (const tag of tags) {
          console.log(`${tag.id},${tag.name},${tag.count}`);
        }
      } else {
        console.log("ID\tTag\tCount");
        console.log("---\t---\t-----");
        for (const tag of tags) {
          console.log(`${tag.id}\t${tag.name}\t${tag.count}`);
        }
        console.log(`\n${tags.length} tags`);
      }
    } else {
      const books = getBooks(db, options);
      switch (format) {
        case "json":
          formatJson(books);
          break;
        case "csv":
          formatCsv(books);
          break;
        default:
          formatTable(books);
      }
    }
  } finally {
    closeCalibreDb(db);
  }
}
