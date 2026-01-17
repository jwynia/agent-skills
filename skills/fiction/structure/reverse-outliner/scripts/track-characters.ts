#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Character Tracking Script
 *
 * Identifies protagonist and major characters, tracks their arcs.
 * Uses patterns from character-arc skill.
 *
 * Usage:
 *   deno run --allow-read scripts/track-characters.ts segments.json book.txt
 *   deno run --allow-read scripts/track-characters.ts segments.json book.txt --output characters.json
 */

// === INTERFACES ===

interface SegmentScene {
  id: string;
  startLine: number;
  endLine: number;
  wordCount: number;
  openingText: string;
  povCandidate: string | null;
}

interface SegmentChapter {
  number: number;
  title: string;
  startLine: number;
  endLine: number;
  wordCount: number;
  scenes: SegmentScene[];
}

interface SegmentationResult {
  title: string;
  totalWords: number;
  chapters: SegmentChapter[];
  metadata: {
    totalChapters: number;
    totalScenes: number;
    avgSceneLength: number;
    segmentedAt: string;
  };
}

interface ArcComponents {
  lie: string | null;
  lieEvidence: string[];
  want: string | null;
  need: string | null;
  ghost: string | null;
  ghostScene: string | null;
  truthAcceptance: string | null;
  transformation: string | null;
}

interface CharacterInfo {
  name: string;
  firstAppearance: string;
  povScenes: number;
  mentions: number;
  arcType: "positive" | "negative" | "flat" | "unclear";
  arcComponents: ArcComponents;
  keyScenes: string[];
  role: string;
}

interface CharacterTrackingResult {
  protagonist: CharacterInfo | null;
  secondaryCharacters: CharacterInfo[];
  characterWeb: Record<string, string>;
  trackedAt: string;
}

// === PATTERNS ===

// Patterns for detecting arc elements
const LIE_PATTERNS = [
  /\b(always believed|never thought|everyone knew|I know that|it's just how|the world is)\b/gi,
  /\b(can't trust|don't need|won't ever|could never)\b/gi,
  /\b(believed that|convinced that|certain that)\b/gi,
];

const WANT_PATTERNS = [
  /\b(wanted nothing more|goal was|dream of|hoped to|wished for)\b/gi,
  /\b(must find|must get|must have|need to)\b/gi,
  /\b(desperate to|determined to|obsessed with)\b/gi,
];

const NEED_PATTERNS = [
  /\b(really needed|actually need|what .+ truly|deep down)\b/gi,
  /\b(connection|trust|acceptance|love|forgiveness)\b/gi,
];

const GHOST_PATTERNS = [
  /\b(remembered|memory|flashback|years ago|back when)\b/gi,
  /\b(never forgot|haunted by|couldn't forget|still remembered)\b/gi,
  /\b(reminded .+ of|took .+ back to)\b/gi,
];

const TRUTH_PATTERNS = [
  /\b(finally understood|realized that|saw clearly|for the first time)\b/gi,
  /\b(had been wrong|changed .+ mind|no longer believed)\b/gi,
  /\b(truth was|saw the truth|understood now)\b/gi,
];

const TRANSFORMATION_PATTERNS = [
  /\b(different person|changed|transformed|no longer the same)\b/gi,
  /\b(let go of|accepted that|embraced)\b/gi,
  /\b(chose to|decided to|committed to)\b/gi,
];

// POV indicators for scoring
const POV_INDICATORS = [
  /\bthought\b/gi,
  /\bfelt\b/gi,
  /\bknew\b/gi,
  /\bwondered\b/gi,
  /\brealized\b/gi,
];

// === UTILITIES ===

function extractSceneText(bookText: string, startLine: number, endLine: number): string {
  const lines = bookText.split("\n");
  return lines.slice(startLine - 1, endLine).join("\n");
}

function countNameMentions(text: string, name: string): number {
  const pattern = new RegExp(`\\b${name}\\b`, "gi");
  const matches = text.match(pattern);
  return matches ? matches.length : 0;
}

function extractProperNouns(text: string): Map<string, number> {
  const names = new Map<string, number>();

  // Match capitalized words that look like names
  const namePattern = /\b([A-Z][a-z]{2,})\b/g;
  let match;

  while ((match = namePattern.exec(text)) !== null) {
    const name = match[1];

    // Filter out common non-name words
    const nonNames = new Set([
      "The", "This", "That", "There", "These", "Those", "When", "Where",
      "What", "Which", "While", "After", "Before", "During", "Through",
      "Chapter", "Part", "One", "Two", "Three", "First", "Second", "Third",
      "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday",
      "January", "February", "March", "April", "May", "June", "July", "August",
      "September", "October", "November", "December",
    ]);

    if (!nonNames.has(name)) {
      names.set(name, (names.get(name) || 0) + 1);
    }
  }

  return names;
}

function findPovScore(text: string, name: string): number {
  let score = 0;

  // Check for "Name thought/felt/knew" patterns
  for (const pattern of POV_INDICATORS) {
    const namePattern = new RegExp(`\\b${name}\\s+${pattern.source}`, "gi");
    const matches = text.match(namePattern);
    if (matches) {
      score += matches.length * 2;
    }
  }

  // Check for "'s thoughts/feelings" patterns
  const possessivePatterns = [
    new RegExp(`\\b${name}'s\\s+(thoughts?|mind|heart|eyes|stomach)`, "gi"),
    new RegExp(`\\b${name}'s\\s+(face|expression|voice)\\s+(showed|revealed|betrayed)`, "gi"),
  ];

  for (const pattern of possessivePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      score += matches.length;
    }
  }

  return score;
}

function findPatternEvidence(text: string, patterns: RegExp[], name: string): string[] {
  const evidence: string[] = [];

  for (const pattern of patterns) {
    // Look for pattern near character name
    const sentences = text.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.includes(name) && pattern.test(sentence)) {
        const cleaned = sentence.trim().substring(0, 100);
        if (cleaned && !evidence.includes(cleaned)) {
          evidence.push(cleaned + (sentence.length > 100 ? "..." : ""));
        }
      }
    }
  }

  return evidence.slice(0, 3);
}

function inferArcType(arcComponents: ArcComponents): "positive" | "negative" | "flat" | "unclear" {
  const hasLie = arcComponents.lie !== null || arcComponents.lieEvidence.length > 0;
  const hasTruth = arcComponents.truthAcceptance !== null;
  const hasTransformation = arcComponents.transformation !== null;

  if (hasLie && hasTruth && hasTransformation) {
    return "positive";
  }

  if (hasLie && !hasTruth) {
    // Could be negative or ongoing
    return "negative";
  }

  if (!hasLie && hasTransformation) {
    return "flat";
  }

  return "unclear";
}

function inferRole(
  isProtagonist: boolean,
  povCount: number,
  mentions: number,
  arcType: string
): string {
  if (isProtagonist) {
    return "Protagonist";
  }

  if (povCount > 5) {
    if (arcType === "flat") {
      return "Mentor figure";
    }
    return "Major viewpoint character";
  }

  if (mentions > 20) {
    return "Supporting character";
  }

  return "Minor character";
}

// === CORE LOGIC ===

function trackCharacters(
  segments: SegmentationResult,
  bookText: string,
  options: {
    protagonistName?: string;
    maxSecondary?: number;
  } = {}
): CharacterTrackingResult {
  const maxSecondary = options.maxSecondary || 5;

  // Extract all proper nouns and count occurrences
  const nameFrequency = extractProperNouns(bookText);

  // Build character candidates with POV scoring
  const candidates: {
    name: string;
    mentions: number;
    povScore: number;
    povScenes: number;
    firstAppearance: string;
    scenes: Set<string>;
  }[] = [];

  // Track POV candidates from segmentation
  const povCounts = new Map<string, number>();
  const firstAppearances = new Map<string, string>();

  for (const chapter of segments.chapters) {
    for (const scene of chapter.scenes) {
      if (scene.povCandidate && scene.povCandidate !== "[First Person]") {
        povCounts.set(scene.povCandidate, (povCounts.get(scene.povCandidate) || 0) + 1);
        if (!firstAppearances.has(scene.povCandidate)) {
          firstAppearances.set(scene.povCandidate, scene.id);
        }
      }
    }
  }

  // Combine frequency data with POV data
  for (const [name, mentions] of nameFrequency.entries()) {
    if (mentions < 5) continue; // Skip rarely mentioned names

    const povScore = findPovScore(bookText, name);
    const povScenes = povCounts.get(name) || 0;

    candidates.push({
      name,
      mentions,
      povScore,
      povScenes,
      firstAppearance: firstAppearances.get(name) || "ch1-s1",
      scenes: new Set<string>(),
    });
  }

  // Sort by combined score (POV weighted heavily)
  candidates.sort((a, b) => {
    const scoreA = a.povScenes * 10 + a.povScore * 2 + a.mentions;
    const scoreB = b.povScenes * 10 + b.povScore * 2 + b.mentions;
    return scoreB - scoreA;
  });

  // Override protagonist if specified
  if (options.protagonistName) {
    const existing = candidates.findIndex(c =>
      c.name.toLowerCase() === options.protagonistName!.toLowerCase()
    );
    if (existing > 0) {
      const [protagonist] = candidates.splice(existing, 1);
      candidates.unshift(protagonist);
    }
  }

  // Analyze protagonist
  let protagonist: CharacterInfo | null = null;
  if (candidates.length > 0) {
    const protag = candidates[0];

    // Find arc components
    const arcComponents: ArcComponents = {
      lie: null,
      lieEvidence: findPatternEvidence(bookText, LIE_PATTERNS, protag.name),
      want: null,
      need: null,
      ghost: null,
      ghostScene: null,
      truthAcceptance: null,
      transformation: null,
    };

    // Extract specific component summaries
    const wantEvidence = findPatternEvidence(bookText, WANT_PATTERNS, protag.name);
    if (wantEvidence.length > 0) {
      arcComponents.want = wantEvidence[0];
    }

    const needEvidence = findPatternEvidence(bookText, NEED_PATTERNS, protag.name);
    if (needEvidence.length > 0) {
      arcComponents.need = needEvidence[0];
    }

    const ghostEvidence = findPatternEvidence(bookText, GHOST_PATTERNS, protag.name);
    if (ghostEvidence.length > 0) {
      arcComponents.ghost = ghostEvidence[0];
    }

    const truthEvidence = findPatternEvidence(bookText, TRUTH_PATTERNS, protag.name);
    if (truthEvidence.length > 0) {
      arcComponents.truthAcceptance = truthEvidence[0];
    }

    const transformEvidence = findPatternEvidence(bookText, TRANSFORMATION_PATTERNS, protag.name);
    if (transformEvidence.length > 0) {
      arcComponents.transformation = transformEvidence[0];
    }

    if (arcComponents.lieEvidence.length > 0) {
      arcComponents.lie = arcComponents.lieEvidence[0];
    }

    // Find key scenes (scenes with significant arc moments)
    const keyScenes: string[] = [];
    for (const chapter of segments.chapters) {
      for (const scene of chapter.scenes) {
        const sceneText = extractSceneText(bookText, scene.startLine, scene.endLine);
        const nameMentions = countNameMentions(sceneText, protag.name);

        // Check if scene has arc-relevant content
        const hasArcContent =
          LIE_PATTERNS.some(p => p.test(sceneText) && sceneText.includes(protag.name)) ||
          TRUTH_PATTERNS.some(p => p.test(sceneText) && sceneText.includes(protag.name)) ||
          TRANSFORMATION_PATTERNS.some(p => p.test(sceneText) && sceneText.includes(protag.name));

        if ((scene.povCandidate === protag.name || nameMentions > 5) && hasArcContent) {
          keyScenes.push(scene.id);
        }
      }
    }

    const arcType = inferArcType(arcComponents);

    protagonist = {
      name: protag.name,
      firstAppearance: protag.firstAppearance,
      povScenes: protag.povScenes,
      mentions: protag.mentions,
      arcType,
      arcComponents,
      keyScenes: keyScenes.slice(0, 10),
      role: "Protagonist",
    };
  }

  // Analyze secondary characters
  const secondaryCharacters: CharacterInfo[] = [];
  for (let i = 1; i < candidates.length && secondaryCharacters.length < maxSecondary; i++) {
    const char = candidates[i];

    const arcComponents: ArcComponents = {
      lie: null,
      lieEvidence: findPatternEvidence(bookText, LIE_PATTERNS, char.name).slice(0, 1),
      want: null,
      need: null,
      ghost: null,
      ghostScene: null,
      truthAcceptance: null,
      transformation: null,
    };

    if (arcComponents.lieEvidence.length > 0) {
      arcComponents.lie = arcComponents.lieEvidence[0];
    }

    const arcType = inferArcType(arcComponents);

    // Find key scenes for this character
    const keyScenes: string[] = [];
    for (const chapter of segments.chapters) {
      for (const scene of chapter.scenes) {
        if (scene.povCandidate === char.name) {
          keyScenes.push(scene.id);
        }
      }
    }

    secondaryCharacters.push({
      name: char.name,
      firstAppearance: char.firstAppearance,
      povScenes: char.povScenes,
      mentions: char.mentions,
      arcType,
      arcComponents,
      keyScenes: keyScenes.slice(0, 5),
      role: inferRole(false, char.povScenes, char.mentions, arcType),
    });
  }

  // Build character web (relationships based on co-occurrence)
  const characterWeb: Record<string, string> = {};

  if (protagonist) {
    for (const secondary of secondaryCharacters) {
      // Simple relationship inference based on context
      const pairKey = `${protagonist.name.toLowerCase()}-${secondary.name.toLowerCase()}`;
      characterWeb[pairKey] = "relationship detected"; // Would need more sophisticated analysis for actual relationship types
    }
  }

  return {
    protagonist,
    secondaryCharacters,
    characterWeb,
    trackedAt: new Date().toISOString(),
  };
}

// === CLI ===

function printHelp(): void {
  console.log(`Character Tracking Script

Usage:
  deno run --allow-read scripts/track-characters.ts <segments.json> <book.txt> [options]

Arguments:
  segments.json      Output from segment-book.ts
  book.txt           Original book text file

Options:
  --output <file>      Write output to JSON file (default: stdout)
  --protagonist <name> Specify protagonist name (overrides detection)
  --max-secondary <n>  Maximum secondary characters to track (default: 5)
  --help, -h           Show this help message

Examples:
  deno run --allow-read track-characters.ts segments.json novel.txt
  deno run --allow-read track-characters.ts segments.json novel.txt --output characters.json
  deno run --allow-read track-characters.ts segments.json novel.txt --protagonist "Sarah Chen"
`);
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length < 2) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  let segmentsFile = "";
  let bookFile = "";
  let outputFile = "";
  let protagonistName = "";
  let maxSecondary = 5;

  const skipIndices = new Set<number>();

  for (let i = 0; i < args.length; i++) {
    if (skipIndices.has(i)) continue;

    if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--protagonist" && args[i + 1]) {
      protagonistName = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--max-secondary" && args[i + 1]) {
      maxSecondary = parseInt(args[i + 1], 10) || 5;
      skipIndices.add(i + 1);
    } else if (!args[i].startsWith("--")) {
      if (!segmentsFile) {
        segmentsFile = args[i];
      } else if (!bookFile) {
        bookFile = args[i];
      }
    }
  }

  if (!segmentsFile || !bookFile) {
    console.error("Error: Both segments.json and book.txt are required");
    Deno.exit(1);
  }

  // Read files
  let segments: SegmentationResult;
  let bookText: string;

  try {
    const segmentsJson = await Deno.readTextFile(segmentsFile);
    segments = JSON.parse(segmentsJson);
  } catch (e) {
    console.error(`Error reading segments file: ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  }

  try {
    bookText = await Deno.readTextFile(bookFile);
  } catch (e) {
    console.error(`Error reading book file: ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  }

  // Track characters
  const result = trackCharacters(segments, bookText, {
    protagonistName: protagonistName || undefined,
    maxSecondary,
  });

  // Output
  const jsonOutput = JSON.stringify(result, null, 2);

  if (outputFile) {
    await Deno.writeTextFile(outputFile, jsonOutput);
    console.log(`Character tracking complete`);
    if (result.protagonist) {
      console.log(`Protagonist: ${result.protagonist.name} (${result.protagonist.arcType} arc, ${result.protagonist.povScenes} POV scenes)`);
    }
    console.log(`Secondary characters: ${result.secondaryCharacters.map(c => c.name).join(", ")}`);
    console.log(`Output written to: ${outputFile}`);
  } else {
    console.log(jsonOutput);
  }
}

main();
