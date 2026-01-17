#!/usr/bin/env -S deno run --allow-read

/**
 * Phoneme Inventory Generator
 *
 * Generates linguistically plausible phoneme inventories for constructed languages.
 * Uses PHOIBLE-derived frequency data to select phonemes based on cross-linguistic patterns.
 *
 * Usage:
 *   deno run --allow-read phonology.ts --complexity flavor
 *   deno run --allow-read phonology.ts --complexity naming --seed 12345
 *   deno run --allow-read phonology.ts --preset elvish_like
 *   deno run --allow-read phonology.ts --family romance --features aspirated
 */

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";

// Types
interface PhonemeData {
  frequency: number;
  place: string;
  tier: string;
  note?: string;
}

interface PhonemeInventory {
  consonants: string[];
  vowels: string[];
  syllableTemplates: string[];
  features: string[];
  metadata: {
    complexity: string;
    seed: number;
    consonantCount: number;
    vowelCount: number;
    preset?: string;
    family?: string;
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

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  pick<T>(array: T[], count: number): T[] {
    return this.shuffle(array).slice(0, count);
  }

  pickWeighted<T>(items: { item: T; weight: number }[], count: number): T[] {
    const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);
    const selected: T[] = [];
    const remaining = [...items];

    while (selected.length < count && remaining.length > 0) {
      let random = this.next() * remaining.reduce((sum, i) => sum + i.weight, 0);
      for (let i = 0; i < remaining.length; i++) {
        random -= remaining[i].weight;
        if (random <= 0) {
          selected.push(remaining[i].item);
          remaining.splice(i, 1);
          break;
        }
      }
    }

    return selected;
  }
}

// Load data files
async function loadData(): Promise<{ phonemes: any; syllables: any }> {
  const scriptDir = dirname(fromFileUrl(import.meta.url));
  const dataDir = join(scriptDir, "..", "data");

  const phonemesPath = join(dataDir, "phoneme-frequencies.json");
  const syllablesPath = join(dataDir, "syllable-templates.json");

  const phonemes = JSON.parse(await Deno.readTextFile(phonemesPath));
  const syllables = JSON.parse(await Deno.readTextFile(syllablesPath));

  return { phonemes, syllables };
}

// Extract all consonants from phoneme data with weights
function extractConsonants(data: any): { phoneme: string; weight: number; tier: string }[] {
  const consonants: { phoneme: string; weight: number; tier: string }[] = [];

  // Stops
  for (const [phoneme, info] of Object.entries(data.consonants.stops.voiceless || {})) {
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }
  for (const [phoneme, info] of Object.entries(data.consonants.stops.voiced || {})) {
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }

  // Fricatives
  for (const [phoneme, info] of Object.entries(data.consonants.fricatives.voiceless || {})) {
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }
  for (const [phoneme, info] of Object.entries(data.consonants.fricatives.voiced || {})) {
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }

  // Nasals
  for (const [phoneme, info] of Object.entries(data.consonants.nasals || {})) {
    if (phoneme === "description") continue;
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }

  // Liquids
  for (const [phoneme, info] of Object.entries(data.consonants.liquids || {})) {
    if (phoneme === "description") continue;
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }

  // Glides
  for (const [phoneme, info] of Object.entries(data.consonants.glides || {})) {
    if (phoneme === "description") continue;
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }

  // Affricates
  for (const [phoneme, info] of Object.entries(data.consonants.affricates?.voiceless || {})) {
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }
  for (const [phoneme, info] of Object.entries(data.consonants.affricates?.voiced || {})) {
    const i = info as PhonemeData;
    consonants.push({ phoneme, weight: i.frequency, tier: i.tier });
  }

  return consonants;
}

// Generate inventory based on complexity
function generateInventory(
  data: { phonemes: any; syllables: any },
  options: {
    complexity: string;
    seed: number;
    preset?: string;
    family?: string;
    features?: string[];
  }
): PhonemeInventory {
  const rng = new SeededRandom(options.seed);
  const { phonemes, syllables } = data;

  // Get complexity preset
  const complexityPreset = phonemes.complexity_presets[options.complexity] || phonemes.complexity_presets.naming;
  const targetConsonants = complexityPreset.consonants.target;
  const targetVowels = complexityPreset.vowels.target;

  // Get syllable complexity
  const syllableComplexity = options.complexity === "flavor" ? "simple" :
                            options.complexity === "naming" ? "moderate" : "complex";

  // Check for preset override
  let syllablePreset = syllables.complexity_levels[syllableComplexity];
  if (options.preset && syllables.presets[options.preset]) {
    syllablePreset = syllables.presets[options.preset];
  }

  // Build consonant pool
  const allConsonants = extractConsonants(phonemes);

  // Filter by tier based on complexity
  let tierFilter: string[];
  switch (options.complexity) {
    case "flavor":
      tierFilter = ["universal", "common"];
      break;
    case "naming":
      tierFilter = ["universal", "common", "less_common"];
      break;
    case "full":
    default:
      tierFilter = ["universal", "common", "less_common", "rare"];
  }

  const eligibleConsonants = allConsonants.filter(c => tierFilter.includes(c.tier));

  // Select consonants weighted by frequency
  const selectedConsonants = rng.pickWeighted(
    eligibleConsonants.map(c => ({ item: c.phoneme, weight: c.weight })),
    targetConsonants
  );

  // Build vowel pool
  let vowelPool: string[] = [...phonemes.vowels.universal.phonemes];

  if (targetVowels > 3) {
    vowelPool = [...vowelPool, ...phonemes.vowels.common.phonemes];
  }
  if (targetVowels > 5) {
    vowelPool = [...vowelPool, ...phonemes.vowels.extended.phonemes];
  }
  if (targetVowels > 8) {
    vowelPool = [...vowelPool, ...phonemes.vowels.less_common.phonemes];
  }

  const selectedVowels = rng.pick(vowelPool, targetVowels);

  // Determine features
  const features: string[] = [];
  if (options.features) {
    features.push(...options.features);
  }

  return {
    consonants: selectedConsonants.sort(),
    vowels: selectedVowels.sort(),
    syllableTemplates: syllablePreset.templates,
    features,
    metadata: {
      complexity: options.complexity,
      seed: options.seed,
      consonantCount: selectedConsonants.length,
      vowelCount: selectedVowels.length,
      preset: options.preset,
      family: options.family,
    },
  };
}

// Format output
function formatInventory(inventory: PhonemeInventory): string {
  const lines: string[] = [];

  lines.push(`# Phoneme Inventory\n`);
  lines.push(`**Complexity:** ${inventory.metadata.complexity}`);
  lines.push(`**Seed:** ${inventory.metadata.seed} (use this seed to regenerate)`);
  if (inventory.metadata.preset) {
    lines.push(`**Preset:** ${inventory.metadata.preset}`);
  }
  lines.push("");

  lines.push(`## Consonants (${inventory.metadata.consonantCount})\n`);
  lines.push(inventory.consonants.join("  "));
  lines.push("");

  lines.push(`## Vowels (${inventory.metadata.vowelCount})\n`);
  lines.push(inventory.vowels.join("  "));
  lines.push("");

  lines.push(`## Syllable Structure\n`);
  lines.push(`Templates: ${inventory.syllableTemplates.join(", ")}`);
  lines.push("");

  if (inventory.features.length > 0) {
    lines.push(`## Special Features\n`);
    lines.push(inventory.features.join(", "));
    lines.push("");
  }

  lines.push(`## Usage Tips\n`);
  lines.push("- Use the consonants and vowels to create names following the syllable templates");
  lines.push("- CV = consonant + vowel, CVC = consonant + vowel + consonant, etc.");
  lines.push("- For consistency, stick to these phonemes for all names in this culture/species");
  lines.push("- Save this seed to regenerate the same inventory later");

  return lines.join("\n");
}

// Main function
async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Phoneme Inventory Generator

Usage:
  deno run --allow-read phonology.ts [options]

Options:
  --complexity <level>  Complexity level: flavor, naming, full (default: naming)
  --seed <number>       Seed for reproducible generation (default: random)
  --preset <name>       Use a preset style: japanese_like, hawaiian_like, latin_like,
                        arabic_like, english_like, elvish_like, harsh_fantasy
  --family <name>       Base on language family: romance, germanic, slavic, semitic,
                        sino_tibetan, polynesian, japanese
  --features <list>     Comma-separated optional features: aspirated, ejectives, tones
  --json                Output as JSON

Complexity Levels:
  flavor  - Minimal (10-15 consonants, 3-5 vowels) for quick names/phrases
  naming  - Standard (15-22 consonants, 5-7 vowels) for consistent naming
  full    - Complete (20-35 consonants, 7-12 vowels) for developed language

Examples:
  deno run --allow-read phonology.ts --complexity flavor
  deno run --allow-read phonology.ts --preset elvish_like --seed 42
  deno run --allow-read phonology.ts --complexity full --features aspirated,tones
`);
    Deno.exit(0);
  }

  // Parse arguments
  const complexityIndex = args.indexOf("--complexity");
  const seedIndex = args.indexOf("--seed");
  const presetIndex = args.indexOf("--preset");
  const familyIndex = args.indexOf("--family");
  const featuresIndex = args.indexOf("--features");
  const jsonOutput = args.includes("--json");

  const complexity = complexityIndex !== -1 && args[complexityIndex + 1]
    ? args[complexityIndex + 1]
    : "naming";

  const seed = seedIndex !== -1 && args[seedIndex + 1]
    ? parseInt(args[seedIndex + 1], 10)
    : Math.floor(Math.random() * 1000000);

  const preset = presetIndex !== -1 ? args[presetIndex + 1] : undefined;
  const family = familyIndex !== -1 ? args[familyIndex + 1] : undefined;
  const features = featuresIndex !== -1 && args[featuresIndex + 1]
    ? args[featuresIndex + 1].split(",")
    : undefined;

  // Validate complexity
  if (!["flavor", "naming", "full"].includes(complexity)) {
    console.error(`Error: Unknown complexity level "${complexity}"`);
    console.error("Available: flavor, naming, full");
    Deno.exit(1);
  }

  // Load data and generate
  try {
    const data = await loadData();
    const inventory = generateInventory(data, {
      complexity,
      seed,
      preset,
      family,
      features,
    });

    if (jsonOutput) {
      console.log(JSON.stringify(inventory, null, 2));
    } else {
      console.log(formatInventory(inventory));
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    Deno.exit(1);
  }
}

main();
