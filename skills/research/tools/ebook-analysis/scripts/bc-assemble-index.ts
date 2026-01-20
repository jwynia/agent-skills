#!/usr/bin/env -S deno run -A

/**
 * bc-assemble-index.ts - Assemble final book classification index
 *
 * Merges tag-classified and LLM-classified books into a single index.
 *
 * Usage:
 *   deno run -A bc-assemble-index.ts <classified-by-tags.json> <llm-classified.json> [--output <file>]
 */

type Category = "fiction" | "cookbooks" | "technical" | "business" | "self_help" | "other_nonfiction";

interface TagClassifiedBook {
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

interface LlmClassifiedBook {
  book_id: number;
  title: string;
  author: string;
  category: Category;
  confidence: number;
  classification_source: "llm";
  llm_reasoning: string;
  classified_at: string;
}

type ClassifiedBook = TagClassifiedBook | LlmClassifiedBook;

interface BookIndex {
  version: string;
  generated: string;
  collection_path: string;
  categories: {
    [key in Category]: {
      name: string;
      description: string;
    };
  };
  statistics: {
    total_books: number;
    classified_from_tags: number;
    classified_by_llm: number;
    category_counts: { [key in Category]: number };
  };
  books: ClassifiedBook[];
}

const categoryDescriptions: { [key in Category]: { name: string; description: string } } = {
  fiction: {
    name: "Fiction",
    description: "Novels, short stories, literary works",
  },
  cookbooks: {
    name: "Cookbooks",
    description: "Cooking, recipes, food & beverage",
  },
  technical: {
    name: "Technical/Computing",
    description: "Programming, software, computers, engineering",
  },
  business: {
    name: "Business",
    description: "Business, economics, management, finance",
  },
  self_help: {
    name: "Self-Help",
    description: "Personal development, psychology, wellness",
  },
  other_nonfiction: {
    name: "Other Non-Fiction",
    description: "History, science, reference, crafts, etc.",
  },
};

if (import.meta.main) {
  const tagClassifiedPath = Deno.args[0];
  const llmClassifiedPath = Deno.args[1];
  let outputPath = "book-classification-index.json";

  for (let i = 2; i < Deno.args.length; i++) {
    if (Deno.args[i] === "--output" && Deno.args[i + 1]) {
      outputPath = Deno.args[++i];
    }
  }

  if (!tagClassifiedPath || !llmClassifiedPath) {
    console.error("Usage: deno run -A bc-assemble-index.ts <classified-by-tags.json> <llm-classified.json> [--output <file>]");
    Deno.exit(1);
  }

  console.log(`Reading tag-classified: ${tagClassifiedPath}`);
  const tagClassified: TagClassifiedBook[] = JSON.parse(Deno.readTextFileSync(tagClassifiedPath));

  console.log(`Reading LLM-classified: ${llmClassifiedPath}`);
  const llmClassified: LlmClassifiedBook[] = JSON.parse(Deno.readTextFileSync(llmClassifiedPath));

  // Merge books
  const allBooks: ClassifiedBook[] = [...tagClassified, ...llmClassified];

  // Sort by book_id
  allBooks.sort((a, b) => a.book_id - b.book_id);

  // Calculate statistics
  const categoryCounts: { [key in Category]: number } = {
    fiction: 0,
    cookbooks: 0,
    technical: 0,
    business: 0,
    self_help: 0,
    other_nonfiction: 0,
  };

  for (const book of allBooks) {
    categoryCounts[book.category]++;
  }

  const index: BookIndex = {
    version: "1.0.0",
    generated: new Date().toISOString(),
    collection_path: Deno.env.get("BOOKS_DIR") || "./books",
    categories: categoryDescriptions,
    statistics: {
      total_books: allBooks.length,
      classified_from_tags: tagClassified.length,
      classified_by_llm: llmClassified.length,
      category_counts: categoryCounts,
    },
    books: allBooks,
  };

  // Write output
  Deno.writeTextFileSync(outputPath, JSON.stringify(index, null, 2));
  console.log(`\nWrote index to ${outputPath}`);

  // Summary
  console.log("\n=== Final Index Summary ===");
  console.log(`Total books: ${index.statistics.total_books}`);
  console.log(`Classified by tags: ${index.statistics.classified_from_tags}`);
  console.log(`Classified by LLM: ${index.statistics.classified_by_llm}`);
  console.log("\nCategory distribution:");
  for (const [category, count] of Object.entries(categoryCounts)) {
    const pct = ((count / allBooks.length) * 100).toFixed(1);
    console.log(`  ${category}: ${count} (${pct}%)`);
  }
}
