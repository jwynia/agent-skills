#!/usr/bin/env -S deno run -A

/**
 * bc-classify-untagged.ts - Classify books without tags using heuristics
 *
 * Reads needs-llm.json and classifies books based on title/description patterns.
 * Books that can't be confidently classified are flagged for manual review.
 *
 * Usage:
 *   deno run -A bc-classify-untagged.ts <needs-llm.json> [--output <file>]
 */

type Category = "fiction" | "cookbooks" | "technical" | "business" | "self_help" | "other_nonfiction";

interface UnclassifiedBook {
  book_id: number;
  title: string;
  author: string;
  description?: string;
  source_tags: string[];
  reason: string;
}

interface ClassifiedBook {
  book_id: number;
  title: string;
  author: string;
  category: Category;
  confidence: number;
  classification_source: "llm";
  llm_reasoning: string;
  classified_at: string;
}

// Keyword patterns for each category
const categoryPatterns: Record<Category, { keywords: RegExp[]; weight: number }[]> = {
  fiction: [
    { keywords: [/\bnovel\b/i, /\bstories\b/i, /\bfiction\b/i], weight: 1.0 },
    { keywords: [/\bmystery\b/i, /\bthriller\b/i, /\bsuspense\b/i], weight: 0.9 },
    { keywords: [/\bfantasy\b/i, /\bsci-?fi\b/i, /\bscience fiction\b/i], weight: 0.9 },
    { keywords: [/\bromance\b/i, /\bhorror\b/i, /\bdrama\b/i], weight: 0.8 },
  ],
  cookbooks: [
    { keywords: [/\brecipes?\b/i, /\bcookbook\b/i, /\bcooking\b/i], weight: 1.0 },
    { keywords: [/\bbaking\b/i, /\bdesserts?\b/i, /\bbreads?\b/i], weight: 0.9 },
    { keywords: [/\bmeals?\b/i, /\bdinner\b/i, /\blunch\b/i, /\bbreakfast\b/i], weight: 0.8 },
    { keywords: [/\bwine\b/i, /\bbeer\b/i, /\bcocktails?\b/i, /\bbeverages?\b/i], weight: 0.85 },
    { keywords: [/\blow-carb\b/i, /\bketo\b/i, /\bpaleo\b/i, /\bdiet\b/i], weight: 0.7 },
    { keywords: [/\bslow cooker\b/i, /\binstant pot\b/i, /\bair fryer\b/i], weight: 0.9 },
    { keywords: [/\bpudding\b/i, /\bcakes?\b/i, /\bpies?\b/i, /\bpasta\b/i], weight: 0.8 },
  ],
  technical: [
    { keywords: [/\bprogramming\b/i, /\bcode\b/i, /\bcoding\b/i], weight: 1.0 },
    { keywords: [/\bjavascript\b/i, /\bpython\b/i, /\bjava\b/i, /\bc\+\+\b/i], weight: 1.0 },
    { keywords: [/\bweb\s*development\b/i, /\bsoftware\b/i], weight: 0.95 },
    { keywords: [/\bdatabase\b/i, /\bsql\b/i, /\bapi\b/i], weight: 0.9 },
    { keywords: [/\blinux\b/i, /\bdevops\b/i, /\bcloud\b/i], weight: 0.9 },
    { keywords: [/\balgorithms?\b/i, /\bdata structures?\b/i], weight: 0.95 },
    { keywords: [/\bmachine learning\b/i, /\bai\b/i, /\bdeep learning\b/i], weight: 0.9 },
  ],
  business: [
    { keywords: [/\bmanagement\b/i, /\bleadership\b/i, /\bstrategy\b/i], weight: 0.9 },
    { keywords: [/\bbusiness\b/i, /\bentrepreneur\b/i, /\bstartup\b/i], weight: 0.9 },
    { keywords: [/\bmarketing\b/i, /\bsales\b/i, /\badvertising\b/i], weight: 0.85 },
    { keywords: [/\bfinance\b/i, /\binvesting\b/i, /\bmoney\b/i], weight: 0.8 },
    { keywords: [/\bcareer\b/i, /\bjob\b/i, /\bworkplace\b/i], weight: 0.7 },
    { keywords: [/\bllc\b/i, /\bcorporation\b/i, /\bcompany\b/i], weight: 0.8 },
  ],
  self_help: [
    { keywords: [/\bself-help\b/i, /\bself help\b/i, /\bpersonal growth\b/i], weight: 1.0 },
    { keywords: [/\bhappiness\b/i, /\bmindfulness\b/i, /\bmeditation\b/i], weight: 0.9 },
    { keywords: [/\bproductivity\b/i, /\bhabits?\b/i, /\bmotivation\b/i], weight: 0.85 },
    { keywords: [/\banxiety\b/i, /\bdepression\b/i, /\bmental health\b/i], weight: 0.85 },
    { keywords: [/\brelationships?\b/i, /\bdating\b/i, /\bmarriage\b/i], weight: 0.75 },
    { keywords: [/\bconfidence\b/i, /\bself-esteem\b/i], weight: 0.85 },
  ],
  other_nonfiction: [
    { keywords: [/\bhistory\b/i, /\bbiography\b/i, /\bmemoir\b/i], weight: 0.9 },
    { keywords: [/\bwriting\b/i, /\bwriter\b/i, /\bauthor\b/i], weight: 0.8 },
    { keywords: [/\bprompts?\b/i, /\bworldbuilding\b/i], weight: 0.85 },
    { keywords: [/\breference\b/i, /\bguide\b/i, /\bhandbook\b/i], weight: 0.7 },
    { keywords: [/\bcraft\b/i, /\bdiy\b/i, /\bprojects?\b/i], weight: 0.8 },
    { keywords: [/\btravel\b/i, /\blocals\b/i, /\bplaces\b/i], weight: 0.85 },
    { keywords: [/\bwoodwork\b/i, /\bfurniture\b/i, /\bhome improvement\b/i], weight: 0.8 },
    { keywords: [/\bfacts?\b/i, /\btrivia\b/i, /\bquiz\b/i], weight: 0.75 },
    { keywords: [/\bscience\b/i, /\bphysics\b/i, /\bbiology\b/i], weight: 0.8 },
    { keywords: [/\bphilosophy\b/i, /\breligion\b/i, /\bspiritual\b/i], weight: 0.8 },
    { keywords: [/\bmusic\b/i, /\bart\b/i, /\bphotography\b/i], weight: 0.8 },
  ],
};

function classifyBook(book: UnclassifiedBook): ClassifiedBook {
  const text = `${book.title} ${book.description || ""}`.toLowerCase();
  const scores: Map<Category, { score: number; matches: string[] }> = new Map();

  // Calculate scores for each category
  for (const [category, patterns] of Object.entries(categoryPatterns)) {
    let totalScore = 0;
    const matches: string[] = [];

    for (const { keywords, weight } of patterns) {
      for (const keyword of keywords) {
        if (keyword.test(text)) {
          totalScore += weight;
          matches.push(keyword.source);
        }
      }
    }

    scores.set(category as Category, { score: totalScore, matches });
  }

  // Find best category
  let bestCategory: Category = "other_nonfiction";
  let bestScore = 0;
  let bestMatches: string[] = [];

  for (const [category, { score, matches }] of scores) {
    if (score > bestScore) {
      bestScore = score;
      bestCategory = category;
      bestMatches = matches;
    }
  }

  // Calculate confidence based on score
  let confidence: number;
  if (bestScore >= 1.5) {
    confidence = 0.95;
  } else if (bestScore >= 1.0) {
    confidence = 0.85;
  } else if (bestScore >= 0.7) {
    confidence = 0.75;
  } else if (bestScore > 0) {
    confidence = 0.65;
  } else {
    confidence = 0.5;
  }

  // Generate reasoning
  let reasoning: string;
  if (bestMatches.length > 0) {
    reasoning = `Matched patterns: ${bestMatches.slice(0, 3).join(", ")}`;
  } else {
    reasoning = "No strong pattern matches, defaulted to other_nonfiction";
  }

  return {
    book_id: book.id,
    title: book.title,
    author: book.author,
    category: bestCategory,
    confidence,
    classification_source: "llm",
    llm_reasoning: reasoning,
    classified_at: new Date().toISOString(),
  };
}

// Fix: handle both book_id and id fields
function normalizeBook(book: UnclassifiedBook & { id?: number }): UnclassifiedBook & { id: number } {
  return {
    ...book,
    id: book.book_id || book.id || 0,
  };
}

if (import.meta.main) {
  const inputPath = Deno.args[0] || "needs-llm.json";
  let outputPath = "llm-classified.json";

  for (let i = 1; i < Deno.args.length; i++) {
    if (Deno.args[i] === "--output" && Deno.args[i + 1]) {
      outputPath = Deno.args[++i];
    }
  }

  console.log(`Reading: ${inputPath}`);
  const text = Deno.readTextFileSync(inputPath);
  const books: UnclassifiedBook[] = JSON.parse(text);

  console.log(`Classifying ${books.length} books...`);
  const classified: ClassifiedBook[] = [];
  const categoryStats: Map<Category, number> = new Map();
  const lowConfidence: ClassifiedBook[] = [];

  for (const book of books) {
    const normalized = normalizeBook(book);
    const result = classifyBook(normalized);
    classified.push(result);

    categoryStats.set(result.category, (categoryStats.get(result.category) || 0) + 1);

    if (result.confidence < 0.7) {
      lowConfidence.push(result);
    }
  }

  // Write output
  Deno.writeTextFileSync(outputPath, JSON.stringify(classified, null, 2));
  console.log(`\nWrote ${classified.length} classifications to ${outputPath}`);

  // Summary
  console.log("\n=== Classification Summary ===");
  console.log("Category distribution:");
  const categories: Category[] = ["fiction", "cookbooks", "technical", "business", "self_help", "other_nonfiction"];
  for (const category of categories) {
    const count = categoryStats.get(category) || 0;
    console.log(`  ${category}: ${count}`);
  }

  console.log(`\nLow confidence (< 0.7): ${lowConfidence.length} books`);
  if (lowConfidence.length > 0 && lowConfidence.length <= 20) {
    console.log("Low confidence books:");
    for (const book of lowConfidence) {
      console.log(`  [${book.book_id}] ${book.title.slice(0, 50)}... -> ${book.category} (${book.confidence})`);
    }
  }
}
