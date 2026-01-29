#!/usr/bin/env -S deno run --allow-read

/**
 * Word Generator
 *
 * Generates words from a phoneme inventory using syllable templates.
 * Can use output from phonology.ts or custom phoneme sets.
 *
 * Usage:
 *   deno run --allow-read words.ts --count 20
 *   deno run --allow-read words.ts --inventory inventory.json --count 10
 *   deno run --allow-read words.ts --syllables 2-3 --seed 12345
 *   echo '{"consonants":["k","t","n"],"vowels":["a","i"]}' | deno run --allow-read words.ts
 */

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";

// Types
interface PhonemeInventory {
  consonants: string[];
  vowels: string[];
  syllableTemplates?: string[];
  metadata?: {
    seed?: number;
  };
}

interface GeneratedWord {
  word: string;
  syllables: string[];
  structure: string;
}

interface WordGenerationResult {
  words: GeneratedWord[];
  inventory: {
    consonants: string[];
    vowels: string[];
    templates: string[];
  };
  metadata: {
    count: number;
    seed: number;
    syllableRange: [number, number];
  };
}

// Seeded random number generator
class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed;
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
}

// Default simple inventory for quick use
const DEFAULT_INVENTORY: PhonemeInventory = {
  consonants: ["p", "t", "k", "m", "n", "s", "l", "r", "w", "j", "h"],
  vowels: ["a", "e", "i", "o", "u"],
  syllableTemplates: ["CV", "CVC", "V", "VC"],
};

// Load syllable data
async function loadSyllableData(): Promise<any> {
  try {
    const scriptDir = dirname(fromFileUrl(import.meta.url));
    const dataDir = join(scriptDir, "..", "data");
    const syllablesPath = join(dataDir, "syllable-templates.json");
    return JSON.parse(await Deno.readTextFile(syllablesPath));
  } catch {
    return null;
  }
}

// Parse inventory from file or stdin
async function parseInventory(inventoryPath?: string): Promise<PhonemeInventory> {
  if (inventoryPath) {
    const content = await Deno.readTextFile(inventoryPath);
    return JSON.parse(content);
  }

  // Check for piped input
  if (!Deno.stdin.isTerminal()) {
    const decoder = new TextDecoder();
    const buffer = new Uint8Array(10000);
    const n = await Deno.stdin.read(buffer);
    if (n) {
      const content = decoder.decode(buffer.subarray(0, n));
      return JSON.parse(content);
    }
  }

  return DEFAULT_INVENTORY;
}

// Generate a single syllable from template
function generateSyllable(
  template: string,
  consonants: string[],
  vowels: string[],
  rng: SeededRandom
): { syllable: string; structure: string } {
  let syllable = "";
  let structure = "";

  for (const char of template) {
    if (char === "C") {
      syllable += rng.pick(consonants);
      structure += "C";
    } else if (char === "V") {
      syllable += rng.pick(vowels);
      structure += "V";
    } else if (char === "n") {
      // Special case for final nasal (e.g., Japanese-like)
      syllable += "n";
      structure += "n";
    }
  }

  return { syllable, structure };
}

// Generate a word with specified syllable count
function generateWord(
  inventory: PhonemeInventory,
  templates: string[],
  syllableCount: number,
  rng: SeededRandom
): GeneratedWord {
  const syllables: string[] = [];
  const structures: string[] = [];

  for (let i = 0; i < syllableCount; i++) {
    const template = rng.pick(templates);
    const { syllable, structure } = generateSyllable(
      template,
      inventory.consonants,
      inventory.vowels,
      rng
    );
    syllables.push(syllable);
    structures.push(structure);
  }

  return {
    word: syllables.join(""),
    syllables,
    structure: structures.join("-"),
  };
}

// Generate multiple words
function generateWords(
  inventory: PhonemeInventory,
  options: {
    count: number;
    seed: number;
    syllableRange: [number, number];
    templates?: string[];
  }
): WordGenerationResult {
  const rng = new SeededRandom(options.seed);

  // Use provided templates or defaults
  const templates = options.templates ||
    inventory.syllableTemplates ||
    DEFAULT_INVENTORY.syllableTemplates!;

  const words: GeneratedWord[] = [];

  for (let i = 0; i < options.count; i++) {
    const syllableCount = rng.range(options.syllableRange[0], options.syllableRange[1]);
    words.push(generateWord(inventory, templates, syllableCount, rng));
  }

  return {
    words,
    inventory: {
      consonants: inventory.consonants,
      vowels: inventory.vowels,
      templates,
    },
    metadata: {
      count: options.count,
      seed: options.seed,
      syllableRange: options.syllableRange,
    },
  };
}

// Format output
function formatOutput(result: WordGenerationResult, showDetails: boolean): string {
  const lines: string[] = [];

  lines.push(`# Generated Words\n`);
  lines.push(`**Seed:** ${result.metadata.seed}`);
  lines.push(`**Syllables:** ${result.metadata.syllableRange[0]}-${result.metadata.syllableRange[1]}`);
  lines.push(`**Count:** ${result.metadata.count}`);
  lines.push("");

  lines.push("## Words\n");

  if (showDetails) {
    for (const word of result.words) {
      lines.push(`- **${word.word}** [${word.syllables.join("-")}] (${word.structure})`);
    }
  } else {
    for (const word of result.words) {
      lines.push(`- ${word.word}`);
    }
  }

  lines.push("");
  lines.push("## Inventory Used\n");
  lines.push(`Consonants: ${result.inventory.consonants.join(" ")}`);
  lines.push(`Vowels: ${result.inventory.vowels.join(" ")}`);
  lines.push(`Templates: ${result.inventory.templates.join(", ")}`);

  return lines.join("\n");
}

// Generate word categories
function generateCategories(
  inventory: PhonemeInventory,
  templates: string[],
  seed: number
): Record<string, string[]> {
  const rng = new SeededRandom(seed);

  const categories: Record<string, { syllables: [number, number]; count: number }> = {
    "Short (1-2 syllables)": { syllables: [1, 2], count: 5 },
    "Medium (2-3 syllables)": { syllables: [2, 3], count: 5 },
    "Long (3-4 syllables)": { syllables: [3, 4], count: 5 },
    "Names (2-3 syllables)": { syllables: [2, 3], count: 10 },
    "Places (2-4 syllables)": { syllables: [2, 4], count: 5 },
  };

  const result: Record<string, string[]> = {};

  for (const [category, config] of Object.entries(categories)) {
    const words: string[] = [];
    for (let i = 0; i < config.count; i++) {
      const count = rng.range(config.syllables[0], config.syllables[1]);
      const word = generateWord(inventory, templates, count, rng);
      words.push(word.word);
    }
    result[category] = words;
  }

  return result;
}

// Main function
async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Word Generator

Usage:
  deno run --allow-read words.ts [options]

Options:
  --inventory <file>  Path to inventory JSON (from phonology.ts --json)
  --count <number>    Number of words to generate (default: 20)
  --syllables <range> Syllable count range, e.g., "2-3" (default: 1-3)
  --seed <number>     Seed for reproducible generation (default: random)
  --details           Show syllable breakdown and structure
  --categories        Generate words in categories (names, places, etc.)
  --json              Output as JSON

Input:
  Can read inventory from stdin: phonology.ts --json | words.ts --count 10

Examples:
  deno run --allow-read words.ts --count 20
  deno run --allow-read words.ts --inventory my-language.json --count 10
  deno run --allow-read words.ts --syllables 2-4 --seed 42 --details
  deno run --allow-read words.ts --categories
`);
    Deno.exit(0);
  }

  // Parse arguments
  const inventoryIndex = args.indexOf("--inventory");
  const countIndex = args.indexOf("--count");
  const syllablesIndex = args.indexOf("--syllables");
  const seedIndex = args.indexOf("--seed");
  const showDetails = args.includes("--details");
  const showCategories = args.includes("--categories");
  const jsonOutput = args.includes("--json");

  const inventoryPath = inventoryIndex !== -1 ? args[inventoryIndex + 1] : undefined;
  const count = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 20;
  const seed = seedIndex !== -1 ? parseInt(args[seedIndex + 1], 10) : Math.floor(Math.random() * 1000000);

  // Parse syllable range
  let syllableRange: [number, number] = [1, 3];
  if (syllablesIndex !== -1 && args[syllablesIndex + 1]) {
    const parts = args[syllablesIndex + 1].split("-").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      syllableRange = [parts[0], parts[1]];
    }
  }

  try {
    const inventory = await parseInventory(inventoryPath);
    const syllableData = await loadSyllableData();

    const templates = inventory.syllableTemplates ||
      (syllableData?.complexity_levels?.moderate?.templates) ||
      DEFAULT_INVENTORY.syllableTemplates!;

    if (showCategories) {
      const categories = generateCategories(inventory, templates, seed);

      if (jsonOutput) {
        console.log(JSON.stringify({ categories, seed }, null, 2));
      } else {
        console.log(`# Word Categories\n`);
        console.log(`**Seed:** ${seed}\n`);
        for (const [category, words] of Object.entries(categories)) {
          console.log(`## ${category}\n`);
          console.log(words.join(", "));
          console.log("");
        }
      }
    } else {
      const result = generateWords(inventory, {
        count,
        seed,
        syllableRange,
        templates,
      });

      if (jsonOutput) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(formatOutput(result, showDetails));
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

main();
