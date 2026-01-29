#!/usr/bin/env -S deno run --allow-read

/**
 * Character Name Generator
 *
 * Generates character names from curated lists or phoneme patterns.
 * Breaks LLM statistical defaults by using external entropy.
 *
 * Usage:
 *   deno run --allow-read character-name.ts --culture chinese --gender female
 *   deno run --allow-read character-name.ts --pool contemporary-american --count 5
 *   deno run --allow-read character-name.ts --fantasy elvish-like --count 10
 *   deno run --allow-read character-name.ts --culture anglo --cast cast.json
 */

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";

// === INTERFACES ===

interface NameList {
  _meta?: {
    description?: string;
    maturity?: string;
    count?: number;
    source?: string;
    dimensions?: string[];
  };
  names: string[];
}

interface PhonemePreset {
  _meta?: {
    description?: string;
    aesthetic?: string;
  };
  consonants: string[];
  vowels: string[];
  syllableTemplates: string[];
  maxClusters?: number;
}

interface CastFile {
  _meta?: {
    project?: string;
    created?: string;
    updated?: string;
  };
  characters: Array<{
    name: string;
    role?: string;
    culture?: string;
    soundProfile?: {
      startsWith?: string;
      syllables?: number;
    };
  }>;
  usedSurnames: string[];
  usedGivenNames: string[];
}

interface GeneratedName {
  name: string;
  source: string;
  collision?: boolean;
  collisionWith?: string;
}

// === SEEDED RANDOM ===

class SeededRandom {
  private seed: number;

  constructor(seed?: number) {
    this.seed = seed ?? Math.floor(Math.random() * 1000000);
  }

  next(): number {
    this.seed = (this.seed * 1103515245 + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  pick<T>(array: T[]): T {
    return array[Math.floor(this.next() * array.length)];
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  range(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  getSeed(): number {
    return this.seed;
  }
}

// === DATA LOADING ===

function getDataDir(): string {
  const scriptDir = dirname(fromFileUrl(import.meta.url));
  return join(scriptDir, "..", "data");
}

async function loadNameList(culture: string, type: string): Promise<NameList | null> {
  const dataDir = getDataDir();
  const possiblePaths = [
    join(dataDir, "cultures", `${culture}-${type}.json`),
    join(dataDir, "cultures", culture, `${type}.json`),
    join(dataDir, "cultures", `${culture}.json`),
  ];

  for (const path of possiblePaths) {
    try {
      const content = await Deno.readTextFile(path);
      return JSON.parse(content);
    } catch {
      // Try next path
    }
  }
  return null;
}

async function loadMixedPool(poolName: string): Promise<NameList | null> {
  const dataDir = getDataDir();
  const path = join(dataDir, "mixed-pools", `${poolName}.json`);
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function loadPhonemePreset(presetName: string): Promise<PhonemePreset | null> {
  const dataDir = getDataDir();
  const path = join(dataDir, "phoneme-presets", `${presetName}.json`);
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function loadCastFile(castPath: string): Promise<CastFile | null> {
  try {
    const content = await Deno.readTextFile(castPath);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function listAvailableCultures(): Promise<string[]> {
  const dataDir = getDataDir();
  const culturesDir = join(dataDir, "cultures");
  const cultures = new Set<string>();

  try {
    for await (const entry of Deno.readDir(culturesDir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        // Extract culture name from filename like "chinese-surnames.json"
        const match = entry.name.match(/^([a-z-]+?)(?:-(surnames|given|given-male|given-female))?\.json$/);
        if (match) {
          cultures.add(match[1]);
        }
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return Array.from(cultures).sort();
}

async function listAvailablePools(): Promise<string[]> {
  const dataDir = getDataDir();
  const poolsDir = join(dataDir, "mixed-pools");
  const pools: string[] = [];

  try {
    for await (const entry of Deno.readDir(poolsDir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        pools.push(entry.name.replace(".json", ""));
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return pools.sort();
}

async function listAvailablePresets(): Promise<string[]> {
  const dataDir = getDataDir();
  const presetsDir = join(dataDir, "phoneme-presets");
  const presets: string[] = [];

  try {
    for await (const entry of Deno.readDir(presetsDir)) {
      if (entry.isFile && entry.name.endsWith(".json")) {
        presets.push(entry.name.replace(".json", ""));
      }
    }
  } catch {
    // Directory doesn't exist yet
  }

  return presets.sort();
}

// === NAME GENERATION ===

function generateFromList(list: NameList, count: number, rng: SeededRandom): string[] {
  const shuffled = rng.shuffle(list.names);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function generateSyllable(preset: PhonemePreset, template: string, rng: SeededRandom): string {
  let syllable = "";
  for (const char of template) {
    if (char === "C") {
      syllable += rng.pick(preset.consonants);
    } else if (char === "V") {
      syllable += rng.pick(preset.vowels);
    }
  }
  return syllable;
}

function generateFantasyName(preset: PhonemePreset, syllableCount: number, rng: SeededRandom): string {
  const syllables: string[] = [];
  for (let i = 0; i < syllableCount; i++) {
    const template = rng.pick(preset.syllableTemplates);
    syllables.push(generateSyllable(preset, template, rng));
  }
  const name = syllables.join("");
  // Capitalize first letter
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function checkCollision(name: string, cast: CastFile): { collision: boolean; collisionWith?: string } {
  const nameLower = name.toLowerCase();
  const nameFirst = nameLower.charAt(0);
  const nameParts = nameLower.split(/\s+/);

  for (const character of cast.characters) {
    const charLower = character.name.toLowerCase();
    const charFirst = charLower.charAt(0);
    const charParts = charLower.split(/\s+/);

    // Check for exact match
    if (nameLower === charLower) {
      return { collision: true, collisionWith: character.name };
    }

    // Check for same first initial (high collision risk)
    if (nameFirst === charFirst && nameParts[0].length <= 5 && charParts[0].length <= 5) {
      // Short names with same initial are risky
      const similarity = calculateSimilarity(nameParts[0], charParts[0]);
      if (similarity > 0.6) {
        return { collision: true, collisionWith: character.name };
      }
    }

    // Check surname collision
    if (nameParts.length > 1 && charParts.length > 1) {
      if (nameParts[nameParts.length - 1] === charParts[charParts.length - 1]) {
        return { collision: true, collisionWith: `${character.name} (same surname)` };
      }
    }
  }

  return { collision: false };
}

function calculateSimilarity(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  // Simple similarity: shared characters / max length
  const aChars = new Set(a.split(""));
  const bChars = new Set(b.split(""));
  let shared = 0;
  for (const char of aChars) {
    if (bChars.has(char)) shared++;
  }
  return shared / Math.max(aChars.size, bChars.size);
}

// === OUTPUT FORMATTING ===

function formatNames(names: GeneratedName[], jsonOutput: boolean): void {
  if (jsonOutput) {
    console.log(JSON.stringify(names, null, 2));
  } else {
    for (const item of names) {
      if (item.collision) {
        console.log(`- ${item.name} [COLLISION with ${item.collisionWith}]`);
      } else {
        console.log(`- ${item.name}`);
      }
    }
  }
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Character Name Generator

Usage:
  deno run --allow-read character-name.ts [options]

Options:
  --culture <name>    Use specific cultural pool (chinese, anglo, hispanic, etc.)
  --pool <name>       Use mixed pool (contemporary-american, etc.)
  --fantasy <preset>  Generate from phoneme preset (elvish-like, harsh-fantasy, neutral)
  --gender <m|f>      Filter for gendered lists (male/female given names)
  --count <n>         Number of names to generate (default: 5)
  --syllables <range> Syllable range for fantasy names (e.g., "2-3", default: 2-3)
  --full-name         Generate given + surname combination
  --cast <file>       Path to cast tracker JSON for collision checking
  --seed <n>          Seed for reproducible generation
  --json              Output as JSON
  --list              Show available cultures, pools, and presets

Examples:
  deno run --allow-read character-name.ts --culture chinese --gender female --count 5
  deno run --allow-read character-name.ts --pool contemporary-american --full-name --count 10
  deno run --allow-read character-name.ts --fantasy elvish-like --syllables 2-4 --count 20
  deno run --allow-read character-name.ts --culture anglo --cast my-project-cast.json
`);
    Deno.exit(0);
  }

  // List available options
  if (args.includes("--list")) {
    const cultures = await listAvailableCultures();
    const pools = await listAvailablePools();
    const presets = await listAvailablePresets();

    console.log("Available cultures:");
    if (cultures.length === 0) {
      console.log("  (none yet - add JSON files to data/cultures/)");
    } else {
      for (const c of cultures) console.log(`  - ${c}`);
    }

    console.log("\nAvailable pools:");
    if (pools.length === 0) {
      console.log("  (none yet - add JSON files to data/mixed-pools/)");
    } else {
      for (const p of pools) console.log(`  - ${p}`);
    }

    console.log("\nAvailable fantasy presets:");
    if (presets.length === 0) {
      console.log("  (none yet - add JSON files to data/phoneme-presets/)");
    } else {
      for (const p of presets) console.log(`  - ${p}`);
    }

    Deno.exit(0);
  }

  // Parse arguments
  const cultureIndex = args.indexOf("--culture");
  const poolIndex = args.indexOf("--pool");
  const fantasyIndex = args.indexOf("--fantasy");
  const genderIndex = args.indexOf("--gender");
  const countIndex = args.indexOf("--count");
  const syllablesIndex = args.indexOf("--syllables");
  const castIndex = args.indexOf("--cast");
  const seedIndex = args.indexOf("--seed");
  const fullName = args.includes("--full-name");
  const jsonOutput = args.includes("--json");

  const culture = cultureIndex !== -1 ? args[cultureIndex + 1] : undefined;
  const pool = poolIndex !== -1 ? args[poolIndex + 1] : undefined;
  const fantasy = fantasyIndex !== -1 ? args[fantasyIndex + 1] : undefined;
  const gender = genderIndex !== -1 ? args[genderIndex + 1] : undefined;
  const count = countIndex !== -1 ? parseInt(args[countIndex + 1], 10) : 5;
  const castPath = castIndex !== -1 ? args[castIndex + 1] : undefined;
  const seed = seedIndex !== -1 ? parseInt(args[seedIndex + 1], 10) : undefined;

  // Parse syllable range
  let syllableRange: [number, number] = [2, 3];
  if (syllablesIndex !== -1 && args[syllablesIndex + 1]) {
    const parts = args[syllablesIndex + 1].split("-").map(Number);
    if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
      syllableRange = [parts[0], parts[1]];
    }
  }

  const rng = new SeededRandom(seed);

  // Load cast file if specified
  let cast: CastFile | null = null;
  if (castPath) {
    cast = await loadCastFile(castPath);
    if (!cast) {
      console.error(`Warning: Could not load cast file: ${castPath}`);
    }
  }

  // Generate based on mode
  let generatedNames: GeneratedName[] = [];

  if (fantasy) {
    // Fantasy mode: generate from phoneme preset
    const preset = await loadPhonemePreset(fantasy);
    if (!preset) {
      console.error(`Error: Fantasy preset "${fantasy}" not found. Use --list to see available presets.`);
      Deno.exit(1);
    }

    for (let i = 0; i < count; i++) {
      const syllableCount = rng.range(syllableRange[0], syllableRange[1]);
      const name = generateFantasyName(preset, syllableCount, rng);
      const generated: GeneratedName = { name, source: `fantasy:${fantasy}` };

      if (cast) {
        const collision = checkCollision(name, cast);
        generated.collision = collision.collision;
        generated.collisionWith = collision.collisionWith;
      }

      generatedNames.push(generated);
    }
  } else if (pool) {
    // Pool mode: generate from mixed pool
    const poolData = await loadMixedPool(pool);
    if (!poolData) {
      console.error(`Error: Pool "${pool}" not found. Use --list to see available pools.`);
      Deno.exit(1);
    }

    const names = generateFromList(poolData, count, rng);
    for (const name of names) {
      const generated: GeneratedName = { name, source: `pool:${pool}` };

      if (cast) {
        const collision = checkCollision(name, cast);
        generated.collision = collision.collision;
        generated.collisionWith = collision.collisionWith;
      }

      generatedNames.push(generated);
    }
  } else if (culture) {
    // Culture mode: generate from cultural lists
    if (fullName) {
      // Generate full names (given + surname)
      const surnameList = await loadNameList(culture, "surnames");
      const givenType = gender === "f" ? "given-female" : gender === "m" ? "given-male" : "given";
      const givenList = await loadNameList(culture, givenType) || await loadNameList(culture, "given");

      if (!surnameList || !givenList) {
        console.error(`Error: Could not load name lists for culture "${culture}". Use --list to see available cultures.`);
        Deno.exit(1);
      }

      const surnames = generateFromList(surnameList, count, rng);
      const givenNames = generateFromList(givenList, count, rng);

      for (let i = 0; i < count; i++) {
        const name = `${givenNames[i]} ${surnames[i]}`;
        const generated: GeneratedName = { name, source: `culture:${culture}` };

        if (cast) {
          const collision = checkCollision(name, cast);
          generated.collision = collision.collision;
          generated.collisionWith = collision.collisionWith;
        }

        generatedNames.push(generated);
      }
    } else {
      // Generate just given names or surnames
      const listType = gender === "f" ? "given-female" : gender === "m" ? "given-male" : "surnames";
      const list = await loadNameList(culture, listType) || await loadNameList(culture, "given");

      if (!list) {
        console.error(`Error: Could not load name list for culture "${culture}". Use --list to see available cultures.`);
        Deno.exit(1);
      }

      const names = generateFromList(list, count, rng);
      for (const name of names) {
        const generated: GeneratedName = { name, source: `culture:${culture}:${listType}` };

        if (cast) {
          const collision = checkCollision(name, cast);
          generated.collision = collision.collision;
          generated.collisionWith = collision.collisionWith;
        }

        generatedNames.push(generated);
      }
    }
  } else {
    console.error("Error: Specify --culture, --pool, or --fantasy. Use --help for usage.");
    Deno.exit(1);
  }

  formatNames(generatedNames, jsonOutput);
}

main();
