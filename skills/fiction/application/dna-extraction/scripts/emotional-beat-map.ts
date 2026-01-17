#!/usr/bin/env -S deno run --allow-read

/**
 * Emotional Beat Map
 *
 * Maps emotional peaks and valleys across a work's timeline.
 * Helps identify the emotional experience the work delivers.
 *
 * Usage:
 *   deno run --allow-read scripts/emotional-beat-map.ts "Work Name" --acts 5
 *   deno run --allow-read scripts/emotional-beat-map.ts "Work Name" --episodes 10
 *   deno run --allow-read scripts/emotional-beat-map.ts --compare drama,thriller
 */

// === INTERFACES ===

interface EmotionalBeat {
  position: number;
  emotion: string;
  intensity: number; // 1-10
  element: string;
  beat_type: "peak" | "valley" | "sustain" | "shift";
}

interface BeatMap {
  work_name: string;
  structure_type: "acts" | "episodes" | "chapters";
  unit_count: number;
  primary_genre: string;
  beats: EmotionalBeat[];
  analysis: {
    peaks: number[];
    valleys: number[];
    dominant_emotions: string[];
    pacing_notes: string;
  };
}

interface GenreExpectations {
  name: string;
  expected_peaks: number[];
  expected_emotions: string[];
  pacing_pattern: string;
  key_beats: { position: number; description: string }[];
}

// === DATA ===

const GENRE_EXPECTATIONS: Record<string, GenreExpectations> = {
  wonder: {
    name: "Wonder",
    expected_peaks: [0.1, 0.5, 0.9],
    expected_emotions: ["awe", "curiosity", "amazement", "discovery"],
    pacing_pattern: "Builds through revelations, peaks at major discoveries",
    key_beats: [
      { position: 0.1, description: "Initial wonder hook - something fascinating" },
      { position: 0.5, description: "Major revelation that reframes understanding" },
      { position: 0.9, description: "Final perspective shift or scale revelation" }
    ]
  },
  mystery: {
    name: "Mystery",
    expected_peaks: [0.25, 0.5, 0.75, 0.95],
    expected_emotions: ["curiosity", "suspicion", "confusion", "satisfaction"],
    pacing_pattern: "Clue distribution with rising tension toward revelation",
    key_beats: [
      { position: 0.1, description: "Crime/mystery established" },
      { position: 0.25, description: "First major clue" },
      { position: 0.5, description: "Major complication or red herring" },
      { position: 0.75, description: "All pieces available (reader could solve)" },
      { position: 0.95, description: "Revelation and explanation" }
    ]
  },
  thriller: {
    name: "Thriller",
    expected_peaks: [0.15, 0.4, 0.6, 0.8, 0.95],
    expected_emotions: ["tension", "fear", "urgency", "relief"],
    pacing_pattern: "Escalating tension with brief relief valleys",
    key_beats: [
      { position: 0.15, description: "Danger established, stakes clear" },
      { position: 0.4, description: "First major setback" },
      { position: 0.6, description: "Point of no return" },
      { position: 0.8, description: "Darkest moment / all seems lost" },
      { position: 0.95, description: "Final confrontation and resolution" }
    ]
  },
  horror: {
    name: "Horror",
    expected_peaks: [0.2, 0.5, 0.7, 0.9],
    expected_emotions: ["unease", "dread", "fear", "terror", "horror"],
    pacing_pattern: "Building dread punctuated by terror spikes",
    key_beats: [
      { position: 0.1, description: "Normality before disruption" },
      { position: 0.2, description: "First sign something is wrong" },
      { position: 0.5, description: "Nature of threat becomes clear" },
      { position: 0.7, description: "Escape attempts fail, vulnerability maximum" },
      { position: 0.9, description: "Final confrontation with horror" }
    ]
  },
  drama: {
    name: "Drama",
    expected_peaks: [0.25, 0.5, 0.75, 0.95],
    expected_emotions: ["sympathy", "tension", "catharsis", "transformation"],
    pacing_pattern: "Internal pressure building to transformation",
    key_beats: [
      { position: 0.1, description: "Character's lie/flaw established" },
      { position: 0.25, description: "Inciting pressure on the lie" },
      { position: 0.5, description: "Midpoint - glimpse of truth or false victory" },
      { position: 0.75, description: "Dark night - lie confronted fully" },
      { position: 0.95, description: "Transformation or tragic fall" }
    ]
  },
  adventure: {
    name: "Adventure",
    expected_peaks: [0.15, 0.35, 0.55, 0.75, 0.95],
    expected_emotions: ["excitement", "danger", "triumph", "wonder"],
    pacing_pattern: "Action peaks with brief recovery valleys",
    key_beats: [
      { position: 0.1, description: "Call to adventure" },
      { position: 0.25, description: "First threshold crossed" },
      { position: 0.5, description: "Major challenge overcome" },
      { position: 0.75, description: "Supreme ordeal" },
      { position: 0.95, description: "Victory and return" }
    ]
  },
  relationship: {
    name: "Relationship",
    expected_peaks: [0.2, 0.5, 0.8, 0.95],
    expected_emotions: ["longing", "connection", "conflict", "resolution"],
    pacing_pattern: "Connection-conflict cycles building to resolution",
    key_beats: [
      { position: 0.15, description: "Meet cute / initial connection" },
      { position: 0.35, description: "Growing intimacy" },
      { position: 0.5, description: "Major obstacle or conflict" },
      { position: 0.75, description: "Dark moment / seeming end" },
      { position: 0.95, description: "Resolution (together or apart)" }
    ]
  },
  humor: {
    name: "Humor",
    expected_peaks: [0.1, 0.3, 0.5, 0.7, 0.9],
    expected_emotions: ["amusement", "surprise", "delight", "release"],
    pacing_pattern: "Regular comedic peaks with escalating absurdity",
    key_beats: [
      { position: 0.1, description: "Comedic premise established" },
      { position: 0.35, description: "Complications compound hilariously" },
      { position: 0.6, description: "Situation reaches absurd extreme" },
      { position: 0.8, description: "Darkest/most awkward moment" },
      { position: 0.95, description: "Resolution with final laugh" }
    ]
  }
};

const EMOTION_VOCABULARY = {
  positive: [
    "joy", "triumph", "relief", "hope", "love", "awe", "wonder",
    "satisfaction", "connection", "excitement", "delight", "peace"
  ],
  negative: [
    "fear", "dread", "horror", "grief", "anger", "despair", "tension",
    "anxiety", "disgust", "shame", "loneliness", "betrayal"
  ],
  complex: [
    "bittersweet", "melancholy", "anticipation", "unease", "catharsis",
    "ambivalence", "longing", "resignation", "defiance", "transformation"
  ]
};

// === UTILITIES ===

function createEmptyBeatMap(workName: string, structureType: "acts" | "episodes" | "chapters", unitCount: number): BeatMap {
  return {
    work_name: workName,
    structure_type: structureType,
    unit_count: unitCount,
    primary_genre: "",
    beats: [],
    analysis: {
      peaks: [],
      valleys: [],
      dominant_emotions: [],
      pacing_notes: ""
    }
  };
}

function formatBeatMap(map: BeatMap): string {
  const lines: string[] = [];

  lines.push(`# Emotional Beat Map: ${map.work_name}`);
  lines.push("");
  lines.push(`**Structure:** ${map.unit_count} ${map.structure_type}`);
  lines.push(`**Primary Genre:** ${map.primary_genre || "(not set)"}`);
  lines.push("");

  // Visual timeline
  lines.push("## Timeline");
  lines.push("");
  lines.push("```");
  lines.push("Position  0%   25%   50%   75%   100%");
  lines.push("          |-----|-----|-----|-----|");

  if (map.beats.length > 0) {
    // Sort beats by position
    const sorted = [...map.beats].sort((a, b) => a.position - b.position);
    for (const beat of sorted) {
      const pos = Math.round(beat.position * 100);
      const marker = beat.beat_type === "peak" ? "^" : beat.beat_type === "valley" ? "v" : "-";
      const spacer = " ".repeat(Math.max(0, Math.floor(pos / 5)));
      lines.push(`${pos.toString().padStart(3)}%${spacer}${marker} ${beat.emotion} (${beat.element})`);
    }
  } else {
    lines.push("(No beats mapped yet)");
  }

  lines.push("```");
  lines.push("");

  // Beat details
  if (map.beats.length > 0) {
    lines.push("## Beat Details");
    lines.push("");
    lines.push("| Position | Type | Emotion | Intensity | Element |");
    lines.push("|----------|------|---------|-----------|---------|");
    for (const beat of map.beats.sort((a, b) => a.position - b.position)) {
      const pos = `${Math.round(beat.position * 100)}%`;
      lines.push(`| ${pos} | ${beat.beat_type} | ${beat.emotion} | ${beat.intensity}/10 | ${beat.element} |`);
    }
    lines.push("");
  }

  // Analysis
  if (map.analysis.pacing_notes) {
    lines.push("## Analysis");
    lines.push("");
    lines.push(map.analysis.pacing_notes);
    lines.push("");
  }

  return lines.join("\n");
}

function formatGenreComparison(genres: string[]): string {
  const lines: string[] = [];

  lines.push("# Genre Emotional Expectations Comparison");
  lines.push("");

  for (const genre of genres) {
    const expectations = GENRE_EXPECTATIONS[genre.toLowerCase()];
    if (!expectations) {
      lines.push(`## ${genre}`);
      lines.push("(Unknown genre - no expectations defined)");
      lines.push("");
      continue;
    }

    lines.push(`## ${expectations.name}`);
    lines.push("");
    lines.push(`**Pacing Pattern:** ${expectations.pacing_pattern}`);
    lines.push("");
    lines.push(`**Expected Emotions:** ${expectations.expected_emotions.join(", ")}`);
    lines.push("");
    lines.push("**Key Beats:**");
    for (const beat of expectations.key_beats) {
      lines.push(`- ${Math.round(beat.position * 100)}%: ${beat.description}`);
    }
    lines.push("");
  }

  // Side-by-side if multiple genres
  if (genres.length > 1) {
    lines.push("## Comparison Grid");
    lines.push("");
    lines.push("| Position | " + genres.map(g => GENRE_EXPECTATIONS[g.toLowerCase()]?.name || g).join(" | ") + " |");
    lines.push("|----------|" + genres.map(() => "---").join("|") + "|");

    const positions = [0.1, 0.25, 0.35, 0.5, 0.6, 0.75, 0.8, 0.9, 0.95];
    for (const pos of positions) {
      const cells = genres.map(g => {
        const exp = GENRE_EXPECTATIONS[g.toLowerCase()];
        if (!exp) return "-";
        const beat = exp.key_beats.find(b => Math.abs(b.position - pos) < 0.05);
        return beat ? beat.description.substring(0, 30) : "-";
      });
      lines.push(`| ${Math.round(pos * 100)}% | ${cells.join(" | ")} |`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatTemplate(workName: string, structureType: "acts" | "episodes" | "chapters", unitCount: number): string {
  const lines: string[] = [];

  lines.push(`# Emotional Beat Map Template: ${workName}`);
  lines.push("");
  lines.push(`Structure: ${unitCount} ${structureType}`);
  lines.push("");
  lines.push("## Instructions");
  lines.push("");
  lines.push("For each significant emotional moment, record:");
  lines.push("- Position (0.0 - 1.0)");
  lines.push("- Emotion (what audience should feel)");
  lines.push("- Intensity (1-10)");
  lines.push("- Element (what causes this emotion)");
  lines.push("- Type: peak (high intensity), valley (low/recovery), sustain, shift");
  lines.push("");

  lines.push("## Emotion Vocabulary");
  lines.push("");
  lines.push("**Positive:** " + EMOTION_VOCABULARY.positive.join(", "));
  lines.push("");
  lines.push("**Negative:** " + EMOTION_VOCABULARY.negative.join(", "));
  lines.push("");
  lines.push("**Complex:** " + EMOTION_VOCABULARY.complex.join(", "));
  lines.push("");

  lines.push("## Beat Recording Template");
  lines.push("");

  // Generate position markers based on structure
  const increment = 1 / unitCount;
  for (let i = 0; i <= unitCount; i++) {
    const pos = i * increment;
    const label = structureType === "acts" ? `Act ${i + 1} start` :
                  structureType === "episodes" ? `Episode ${i + 1}` :
                  `Chapter ${i + 1}`;
    lines.push(`### ${Math.round(pos * 100)}% - ${label}`);
    lines.push("");
    lines.push("| Emotion | Intensity | Element | Type |");
    lines.push("|---------|-----------|---------|------|");
    lines.push("|         |           |         |      |");
    lines.push("");
  }

  return lines.join("\n");
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Emotional Beat Map - Timeline Emotional Mapping

Usage:
  deno run --allow-read scripts/emotional-beat-map.ts "Work Name" --acts 5
  deno run --allow-read scripts/emotional-beat-map.ts "Work Name" --episodes 10
  deno run --allow-read scripts/emotional-beat-map.ts "Work Name" --chapters 20
  deno run --allow-read scripts/emotional-beat-map.ts --compare drama,thriller
  deno run --allow-read scripts/emotional-beat-map.ts --genres

Options:
  --acts <n>        Structure as n acts (default for plays)
  --episodes <n>    Structure as n episodes (default for TV)
  --chapters <n>    Structure as n chapters (default for novels)
  --compare <list>  Compare genre expectations (comma-separated)
  --genres          List available genres with expectations
  --json            Output as JSON

Examples:
  # Five-act play template
  deno run --allow-read scripts/emotional-beat-map.ts "Hamlet" --acts 5

  # TV season template
  deno run --allow-read scripts/emotional-beat-map.ts "Killjoys S1" --episodes 10

  # Compare drama and thriller expectations
  deno run --allow-read scripts/emotional-beat-map.ts --compare drama,thriller
`);
    Deno.exit(0);
  }

  const isJson = args.includes("--json");

  // Handle --genres flag
  if (args.includes("--genres")) {
    const genres = Object.keys(GENRE_EXPECTATIONS);
    if (isJson) {
      console.log(JSON.stringify(GENRE_EXPECTATIONS, null, 2));
    } else {
      console.log("Available genres with expectations:");
      for (const genre of genres) {
        const exp = GENRE_EXPECTATIONS[genre];
        console.log(`  ${exp.name}: ${exp.pacing_pattern}`);
      }
    }
    return;
  }

  // Handle --compare flag
  const compareIndex = args.indexOf("--compare");
  if (compareIndex !== -1) {
    const genreList = args[compareIndex + 1];
    if (!genreList) {
      console.error("Error: --compare requires comma-separated genre list");
      Deno.exit(1);
    }
    const genres = genreList.split(",").map(g => g.trim());

    if (isJson) {
      const comparison: Record<string, GenreExpectations | null> = {};
      for (const g of genres) {
        comparison[g] = GENRE_EXPECTATIONS[g.toLowerCase()] || null;
      }
      console.log(JSON.stringify(comparison, null, 2));
    } else {
      console.log(formatGenreComparison(genres));
    }
    return;
  }

  // Parse structure flags
  const actsIndex = args.indexOf("--acts");
  const episodesIndex = args.indexOf("--episodes");
  const chaptersIndex = args.indexOf("--chapters");

  let structureType: "acts" | "episodes" | "chapters" = "acts";
  let unitCount = 5;

  if (actsIndex !== -1 && args[actsIndex + 1]) {
    structureType = "acts";
    unitCount = parseInt(args[actsIndex + 1]);
  } else if (episodesIndex !== -1 && args[episodesIndex + 1]) {
    structureType = "episodes";
    unitCount = parseInt(args[episodesIndex + 1]);
  } else if (chaptersIndex !== -1 && args[chaptersIndex + 1]) {
    structureType = "chapters";
    unitCount = parseInt(args[chaptersIndex + 1]);
  }

  // Find work name (positional argument)
  const skipIndices = new Set<number>();
  for (const idx of [actsIndex, episodesIndex, chaptersIndex, compareIndex]) {
    if (idx !== -1) {
      skipIndices.add(idx);
      skipIndices.add(idx + 1);
    }
  }

  let workName: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      workName = args[i];
      break;
    }
  }

  if (!workName) {
    console.error("Error: Please provide a work name");
    console.error("Usage: deno run --allow-read scripts/emotional-beat-map.ts \"Work Name\" --acts 5");
    Deno.exit(1);
  }

  // Generate template
  if (isJson) {
    const map = createEmptyBeatMap(workName, structureType, unitCount);
    console.log(JSON.stringify(map, null, 2));
  } else {
    console.log(formatTemplate(workName, structureType, unitCount));
  }
}

main();
