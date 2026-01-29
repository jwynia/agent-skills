#!/usr/bin/env -S deno run --allow-read

/**
 * Validate Workflow Schema Matching
 *
 * This script analyzes Mastra workflow files to detect schema mismatches
 * between steps that would cause runtime errors.
 *
 * Usage:
 *   deno run --allow-read scripts/validate-workflow-schemas.ts ./src/mastra/workflows/
 *   deno run --allow-read scripts/validate-workflow-schemas.ts ./src/mastra/workflows/my-workflow.ts
 *
 * Checks:
 *   - Workflow inputSchema matches first step's inputSchema
 *   - Step N outputSchema matches Step N+1 inputSchema
 *   - Final step outputSchema matches workflow outputSchema
 *   - Parallel step outputs are keyed by step ID
 *   - Branch outputs use .optional()
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { basename, extname } from "https://deno.land/std@0.208.0/path/mod.ts";

interface ValidationIssue {
  file: string;
  line?: number;
  severity: "error" | "warning";
  message: string;
  suggestion?: string;
}

interface StepInfo {
  id: string;
  inputSchema?: string;
  outputSchema?: string;
  line: number;
}

interface WorkflowInfo {
  id: string;
  inputSchema?: string;
  outputSchema?: string;
  steps: StepInfo[];
  chains: string[]; // .then(), .parallel(), .branch() calls
  line: number;
}

async function main() {
  const args = parse(Deno.args, {
    string: ["format"],
    boolean: ["help", "verbose"],
    default: {
      format: "text",
      verbose: false,
    },
  });

  if (args.help || args._.length === 0) {
    console.log(`
Validate Mastra Workflow Schema Matching

Usage:
  deno run --allow-read scripts/validate-workflow-schemas.ts <path> [options]

Arguments:
  <path>          Path to workflow file or directory

Options:
  --format        Output format: text (default), json
  --verbose       Show detailed analysis
  --help          Show this help

Examples:
  deno run --allow-read scripts/validate-workflow-schemas.ts ./src/mastra/workflows/
  deno run --allow-read scripts/validate-workflow-schemas.ts ./src/mastra/workflows/my-workflow.ts --verbose
`);
    Deno.exit(0);
  }

  const targetPath = String(args._[0]);
  const issues: ValidationIssue[] = [];

  // Check if path is file or directory
  const stat = await Deno.stat(targetPath);

  if (stat.isFile) {
    const fileIssues = await validateFile(targetPath, args.verbose);
    issues.push(...fileIssues);
  } else if (stat.isDirectory) {
    for await (const entry of walk(targetPath, {
      exts: [".ts", ".tsx"],
      includeDirs: false,
    })) {
      const fileIssues = await validateFile(entry.path, args.verbose);
      issues.push(...fileIssues);
    }
  }

  // Output results
  if (args.format === "json") {
    console.log(JSON.stringify({ issues }, null, 2));
  } else {
    outputText(issues);
  }

  // Exit with error code if issues found
  const errorCount = issues.filter((i) => i.severity === "error").length;
  if (errorCount > 0) {
    Deno.exit(1);
  }
}

async function validateFile(
  filePath: string,
  verbose: boolean
): Promise<ValidationIssue[]> {
  const issues: ValidationIssue[] = [];
  const content = await Deno.readTextFile(filePath);
  const lines = content.split("\n");

  if (verbose) {
    console.log(`\nAnalyzing: ${filePath}`);
  }

  // Check for workflow-related imports
  if (!content.includes("createWorkflow") && !content.includes("createStep")) {
    return issues; // Not a workflow file
  }

  // Extract step definitions
  const steps = extractSteps(content, lines);
  if (verbose && steps.length > 0) {
    console.log(`  Found ${steps.length} steps`);
  }

  // Extract workflow definitions
  const workflows = extractWorkflows(content, lines);
  if (verbose && workflows.length > 0) {
    console.log(`  Found ${workflows.length} workflows`);
  }

  // Validate schema chains
  for (const workflow of workflows) {
    // Find chain order from .then(), .parallel(), .branch() calls
    const chainedStepIds = extractChainOrder(content, workflow.id);

    if (verbose) {
      console.log(`  Workflow "${workflow.id}" chain: ${chainedStepIds.join(" -> ")}`);
    }

    // Check workflow input matches first step
    if (chainedStepIds.length > 0) {
      const firstStepId = chainedStepIds[0];
      const firstStep = steps.find((s) => s.id === firstStepId);

      if (firstStep && workflow.inputSchema && firstStep.inputSchema) {
        const match = schemasMatch(workflow.inputSchema, firstStep.inputSchema);
        if (!match) {
          issues.push({
            file: filePath,
            line: workflow.line,
            severity: "error",
            message: `Workflow inputSchema does not match first step "${firstStepId}" inputSchema`,
            suggestion: "Ensure workflow inputSchema exactly matches the first step's inputSchema",
          });
        }
      }
    }

    // Check step-to-step schema matching
    for (let i = 0; i < chainedStepIds.length - 1; i++) {
      const currentStepId = chainedStepIds[i];
      const nextStepId = chainedStepIds[i + 1];

      const currentStep = steps.find((s) => s.id === currentStepId);
      const nextStep = steps.find((s) => s.id === nextStepId);

      if (currentStep && nextStep) {
        if (currentStep.outputSchema && nextStep.inputSchema) {
          const match = schemasMatch(currentStep.outputSchema, nextStep.inputSchema);
          if (!match) {
            issues.push({
              file: filePath,
              line: nextStep.line,
              severity: "error",
              message: `Step "${currentStepId}" outputSchema does not match step "${nextStepId}" inputSchema`,
              suggestion: `Ensure "${currentStepId}" output exactly matches "${nextStepId}" input, or use .map() to transform`,
            });
          }
        }
      }
    }

    // Check final step matches workflow output
    if (chainedStepIds.length > 0) {
      const lastStepId = chainedStepIds[chainedStepIds.length - 1];
      const lastStep = steps.find((s) => s.id === lastStepId);

      if (lastStep && workflow.outputSchema && lastStep.outputSchema) {
        const match = schemasMatch(lastStep.outputSchema, workflow.outputSchema);
        if (!match) {
          issues.push({
            file: filePath,
            line: workflow.line,
            severity: "error",
            message: `Final step "${lastStepId}" outputSchema does not match workflow outputSchema`,
            suggestion: "Ensure final step output exactly matches workflow outputSchema",
          });
        }
      }
    }
  }

  // Check for common anti-patterns
  issues.push(...checkAntiPatterns(content, lines, filePath));

  return issues;
}

function extractSteps(content: string, lines: string[]): StepInfo[] {
  const steps: StepInfo[] = [];
  const stepRegex = /createStep\s*\(\s*\{[\s\S]*?id:\s*["']([^"']+)["']/g;

  let match;
  while ((match = stepRegex.exec(content)) !== null) {
    const stepId = match[1];
    const stepStart = match.index;
    const lineNumber = content.substring(0, stepStart).split("\n").length;

    // Extract schemas from the step block
    const stepBlock = extractBlock(content, stepStart);
    const inputSchema = extractSchemaField(stepBlock, "inputSchema");
    const outputSchema = extractSchemaField(stepBlock, "outputSchema");

    steps.push({
      id: stepId,
      inputSchema,
      outputSchema,
      line: lineNumber,
    });
  }

  return steps;
}

function extractWorkflows(content: string, lines: string[]): WorkflowInfo[] {
  const workflows: WorkflowInfo[] = [];
  const workflowRegex = /createWorkflow\s*\(\s*\{[\s\S]*?id:\s*["']([^"']+)["']/g;

  let match;
  while ((match = workflowRegex.exec(content)) !== null) {
    const workflowId = match[1];
    const workflowStart = match.index;
    const lineNumber = content.substring(0, workflowStart).split("\n").length;

    const workflowBlock = extractBlock(content, workflowStart);
    const inputSchema = extractSchemaField(workflowBlock, "inputSchema");
    const outputSchema = extractSchemaField(workflowBlock, "outputSchema");

    workflows.push({
      id: workflowId,
      inputSchema,
      outputSchema,
      steps: [],
      chains: [],
      line: lineNumber,
    });
  }

  return workflows;
}

function extractChainOrder(content: string, workflowId: string): string[] {
  const stepIds: string[] = [];

  // Find the workflow definition and its chain
  const workflowPattern = new RegExp(
    `createWorkflow\\s*\\([^)]+id:\\s*["']${workflowId}["'][^)]*\\)([\\s\\S]*?)\\.commit\\(\\)`,
    "g"
  );

  const match = workflowPattern.exec(content);
  if (!match) return stepIds;

  const chainContent = match[1];

  // Extract .then(stepName) calls
  const thenPattern = /\.then\s*\(\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\)/g;
  let thenMatch;
  while ((thenMatch = thenPattern.exec(chainContent)) !== null) {
    stepIds.push(thenMatch[1]);
  }

  return stepIds;
}

function extractBlock(content: string, startIndex: number): string {
  let depth = 0;
  let blockStart = -1;

  for (let i = startIndex; i < content.length; i++) {
    if (content[i] === "{") {
      if (blockStart === -1) blockStart = i;
      depth++;
    } else if (content[i] === "}") {
      depth--;
      if (depth === 0) {
        return content.substring(blockStart, i + 1);
      }
    }
  }

  return "";
}

function extractSchemaField(block: string, fieldName: string): string | undefined {
  const pattern = new RegExp(`${fieldName}:\\s*z\\.object\\(([^)]+)\\)`);
  const match = pattern.exec(block);
  if (match) {
    return match[1].trim();
  }
  return undefined;
}

function schemasMatch(schema1: string, schema2: string): boolean {
  // Simplified schema comparison - compare field names
  const fields1 = extractFieldNames(schema1);
  const fields2 = extractFieldNames(schema2);

  if (fields1.size !== fields2.size) return false;

  for (const field of fields1) {
    if (!fields2.has(field)) return false;
  }

  return true;
}

function extractFieldNames(schema: string): Set<string> {
  const fields = new Set<string>();
  const fieldPattern = /["']?([a-zA-Z_][a-zA-Z0-9_-]*)["']?\s*:/g;

  let match;
  while ((match = fieldPattern.exec(schema)) !== null) {
    fields.add(match[1]);
  }

  return fields;
}

function checkAntiPatterns(
  content: string,
  lines: string[],
  filePath: string
): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  // Check for legacy context.steps pattern
  const legacyPattern = /context\.steps\.[a-zA-Z]+\.output/g;
  let match;
  while ((match = legacyPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    issues.push({
      file: filePath,
      line: lineNumber,
      severity: "error",
      message: "Legacy data access pattern: context.steps.*.output",
      suggestion: "Use inputData or getStepResult('step-id') instead",
    });
  }

  // Check for inputData.stepName pattern (incorrect assumption)
  const wrongInputPattern = /inputData\.[a-zA-Z]+Step/g;
  while ((match = wrongInputPattern.exec(content)) !== null) {
    const lineNumber = content.substring(0, match.index).split("\n").length;
    issues.push({
      file: filePath,
      line: lineNumber,
      severity: "warning",
      message: "Possibly incorrect data access: inputData.stepName",
      suggestion: "inputData is the previous step's output, not a container. Use getStepResult() for specific steps",
    });
  }

  // Check for parallel without keyed access
  if (content.includes(".parallel(")) {
    const parallelIndex = content.indexOf(".parallel(");
    const afterParallel = content.substring(parallelIndex);

    // Check if next .then() step uses inputData correctly
    if (afterParallel.includes(".then(") && !afterParallel.includes('inputData["')) {
      const lineNumber = content.substring(0, parallelIndex).split("\n").length;
      issues.push({
        file: filePath,
        line: lineNumber,
        severity: "warning",
        message: "Step after .parallel() may not be accessing outputs correctly",
        suggestion: 'After parallel, use inputData["step-id"].field to access each step\'s output',
      });
    }
  }

  // Check for branch without .optional()
  if (content.includes(".branch(")) {
    if (!content.includes(".optional()") && content.includes("inputSchema")) {
      issues.push({
        file: filePath,
        severity: "warning",
        message: "Branch outputs should use .optional() in the next step's inputSchema",
        suggestion: 'After branch, only one path executes. Use z.object({ "step-id": z.object({...}).optional() })',
      });
    }
  }

  return issues;
}

function outputText(issues: ValidationIssue[]) {
  if (issues.length === 0) {
    console.log("✅ No schema issues found");
    return;
  }

  const errors = issues.filter((i) => i.severity === "error");
  const warnings = issues.filter((i) => i.severity === "warning");

  console.log(`\n📋 Validation Results: ${errors.length} errors, ${warnings.length} warnings\n`);

  for (const issue of issues) {
    const icon = issue.severity === "error" ? "❌" : "⚠️";
    const location = issue.line ? `${issue.file}:${issue.line}` : issue.file;

    console.log(`${icon} [${issue.severity.toUpperCase()}] ${location}`);
    console.log(`   ${issue.message}`);
    if (issue.suggestion) {
      console.log(`   💡 ${issue.suggestion}`);
    }
    console.log();
  }
}

// Run main function
main();
