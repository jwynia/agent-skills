#!/usr/bin/env -S deno run --allow-read

/**
 * Genre Check Analyzer
 *
 * Analyzes text for genre-specific elements and patterns.
 * Can check against a specified genre or attempt to detect likely genre.
 *
 * Usage:
 *   deno run --allow-read genre-check.ts --genre mystery scene.txt
 *   deno run --allow-read genre-check.ts --analyze "Synopsis text here"
 *   deno run --allow-read genre-check.ts --text "The detective arrived..." --genre mystery
 */

interface GenrePatterns {
  name: string;
  displayName: string;
  promise: string;
  required: string[];
  patterns: Record<string, RegExp[]>;
}

interface GenreAnalysis {
  genre: string;
  matchScore: number;
  totalMatches: number;
  categoryBreakdown: Record<string, { count: number; samples: string[] }>;
  presentElements: string[];
  missingElements: string[];
  issues: string[];
  recommendations: string[];
}

interface MultiGenreAnalysis {
  wordCount: number;
  likelyPrimaryGenre: string;
  genreScores: Record<string, number>;
  detailedAnalysis: GenreAnalysis;
}

// Genre-specific pattern definitions
const GENRE_PATTERNS: GenrePatterns[] = [
  {
    name: "wonder",
    displayName: "Wonder",
    promise: "Awe and fascination with the unfamiliar",
    required: ["scale/scope indicators", "discovery moments", "perspective shifts"],
    patterns: {
      scale_scope: [
        /\b(vast|immense|infinite|endless|boundless|cosmic|universal)\b/gi,
        /\b(horizon|expanse|beyond|stretching|spanning)\b/gi,
        /\b(ancient|eons|millennia|timeless|eternal)\b/gi,
      ],
      discovery: [
        /\b(discover|discovered|discovering|revelation|reveal|revealed)\b/gi,
        /\b(first time|never before|unprecedented|unknown|unexplored)\b/gi,
        /\b(realize|realized|understanding|comprehend)\b/gi,
      ],
      awe: [
        /\b(awe|wonder|amazement|astonishment|marvel)\b/gi,
        /\b(breathtaking|magnificent|spectacular|extraordinary)\b/gi,
        /\b(impossible|unbelievable|inconceivable)\b/gi,
      ],
    },
  },
  {
    name: "idea",
    displayName: "Idea",
    promise: "Intellectual fascination with concepts",
    required: ["central concept", "implication exploration", "hypothesis testing"],
    patterns: {
      concepts: [
        /\b(what if|imagine if|suppose|consider|hypothesis)\b/gi,
        /\b(theory|concept|principle|paradigm|framework)\b/gi,
        /\b(implications|consequences|ramifications|effects)\b/gi,
      ],
      exploration: [
        /\b(therefore|thus|hence|consequently|as a result)\b/gi,
        /\b(leads to|results in|causes|means that)\b/gi,
        /\b(consider|examine|explore|investigate|analyze)\b/gi,
      ],
      questioning: [
        /\b(why|how|what does this mean|what happens when)\b/gi,
        /\b(question|wonder|ponder|contemplate)\b/gi,
        /\b(paradox|contradiction|dilemma|puzzle)\b/gi,
      ],
    },
  },
  {
    name: "adventure",
    displayName: "Adventure",
    promise: "Excitement through challenges and journeys",
    required: ["journey/quest", "escalating obstacles", "resource pressure"],
    patterns: {
      journey: [
        /\b(journey|quest|expedition|voyage|trek|travel)\b/gi,
        /\b(destination|goal|objective|mission|target)\b/gi,
        /\b(map|path|route|trail|way forward)\b/gi,
      ],
      obstacles: [
        /\b(obstacle|challenge|barrier|block|hindrance)\b/gi,
        /\b(climb|cross|navigate|overcome|survive)\b/gi,
        /\b(dangerous|treacherous|difficult|impossible|deadly)\b/gi,
      ],
      resources: [
        /\b(supplies|provisions|rations|equipment|gear)\b/gi,
        /\b(running low|depleted|exhausted|scarce|limited)\b/gi,
        /\b(water|food|fuel|ammunition|medicine)\b/gi,
      ],
    },
  },
  {
    name: "horror",
    displayName: "Horror",
    promise: "Dread and confrontation with the threatening",
    required: ["vulnerability", "dread building", "rules or violations"],
    patterns: {
      dread: [
        /\b(dread|terror|horror|fear|panic|fright)\b/gi,
        /\b(creeping|lurking|watching|waiting|stalking)\b/gi,
        /\b(wrong|off|strange|unnatural|disturbing)\b/gi,
      ],
      vulnerability: [
        /\b(alone|isolated|trapped|helpless|powerless)\b/gi,
        /\b(dark|darkness|shadow|shadows|night)\b/gi,
        /\b(no escape|nowhere to run|can't get out)\b/gi,
      ],
      threat: [
        /\b(thing|creature|it|them|monster|entity)\b/gi,
        /\b(behind|watching|following|closer|approaching)\b/gi,
        /\b(scream|blood|death|die|kill|dead)\b/gi,
      ],
    },
  },
  {
    name: "mystery",
    displayName: "Mystery",
    promise: "Curiosity about unknown facts",
    required: ["clues", "investigation", "revelation"],
    patterns: {
      clues: [
        /\b(clue|evidence|proof|trace|sign|indication)\b/gi,
        /\b(noticed|observed|spotted|found|discovered)\b/gi,
        /\b(strange|odd|unusual|inconsistent|suspicious)\b/gi,
      ],
      investigation: [
        /\b(investigate|examine|inspect|analyze|study)\b/gi,
        /\b(question|interview|interrogate|ask)\b/gi,
        /\b(detective|investigator|officer|inspector)\b/gi,
      ],
      revelation: [
        /\b(truth|answer|solution|explanation|revelation)\b/gi,
        /\b(realize|understand|figure out|piece together)\b/gi,
        /\b(who|what|why|how|when|where)\b/gi,
      ],
    },
  },
  {
    name: "thriller",
    displayName: "Thriller",
    promise: "Tension through immediate danger",
    required: ["time pressure", "high stakes", "power shifts"],
    patterns: {
      time_pressure: [
        /\b(deadline|timer|countdown|clock|hours|minutes)\b/gi,
        /\b(hurry|rush|quickly|fast|immediately|now)\b/gi,
        /\b(running out|too late|before|until)\b/gi,
      ],
      stakes: [
        /\b(life|death|lives|die|kill|survive|save)\b/gi,
        /\b(million|billion|everything|everyone|world)\b/gi,
        /\b(hostage|bomb|attack|threat|danger)\b/gi,
      ],
      tension: [
        /\b(chase|pursue|hunt|flee|escape|run)\b/gi,
        /\b(catch|caught|trapped|cornered|surrounded)\b/gi,
        /\b(heart|pulse|breath|sweat|adrenaline)\b/gi,
      ],
    },
  },
  {
    name: "humor",
    displayName: "Humor",
    promise: "Entertainment through comedy",
    required: ["incongruity", "subversion", "timing"],
    patterns: {
      incongruity: [
        /\b(absurd|ridiculous|ludicrous|preposterous)\b/gi,
        /\b(unexpected|surprising|ironic|irony)\b/gi,
        /\b(misunderstanding|confusion|mixed up|wrong)\b/gi,
      ],
      subversion: [
        /\b(actually|instead|but|however|turns out)\b/gi,
        /\b(supposed to|meant to|should have|tried to)\b/gi,
        /\b(unfortunately|somehow|accidentally|oops)\b/gi,
      ],
      reaction: [
        /\b(laugh|laughed|laughing|chuckle|giggle|snort)\b/gi,
        /\b(smile|grin|smirk|amused|funny)\b/gi,
        /\b(joke|punchline|wit|clever|deadpan)\b/gi,
      ],
    },
  },
  {
    name: "relationship",
    displayName: "Relationship",
    promise: "Investment in interpersonal connections",
    required: ["meaningful obstacle", "connection progression", "resolution"],
    patterns: {
      connection: [
        /\b(love|loved|loving|heart|soul|feeling)\b/gi,
        /\b(together|between|us|we|our|relationship)\b/gi,
        /\b(trust|care|understand|know|accept)\b/gi,
      ],
      obstacle: [
        /\b(can't|couldn't|shouldn't|forbidden|impossible)\b/gi,
        /\b(between us|apart|separate|distance|barrier)\b/gi,
        /\b(secret|hide|hiding|lie|lied|truth)\b/gi,
      ],
      progression: [
        /\b(first|began|started|moment|when we)\b/gi,
        /\b(closer|deeper|more|growing|falling)\b/gi,
        /\b(finally|at last|admitted|confessed|realized)\b/gi,
      ],
    },
  },
  {
    name: "drama",
    displayName: "Drama",
    promise: "Internal conflict and transformation",
    required: ["value under pressure", "difficult choice", "transformation"],
    patterns: {
      internal_conflict: [
        /\b(torn|conflicted|struggled|wrestling|battling)\b/gi,
        /\b(should|must|have to|need to|can't)\b/gi,
        /\b(wrong|right|choice|decide|decision)\b/gi,
      ],
      values: [
        /\b(believe|principle|value|honor|integrity|duty)\b/gi,
        /\b(sacrifice|cost|price|give up|lose)\b/gi,
        /\b(worth|meaning|matter|important|everything)\b/gi,
      ],
      transformation: [
        /\b(change|changed|different|become|became)\b/gi,
        /\b(realize|understand|see now|finally)\b/gi,
        /\b(was|used to|before|now|anymore)\b/gi,
      ],
    },
  },
  {
    name: "issue",
    displayName: "Issue",
    promise: "Exploration of complex questions",
    required: ["multiple perspectives", "complexity revealed", "stakes for all sides"],
    patterns: {
      perspectives: [
        /\b(side|perspective|view|viewpoint|opinion)\b/gi,
        /\b(some believe|others think|they say|we argue)\b/gi,
        /\b(but|however|although|yet|still|nevertheless)\b/gi,
      ],
      complexity: [
        /\b(complicated|complex|nuanced|layered|difficult)\b/gi,
        /\b(not simple|not easy|gray area|both|neither)\b/gi,
        /\b(depends|context|situation|circumstances)\b/gi,
      ],
      stakes: [
        /\b(rights|justice|freedom|equality|future)\b/gi,
        /\b(society|community|people|everyone|generation)\b/gi,
        /\b(consequence|impact|effect|change|matter)\b/gi,
      ],
    },
  },
  {
    name: "ensemble",
    displayName: "Ensemble",
    promise: "Group dynamics drive the story",
    required: ["diverse skills", "group challenges", "collective success"],
    patterns: {
      group: [
        /\b(team|group|crew|squad|party|band)\b/gi,
        /\b(together|all of us|everyone|each|we)\b/gi,
        /\b(member|role|part|contribution|place)\b/gi,
      ],
      diversity: [
        /\b(different|unique|special|each|own way)\b/gi,
        /\b(skill|ability|talent|expertise|strength)\b/gi,
        /\b(leader|expert|specialist|only one who)\b/gi,
      ],
      cooperation: [
        /\b(work together|combine|coordinate|cooperate)\b/gi,
        /\b(trust|rely|depend|count on|need each other)\b/gi,
        /\b(plan|strategy|formation|position|cover)\b/gi,
      ],
    },
  },
];

function countMatches(text: string, patterns: RegExp[]): { count: number; samples: string[] } {
  const matches: string[] = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found.slice(0, 3));
    }
  }
  const unique = [...new Set(matches.map(m => m.toLowerCase()))];
  return {
    count: unique.length,
    samples: unique.slice(0, 5),
  };
}

function analyzeForGenre(text: string, genre: GenrePatterns): GenreAnalysis {
  const categoryBreakdown: Record<string, { count: number; samples: string[] }> = {};
  let totalMatches = 0;

  for (const [category, patterns] of Object.entries(genre.patterns)) {
    const result = countMatches(text, patterns);
    categoryBreakdown[category] = result;
    totalMatches += result.count;
  }

  // Calculate match score (0-100)
  const categoryCount = Object.keys(genre.patterns).length;
  const maxExpectedPerCategory = 5;
  const maxScore = categoryCount * maxExpectedPerCategory;
  const matchScore = Math.min(100, Math.round((totalMatches / maxScore) * 100));

  // Determine present and missing elements
  const presentElements: string[] = [];
  const missingElements: string[] = [];

  for (const [category, result] of Object.entries(categoryBreakdown)) {
    if (result.count > 0) {
      presentElements.push(category.replace(/_/g, " "));
    } else {
      missingElements.push(category.replace(/_/g, " "));
    }
  }

  // Generate issues and recommendations
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (matchScore < 20) {
    issues.push(`Very few ${genre.displayName} elements detected`);
    recommendations.push(`Consider adding ${genre.required.join(", ")}`);
  } else if (matchScore < 40) {
    issues.push(`${genre.displayName} elements present but weak`);
  }

  if (missingElements.length > 0) {
    issues.push(`Missing ${genre.displayName} categories: ${missingElements.join(", ")}`);
    recommendations.push(`Strengthen ${missingElements[0]} indicators`);
  }

  // Check for genre-specific issues
  if (genre.name === "mystery" && categoryBreakdown.clues?.count === 0) {
    issues.push("Mystery without detectable clues");
    recommendations.push("Plant fair-play clues the reader could notice");
  }

  if (genre.name === "thriller" && categoryBreakdown.time_pressure?.count === 0) {
    issues.push("Thriller without time pressure");
    recommendations.push("Add a ticking clock or deadline");
  }

  if (genre.name === "horror" && categoryBreakdown.vulnerability?.count === 0) {
    issues.push("Horror without established vulnerability");
    recommendations.push("Establish why characters cannot simply escape");
  }

  return {
    genre: genre.displayName,
    matchScore,
    totalMatches,
    categoryBreakdown,
    presentElements,
    missingElements,
    issues,
    recommendations,
  };
}

function analyzeMultiGenre(text: string): MultiGenreAnalysis {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const genreScores: Record<string, number> = {};
  let bestGenre = GENRE_PATTERNS[0];
  let bestScore = 0;

  for (const genre of GENRE_PATTERNS) {
    const analysis = analyzeForGenre(text, genre);
    genreScores[genre.displayName] = analysis.matchScore;
    if (analysis.matchScore > bestScore) {
      bestScore = analysis.matchScore;
      bestGenre = genre;
    }
  }

  return {
    wordCount: words.length,
    likelyPrimaryGenre: bestGenre.displayName,
    genreScores,
    detailedAnalysis: analyzeForGenre(text, bestGenre),
  };
}

function formatReport(analysis: GenreAnalysis): string {
  const lines: string[] = [];

  lines.push(`# ${analysis.genre} Genre Analysis\n`);
  lines.push(`## Match Score: ${analysis.matchScore}/100\n`);

  lines.push("## Category Breakdown");
  for (const [category, result] of Object.entries(analysis.categoryBreakdown)) {
    const status = result.count > 0 ? "+" : "-";
    const samples = result.samples.length > 0 ? `: ${result.samples.join(", ")}` : "";
    lines.push(`  ${status} ${category.replace(/_/g, " ")} (${result.count})${samples}`);
  }
  lines.push("");

  if (analysis.presentElements.length > 0) {
    lines.push(`## Present Elements`);
    lines.push(`  ${analysis.presentElements.join(", ")}\n`);
  }

  if (analysis.missingElements.length > 0) {
    lines.push(`## Missing Elements`);
    lines.push(`  ${analysis.missingElements.join(", ")}\n`);
  }

  if (analysis.issues.length > 0) {
    lines.push("## Issues");
    for (const issue of analysis.issues) {
      lines.push(`  - ${issue}`);
    }
    lines.push("");
  }

  if (analysis.recommendations.length > 0) {
    lines.push("## Recommendations");
    for (const rec of analysis.recommendations) {
      lines.push(`  - ${rec}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatMultiGenreReport(analysis: MultiGenreAnalysis): string {
  const lines: string[] = [];

  lines.push("# Multi-Genre Analysis\n");
  lines.push(`Word count: ${analysis.wordCount}`);
  lines.push(`Likely primary genre: **${analysis.likelyPrimaryGenre}**\n`);

  lines.push("## Genre Scores");
  const sorted = Object.entries(analysis.genreScores).sort((a, b) => b[1] - a[1]);
  for (const [genre, score] of sorted) {
    const bar = "=".repeat(Math.floor(score / 5));
    lines.push(`  ${genre.padEnd(15)} ${bar} ${score}`);
  }
  lines.push("");

  lines.push("## Primary Genre Details\n");
  lines.push(formatReport(analysis.detailedAnalysis));

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Genre Check Analyzer - Detect genre elements in text

Usage:
  deno run --allow-read genre-check.ts --genre <genre> <file>
  deno run --allow-read genre-check.ts --genre <genre> --text "text here"
  deno run --allow-read genre-check.ts --analyze <file>
  deno run --allow-read genre-check.ts --analyze --text "text here"

Modes:
  --genre <g>    Check text against specific genre
  --analyze      Auto-detect likely genre, score all

Options:
  --text "..."   Provide text inline instead of file
  --json         Output as JSON
  --help         Show this message

Genres:
  wonder, idea, adventure, horror, mystery, thriller,
  humor, relationship, drama, issue, ensemble
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");
  let text = "";

  // Get text from file or --text
  if (args.includes("--text")) {
    const textIndex = args.indexOf("--text");
    text = args[textIndex + 1] || "";
  } else {
    // Find file path (non-flag argument that's not a genre name)
    const genreNames = GENRE_PATTERNS.map(g => g.name);
    const genreIndex = args.indexOf("--genre");
    const skipIndices = new Set<number>();
    if (genreIndex !== -1) {
      skipIndices.add(genreIndex);
      skipIndices.add(genreIndex + 1);
    }

    for (let i = 0; i < args.length; i++) {
      if (!args[i].startsWith("--") && !skipIndices.has(i) && !genreNames.includes(args[i])) {
        try {
          text = await Deno.readTextFile(args[i]);
          break;
        } catch {
          // Not a file, continue
        }
      }
    }
  }

  if (!text.trim()) {
    console.error("Error: No text provided. Use --text or provide a file path.");
    Deno.exit(1);
  }

  // Analyze mode (multi-genre)
  if (args.includes("--analyze")) {
    const analysis = analyzeMultiGenre(text);
    if (jsonOutput) {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      console.log(formatMultiGenreReport(analysis));
    }
    Deno.exit(0);
  }

  // Specific genre mode
  if (args.includes("--genre")) {
    const genreIndex = args.indexOf("--genre");
    const genreName = args[genreIndex + 1]?.toLowerCase();

    const genre = GENRE_PATTERNS.find(g => g.name === genreName);
    if (!genre) {
      console.error(`Error: Unknown genre "${genreName}"`);
      console.error(`Available: ${GENRE_PATTERNS.map(g => g.name).join(", ")}`);
      Deno.exit(1);
    }

    const analysis = analyzeForGenre(text, genre);
    if (jsonOutput) {
      console.log(JSON.stringify(analysis, null, 2));
    } else {
      console.log(formatReport(analysis));
    }
    Deno.exit(0);
  }

  console.error("Error: Specify --genre <genre> or --analyze");
  Deno.exit(1);
}

main();
