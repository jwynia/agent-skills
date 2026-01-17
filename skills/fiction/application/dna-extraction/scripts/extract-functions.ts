#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Extract Functions
 *
 * Interactive questionnaire for DNA extraction from existing works.
 * Guides through six-axis function analysis at configurable depth.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/extract-functions.ts "Work Name"
 *   deno run --allow-read --allow-write scripts/extract-functions.ts "Work Name" --depth quick
 *   deno run --allow-read --allow-write scripts/extract-functions.ts --element "The Ghost"
 *   deno run --allow-read --allow-write scripts/extract-functions.ts --validate extraction.json
 *   deno run --allow-read --allow-write scripts/extract-functions.ts --template
 */

// === INTERFACES ===

interface EmotionalBeat {
  position: number;
  emotion: string;
  element: string;
}

interface TonalShift {
  trigger: string;
  shift: string;
}

interface CharacterVoice {
  speech_patterns: string;
  verbal_tics: string;
  formality_level: string;
  subtext_tendency: string;
}

interface CharacterFunctions {
  structural: string[];
  character: string[];
  emotional: string[];
  thematic: string[];
  relational: string[];
}

interface Character {
  form: string;
  functions: CharacterFunctions;
  voice?: CharacterVoice;
  structural_necessity: string;
  adaptable_elements: string[];
}

interface PlotStructure {
  form: string;
  functions: {
    structural: string[];
    character: string[];
    emotional: string[];
    thematic: string[];
  };
  timing: string;
  structural_necessity: string;
  adaptable_elements: string[];
}

interface Relationship {
  characters: string[];
  form: string;
  functions: {
    structural: string[];
    character: string[];
    emotional: string[];
    thematic: string[];
  };
  evolution: string[];
  structural_necessity: string;
}

interface Tone {
  sincerity_level: string;
  humor_mode: string;
  emotional_expression: string;
  dialogue_density: string;
  conflict_style: string;
  baseline_tone: string;
  tonal_shifts: TonalShift[];
}

interface EmotionalCore {
  primary_genre: string;
  secondary_genres: string[];
  emotional_experience: string;
  emotional_beats: EmotionalBeat[];
}

interface ExtractionMeta {
  type: "work-extraction";
  source_work: string;
  source_author: string;
  source_medium: string;
  extraction_date: string;
  extraction_depth: "quick" | "standard" | "detailed";
  clusters: string[];
}

interface ExtractionLinks {
  clusters: string[];
  similar_works: string[];
  derived_syntheses: string[];
}

interface WorkExtraction {
  _meta: ExtractionMeta;
  emotional_core: EmotionalCore;
  tone: Tone;
  characters: Record<string, Character>;
  plot_structures: Record<string, PlotStructure>;
  relationships: Record<string, Relationship>;
  structural_requirements: string[];
  adaptable_without_breaking: string[];
  links: ExtractionLinks;
}

interface ElementExtraction {
  element_name: string;
  element_type: "character" | "plot" | "setting" | "relationship" | "other";
  form: string;
  functions: {
    structural: string[];
    character: string[];
    emotional: string[];
    thematic: string[];
    relational: string[];
  };
  structural_necessity: "high" | "medium" | "low";
  adaptable_elements: string[];
}

type Depth = "quick" | "standard" | "detailed";

// === DATA ===

const EXTRACTION_QUESTIONS = {
  structural: [
    "What would break in the plot if we removed this?",
    "What information does this control or reveal?",
    "What does this force to happen?",
    "What does this prevent from happening prematurely?"
  ],
  character: [
    "What does this reveal about any character?",
    "How does this challenge or change a character?",
    "What choice does this force?",
    "Who does this illuminate through contrast?"
  ],
  emotional: [
    "What should the audience feel here?",
    "How does this serve the genre promise?",
    "Is this a peak, valley, or sustain moment?",
    "What would be lost emotionally without this?"
  ],
  thematic: [
    "What question does this raise or address?",
    "What value does this test?",
    "What does this symbolize?",
    "How does this complicate or reinforce the theme?"
  ],
  relational: [
    "What connection does this create or strengthen?",
    "What tension does this generate between characters?",
    "How does this change the relationship web?",
    "What contrast does this establish?"
  ]
};

const GENRE_OPTIONS = [
  "wonder", "idea", "adventure", "horror", "mystery",
  "thriller", "humor", "relationship", "drama", "issue", "ensemble"
];

const SINCERITY_OPTIONS = [
  "high (earnest, characters mean what they say)",
  "medium (mix of sincere and ironic)",
  "low (ironic, detached, subtext-heavy)"
];

const HUMOR_MODES = [
  "banter/quips", "deadpan", "physical/slapstick", "dark/gallows",
  "absurdist", "satirical", "minimal/serious"
];

const CONFLICT_STYLES = [
  "verbal sparring", "cold silence", "explosive outbursts",
  "passive aggression", "physical violence", "avoidant/deflecting"
];

// === UTILITIES ===

function formatDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function createEmptyExtraction(workName: string, depth: Depth): WorkExtraction {
  return {
    _meta: {
      type: "work-extraction",
      source_work: workName,
      source_author: "",
      source_medium: "",
      extraction_date: formatDate(),
      extraction_depth: depth,
      clusters: []
    },
    emotional_core: {
      primary_genre: "",
      secondary_genres: [],
      emotional_experience: "",
      emotional_beats: []
    },
    tone: {
      sincerity_level: "",
      humor_mode: "",
      emotional_expression: "",
      dialogue_density: "",
      conflict_style: "",
      baseline_tone: "",
      tonal_shifts: []
    },
    characters: {},
    plot_structures: {},
    relationships: {},
    structural_requirements: [],
    adaptable_without_breaking: [],
    links: {
      clusters: [],
      similar_works: [],
      derived_syntheses: []
    }
  };
}

function createEmptyElement(name: string, type: ElementExtraction["element_type"]): ElementExtraction {
  return {
    element_name: name,
    element_type: type,
    form: "",
    functions: {
      structural: [],
      character: [],
      emotional: [],
      thematic: [],
      relational: []
    },
    structural_necessity: "medium",
    adaptable_elements: []
  };
}

function formatExtraction(extraction: WorkExtraction): string {
  const lines: string[] = [];

  lines.push("# DNA Extraction: " + extraction._meta.source_work);
  lines.push("");
  lines.push(`**Author:** ${extraction._meta.source_author || "(not specified)"}`);
  lines.push(`**Medium:** ${extraction._meta.source_medium || "(not specified)"}`);
  lines.push(`**Extraction Depth:** ${extraction._meta.extraction_depth}`);
  lines.push(`**Date:** ${extraction._meta.extraction_date}`);
  lines.push("");

  // Emotional Core
  lines.push("## Emotional Core");
  lines.push("");
  lines.push(`**Primary Genre:** ${extraction.emotional_core.primary_genre || "(not identified)"}`);
  if (extraction.emotional_core.secondary_genres.length > 0) {
    lines.push(`**Secondary Genres:** ${extraction.emotional_core.secondary_genres.join(", ")}`);
  }
  lines.push("");
  lines.push(`**Emotional Experience:** ${extraction.emotional_core.emotional_experience || "(not described)"}`);
  lines.push("");

  if (extraction.emotional_core.emotional_beats.length > 0) {
    lines.push("### Emotional Beats");
    for (const beat of extraction.emotional_core.emotional_beats) {
      lines.push(`- **${Math.round(beat.position * 100)}%:** ${beat.emotion} (${beat.element})`);
    }
    lines.push("");
  }

  // Tone
  if (extraction.tone.baseline_tone) {
    lines.push("## Tone Profile");
    lines.push("");
    lines.push(`**Baseline:** ${extraction.tone.baseline_tone}`);
    lines.push(`**Sincerity:** ${extraction.tone.sincerity_level}`);
    lines.push(`**Humor Mode:** ${extraction.tone.humor_mode}`);
    lines.push(`**Emotional Expression:** ${extraction.tone.emotional_expression}`);
    lines.push(`**Dialogue Density:** ${extraction.tone.dialogue_density}`);
    lines.push(`**Conflict Style:** ${extraction.tone.conflict_style}`);
    lines.push("");
  }

  // Characters
  const charNames = Object.keys(extraction.characters);
  if (charNames.length > 0) {
    lines.push("## Characters");
    lines.push("");
    for (const name of charNames) {
      const char = extraction.characters[name];
      lines.push(`### ${name}`);
      lines.push(`**Form:** ${char.form}`);
      lines.push(`**Necessity:** ${char.structural_necessity}`);
      lines.push("");

      if (char.functions.structural.length > 0) {
        lines.push("**Structural Functions:**");
        for (const f of char.functions.structural) {
          lines.push(`- ${f}`);
        }
      }
      if (char.functions.character.length > 0) {
        lines.push("**Character Functions:**");
        for (const f of char.functions.character) {
          lines.push(`- ${f}`);
        }
      }
      if (char.functions.emotional.length > 0) {
        lines.push("**Emotional Functions:**");
        for (const f of char.functions.emotional) {
          lines.push(`- ${f}`);
        }
      }
      if (char.functions.relational.length > 0) {
        lines.push("**Relational Functions:**");
        for (const f of char.functions.relational) {
          lines.push(`- ${f}`);
        }
      }
      if (char.adaptable_elements.length > 0) {
        lines.push(`**Adaptable:** ${char.adaptable_elements.join(", ")}`);
      }
      lines.push("");
    }
  }

  // Structural Requirements
  if (extraction.structural_requirements.length > 0) {
    lines.push("## Structural Requirements");
    lines.push("");
    for (const req of extraction.structural_requirements) {
      lines.push(`- ${req}`);
    }
    lines.push("");
  }

  // Adaptable Elements
  if (extraction.adaptable_without_breaking.length > 0) {
    lines.push("## Adaptable Without Breaking");
    lines.push("");
    for (const elem of extraction.adaptable_without_breaking) {
      lines.push(`- ${elem}`);
    }
    lines.push("");
  }

  // Clusters
  if (extraction._meta.clusters.length > 0) {
    lines.push("## Cluster Memberships");
    lines.push("");
    for (const cluster of extraction._meta.clusters) {
      lines.push(`- ${cluster}`);
    }
    lines.push("");
  }

  return lines.join("\n");
}

function formatElementExtraction(element: ElementExtraction): string {
  const lines: string[] = [];

  lines.push(`# Element Extraction: ${element.element_name}`);
  lines.push("");
  lines.push(`**Type:** ${element.element_type}`);
  lines.push(`**Form:** ${element.form}`);
  lines.push(`**Structural Necessity:** ${element.structural_necessity}`);
  lines.push("");

  const axes = ["structural", "character", "emotional", "thematic", "relational"] as const;
  for (const axis of axes) {
    const funcs = element.functions[axis];
    if (funcs.length > 0) {
      lines.push(`## ${axis.charAt(0).toUpperCase() + axis.slice(1)} Functions`);
      for (const f of funcs) {
        lines.push(`- ${f}`);
      }
      lines.push("");
    }
  }

  if (element.adaptable_elements.length > 0) {
    lines.push("## Adaptable Elements");
    for (const elem of element.adaptable_elements) {
      lines.push(`- ${elem}`);
    }
  }

  return lines.join("\n");
}

function formatQuestionnaire(workName: string, depth: Depth): string {
  const lines: string[] = [];

  lines.push(`# DNA Extraction Questionnaire: ${workName}`);
  lines.push(`**Depth:** ${depth}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Emotional Core Questions
  lines.push("## 1. Emotional Core");
  lines.push("");
  lines.push("### Primary Genre");
  lines.push("What emotional experience does this work primarily deliver?");
  lines.push(`Options: ${GENRE_OPTIONS.join(", ")}`);
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("### Secondary Genres (if any)");
  lines.push("What other emotional experiences does it layer in?");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("### Emotional Experience");
  lines.push("In one sentence, what does someone who LOVES this work love about it?");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  if (depth !== "quick") {
    lines.push("### Emotional Beats");
    lines.push("List 5-10 key emotional moments with approximate position (0.0-1.0):");
    lines.push("Format: position | emotion | element");
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");
  }

  // Tone Questions (standard+)
  if (depth !== "quick") {
    lines.push("---");
    lines.push("");
    lines.push("## 2. Tone Profile");
    lines.push("");

    lines.push("### Sincerity Level");
    lines.push("How earnest vs. ironic is the work?");
    for (const opt of SINCERITY_OPTIONS) {
      lines.push(`- ${opt}`);
    }
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");

    lines.push("### Humor Mode");
    lines.push("When humor appears, what form does it take?");
    lines.push(`Options: ${HUMOR_MODES.join(", ")}`);
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");

    lines.push("### Emotional Expression");
    lines.push("How do characters show/hide their feelings?");
    lines.push("(direct statement, subtext-heavy, action-reveals-feeling, denial/deflection)");
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");

    lines.push("### Dialogue Density");
    lines.push("Talk-to-action ratio? (quippy/rapid-fire, balanced, sparse/weighted silence)");
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");

    lines.push("### Conflict Style");
    lines.push("How do characters fight?");
    lines.push(`Options: ${CONFLICT_STYLES.join(", ")}`);
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");

    lines.push("### Baseline Tone");
    lines.push("Describe the default emotional register in a phrase:");
    lines.push("");
    lines.push("**Your answer:**");
    lines.push("");
  }

  // Character Questions
  lines.push("---");
  lines.push("");
  lines.push(`## 3. Characters (${depth === "quick" ? "3-5 main" : "all significant"})`);
  lines.push("");
  lines.push("For each character, answer:");
  lines.push("");
  lines.push("### Character: [NAME]");
  lines.push("");
  lines.push("**Form:** What are they on the surface?");
  lines.push("");

  for (const [axis, questions] of Object.entries(EXTRACTION_QUESTIONS)) {
    lines.push(`**${axis.charAt(0).toUpperCase() + axis.slice(1)} Function:**`);
    for (const q of questions) {
      lines.push(`- ${q}`);
    }
    lines.push("");
  }

  lines.push("**Structural Necessity:** high/medium/low");
  lines.push("**Adaptable Elements:** What about them could change?");
  lines.push("");
  lines.push("(Repeat for each character)");
  lines.push("");

  // Structural Requirements
  lines.push("---");
  lines.push("");
  lines.push("## 4. Structural Requirements");
  lines.push("");
  lines.push("What MUST be present for the story to work? (Not forms, but functions)");
  lines.push("Example: 'Protagonist must have privileged information others lack'");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  // Adaptable Elements
  lines.push("---");
  lines.push("");
  lines.push("## 5. Adaptable Without Breaking");
  lines.push("");
  lines.push("What could change completely without breaking what makes this work?");
  lines.push("Example: 'Royal setting', 'Time period', 'Character genders'");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  // Cluster Membership
  lines.push("---");
  lines.push("");
  lines.push("## 6. Cluster Membership");
  lines.push("");
  lines.push("What trope patterns does this belong to?");
  lines.push("Example: 'revenge-tragedy', 'found-family', 'bounty-hunter-scifi'");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  return lines.join("\n");
}

function validateExtraction(extraction: WorkExtraction): { valid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check required fields
  if (!extraction._meta.source_work) {
    issues.push("Missing source work name");
  }

  if (!extraction.emotional_core.primary_genre) {
    issues.push("Missing primary genre - emotional core not identified");
  }

  if (!extraction.emotional_core.emotional_experience) {
    issues.push("Missing emotional experience description");
  }

  // Check for characters
  const charCount = Object.keys(extraction.characters).length;
  if (charCount === 0) {
    issues.push("No characters extracted");
  } else {
    // Check each character
    for (const [name, char] of Object.entries(extraction.characters)) {
      const allFunctions = [
        ...char.functions.structural,
        ...char.functions.character,
        ...char.functions.emotional,
        ...char.functions.thematic,
        ...char.functions.relational
      ];
      if (allFunctions.length === 0) {
        issues.push(`Character '${name}' has no functions extracted`);
      }
      if (!char.structural_necessity) {
        issues.push(`Character '${name}' missing structural necessity rating`);
      }
    }
  }

  // Check structural requirements
  if (extraction.structural_requirements.length === 0) {
    issues.push("No structural requirements identified");
  }

  // Check adaptable elements
  if (extraction.adaptable_without_breaking.length === 0) {
    issues.push("No adaptable elements identified - likely over-restricting");
  }

  // Depth-specific checks
  if (extraction._meta.extraction_depth !== "quick") {
    if (!extraction.tone.baseline_tone) {
      issues.push("Standard/detailed extraction missing tone profile");
    }
    if (extraction.emotional_core.emotional_beats.length === 0) {
      issues.push("Standard/detailed extraction missing emotional beats");
    }
  }

  return {
    valid: issues.length === 0,
    issues
  };
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Extract Functions - DNA Extraction Tool

Usage:
  deno run --allow-read --allow-write scripts/extract-functions.ts "Work Name"
  deno run --allow-read --allow-write scripts/extract-functions.ts "Work Name" --depth quick
  deno run --allow-read --allow-write scripts/extract-functions.ts --element "The Ghost"
  deno run --allow-read --allow-write scripts/extract-functions.ts --validate extraction.json
  deno run --allow-read --allow-write scripts/extract-functions.ts --template

Options:
  --depth <level>    Extraction depth: quick, standard, detailed (default: standard)
  --element <name>   Extract single element instead of full work
  --validate <file>  Validate existing extraction file
  --template         Output blank extraction template
  --json             Output as JSON instead of markdown
  --questionnaire    Output questionnaire format for manual completion

Depth Levels:
  quick     - 15-30 min: Core functions, primary genre, 3-5 characters
  standard  - 1-3 hours: Full extraction with tone and relationships
  detailed  - 4-8 hours: Scene-level, episode structures, voice patterns

Examples:
  # Generate questionnaire for Hamlet
  deno run --allow-read scripts/extract-functions.ts "Hamlet" --questionnaire

  # Quick extraction template
  deno run --allow-read scripts/extract-functions.ts "Killjoys" --depth quick --template

  # Validate completed extraction
  deno run --allow-read scripts/extract-functions.ts --validate hamlet.json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const depthIndex = args.indexOf("--depth");
  const depth: Depth = depthIndex !== -1 && args[depthIndex + 1]
    ? args[depthIndex + 1] as Depth
    : "standard";

  const elementIndex = args.indexOf("--element");
  const elementName = elementIndex !== -1 ? args[elementIndex + 1] : null;

  const validateIndex = args.indexOf("--validate");
  const validateFile = validateIndex !== -1 ? args[validateIndex + 1] : null;

  const isTemplate = args.includes("--template");
  const isJson = args.includes("--json");
  const isQuestionnaire = args.includes("--questionnaire");

  // Track consumed indices for positional arg detection
  const skipIndices = new Set<number>();
  if (depthIndex !== -1) {
    skipIndices.add(depthIndex);
    skipIndices.add(depthIndex + 1);
  }
  if (elementIndex !== -1) {
    skipIndices.add(elementIndex);
    skipIndices.add(elementIndex + 1);
  }
  if (validateIndex !== -1) {
    skipIndices.add(validateIndex);
    skipIndices.add(validateIndex + 1);
  }

  // Find positional argument (work name)
  let workName: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      workName = args[i];
      break;
    }
  }

  // Handle validation mode
  if (validateFile) {
    try {
      const content = Deno.readTextFileSync(validateFile);
      const extraction = JSON.parse(content) as WorkExtraction;
      const result = validateExtraction(extraction);

      if (isJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log(`\nValidation Result: ${result.valid ? "PASS" : "FAIL"}\n`);
        if (result.issues.length > 0) {
          console.log("Issues found:");
          for (const issue of result.issues) {
            console.log(`  - ${issue}`);
          }
        } else {
          console.log("Extraction is complete and ready for synthesis.");
        }
      }
    } catch (e) {
      console.error(`Error reading/parsing ${validateFile}: ${e}`);
      Deno.exit(1);
    }
    return;
  }

  // Handle element extraction mode
  if (elementName) {
    const element = createEmptyElement(elementName, "other");

    if (isJson) {
      console.log(JSON.stringify(element, null, 2));
    } else {
      console.log(formatElementExtraction(element));
      console.log("\n---\n");
      console.log("## Extraction Questions\n");
      for (const [axis, questions] of Object.entries(EXTRACTION_QUESTIONS)) {
        console.log(`### ${axis.charAt(0).toUpperCase() + axis.slice(1)}`);
        for (const q of questions) {
          console.log(`- ${q}`);
        }
        console.log("");
      }
    }
    return;
  }

  // Need work name for remaining modes
  if (!workName) {
    console.error("Error: Please provide a work name or use --validate/--element flags");
    console.error("Usage: deno run --allow-read scripts/extract-functions.ts \"Work Name\"");
    Deno.exit(1);
  }

  // Handle questionnaire mode
  if (isQuestionnaire) {
    console.log(formatQuestionnaire(workName, depth));
    return;
  }

  // Handle template mode
  const extraction = createEmptyExtraction(workName, depth);

  if (isJson) {
    console.log(JSON.stringify(extraction, null, 2));
  } else if (isTemplate) {
    console.log(JSON.stringify(extraction, null, 2));
  } else {
    // Default: output formatted markdown template with guidance
    console.log(formatExtraction(extraction));
    console.log("\n---\n");
    console.log("## Next Steps\n");
    console.log("1. Use --questionnaire flag for guided extraction");
    console.log("2. Fill in extraction fields");
    console.log("3. Use --validate to check completeness");
    console.log(`\nExample: deno run --allow-read scripts/extract-functions.ts "${workName}" --questionnaire`);
  }
}

main();
