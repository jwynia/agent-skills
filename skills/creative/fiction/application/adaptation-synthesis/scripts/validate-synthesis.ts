#!/usr/bin/env -S deno run --allow-read

/**
 * Validate Synthesis
 *
 * Checks synthesis documents for completeness, function coverage,
 * and alignment with source DNA and target genre.
 *
 * Usage:
 *   deno run --allow-read scripts/validate-synthesis.ts synthesis.json
 *   deno run --allow-read scripts/validate-synthesis.ts synthesis.json --against source.json
 *   deno run --allow-read scripts/validate-synthesis.ts synthesis.json --genre drama
 *   deno run --allow-read scripts/validate-synthesis.ts synthesis.json --full
 */

// === INTERFACES ===

interface ValidationResult {
  synthesis_name: string;
  overall_status: "pass" | "warn" | "fail";
  checks: {
    function_coverage: CheckResult;
    orthogonality: CheckResult;
    context_coherence: CheckResult;
    genre_alignment: CheckResult;
    completeness: CheckResult;
  };
  issues: string[];
  warnings: string[];
  ready_for: string[];
}

interface CheckResult {
  status: "pass" | "warn" | "fail";
  score: number;
  max_score: number;
  notes: string[];
}

interface SynthesisDocument {
  _meta: {
    type: string;
    synthesis_name: string;
    target_context: string;
    primary_source: string;
    secondary_sources: string[];
    target_genre: string;
    synthesis_date: string;
  };
  context_mapping?: Record<string, string>;
  function_to_form_mapping?: Record<string, {
    original_form: string;
    new_form: string;
    orthogonality_check: string;
    functions_served: string[];
  }>;
  tone_synthesis?: {
    original_tone: string;
    adapted_tone: string;
    sincerity_level: string;
    conflict_style: string;
  };
  character_synthesis?: Record<string, unknown>;
  validation?: Record<string, string>;
}

interface DNADocument {
  _meta: {
    source_work: string;
    extraction_depth: string;
  };
  emotional_core: {
    primary_genre: string;
    secondary_genres: string[];
    emotional_experience: string;
  };
  structural_requirements?: string[];
  characters?: Record<string, unknown>;
}

// === VALIDATION LOGIC ===

function validateCompleteness(synthesis: SynthesisDocument): CheckResult {
  const notes: string[] = [];
  let score = 0;
  const maxScore = 10;

  // Check meta fields
  if (synthesis._meta?.synthesis_name) {
    score += 1;
  } else {
    notes.push("Missing synthesis name");
  }

  if (synthesis._meta?.target_context) {
    score += 1;
  } else {
    notes.push("Missing target context");
  }

  if (synthesis._meta?.primary_source) {
    score += 1;
  } else {
    notes.push("Missing primary source reference");
  }

  if (synthesis._meta?.target_genre) {
    score += 1;
  } else {
    notes.push("Missing target genre");
  }

  // Check context mapping
  if (synthesis.context_mapping && Object.keys(synthesis.context_mapping).length > 0) {
    score += 2;
    if (Object.keys(synthesis.context_mapping).length >= 4) {
      score += 1;
    } else {
      notes.push("Context mapping could be more detailed");
    }
  } else {
    notes.push("Missing context mapping");
  }

  // Check function mappings
  if (synthesis.function_to_form_mapping && Object.keys(synthesis.function_to_form_mapping).length > 0) {
    score += 2;
    const mappingCount = Object.keys(synthesis.function_to_form_mapping).length;
    if (mappingCount >= 5) {
      score += 1;
    } else {
      notes.push(`Only ${mappingCount} function mappings - consider adding more`);
    }
  } else {
    notes.push("Missing function-to-form mappings");
  }

  // Check character synthesis
  if (synthesis.character_synthesis && Object.keys(synthesis.character_synthesis).length > 0) {
    // Score already at max if everything above passes
  } else {
    notes.push("Missing character synthesis");
  }

  return {
    status: score >= 8 ? "pass" : score >= 5 ? "warn" : "fail",
    score,
    max_score: maxScore,
    notes
  };
}

function validateOrthogonality(synthesis: SynthesisDocument): CheckResult {
  const notes: string[] = [];
  let score = 0;
  const maxScore = 10;

  if (!synthesis.function_to_form_mapping) {
    return {
      status: "fail",
      score: 0,
      max_score: maxScore,
      notes: ["No function mappings to check for orthogonality"]
    };
  }

  const mappings = Object.entries(synthesis.function_to_form_mapping);
  let passedChecks = 0;
  let explicitlyMarked = 0;

  for (const [func, mapping] of mappings) {
    // Check if orthogonality was explicitly evaluated
    if (mapping.orthogonality_check) {
      explicitlyMarked++;
      if (mapping.orthogonality_check.toLowerCase().includes("pass")) {
        passedChecks++;
      } else if (mapping.orthogonality_check.toLowerCase().includes("fail")) {
        notes.push(`Orthogonality FAILED for: ${func}`);
      } else {
        notes.push(`Unclear orthogonality status for: ${func}`);
      }
    }

    // Heuristic checks for surface translation
    if (mapping.new_form && mapping.original_form) {
      const original = mapping.original_form.toLowerCase();
      const newForm = mapping.new_form.toLowerCase();

      // Check for obvious 1:1 translations
      const surfaceIndicators = ["space ", "cyber", "future ", "sci-fi ", "fantasy "];
      for (const indicator of surfaceIndicators) {
        if (newForm.includes(indicator) && !original.includes(indicator)) {
          notes.push(`Possible surface translation: "${mapping.new_form}" - just adding setting prefix?`);
          break;
        }
      }
    }
  }

  // Score based on explicit checks
  if (mappings.length > 0) {
    if (explicitlyMarked === mappings.length) {
      score += 4;
    } else if (explicitlyMarked > 0) {
      score += 2;
      notes.push(`Only ${explicitlyMarked}/${mappings.length} mappings have explicit orthogonality check`);
    } else {
      notes.push("No explicit orthogonality checks recorded");
    }

    const passRate = passedChecks / mappings.length;
    score += Math.round(passRate * 6);
  }

  return {
    status: score >= 8 ? "pass" : score >= 5 ? "warn" : "fail",
    score,
    max_score: maxScore,
    notes
  };
}

function validateFunctionCoverage(synthesis: SynthesisDocument, source: DNADocument | null): CheckResult {
  const notes: string[] = [];
  let score = 0;
  const maxScore = 10;

  if (!synthesis.function_to_form_mapping) {
    return {
      status: "fail",
      score: 0,
      max_score: maxScore,
      notes: ["No function mappings present"]
    };
  }

  const mappedFunctions = Object.keys(synthesis.function_to_form_mapping);

  // Basic: has some mappings
  if (mappedFunctions.length > 0) {
    score += 2;
  }

  // Check that mappings have functions_served
  let functionsServed = 0;
  for (const mapping of Object.values(synthesis.function_to_form_mapping)) {
    if (mapping.functions_served && mapping.functions_served.length > 0) {
      functionsServed += mapping.functions_served.length;
    }
  }

  if (functionsServed >= 10) {
    score += 3;
  } else if (functionsServed >= 5) {
    score += 2;
    notes.push("Consider documenting more functions served by each mapping");
  } else {
    score += 1;
    notes.push("Few functions documented - synthesis may have gaps");
  }

  // If we have source DNA, check coverage
  if (source && source.structural_requirements) {
    const requirements = source.structural_requirements;
    let covered = 0;

    for (const req of requirements) {
      // Check if any mapping mentions this requirement
      const reqWords = req.toLowerCase().split(/\s+/);
      let found = false;

      for (const mapping of Object.values(synthesis.function_to_form_mapping)) {
        const mappingText = JSON.stringify(mapping).toLowerCase();
        if (reqWords.some(word => word.length > 4 && mappingText.includes(word))) {
          found = true;
          break;
        }
      }

      if (found) covered++;
    }

    const coverageRate = covered / requirements.length;
    score += Math.round(coverageRate * 5);

    if (coverageRate < 1) {
      notes.push(`${requirements.length - covered}/${requirements.length} structural requirements may not be covered`);
    }
  } else {
    // No source to check against - assume reasonable coverage
    score += 3;
    notes.push("No source DNA provided - cannot verify full function coverage");
  }

  return {
    status: score >= 8 ? "pass" : score >= 5 ? "warn" : "fail",
    score,
    max_score: maxScore,
    notes
  };
}

function validateContextCoherence(synthesis: SynthesisDocument): CheckResult {
  const notes: string[] = [];
  let score = 0;
  const maxScore = 10;

  // Check context mapping exists and is substantive
  if (!synthesis.context_mapping || Object.keys(synthesis.context_mapping).length === 0) {
    return {
      status: "fail",
      score: 0,
      max_score: maxScore,
      notes: ["No context mapping present"]
    };
  }

  const contextFields = Object.keys(synthesis.context_mapping);
  const contextValues = Object.values(synthesis.context_mapping);

  // Basic: has context mapping
  score += 2;

  // Check for key context elements
  const desiredFields = ["setting", "power_structure", "information_control", "escape_prevention"];
  let fieldsPresent = 0;
  for (const field of desiredFields) {
    if (contextFields.some(f => f.toLowerCase().includes(field.replace("_", "")))) {
      fieldsPresent++;
    }
  }
  score += Math.min(4, fieldsPresent);
  if (fieldsPresent < desiredFields.length) {
    notes.push(`Consider adding context for: ${desiredFields.filter(f =>
      !contextFields.some(cf => cf.toLowerCase().includes(f.replace("_", "")))
    ).join(", ")}`);
  }

  // Check that context values are substantive (not just placeholders)
  const substantiveValues = contextValues.filter(v => v && v.length > 10);
  if (substantiveValues.length === contextValues.length) {
    score += 2;
  } else {
    notes.push("Some context values seem like placeholders");
    score += 1;
  }

  // Check function mappings fit context
  if (synthesis.function_to_form_mapping) {
    const contextText = JSON.stringify(synthesis.context_mapping).toLowerCase();
    let coherent = 0;
    const mappings = Object.values(synthesis.function_to_form_mapping);

    for (const mapping of mappings) {
      // Basic heuristic: new form should use words from context
      if (mapping.new_form) {
        const formWords = mapping.new_form.toLowerCase().split(/\s+/);
        if (formWords.some(w => w.length > 4 && contextText.includes(w))) {
          coherent++;
        }
      }
    }

    if (mappings.length > 0) {
      const coherenceRate = coherent / mappings.length;
      score += Math.round(coherenceRate * 2);
      if (coherenceRate < 0.5) {
        notes.push("Some new forms may not fit the defined context");
      }
    }
  }

  return {
    status: score >= 8 ? "pass" : score >= 5 ? "warn" : "fail",
    score,
    max_score: maxScore,
    notes
  };
}

function validateGenreAlignment(synthesis: SynthesisDocument, targetGenre: string | null, source: DNADocument | null): CheckResult {
  const notes: string[] = [];
  let score = 0;
  const maxScore = 10;

  const genre = targetGenre || synthesis._meta?.target_genre;

  if (!genre) {
    return {
      status: "warn",
      score: 5,
      max_score: maxScore,
      notes: ["No target genre specified - cannot validate alignment"]
    };
  }

  // Has explicit genre
  score += 2;

  // Check if source genre matches (if available)
  if (source?.emotional_core?.primary_genre) {
    if (source.emotional_core.primary_genre.toLowerCase() === genre.toLowerCase()) {
      score += 3;
      notes.push("Target genre matches source primary genre");
    } else {
      notes.push(`Source genre (${source.emotional_core.primary_genre}) differs from target (${genre}) - intentional shift?`);
      score += 1; // Not inherently wrong, but flag it
    }
  } else {
    score += 2; // No source to compare
  }

  // Check tone synthesis for genre appropriateness
  if (synthesis.tone_synthesis) {
    score += 2;
    // Basic genre-tone heuristics
    const tone = JSON.stringify(synthesis.tone_synthesis).toLowerCase();
    const genreLower = genre.toLowerCase();

    if (genreLower === "horror" && !tone.includes("dread") && !tone.includes("fear") && !tone.includes("unease")) {
      notes.push("Horror genre but tone doesn't mention dread/fear/unease");
    }
    if (genreLower === "humor" && !tone.includes("comic") && !tone.includes("funny") && !tone.includes("wit")) {
      notes.push("Humor genre but tone doesn't mention comedy elements");
    }
    if (genreLower === "drama" && tone.includes("light") && tone.includes("comedy")) {
      notes.push("Drama genre but tone seems light - intentional dramedy?");
    }
  } else {
    notes.push("No tone synthesis - harder to verify genre alignment");
  }

  // Check for explicit genre validation in document
  if (synthesis.validation?.genre_check?.toLowerCase().includes("pass")) {
    score += 3;
  } else if (synthesis.validation?.genre_check) {
    score += 1;
    notes.push("Genre check in document doesn't indicate clear pass");
  }

  return {
    status: score >= 8 ? "pass" : score >= 5 ? "warn" : "fail",
    score,
    max_score: maxScore,
    notes
  };
}

function runValidation(synthesis: SynthesisDocument, source: DNADocument | null, targetGenre: string | null): ValidationResult {
  const completeness = validateCompleteness(synthesis);
  const orthogonality = validateOrthogonality(synthesis);
  const functionCoverage = validateFunctionCoverage(synthesis, source);
  const contextCoherence = validateContextCoherence(synthesis);
  const genreAlignment = validateGenreAlignment(synthesis, targetGenre, source);

  const checks = {
    function_coverage: functionCoverage,
    orthogonality: orthogonality,
    context_coherence: contextCoherence,
    genre_alignment: genreAlignment,
    completeness: completeness
  };

  // Aggregate issues and warnings
  const issues: string[] = [];
  const warnings: string[] = [];

  for (const [name, check] of Object.entries(checks)) {
    if (check.status === "fail") {
      issues.push(`${name}: FAILED (${check.score}/${check.max_score})`);
      issues.push(...check.notes.map(n => `  - ${n}`));
    } else if (check.status === "warn") {
      warnings.push(`${name}: WARNING (${check.score}/${check.max_score})`);
      warnings.push(...check.notes.map(n => `  - ${n}`));
    }
  }

  // Determine overall status
  const failCount = Object.values(checks).filter(c => c.status === "fail").length;
  const warnCount = Object.values(checks).filter(c => c.status === "warn").length;

  let overallStatus: "pass" | "warn" | "fail";
  if (failCount > 0) {
    overallStatus = "fail";
  } else if (warnCount > 1) {
    overallStatus = "warn";
  } else {
    overallStatus = "pass";
  }

  // Determine readiness
  const readyFor: string[] = [];
  if (overallStatus === "pass") {
    readyFor.push("outline-collaborator", "drafting");
  } else if (overallStatus === "warn") {
    readyFor.push("review and refinement");
  } else {
    readyFor.push("address issues before proceeding");
  }

  return {
    synthesis_name: synthesis._meta?.synthesis_name || "Unknown",
    overall_status: overallStatus,
    checks,
    issues,
    warnings,
    ready_for: readyFor
  };
}

// === FORMATTING ===

function formatValidationResult(result: ValidationResult): string {
  const lines: string[] = [];

  const statusEmoji = result.overall_status === "pass" ? "[PASS]" :
                      result.overall_status === "warn" ? "[WARN]" : "[FAIL]";

  lines.push(`# Validation Result: ${result.synthesis_name}`);
  lines.push("");
  lines.push(`## Overall Status: ${statusEmoji} ${result.overall_status.toUpperCase()}`);
  lines.push("");

  lines.push("## Check Results");
  lines.push("");
  lines.push("| Check | Status | Score |");
  lines.push("|-------|--------|-------|");

  for (const [name, check] of Object.entries(result.checks)) {
    const emoji = check.status === "pass" ? "PASS" : check.status === "warn" ? "WARN" : "FAIL";
    lines.push(`| ${name.replace(/_/g, " ")} | ${emoji} | ${check.score}/${check.max_score} |`);
  }
  lines.push("");

  if (result.issues.length > 0) {
    lines.push("## Issues (Must Fix)");
    lines.push("");
    for (const issue of result.issues) {
      lines.push(issue);
    }
    lines.push("");
  }

  if (result.warnings.length > 0) {
    lines.push("## Warnings (Consider)");
    lines.push("");
    for (const warning of result.warnings) {
      lines.push(warning);
    }
    lines.push("");
  }

  lines.push("## Ready For");
  lines.push("");
  for (const ready of result.ready_for) {
    lines.push(`- ${ready}`);
  }
  lines.push("");

  // Detailed notes per check
  lines.push("## Detailed Notes");
  lines.push("");
  for (const [name, check] of Object.entries(result.checks)) {
    if (check.notes.length > 0) {
      lines.push(`### ${name.replace(/_/g, " ")}`);
      for (const note of check.notes) {
        lines.push(`- ${note}`);
      }
      lines.push("");
    }
  }

  return lines.join("\n");
}

// === MAIN ===

function main(): void {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h")) {
    console.log(`Validate Synthesis

Usage:
  deno run --allow-read scripts/validate-synthesis.ts synthesis.json
  deno run --allow-read scripts/validate-synthesis.ts synthesis.json --against source.json
  deno run --allow-read scripts/validate-synthesis.ts synthesis.json --genre drama
  deno run --allow-read scripts/validate-synthesis.ts synthesis.json --full

Options:
  --against <file>   Source DNA to validate coverage against
  --genre <name>     Target genre to check alignment
  --full             Run all checks with verbose output
  --json             Output as JSON

Checks Performed:
  - Completeness: Are all required sections present?
  - Orthogonality: Do new forms avoid surface translation?
  - Function Coverage: Are source functions served?
  - Context Coherence: Do forms fit the target context?
  - Genre Alignment: Does synthesis deliver intended emotional experience?
`);
    Deno.exit(0);
  }

  const isJson = args.includes("--json");
  const isFull = args.includes("--full");

  // Parse arguments
  const againstIndex = args.indexOf("--against");
  const againstFile = againstIndex !== -1 ? args[againstIndex + 1] : null;

  const genreIndex = args.indexOf("--genre");
  const genre = genreIndex !== -1 ? args[genreIndex + 1] : null;

  // Find synthesis file (first positional argument)
  const skipIndices = new Set<number>();
  if (againstIndex !== -1) {
    skipIndices.add(againstIndex);
    skipIndices.add(againstIndex + 1);
  }
  if (genreIndex !== -1) {
    skipIndices.add(genreIndex);
    skipIndices.add(genreIndex + 1);
  }

  let synthesisFile: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      synthesisFile = args[i];
      break;
    }
  }

  if (!synthesisFile) {
    console.error("Error: Please provide a synthesis file to validate");
    console.error("Usage: deno run --allow-read scripts/validate-synthesis.ts synthesis.json");
    Deno.exit(1);
  }

  // Load synthesis document
  let synthesis: SynthesisDocument;
  try {
    const content = Deno.readTextFileSync(synthesisFile);
    synthesis = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading synthesis file: ${e}`);
    Deno.exit(1);
  }

  // Load source DNA if provided
  let source: DNADocument | null = null;
  if (againstFile) {
    try {
      const content = Deno.readTextFileSync(againstFile);
      source = JSON.parse(content);
    } catch (e) {
      console.error(`Error reading source DNA file: ${e}`);
      Deno.exit(1);
    }
  }

  // Run validation
  const result = runValidation(synthesis, source, genre);

  // Output
  if (isJson) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(formatValidationResult(result));
  }
}

main();
