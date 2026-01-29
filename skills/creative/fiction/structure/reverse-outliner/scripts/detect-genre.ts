#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Genre Detection Script
 *
 * Identifies primary and secondary elemental genres from text patterns.
 * Maps detected genre to Key Moments framework.
 *
 * Usage:
 *   deno run --allow-read scripts/detect-genre.ts book.txt
 *   deno run --allow-read scripts/detect-genre.ts book.txt --output genre.json
 */

// === INTERFACES ===

interface GenreEvidence {
  count: number;
  indicators: string[];
}

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
  evidence: Record<string, GenreEvidence>;
  keyMomentsFramework: string;
  expectedKeyMoments: KeyMoment[];
  detectedAt: string;
}

// === GENRE PATTERNS ===

// Pattern sets for each elemental genre
const GENRE_PATTERNS: Record<string, RegExp[]> = {
  wonder: [
    /\b(awe|wonder|amazed|astonished|breathtaking|magnificent|spectacular)\b/gi,
    /\b(vast|immense|infinite|boundless|cosmic|universe|stars)\b/gi,
    /\b(discover|revelation|realize|understand|truth|secret)\b/gi,
    /\b(impossible|unbelievable|unprecedented|never before)\b/gi,
    /\b(transcend|transform|enlighten|illuminate)\b/gi,
  ],

  mystery: [
    /\b(clue|evidence|investigate|detective|suspect|witness)\b/gi,
    /\b(murder|crime|victim|alibi|motive)\b/gi,
    /\b(puzzle|riddle|mystery|enigma|secret)\b/gi,
    /\b(uncover|reveal|discover|deduce|solve)\b/gi,
    /\b(who|what|why|how)\s+(?:did|was|could|would)\b/gi,
  ],

  adventure: [
    /\b(journey|quest|expedition|voyage|trek|travel)\b/gi,
    /\b(treasure|map|compass|destination|horizon)\b/gi,
    /\b(danger|peril|risk|hazard|obstacle)\b/gi,
    /\b(survive|escape|rescue|explore|discover)\b/gi,
    /\b(supplies|equipment|provisions|camp|wilderness)\b/gi,
  ],

  horror: [
    /\b(terror|horror|dread|fear|nightmare|scream)\b/gi,
    /\b(dark|shadow|darkness|black|sinister)\b/gi,
    /\b(monster|creature|beast|demon|evil)\b/gi,
    /\b(dead|death|corpse|grave|blood)\b/gi,
    /\b(haunted|cursed|possessed|supernatural)\b/gi,
  ],

  thriller: [
    /\b(bomb|deadline|countdown|ticking|timer)\b/gi,
    /\b(chase|pursue|hunt|escape|run)\b/gi,
    /\b(danger|threat|risk|stakes|life|death)\b/gi,
    /\b(spy|agent|mission|operation|target)\b/gi,
    /\b(tension|suspense|urgent|critical|time)\b/gi,
  ],

  relationship: [
    /\b(love|heart|feelings|emotion|romance)\b/gi,
    /\b(kiss|embrace|touch|together|apart)\b/gi,
    /\b(relationship|connection|bond|trust)\b/gi,
    /\b(marry|wedding|proposal|date|romantic)\b/gi,
    /\b(attraction|desire|longing|yearning)\b/gi,
  ],

  drama: [
    /\b(choice|decision|dilemma|consequence|regret)\b/gi,
    /\b(family|father|mother|son|daughter|brother|sister)\b/gi,
    /\b(guilt|shame|pride|honor|dignity)\b/gi,
    /\b(sacrifice|forgive|betray|loyalty)\b/gi,
    /\b(past|memory|secret|truth|lie)\b/gi,
  ],

  issue: [
    /\b(justice|injustice|rights|freedom|oppression)\b/gi,
    /\b(society|system|government|power|authority)\b/gi,
    /\b(debate|argue|believe|opinion|perspective)\b/gi,
    /\b(moral|ethical|right|wrong|fair)\b/gi,
    /\b(change|reform|revolution|protest)\b/gi,
  ],

  ensemble: [
    /\b(team|group|crew|squad|party)\b/gi,
    /\b(together|cooperation|unity|alliance)\b/gi,
    /\b(leader|member|role|contribution)\b/gi,
    /\b(trust|loyalty|betrayal|sacrifice)\b/gi,
    /\b(diverse|different|unique|each)\b/gi,
  ],

  humor: [
    /\b(laugh|funny|hilarious|absurd|ridiculous)\b/gi,
    /\b(joke|comedy|wit|sarcasm|irony)\b/gi,
    /\b(embarrass|awkward|mishap|disaster)\b/gi,
    /\b(mock|tease|prank|gag)\b/gi,
    /\b(silly|goofy|zany|wacky)\b/gi,
  ],

  idea: [
    /\b(theory|hypothesis|concept|principle|law)\b/gi,
    /\b(science|technology|experiment|research)\b/gi,
    /\b(future|evolution|progress|advancement)\b/gi,
    /\b(what if|imagine|suppose|consider)\b/gi,
    /\b(implication|consequence|effect|impact)\b/gi,
  ],
};

// Key Moments templates by genre
const KEY_MOMENTS: Record<string, Omit<KeyMoment, "foundAt" | "foundScene">[]> = {
  wonder: [
    { type: "Initial Encounter", expectedPosition: 0.15, emotionalExperience: "Surprise and awe", storyFunction: "Establishes the spectacular" },
    { type: "Scale Revelation", expectedPosition: 0.35, emotionalExperience: "Humbling realization", storyFunction: "Contextualizes protagonist's place" },
    { type: "Wonder Escalation", expectedPosition: 0.60, emotionalExperience: "Intensification of awe", storyFunction: "Raises stakes and deepens engagement" },
    { type: "Perspective Shift", expectedPosition: 0.75, emotionalExperience: "Paradigm change", storyFunction: "Forces reevaluation" },
    { type: "Transcendent Integration", expectedPosition: 0.90, emotionalExperience: "Meaning-making", storyFunction: "Provides thematic resolution" },
  ],

  mystery: [
    { type: "Question Inception", expectedPosition: 0.10, emotionalExperience: "Curiosity activation", storyFunction: "Establishes the puzzle" },
    { type: "Pattern Recognition", expectedPosition: 0.35, emotionalExperience: "Satisfaction of connection", storyFunction: "Provides momentum" },
    { type: "False Resolution", expectedPosition: 0.55, emotionalExperience: "Surprise from misdirection", storyFunction: "Creates complexity" },
    { type: "Progressive Revelation", expectedPosition: 0.75, emotionalExperience: "Deepening understanding", storyFunction: "Builds toward solution" },
    { type: "Solution Crystallization", expectedPosition: 0.90, emotionalExperience: "Illumination and closure", storyFunction: "Completes emotional journey" },
  ],

  adventure: [
    { type: "Threshold Crossing", expectedPosition: 0.15, emotionalExperience: "Excitement of departure", storyFunction: "Transitions to adventure world" },
    { type: "Capability Test", expectedPosition: 0.30, emotionalExperience: "Confidence from competence", storyFunction: "Establishes abilities" },
    { type: "Resource Depletion", expectedPosition: 0.50, emotionalExperience: "Vulnerability from loss", storyFunction: "Forces adaptation" },
    { type: "Ultimate Challenge", expectedPosition: 0.80, emotionalExperience: "Fear and determination", storyFunction: "Tests protagonist's limits" },
    { type: "Return Transformation", expectedPosition: 0.95, emotionalExperience: "Pride and perspective", storyFunction: "Demonstrates growth" },
  ],

  horror: [
    { type: "Wrongness Glimpse", expectedPosition: 0.10, emotionalExperience: "Unease from dissonance", storyFunction: "Establishes threat potential" },
    { type: "Safety Violation", expectedPosition: 0.30, emotionalExperience: "Shock from boundary breach", storyFunction: "Demonstrates vulnerability" },
    { type: "Threat Escalation", expectedPosition: 0.50, emotionalExperience: "Escalating dread", storyFunction: "Raises stakes" },
    { type: "Failed Solution", expectedPosition: 0.70, emotionalExperience: "Despair from ineffectuality", storyFunction: "Deepens hopelessness" },
    { type: "Confrontation", expectedPosition: 0.90, emotionalExperience: "Terror meets courage", storyFunction: "Provides climactic moment" },
  ],

  thriller: [
    { type: "Stakes Establishment", expectedPosition: 0.15, emotionalExperience: "Concern for outcome", storyFunction: "Sets up tension framework" },
    { type: "Deadline Imposition", expectedPosition: 0.25, emotionalExperience: "Anxiety from time pressure", storyFunction: "Creates urgency" },
    { type: "Near Miss", expectedPosition: 0.50, emotionalExperience: "Relief with lingering tension", storyFunction: "Maintains engagement" },
    { type: "Option Elimination", expectedPosition: 0.75, emotionalExperience: "Mounting pressure", storyFunction: "Forces harder choices" },
    { type: "Decision Under Duress", expectedPosition: 0.90, emotionalExperience: "Catharsis through action", storyFunction: "Provides climactic release" },
  ],

  relationship: [
    { type: "Significant Connection", expectedPosition: 0.10, emotionalExperience: "Recognition of potential", storyFunction: "Establishes relationship basis" },
    { type: "Intimacy Deepening", expectedPosition: 0.35, emotionalExperience: "Warmth from vulnerability", storyFunction: "Develops investment" },
    { type: "Value Conflict", expectedPosition: 0.55, emotionalExperience: "Frustration from differences", storyFunction: "Creates meaningful obstacles" },
    { type: "Relationship Crisis", expectedPosition: 0.75, emotionalExperience: "Heartbreak or betrayal", storyFunction: "Tests connection's resilience" },
    { type: "Reconciliation/Resolution", expectedPosition: 0.90, emotionalExperience: "Emotional closure", storyFunction: "Completes relationship arc" },
  ],

  drama: [
    { type: "Internal Conflict Revelation", expectedPosition: 0.15, emotionalExperience: "Recognition of contradiction", storyFunction: "Establishes character struggle" },
    { type: "External Pressure Point", expectedPosition: 0.35, emotionalExperience: "Stress from circumstances", storyFunction: "Forces character choices" },
    { type: "Failure Moment", expectedPosition: 0.55, emotionalExperience: "Shame from inadequacy", storyFunction: "Deepens character journey" },
    { type: "Truth Confrontation", expectedPosition: 0.75, emotionalExperience: "Painful self-awareness", storyFunction: "Catalyzes change" },
    { type: "Character Evolution", expectedPosition: 0.90, emotionalExperience: "Self-actualization", storyFunction: "Demonstrates growth" },
  ],

  issue: [
    { type: "Perspective Challenge", expectedPosition: 0.15, emotionalExperience: "Intellectual discomfort", storyFunction: "Establishes complexity" },
    { type: "Stake Personalization", expectedPosition: 0.30, emotionalExperience: "Emotional investment", storyFunction: "Makes abstract concrete" },
    { type: "Complexity Recognition", expectedPosition: 0.50, emotionalExperience: "Cognitive expansion", storyFunction: "Prevents simplistic resolution" },
    { type: "Position Testing", expectedPosition: 0.70, emotionalExperience: "Value examination", storyFunction: "Forces intellectual honesty" },
    { type: "Perspective Integration", expectedPosition: 0.90, emotionalExperience: "Nuanced understanding", storyFunction: "Provides thematic resolution" },
  ],

  ensemble: [
    { type: "Group Formation", expectedPosition: 0.15, emotionalExperience: "Belonging potential", storyFunction: "Establishes the collective" },
    { type: "Role Establishment", expectedPosition: 0.30, emotionalExperience: "Identity within community", storyFunction: "Defines character functions" },
    { type: "Group Fracture", expectedPosition: 0.55, emotionalExperience: "Loyalty testing", storyFunction: "Creates internal conflict" },
    { type: "Collective Challenge", expectedPosition: 0.75, emotionalExperience: "Shared adversity", storyFunction: "Forces cooperation" },
    { type: "Synergy Moment", expectedPosition: 0.90, emotionalExperience: "Strength through unity", storyFunction: "Demonstrates group value" },
  ],

  humor: [
    { type: "Setup Establishment", expectedPosition: 0.10, emotionalExperience: "Anticipation", storyFunction: "Creates comedic potential" },
    { type: "Incongruity Introduction", expectedPosition: 0.25, emotionalExperience: "Surprise amusement", storyFunction: "Establishes comedic logic" },
    { type: "Escalation Sequence", expectedPosition: 0.50, emotionalExperience: "Mounting absurdity", storyFunction: "Builds comedic momentum" },
    { type: "Subversion Peak", expectedPosition: 0.75, emotionalExperience: "Maximum comedic release", storyFunction: "Delivers primary payoff" },
    { type: "Resolution Callback", expectedPosition: 0.90, emotionalExperience: "Satisfying closure", storyFunction: "Ties comedic threads" },
  ],

  idea: [
    { type: "Concept Introduction", expectedPosition: 0.10, emotionalExperience: "Intellectual curiosity", storyFunction: "Establishes central idea" },
    { type: "Implication Exploration", expectedPosition: 0.30, emotionalExperience: "Fascination with consequences", storyFunction: "Expands idea's scope" },
    { type: "Edge Case Discovery", expectedPosition: 0.50, emotionalExperience: "Surprise from complexity", storyFunction: "Deepens understanding" },
    { type: "Idea Testing", expectedPosition: 0.70, emotionalExperience: "Tension from stakes", storyFunction: "Makes abstract personal" },
    { type: "Synthesis Resolution", expectedPosition: 0.90, emotionalExperience: "Intellectual satisfaction", storyFunction: "Completes thought experiment" },
  ],
};

// === UTILITIES ===

function countPatternMatches(text: string, patterns: RegExp[]): { count: number; indicators: string[] } {
  const indicators: string[] = [];
  let totalCount = 0;

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches) {
      totalCount += matches.length;
      indicators.push(...matches.slice(0, 3));
    }
  }

  return {
    count: totalCount,
    indicators: [...new Set(indicators)].slice(0, 10),
  };
}

function sampleText(text: string, sampleSize: number = 10): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 100);

  if (paragraphs.length <= sampleSize) {
    return paragraphs;
  }

  // Sample from beginning, middle, and end
  const samples: string[] = [];
  const thirdSize = Math.floor(sampleSize / 3);

  // Beginning
  for (let i = 0; i < thirdSize && i < paragraphs.length; i++) {
    samples.push(paragraphs[i]);
  }

  // Middle
  const middleStart = Math.floor(paragraphs.length / 2) - Math.floor(thirdSize / 2);
  for (let i = middleStart; i < middleStart + thirdSize && i < paragraphs.length; i++) {
    if (!samples.includes(paragraphs[i])) {
      samples.push(paragraphs[i]);
    }
  }

  // End
  const endStart = paragraphs.length - thirdSize;
  for (let i = endStart; i < paragraphs.length; i++) {
    if (!samples.includes(paragraphs[i])) {
      samples.push(paragraphs[i]);
    }
  }

  return samples;
}

// === CORE LOGIC ===

function detectGenre(text: string, sampleSize: number = 10): GenreDetectionResult {
  // Sample text to analyze
  const samples = sampleText(text, sampleSize);
  const sampledText = samples.join("\n\n");

  // Count matches for each genre
  const evidence: Record<string, GenreEvidence> = {};
  const scores: { genre: string; score: number }[] = [];

  for (const [genre, patterns] of Object.entries(GENRE_PATTERNS)) {
    const result = countPatternMatches(sampledText, patterns);
    evidence[genre] = {
      count: result.count,
      indicators: result.indicators,
    };
    scores.push({ genre, score: result.count });
  }

  // Sort by score
  scores.sort((a, b) => b.score - a.score);

  // Calculate confidence based on how much higher primary is than others
  const totalScore = scores.reduce((sum, s) => sum + s.score, 0) || 1;
  const primaryScore = scores[0]?.score || 0;
  const primaryConfidence = Math.min(1, (primaryScore / totalScore) + (primaryScore > 10 ? 0.2 : 0));

  // Get secondary genres (those with > 30% of primary's score)
  const secondaryGenres = scores
    .slice(1, 4)
    .filter(s => s.score > primaryScore * 0.3)
    .map(s => s.genre);

  // Get Key Moments for primary genre
  const primaryGenre = scores[0]?.genre || "drama"; // Default to drama if unclear
  const keyMomentTemplates = KEY_MOMENTS[primaryGenre] || KEY_MOMENTS.drama;

  const expectedKeyMoments: KeyMoment[] = keyMomentTemplates.map(km => ({
    ...km,
    foundAt: null,
    foundScene: null,
  }));

  return {
    primaryGenre,
    primaryConfidence: Math.round(primaryConfidence * 100) / 100,
    secondaryGenres,
    evidence,
    keyMomentsFramework: primaryGenre,
    expectedKeyMoments,
    detectedAt: new Date().toISOString(),
  };
}

// === CLI ===

function printHelp(): void {
  console.log(`Genre Detection Script

Usage:
  deno run --allow-read scripts/detect-genre.ts <book.txt> [options]

Options:
  --output <file>       Write output to JSON file (default: stdout)
  --sample-size <n>     Number of text samples to analyze (default: 10)
  --help, -h            Show this help message

Examples:
  deno run --allow-read detect-genre.ts novel.txt
  deno run --allow-read detect-genre.ts novel.txt --output genre.json
  deno run --allow-read detect-genre.ts novel.txt --sample-size 20
`);
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    printHelp();
    Deno.exit(0);
  }

  // Parse arguments
  let inputFile = "";
  let outputFile = "";
  let sampleSize = 10;

  const skipIndices = new Set<number>();

  for (let i = 0; i < args.length; i++) {
    if (skipIndices.has(i)) continue;

    if (args[i] === "--output" && args[i + 1]) {
      outputFile = args[i + 1];
      skipIndices.add(i + 1);
    } else if (args[i] === "--sample-size" && args[i + 1]) {
      sampleSize = parseInt(args[i + 1], 10) || 10;
      skipIndices.add(i + 1);
    } else if (!args[i].startsWith("--") && !inputFile) {
      inputFile = args[i];
    }
  }

  if (!inputFile) {
    console.error("Error: No input file provided");
    Deno.exit(1);
  }

  // Read input file
  let text: string;
  try {
    text = await Deno.readTextFile(inputFile);
  } catch (e) {
    console.error(`Error reading file: ${e instanceof Error ? e.message : e}`);
    Deno.exit(1);
  }

  // Detect genre
  const result = detectGenre(text, sampleSize);

  // Output
  const jsonOutput = JSON.stringify(result, null, 2);

  if (outputFile) {
    await Deno.writeTextFile(outputFile, jsonOutput);
    console.log(`Genre detection complete`);
    console.log(`Primary: ${result.primaryGenre} (${Math.round(result.primaryConfidence * 100)}% confidence)`);
    if (result.secondaryGenres.length > 0) {
      console.log(`Secondary: ${result.secondaryGenres.join(", ")}`);
    }
    console.log(`Output written to: ${outputFile}`);
  } else {
    console.log(jsonOutput);
  }
}

main();
