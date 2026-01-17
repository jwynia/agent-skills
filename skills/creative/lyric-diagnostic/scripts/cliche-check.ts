#!/usr/bin/env bun

/**
 * cliche-check.ts
 *
 * Analyzes lyrics for cliche terms using the lyric-dominance-rules.json data.
 * Identifies Tier 1 (always avoid) and Tier 2 (avoid by default) terms.
 *
 * Usage: bun run scripts/cliche-check.ts "your lyrics here"
 *        bun run scripts/cliche-check.ts --file lyrics.txt
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface DominanceRule {
  term: string;
  context?: string;
  tier: 1 | 2 | 3;
  dominancePercentage: number;
  triggeredCliches: string[];
  lyricAlternatives: string[];
  notes: string;
}

interface DominanceRules {
  version: string;
  rules: DominanceRule[];
  safeTerms: {
    technical: string[];
    descriptive: string[];
    semantic: string[];
  };
  genreSpecificWarnings: Record<string, { highRisk: string[]; note: string }>;
}

interface ClicheMatch {
  term: string;
  tier: 1 | 2 | 3;
  dominancePercentage: number;
  context: string;
  position: number;
  alternatives: string[];
  notes: string;
}

function loadRules(): DominanceRules {
  const rulesPath = resolve(__dirname, "../data/lyric-dominance-rules.json");
  const content = readFileSync(rulesPath, "utf-8");
  return JSON.parse(content);
}

function findCliches(text: string, rules: DominanceRules): ClicheMatch[] {
  const matches: ClicheMatch[] = [];
  const lowerText = text.toLowerCase();
  const words = lowerText.split(/\s+/);

  for (const rule of rules.rules) {
    const termLower = rule.term.toLowerCase();

    // Find all occurrences
    let position = 0;
    let searchStart = 0;

    while ((position = lowerText.indexOf(termLower, searchStart)) !== -1) {
      // Check word boundaries
      const before = position === 0 ? " " : lowerText[position - 1];
      const after = position + termLower.length >= lowerText.length
        ? " "
        : lowerText[position + termLower.length];

      const isWordBoundary = /[\s.,!?;:'"()[\]{}]/.test(before) &&
                            /[\s.,!?;:'"()[\]{}]/.test(after);

      if (isWordBoundary) {
        // Get surrounding context (10 chars each side)
        const contextStart = Math.max(0, position - 20);
        const contextEnd = Math.min(lowerText.length, position + termLower.length + 20);
        const context = "..." + text.slice(contextStart, contextEnd) + "...";

        matches.push({
          term: rule.term,
          tier: rule.tier,
          dominancePercentage: rule.dominancePercentage,
          context: context.trim(),
          position,
          alternatives: rule.lyricAlternatives,
          notes: rule.notes
        });
      }

      searchStart = position + 1;
    }
  }

  // Sort by tier (most severe first), then by position
  return matches.sort((a, b) => {
    if (a.tier !== b.tier) return a.tier - b.tier;
    return a.position - b.position;
  });
}

function formatResults(matches: ClicheMatch[], text: string): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("LYRIC CLICHE ANALYSIS");
  lines.push("=".repeat(60));
  lines.push("");

  const tier1 = matches.filter(m => m.tier === 1);
  const tier2 = matches.filter(m => m.tier === 2);
  const tier3 = matches.filter(m => m.tier === 3);

  // Summary
  lines.push(`SUMMARY: ${matches.length} potential cliche terms found`);
  lines.push(`  Tier 1 (ALWAYS AVOID): ${tier1.length}`);
  lines.push(`  Tier 2 (AVOID BY DEFAULT): ${tier2.length}`);
  lines.push(`  Tier 3 (MODERATE RISK): ${tier3.length}`);
  lines.push("");

  if (tier1.length > 0) {
    lines.push("-".repeat(60));
    lines.push("TIER 1 - ALWAYS AVOID (95%+ cliche trigger)");
    lines.push("-".repeat(60));
    for (const match of tier1) {
      lines.push(`\nTerm: "${match.term}" (${match.dominancePercentage}% dominance)`);
      lines.push(`Context: ${match.context}`);
      lines.push(`Notes: ${match.notes}`);
      lines.push("Alternatives:");
      for (const alt of match.alternatives.slice(0, 3)) {
        lines.push(`  - ${alt}`);
      }
    }
    lines.push("");
  }

  if (tier2.length > 0) {
    lines.push("-".repeat(60));
    lines.push("TIER 2 - AVOID BY DEFAULT (70-90% cliche trigger)");
    lines.push("-".repeat(60));
    for (const match of tier2) {
      lines.push(`\nTerm: "${match.term}" (${match.dominancePercentage}% dominance)`);
      lines.push(`Context: ${match.context}`);
      lines.push(`Notes: ${match.notes}`);
      lines.push("Alternatives:");
      for (const alt of match.alternatives.slice(0, 3)) {
        lines.push(`  - ${alt}`);
      }
    }
    lines.push("");
  }

  if (tier3.length > 0) {
    lines.push("-".repeat(60));
    lines.push("TIER 3 - MODERATE RISK (40-60% cliche trigger)");
    lines.push("-".repeat(60));
    for (const match of tier3) {
      lines.push(`\nTerm: "${match.term}" (${match.dominancePercentage}% dominance)`);
      lines.push(`Context: ${match.context}`);
    }
    lines.push("");
  }

  if (matches.length === 0) {
    lines.push("No high-risk cliche terms detected.");
    lines.push("This doesn't mean the lyrics are cliche-free - only that");
    lines.push("the most common trigger words are absent.");
  }

  lines.push("");
  lines.push("=".repeat(60));

  return lines.join("\n");
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: bun run scripts/cliche-check.ts <lyrics>");
  console.log("       bun run scripts/cliche-check.ts --file <path>");
  process.exit(1);
}

let text: string;

if (args[0] === "--file" && args[1]) {
  text = readFileSync(args[1], "utf-8");
} else {
  text = args.join(" ");
}

const rules = loadRules();
const matches = findCliches(text, rules);
console.log(formatResults(matches, text));
