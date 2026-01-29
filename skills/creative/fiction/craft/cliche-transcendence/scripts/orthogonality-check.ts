#!/usr/bin/env -S deno run

/**
 * Orthogonality Check Tool
 *
 * Generates a structured questionnaire for evaluating whether a story element
 * "knows what story it's in" (cliché) or operates on its own logic (orthogonal).
 *
 * Usage:
 *   deno run orthogonality-check.ts "FBI agents investigating UFO sighting"
 *   deno run orthogonality-check.ts --interactive
 *   deno run orthogonality-check.ts --json "mentor character"
 */

interface OrthogonalityCheck {
  element: string;
  axes: {
    form: AxisQuestion;
    knowledge: AxisQuestion;
    goal: AxisQuestion;
    role: AxisQuestion;
  };
  keyTest: string;
  assessment: "likely-cliche" | "mixed" | "likely-orthogonal" | "needs-input";
  suggestions: string[];
}

interface AxisQuestion {
  axis: string;
  question: string;
  clicheAnswer: string;
  orthogonalAnswer: string;
  userResponse?: string;
}

function generateCheck(element: string): OrthogonalityCheck {
  return {
    element,
    axes: {
      form: {
        axis: "Form",
        question: `What is the "${element}"?`,
        clicheAnswer: "The expected/default version of this element",
        orthogonalAnswer: "Same form is fine—orthogonality is in other axes",
      },
      knowledge: {
        axis: "Knowledge",
        question: `What does "${element}" know about the central plot/mystery?`,
        clicheAnswer: "Knows about the main conflict; part of it",
        orthogonalAnswer: "Has own concerns; intersects with plot accidentally",
      },
      goal: {
        axis: "Goal",
        question: `What does "${element}" want?`,
        clicheAnswer: "Wants to help/stop protagonist regarding main plot",
        orthogonalAnswer: "Wants something unrelated that happens to collide",
      },
      role: {
        axis: "Role",
        question: `What function does "${element}" serve in the story?`,
        clicheAnswer: "Exists to be obstacle/ally for protagonist",
        orthogonalAnswer: "Has own story that intersects with protagonist's",
      },
    },
    keyTest: `Does "${element}" know what story it's in? (Cliché elements know; orthogonal elements think they're in a different story)`,
    assessment: "needs-input",
    suggestions: [],
  };
}

function formatQuestionnaire(check: OrthogonalityCheck): string {
  const lines: string[] = [];

  lines.push(`# Orthogonality Check: "${check.element}"\n`);

  lines.push("## The Four Axes\n");
  lines.push("For each axis, consider which answer better describes your element:\n");

  for (const [key, axis] of Object.entries(check.axes)) {
    lines.push(`### ${axis.axis}`);
    lines.push(`**Question:** ${axis.question}\n`);
    lines.push(`| Cliché Version | Orthogonal Version |`);
    lines.push(`|----------------|-------------------|`);
    lines.push(`| ${axis.clicheAnswer} | ${axis.orthogonalAnswer} |`);
    lines.push("");
  }

  lines.push("## The Key Test\n");
  lines.push(`> ${check.keyTest}\n`);
  lines.push("- If YES → The element is likely clichéd");
  lines.push("- If NO → The element has its own logic that collides with your story\n");

  lines.push("## Transformation Strategies\n");
  lines.push("If the element is clichéd, try rotating on one or more axes:\n");
  lines.push(`1. **Change Knowledge**: What if "${check.element}" doesn't know about the central plot?`);
  lines.push(`2. **Change Goal**: What if "${check.element}" wants something unrelated that creates conflict?`);
  lines.push(`3. **Change Role**: What if "${check.element}" has their own story that intersects accidentally?\n`);

  lines.push("## Example Transformation\n");
  lines.push("FBI agents investigating UFO (cliché):");
  lines.push("- Know about aliens, part of cover-up → antagonist because hiding truth");
  lines.push("");
  lines.push("FBI agents investigating UFO (orthogonal):");
  lines.push("- Don't know about aliens, working a missing persons case");
  lines.push("- Antagonist because protagonist seems connected to their case");
  lines.push("- They think they're in a crime drama, not a UFO story\n");

  return lines.join("\n");
}

function formatJson(check: OrthogonalityCheck): string {
  return JSON.stringify(check, null, 2);
}

async function runInteractive(): Promise<void> {
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const prompt = (msg: string): void => {
    Deno.stdout.writeSync(encoder.encode(msg));
  };

  const readLine = async (): Promise<string> => {
    const buf = new Uint8Array(1024);
    const n = await Deno.stdin.read(buf);
    if (n === null) return "";
    return decoder.decode(buf.subarray(0, n)).trim();
  };

  prompt("Enter the story element to check: ");
  const element = await readLine();

  if (!element) {
    console.error("No element provided");
    Deno.exit(1);
  }

  const check = generateCheck(element);
  console.log("\n" + formatQuestionnaire(check));

  console.log("---\n");
  console.log("Answer each axis (c = cliché, o = orthogonal, ? = unsure):\n");

  let clicheCount = 0;
  let orthogonalCount = 0;

  for (const [key, axis] of Object.entries(check.axes)) {
    prompt(`${axis.axis} - ${axis.question} [c/o/?]: `);
    const response = (await readLine()).toLowerCase();

    if (response === "c") {
      clicheCount++;
      check.suggestions.push(`Consider rotating ${axis.axis}: ${axis.orthogonalAnswer}`);
    } else if (response === "o") {
      orthogonalCount++;
    }
  }

  if (clicheCount >= 3) {
    check.assessment = "likely-cliche";
    console.log("\n⚠ ASSESSMENT: Likely clichéd on multiple axes");
  } else if (orthogonalCount >= 3) {
    check.assessment = "likely-orthogonal";
    console.log("\n✓ ASSESSMENT: Likely orthogonal—element has its own logic");
  } else {
    check.assessment = "mixed";
    console.log("\n~ ASSESSMENT: Mixed—some cliché, some orthogonal axes");
  }

  if (check.suggestions.length > 0) {
    console.log("\nSuggestions:");
    for (const s of check.suggestions) {
      console.log(`  - ${s}`);
    }
  }
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Orthogonality Check Tool

Evaluates whether a story element "knows what story it's in" (cliché)
or operates on its own logic (orthogonal).

Usage:
  deno run orthogonality-check.ts "element description"
  deno run orthogonality-check.ts --interactive
  deno run orthogonality-check.ts --json "element"

Options:
  --interactive   Guided Q&A mode
  --json          Output as JSON
  --help          Show this help
`);
    Deno.exit(0);
  }

  if (args.includes("--interactive")) {
    await runInteractive();
    return;
  }

  const jsonOutput = args.includes("--json");
  const element = args.find((a) => !a.startsWith("--"));

  if (!element) {
    console.error("Error: No element provided. Use --help for usage.");
    Deno.exit(1);
  }

  const check = generateCheck(element);

  if (jsonOutput) {
    console.log(formatJson(check));
  } else {
    console.log(formatQuestionnaire(check));
  }
}

main();
