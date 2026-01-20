#!/usr/bin/env -S deno run --allow-read

/**
 * ea-validate.ts - Analysis Validation (Deterministic)
 *
 * Validates analysis output for citation accuracy and schema completeness.
 * This is a DETERMINISTIC script - it performs mechanical validation.
 *
 * Usage:
 *   deno run --allow-read scripts/ea-validate.ts <analysis.json>
 *   deno run --allow-read scripts/ea-validate.ts analysis.json --source book.txt
 *   deno run --allow-read scripts/ea-validate.ts analysis.json --report
 */

// === INTERFACES ===

interface ValidationIssue {
  severity: "error" | "warning" | "info";
  type: string;
  concept_id?: string;
  relationship_id?: string;
  message: string;
  suggestion?: string;
}

interface ValidationReport {
  file: string;
  validation_date: string;
  source_file?: string;
  source_verified: boolean;
  issues: ValidationIssue[];
  summary: {
    errors: number;
    warnings: number;
    info: number;
    concepts_checked: number;
    relationships_checked: number;
    citations_verified: number;
  };
  passed: boolean;
}

interface AnalysisFile {
  source?: {
    title?: string;
    author?: string;
    file_path?: string;
  };
  concepts?: Array<{
    id: string;
    name?: string;
    exact_quote?: string;
    start_position?: number;
    end_position?: number;
    type?: string;
    layer?: number;
  }>;
  relationships?: Array<{
    id: string;
    source_id?: string;
    target_id?: string;
    type?: string;
    strength?: number;
  }>;
}

// === VALIDATION CHECKS ===

function validateSchema(analysis: AnalysisFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check source metadata
  if (!analysis.source) {
    issues.push({
      severity: "error",
      type: "missing_source",
      message: "Missing source metadata",
      suggestion: "Add source object with title, author, and file_path",
    });
  } else {
    if (!analysis.source.title) {
      issues.push({
        severity: "warning",
        type: "missing_title",
        message: "Source missing title",
      });
    }
    if (!analysis.source.author) {
      issues.push({
        severity: "warning",
        type: "missing_author",
        message: "Source missing author",
      });
    }
  }

  // Check concepts
  if (!analysis.concepts || analysis.concepts.length === 0) {
    issues.push({
      severity: "warning",
      type: "no_concepts",
      message: "No concepts found in analysis",
    });
  } else {
    for (const concept of analysis.concepts) {
      // Required fields
      if (!concept.id) {
        issues.push({
          severity: "error",
          type: "missing_id",
          concept_id: "unknown",
          message: "Concept missing ID",
        });
        continue;
      }

      if (!concept.name) {
        issues.push({
          severity: "error",
          type: "missing_name",
          concept_id: concept.id,
          message: `Concept ${concept.id} missing name`,
        });
      }

      if (!concept.exact_quote) {
        issues.push({
          severity: "error",
          type: "missing_quote",
          concept_id: concept.id,
          message: `Concept ${concept.id} missing exact_quote (citation traceability required)`,
          suggestion: "Every concept must have an exact quote from the source",
        });
      }

      if (concept.start_position === undefined || concept.end_position === undefined) {
        issues.push({
          severity: "warning",
          type: "missing_position",
          concept_id: concept.id,
          message: `Concept ${concept.id} missing position data`,
          suggestion: "Position data enables citation verification",
        });
      }

      // Classification fields
      const validTypes = ["principle", "mechanism", "pattern", "strategy", "tactic"];
      if (concept.type && !validTypes.includes(concept.type)) {
        issues.push({
          severity: "warning",
          type: "invalid_type",
          concept_id: concept.id,
          message: `Concept ${concept.id} has invalid type: ${concept.type}`,
          suggestion: `Valid types: ${validTypes.join(", ")}`,
        });
      }

      if (concept.layer !== undefined && (concept.layer < 0 || concept.layer > 4)) {
        issues.push({
          severity: "warning",
          type: "invalid_layer",
          concept_id: concept.id,
          message: `Concept ${concept.id} has invalid layer: ${concept.layer}`,
          suggestion: "Layers should be 0-4",
        });
      }
    }
  }

  // Check relationships
  if (analysis.relationships) {
    const conceptIds = new Set(analysis.concepts?.map((c) => c.id) || []);

    for (const rel of analysis.relationships) {
      if (!rel.id) {
        issues.push({
          severity: "error",
          type: "missing_rel_id",
          message: "Relationship missing ID",
        });
        continue;
      }

      if (!rel.source_id || !rel.target_id) {
        issues.push({
          severity: "error",
          type: "missing_rel_endpoints",
          relationship_id: rel.id,
          message: `Relationship ${rel.id} missing source_id or target_id`,
        });
        continue;
      }

      if (!conceptIds.has(rel.source_id)) {
        issues.push({
          severity: "error",
          type: "invalid_source_ref",
          relationship_id: rel.id,
          message: `Relationship ${rel.id} references non-existent source: ${rel.source_id}`,
        });
      }

      if (!conceptIds.has(rel.target_id)) {
        issues.push({
          severity: "error",
          type: "invalid_target_ref",
          relationship_id: rel.id,
          message: `Relationship ${rel.id} references non-existent target: ${rel.target_id}`,
        });
      }

      const validRelTypes = ["INFLUENCES", "SUPPORTS", "CONTRADICTS", "COMPOSED_OF", "DERIVES_FROM"];
      if (rel.type && !validRelTypes.includes(rel.type)) {
        issues.push({
          severity: "warning",
          type: "invalid_rel_type",
          relationship_id: rel.id,
          message: `Relationship ${rel.id} has invalid type: ${rel.type}`,
        });
      }

      if (rel.type === "INFLUENCES") {
        if (rel.strength !== undefined && (rel.strength < -1 || rel.strength > 1)) {
          issues.push({
            severity: "warning",
            type: "invalid_strength",
            relationship_id: rel.id,
            message: `INFLUENCES relationship ${rel.id} strength out of range: ${rel.strength}`,
            suggestion: "INFLUENCES strength should be -1 to +1",
          });
        }
      } else {
        if (rel.strength !== undefined && (rel.strength < 0 || rel.strength > 1)) {
          issues.push({
            severity: "warning",
            type: "invalid_strength",
            relationship_id: rel.id,
            message: `Relationship ${rel.id} strength out of range: ${rel.strength}`,
            suggestion: "Strength should be 0 to 1",
          });
        }
      }
    }
  }

  return issues;
}

async function validateCitations(
  analysis: AnalysisFile,
  sourceText: string
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];

  if (!analysis.concepts) return issues;

  for (const concept of analysis.concepts) {
    if (!concept.exact_quote) continue;

    // Check if quote exists in source
    const quoteIndex = sourceText.indexOf(concept.exact_quote);

    if (quoteIndex === -1) {
      // Try fuzzy match (ignoring whitespace differences)
      const normalizedQuote = concept.exact_quote.replace(/\s+/g, " ").trim();
      const normalizedSource = sourceText.replace(/\s+/g, " ");
      const fuzzyIndex = normalizedSource.indexOf(normalizedQuote);

      if (fuzzyIndex === -1) {
        issues.push({
          severity: "error",
          type: "quote_not_found",
          concept_id: concept.id,
          message: `Quote not found in source: "${concept.exact_quote.slice(0, 50)}..."`,
          suggestion: "Verify exact quote matches source text",
        });
      } else {
        issues.push({
          severity: "info",
          type: "quote_whitespace",
          concept_id: concept.id,
          message: `Quote found with whitespace differences: ${concept.id}`,
        });
      }
    } else {
      // Check position accuracy if provided
      if (concept.start_position !== undefined) {
        if (Math.abs(quoteIndex - concept.start_position) > 100) {
          issues.push({
            severity: "warning",
            type: "position_mismatch",
            concept_id: concept.id,
            message: `Position mismatch for ${concept.id}: claimed ${concept.start_position}, found ${quoteIndex}`,
            suggestion: "Update start_position to accurate value",
          });
        }
      }
    }
  }

  return issues;
}

function checkOrphanConcepts(analysis: AnalysisFile): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!analysis.concepts || !analysis.relationships) return issues;

  const linkedIds = new Set<string>();
  for (const rel of analysis.relationships) {
    if (rel.source_id) linkedIds.add(rel.source_id);
    if (rel.target_id) linkedIds.add(rel.target_id);
  }

  const orphans = analysis.concepts.filter((c) => !linkedIds.has(c.id));

  if (orphans.length > 0) {
    issues.push({
      severity: "info",
      type: "orphan_concepts",
      message: `${orphans.length} concept(s) have no relationships: ${orphans.map((c) => c.id).join(", ")}`,
      suggestion: "Consider adding relationships or removing low-value concepts",
    });
  }

  return issues;
}

// === MAIN ===

async function main(): Promise<void> {
  const args = Deno.args;

  // Help
  if (args.includes("--help") || args.includes("-h") || args.length === 0) {
    console.log(`ea-validate.ts - Analysis Validation

Usage:
  deno run --allow-read scripts/ea-validate.ts <analysis.json> [options]

Arguments:
  analysis.json        Analysis output to validate

Options:
  --source <file>      Original source text for citation verification
  --report             Output full validation report (default)
  --json               Output report as JSON
  --quiet              Only output errors

Examples:
  # Validate analysis file
  deno run --allow-read scripts/ea-validate.ts analysis.json

  # Validate with source verification
  deno run --allow-read scripts/ea-validate.ts analysis.json --source book.txt

  # JSON output for automation
  deno run --allow-read scripts/ea-validate.ts analysis.json --json
`);
    Deno.exit(0);
  }

  // Parse arguments
  const sourceIdx = args.indexOf("--source");
  const sourceFile = sourceIdx !== -1 ? args[sourceIdx + 1] : null;

  const jsonOutput = args.includes("--json");
  const quiet = args.includes("--quiet");

  // Find input file
  const skipIndices = new Set<number>();
  if (sourceIdx !== -1) {
    skipIndices.add(sourceIdx);
    skipIndices.add(sourceIdx + 1);
  }

  let inputFile: string | null = null;
  for (let i = 0; i < args.length; i++) {
    if (!args[i].startsWith("--") && !skipIndices.has(i)) {
      inputFile = args[i];
      break;
    }
  }

  if (!inputFile) {
    console.error("Error: No input file specified");
    Deno.exit(1);
  }

  // Load analysis
  let analysis: AnalysisFile;
  try {
    const content = await Deno.readTextFile(inputFile);
    analysis = JSON.parse(content);
  } catch (e) {
    console.error(`Error reading analysis file: ${e}`);
    Deno.exit(1);
  }

  // Collect issues
  const issues: ValidationIssue[] = [];

  // Schema validation
  issues.push(...validateSchema(analysis));

  // Citation verification (if source provided)
  let sourceVerified = false;
  let citationsVerified = 0;

  if (sourceFile) {
    try {
      const sourceText = await Deno.readTextFile(sourceFile);
      const citationIssues = await validateCitations(analysis, sourceText);
      issues.push(...citationIssues);
      sourceVerified = true;
      citationsVerified = analysis.concepts?.filter((c) => c.exact_quote).length || 0;
    } catch (e) {
      issues.push({
        severity: "warning",
        type: "source_read_error",
        message: `Could not read source file: ${e}`,
      });
    }
  }

  // Orphan check
  issues.push(...checkOrphanConcepts(analysis));

  // Build report
  const report: ValidationReport = {
    file: inputFile,
    validation_date: new Date().toISOString(),
    source_file: sourceFile || undefined,
    source_verified: sourceVerified,
    issues,
    summary: {
      errors: issues.filter((i) => i.severity === "error").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
      info: issues.filter((i) => i.severity === "info").length,
      concepts_checked: analysis.concepts?.length || 0,
      relationships_checked: analysis.relationships?.length || 0,
      citations_verified: citationsVerified,
    },
    passed: issues.filter((i) => i.severity === "error").length === 0,
  };

  // Output
  if (jsonOutput) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(`Validation Report: ${inputFile}`);
    console.log("=".repeat(60));
    console.log(`Date: ${report.validation_date}`);
    console.log(`Source verified: ${sourceVerified ? "Yes" : "No"}`);
    console.log("");

    console.log("Summary:");
    console.log(`  Concepts checked: ${report.summary.concepts_checked}`);
    console.log(`  Relationships checked: ${report.summary.relationships_checked}`);
    console.log(`  Citations verified: ${report.summary.citations_verified}`);
    console.log(`  Errors: ${report.summary.errors}`);
    console.log(`  Warnings: ${report.summary.warnings}`);
    console.log(`  Info: ${report.summary.info}`);
    console.log("");

    if (!quiet) {
      if (issues.length > 0) {
        console.log("Issues:");
        for (const issue of issues) {
          const prefix = issue.severity === "error" ? "[ERROR]" :
                        issue.severity === "warning" ? "[WARN]" : "[INFO]";
          console.log(`  ${prefix} ${issue.message}`);
          if (issue.suggestion) {
            console.log(`         Suggestion: ${issue.suggestion}`);
          }
        }
        console.log("");
      }
    }

    console.log(report.passed ? "PASSED" : "FAILED");
  }

  Deno.exit(report.passed ? 0 : 1);
}

main();
