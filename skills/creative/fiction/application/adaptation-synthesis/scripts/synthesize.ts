#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Synthesize
 *
 * Interactive synthesis session from DNA documents.
 * Guides function-to-form mapping for adaptation projects.
 *
 * Usage:
 *   deno run --allow-read scripts/synthesize.ts source.json --context "corporate dystopia"
 *   deno run --allow-read scripts/synthesize.ts source1.json source2.json --primary source1
 *   deno run --allow-read scripts/synthesize.ts --template
 */

// === INTERFACES ===

interface SynthesisMeta {
  type: "synthesis";
  synthesis_name: string;
  target_context: string;
  primary_source: string;
  secondary_sources: string[];
  target_genre: string;
  synthesis_date: string;
}

interface ContextMapping {
  setting: string;
  power_structure: string;
  information_control: string;
  escape_prevention: string;
  typical_conflicts: string;
}

interface FunctionMapping {
  original_form: string;
  new_form: string;
  orthogonality_check: string;
  functions_served: string[];
}

interface ToneSynthesis {
  original_tone: string;
  adapted_tone: string;
  sincerity_level: string;
  conflict_style: string;
}

interface CharacterSynthesis {
  new_name: string;
  original_functions_from: string;
  new_form: string;
  arc: string;
}

interface SynthesisDocument {
  _meta: SynthesisMeta;
  context_mapping: ContextMapping;
  function_to_form_mapping: Record<string, FunctionMapping>;
  tone_synthesis: ToneSynthesis;
  character_synthesis: Record<string, CharacterSynthesis>;
  validation: Record<string, string>;
  ready_for: string;
}

interface DNADocument {
  _meta: {
    source_work: string;
    source_author?: string;
    extraction_depth: string;
  };
  emotional_core: {
    primary_genre: string;
    secondary_genres: string[];
    emotional_experience: string;
  };
  tone?: {
    sincerity_level: string;
    conflict_style: string;
    baseline_tone: string;
  };
  structural_requirements?: string[];
  characters?: Record<string, {
    form: string;
    functions: Record<string, string[]>;
  }>;
}

// === UTILITIES ===

function formatDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

function createEmptySynthesis(
  sourceName: string,
  context: string,
  genre: string
): SynthesisDocument {
  return {
    _meta: {
      type: "synthesis",
      synthesis_name: `${sourceName} in ${context}`,
      target_context: context,
      primary_source: sourceName,
      secondary_sources: [],
      target_genre: genre,
      synthesis_date: formatDate()
    },
    context_mapping: {
      setting: "",
      power_structure: "",
      information_control: "",
      escape_prevention: "",
      typical_conflicts: ""
    },
    function_to_form_mapping: {},
    tone_synthesis: {
      original_tone: "",
      adapted_tone: "",
      sincerity_level: "",
      conflict_style: ""
    },
    character_synthesis: {},
    validation: {
      genre_check: "pending",
      function_coverage: "pending",
      orthogonality_check: "pending",
      context_coherence: "pending"
    },
    ready_for: "in-progress"
  };
}

function formatSynthesisWorksheet(synthesis: SynthesisDocument, source: DNADocument | null): string {
  const lines: string[] = [];

  lines.push(`# Synthesis Worksheet: ${synthesis._meta.synthesis_name}`);
  lines.push("");
  lines.push(`**Primary Source:** ${synthesis._meta.primary_source}`);
  lines.push(`**Target Context:** ${synthesis._meta.target_context}`);
  lines.push(`**Target Genre:** ${synthesis._meta.target_genre}`);
  lines.push(`**Date:** ${synthesis._meta.synthesis_date}`);
  lines.push("");

  lines.push("---");
  lines.push("");

  // Section 1: Context Mapping
  lines.push("## 1. Context Mapping");
  lines.push("");
  lines.push("Define what elements in your target context will serve source functions.");
  lines.push("");
  lines.push("### Setting");
  lines.push("Where does this take place? Be specific about location, time period, social milieu.");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("### Power Structure");
  lines.push("How is power organized? Who has it? How is it contested?");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("### Information Control");
  lines.push("How is information controlled, shared, hidden? What makes something secret?");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("### Escape Prevention");
  lines.push("Why can't characters just leave? What traps them in the situation?");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("### Typical Conflicts");
  lines.push("What conflicts naturally arise in this context?");
  lines.push("");
  lines.push("**Your answer:**");
  lines.push("");

  lines.push("---");
  lines.push("");

  // Section 2: Function Mapping
  lines.push("## 2. Function-to-Form Mapping");
  lines.push("");
  lines.push("For each key function from the source, define a new form in your context.");
  lines.push("");
  lines.push("**Remember the orthogonality test:** Does the new form exist for its own reasons?");
  lines.push("Would someone unfamiliar with the source find it believable?");
  lines.push("");

  // If we have source DNA, list its structural requirements
  if (source?.structural_requirements) {
    lines.push("### Source Structural Requirements");
    lines.push("");
    for (const req of source.structural_requirements) {
      lines.push(`- ${req}`);
    }
    lines.push("");
    lines.push("### Map Each Requirement");
    lines.push("");

    for (const req of source.structural_requirements) {
      const shortName = req.substring(0, 40) + (req.length > 40 ? "..." : "");
      lines.push(`#### Function: "${shortName}"`);
      lines.push("");
      lines.push("**Original form in source:** ");
      lines.push("");
      lines.push("**New form in your context:** ");
      lines.push("");
      lines.push("**Orthogonality check:** Does this form exist for its own reasons? (yes/no/needs work)");
      lines.push("");
      lines.push("**Functions served:** (list what this enables)");
      lines.push("- ");
      lines.push("");
    }
  } else {
    lines.push("### Key Functions to Map");
    lines.push("");
    lines.push("(Add functions from your source extraction)");
    lines.push("");
    lines.push("#### Function: \"[describe function]\"");
    lines.push("");
    lines.push("**Original form in source:** ");
    lines.push("");
    lines.push("**New form in your context:** ");
    lines.push("");
    lines.push("**Orthogonality check:** ");
    lines.push("");
    lines.push("**Functions served:**");
    lines.push("- ");
    lines.push("");
  }

  lines.push("---");
  lines.push("");

  // Section 3: Tone Synthesis
  lines.push("## 3. Tone Synthesis");
  lines.push("");

  if (source?.tone) {
    lines.push("### Source Tone");
    lines.push(`- Sincerity: ${source.tone.sincerity_level}`);
    lines.push(`- Conflict style: ${source.tone.conflict_style}`);
    lines.push(`- Baseline: ${source.tone.baseline_tone}`);
    lines.push("");
  }

  lines.push("### Adapted Tone");
  lines.push("");
  lines.push("**Original tone summary:**");
  lines.push("");
  lines.push("**How will you adapt it to your context?**");
  lines.push("");
  lines.push("**Sincerity level:** (high/medium/low)");
  lines.push("");
  lines.push("**Conflict style:** (verbal sparring, cold silence, explosive, etc.)");
  lines.push("");

  lines.push("---");
  lines.push("");

  // Section 4: Character Synthesis
  lines.push("## 4. Character Synthesis");
  lines.push("");

  if (source?.characters) {
    lines.push("### Source Characters");
    lines.push("");
    for (const [name, char] of Object.entries(source.characters)) {
      lines.push(`#### ${name}`);
      lines.push(`Original form: ${char.form}`);
      if (char.functions?.structural) {
        lines.push("Key functions: " + char.functions.structural.slice(0, 2).join("; "));
      }
      lines.push("");
    }
    lines.push("");
  }

  lines.push("### Your Adapted Characters");
  lines.push("");
  lines.push("#### Protagonist");
  lines.push("");
  lines.push("**New name:**");
  lines.push("");
  lines.push("**Based on functions from:** (source character name)");
  lines.push("");
  lines.push("**New form:** (describe who they are in your context)");
  lines.push("");
  lines.push("**Arc:** (brief transformation description)");
  lines.push("");
  lines.push("(Repeat for other key characters)");
  lines.push("");

  lines.push("---");
  lines.push("");

  // Section 5: Validation
  lines.push("## 5. Validation Checklist");
  lines.push("");
  lines.push("Before proceeding, verify:");
  lines.push("");
  lines.push("- [ ] **Genre check:** Does this deliver " + synthesis._meta.target_genre + " emotional experience?");
  lines.push("- [ ] **Function coverage:** Are all structural requirements from source addressed?");
  lines.push("- [ ] **Orthogonality check:** Do all new forms exist for their own reasons?");
  lines.push("- [ ] **Context coherence:** Do all elements fit naturally in the target context?");
  lines.push("- [ ] **Tone alignment:** Does the adapted tone serve the emotional experience?");
  lines.push("");

  lines.push("---");
  lines.push("");
  lines.push("## When Complete");
  lines.push("");
  lines.push("Run validation: `deno run --allow-read scripts/validate-synthesis.ts your-synthesis.json`");
  lines.push("");
  lines.push("Then proceed to outline-collaborator or drafting skill.");

  return lines.join("\n");
}

function formatSynthesisTemplate(): string {
  return JSON.stringify({
    _meta: {
      type: "synthesis",
      synthesis_name: "Your Synthesis Name",
      target_context: "describe target context",
      primary_source: "source-dna.json",
      secondary_sources: [],
      target_genre: "drama",
      synthesis_date: formatDate()
    },
    context_mapping: {
      setting: "Where and when",
      power_structure: "How power is organized",
      information_control: "How secrets work",
      escape_prevention: "Why characters can't leave",
      typical_conflicts: "What conflicts arise naturally"
    },
    function_to_form_mapping: {
      "function_name": {
        original_form: "what it was in source",
        new_form: "what it is in your version",
        orthogonality_check: "pass/fail/needs work",
        functions_served: ["list", "of", "functions"]
      }
    },
    tone_synthesis: {
      original_tone: "describe source tone",
      adapted_tone: "describe your tone",
      sincerity_level: "high/medium/low",
      conflict_style: "how characters fight"
    },
    character_synthesis: {
      protagonist: {
        new_name: "Character Name",
        original_functions_from: "source character",
        new_form: "who they are in your context",
        arc: "their transformation"
      }
    },
    validation: {
      genre_check: "pending",
      function_coverage: "pending",
      orthogonality_check: "pending",
      context_coherence: "pending"
    },
    ready_for: "in-progress"
  }, null, 2);
}

function formatCombinationGuidance(primary: string, secondary: string[]): string {
  const lines: string[] = [];

  lines.push("# Combining Multiple Sources");
  lines.push("");
  lines.push(`**Primary source:** ${primary}`);
  lines.push(`**Secondary sources:** ${secondary.join(", ")}`);
  lines.push("");

  lines.push("## Combination Rules");
  lines.push("");
  lines.push("1. **Primary source functions take precedence** when sources conflict");
  lines.push("2. **Secondary sources add flavor**, not structure");
  lines.push("3. **Identify conflicts early** - where do sources want different things?");
  lines.push("");

  lines.push("## Conflict Resolution Options");
  lines.push("");
  lines.push("When functions conflict, choose one approach:");
  lines.push("");
  lines.push("- **Primary wins:** Keep primary's version, drop secondary's");
  lines.push("- **Blend:** Find middle ground that partially serves both");
  lines.push("- **Alternate:** Different parts of work serve different sources");
  lines.push("- **Transform:** Conflict becomes a feature (tension between approaches)");
  lines.push("");

  lines.push("## Process");
  lines.push("");
  lines.push("1. List all functions from primary source");
  lines.push("2. List functions from secondary sources");
  lines.push("3. Identify overlaps (complementary)");
  lines.push("4. Identify conflicts (incompatible)");
  lines.push("5. Resolve each conflict using options above");
  lines.push("6. Proceed with combined function list");
  lines.push("");

  return lines.join("\n");
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Synthesize - DNA Synthesis Tool

Usage:
  deno run --allow-read scripts/synthesize.ts source.json --context "corporate dystopia"
  deno run --allow-read scripts/synthesize.ts source1.json source2.json --primary source1.json
  deno run --allow-read scripts/synthesize.ts --template
  deno run --allow-read scripts/synthesize.ts --function "proximity to power" --context scifi

Options:
  --context <desc>   Target context/setting for synthesis
  --genre <name>     Target genre (default: from source)
  --primary <file>   When combining sources, which is primary
  --template         Output blank synthesis template (JSON)
  --worksheet        Output guided worksheet (markdown)
  --json             Output as JSON instead of markdown
  --function <name>  Generate form options for specific function (uses form-options)

Examples:
  # Start synthesis worksheet from Hamlet extraction
  deno run --allow-read scripts/synthesize.ts hamlet.json --context "corporate dystopia" --worksheet

  # Get blank template
  deno run --allow-read scripts/synthesize.ts --template

  # Combine two sources
  deno run --allow-read scripts/synthesize.ts hamlet.json killjoys.json --primary hamlet.json --context scifi
`);
    Deno.exit(0);
  }

  const isJson = args.includes("--json");
  const isWorksheet = args.includes("--worksheet");
  const isTemplate = args.includes("--template");

  // Handle --template
  if (isTemplate) {
    console.log(formatSynthesisTemplate());
    return;
  }

  // Parse arguments
  const contextIndex = args.indexOf("--context");
  const context = contextIndex !== -1 ? args[contextIndex + 1] : null;

  const genreIndex = args.indexOf("--genre");
  const genre = genreIndex !== -1 ? args[genreIndex + 1] : null;

  const primaryIndex = args.indexOf("--primary");
  const primaryFile = primaryIndex !== -1 ? args[primaryIndex + 1] : null;

  // Find source files (positional arguments)
  const skipIndices = new Set<number>();
  for (const idx of [contextIndex, genreIndex, primaryIndex]) {
    if (idx !== -1) {
      skipIndices.add(idx);
      skipIndices.add(idx + 1);
    }
  }

  const sourceFiles: string[] = [];
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i) && args[i].endsWith(".json")) {
      sourceFiles.push(args[i]);
    }
  }

  if (sourceFiles.length === 0) {
    console.error("Error: Please provide at least one source DNA file");
    console.error("Usage: deno run --allow-read scripts/synthesize.ts source.json --context \"corporate\"");
    console.error("       deno run --allow-read scripts/synthesize.ts --template");
    Deno.exit(1);
  }

  if (!context) {
    console.error("Error: Please provide target context with --context");
    console.error("Example: --context \"corporate dystopia\"");
    Deno.exit(1);
  }

  // Load primary source
  const primarySource = primaryFile || sourceFiles[0];
  let source: DNADocument | null = null;

  try {
    const content = Deno.readTextFileSync(primarySource);
    source = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading source file ${primarySource}: ${e}`);
    Deno.exit(1);
  }

  // Determine genre
  const targetGenre = genre || source?.emotional_core?.primary_genre || "drama";

  // Create synthesis document
  const sourceName = source?._meta?.source_work || primarySource.replace(".json", "");
  const synthesis = createEmptySynthesis(sourceName, context, targetGenre);

  // Add secondary sources if multiple files
  if (sourceFiles.length > 1) {
    synthesis._meta.secondary_sources = sourceFiles.filter(f => f !== primarySource);
  }

  // Output
  if (sourceFiles.length > 1 && !isWorksheet && !isJson) {
    // Show combination guidance first
    console.log(formatCombinationGuidance(primarySource, synthesis._meta.secondary_sources));
    console.log("\n---\n");
  }

  if (isJson) {
    console.log(JSON.stringify(synthesis, null, 2));
  } else if (isWorksheet || true) {
    // Default to worksheet
    console.log(formatSynthesisWorksheet(synthesis, source));
  }
}

main();
