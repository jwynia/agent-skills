#!/usr/bin/env -S deno run -A

/**
 * bc-map-tags.ts - Book Classification via Tag Mapping
 *
 * Reads books from Calibre metadata.db and classifies them using tag mapping rules.
 * Books that can be classified are written to classified-by-tags.json.
 * Books that need LLM classification are written to needs-llm.json.
 *
 * Usage:
 *   deno run -A bc-map-tags.ts <metadata.db> [--output-dir <dir>]
 */

import { openCalibreDb, closeCalibreDb, getBooks, type CalibreBook } from "./calibre-db.ts";

// === TYPES ===

type Category = "fiction" | "cookbooks" | "technical" | "business" | "self_help" | "other_nonfiction";

interface TagMappingRules {
  _meta: {
    description: string;
    version: string;
    last_updated: string;
    categories: Category[];
  };
  priority_order: Category[];
  excluded_tags: string[];
  category_rules: {
    [key in Category]: {
      exact_matches: string[];
      pattern_matches: string[];
    };
  };
  confidence_rules: {
    single_definitive_tag: number;
    multiple_same_category: number;
    primary_clear_secondary_different: number;
    ambiguous_resolved_by_priority: number;
    very_ambiguous: number;
  };
}

interface ClassifiedBook {
  book_id: number;
  title: string;
  author: string;
  category: Category;
  confidence: number;
  classification_source: "tag_mapping";
  source_tags: string[];
  matched_rules: string[];
  classified_at: string;
}

interface UnclassifiedBook {
  book_id: number;
  title: string;
  author: string;
  description?: string;
  source_tags: string[];
  reason: "no_tags" | "excluded_tags_only" | "no_matching_rules";
}

// === CLASSIFICATION LOGIC ===

function loadMappingRules(path: string): TagMappingRules {
  const text = Deno.readTextFileSync(path);
  return JSON.parse(text);
}

function matchTag(tag: string, category: string, rules: TagMappingRules): boolean {
  const categoryRules = rules.category_rules[category as Category];
  if (!categoryRules) return false;

  // Check exact matches (case-insensitive)
  if (categoryRules.exact_matches.some((m) => m.toLowerCase() === tag.toLowerCase())) {
    return true;
  }

  // Check pattern matches
  for (const pattern of categoryRules.pattern_matches) {
    const regex = new RegExp(pattern, "i");
    if (regex.test(tag)) {
      return true;
    }
  }

  return false;
}

function classifyBook(
  book: CalibreBook,
  rules: TagMappingRules
): { classified: ClassifiedBook } | { unclassified: UnclassifiedBook } {
  // Filter out excluded tags
  const validTags = book.tags.filter(
    (tag) => !rules.excluded_tags.some((ex) => ex.toLowerCase() === tag.toLowerCase())
  );

  // No tags at all
  if (book.tags.length === 0) {
    return {
      unclassified: {
        book_id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        source_tags: [],
        reason: "no_tags",
      },
    };
  }

  // Only excluded tags
  if (validTags.length === 0) {
    return {
      unclassified: {
        book_id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        source_tags: book.tags,
        reason: "excluded_tags_only",
      },
    };
  }

  // Find matching categories for each tag
  const categoryMatches: Map<Category, string[]> = new Map();
  const matchedRules: string[] = [];

  for (const tag of validTags) {
    for (const category of rules.priority_order) {
      if (matchTag(tag, category, rules)) {
        if (!categoryMatches.has(category)) {
          categoryMatches.set(category, []);
        }
        categoryMatches.get(category)!.push(tag);
        matchedRules.push(`${tag} -> ${category}`);
        break; // Tag matches first priority category only
      }
    }
  }

  // No matching rules
  if (categoryMatches.size === 0) {
    return {
      unclassified: {
        book_id: book.id,
        title: book.title,
        author: book.author,
        description: book.description,
        source_tags: book.tags,
        reason: "no_matching_rules",
      },
    };
  }

  // Select category based on priority order
  let selectedCategory: Category | null = null;
  for (const category of rules.priority_order) {
    if (categoryMatches.has(category)) {
      selectedCategory = category;
      break;
    }
  }

  if (!selectedCategory) {
    // Shouldn't happen, but fallback
    selectedCategory = "other_nonfiction";
  }

  // Calculate confidence
  let confidence: number;
  if (categoryMatches.size === 1) {
    const matchCount = categoryMatches.get(selectedCategory)!.length;
    if (matchCount === 1 && validTags.length === 1) {
      confidence = rules.confidence_rules.single_definitive_tag;
    } else {
      confidence = rules.confidence_rules.multiple_same_category;
    }
  } else if (categoryMatches.size === 2) {
    confidence = rules.confidence_rules.primary_clear_secondary_different;
  } else {
    confidence = rules.confidence_rules.ambiguous_resolved_by_priority;
  }

  return {
    classified: {
      book_id: book.id,
      title: book.title,
      author: book.author,
      category: selectedCategory,
      confidence,
      classification_source: "tag_mapping",
      source_tags: book.tags,
      matched_rules: matchedRules,
      classified_at: new Date().toISOString(),
    },
  };
}

// === MAIN ===

if (import.meta.main) {
  const dbPath = Deno.args[0];
  let outputDir = ".";

  // Parse args
  for (let i = 1; i < Deno.args.length; i++) {
    if (Deno.args[i] === "--output-dir" && Deno.args[i + 1]) {
      outputDir = Deno.args[++i];
    }
  }

  if (!dbPath) {
    console.error("Usage: deno run -A bc-map-tags.ts <metadata.db> [--output-dir <dir>]");
    Deno.exit(1);
  }

  // Load rules
  const scriptDir = new URL(".", import.meta.url).pathname;
  const rulesPath = `${scriptDir}../data/tag-mapping-rules.json`;
  console.log(`Loading rules from: ${rulesPath}`);
  const rules = loadMappingRules(rulesPath);

  // Open database
  console.log(`Opening database: ${dbPath}`);
  const db = openCalibreDb(dbPath);

  try {
    // Get all books
    console.log("Fetching all books...");
    const books = getBooks(db);
    console.log(`Found ${books.length} books`);

    // Classify books
    const classified: ClassifiedBook[] = [];
    const needsLlm: UnclassifiedBook[] = [];
    const categoryStats: Map<Category, number> = new Map();
    const unclassifiedReasons: Map<string, number> = new Map();

    for (const book of books) {
      const result = classifyBook(book, rules);

      if ("classified" in result) {
        classified.push(result.classified);
        categoryStats.set(
          result.classified.category,
          (categoryStats.get(result.classified.category) || 0) + 1
        );
      } else {
        needsLlm.push(result.unclassified);
        unclassifiedReasons.set(
          result.unclassified.reason,
          (unclassifiedReasons.get(result.unclassified.reason) || 0) + 1
        );
      }
    }

    // Write outputs
    const classifiedPath = `${outputDir}/classified-by-tags.json`;
    const needsLlmPath = `${outputDir}/needs-llm.json`;

    Deno.writeTextFileSync(classifiedPath, JSON.stringify(classified, null, 2));
    console.log(`Wrote ${classified.length} classified books to ${classifiedPath}`);

    Deno.writeTextFileSync(needsLlmPath, JSON.stringify(needsLlm, null, 2));
    console.log(`Wrote ${needsLlm.length} books needing LLM classification to ${needsLlmPath}`);

    // Print summary
    console.log("\n=== Classification Summary ===");
    console.log(`Total books: ${books.length}`);
    console.log(`Classified by tags: ${classified.length}`);
    console.log(`Needs LLM classification: ${needsLlm.length}`);

    console.log("\nCategory distribution:");
    for (const category of rules.priority_order) {
      const count = categoryStats.get(category) || 0;
      console.log(`  ${category}: ${count}`);
    }

    console.log("\nUnclassified reasons:");
    for (const [reason, count] of unclassifiedReasons) {
      console.log(`  ${reason}: ${count}`);
    }
  } finally {
    closeCalibreDb(db);
  }
}
