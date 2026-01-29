#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Batch Scene Structure Analyzer
 *
 * Applies scene-sequencing analysis (Goal/Conflict/Disaster) to all scenes
 * in a segmented book. Builds on patterns from scene-sequencing skill.
 *
 * Usage:
 *   deno run --allow-read scripts/analyze-scene-batch.ts segments.json book.txt
 *   deno run --allow-read scripts/analyze-scene-batch.ts segments.json book.txt --output scenes.json
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

// === PATTERNS (from scene-sequencing skill) ===

const GOAL_PATTERNS = [
  /\b(want|wanted|wants|need|needed|needs|must|had to|have to|trying to|attempted to|goal|objective|mission)\b/gi,
  /\b(determined to|resolved to|set out to|aimed to|intended to)\b/gi,
  /\b(find|get|reach|escape|stop|save|discover|learn|prove)\b/gi,
];

const CONFLICT_PATTERNS = [
  /\b(but|however|although|despite|yet|still|unfortunately)\b/gi,
  /\b(blocked|stopped|prevented|refused|denied|resisted|fought|struggled)\b/gi,
  /\b(problem|obstacle|challenge|difficulty|trouble|threat|danger)\b/gi,
  /\b(against|versus|confronted|opposed|clashed)\b/gi,
];

const DISASTER_PATTERNS = [
  /\b(failed|lost|fell|collapsed|shattered|ruined|destroyed)\b/gi,
  /\b(worse|terrible|horrible|devastating|catastrophic)\b/gi,
  /\b(trapped|caught|discovered|exposed|betrayed)\b/gi,
  /\b(too late|no way|impossible|hopeless)\b/gi,
  /\b(and then|but then|suddenly|without warning)\b/gi,
];

const REACTION_PATTERNS = [
  /\b(felt|feeling|emotion|heart|stomach|chest|tears)\b/gi,
  /\b(shock|horror|despair|grief|anger|fear|relief)\b/gi,
  /\b(couldn't believe|couldn't think|mind raced|thoughts)\b/gi,
  /\b(sat|stood|stared|gazed|looked)\s+(there|still|frozen|numb)/gi,
];

const DILEMMA_PATTERNS = [
  /\b(choice|decision|option|alternative|either|or)\b/gi,
  /\b(could|should|might|what if|if only)\b/gi,
  /\b(on one hand|on the other|weighing|considering)\b/gi,
  /\b(no good options|impossible choice|between)\b/gi,
];

const DECISION_PATTERNS = [
  /\b(decided|decision|chose|choice|resolved|determined)\b/gi,
  /\b(would|going to|had to|must|will)\b/gi,
  /\b(plan|strategy|next step|only way|one thing)\b/gi,
  /\b(stood up|got up|turned|headed|set off|began)\b/gi,
];

// Disaster type patterns
const DISASTER_TYPE_PATTERNS = {
  "yes-but": [/\byes,?\s*but\b/i, /\bsucceeded,?\s*but\b/i, /\bgot\s+it,?\s*but\b/i],
  "no": [/\bfailed\b/i, /\bcouldn't\b/i, /\bdidn't\b/i, /\bwasn't able\b/i],
  "no-and-furthermore": [/\bnot only.+but also\b/i, /\bworse,?\s*\b/i, /\band then.+also\b/i, /\bon top of that\b/i],
};

// === UTILITIES ===

function countMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found.slice(0, 3));
    }
  }
  return [...new Set(matches)].slice(0, 5);
}

function calculateConfidence(indicators: string[], text: string): number {
  if (indicators.length === 0) return 0;
  const wordCount = text.split(/\s+/).length;
  // More indicators relative to length = higher confidence
  const density = indicators.length / (wordCount / 100);
  return Math.min(1, density * 0.3 + (indicators.length > 2 ? 0.4 : 0.2));
}

function detectDisasterType(text: string): string {
  for (const [type, patterns] of Object.entries(DISASTER_TYPE_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return type;
      }
    }
  }
  return "unclear";
}

function inferFunction(
  sceneIndex: number,
  totalScenes: number,
  analysis: SceneAnalysis
): string {
  const position = sceneIndex / totalScenes;

  // Opening scenes
  if (sceneIndex === 0) {
    return "Opening scene - establishes status quo and character";
  }

  // First 10% - setup
  if (position < 0.10) {
    return "Setup - introducing world and characters";
  }

  // Around 12% - inciting incident
  if (position >= 0.10 && position <= 0.15) {
    if (analysis.structure.disaster.detected) {
      return "Inciting incident - story catalyst";
    }
  }

  // First plot point area (20-25%)
  if (position >= 0.20 && position <= 0.25) {
    if (analysis.structure.goal.confidence > 0.6) {
      return "First plot point - protagonist commits";
    }
  }

  // Rising action (25-45%)
  if (position > 0.25 && position < 0.45) {
    return "Rising action - escalating conflict";
  }

  // Midpoint area (45-55%)
  if (position >= 0.45 && position <= 0.55) {
    if (analysis.structure.conflict.confidence > 0.7) {
      return "Midpoint - mirror moment or major revelation";
    }
  }

  // Complications (55-75%)
  if (position > 0.55 && position < 0.75) {
    return "Complications - stakes raise, options narrow";
  }

  // Dark night (75-85%)
  if (position >= 0.75 && position <= 0.85) {
    if (analysis.pacing === "reflective" || analysis.sequelElements.dilemma) {
      return "Dark night - lowest point, crisis";
    }
  }

  // Climax (85-95%)
  if (position >= 0.85 && position <= 0.95) {
    if (analysis.pacing === "action-heavy") {
      return "Climax - final confrontation";
    }
  }

  // Resolution (95%+)
  if (position > 0.95) {
    return "Resolution - new equilibrium established";
  }

  // Default based on pacing
  if (analysis.pacing === "action-heavy") {
    return "Action scene - conflict-driven";
  } else if (analysis.pacing === "reflective") {
    return "Sequel scene - reaction and planning";
  }

  return "Development scene - advancing plot/character";
}

function generateSummary(indicators: string[], elementType: string): string {
  if (indicators.length === 0) {
    return `No clear ${elementType} detected`;
  }
  return `${elementType.charAt(0).toUpperCase() + elementType.slice(1)} indicators: ${indicators.slice(0, 3).join(", ")}`;
}

// === CORE LOGIC ===

function analyzeScene(
  sceneId: string,
  chapterNumber: number,
  text: string,
  pov: string | null,
  sceneIndex: number,
  totalScenes: number
): SceneAnalysis {
  const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;

  // Detect elements
  const goalIndicators = countMatches(text, GOAL_PATTERNS);
  const conflictIndicators = countMatches(text, CONFLICT_PATTERNS);
  const disasterIndicators = countMatches(text, DISASTER_PATTERNS);
  const reactionIndicators = countMatches(text, REACTION_PATTERNS);
  const dilemmaIndicators = countMatches(text, DILEMMA_PATTERNS);
  const decisionIndicators = countMatches(text, DECISION_PATTERNS);

  // Calculate scene vs sequel ratio
  const sceneScore = goalIndicators.length + conflictIndicators.length + disasterIndicators.length;
  const sequelScore = reactionIndicators.length + dilemmaIndicators.length + decisionIndicators.length;
  const totalScore = sceneScore + sequelScore || 1;
  const sceneRatio = sceneScore / totalScore;

  // Determine pacing
  let pacing: "action-heavy" | "balanced" | "reflective";
  if (sceneRatio > 0.65) {
    pacing = "action-heavy";
  } else if (sceneRatio < 0.35) {
    pacing = "reflective";
  } else {
    pacing = "balanced";
  }

  // Build analysis
  const analysis: SceneAnalysis = {
    id: sceneId,
    chapterNumber,
    pov,
    wordCount,
    structure: {
      goal: {
        detected: goalIndicators.length > 0,
        confidence: calculateConfidence(goalIndicators, text),
        indicators: goalIndicators,
        summary: generateSummary(goalIndicators, "goal"),
      },
      conflict: {
        detected: conflictIndicators.length > 0,
        confidence: calculateConfidence(conflictIndicators, text),
        indicators: conflictIndicators,
        summary: generateSummary(conflictIndicators, "conflict"),
      },
      disaster: {
        detected: disasterIndicators.length > 0,
        confidence: calculateConfidence(disasterIndicators, text),
        indicators: disasterIndicators,
        summary: generateSummary(disasterIndicators, "disaster"),
        type: detectDisasterType(text),
      },
    },
    sequelElements: {
      reaction: reactionIndicators.length > 0,
      dilemma: dilemmaIndicators.length > 0,
      decision: decisionIndicators.length > 0,
    },
    sceneSequelRatio: Math.round(sceneRatio * 100) / 100,
    pacing,
    function: "", // Will be set below
    issues: [],
  };

  // Infer function based on position and analysis
  analysis.function = inferFunction(sceneIndex, totalScenes, analysis);

  // Detect issues
  if (!analysis.structure.goal.detected) {
    analysis.issues.push("No clear goal detected in scene opening");
  }
  if (!analysis.structure.conflict.detected) {
    analysis.issues.push("No conflict indicators detected");
  }
  if (!analysis.structure.disaster.detected && sceneScore > 0) {
    analysis.issues.push("Scene may end without clear disaster/outcome");
  }
  if (sceneRatio > 0.85) {
    analysis.issues.push("Very action-heavy - minimal reflection time");
  }
  if (sceneRatio < 0.15 && wordCount > 500) {
    analysis.issues.push("Extended reflection without action");
  }

  return analysis;
}

function extractSceneText(
  bookText: string,
  startLine: number,
  endLine: number
): string {
  const lines = bookText.split("\n");
  // Convert 1-based line numbers to 0-based indices
  return lines.slice(startLine - 1, endLine).join("\n");
}

async function analyzeAllScenes(
  segments: SegmentationResult,
  bookText: string
): Promise<BatchAnalysisResult> {
  const scenes: SceneAnalysis[] = [];

  // Count total scenes for position calculation
  let totalScenes = 0;
  for (const chapter of segments.chapters) {
    totalScenes += chapter.scenes.length;
  }

  let sceneIndex = 0;

  for (const chapter of segments.chapters) {
    for (const scene of chapter.scenes) {
      const sceneText = extractSceneText(bookText, scene.startLine, scene.endLine);
      const analysis = analyzeScene(
        scene.id,
        chapter.number,
        sceneText,
        scene.povCandidate,
        sceneIndex,
        totalScenes
      );
      scenes.push(analysis);
      sceneIndex++;
    }
  }

  // Calculate summary statistics
  const avgConfidence = scenes.reduce((sum, s) =>
    sum + (s.structure.goal.confidence + s.structure.conflict.confidence + s.structure.disaster.confidence) / 3,
    0
  ) / scenes.length;

  const pacingDistribution = {
    actionHeavy: scenes.filter(s => s.pacing === "action-heavy").length,
    balanced: scenes.filter(s => s.pacing === "balanced").length,
    reflective: scenes.filter(s => s.pacing === "reflective").length,
  };

  const issuesCount = scenes.reduce((sum, s) => sum + s.issues.length, 0);

  return {
    title: segments.title,
    analyzedAt: new Date().toISOString(),
    scenes,
    summary: {
      totalScenes: scenes.length,
      avgConfidence: Math.round(avgConfidence * 100) / 100,
      pacingDistribution,
      issuesCount,
    },
  };
}

// === CLI ===

function printHelp(): void {
  console.log(`Batch Scene Structure Analyzer

Usage:
  deno run --allow-read scripts/analyze-scene-batch.ts <segments.json> <book.txt> [options]

Arguments:
  segments.json    Output from segment-book.ts
  book.txt         Original book text file

Options:
  --output <file>  Write output to JSON file (default: stdout)
  --depth <level>  Analysis depth: quick, standard, detailed (default: standard)
  --help, -h       Show this help message

Examples:
  deno run --allow-read analyze-scene-batch.ts segments.json novel.txt
  deno run --allow-read analyze-scene-batch.ts segments.json novel.txt --output scenes.json
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

  const skipIndices = new Set<number>();

  for (let i = 0; i < args.length; i++) {
    if (skipIndices.has(i)) continue;

    if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--depth" && args[i + 1]) {
      // depth is captured but not used differently in this version
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

  // Analyze all scenes
  const result = await analyzeAllScenes(segments, bookText);

  // Output
  const jsonOutput = JSON.stringify(result, null, 2);

  if (outputFile) {
    await Deno.writeTextFile(outputFile, jsonOutput);
    console.log(`Analysis complete: ${result.summary.totalScenes} scenes analyzed`);
    console.log(`Average confidence: ${result.summary.avgConfidence}`);
    console.log(`Pacing: ${result.summary.pacingDistribution.actionHeavy} action-heavy, ${result.summary.pacingDistribution.balanced} balanced, ${result.summary.pacingDistribution.reflective} reflective`);
    console.log(`Output written to: ${outputFile}`);
  } else {
    console.log(jsonOutput);
  }
}

main();
