#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Outline Generation Script
 *
 * Synthesizes all analysis JSON files into a structured markdown outline.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/generate-outline.ts [options]
 */

// === INTERFACES ===

// From segment-book.ts
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

// From analyze-scene-batch.ts
interface ElementAnalysis {
  detected: boolean;
  confidence: number;
  indicators: string[];
  summary: string;
}

interface SceneAnalysis {
  id: string;
  chapterNumber: number;
  pov: string | null;
  wordCount: number;
  structure: {
    goal: ElementAnalysis;
    conflict: ElementAnalysis;
    disaster: ElementAnalysis & { type: string };
  };
  sequelElements: {
    reaction: boolean;
    dilemma: boolean;
    decision: boolean;
  };
  sceneSequelRatio: number;
  pacing: "action-heavy" | "balanced" | "reflective";
  function: string;
  issues: string[];
}

interface BatchAnalysisResult {
  title: string;
  analyzedAt: string;
  scenes: SceneAnalysis[];
  summary: {
    totalScenes: number;
    avgConfidence: number;
    pacingDistribution: {
      actionHeavy: number;
      balanced: number;
      reflective: number;
    };
    issuesCount: number;
  };
}

// From detect-genre.ts
interface KeyMoment {
  type: string;
  expectedPosition: number;
  emotionalExperience: string;
  storyFunction: string;
  foundAt: number | null;
  foundScene: string | null;
}

interface GenreDetectionResult {
  primaryGenre: string;
  primaryConfidence: number;
  secondaryGenres: string[];
  evidence: Record<string, { count: number; indicators: string[] }>;
  keyMomentsFramework: string;
  expectedKeyMoments: KeyMoment[];
  detectedAt: string;
}

// From track-characters.ts
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

// === UTILITIES ===

function formatConfidence(confidence: number): string {
  const pct = Math.round(confidence * 100);
  if (pct >= 70) return `${pct}% (high)`;
  if (pct >= 40) return `${pct}% (medium)`;
  return `${pct}% (low)`;
}

function formatPacing(pacing: string): string {
  switch (pacing) {
    case "action-heavy":
      return "Action-heavy (more scene than sequel)";
    case "reflective":
      return "Reflective (more sequel than scene)";
    default:
      return "Balanced";
  }
}

// === GENERATION ===

function generateOutline(
  segments: SegmentationResult,
  scenes: BatchAnalysisResult,
  genre: GenreDetectionResult,
  characters: CharacterTrackingResult,
  depth: "summary" | "standard" | "detailed" = "standard"
): string {
  const lines: string[] = [];
  const today = new Date().toISOString().split("T")[0];

  // === HEADER ===
  lines.push(`# Reverse Outline: ${segments.title}`);
  lines.push("");
  lines.push(`**Generated:** ${today}`);
  lines.push(`**Analysis Depth:** ${depth}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // === OVERVIEW ===
  lines.push("## Overview");
  lines.push("");
  lines.push(`**Genre:** ${genre.primaryGenre} (${Math.round(genre.primaryConfidence * 100)}% confidence)`);
  if (genre.secondaryGenres.length > 0) {
    lines.push(`**Secondary Genres:** ${genre.secondaryGenres.join(", ")}`);
  }
  lines.push(`**Total Words:** ${segments.totalWords.toLocaleString()}`);
  lines.push(`**Chapters:** ${segments.metadata.totalChapters}`);
  lines.push(`**Scenes:** ${segments.metadata.totalScenes}`);
  lines.push(`**Avg Scene Length:** ${segments.metadata.avgSceneLength.toLocaleString()} words`);
  lines.push("");

  // Pacing distribution
  const pacing = scenes.summary.pacingDistribution;
  lines.push("**Pacing Distribution:**");
  lines.push(`- Action-heavy scenes: ${pacing.actionHeavy} (${Math.round(pacing.actionHeavy / scenes.summary.totalScenes * 100)}%)`);
  lines.push(`- Balanced scenes: ${pacing.balanced} (${Math.round(pacing.balanced / scenes.summary.totalScenes * 100)}%)`);
  lines.push(`- Reflective scenes: ${pacing.reflective} (${Math.round(pacing.reflective / scenes.summary.totalScenes * 100)}%)`);
  lines.push("");

  // === KEY MOMENTS MAP ===
  lines.push("## Key Moments Map");
  lines.push("");
  lines.push(`Framework: ${genre.keyMomentsFramework}`);
  lines.push("");
  lines.push("| Key Moment | Expected Position | Emotional Experience | Story Function |");
  lines.push("|------------|-------------------|---------------------|----------------|");

  for (const km of genre.expectedKeyMoments) {
    const expectedPct = Math.round(km.expectedPosition * 100);
    lines.push(`| ${km.type} | ${expectedPct}% | ${km.emotionalExperience} | ${km.storyFunction} |`);
  }
  lines.push("");

  // === CHARACTER ARCS ===
  lines.push("## Character Arcs");
  lines.push("");

  if (characters.protagonist) {
    const p = characters.protagonist;
    lines.push(`### Protagonist: ${p.name}`);
    lines.push("");
    lines.push(`**Arc Type:** ${p.arcType}`);
    lines.push(`**POV Scenes:** ${p.povScenes}`);
    lines.push(`**First Appearance:** ${p.firstAppearance}`);
    lines.push("");

    if (p.arcComponents.lie) {
      lines.push(`**Lie:** ${p.arcComponents.lie}`);
    }
    if (p.arcComponents.want) {
      lines.push(`**Want:** ${p.arcComponents.want}`);
    }
    if (p.arcComponents.need) {
      lines.push(`**Need:** ${p.arcComponents.need}`);
    }
    if (p.arcComponents.ghost) {
      lines.push(`**Ghost/Backstory:** ${p.arcComponents.ghost}`);
    }
    if (p.arcComponents.truthAcceptance) {
      lines.push(`**Truth Acceptance:** ${p.arcComponents.truthAcceptance}`);
    }
    if (p.arcComponents.transformation) {
      lines.push(`**Transformation:** ${p.arcComponents.transformation}`);
    }

    if (p.keyScenes.length > 0) {
      lines.push(`**Key Scenes:** ${p.keyScenes.join(", ")}`);
    }
    lines.push("");
  }

  if (characters.secondaryCharacters.length > 0) {
    lines.push("### Secondary Characters");
    lines.push("");

    for (const c of characters.secondaryCharacters) {
      lines.push(`#### ${c.name}`);
      lines.push(`- **Role:** ${c.role}`);
      lines.push(`- **Arc Type:** ${c.arcType}`);
      lines.push(`- **POV Scenes:** ${c.povScenes}`);
      if (c.keyScenes.length > 0) {
        lines.push(`- **Key Scenes:** ${c.keyScenes.join(", ")}`);
      }
      lines.push("");
    }
  }

  lines.push("---");
  lines.push("");

  // === CHAPTER-BY-CHAPTER BREAKDOWN ===
  lines.push("## Chapter-by-Chapter Breakdown");
  lines.push("");

  // Build scene lookup
  const sceneMap = new Map<string, SceneAnalysis>();
  for (const scene of scenes.scenes) {
    sceneMap.set(scene.id, scene);
  }

  for (const chapter of segments.chapters) {
    lines.push(`### Chapter ${chapter.number}: ${chapter.title}`);
    lines.push("");
    lines.push(`**Word Count:** ${chapter.wordCount.toLocaleString()}`);
    lines.push(`**Scenes:** ${chapter.scenes.length}`);
    lines.push("");

    for (const segScene of chapter.scenes) {
      const analysis = sceneMap.get(segScene.id);

      lines.push(`#### Scene ${segScene.id} | POV: ${segScene.povCandidate || "Unknown"}`);
      lines.push("");

      if (analysis) {
        lines.push(`**Function:** ${analysis.function}`);
        lines.push("");

        if (depth === "detailed" || depth === "standard") {
          lines.push("| Element | Analysis |");
          lines.push("|---------|----------|");
          lines.push(`| Goal | ${analysis.structure.goal.detected ? analysis.structure.goal.summary : "Not detected"} |`);
          lines.push(`| Conflict | ${analysis.structure.conflict.detected ? analysis.structure.conflict.summary : "Not detected"} |`);
          lines.push(`| Disaster | ${analysis.structure.disaster.detected ? `${analysis.structure.disaster.type}: ${analysis.structure.disaster.summary}` : "Not detected"} |`);

          const sequelParts = [];
          if (analysis.sequelElements.reaction) sequelParts.push("Reaction");
          if (analysis.sequelElements.dilemma) sequelParts.push("Dilemma");
          if (analysis.sequelElements.decision) sequelParts.push("Decision");
          lines.push(`| Sequel | ${sequelParts.length > 0 ? sequelParts.join(", ") : "None detected"} |`);
          lines.push("");
        }

        lines.push(`**Pacing:** ${formatPacing(analysis.pacing)}`);
        lines.push(`**Words:** ${analysis.wordCount.toLocaleString()}`);

        if (depth === "detailed" && analysis.issues.length > 0) {
          lines.push("");
          lines.push("**Issues:**");
          for (const issue of analysis.issues) {
            lines.push(`- ${issue}`);
          }
        }
      } else {
        lines.push(`**Opening:** ${segScene.openingText}`);
        lines.push(`**Words:** ${segScene.wordCount.toLocaleString()}`);
      }

      lines.push("");
      lines.push("---");
      lines.push("");
    }
  }

  // === APPENDIX A: SCENE INDEX BY FUNCTION ===
  lines.push("## Appendix A: Scene Index by Function");
  lines.push("");

  // Group scenes by structural function
  const functionGroups = new Map<string, string[]>();
  for (const scene of scenes.scenes) {
    const funcKey = scene.function.split(" - ")[0]; // Get main function
    if (!functionGroups.has(funcKey)) {
      functionGroups.set(funcKey, []);
    }
    functionGroups.get(funcKey)!.push(scene.id);
  }

  lines.push("| Function | Scenes |");
  lines.push("|----------|--------|");

  const functionOrder = [
    "Opening scene",
    "Setup",
    "Inciting incident",
    "First plot point",
    "Rising action",
    "Midpoint",
    "Complications",
    "Dark night",
    "Climax",
    "Resolution",
  ];

  for (const func of functionOrder) {
    const matching = Array.from(functionGroups.entries())
      .filter(([key]) => key.toLowerCase().includes(func.toLowerCase()));
    for (const [key, sceneIds] of matching) {
      lines.push(`| ${key} | ${sceneIds.join(", ")} |`);
    }
  }

  // Add any functions not in the standard order
  for (const [func, sceneIds] of functionGroups.entries()) {
    const isStandard = functionOrder.some(f => func.toLowerCase().includes(f.toLowerCase()));
    if (!isStandard) {
      lines.push(`| ${func} | ${sceneIds.join(", ")} |`);
    }
  }
  lines.push("");

  // === APPENDIX B: CHARACTER SCENE TRACKER ===
  lines.push("## Appendix B: Character Scene Tracker");
  lines.push("");
  lines.push("| Character | POV Scenes | Arc Type | Key Scenes |");
  lines.push("|-----------|------------|----------|------------|");

  if (characters.protagonist) {
    const p = characters.protagonist;
    lines.push(`| **${p.name}** (protagonist) | ${p.povScenes} | ${p.arcType} | ${p.keyScenes.slice(0, 5).join(", ")} |`);
  }

  for (const c of characters.secondaryCharacters) {
    lines.push(`| ${c.name} | ${c.povScenes} | ${c.arcType} | ${c.keyScenes.slice(0, 3).join(", ")} |`);
  }
  lines.push("");

  // === APPENDIX C: PACING ANALYSIS ===
  if (depth === "detailed") {
    lines.push("## Appendix C: Pacing Analysis");
    lines.push("");
    lines.push("Scene-by-scene pacing showing scene/sequel ratio:");
    lines.push("");

    for (const scene of scenes.scenes) {
      const bar = "=".repeat(Math.round(scene.sceneSequelRatio * 20));
      const space = " ".repeat(20 - bar.length);
      lines.push(`${scene.id}: [${bar}${space}] ${Math.round(scene.sceneSequelRatio * 100)}% scene`);
    }
    lines.push("");
  }

  // === FOOTER ===
  lines.push("---");
  lines.push("");
  lines.push("*Generated by reverse-outliner skill*");

  return lines.join("\n");
}

// === CLI ===

function printHelp(): void {
  console.log(`Outline Generation Script

Usage:
  deno run --allow-read --allow-write scripts/generate-outline.ts [options]

Required Options:
  --segments <file>    Segments JSON from segment-book.ts
  --scenes <file>      Scene analysis JSON from analyze-scene-batch.ts
  --genre <file>       Genre detection JSON from detect-genre.ts
  --characters <file>  Character tracking JSON from track-characters.ts

Other Options:
  --output <file>      Output markdown file (default: stdout)
  --depth <level>      Output depth: summary, standard, detailed (default: standard)
  --help, -h           Show this help message

Examples:
  deno run --allow-read --allow-write generate-outline.ts \\
    --segments analysis/segments.json \\
    --scenes analysis/scenes.json \\
    --genre analysis/genre.json \\
    --characters analysis/characters.json \\
    --output outline.md
`);
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  let segmentsFile = "";
  let scenesFile = "";
  let genreFile = "";
  let charactersFile = "";
  let outputFile = "";
  let depth: "summary" | "standard" | "detailed" = "standard";

  const skipIndices = new Set<number>();

  for (let i = 0; i < args.length; i++) {
    if (skipIndices.has(i)) continue;

    if (args[i] === "--segments" && args[i + 1]) {
      segmentsFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--scenes" && args[i + 1]) {
      scenesFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--genre" && args[i + 1]) {
      genreFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--characters" && args[i + 1]) {
      charactersFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--depth" && args[i + 1]) {
      const d = args[i + 1];
      if (d === "summary" || d === "standard" || d === "detailed") {
        depth = d;
      }
      skipIndices.add(i + 1);
    }
  }

  // Validate required files
  if (!segmentsFile || !scenesFile || !genreFile || !charactersFile) {
    console.error("Error: All four input files are required (--segments, --scenes, --genre, --characters)");
    printHelp();
    Deno.exit(1);
  }

  // Read all input files
  let segments: SegmentationResult;
  let scenes: BatchAnalysisResult;
  let genre: GenreDetectionResult;
  let characters: CharacterTrackingResult;

  try {
    segments = JSON.parse(await Deno.readTextFile(segmentsFile));
    scenes = JSON.parse(await Deno.readTextFile(scenesFile));
    genre = JSON.parse(await Deno.readTextFile(genreFile));
    characters = JSON.parse(await Deno.readTextFile(charactersFile));
  } catch (e) {
    console.error(`Error reading input files: ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  }

  // Generate outline
  const outline = generateOutline(segments, scenes, genre, characters, depth);

  // Output
  if (outputFile) {
    await Deno.writeTextFile(outputFile, outline);
    console.log(`Outline generated: ${outputFile}`);
    console.log(`Title: ${segments.title}`);
    console.log(`Depth: ${depth}`);
  } else {
    console.log(outline);
  }
}

main();
