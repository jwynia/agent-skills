#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Cast Tracker
 *
 * Manages cast tracking for collision detection and cultural distribution analysis.
 * Helps maintain variety and avoid confusing similar names.
 *
 * Usage:
 *   deno run --allow-read --allow-write cast-tracker.ts init "Novel Title"
 *   deno run --allow-read --allow-write cast-tracker.ts add "Sarah Chen" --role protagonist
 *   deno run --allow-read cast-tracker.ts check "Marcus"
 *   deno run --allow-read cast-tracker.ts distribution
 */

// === INTERFACES ===

interface SoundProfile {
  startsWith: string;
  syllables: number;
  endsWith: string;
  consonants: string[];
  vowelPattern: string;
}

interface Character {
  name: string;
  role?: string;
  culture?: string;
  soundProfile: SoundProfile;
  addedAt: string;
  notes?: string;
}

interface CastFile {
  _meta: {
    project: string;
    created: string;
    updated: string;
    version: string;
  };
  characters: Character[];
  usedSurnames: string[];
  usedGivenNames: string[];
  culturalDistribution: Record<string, number>;
}

interface CollisionResult {
  hasCollision: boolean;
  severity: "none" | "warning" | "high";
  issues: string[];
  similarTo: string[];
}

// === SOUND ANALYSIS ===

function countSyllables(name: string): number {
  // Simple syllable counter based on vowel groups
  const vowels = name.toLowerCase().match(/[aeiouy]+/g);
  return vowels ? vowels.length : 1;
}

function getConsonants(name: string): string[] {
  const consonants = name.toLowerCase().match(/[bcdfghjklmnpqrstvwxz]/g);
  return consonants ? [...new Set(consonants)] : [];
}

function getVowelPattern(name: string): string {
  return name.toLowerCase().replace(/[^aeiouy]/g, "");
}

function analyzeSoundProfile(name: string): SoundProfile {
  const parts = name.split(/\s+/);
  const firstName = parts[0].toLowerCase();

  return {
    startsWith: firstName.charAt(0),
    syllables: countSyllables(firstName),
    endsWith: firstName.charAt(firstName.length - 1),
    consonants: getConsonants(firstName),
    vowelPattern: getVowelPattern(firstName),
  };
}

// === COLLISION DETECTION ===

function checkCollision(name: string, cast: CastFile): CollisionResult {
  const result: CollisionResult = {
    hasCollision: false,
    severity: "none",
    issues: [],
    similarTo: [],
  };

  const profile = analyzeSoundProfile(name);
  const nameLower = name.toLowerCase();
  const nameParts = nameLower.split(/\s+/);
  const firstName = nameParts[0];
  const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : null;

  for (const character of cast.characters) {
    const charLower = character.name.toLowerCase();
    const charParts = charLower.split(/\s+/);
    const charFirst = charParts[0];
    const charLast = charParts.length > 1 ? charParts[charParts.length - 1] : null;

    // Exact match
    if (nameLower === charLower) {
      result.hasCollision = true;
      result.severity = "high";
      result.issues.push(`Exact match with existing character`);
      result.similarTo.push(character.name);
      continue;
    }

    // Same first initial with similar length (high collision)
    if (profile.startsWith === character.soundProfile.startsWith) {
      if (Math.abs(profile.syllables - character.soundProfile.syllables) <= 1) {
        result.hasCollision = true;
        if (result.severity !== "high") result.severity = "warning";
        result.issues.push(`Same first initial '${profile.startsWith.toUpperCase()}' with similar syllable count`);
        result.similarTo.push(character.name);
      }
    }

    // Same surname (if both have surnames)
    if (lastName && charLast && lastName === charLast) {
      result.hasCollision = true;
      result.severity = "high";
      result.issues.push(`Same surname '${lastName}'`);
      if (!result.similarTo.includes(character.name)) {
        result.similarTo.push(character.name);
      }
    }

    // Very similar first names (edit distance)
    if (levenshteinDistance(firstName, charFirst) <= 2 && firstName !== charFirst) {
      result.hasCollision = true;
      if (result.severity !== "high") result.severity = "warning";
      result.issues.push(`Very similar to '${charFirst}' (small edit distance)`);
      if (!result.similarTo.includes(character.name)) {
        result.similarTo.push(character.name);
      }
    }

    // Same ending sound with same initial
    if (
      profile.startsWith === character.soundProfile.startsWith &&
      profile.endsWith === character.soundProfile.endsWith
    ) {
      if (!result.similarTo.includes(character.name)) {
        result.hasCollision = true;
        if (result.severity !== "high") result.severity = "warning";
        result.issues.push(`Same start and end sounds`);
        result.similarTo.push(character.name);
      }
    }
  }

  // Deduplicate issues
  result.issues = [...new Set(result.issues)];
  result.similarTo = [...new Set(result.similarTo)];

  return result;
}

function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

// === FILE OPERATIONS ===

function getDefaultCastPath(): string {
  return "cast-tracker.json";
}

async function loadCast(path: string): Promise<CastFile | null> {
  try {
    const content = await Deno.readTextFile(path);
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function saveCast(path: string, cast: CastFile): Promise<void> {
  cast._meta.updated = new Date().toISOString().split("T")[0];
  await Deno.writeTextFile(path, JSON.stringify(cast, null, 2));
}

function createNewCast(projectName: string): CastFile {
  const now = new Date().toISOString().split("T")[0];
  return {
    _meta: {
      project: projectName,
      created: now,
      updated: now,
      version: "1.0",
    },
    characters: [],
    usedSurnames: [],
    usedGivenNames: [],
    culturalDistribution: {},
  };
}

// === COMMANDS ===

async function cmdInit(projectName: string, castPath: string): Promise<void> {
  const existing = await loadCast(castPath);
  if (existing) {
    console.error(`Error: Cast file already exists at ${castPath}`);
    console.error("Delete it first or use a different path with --file");
    Deno.exit(1);
  }

  const cast = createNewCast(projectName);
  await saveCast(castPath, cast);
  console.log(`Created cast tracker for "${projectName}" at ${castPath}`);
}

async function cmdAdd(
  name: string,
  castPath: string,
  options: { role?: string; culture?: string; notes?: string }
): Promise<void> {
  const cast = await loadCast(castPath);
  if (!cast) {
    console.error(`Error: Cast file not found at ${castPath}`);
    console.error("Run 'cast-tracker.ts init \"Project Name\"' first");
    Deno.exit(1);
  }

  // Check for collision first
  const collision = checkCollision(name, cast);
  if (collision.severity === "high") {
    console.error(`Error: High collision risk with existing characters:`);
    for (const issue of collision.issues) {
      console.error(`  - ${issue}`);
    }
    console.error(`  Similar to: ${collision.similarTo.join(", ")}`);
    console.error("\nUse --force to add anyway, or choose a different name.");
    Deno.exit(1);
  }

  if (collision.severity === "warning") {
    console.log(`Warning: Potential collision with existing characters:`);
    for (const issue of collision.issues) {
      console.log(`  - ${issue}`);
    }
    console.log(`  Similar to: ${collision.similarTo.join(", ")}`);
    console.log("");
  }

  // Add the character
  const profile = analyzeSoundProfile(name);
  const character: Character = {
    name,
    role: options.role,
    culture: options.culture,
    soundProfile: profile,
    addedAt: new Date().toISOString().split("T")[0],
    notes: options.notes,
  };

  cast.characters.push(character);

  // Update tracking lists
  const nameParts = name.split(/\s+/);
  if (nameParts.length > 1) {
    cast.usedSurnames.push(nameParts[nameParts.length - 1]);
  }
  cast.usedGivenNames.push(nameParts[0]);

  // Update cultural distribution
  if (options.culture) {
    cast.culturalDistribution[options.culture] =
      (cast.culturalDistribution[options.culture] || 0) + 1;
  }

  await saveCast(castPath, cast);
  console.log(`Added "${name}" to cast`);
  if (options.role) console.log(`  Role: ${options.role}`);
  if (options.culture) console.log(`  Culture: ${options.culture}`);
}

async function cmdCheck(name: string, castPath: string): Promise<void> {
  const cast = await loadCast(castPath);
  if (!cast) {
    console.error(`Error: Cast file not found at ${castPath}`);
    Deno.exit(1);
  }

  const collision = checkCollision(name, cast);

  if (collision.severity === "none") {
    console.log(`"${name}" has no collisions with existing cast.`);
  } else if (collision.severity === "warning") {
    console.log(`"${name}" has potential collisions (warning):`);
    for (const issue of collision.issues) {
      console.log(`  - ${issue}`);
    }
    console.log(`  Similar to: ${collision.similarTo.join(", ")}`);
  } else {
    console.log(`"${name}" has HIGH collision risk:`);
    for (const issue of collision.issues) {
      console.log(`  - ${issue}`);
    }
    console.log(`  Similar to: ${collision.similarTo.join(", ")}`);
  }
}

async function cmdDistribution(castPath: string): Promise<void> {
  const cast = await loadCast(castPath);
  if (!cast) {
    console.error(`Error: Cast file not found at ${castPath}`);
    Deno.exit(1);
  }

  console.log(`Cast Distribution for "${cast._meta.project}"`);
  console.log(`Total characters: ${cast.characters.length}`);
  console.log("");

  if (Object.keys(cast.culturalDistribution).length === 0) {
    console.log("Cultural distribution: (no cultures recorded)");
    console.log("Use --culture when adding characters to track distribution.");
  } else {
    console.log("Cultural distribution:");
    const sorted = Object.entries(cast.culturalDistribution).sort(
      (a, b) => b[1] - a[1]
    );
    for (const [culture, count] of sorted) {
      const pct = ((count / cast.characters.length) * 100).toFixed(0);
      console.log(`  ${culture}: ${count} (${pct}%)`);
    }
  }

  console.log("");
  console.log("First initial usage:");
  const initials: Record<string, number> = {};
  for (const char of cast.characters) {
    const initial = char.soundProfile.startsWith.toUpperCase();
    initials[initial] = (initials[initial] || 0) + 1;
  }
  const sortedInitials = Object.entries(initials).sort((a, b) => b[1] - a[1]);
  for (const [initial, count] of sortedInitials) {
    if (count > 1) {
      console.log(`  ${initial}: ${count} characters (collision risk)`);
    } else {
      console.log(`  ${initial}: ${count} character`);
    }
  }
}

async function cmdList(castPath: string): Promise<void> {
  const cast = await loadCast(castPath);
  if (!cast) {
    console.error(`Error: Cast file not found at ${castPath}`);
    Deno.exit(1);
  }

  console.log(`Cast for "${cast._meta.project}"`);
  console.log("");

  if (cast.characters.length === 0) {
    console.log("(no characters yet)");
  } else {
    for (const char of cast.characters) {
      let line = `- ${char.name}`;
      if (char.role) line += ` [${char.role}]`;
      if (char.culture) line += ` (${char.culture})`;
      console.log(line);
    }
  }
}

async function cmdSuggest(castPath: string): Promise<void> {
  const cast = await loadCast(castPath);
  if (!cast) {
    console.error(`Error: Cast file not found at ${castPath}`);
    Deno.exit(1);
  }

  console.log("Suggestions for avoiding collision:\n");

  // Find overused initials
  const initials: Record<string, number> = {};
  for (const char of cast.characters) {
    const initial = char.soundProfile.startsWith.toUpperCase();
    initials[initial] = (initials[initial] || 0) + 1;
  }

  const overused = Object.entries(initials)
    .filter(([_, count]) => count > 1)
    .map(([initial]) => initial);

  if (overused.length > 0) {
    console.log(`Avoid first initials: ${overused.join(", ")}`);
  }

  // Find unused initials
  const allInitials = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const unused = allInitials.filter((i) => !initials[i]);
  console.log(`Available first initials: ${unused.join(", ")}`);

  // Cultural balance suggestions
  if (Object.keys(cast.culturalDistribution).length > 0) {
    console.log("");
    const total = cast.characters.length;
    const underrepresented = Object.entries(cast.culturalDistribution)
      .filter(([_, count]) => count / total < 0.2)
      .map(([culture]) => culture);

    if (underrepresented.length > 0) {
      console.log(`Consider adding more: ${underrepresented.join(", ")}`);
    }
  }
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`Cast Tracker - Manage character name collision detection

Usage:
  deno run --allow-read --allow-write cast-tracker.ts <command> [options]

Commands:
  init <project>     Create new cast tracker file
  add <name>         Add character to cast
  check <name>       Check if name collides with existing cast
  list               List all characters in cast
  distribution       Show cultural and initial distribution
  suggest            Get suggestions for avoiding collisions

Options:
  --file <path>      Path to cast file (default: cast-tracker.json)
  --role <role>      Character role (for 'add' command)
  --culture <name>   Cultural background (for 'add' command)
  --notes <text>     Additional notes (for 'add' command)
  --force            Add despite collision warnings

Examples:
  deno run --allow-read --allow-write cast-tracker.ts init "My Novel"
  deno run --allow-read --allow-write cast-tracker.ts add "Sarah Chen" --role protagonist --culture chinese-american
  deno run --allow-read cast-tracker.ts check "Marcus"
  deno run --allow-read cast-tracker.ts distribution
`);
    Deno.exit(0);
  }

  // Parse global options
  const fileIndex = args.indexOf("--file");
  const castPath = fileIndex !== -1 ? args[fileIndex + 1] : getDefaultCastPath();

  const command = args[0];

  switch (command) {
    case "init": {
      const projectName = args[1];
      if (!projectName || projectName.startsWith("--")) {
        console.error("Error: Project name required. Usage: cast-tracker.ts init \"Project Name\"");
        Deno.exit(1);
      }
      await cmdInit(projectName, castPath);
      break;
    }

    case "add": {
      const name = args[1];
      if (!name || name.startsWith("--")) {
        console.error("Error: Character name required. Usage: cast-tracker.ts add \"Full Name\"");
        Deno.exit(1);
      }

      const roleIndex = args.indexOf("--role");
      const cultureIndex = args.indexOf("--culture");
      const notesIndex = args.indexOf("--notes");

      await cmdAdd(name, castPath, {
        role: roleIndex !== -1 ? args[roleIndex + 1] : undefined,
        culture: cultureIndex !== -1 ? args[cultureIndex + 1] : undefined,
        notes: notesIndex !== -1 ? args[notesIndex + 1] : undefined,
      });
      break;
    }

    case "check": {
      const name = args[1];
      if (!name || name.startsWith("--")) {
        console.error("Error: Name required. Usage: cast-tracker.ts check \"Name\"");
        Deno.exit(1);
      }
      await cmdCheck(name, castPath);
      break;
    }

    case "list": {
      await cmdList(castPath);
      break;
    }

    case "distribution": {
      await cmdDistribution(castPath);
      break;
    }

    case "suggest": {
      await cmdSuggest(castPath);
      break;
    }

    default: {
      console.error(`Unknown command: ${command}`);
      console.error("Use --help to see available commands");
      Deno.exit(1);
    }
  }
}

main();
