#!/usr/bin/env -S deno run --allow-read

/**
 * Scene Scoring Calculator for Chapter-Drafter Orchestrator
 *
 * Calculates composite scores from pass evaluations.
 * Used to determine ACCEPT/REVISE/REWRITE/REJECT outcomes.
 *
 * Usage:
 *   deno run --allow-read scripts/score-scene.ts --json '{"scene-sequencing": {...}}'
 *   deno run --allow-read scripts/score-scene.ts --interactive
 */

// Pass weights from chapter-drafter configuration
const PASS_WEIGHTS: Record<string, number> = {
  "scene-sequencing": 0.35,
  "character-arc": 0.25,
  "cliche-transcendence": 0.15,
  dialogue: 0.15,
  "prose-style": 0.1,
};

// Score values for each rating
const RATING_SCORES: Record<string, number> = {
  PASS: 100,
  WARN: 85,
  FAIL: 60,
};

// Decision thresholds
const THRESHOLDS = {
  ACCEPT: 80,
  REVISE: 60,
  REWRITE: 40,
};

interface CriterionResult {
  name: string;
  rating: "PASS" | "WARN" | "FAIL";
  notes?: string;
}

interface PassResult {
  pass: string;
  criteria: CriterionResult[];
  score?: number;
}

interface SceneEvaluation {
  scene: string;
  passes: PassResult[];
  composite?: number;
  decision?: "ACCEPT" | "REVISE" | "REWRITE" | "REJECT";
}

/**
 * Calculate score for a single pass based on its criteria
 */
function calculatePassScore(criteria: CriterionResult[]): number {
  if (criteria.length === 0) return 0;

  const total = criteria.reduce((sum, c) => {
    return sum + RATING_SCORES[c.rating];
  }, 0);

  return Math.round(total / criteria.length);
}

/**
 * Calculate composite score from all passes
 */
function calculateCompositeScore(passes: PassResult[]): number {
  let weightedSum = 0;
  let totalWeight = 0;

  for (const pass of passes) {
    const weight = PASS_WEIGHTS[pass.pass] || 0;
    const score = pass.score ?? calculatePassScore(pass.criteria);

    weightedSum += score * weight;
    totalWeight += weight;
  }

  return totalWeight > 0 ? Math.round(weightedSum / totalWeight) : 0;
}

/**
 * Determine decision based on composite score
 */
function determineDecision(
  composite: number,
  passes: PassResult[]
): "ACCEPT" | "REVISE" | "REWRITE" | "REJECT" {
  // Critical failure: scene-sequencing FAIL overrides score
  const sceneSequencing = passes.find((p) => p.pass === "scene-sequencing");
  if (sceneSequencing) {
    const hasFail = sceneSequencing.criteria.some((c) => c.rating === "FAIL");
    if (hasFail) {
      return "REWRITE"; // Structural failure forces rewrite regardless of score
    }
  }

  if (composite >= THRESHOLDS.ACCEPT) return "ACCEPT";
  if (composite >= THRESHOLDS.REVISE) return "REVISE";
  if (composite >= THRESHOLDS.REWRITE) return "REWRITE";
  return "REJECT";
}

/**
 * Find the lowest-scoring pass for targeted revision
 */
function findLowestScoringPass(passes: PassResult[]): string | null {
  let lowest: PassResult | null = null;
  let lowestScore = Infinity;

  for (const pass of passes) {
    const score = pass.score ?? calculatePassScore(pass.criteria);
    if (score < lowestScore) {
      lowestScore = score;
      lowest = pass;
    }
  }

  return lowest?.pass ?? null;
}

/**
 * Get all failing criteria across all passes
 */
function getFailingCriteria(
  passes: PassResult[]
): Array<{ pass: string; criterion: CriterionResult }> {
  const failing: Array<{ pass: string; criterion: CriterionResult }> = [];

  for (const pass of passes) {
    for (const criterion of pass.criteria) {
      if (criterion.rating === "FAIL") {
        failing.push({ pass: pass.pass, criterion });
      }
    }
  }

  return failing;
}

/**
 * Process a complete scene evaluation
 */
function evaluateScene(evaluation: SceneEvaluation): SceneEvaluation {
  // Calculate pass scores
  for (const pass of evaluation.passes) {
    pass.score = calculatePassScore(pass.criteria);
  }

  // Calculate composite
  evaluation.composite = calculateCompositeScore(evaluation.passes);

  // Determine decision
  evaluation.decision = determineDecision(
    evaluation.composite,
    evaluation.passes
  );

  return evaluation;
}

/**
 * Generate a summary report
 */
function generateReport(evaluation: SceneEvaluation): string {
  const lines: string[] = [];

  lines.push(`# Scene Evaluation: ${evaluation.scene}`);
  lines.push("");

  // Pass scores
  lines.push("## Pass Scores");
  lines.push("");
  lines.push("| Pass | Score | Weight | Weighted |");
  lines.push("|------|-------|--------|----------|");

  for (const pass of evaluation.passes) {
    const weight = PASS_WEIGHTS[pass.pass] || 0;
    const weighted = Math.round((pass.score ?? 0) * weight);
    lines.push(
      `| ${pass.pass} | ${pass.score} | ${(weight * 100).toFixed(0)}% | ${weighted} |`
    );
  }

  lines.push("");
  lines.push(`**Composite Score:** ${evaluation.composite}`);
  lines.push(`**Decision:** ${evaluation.decision}`);
  lines.push("");

  // Failing criteria
  const failing = getFailingCriteria(evaluation.passes);
  if (failing.length > 0) {
    lines.push("## Failing Criteria");
    lines.push("");
    for (const { pass, criterion } of failing) {
      lines.push(
        `- **${pass}**: ${criterion.name}${criterion.notes ? ` - ${criterion.notes}` : ""}`
      );
    }
    lines.push("");
  }

  // Revision guidance
  if (evaluation.decision === "REVISE") {
    const lowestPass = findLowestScoringPass(evaluation.passes);
    lines.push("## Revision Guidance");
    lines.push("");
    lines.push(`Target lowest-scoring pass: **${lowestPass}**`);
    lines.push("");
  }

  return lines.join("\n");
}

// Example evaluation for testing
const exampleEvaluation: SceneEvaluation = {
  scene: "Chapter 1, Scene 3",
  passes: [
    {
      pass: "scene-sequencing",
      criteria: [
        { name: "Goal clarity", rating: "PASS" },
        { name: "Conflict escalation", rating: "PASS" },
        { name: "Disaster quality", rating: "WARN", notes: "Simple 'No' ending" },
        { name: "Sequel presence", rating: "PASS" },
        { name: "Scene-sequel ratio", rating: "PASS" },
      ],
    },
    {
      pass: "character-arc",
      criteria: [
        { name: "Lie visibility", rating: "PASS" },
        { name: "Want/Need gap", rating: "PASS" },
        { name: "Arc progress", rating: "WARN", notes: "Arc static this scene" },
        { name: "Transformation markers", rating: "PASS" },
      ],
    },
    {
      pass: "cliche-transcendence",
      criteria: [
        { name: "Form axis", rating: "PASS" },
        { name: "Knowledge axis", rating: "WARN", notes: "Mentor too plot-aware" },
        { name: "Goal axis", rating: "PASS" },
        { name: "Role axis", rating: "PASS" },
      ],
    },
    {
      pass: "dialogue",
      criteria: [
        { name: "Voice distinctiveness", rating: "PASS" },
        { name: "Subtext presence", rating: "WARN", notes: "Some on-the-nose lines" },
        { name: "Double-duty test", rating: "PASS" },
        { name: "Naturalness", rating: "PASS" },
        { name: "Exposition handling", rating: "PASS" },
      ],
    },
    {
      pass: "prose-style",
      criteria: [
        { name: "Sentence variety", rating: "PASS" },
        { name: "Clarity", rating: "PASS" },
        { name: "Voice consistency", rating: "PASS" },
        { name: "Economy", rating: "PASS" },
        { name: "Active voice", rating: "PASS" },
      ],
    },
  ],
};

// Main execution
function main() {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`
Scene Scoring Calculator for Chapter-Drafter

Usage:
  score-scene.ts --example          Run with example evaluation
  score-scene.ts --json '<json>'    Evaluate JSON input
  score-scene.ts --interactive      Interactive mode (prompts for input)

Pass Weights:
  scene-sequencing:     35%
  character-arc:        25%
  cliche-transcendence: 15%
  dialogue:             15%
  prose-style:          10%

Decision Thresholds:
  ACCEPT:  >= 80
  REVISE:  60-79
  REWRITE: 40-59
  REJECT:  < 40
`);
    Deno.exit(0);
  }

  if (args.includes("--example")) {
    const result = evaluateScene(exampleEvaluation);
    console.log(generateReport(result));
    console.log("\n---\n");
    console.log("JSON Output:");
    console.log(JSON.stringify(result, null, 2));
    Deno.exit(0);
  }

  const jsonIndex = args.indexOf("--json");
  if (jsonIndex !== -1 && args[jsonIndex + 1]) {
    try {
      const input = JSON.parse(args[jsonIndex + 1]);
      const result = evaluateScene(input);
      console.log(generateReport(result));
    } catch (e) {
      console.error("Error parsing JSON:", e);
      Deno.exit(1);
    }
    Deno.exit(0);
  }

  // Default: show example
  console.log("Run with --example to see sample evaluation");
  console.log("Run with --help for usage information");
}

main();

// Export for use as module
export {
  calculatePassScore,
  calculateCompositeScore,
  determineDecision,
  evaluateScene,
  generateReport,
  findLowestScoringPass,
  getFailingCriteria,
  PASS_WEIGHTS,
  RATING_SCORES,
  THRESHOLDS,
};

export type { CriterionResult, PassResult, SceneEvaluation };
