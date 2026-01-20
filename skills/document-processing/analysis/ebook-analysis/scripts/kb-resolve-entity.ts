#!/usr/bin/env -S deno run --allow-read

/**
 * kb-resolve-entity.ts - Entity Resolution Search
 *
 * Searches the knowledge base entity index to find matches for a given term.
 * Used during book analysis to determine if an entity already exists.
 *
 * Usage:
 *   deno run --allow-read kb-resolve-entity.ts "search term"
 *   deno run --allow-read kb-resolve-entity.ts "kind learning environment"
 *   deno run --allow-read kb-resolve-entity.ts "Hogarth" --threshold 0.5
 *
 * Options:
 *   --threshold <0-1>   Minimum match score (default: 0.3)
 *   --limit <n>         Maximum results (default: 5)
 *   --json              Output as JSON
 *   --index <path>      Path to _entities.json
 */

interface EntityRecord {
  name: string;
  path: string;
  domain: string;
  type: string;
  status: string;
  aliases: string[];
  lastUpdated: string;
}

interface EntityIndex {
  generated: string;
  entityCount: number;
  entities: EntityRecord[];
}

interface MatchResult {
  entity: EntityRecord;
  score: number;
  matchedOn: string;
  matchType: "exact" | "partial" | "fuzzy";
}

/**
 * Normalize text for comparison
 */
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/[^\w\s]/g, "");
}

/**
 * Calculate simple similarity score between two strings
 */
function similarity(a: string, b: string): number {
  const aNorm = normalize(a);
  const bNorm = normalize(b);

  // Exact match
  if (aNorm === bNorm) return 1.0;

  // One contains the other
  if (aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
    const longer = Math.max(aNorm.length, bNorm.length);
    const shorter = Math.min(aNorm.length, bNorm.length);
    return shorter / longer;
  }

  // Word overlap
  const aWords = new Set(aNorm.split(/\s+/));
  const bWords = new Set(bNorm.split(/\s+/));
  const intersection = [...aWords].filter(w => bWords.has(w));
  const union = new Set([...aWords, ...bWords]);

  if (union.size === 0) return 0;
  return intersection.length / union.size;
}

/**
 * Search for entity matches
 */
function searchEntities(
  index: EntityIndex,
  query: string,
  threshold: number = 0.3
): MatchResult[] {
  const results: MatchResult[] = [];
  const queryNorm = normalize(query);

  for (const entity of index.entities) {
    let bestScore = 0;
    let matchedOn = "";
    let matchType: "exact" | "partial" | "fuzzy" = "fuzzy";

    // Check canonical name
    const nameScore = similarity(entity.name, query);
    if (nameScore > bestScore) {
      bestScore = nameScore;
      matchedOn = entity.name;
      matchType = nameScore === 1 ? "exact" : nameScore > 0.7 ? "partial" : "fuzzy";
    }

    // Check aliases
    for (const alias of entity.aliases) {
      const aliasScore = similarity(alias, query);
      if (aliasScore > bestScore) {
        bestScore = aliasScore;
        matchedOn = alias;
        matchType = aliasScore === 1 ? "exact" : aliasScore > 0.7 ? "partial" : "fuzzy";
      }
    }

    if (bestScore >= threshold) {
      results.push({
        entity,
        score: bestScore,
        matchedOn,
        matchType,
      });
    }
  }

  // Sort by score descending
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Parse command line arguments
 */
function parseArgs(args: string[]): {
  query: string;
  threshold: number;
  limit: number;
  json: boolean;
  indexPath: string;
} {
  let query = "";
  let threshold = 0.3;
  let limit = 5;
  let json = false;
  let indexPath = "./knowledge/_entities.json";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--threshold" && args[i + 1]) {
      threshold = parseFloat(args[++i]);
    } else if (arg === "--limit" && args[i + 1]) {
      limit = parseInt(args[++i]);
    } else if (arg === "--json") {
      json = true;
    } else if (arg === "--index" && args[i + 1]) {
      indexPath = args[++i];
    } else if (!arg.startsWith("--")) {
      query = arg;
    }
  }

  return { query, threshold, limit, json, indexPath };
}

/**
 * Main function
 */
async function main() {
  const { query, threshold, limit, json, indexPath } = parseArgs(Deno.args);

  if (!query) {
    console.error("Usage: kb-resolve-entity.ts <search-term> [options]");
    console.error("Options:");
    console.error("  --threshold <0-1>  Minimum match score (default: 0.3)");
    console.error("  --limit <n>        Maximum results (default: 5)");
    console.error("  --json             Output as JSON");
    console.error("  --index <path>     Path to _entities.json");
    Deno.exit(1);
  }

  // Load index
  let index: EntityIndex;
  try {
    const content = await Deno.readTextFile(indexPath);
    index = JSON.parse(content);
  } catch (err) {
    console.error(`Error loading index from ${indexPath}:`, err);
    Deno.exit(1);
  }

  // Search
  const results = searchEntities(index, query, threshold).slice(0, limit);

  // Output
  if (json) {
    console.log(JSON.stringify({
      query,
      resultCount: results.length,
      results: results.map(r => ({
        name: r.entity.name,
        path: r.entity.path,
        type: r.entity.type,
        score: r.score,
        matchedOn: r.matchedOn,
        matchType: r.matchType,
      })),
    }, null, 2));
  } else {
    if (results.length === 0) {
      console.log(`No matches found for "${query}" (threshold: ${threshold})`);
      console.log("Consider creating a new entity.");
    } else {
      console.log(`Matches for "${query}":\n`);
      for (const result of results) {
        const scorePercent = (result.score * 100).toFixed(0);
        console.log(`  ${result.matchType.toUpperCase()} (${scorePercent}%): ${result.entity.name}`);
        console.log(`    Path: ${result.entity.path}`);
        console.log(`    Type: ${result.entity.type}`);
        if (result.matchedOn !== result.entity.name) {
          console.log(`    Matched alias: "${result.matchedOn}"`);
        }
        console.log();
      }
    }
  }
}

main();
