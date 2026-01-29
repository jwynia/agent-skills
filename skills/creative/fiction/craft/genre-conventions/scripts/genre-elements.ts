#!/usr/bin/env -S deno run --allow-read

/**
 * Genre Elements Generator
 *
 * Randomly selects genre-specific elements for creative entropy.
 * Covers all 11 elemental genres from the Writing Excuses framework.
 *
 * Usage:
 *   deno run --allow-read genre-elements.ts mystery           # Random mystery element
 *   deno run --allow-read genre-elements.ts thriller --category ticking_clocks
 *   deno run --allow-read genre-elements.ts horror --count 3
 *   deno run --allow-read genre-elements.ts --list            # Show all genres/categories
 *   deno run --allow-read genre-elements.ts --combo mystery,thriller
 */

import { dirname, fromFileUrl, join } from "https://deno.land/std@0.208.0/path/mod.ts";

interface GenreData {
  core_promise: string;
  required_elements: string[];
  categories: Record<string, string[]>;
}

interface DataFile {
  _meta: {
    description: string;
    version: string;
    genres: string[];
  };
  setting_elements?: Record<string, string[]>;
  [key: string]: GenreData | Record<string, string[]> | { description: string; version: string; genres: string[] } | undefined;
}

function randomFrom<T>(arr: T[], count: number = 1): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, arr.length));
}

async function loadData(): Promise<DataFile> {
  const scriptDir = dirname(fromFileUrl(import.meta.url));
  const dataPath = join(scriptDir, "..", "data", "genre-elements.json");
  const text = await Deno.readTextFile(dataPath);
  return JSON.parse(text);
}

function getGenres(data: DataFile): string[] {
  return data._meta.genres;
}

function getGenreData(data: DataFile, genre: string): GenreData | null {
  const genreData = data[genre];
  if (genreData && "categories" in genreData) {
    return genreData as GenreData;
  }
  return null;
}

function getAllElements(genreData: GenreData): string[] {
  const all: string[] = [];
  for (const items of Object.values(genreData.categories)) {
    all.push(...items);
  }
  return all;
}

function formatGenreInfo(genre: string, genreData: GenreData): string {
  const lines: string[] = [];
  lines.push(`\n## ${genre.charAt(0).toUpperCase() + genre.slice(1)}`);
  lines.push(`Core promise: ${genreData.core_promise}`);
  lines.push(`Required elements: ${genreData.required_elements.join(", ")}`);
  lines.push(`Categories:`);
  for (const [cat, items] of Object.entries(genreData.categories)) {
    lines.push(`  - ${cat} (${items.length} items)`);
  }
  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Genre Elements Generator - Random elements for each elemental genre

Usage:
  deno run --allow-read genre-elements.ts <genre>                    # Random element
  deno run --allow-read genre-elements.ts <genre> --category <cat>   # From specific category
  deno run --allow-read genre-elements.ts <genre> --count N          # N random elements
  deno run --allow-read genre-elements.ts --list                     # Show all genres
  deno run --allow-read genre-elements.ts --list <genre>             # Show genre categories
  deno run --allow-read genre-elements.ts --combo <genre1>,<genre2>  # One from each genre
  deno run --allow-read genre-elements.ts --info <genre>             # Genre requirements

Genres:
  wonder, idea, adventure, horror, mystery, thriller,
  humor, relationship, drama, issue, ensemble

Options:
  --count N      Return N random items
  --category C   Select from specific category within genre
  --json         Output as JSON
  --list         Show available genres or categories
  --combo        Generate one element from each specified genre
  --info         Show genre requirements and categories
  --setting      Include setting elements (scifi_tech, fantasy_magic)
`);
    Deno.exit(0);
  }

  const data = await loadData();
  const genres = getGenres(data);
  const jsonOutput = args.includes("--json");

  // List all genres
  if (args.includes("--list")) {
    const listIndex = args.indexOf("--list");
    const specificGenre = args[listIndex + 1];

    if (specificGenre && genres.includes(specificGenre)) {
      const genreData = getGenreData(data, specificGenre);
      if (genreData) {
        console.log(`\nCategories for ${specificGenre}:\n`);
        for (const [cat, items] of Object.entries(genreData.categories)) {
          console.log(`  ${cat.padEnd(25)} (${items.length} items)`);
        }
      }
    } else {
      console.log("\nAvailable elemental genres:\n");
      for (const genre of genres) {
        const gd = getGenreData(data, genre);
        if (gd) {
          const totalItems = Object.values(gd.categories).reduce((sum, arr) => sum + arr.length, 0);
          console.log(`  ${genre.padEnd(15)} - ${gd.core_promise.substring(0, 50)}... (${totalItems} items)`);
        }
      }
      console.log("\nSetting elements (not genres):");
      if (data.setting_elements) {
        for (const [key, items] of Object.entries(data.setting_elements)) {
          if (key !== "_note") {
            console.log(`  ${key.padEnd(25)} (${(items as string[]).length} items)`);
          }
        }
      }
    }
    Deno.exit(0);
  }

  // Show genre info
  if (args.includes("--info")) {
    const infoIndex = args.indexOf("--info");
    const genre = args[infoIndex + 1];
    if (!genre || !genres.includes(genre)) {
      console.error("Error: Specify a valid genre with --info");
      Deno.exit(1);
    }
    const genreData = getGenreData(data, genre);
    if (genreData) {
      console.log(formatGenreInfo(genre, genreData));
    }
    Deno.exit(0);
  }

  // Combo mode
  if (args.includes("--combo")) {
    const comboIndex = args.indexOf("--combo");
    const comboGenres = args[comboIndex + 1]?.split(",") || [];
    if (comboGenres.length === 0) {
      console.error("Error: Specify genres with --combo (e.g., --combo mystery,thriller)");
      Deno.exit(1);
    }

    const result: Record<string, string> = {};
    for (const genre of comboGenres) {
      const trimmed = genre.trim();
      if (!genres.includes(trimmed)) {
        console.error(`Error: Unknown genre "${trimmed}"`);
        Deno.exit(1);
      }
      const genreData = getGenreData(data, trimmed);
      if (genreData) {
        const all = getAllElements(genreData);
        result[trimmed] = randomFrom(all, 1)[0];
      }
    }

    if (jsonOutput) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("\nGenre combo:\n");
      for (const [genre, element] of Object.entries(result)) {
        console.log(`  ${genre}: ${element}`);
      }
    }
    Deno.exit(0);
  }

  // Parse count
  const countIndex = args.indexOf("--count");
  const count = countIndex !== -1 ? parseInt(args[countIndex + 1]) || 1 : 1;

  // Parse category
  const categoryIndex = args.indexOf("--category");
  const category = categoryIndex !== -1 ? args[categoryIndex + 1] : null;

  // Find the genre (first non-flag argument)
  const skipIndices = new Set<number>();
  if (countIndex !== -1) {
    skipIndices.add(countIndex);
    skipIndices.add(countIndex + 1);
  }
  if (categoryIndex !== -1) {
    skipIndices.add(categoryIndex);
    skipIndices.add(categoryIndex + 1);
  }

  let genre: string | undefined;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      genre = args[i];
      break;
    }
  }

  // Check for setting elements
  if (args.includes("--setting")) {
    const settingElements = data.setting_elements;
    if (settingElements) {
      const allSetting: string[] = [];
      for (const [key, items] of Object.entries(settingElements)) {
        if (key !== "_note" && Array.isArray(items)) {
          allSetting.push(...items);
        }
      }
      const selected = randomFrom(allSetting, count);
      if (jsonOutput) {
        console.log(JSON.stringify(selected, null, 2));
      } else {
        for (const item of selected) {
          console.log(`- ${item}`);
        }
      }
    }
    Deno.exit(0);
  }

  if (!genre) {
    console.error("Error: No genre specified. Use --list to see options.");
    Deno.exit(1);
  }

  if (!genres.includes(genre)) {
    console.error(`Error: Unknown genre "${genre}". Use --list to see options.`);
    Deno.exit(1);
  }

  const genreData = getGenreData(data, genre);
  if (!genreData) {
    console.error(`Error: Could not load data for genre "${genre}"`);
    Deno.exit(1);
  }

  let pool: string[];
  if (category) {
    if (!genreData.categories[category]) {
      console.error(`Error: Unknown category "${category}" for genre "${genre}"`);
      console.error(`Available categories: ${Object.keys(genreData.categories).join(", ")}`);
      Deno.exit(1);
    }
    pool = genreData.categories[category];
  } else {
    pool = getAllElements(genreData);
  }

  const selected = randomFrom(pool, count);

  if (jsonOutput) {
    console.log(JSON.stringify(selected, null, 2));
  } else {
    if (count === 1) {
      console.log(selected[0]);
    } else {
      for (const item of selected) {
        console.log(`- ${item}`);
      }
    }
  }
}

main();
