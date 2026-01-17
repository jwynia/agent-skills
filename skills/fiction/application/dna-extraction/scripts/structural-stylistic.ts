#!/usr/bin/env -S deno run --allow-read

/**
 * Structural vs Stylistic Classification
 *
 * Helps classify story elements as structural (must keep for story to work)
 * or stylistic (can be adapted without breaking the story).
 *
 * Usage:
 *   deno run --allow-read scripts/structural-stylistic.ts "royal court setting"
 *   deno run --allow-read scripts/structural-stylistic.ts --batch elements.json
 *   deno run --allow-read scripts/structural-stylistic.ts --examples
 */

// === INTERFACES ===

interface ClassificationResult {
  element: string;
  classification: "structural" | "stylistic" | "unclear";
  confidence: "high" | "medium" | "low";
  reasoning: string[];
  questions_to_resolve: string[];
  functions_served: string[];
  alternative_forms: string[];
}

interface ClassificationQuestion {
  question: string;
  structural_answer: string;
  stylistic_answer: string;
  weight: number;
}

// === DATA ===

const CLASSIFICATION_QUESTIONS: ClassificationQuestion[] = [
  {
    question: "If you removed this completely, would the plot still be possible?",
    structural_answer: "No - the plot depends on this element existing",
    stylistic_answer: "Yes - the plot could work without it or with a substitute",
    weight: 3
  },
  {
    question: "Could a different form serve the same story function?",
    structural_answer: "No - this specific form is required",
    stylistic_answer: "Yes - many different forms could serve the same function",
    weight: 3
  },
  {
    question: "Is this element specific to the time/place/culture, or universal?",
    structural_answer: "It embodies a universal that MUST be present",
    stylistic_answer: "It's a specific expression of something that could be expressed differently",
    weight: 2
  },
  {
    question: "Would changing this require changing the character arcs?",
    structural_answer: "Yes - character transformations depend on this",
    stylistic_answer: "No - characters could transform the same way with a different version",
    weight: 2
  },
  {
    question: "Does the emotional experience of the story require this specific element?",
    structural_answer: "Yes - the genre promise depends on this",
    stylistic_answer: "No - the emotional experience could be achieved differently",
    weight: 2
  },
  {
    question: "Is this element what audiences remember and love, or is it incidental?",
    structural_answer: "This IS what they love - it defines the work",
    stylistic_answer: "They love what this enables, not this specifically",
    weight: 1
  },
  {
    question: "Would the theme/meaning change if this element changed?",
    structural_answer: "Yes - the theme is embodied in this specific element",
    stylistic_answer: "No - the theme could be explored through different elements",
    weight: 2
  }
];

const EXAMPLES = {
  clearly_structural: [
    {
      element: "Hamlet's uncertainty about the ghost's truthfulness",
      reasoning: "The entire plot hinges on Hamlet's inability to act due to uncertainty. Remove this, and you remove the central dramatic engine.",
      functions: ["Creates the central conflict", "Enables the delay that defines the character", "Generates the play-within-a-play"]
    },
    {
      element: "The mystery structure in a detective story",
      reasoning: "A mystery without a puzzle to solve isn't a mystery. The structure IS the genre promise.",
      functions: ["Delivers the genre promise", "Creates reader engagement through problem-solving", "Provides satisfaction of revelation"]
    },
    {
      element: "Romeo and Juliet's families being enemies",
      reasoning: "The tragedy requires the love to be forbidden. Without opposing families (or equivalent), there's no star-crossed element.",
      functions: ["Creates the central obstacle", "Makes the romance tragic rather than simple", "Forces the fatal decisions"]
    }
  ],
  clearly_stylistic: [
    {
      element: "The specific time period (Renaissance Denmark in Hamlet)",
      reasoning: "Hamlet has been successfully set in modern times, corporate settings, etc. The period is characteristic but not essential.",
      alternatives: ["Corporate boardroom", "Political dynasty", "Mafia family", "Any power structure with succession"]
    },
    {
      element: "Shakespeare's iambic pentameter",
      reasoning: "The language style is beautiful but adaptations in prose, modern English, or other languages preserve the story.",
      alternatives: ["Modern English", "Film dialogue", "Any language that can express the ideas"]
    },
    {
      element: "The specific occupations in a romance",
      reasoning: "Whether characters are doctors, lawyers, or baristas usually doesn't affect the romantic arc.",
      alternatives: ["Any occupation that provides the needed access/conflict/status"]
    }
  ],
  requires_analysis: [
    {
      element: "Hamlet being a prince",
      analysis: "This seems stylistic (could be any insider-to-power) but the specific functions require examination: proximity to power, obligation through birth, inability to simply leave. These functions could be served by other forms.",
      likely_classification: "stylistic",
      functions_to_preserve: ["Proximity to power center", "Inherited obligation", "Cannot easily escape situation"]
    },
    {
      element: "The ghost in Hamlet",
      analysis: "The supernatural element seems essential but the FUNCTION (delivering unverifiable privileged information that creates obligation) could be served by: dying message, discovered evidence, testimony from unreliable source.",
      likely_classification: "stylistic (the specific form), structural (the function)",
      functions_to_preserve: ["Provides information protagonist cannot verify", "Creates moral obligation not chosen", "Introduces uncertainty about truth"]
    },
    {
      element: "The ship in bounty hunter sci-fi",
      analysis: "Mobile base that enables case-of-the-week structure. Could be other mobile platforms (RV, train, etc.) but the 'crew lives together in mobile home' function is structural to the subgenre.",
      likely_classification: "function is structural, specific form is stylistic",
      functions_to_preserve: ["Mobile base for travel", "Crew living quarters for relationship development", "Home that travels to stories"]
    }
  ]
};

// === UTILITIES ===

function formatQuestionnaire(element: string): string {
  const lines: string[] = [];

  lines.push(`# Structural vs Stylistic Classification: "${element}"`);
  lines.push("");
  lines.push("Answer each question to determine if this element is structural (must keep)");
  lines.push("or stylistic (can adapt to a different form).");
  lines.push("");
  lines.push("---");
  lines.push("");

  for (let i = 0; i < CLASSIFICATION_QUESTIONS.length; i++) {
    const q = CLASSIFICATION_QUESTIONS[i];
    lines.push(`## Question ${i + 1} (Weight: ${q.weight})`);
    lines.push("");
    lines.push(`**${q.question}**`);
    lines.push("");
    lines.push(`- [ ] **Structural:** ${q.structural_answer}`);
    lines.push(`- [ ] **Stylistic:** ${q.stylistic_answer}`);
    lines.push("");
  }

  lines.push("---");
  lines.push("");
  lines.push("## Additional Analysis");
  lines.push("");
  lines.push("### Functions this element serves:");
  lines.push("(List what this element DOES in the story)");
  lines.push("");
  lines.push("1. ");
  lines.push("2. ");
  lines.push("3. ");
  lines.push("");
  lines.push("### Alternative forms that could serve these functions:");
  lines.push("(If stylistic, what else could work?)");
  lines.push("");
  lines.push("1. ");
  lines.push("2. ");
  lines.push("3. ");
  lines.push("");
  lines.push("### Final Classification:");
  lines.push("");
  lines.push("- [ ] **Structural** - Cannot be changed without breaking the story");
  lines.push("- [ ] **Stylistic** - Can be adapted to different forms");
  lines.push("- [ ] **Mixed** - Function is structural, specific form is stylistic");
  lines.push("");

  return lines.join("\n");
}

function formatExamples(): string {
  const lines: string[] = [];

  lines.push("# Structural vs Stylistic: Examples");
  lines.push("");
  lines.push("Understanding the difference between what MUST stay and what CAN change.");
  lines.push("");

  lines.push("## Clearly Structural Elements");
  lines.push("");
  lines.push("These cannot be changed without breaking the story:");
  lines.push("");

  for (const ex of EXAMPLES.clearly_structural) {
    lines.push(`### "${ex.element}"`);
    lines.push("");
    lines.push(`**Why structural:** ${ex.reasoning}`);
    lines.push("");
    lines.push("**Functions served:**");
    for (const f of ex.functions) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  lines.push("## Clearly Stylistic Elements");
  lines.push("");
  lines.push("These can change form while preserving the story:");
  lines.push("");

  for (const ex of EXAMPLES.clearly_stylistic) {
    lines.push(`### "${ex.element}"`);
    lines.push("");
    lines.push(`**Why stylistic:** ${ex.reasoning}`);
    lines.push("");
    lines.push("**Alternative forms:**");
    for (const a of ex.alternatives) {
      lines.push(`- ${a}`);
    }
    lines.push("");
  }

  lines.push("## Elements Requiring Analysis");
  lines.push("");
  lines.push("These need careful function extraction to classify:");
  lines.push("");

  for (const ex of EXAMPLES.requires_analysis) {
    lines.push(`### "${ex.element}"`);
    lines.push("");
    lines.push(`**Analysis:** ${ex.analysis}`);
    lines.push("");
    lines.push(`**Likely classification:** ${ex.likely_classification}`);
    lines.push("");
    lines.push("**Functions to preserve:**");
    for (const f of ex.functions_to_preserve) {
      lines.push(`- ${f}`);
    }
    lines.push("");
  }

  lines.push("## The Key Insight");
  lines.push("");
  lines.push("**Form is almost always stylistic. Function is almost always structural.**");
  lines.push("");
  lines.push("When analyzing an element:");
  lines.push("1. Identify what FUNCTION it serves");
  lines.push("2. Ask: Could a different FORM serve that function?");
  lines.push("3. If yes: the form is stylistic, the function is structural");
  lines.push("4. The adaptation must preserve functions, not forms");
  lines.push("");

  return lines.join("\n");
}

function formatBatchTemplate(): string {
  return JSON.stringify({
    elements: [
      {
        name: "Element 1",
        type: "character|setting|plot|relationship|device",
        initial_impression: "structural|stylistic|unclear"
      }
    ],
    instructions: "List elements to classify. Run with --batch filename.json"
  }, null, 2);
}

function createEmptyResult(element: string): ClassificationResult {
  return {
    element,
    classification: "unclear",
    confidence: "low",
    reasoning: [],
    questions_to_resolve: [
      "What specific functions does this element serve?",
      "Could those functions be served by a different form?",
      "Would the story break without this, or just feel different?"
    ],
    functions_served: [],
    alternative_forms: []
  };
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Structural vs Stylistic Classification

Usage:
  deno run --allow-read scripts/structural-stylistic.ts "element name"
  deno run --allow-read scripts/structural-stylistic.ts --examples
  deno run --allow-read scripts/structural-stylistic.ts --batch-template
  deno run --allow-read scripts/structural-stylistic.ts --questions

Options:
  --examples        Show classification examples
  --questions       List all classification questions
  --batch-template  Output batch classification template
  --json            Output as JSON

The Structural/Stylistic Distinction:
  Structural = The story BREAKS without this (or its function)
  Stylistic = The story WORKS with a different form of this

Key Insight:
  Form is usually stylistic. Function is usually structural.
  Ask: "What does this DO?" then "Could something else DO that?"
`);
    Deno.exit(0);
  }

  const isJson = args.includes("--json");

  // Handle --examples
  if (args.includes("--examples")) {
    if (isJson) {
      console.log(JSON.stringify(EXAMPLES, null, 2));
    } else {
      console.log(formatExamples());
    }
    return;
  }

  // Handle --questions
  if (args.includes("--questions")) {
    if (isJson) {
      console.log(JSON.stringify(CLASSIFICATION_QUESTIONS, null, 2));
    } else {
      console.log("# Classification Questions\n");
      for (let i = 0; i < CLASSIFICATION_QUESTIONS.length; i++) {
        const q = CLASSIFICATION_QUESTIONS[i];
        console.log(`## ${i + 1}. ${q.question} (Weight: ${q.weight})`);
        console.log(`   Structural: ${q.structural_answer}`);
        console.log(`   Stylistic: ${q.stylistic_answer}`);
        console.log("");
      }
    }
    return;
  }

  // Handle --batch-template
  if (args.includes("--batch-template")) {
    console.log(formatBatchTemplate());
    return;
  }

  // Find element name (positional argument)
  let element: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--")) {
      element = args[i];
      break;
    }
  }

  if (!element) {
    console.error("Error: Please provide an element to classify");
    console.error("Usage: deno run --allow-read scripts/structural-stylistic.ts \"royal court setting\"");
    console.error("       deno run --allow-read scripts/structural-stylistic.ts --examples");
    Deno.exit(1);
  }

  // Generate questionnaire for the element
  if (isJson) {
    const result = createEmptyResult(element);
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatQuestionnaire(element));
  }
}

main();
