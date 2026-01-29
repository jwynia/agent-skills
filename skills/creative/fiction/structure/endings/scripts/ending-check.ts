#!/usr/bin/env -S deno run --allow-read

/**
 * Ending Check - Resolution Structure Analyzer
 *
 * Analyzes final chapters/scenes for ending structure patterns.
 * Detects ending type, pacing issues, and common anti-patterns.
 *
 * Usage:
 *   deno run --allow-read ending-check.ts final-chapter.txt
 *   deno run --allow-read ending-check.ts --text "The resolution..."
 */

interface EndingAnalysis {
  wordCount: number;

  // Structure detection
  structure: {
    hasClimax: boolean;
    hasFallingAction: boolean;
    hasDenouement: boolean;
    climaxIndicators: string[];
    resolutionIndicators: string[];
  };

  // Ending type detection
  likelyType: EndingType;
  typeConfidence: "high" | "medium" | "low";
  typeIndicators: string[];

  // Pacing analysis
  pacing: {
    assessment: "rushed" | "balanced" | "extended";
    climaxPosition: number; // 0-1, where in the text climax seems to occur
    postClimaxRatio: number; // proportion after climax
  };

  // Anti-pattern detection
  antiPatterns: {
    name: string;
    detected: boolean;
    evidence: string[];
  }[];

  // Quality indicators
  qualitySignals: {
    inevitableIndicators: string[];
    surpriseIndicators: string[];
    characterAgencyIndicators: string[];
    themeStatementWarnings: string[];
  };

  issues: string[];
  recommendations: string[];
}

type EndingType = "closed" | "open" | "ambiguous" | "twist" | "circular" | "unclear";

// Pattern definitions

const CLIMAX_PATTERNS = [
  /\b(finally|at last|the moment|now or never|this was it|no turning back)\b/gi,
  /\b(faced|confronted|stood against|charged|attacked|defended)\b/gi,
  /\b(everything .* led to|culminat|climax|showdown|final battle)\b/gi,
  /\b(decide|chose|choice|moment of truth|do or die)\b/gi,
];

const FALLING_ACTION_PATTERNS = [
  /\b(afterward|later|in the end|when it was over|the dust settled)\b/gi,
  /\b(realized|understood|saw now|finally knew|comprehended)\b/gi,
  /\b(quiet|silence|stillness|peace|calm after)\b/gi,
  /\b(breathed|exhaled|relaxed|released|let go)\b/gi,
];

const RESOLUTION_PATTERNS = [
  /\b(from then on|ever after|and so|in the years|looking back)\b/gi,
  /\b(home|returned|back to|new beginning|fresh start)\b/gi,
  /\b(together|apart|alone|with .* by .* side)\b/gi,
  /\b(the end|final|last|goodbye|farewell)\b/gi,
];

const CLOSED_ENDING_PATTERNS = [
  /\b(answered|solved|resolved|complete|finished|done)\b/gi,
  /\b(lived .* ever after|and so it was|the end)\b/gi,
  /\b(finally knew|at last understood|now .* was clear)\b/gi,
];

const OPEN_ENDING_PATTERNS = [
  /\b(would .* ever|someday|perhaps|maybe|who knew)\b/gi,
  /\b(wondered|uncertain|unknown|mystery remained)\b/gi,
  /\b(walked .* into|disappeared|faded|continued)\b/gi,
];

const TWIST_PATTERNS = [
  /\b(but .* was|actually|the truth was|all along|really)\b/gi,
  /\b(revealed|discovered|realized .* had been|never was)\b/gi,
  /\b(impossible|couldn't be|how could|all this time)\b/gi,
];

const CIRCULAR_PATTERNS = [
  /\b(once again|back where|returned to|just like before|as .* had begun)\b/gi,
  /\b(same .* but different|familiar yet|recognized|remembered when)\b/gi,
];

// Anti-pattern detection

const DEUS_EX_PATTERNS = [
  /\b(suddenly .* appeared|out of nowhere|just then|miracle|saved by)\b/gi,
  /\b(cavalry|rescue|luck would have it|coincidence|happened to)\b/gi,
  /\b(never mentioned|no one knew|secret .* revealed itself)\b/gi,
];

const THEME_SPEECH_PATTERNS = [
  /\b(the moral|the lesson|what .* learned|what this means|you see)\b/gi,
  /\b(I realize now|I understand that|the truth is|life is about)\b/gi,
  /\b(that's what .* is really about|the point is|in the end .* matters)\b/gi,
];

const EPILOGUE_DUMP_PATTERNS = [
  /\b(years later|decades passed|in time|eventually .* became)\b/gi,
  /\b(married|children|grandchildren|died|legacy|remembered as)\b/gi,
  /\b(went on to|continued to|spent .* life|career|retired)\b/gi,
];

const SEQUEL_BAIT_PATTERNS = [
  /\b(but .* wasn't over|little did|unbeknownst|somewhere|meanwhile)\b/gi,
  /\b(to be continued|the beginning|another story|next time)\b/gi,
  /\b(still out there|waiting|watching|planning|would return)\b/gi,
];

function countMatches(text: string, patterns: RegExp[]): string[] {
  const matches: string[] = [];
  for (const pattern of patterns) {
    const found = text.match(pattern);
    if (found) {
      matches.push(...found.slice(0, 3));
    }
  }
  return [...new Set(matches.map(m => m.toLowerCase()))].slice(0, 5);
}

function detectEndingType(text: string): { type: EndingType; confidence: "high" | "medium" | "low"; indicators: string[] } {
  const scores: Record<EndingType, number> = {
    closed: 0,
    open: 0,
    ambiguous: 0,
    twist: 0,
    circular: 0,
    unclear: 0,
  };

  const closedMatches = countMatches(text, CLOSED_ENDING_PATTERNS);
  const openMatches = countMatches(text, OPEN_ENDING_PATTERNS);
  const twistMatches = countMatches(text, TWIST_PATTERNS);
  const circularMatches = countMatches(text, CIRCULAR_PATTERNS);

  scores.closed = closedMatches.length * 2;
  scores.open = openMatches.length * 2;
  scores.twist = twistMatches.length * 3; // Twist patterns are more distinctive
  scores.circular = circularMatches.length * 2;

  // Ambiguous is detected by presence of both open and uncertainty
  if (openMatches.length > 0 && text.match(/\b(or perhaps|maybe|either|neither|unclear|ambiguous)\b/gi)) {
    scores.ambiguous = openMatches.length + 2;
  }

  // Find highest score
  let maxType: EndingType = "unclear";
  let maxScore = 0;
  for (const [type, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      maxType = type as EndingType;
    }
  }

  let confidence: "high" | "medium" | "low";
  if (maxScore >= 6) confidence = "high";
  else if (maxScore >= 3) confidence = "medium";
  else confidence = "low";

  const indicators = [
    ...closedMatches.map(m => `closed: ${m}`),
    ...openMatches.map(m => `open: ${m}`),
    ...twistMatches.map(m => `twist: ${m}`),
    ...circularMatches.map(m => `circular: ${m}`),
  ].slice(0, 5);

  return { type: maxType, confidence, indicators };
}

function analyzeStructure(text: string): EndingAnalysis["structure"] {
  const climaxIndicators = countMatches(text, CLIMAX_PATTERNS);
  const fallingIndicators = countMatches(text, FALLING_ACTION_PATTERNS);
  const resolutionIndicators = countMatches(text, RESOLUTION_PATTERNS);

  return {
    hasClimax: climaxIndicators.length > 0,
    hasFallingAction: fallingIndicators.length > 0,
    hasDenouement: resolutionIndicators.length > 0,
    climaxIndicators,
    resolutionIndicators,
  };
}

function analyzePacing(text: string): EndingAnalysis["pacing"] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());
  const totalLength = text.length;

  // Find approximate climax position (highest tension language)
  let climaxPosition = 0.5;
  let maxTensionScore = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const tensionScore = countMatches(para, CLIMAX_PATTERNS).length;
    if (tensionScore > maxTensionScore) {
      maxTensionScore = tensionScore;
      // Position as proportion through text
      const paraStart = text.indexOf(para);
      climaxPosition = paraStart / totalLength;
    }
  }

  const postClimaxRatio = 1 - climaxPosition;

  let assessment: "rushed" | "balanced" | "extended";
  if (postClimaxRatio < 0.1) {
    assessment = "rushed";
  } else if (postClimaxRatio > 0.4) {
    assessment = "extended";
  } else {
    assessment = "balanced";
  }

  return {
    assessment,
    climaxPosition: Math.round(climaxPosition * 100) / 100,
    postClimaxRatio: Math.round(postClimaxRatio * 100) / 100,
  };
}

function detectAntiPatterns(text: string): EndingAnalysis["antiPatterns"] {
  return [
    {
      name: "Deus Ex Machina",
      detected: countMatches(text, DEUS_EX_PATTERNS).length >= 2,
      evidence: countMatches(text, DEUS_EX_PATTERNS),
    },
    {
      name: "Theme Speech",
      detected: countMatches(text, THEME_SPEECH_PATTERNS).length >= 2,
      evidence: countMatches(text, THEME_SPEECH_PATTERNS),
    },
    {
      name: "Epilogue Dump",
      detected: countMatches(text, EPILOGUE_DUMP_PATTERNS).length >= 3,
      evidence: countMatches(text, EPILOGUE_DUMP_PATTERNS),
    },
    {
      name: "Sequel Bait",
      detected: countMatches(text, SEQUEL_BAIT_PATTERNS).length >= 2,
      evidence: countMatches(text, SEQUEL_BAIT_PATTERNS),
    },
  ];
}

function analyzeQualitySignals(text: string): EndingAnalysis["qualitySignals"] {
  // Inevitable indicators (things pointing to setup/payoff)
  const inevitablePatterns = [
    /\b(as .* knew .* would|just as|finally|at last|inevitable)\b/gi,
    /\b(always knew|saw it coming|expected|foreseen)\b/gi,
  ];

  // Surprise indicators
  const surprisePatterns = [
    /\b(never expected|surprised|shock|unexpected|twist)\b/gi,
    /\b(couldn't have known|impossible to predict|against all odds)\b/gi,
  ];

  // Character agency
  const agencyPatterns = [
    /\b(I chose|I decided|my choice|I will|I must)\b/gi,
    /\b(he chose|she decided|their choice|made the decision)\b/gi,
  ];

  return {
    inevitableIndicators: countMatches(text, inevitablePatterns),
    surpriseIndicators: countMatches(text, surprisePatterns),
    characterAgencyIndicators: countMatches(text, agencyPatterns),
    themeStatementWarnings: countMatches(text, THEME_SPEECH_PATTERNS),
  };
}

function analyzeEnding(text: string): EndingAnalysis {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const structure = analyzeStructure(text);
  const endingType = detectEndingType(text);
  const pacing = analyzePacing(text);
  const antiPatterns = detectAntiPatterns(text);
  const qualitySignals = analyzeQualitySignals(text);

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Structure issues
  if (!structure.hasClimax) {
    issues.push("No clear climax detected");
    recommendations.push("Ensure the central dramatic question is answered in a definitive moment");
  }

  if (!structure.hasFallingAction && structure.hasClimax) {
    issues.push("No falling action after climax - may feel rushed");
    recommendations.push("Add a beat for characters and readers to process the climax");
  }

  // Pacing issues
  if (pacing.assessment === "rushed") {
    issues.push("Ending appears rushed (very little content after climax)");
    recommendations.push("Allow space for denouement; let implications register");
  } else if (pacing.assessment === "extended") {
    issues.push("Ending may be too extended (significant content after climax)");
    recommendations.push("Consider cutting post-climax content; end on resonance, not explanation");
  }

  // Anti-pattern issues
  for (const pattern of antiPatterns) {
    if (pattern.detected) {
      issues.push(`Anti-pattern detected: ${pattern.name}`);
    }
  }

  if (antiPatterns.find(p => p.name === "Deus Ex Machina" && p.detected)) {
    recommendations.push("Ensure resolution emerges from established elements and protagonist's choices");
  }

  if (antiPatterns.find(p => p.name === "Theme Speech" && p.detected)) {
    recommendations.push("Remove explicit theme statements; demonstrate through action and image");
  }

  // Quality signal issues
  if (qualitySignals.characterAgencyIndicators.length === 0) {
    issues.push("No clear character choice/agency detected at climax");
    recommendations.push("Protagonist's decision should drive the resolution");
  }

  if (qualitySignals.inevitableIndicators.length === 0 && qualitySignals.surpriseIndicators.length === 0) {
    issues.push("Ending lacks both inevitability and surprise markers");
    recommendations.push("Best endings feel both inevitable (planted seeds) AND surprising (unexpected path)");
  }

  return {
    wordCount: words.length,
    structure,
    likelyType: endingType.type,
    typeConfidence: endingType.confidence,
    typeIndicators: endingType.indicators,
    pacing,
    antiPatterns,
    qualitySignals,
    issues,
    recommendations,
  };
}

function formatReport(analysis: EndingAnalysis): string {
  const lines: string[] = [];

  lines.push("# Ending Analysis\n");
  lines.push(`Word count: ${analysis.wordCount}`);
  lines.push(`Ending type: ${analysis.likelyType} (${analysis.typeConfidence} confidence)`);
  lines.push(`Pacing: ${analysis.pacing.assessment}\n`);

  lines.push("## Structure Detection\n");
  lines.push(`  Climax: ${analysis.structure.hasClimax ? "+" : "-"} ${analysis.structure.climaxIndicators.join(", ") || "(none detected)"}`);
  lines.push(`  Falling action: ${analysis.structure.hasFallingAction ? "+" : "-"}`);
  lines.push(`  Denouement: ${analysis.structure.hasDenouement ? "+" : "-"} ${analysis.structure.resolutionIndicators.join(", ") || "(none detected)"}`);
  lines.push("");

  lines.push("## Pacing Analysis\n");
  lines.push(`  Climax position: ~${Math.round(analysis.pacing.climaxPosition * 100)}% through text`);
  lines.push(`  Post-climax ratio: ${Math.round(analysis.pacing.postClimaxRatio * 100)}%`);
  lines.push(`  Assessment: ${analysis.pacing.assessment}`);
  lines.push("");

  if (analysis.typeIndicators.length > 0) {
    lines.push("## Type Indicators\n");
    for (const ind of analysis.typeIndicators) {
      lines.push(`  - ${ind}`);
    }
    lines.push("");
  }

  lines.push("## Quality Signals\n");
  lines.push(`  Inevitability: ${analysis.qualitySignals.inevitableIndicators.length > 0 ? analysis.qualitySignals.inevitableIndicators.join(", ") : "(none detected)"}`);
  lines.push(`  Surprise: ${analysis.qualitySignals.surpriseIndicators.length > 0 ? analysis.qualitySignals.surpriseIndicators.join(", ") : "(none detected)"}`);
  lines.push(`  Character agency: ${analysis.qualitySignals.characterAgencyIndicators.length > 0 ? analysis.qualitySignals.characterAgencyIndicators.join(", ") : "(none detected)"}`);
  lines.push("");

  const detectedPatterns = analysis.antiPatterns.filter(p => p.detected);
  if (detectedPatterns.length > 0) {
    lines.push("## Anti-Patterns Detected\n");
    for (const pattern of detectedPatterns) {
      lines.push(`  - ${pattern.name}: ${pattern.evidence.join(", ")}`);
    }
    lines.push("");
  }

  if (analysis.issues.length > 0) {
    lines.push("## Issues\n");
    for (const issue of analysis.issues) {
      lines.push(`  - ${issue}`);
    }
    lines.push("");
  }

  if (analysis.recommendations.length > 0) {
    lines.push("## Recommendations\n");
    for (const rec of analysis.recommendations) {
      lines.push(`  - ${rec}`);
    }
    lines.push("");
  }

  if (analysis.issues.length === 0) {
    lines.push("## Assessment\n");
    lines.push("  No major issues detected. Verify manually that:");
    lines.push("  - Ending emerges from character transformation");
    lines.push("  - Major setups receive payoffs");
    lines.push("  - Final image resonates with theme");
    lines.push("");
  }

  return lines.join("\n");
}

async function main(): Promise<void> {
  const args = Deno.args;

  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Ending Check - Resolution Structure Analyzer

Usage:
  deno run --allow-read ending-check.ts <file>
  deno run --allow-read ending-check.ts --text "The resolution..."

Options:
  --text "..."  Provide text inline
  --json        Output as JSON
  --help        Show this message

Analyzes:
  - Ending type (closed, open, twist, circular, ambiguous)
  - Structure (climax, falling action, denouement)
  - Pacing (rushed, balanced, extended)
  - Anti-patterns (deus ex machina, theme speech, etc.)
`);
    Deno.exit(0);
  }

  const jsonOutput = args.includes("--json");
  let text = "";

  if (args.includes("--text")) {
    const textIndex = args.indexOf("--text");
    text = args[textIndex + 1] || "";
  } else {
    const file = args.find(a => !a.startsWith("--"));
    if (file) {
      try {
        text = await Deno.readTextFile(file);
      } catch (e) {
        console.error(`Error reading file: ${e}`);
        Deno.exit(1);
      }
    }
  }

  if (!text.trim()) {
    console.error("Error: No text provided. Use --text or provide a file path.");
    Deno.exit(1);
  }

  const analysis = analyzeEnding(text);

  if (jsonOutput) {
    console.log(JSON.stringify(analysis, null, 2));
  } else {
    console.log(formatReport(analysis));
  }
}

main();
