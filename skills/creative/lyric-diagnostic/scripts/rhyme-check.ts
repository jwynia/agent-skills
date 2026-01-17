#!/usr/bin/env bun

/**
 * rhyme-check.ts
 *
 * Analyzes lyrics for rhyme scheme and rhyme types.
 * Identifies perfect rhymes, slant rhymes, and internal rhymes.
 *
 * Usage: bun run scripts/rhyme-check.ts "your lyrics here"
 *        bun run scripts/rhyme-check.ts --file lyrics.txt
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

type RhymeType = "perfect" | "slant" | "eye" | "none";

interface RhymePair {
  word1: string;
  word2: string;
  line1: number;
  line2: number;
  type: RhymeType;
  phones1?: string[];
  phones2?: string[];
}

function loadCMUDict(): CMUDict {
  const dictPath = resolve(__dirname, "../data/cmudict-simplified.json");
  const content = readFileSync(dictPath, "utf-8");
  return JSON.parse(content);
}

function cleanWord(word: string): string {
  return word.toLowerCase().replace(/[^a-z']/g, "");
}

function getLastWord(line: string): string {
  const words = line.trim().split(/\s+/);
  const lastWord = words[words.length - 1];
  return cleanWord(lastWord);
}

function getEndingPhones(phones: string[]): string[] {
  // Get phones from last stressed vowel onward
  const vowels = ["AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"];

  let lastStressIndex = -1;
  for (let i = phones.length - 1; i >= 0; i--) {
    const phone = phones[i].replace(/[012]$/, "");
    if (vowels.includes(phone) && phones[i].match(/[12]$/)) {
      lastStressIndex = i;
      break;
    }
  }

  if (lastStressIndex === -1) {
    // No stressed vowel found, use last vowel
    for (let i = phones.length - 1; i >= 0; i--) {
      const phone = phones[i].replace(/[012]$/, "");
      if (vowels.includes(phone)) {
        lastStressIndex = i;
        break;
      }
    }
  }

  if (lastStressIndex === -1) return phones;

  return phones.slice(lastStressIndex);
}

function stripStress(phones: string[]): string[] {
  return phones.map(p => p.replace(/[012]$/, ""));
}

function classifyRhyme(word1: string, word2: string, dict: CMUDict): RhymeType {
  if (word1 === word2) return "none"; // Identical words don't count

  const entry1 = dict.words[word1];
  const entry2 = dict.words[word2];

  // Check eye rhyme (same ending spelling, may not have same sound)
  if (word1.slice(-2) === word2.slice(-2) && word1.length > 2 && word2.length > 2) {
    // Could be eye rhyme if not perfect
  }

  if (!entry1 || !entry2) {
    // Fallback: simple ending comparison
    if (word1.slice(-3) === word2.slice(-3)) return "perfect";
    if (word1.slice(-2) === word2.slice(-2)) return "slant";
    return "none";
  }

  const ending1 = getEndingPhones(entry1.phones);
  const ending2 = getEndingPhones(entry2.phones);

  const stripped1 = stripStress(ending1);
  const stripped2 = stripStress(ending2);

  // Perfect rhyme: identical ending sounds
  if (stripped1.join(" ") === stripped2.join(" ")) {
    return "perfect";
  }

  // Slant rhyme: similar but not identical
  // Check if vowels match but consonants differ, or vice versa
  const vowels = ["AA", "AE", "AH", "AO", "AW", "AY", "EH", "ER", "EY", "IH", "IY", "OW", "OY", "UH", "UW"];

  const vowel1 = stripped1.find(p => vowels.includes(p));
  const vowel2 = stripped2.find(p => vowels.includes(p));

  if (vowel1 && vowel2) {
    // Same vowel = potential slant
    if (vowel1 === vowel2) return "slant";
    // Similar vowels
    const similarVowels: string[][] = [
      ["IY", "IH", "EY"],
      ["EH", "AE"],
      ["AA", "AH", "AO"],
      ["OW", "UW", "UH"],
      ["AY", "OY"],
      ["AW", "OW"]
    ];
    for (const group of similarVowels) {
      if (group.includes(vowel1) && group.includes(vowel2)) {
        return "slant";
      }
    }
  }

  // Check eye rhyme
  if (word1.slice(-3) === word2.slice(-3)) {
    return "eye";
  }

  return "none";
}

function analyzeRhymeScheme(lines: string[], dict: CMUDict): {
  scheme: string;
  pairs: RhymePair[];
  density: number;
} {
  const endWords = lines.map(line => getLastWord(line));
  const pairs: RhymePair[] = [];
  const schemeLetters: string[] = [];
  const wordToLetter: Map<string, string> = new Map();
  let currentLetter = "A";

  for (let i = 0; i < endWords.length; i++) {
    const word = endWords[i];
    let foundRhyme = false;

    // Check against previous lines
    for (let j = 0; j < i; j++) {
      const prevWord = endWords[j];
      const rhymeType = classifyRhyme(word, prevWord, dict);

      if (rhymeType === "perfect" || rhymeType === "slant") {
        pairs.push({
          word1: prevWord,
          word2: word,
          line1: j + 1,
          line2: i + 1,
          type: rhymeType,
          phones1: dict.words[prevWord]?.phones,
          phones2: dict.words[word]?.phones
        });

        // Use same letter as rhyming line
        if (schemeLetters[j] && !foundRhyme) {
          schemeLetters[i] = schemeLetters[j];
          foundRhyme = true;
        }
      }
    }

    if (!foundRhyme) {
      schemeLetters[i] = currentLetter;
      currentLetter = String.fromCharCode(currentLetter.charCodeAt(0) + 1);
      if (currentLetter > "Z") currentLetter = "a";
    }
  }

  const scheme = schemeLetters.join("");
  const density = pairs.length / Math.max(1, lines.length - 1);

  return { scheme, pairs, density };
}

function findInternalRhymes(lines: string[], dict: CMUDict): RhymePair[] {
  const internalPairs: RhymePair[] = [];

  for (let lineNum = 0; lineNum < lines.length; lineNum++) {
    const words = lines[lineNum].split(/\s+/).map(w => cleanWord(w)).filter(w => w.length > 2);

    for (let i = 0; i < words.length; i++) {
      for (let j = i + 1; j < words.length; j++) {
        const rhymeType = classifyRhyme(words[i], words[j], dict);
        if (rhymeType === "perfect" || rhymeType === "slant") {
          internalPairs.push({
            word1: words[i],
            word2: words[j],
            line1: lineNum + 1,
            line2: lineNum + 1,
            type: rhymeType
          });
        }
      }
    }
  }

  return internalPairs;
}

interface RhymeQualityWarning {
  pair: [string, string];
  warning: string;
  severity: "high" | "medium" | "low";
}

function checkRhymeQuality(pairs: RhymePair[]): RhymeQualityWarning[] {
  const warnings: RhymeQualityWarning[] = [];

  // Lazy rhyme clusters from empirical testing
  const lazyClusters: { words: string[]; name: string }[] = [
    { words: ["desire", "fire", "tired", "higher", "liar"], name: "fire-desire cluster" },
    { words: ["inside", "died", "alive", "hide", "lied", "tried"], name: "interior-death cluster" },
    { words: ["heart", "apart", "start", "part", "art"], name: "heart-destruction cluster" },
    { words: ["alone", "gone", "on", "dawn", "song"], name: "isolation cluster" },
    { words: ["love", "above", "of", "dove"], name: "love-above cluster" },
    { words: ["pain", "rain", "again", "vain", "insane"], name: "suffering cluster" },
  ];

  // Semantic field categories for same-field detection
  const semanticFields: Record<string, string[]> = {
    expressions: ["laughing", "smiling", "crying", "frowning", "grinning", "weeping"],
    motion: ["walking", "running", "falling", "flying", "moving", "standing"],
    cognition: ["thinking", "feeling", "knowing", "dreaming", "hoping", "wishing"],
    emotion: ["loving", "hating", "fearing", "wanting", "needing", "craving"],
  };

  for (const pair of pairs) {
    const w1 = pair.word1.toLowerCase();
    const w2 = pair.word2.toLowerCase();

    // Check gerund-gerund (-ing/-ing)
    if (w1.endsWith("ing") && w2.endsWith("ing")) {
      warnings.push({
        pair: [w1, w2],
        warning: "Gerund-gerund rhyme: shared -ing suffix, not real sonic relationship",
        severity: "medium"
      });
    }

    // Check same semantic field
    for (const [field, words] of Object.entries(semanticFields)) {
      if (words.includes(w1) && words.includes(w2)) {
        warnings.push({
          pair: [w1, w2],
          warning: `Same semantic field (${field}): no contrast, confirms the obvious`,
          severity: "medium"
        });
        break;
      }
    }

    // Check lazy clusters
    for (const cluster of lazyClusters) {
      if (cluster.words.includes(w1) && cluster.words.includes(w2)) {
        warnings.push({
          pair: [w1, w2],
          warning: `${cluster.name}: overused pairing`,
          severity: "high"
        });
        break;
      }
    }

    // Check suffix-only rhymes (-tion/-tion, -ly/-ly, -ness/-ness)
    const suffixes = ["tion", "sion", "ness", "ment", "able", "ible"];
    for (const suffix of suffixes) {
      if (w1.endsWith(suffix) && w2.endsWith(suffix) && w1 !== w2) {
        // Only warn if the root is different
        const root1 = w1.slice(0, -suffix.length);
        const root2 = w2.slice(0, -suffix.length);
        if (root1 !== root2) {
          warnings.push({
            pair: [w1, w2],
            warning: `Suffix-only rhyme (-${suffix}): grammatical, not sonic`,
            severity: "low"
          });
          break;
        }
      }
    }
  }

  return warnings;
}

function formatResults(
  lines: string[],
  analysis: { scheme: string; pairs: RhymePair[]; density: number },
  internalRhymes: RhymePair[],
  qualityWarnings: RhymeQualityWarning[]
): string {
  const output: string[] = [];

  output.push("=".repeat(60));
  output.push("LYRIC RHYME ANALYSIS");
  output.push("=".repeat(60));
  output.push("");

  // Summary
  output.push("SUMMARY");
  output.push("-".repeat(40));
  output.push(`Lines analyzed: ${lines.length}`);
  output.push(`Rhyme scheme: ${analysis.scheme}`);
  output.push(`End rhyme pairs found: ${analysis.pairs.length}`);
  output.push(`Internal rhyme pairs found: ${internalRhymes.length}`);
  output.push(`Rhyme density: ${(analysis.density * 100).toFixed(0)}%`);
  output.push("");

  // Scheme with lines
  output.push("RHYME SCHEME");
  output.push("-".repeat(40));
  for (let i = 0; i < lines.length; i++) {
    const letter = analysis.scheme[i] || "?";
    const truncatedLine = lines[i].length > 45
      ? lines[i].slice(0, 45) + "..."
      : lines[i];
    output.push(`${letter}: ${truncatedLine}`);
  }
  output.push("");

  // End rhyme pairs
  if (analysis.pairs.length > 0) {
    output.push("END RHYME PAIRS");
    output.push("-".repeat(40));

    const perfectPairs = analysis.pairs.filter(p => p.type === "perfect");
    const slantPairs = analysis.pairs.filter(p => p.type === "slant");

    if (perfectPairs.length > 0) {
      output.push("\nPerfect Rhymes:");
      for (const pair of perfectPairs) {
        output.push(`  "${pair.word1}" (line ${pair.line1}) / "${pair.word2}" (line ${pair.line2})`);
      }
    }

    if (slantPairs.length > 0) {
      output.push("\nSlant Rhymes:");
      for (const pair of slantPairs) {
        output.push(`  "${pair.word1}" (line ${pair.line1}) / "${pair.word2}" (line ${pair.line2})`);
      }
    }
    output.push("");
  }

  // Internal rhymes
  if (internalRhymes.length > 0) {
    output.push("INTERNAL RHYMES");
    output.push("-".repeat(40));
    for (const pair of internalRhymes) {
      output.push(`  Line ${pair.line1}: "${pair.word1}" / "${pair.word2}" (${pair.type})`);
    }
    output.push("");
  }

  // Assessment
  output.push("ASSESSMENT");
  output.push("-".repeat(40));

  if (analysis.density === 0) {
    output.push("No end rhymes detected - free verse or prose-like.");
  } else if (analysis.density < 0.3) {
    output.push("Sparse rhyming - modern/indie style.");
  } else if (analysis.density < 0.6) {
    output.push("Moderate rhyming - balanced approach.");
  } else {
    output.push("Dense rhyming - traditional/structured form.");
  }

  // Quality warnings
  if (qualityWarnings.length > 0) {
    output.push("");
    output.push("RHYME QUALITY WARNINGS");
    output.push("-".repeat(40));

    const highSeverity = qualityWarnings.filter(w => w.severity === "high");
    const mediumSeverity = qualityWarnings.filter(w => w.severity === "medium");
    const lowSeverity = qualityWarnings.filter(w => w.severity === "low");

    if (highSeverity.length > 0) {
      output.push("\n[HIGH] Lazy rhyme clusters:");
      for (const w of highSeverity) {
        output.push(`  "${w.pair[0]}" / "${w.pair[1]}": ${w.warning}`);
      }
    }

    if (mediumSeverity.length > 0) {
      output.push("\n[MEDIUM] Weak rhyme patterns:");
      for (const w of mediumSeverity) {
        output.push(`  "${w.pair[0]}" / "${w.pair[1]}": ${w.warning}`);
      }
    }

    if (lowSeverity.length > 0) {
      output.push("\n[LOW] Suffix-dependent rhymes:");
      for (const w of lowSeverity) {
        output.push(`  "${w.pair[0]}" / "${w.pair[1]}": ${w.warning}`);
      }
    }
  }

  // Check for cliche rhyme pairs
  const clichePairs = [
    ["love", "above"], ["love", "dove"], ["heart", "apart"], ["heart", "start"],
    ["fire", "desire"], ["night", "light"], ["moon", "June"], ["eyes", "skies"],
    ["forever", "together"], ["rain", "pain"], ["dream", "seem"]
  ];

  const foundCliches: string[] = [];
  for (const pair of analysis.pairs) {
    for (const [a, b] of clichePairs) {
      if ((pair.word1 === a && pair.word2 === b) ||
          (pair.word1 === b && pair.word2 === a)) {
        foundCliches.push(`${a}/${b}`);
      }
    }
  }

  if (foundCliches.length > 0) {
    output.push("");
    output.push("WARNING: Cliche rhyme pairs detected:");
    for (const cliche of foundCliches) {
      output.push(`  - ${cliche}`);
    }
    output.push("Consider slant rhymes or restructuring.");
  }

  output.push("");
  output.push("=".repeat(60));

  return output.join("\n");
}

// Main execution
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log("Usage: bun run scripts/rhyme-check.ts <lyrics>");
  console.log("       bun run scripts/rhyme-check.ts --file <path>");
  process.exit(1);
}

let text: string;

if (args[0] === "--file" && args[1]) {
  text = readFileSync(args[1], "utf-8");
} else {
  text = args.join(" ");
}

const dict = loadCMUDict();

// Split into lines
const lines = text.split(/\n/).filter(line => line.trim().length > 0);

if (lines.length < 2) {
  console.log("Need at least 2 lines to analyze rhyme scheme.");
  console.log("For single-line analysis, internal rhymes will be checked.");
}

const analysis = analyzeRhymeScheme(lines, dict);
const internalRhymes = findInternalRhymes(lines, dict);
const allPairs = [...analysis.pairs, ...internalRhymes];
const qualityWarnings = checkRhymeQuality(allPairs);

console.log(formatResults(lines, analysis, internalRhymes, qualityWarnings));
