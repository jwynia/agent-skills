/**
 * calibre-db.ts - Calibre Database Utility Module
 *
 * Provides functions for reading Calibre's metadata.db SQLite database.
 * This module handles all database access for book metadata, tags, authors, etc.
 *
 * Usage:
 *   import { openCalibreDb, getBooks, getAllTags } from "./calibre-db.ts";
 *   const db = openCalibreDb("/path/to/metadata.db");
 *   const books = getBooks(db);
 */

import { Database } from "jsr:@db/sqlite@0.12";

// === INTERFACES ===

export interface CalibreBook {
  id: number;
  title: string;
  author: string;
  path: string;
  tags: string[];
  description?: string;
  publisher?: string;
  pubdate?: string;
  isbn?: string;
  series?: string;
  series_index?: number;
  rating?: number;
  timestamp?: string;
  last_modified?: string;
}

export interface CalibreTag {
  id: number;
  name: string;
  count: number;
}

export interface GetBooksOptions {
  limit?: number;
  offset?: number;
  tagFilter?: string;
  authorFilter?: string;
  titleSearch?: string;
  hasTagsOnly?: boolean;
  noTagsOnly?: boolean;
}

// === DATABASE CONNECTION ===

export function openCalibreDb(path: string): Database {
  return new Database(path, { readonly: true });
}

export function closeCalibreDb(db: Database): void {
  db.close();
}

// === HELPER FUNCTIONS ===

function queryAll<T>(db: Database, sql: string, params: unknown[] = []): T[] {
  const stmt = db.prepare(sql);
  return stmt.all(...params) as T[];
}

function queryOne<T>(db: Database, sql: string, params: unknown[] = []): T | undefined {
  const stmt = db.prepare(sql);
  return stmt.get(...params) as T | undefined;
}

// === BOOK QUERIES ===

interface BookRow {
  id: number;
  title: string;
  path: string;
  pubdate: string | null;
  timestamp: string | null;
  last_modified: string | null;
  series_index: number | null;
  authors: string | null;
}

export function getBooks(db: Database, options: GetBooksOptions = {}): CalibreBook[] {
  const books: CalibreBook[] = [];

  // Base query to get books with author
  let query = `
    SELECT
      b.id,
      b.title,
      b.path,
      b.pubdate,
      b.timestamp,
      b.last_modified,
      b.series_index,
      GROUP_CONCAT(DISTINCT a.name) as authors
    FROM books b
    LEFT JOIN books_authors_link bal ON b.id = bal.book
    LEFT JOIN authors a ON bal.author = a.id
  `;

  const conditions: string[] = [];
  const params: unknown[] = [];

  // Tag filter
  if (options.tagFilter) {
    query = `
      SELECT
        b.id,
        b.title,
        b.path,
        b.pubdate,
        b.timestamp,
        b.last_modified,
        b.series_index,
        GROUP_CONCAT(DISTINCT a.name) as authors
      FROM books b
      LEFT JOIN books_authors_link bal ON b.id = bal.book
      LEFT JOIN authors a ON bal.author = a.id
      JOIN books_tags_link btl ON b.id = btl.book
      JOIN tags t ON btl.tag = t.id
    `;
    conditions.push("t.name = ?");
    params.push(options.tagFilter);
  }

  // Has tags only
  if (options.hasTagsOnly) {
    conditions.push("b.id IN (SELECT DISTINCT book FROM books_tags_link)");
  }

  // No tags only
  if (options.noTagsOnly) {
    conditions.push("b.id NOT IN (SELECT DISTINCT book FROM books_tags_link)");
  }

  // Title search
  if (options.titleSearch) {
    conditions.push("b.title LIKE ?");
    params.push(`%${options.titleSearch}%`);
  }

  // Author filter
  if (options.authorFilter) {
    conditions.push("a.name LIKE ?");
    params.push(`%${options.authorFilter}%`);
  }

  if (conditions.length > 0) {
    query += " WHERE " + conditions.join(" AND ");
  }

  query += " GROUP BY b.id ORDER BY b.title";

  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
    if (options.offset) {
      query += ` OFFSET ${options.offset}`;
    }
  }

  const rows = queryAll<BookRow>(db, query, params);

  for (const row of rows) {
    const book: CalibreBook = {
      id: row.id,
      title: row.title,
      author: row.authors || "Unknown",
      path: row.path,
      tags: [],
      pubdate: row.pubdate || undefined,
      timestamp: row.timestamp || undefined,
      last_modified: row.last_modified || undefined,
      series_index: row.series_index || undefined,
    };

    // Get tags for this book
    book.tags = getBookTags(db, row.id);

    // Get additional metadata
    const extras = getBookExtras(db, row.id);
    book.description = extras.description;
    book.publisher = extras.publisher;
    book.isbn = extras.isbn;
    book.series = extras.series;
    book.rating = extras.rating;

    books.push(book);
  }

  return books;
}

export function getBookById(db: Database, bookId: number): CalibreBook | null {
  const row = queryOne<BookRow>(
    db,
    `
    SELECT
      b.id,
      b.title,
      b.path,
      b.pubdate,
      b.timestamp,
      b.last_modified,
      b.series_index,
      GROUP_CONCAT(DISTINCT a.name) as authors
    FROM books b
    LEFT JOIN books_authors_link bal ON b.id = bal.book
    LEFT JOIN authors a ON bal.author = a.id
    WHERE b.id = ?
    GROUP BY b.id
  `,
    [bookId]
  );

  if (!row) return null;

  const book: CalibreBook = {
    id: row.id,
    title: row.title,
    author: row.authors || "Unknown",
    path: row.path,
    tags: getBookTags(db, row.id),
    pubdate: row.pubdate || undefined,
    timestamp: row.timestamp || undefined,
    last_modified: row.last_modified || undefined,
    series_index: row.series_index || undefined,
  };

  const extras = getBookExtras(db, row.id);
  book.description = extras.description;
  book.publisher = extras.publisher;
  book.isbn = extras.isbn;
  book.series = extras.series;
  book.rating = extras.rating;

  return book;
}

function getBookExtras(
  db: Database,
  bookId: number
): {
  description?: string;
  publisher?: string;
  isbn?: string;
  series?: string;
  rating?: number;
} {
  const result: {
    description?: string;
    publisher?: string;
    isbn?: string;
    series?: string;
    rating?: number;
  } = {};

  // Description from comments table
  const comment = queryOne<{ text: string }>(
    db,
    "SELECT text FROM comments WHERE book = ?",
    [bookId]
  );
  if (comment) {
    result.description = comment.text;
  }

  // Publisher
  const publisher = queryOne<{ name: string }>(
    db,
    `
    SELECT p.name FROM publishers p
    JOIN books_publishers_link bpl ON p.id = bpl.publisher
    WHERE bpl.book = ?
  `,
    [bookId]
  );
  if (publisher) {
    result.publisher = publisher.name;
  }

  // ISBN from identifiers
  const identifier = queryOne<{ val: string }>(
    db,
    "SELECT val FROM identifiers WHERE book = ? AND type = 'isbn'",
    [bookId]
  );
  if (identifier) {
    result.isbn = identifier.val;
  }

  // Series
  const series = queryOne<{ name: string }>(
    db,
    `
    SELECT s.name FROM series s
    JOIN books_series_link bsl ON s.id = bsl.series
    WHERE bsl.book = ?
  `,
    [bookId]
  );
  if (series) {
    result.series = series.name;
  }

  // Rating
  const rating = queryOne<{ rating: number }>(
    db,
    `
    SELECT r.rating FROM ratings r
    JOIN books_ratings_link brl ON r.id = brl.rating
    WHERE brl.book = ?
  `,
    [bookId]
  );
  if (rating) {
    result.rating = rating.rating;
  }

  return result;
}

// === TAG QUERIES ===

export function getBookTags(db: Database, bookId: number): string[] {
  const rows = queryAll<{ name: string }>(
    db,
    `
    SELECT t.name FROM tags t
    JOIN books_tags_link btl ON t.id = btl.tag
    WHERE btl.book = ?
    ORDER BY t.name
  `,
    [bookId]
  );

  return rows.map((row) => row.name);
}

export function getAllTags(db: Database): CalibreTag[] {
  const rows = queryAll<{ id: number; name: string; count: number }>(
    db,
    `
    SELECT t.id, t.name, COUNT(btl.book) as count
    FROM tags t
    LEFT JOIN books_tags_link btl ON t.id = btl.tag
    GROUP BY t.id
    ORDER BY count DESC, t.name
  `
  );

  return rows;
}

// === SEARCH ===

export function searchBooks(db: Database, query: string): CalibreBook[] {
  return getBooks(db, { titleSearch: query });
}

// === STATISTICS ===

export function getStats(db: Database): {
  totalBooks: number;
  booksWithTags: number;
  booksWithoutTags: number;
  totalTags: number;
  totalAuthors: number;
} {
  const totalBooks =
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM books")?.count || 0;
  const booksWithTags =
    queryOne<{ count: number }>(db, "SELECT COUNT(DISTINCT book) as count FROM books_tags_link")
      ?.count || 0;
  const totalTags =
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM tags")?.count || 0;
  const totalAuthors =
    queryOne<{ count: number }>(db, "SELECT COUNT(*) as count FROM authors")?.count || 0;

  return {
    totalBooks,
    booksWithTags,
    booksWithoutTags: totalBooks - booksWithTags,
    totalTags,
    totalAuthors,
  };
}

// === CLI ENTRY POINT (for testing) ===

if (import.meta.main) {
  const dbPath = Deno.args[0];
  if (!dbPath) {
    console.error("Usage: deno run --allow-read --allow-ffi calibre-db.ts <metadata.db>");
    Deno.exit(1);
  }

  const db = openCalibreDb(dbPath);
  const stats = getStats(db);
  console.log("Database Statistics:");
  console.log(`  Total books: ${stats.totalBooks}`);
  console.log(`  Books with tags: ${stats.booksWithTags}`);
  console.log(`  Books without tags: ${stats.booksWithoutTags}`);
  console.log(`  Total unique tags: ${stats.totalTags}`);
  console.log(`  Total authors: ${stats.totalAuthors}`);
  closeCalibreDb(db);
}
