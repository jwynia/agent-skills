#!/usr/bin/env -S deno run --allow-read

/**
 * Scene Structure Analyzer
 *
 * Analyzes a scene or chapter for scene-sequel structure elements.
 * Outputs a diagnostic report identifying:
 * - Whether goal/conflict/disaster are present
 * - Whether sequel elements (reaction/dilemma/decision) appear
 * - Pacing indicators
 * - Potential issues
 *
 * Usage:
 *   deno run --allow-read analyze-scene.ts <file>
 *   deno run --allow-read analyze-scene.ts --text "scene text here"
 *   cat scene.txt | deno run --allow-read analyze-scene.ts --stdin
 */

interface SceneAnalysis {
  wordCount: number;
  paragraphCount: number;
  dialogueRatio: number;

  // Scene elements detected
  goalIndicators: string[];
  conflictIndicators: string[];
  disasterIndicators: string[];

  // Sequel elements detected
  reactionIndicators: string[];
  dilemmaIndicators: string[];
  decisionIndicators: string[];

  // Pacing analysis
  estimatedSceneRatio: number; // 0-1, higher = more scene, lower = more sequel
  pacingAssessment: "action-heavy" | "balanced" | "reflective";

  // Issues detected
  issues: string[];

  // Recommendations
  recommendations: string[];
}

// Patterns that suggest scene elements
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

function countMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found.slice(0, 3)); // Limit to 3 examples per pattern
    }
  }
  return [...new Set(matches)].slice(0, 5); // Dedupe and limit total
}

function calculateDialogueRatio(text: string): number {
  // Simple heuristic: count quoted text vs total
  const quotes = text.match(/"[^"]+"/g) || [];
  const quotedChars = quotes.join("").length;
  return quotedChars / text.length;
}

function analyzeScene(text: string): SceneAnalysis {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

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

  let pacingAssessment: "action-heavy" | "balanced" | "reflective";
  if (sceneRatio > 0.65) {
    pacingAssessment = "action-heavy";
  } else if (sceneRatio < 0.35) {
    pacingAssessment = "reflective";
  } else {
    pacingAssessment = "balanced";
  }

  // Detect issues
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (goalIndicators.length === 0) {
    issues.push("No clear goal detected in opening");
    recommendations.push("Establish what the POV character wants in the first paragraph");
  }

  if (conflictIndicators.length === 0) {
    issues.push("No conflict indicators detected");
    recommendations.push("Add opposition that escalates—what blocks the character?");
  }

  if (disasterIndicators.length === 0 && sceneScore > 0) {
    issues.push("Scene may end too cleanly (no disaster detected)");
    recommendations.push("Consider adding 'but' or 'and furthermore' to the outcome");
  }

  if (sceneRatio > 0.8) {
    issues.push("Very action-heavy—may exhaust reader");
    recommendations.push("Add sequel beats (reaction time) before next scene");
  }

  if (sceneRatio < 0.2 && words.length > 500) {
    issues.push("Extended reflection without action");
    recommendations.push("Move toward a decision that leads to the next scene's goal");
  }

  if (reactionIndicators.length > 0 && decisionIndicators.length === 0) {
    issues.push("Reaction without decision—sequel may be incomplete");
    recommendations.push("Sequel should end with commitment to action");
  }

  return {
    wordCount: words.length,
    paragraphCount: paragraphs.length,
    dialogueRatio: calculateDialogueRatio(text),
    goalIndicators,
    conflictIndicators,
    disasterIndicators,
    reactionIndicators,
    dilemmaIndicators,
    decisionIndicators,
    estimatedSceneRatio: sceneRatio,
    pacingAssessment,
    issues,
    recommendations,
  };
}

function formatReport(analysis: SceneAnalysis): string {
  const lines: string[] = [];

  lines.push("# Scene Structure Analysis\n");

  lines.push("## Overview");
  lines.push(`- Words: ${analysis.wordCount}`);
  lines.push(`- Paragraphs: ${analysis.paragraphCount}`);
  lines.push(`- Dialogue ratio: ${(analysis.dialogueRatio * 100).toFixed(1)}%`);
  lines.push(`- Pacing: ${analysis.pacingAssessment}`);
  lines.push(`- Scene/Sequel ratio: ${(analysis.estimatedSceneRatio * 100).toFixed(0)}% scene\n`);

  lines.push("## Scene Elements (Goal → Conflict → Disaster)");
  lines.push(`- Goal indicators: ${analysis.goalIndicators.length > 0 ? analysis.goalIndicators.join(", ") : "⚠ None detected"}`);
  lines.push(`- Conflict indicators: ${analysis.conflictIndicators.length > 0 ? analysis.conflictIndicators.join(", ") : "⚠ None detected"}`);
  lines.push(`- Disaster indicators: ${analysis.disasterIndicators.length > 0 ? analysis.disasterIndicators.join(", ") : "⚠ None detected"}\n`);

  lines.push("## Sequel Elements (Reaction → Dilemma → Decision)");
  lines.push(`- Reaction indicators: ${analysis.reactionIndicators.length > 0 ? analysis.reactionIndicators.join(", ") : "None detected"}`);
  lines.push(`- Dilemma indicators: ${analysis.dilemmaIndicators.length > 0 ? analysis.dilemmaIndicators.join(", ") : "None detected"}`);
  lines.push(`- Decision indicators: ${analysis.decisionIndicators.length > 0 ? analysis.decisionIndicators.join(", ") : "None detected"}\n`);

  if (analysis.issues.length > 0) {
    lines.push("## Issues Detected");
    for (const issue of analysis.issues) {
      lines.push(`- ⚠ ${issue}`);
    }
    lines.push("");
  }

  if (analysis.recommendations.length > 0) {
    lines.push("## Recommendations");
    for (const rec of analysis.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push("");
  }

  if (analysis.issues.length === 0) {
    lines.push("## Assessment");
    lines.push("✓ Scene structure appears complete. Verify manually that:\n  - Goal is clear in opening\n  - Conflict escalates\n  - Disaster creates pressure for sequel\n");
  }

  return lines.join("\n");
}

async function main() {
  const args = Deno.args;
  let text = "";

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Scene Structure Analyzer

Usage:
  deno run --allow-read analyze-scene.ts <file>
  deno run --allow-read analyze-scene.ts --text "scene text"
  cat scene.txt | deno run analyze-scene.ts --stdin

Options:
  --json    Output as JSON instead of formatted report
  --help    Show this help message
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");

  if (args.includes("--stdin")) {
    const decoder = new TextDecoder();
    const input = await Deno.readAll(Deno.stdin);
    text = decoder.decode(input);
  } else if (args.includes("--text")) {
    const textIndex = args.indexOf("--text");
    text = args[textIndex + 1] || "";
  } else {
    // Assume first non-flag arg is a file
    const file = args.find(a => !a.startsWith("--"));
    if (file) {
      text = await Deno.readTextFile(file);
    } else {
      console.error("Error: No input provided. Use --help for usage.");
      Deno.exit(1);
    }
  }

  if (!text.trim()) {
    console.error("Error: Empty input");
    Deno.exit(1);
  }

  const analysis = analyzeScene(text);

  if (jsonOutput) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatReport(analysis));
  }
}

main();
