#!/usr/bin/env bun

/**
 * meter-check.ts
 *
 * Analyzes lyrics for syllable counts and stress patterns using CMUDict data.
 * Identifies potential meter mismatches and suggests alternatives.
 *
 * Usage: bun run scripts/meter-check.ts "your lyrics here"
 *        bun run scripts/meter-check.ts --file lyrics.txt
 */

import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

interface WordEntry {
  phones: string[];
  syllables: number;
  stress: number[];
}

interface CMUDict {
  words: Record<string, WordEntry>;
  phoneKey: {
    vowels: string[];
    consonants: string[];
  };
}

interface LineAnalysis {
  text: string;
  syllableCount: number;
  stressPattern: string;
  unknownWords: string[];
  wordBreakdown: { word: string; syllables: number; stress: string }[];
}

function loadCMUDict(): CMUDict {
  const dictPath = resolve(__dirname, "../data/cmudict-simplified.json");
  const content = readFileSync(dictPath, "utf-8");
  return JSON.parse(content);
}

function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

function estimateSyllables(word: string): number {
  // Fallback syllable counting for unknown words
  const vowels = "aeiouy";
  let count = 0;
  let prevVowel = false;

  const cleaned = word.toLowerCase();

  for (let i = 0; i < cleaned.length; i++) {
    const isVowel = vowels.includes(cleaned[i]);
    if (isVowel && !prevVowel) {
      count++;
    }
    prevVowel = isVowel;
  }

  // Handle silent e
  if (cleaned.endsWith("e") && count > 1 && !cleaned.endsWith("le")) {
    count--;
  }

  // Handle -ed endings
  if (cleaned.endsWith("ed") && !cleaned.endsWith("ted") && !cleaned.endsWith("ded")) {
    count--;
  }

  return Math.max(1, count);
}

function estimateStress(word: string, syllables: number): number[] {
  // Simple heuristic for stress when word not in dictionary
  if (syllables === 1) return [1];
  if (syllables === 2) return [1, 0]; // Default trochaic
  if (syllables === 3) return [1, 0, 0]; // Default dactylic
  return [1, ...Array(syllables - 1).fill(0)];
}

function analyzeLine(line: string, dict: CMUDict): LineAnalysis {
  const words = line.split(/\s+/).filter(w => w.length > 0);
  const wordBreakdown: { word: string; syllables: number; stress: string }[] = [];
  const unknownWords: string[] = [];
  let totalSyllables = 0;
  let stressPattern = "";

  for (const rawWord of words) {
    const word = cleanWord(rawWord);
    if (!word) continue;

    const entry = dict.words[word];

    if (entry) {
      totalSyllables += entry.syllables;
      const stressStr = entry.stress.map(s => s === 0 ? "u" : "/").join("");
      stressPattern += stressStr + " ";
      wordBreakdown.push({
        word: rawWord,
        syllables: entry.syllables,
        stress: stressStr
      });
    } else {
      unknownWords.push(word);
      const estimatedSyllables = estimateSyllables(word);
      const estimatedStress = estimateStress(word, estimatedSyllables);
      totalSyllables += estimatedSyllables;
      const stressStr = estimatedStress.map(s => s === 0 ? "u" : "/").join("");
      stressPattern += stressStr + "? ";
      wordBreakdown.push({
        word: rawWord + "?",
        syllables: estimatedSyllables,
        stress: stressStr + "?"
      });
    }
  }

  return {
    text: line,
    syllableCount: totalSyllables,
    stressPattern: stressPattern.trim(),
    unknownWords,
    wordBreakdown
  };
}

function identifyMeter(stressPattern: string): string {
  // Clean the pattern
  const clean = stressPattern.replace(/[\s?]/g, "");

  // Check for common patterns
  if (/^(u\/)+u?$/.test(clean)) return "iambic";
  if (/^(\/u)+\/?$/.test(clean)) return "trochaic";
  if (/^(uu\/)+u?u?$/.test(clean)) return "anapestic";
  if (/^(\/uu)+\/?u?$/.test(clean)) return "dactylic";
  if (/^(\/\/)+\/?$/.test(clean)) return "spondaic";

  return "mixed/free";
}

function formatResults(analyses: LineAnalysis[]): string {
  const lines: string[] = [];

  lines.push("=".repeat(60));
  lines.push("LYRIC METER ANALYSIS");
  lines.push("=".repeat(60));
  lines.push("");

  // Summary statistics
  const syllableCounts = analyses.map(a => a.syllableCount);
  const avgSyllables = syllableCounts.reduce((a, b) => a + b, 0) / syllableCounts.length;
  const minSyllables = Math.min(...syllableCounts);
  const maxSyllables = Math.max(...syllableCounts);
  const variance = maxSyllables - minSyllables;

  lines.push("SUMMARY");
  lines.push("-".repeat(40));
  lines.push(`Lines analyzed: ${analyses.length}`);
  lines.push(`Average syllables per line: ${avgSyllables.toFixed(1)}`);
  lines.push(`Range: ${minSyllables} - ${maxSyllables} (variance: ${variance})`);
  lines.push("");

  // Variance warning
  if (variance > 4) {
    lines.push("WARNING: High syllable variance between lines.");
    lines.push("This may indicate meter inconsistency.");
    lines.push("");
  }

  // Line-by-line analysis
  lines.push("LINE-BY-LINE ANALYSIS");
  lines.push("-".repeat(40));

  for (let i = 0; i < analyses.length; i++) {
    const analysis = analyses[i];
    const meter = identifyMeter(analysis.stressPattern);

    lines.push(`\nLine ${i + 1}: "${analysis.text}"`);
    lines.push(`  Syllables: ${analysis.syllableCount}`);
    lines.push(`  Stress: ${analysis.stressPattern}`);
    lines.push(`  Meter: ${meter}`);

    if (analysis.unknownWords.length > 0) {
      lines.push(`  Unknown words (estimated): ${analysis.unknownWords.join(", ")}`);
    }

    // Word breakdown
    lines.push(`  Breakdown:`);
    for (const wb of analysis.wordBreakdown) {
      lines.push(`    "${wb.word}": ${wb.syllables} syl [${wb.stress}]`);
    }
  }

  // Overall meter assessment
  const allPatterns = analyses.map(a => identifyMeter(a.stressPattern));
  const meterCounts: Record<string, number> = {};
  for (const m of allPatterns) {
    meterCounts[m] = (meterCounts[m] || 0) + 1;
  }

  lines.push("");
  lines.push("-".repeat(40));
  lines.push("METER DISTRIBUTION");
  for (const [meter, count] of Object.entries(meterCounts)) {
    const pct = ((count / analyses.length) * 100).toFixed(0);
    lines.push(`  ${meter}: ${count} lines (${pct}%)`);
  }

  lines.push("");
  lines.push("=".repeat(60));
  lines.push("");
  lines.push("Key: / = stressed, u = unstressed, ? = estimated");

  return lines.join("\n");
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: bun run scripts/meter-check.ts <lyrics>");
  console.log("       bun run scripts/meter-check.ts --file <path>");
  process.exit(1);
}

let text: string;

if (args[0] === "--file" && args[1]) {
  text = readFileSync(args[1], "utf-8");
} else {
  text = args.join(" ");
}

const dict = loadCMUDict();

// Split into lines and analyze each
const textLines = text.split(/\n/).filter(line => line.trim().length > 0);
const analyses = textLines.map(line => analyzeLine(line.trim(), dict));

console.log(formatResults(analyses));
