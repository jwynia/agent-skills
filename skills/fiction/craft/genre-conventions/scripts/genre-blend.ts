#!/usr/bin/env -S deno run --allow-read

/**
 * Genre Blend Helper
 *
 * Provides strategies for integrating secondary genres with a primary genre.
 * Identifies potential conflicts, suggests proportion guidelines, and warns
 * of common failure modes for specific combinations.
 *
 * Usage:
 *   deno run --allow-read genre-blend.ts mystery relationship
 *   deno run --allow-read genre-blend.ts thriller --secondary humor,wonder
 *   deno run --allow-read genre-blend.ts --combos         # Show all notable combos
 */

interface GenreInfo {
  name: string;
  displayName: string;
  promise: string;
  pacing: "fast" | "moderate" | "slow";
  tone: "light" | "neutral" | "dark";
  focus: "external" | "internal" | "both";
}

interface BlendStrategy {
  primary: string;
  secondary: string;
  compatibility: "excellent" | "good" | "challenging" | "difficult";
  strategies: string[];
  pitfalls: string[];
  proportionGuideline: string;
  examples: string[];
}

const GENRES: GenreInfo[] = [
  { name: "wonder", displayName: "Wonder", promise: "Awe and fascination", pacing: "slow", tone: "light", focus: "external" },
  { name: "idea", displayName: "Idea", promise: "Intellectual fascination", pacing: "slow", tone: "neutral", focus: "internal" },
  { name: "adventure", displayName: "Adventure", promise: "Excitement through challenges", pacing: "fast", tone: "neutral", focus: "external" },
  { name: "horror", displayName: "Horror", promise: "Dread and fear", pacing: "moderate", tone: "dark", focus: "both" },
  { name: "mystery", displayName: "Mystery", promise: "Curiosity about unknowns", pacing: "moderate", tone: "neutral", focus: "external" },
  { name: "thriller", displayName: "Thriller", promise: "Tension through danger", pacing: "fast", tone: "dark", focus: "external" },
  { name: "humor", displayName: "Humor", promise: "Entertainment and amusement", pacing: "fast", tone: "light", focus: "both" },
  { name: "relationship", displayName: "Relationship", promise: "Investment in connections", pacing: "slow", tone: "neutral", focus: "internal" },
  { name: "drama", displayName: "Drama", promise: "Internal transformation", pacing: "slow", tone: "neutral", focus: "internal" },
  { name: "issue", displayName: "Issue", promise: "Exploration of questions", pacing: "slow", tone: "neutral", focus: "both" },
  { name: "ensemble", displayName: "Ensemble", promise: "Group dynamics", pacing: "moderate", tone: "neutral", focus: "both" },
];

// Pre-defined notable combinations with specific guidance
const NOTABLE_COMBOS: BlendStrategy[] = [
  {
    primary: "mystery",
    secondary: "relationship",
    compatibility: "excellent",
    strategies: [
      "Investigation creates forced proximity that develops relationship",
      "Relationship stakes raise mystery stakes (what if the suspect is the love interest?)",
      "Clue-gathering scenes double as relationship-building scenes",
      "Resolution of mystery enables resolution of relationship",
    ],
    pitfalls: [
      "Romance subplot pauses investigation momentum",
      "Romantic tension overshadows mystery tension",
      "Clues get lost in relationship conversations",
    ],
    proportionGuideline: "70% mystery / 30% relationship - relationship beats in sequel scenes",
    examples: ["Romantic suspense novels", "Cozy mysteries with ongoing romance arcs"],
  },
  {
    primary: "thriller",
    secondary: "horror",
    compatibility: "excellent",
    strategies: [
      "Horror elements raise thriller stakes beyond physical danger",
      "Dread underlies action sequences",
      "Survival horror: thriller pacing with horror atmosphere",
      "The threat is both immediate (thriller) and existential (horror)",
    ],
    pitfalls: [
      "Constant action prevents dread from building",
      "Horror atmosphere breaks when protagonist is too capable",
      "Switching between fast thriller and slow horror creates whiplash",
    ],
    proportionGuideline: "60% thriller / 40% horror - alternate between action and dread sequences",
    examples: ["Alien", "The Silence of the Lambs", "28 Days Later"],
  },
  {
    primary: "thriller",
    secondary: "humor",
    compatibility: "challenging",
    strategies: [
      "Humor provides relief valve between tension peaks",
      "Character humor (not situation comedy) maintains tension",
      "Gallows humor under pressure feels authentic",
      "Comic sidekick contrasts with serious protagonist",
    ],
    pitfalls: [
      "Humor undercuts tension at crucial moments",
      "Tonal whiplash between scary and funny",
      "Stakes feel unreal if characters joke too much",
    ],
    proportionGuideline: "80% thriller / 20% humor - humor only in setup and aftermath, never at peak tension",
    examples: ["Die Hard", "True Lies", "Mr. & Mrs. Smith"],
  },
  {
    primary: "horror",
    secondary: "humor",
    compatibility: "difficult",
    strategies: [
      "Horror-comedy requires full commitment to both",
      "Humor about the horror, not despite it",
      "Characters can be funny; situation remains horrifying",
      "Absurdist logic that's both funny and terrifying",
    ],
    pitfalls: [
      "Horror becomes campy rather than scary",
      "Humor makes audience not care about characters",
      "Switching between modes rather than blending them",
    ],
    proportionGuideline: "50/50 - must be genuinely both, not alternating",
    examples: ["Shaun of the Dead", "Tucker and Dale vs Evil", "What We Do in the Shadows"],
  },
  {
    primary: "adventure",
    secondary: "wonder",
    compatibility: "excellent",
    strategies: [
      "Discovery moments punctuate action sequences",
      "New locations provide both challenges and awe",
      "Wonder is the reward for overcoming obstacles",
      "Scale of environment creates both danger and beauty",
    ],
    pitfalls: [
      "Pausing for wonder kills momentum",
      "Wonder becomes background scenery rather than emotional beat",
      "Too much spectacle, not enough story",
    ],
    proportionGuideline: "70% adventure / 30% wonder - wonder at act breaks and destination arrivals",
    examples: ["Indiana Jones", "Journey to the Center of the Earth", "Avatar"],
  },
  {
    primary: "mystery",
    secondary: "horror",
    compatibility: "good",
    strategies: [
      "Investigation uncovers increasingly disturbing truths",
      "Clues hint at something the reader dreads discovering",
      "Fair-play mystery rules apply to supernatural horror",
      "The more they learn, the worse it gets",
    ],
    pitfalls: [
      "Horror elements make mystery feel unfair",
      "Investigation pace too slow for horror urgency",
      "Revelation of monster removes mystery",
    ],
    proportionGuideline: "60% mystery / 40% horror - horror escalates as mystery deepens",
    examples: ["True Detective S1", "The Name of the Rose", "In the Mouth of Madness"],
  },
  {
    primary: "drama",
    secondary: "issue",
    compatibility: "excellent",
    strategies: [
      "Personal transformation reflects larger social issue",
      "Character embodies one perspective, then grows",
      "Private stakes illuminate public stakes",
      "The issue is experienced, not debated",
    ],
    pitfalls: [
      "Character becomes mouthpiece for position",
      "Issue overwhelms personal story",
      "Preachiness replaces drama",
    ],
    proportionGuideline: "70% drama / 30% issue - issue is context, drama is story",
    examples: ["Philadelphia", "Erin Brockovich", "The Remains of the Day"],
  },
  {
    primary: "ensemble",
    secondary: "adventure",
    compatibility: "excellent",
    strategies: [
      "Different characters excel at different challenges",
      "Group must work together to overcome obstacles",
      "Journey tests group cohesion",
      "Individual skill moments within collective goal",
    ],
    pitfalls: [
      "Too many characters, not enough development",
      "Adventure overshadows character dynamics",
      "Group splits and story fragments",
    ],
    proportionGuideline: "50/50 - adventure provides structure, ensemble provides heart",
    examples: ["Lord of the Rings", "Guardians of the Galaxy", "Ocean's Eleven"],
  },
  {
    primary: "idea",
    secondary: "thriller",
    compatibility: "good",
    strategies: [
      "Time pressure forces concept to be tested urgently",
      "Stakes make abstract ideas concrete",
      "Concept exploration happens during action",
      "Idea implications are the source of danger",
    ],
    pitfalls: [
      "Idea exposition slows thriller pacing",
      "Thriller urgency prevents thoughtful exploration",
      "Concept gets simplified for action convenience",
    ],
    proportionGuideline: "40% idea / 60% thriller - front-load concept, let implications drive action",
    examples: ["Inception", "Arrival", "Ex Machina"],
  },
  {
    primary: "relationship",
    secondary: "drama",
    compatibility: "excellent",
    strategies: [
      "Relationship tests character values",
      "Internal change enables external connection",
      "Partner challenges protagonist's false beliefs",
      "Growth in self enables growth in relationship",
    ],
    pitfalls: [
      "One partner becomes tool for other's growth",
      "Relationship problems feel manufactured",
      "Internal and external arcs don't align",
    ],
    proportionGuideline: "55% relationship / 45% drama - intertwined throughout",
    examples: ["Pride and Prejudice", "When Harry Met Sally", "Marriage Story"],
  },
];

function getGenreInfo(name: string): GenreInfo | undefined {
  return GENRES.find(g => g.name === name.toLowerCase());
}

function assessCompatibility(primary: GenreInfo, secondary: GenreInfo): "excellent" | "good" | "challenging" | "difficult" {
  let score = 0;

  // Same pacing is easier
  if (primary.pacing === secondary.pacing) score += 2;
  else if (
    (primary.pacing === "moderate") ||
    (secondary.pacing === "moderate")
  ) score += 1;

  // Compatible tone
  if (primary.tone === secondary.tone) score += 2;
  else if (primary.tone === "neutral" || secondary.tone === "neutral") score += 1;
  else if (primary.tone !== secondary.tone) score -= 1; // light/dark clash

  // Focus compatibility
  if (primary.focus === secondary.focus) score += 1;
  else if (primary.focus === "both" || secondary.focus === "both") score += 1;

  if (score >= 4) return "excellent";
  if (score >= 2) return "good";
  if (score >= 0) return "challenging";
  return "difficult";
}

function generateGenericStrategy(primary: GenreInfo, secondary: GenreInfo): BlendStrategy {
  const compatibility = assessCompatibility(primary, secondary);

  const strategies: string[] = [];
  const pitfalls: string[] = [];

  // Pacing strategies
  if (primary.pacing === "fast" && secondary.pacing === "slow") {
    strategies.push(`Use ${secondary.displayName} elements in setup and aftermath, not during ${primary.displayName} sequences`);
    pitfalls.push(`${secondary.displayName} elements may slow ${primary.displayName} momentum`);
  } else if (primary.pacing === "slow" && secondary.pacing === "fast") {
    strategies.push(`${secondary.displayName} sequences can punctuate ${primary.displayName} contemplation`);
    pitfalls.push(`${secondary.displayName} urgency may not allow ${primary.displayName} depth`);
  }

  // Tone strategies
  if (primary.tone === "dark" && secondary.tone === "light") {
    strategies.push("Use contrast deliberately - light moments make dark moments darker");
    pitfalls.push("Tonal whiplash if transitions aren't managed");
  } else if (primary.tone === "light" && secondary.tone === "dark") {
    strategies.push("Dark elements can add unexpected depth to light story");
    pitfalls.push("Dark elements may feel out of place if not integrated");
  }

  // Focus strategies
  if (primary.focus === "external" && secondary.focus === "internal") {
    strategies.push(`Use sequel scenes for ${secondary.displayName} while scene scenes drive ${primary.displayName}`);
  } else if (primary.focus === "internal" && secondary.focus === "external") {
    strategies.push(`External ${secondary.displayName} events can trigger internal ${primary.displayName} responses`);
  }

  // Generic strategies
  strategies.push(`Ensure ${secondary.displayName} elements serve ${primary.displayName} promise, not compete with it`);
  strategies.push(`Consider which POV or subplot carries ${secondary.displayName} elements`);

  // Generic pitfalls
  pitfalls.push(`${secondary.displayName} overwhelming ${primary.displayName} if proportions aren't maintained`);
  pitfalls.push(`Reader confusion about which genre promise to expect`);

  // Proportion guideline
  let proportion: string;
  if (compatibility === "excellent") {
    proportion = `60% ${primary.displayName} / 40% ${secondary.displayName} - can integrate throughout`;
  } else if (compatibility === "good") {
    proportion = `70% ${primary.displayName} / 30% ${secondary.displayName} - ${secondary.displayName} in specific scenes`;
  } else if (compatibility === "challenging") {
    proportion = `80% ${primary.displayName} / 20% ${secondary.displayName} - ${secondary.displayName} as accent only`;
  } else {
    proportion = `85% ${primary.displayName} / 15% ${secondary.displayName} - requires careful craft to blend`;
  }

  return {
    primary: primary.displayName,
    secondary: secondary.displayName,
    compatibility,
    strategies,
    pitfalls,
    proportionGuideline: proportion,
    examples: [],
  };
}

function getBlendStrategy(primaryName: string, secondaryName: string): BlendStrategy {
  // Check for pre-defined notable combo
  const notable = NOTABLE_COMBOS.find(
    c => c.primary === primaryName && c.secondary === secondaryName
  );
  if (notable) return notable;

  // Check reverse (some combos work both ways)
  const reverseNotable = NOTABLE_COMBOS.find(
    c => c.primary === secondaryName && c.secondary === primaryName
  );
  if (reverseNotable) {
    // Adapt the reverse for this direction
    return {
      ...reverseNotable,
      primary: primaryName,
      secondary: secondaryName,
      proportionGuideline: reverseNotable.proportionGuideline.replace(
        /(\d+)% .* \/ (\d+)% .*/,
        `$2% ${getGenreInfo(primaryName)?.displayName} / $1% ${getGenreInfo(secondaryName)?.displayName}`
      ),
    };
  }

  // Generate generic strategy
  const primary = getGenreInfo(primaryName);
  const secondary = getGenreInfo(secondaryName);
  if (!primary || !secondary) {
    throw new Error(`Unknown genre: ${!primary ? primaryName : secondaryName}`);
  }

  return generateGenericStrategy(primary, secondary);
}

function formatBlendReport(strategy: BlendStrategy): string {
  const lines: string[] = [];

  const compatIcon = {
    excellent: "++++",
    good: "+++",
    challenging: "++",
    difficult: "+",
  }[strategy.compatibility];

  lines.push(`# ${strategy.primary} + ${strategy.secondary} Blend\n`);
  lines.push(`Compatibility: ${strategy.compatibility.toUpperCase()} ${compatIcon}\n`);
  lines.push(`## Proportion Guideline`);
  lines.push(`${strategy.proportionGuideline}\n`);

  lines.push("## Integration Strategies");
  for (const s of strategy.strategies) {
    lines.push(`  - ${s}`);
  }
  lines.push("");

  lines.push("## Common Pitfalls");
  for (const p of strategy.pitfalls) {
    lines.push(`  - ${p}`);
  }
  lines.push("");

  if (strategy.examples.length > 0) {
    lines.push("## Examples");
    lines.push(`  ${strategy.examples.join(", ")}\n`);
  }

  return lines.join("\n");
}

function formatMultiBlendReport(primary: string, secondaries: string[]): string {
  const lines: string[] = [];
  const primaryInfo = getGenreInfo(primary);

  lines.push(`# Multi-Genre Blend: ${primaryInfo?.displayName}\n`);
  lines.push(`Primary genre: **${primaryInfo?.displayName}** (${primaryInfo?.promise})\n`);
  lines.push(`Secondary genres: ${secondaries.map(s => getGenreInfo(s)?.displayName).join(", ")}\n`);

  // Overall proportion guidance
  const secondaryCount = secondaries.length;
  const primaryPercent = Math.max(50, 80 - (secondaryCount * 10));
  const secondaryPercent = Math.floor((100 - primaryPercent) / secondaryCount);

  lines.push("## Overall Proportion");
  lines.push(`  ${primaryInfo?.displayName}: ${primaryPercent}%`);
  for (const s of secondaries) {
    lines.push(`  ${getGenreInfo(s)?.displayName}: ~${secondaryPercent}%`);
  }
  lines.push("");

  lines.push("## Individual Blend Analysis\n");
  for (const secondary of secondaries) {
    const strategy = getBlendStrategy(primary, secondary);
    lines.push(`### + ${strategy.secondary}`);
    lines.push(`Compatibility: ${strategy.compatibility}`);
    lines.push(`Key strategy: ${strategy.strategies[0]}`);
    lines.push(`Watch for: ${strategy.pitfalls[0]}\n`);
  }

  // Interaction warnings
  lines.push("## Multi-Secondary Considerations");
  lines.push("  - Each secondary genre should serve the primary, not each other");
  lines.push("  - Consider assigning secondary genres to different POVs or subplots");
  lines.push("  - More genres = more complexity = higher craft requirement");
  lines.push("  - If overwhelmed, cut to one secondary genre\n");

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Genre Blend Helper - Secondary genre integration strategies

Usage:
  deno run --allow-read genre-blend.ts <primary> <secondary>
  deno run --allow-read genre-blend.ts <primary> --secondary <g1>,<g2>
  deno run --allow-read genre-blend.ts --combos
  deno run --allow-read genre-blend.ts --matrix

Options:
  --secondary    Specify multiple secondary genres (comma-separated)
  --combos       Show all pre-defined notable combinations
  --matrix       Show compatibility matrix for all genre pairs
  --json         Output as JSON

Genres:
  wonder, idea, adventure, horror, mystery, thriller,
  humor, relationship, drama, issue, ensemble
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");

  // Show all notable combos
  if (args.includes("--combos")) {
    if (jsonOutput) {
      console.log(JSON.stringify(NOTABLE_COMBOS, null, 2));
    } else {
      console.log("# Notable Genre Combinations\n");
      for (const combo of NOTABLE_COMBOS) {
        console.log(`## ${combo.primary} + ${combo.secondary} (${combo.compatibility})`);
        console.log(`   ${combo.proportionGuideline}`);
        if (combo.examples.length > 0) {
          console.log(`   Examples: ${combo.examples.join(", ")}`);
        }
        console.log("");
      }
    }
    Deno.exit(0);
  }

  // Show compatibility matrix
  if (args.includes("--matrix")) {
    console.log("# Genre Compatibility Matrix\n");
    console.log("       " + GENRES.map(g => g.name.substring(0, 4).padEnd(5)).join(" "));
    for (const g1 of GENRES) {
      const row = g1.name.substring(0, 6).padEnd(7);
      const cells = GENRES.map(g2 => {
        if (g1.name === g2.name) return "  -  ";
        const compat = assessCompatibility(g1, g2);
        const icon = { excellent: " ++++ ", good: " +++  ", challenging: " ++   ", difficult: " +    " }[compat];
        return icon;
      });
      console.log(row + cells.join(""));
    }
    console.log("\n++++ excellent | +++ good | ++ challenging | + difficult");
    Deno.exit(0);
  }

  // Multiple secondary genres
  if (args.includes("--secondary")) {
    const secondaryIndex = args.indexOf("--secondary");
    const secondaries = args[secondaryIndex + 1]?.split(",").map(s => s.trim()) || [];

    // Find primary (first non-flag arg)
    let primary: string | undefined;
    for (const arg of args) {
      if (!arg.startsWith("--") && GENRES.some(g => g.name === arg)) {
        primary = arg;
        break;
      }
    }

    if (!primary) {
      console.error("Error: Specify a primary genre");
      Deno.exit(1);
    }

    for (const s of secondaries) {
      if (!GENRES.some(g => g.name === s)) {
        console.error(`Error: Unknown genre "${s}"`);
        Deno.exit(1);
      }
    }

    if (jsonOutput) {
      const strategies = secondaries.map(s => getBlendStrategy(primary!, s));
      console.log(JSON.stringify({ primary, secondaries, strategies }, null, 2));
    } else {
      console.log(formatMultiBlendReport(primary, secondaries));
    }
    Deno.exit(0);
  }

  // Simple two-genre blend
  const genreArgs = args.filter(a => !a.startsWith("--") && GENRES.some(g => g.name === a));

  if (genreArgs.length < 2) {
    console.error("Error: Specify primary and secondary genres");
    console.error("Usage: genre-blend.ts <primary> <secondary>");
    Deno.exit(1);
  }

  const [primary, secondary] = genreArgs;
  const strategy = getBlendStrategy(primary, secondary);

  if (jsonOutput) {
    console.log(JSON.stringify(strategy, null, 2));
  } else {
    console.log(formatBlendReport(strategy));
  }
}

main();
