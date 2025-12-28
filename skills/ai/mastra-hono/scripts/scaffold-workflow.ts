#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Scaffold Mastra Workflow
 *
 * Generates a new Mastra workflow with v1 Beta patterns.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold-workflow.ts --name process-data
 *   deno run --allow-read --allow-write scripts/scaffold-workflow.ts --name data-pipeline --steps 3
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

function generateStep(index: number, isLast: boolean): string {
  const prevField = index === 1 ? "input" : `step${index - 1}Result`;
  const outputField = isLast ? "result" : `step${index}Result`;

  return `
const step${index} = createStep({
  id: "step-${index}",

  // Input schema MUST match ${index === 1 ? "workflow input" : `step ${index - 1} output`}
  inputSchema: z.object({
    ${prevField}: z.string(),
  }),

  // Output schema MUST match ${isLast ? "workflow output" : `step ${index + 1} input`}
  outputSchema: z.object({
    ${outputField}: z.string(),
  }),

  execute: async ({ inputData, getStepResult, getInitData, mastra, state, setState }) => {
    // inputData = ${index === 1 ? "workflow input" : `step ${index - 1} output`}
    const { ${prevField} } = inputData;

    // Process data
    const ${outputField} = \`Processed in step ${index}: \${${prevField}}\`;

    return { ${outputField} };
  },
});
`;
}

async function main() {
  const args = parse(Deno.args, {
    string: ["name", "output"],
    number: ["steps"],
    boolean: ["help", "parallel", "branch"],
    default: {
      output: "./src/mastra/workflows",
      steps: 2,
    },
  });

  if (args.help || !args.name) {
    console.log(`
Scaffold Mastra Workflow (v1 Beta)

Usage:
  deno run --allow-read --allow-write scripts/scaffold-workflow.ts --name <workflow-name> [options]

Options:
  --name          Workflow name in kebab-case (required)
  --output        Output directory (default: ./src/mastra/workflows/)
  --steps         Number of steps (default: 2)
  --parallel      Include parallel step example
  --branch        Include branch step example
  --help          Show this help

Examples:
  deno run --allow-read --allow-write scripts/scaffold-workflow.ts --name process-data
  deno run --allow-read --allow-write scripts/scaffold-workflow.ts --name data-pipeline --steps 3
  deno run --allow-read --allow-write scripts/scaffold-workflow.ts --name decision-flow --branch
`);
    Deno.exit(args.help ? 0 : 1);
  }

  const workflowName = args.name as string;
  const outputDir = args.output as string;
  const numSteps = args.steps as number;
  const includeParallel = args.parallel as boolean;
  const includeBranch = args.branch as boolean;

  const camelName = toCamelCase(workflowName);

  // Generate step definitions
  const stepDefinitions = [];
  for (let i = 1; i <= numSteps; i++) {
    stepDefinitions.push(generateStep(i, i === numSteps));
  }

  // Generate chain
  const chainCalls = [];
  for (let i = 1; i <= numSteps; i++) {
    chainCalls.push(`  .then(step${i})`);
  }

  const parallelExample = includeParallel
    ? `
/*
// Parallel execution example:
// After .parallel(), inputData is keyed by step ID

const formatStep = createStep({
  id: "format-step",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => ({
    formatted: inputData.text.toUpperCase(),
  }),
});

const countStep = createStep({
  id: "count-step",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ count: z.number() }),
  execute: async ({ inputData }) => ({
    count: inputData.text.length,
  }),
});

const combineStep = createStep({
  id: "combine-step",
  // MUST use step IDs as keys
  inputSchema: z.object({
    "format-step": z.object({ formatted: z.string() }),
    "count-step": z.object({ count: z.number() }),
  }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => ({
    result: \`\${inputData["format-step"].formatted} (\${inputData["count-step"].count} chars)\`,
  }),
});

const parallelWorkflow = createWorkflow({...})
  .parallel([formatStep, countStep])
  .then(combineStep)
  .commit();
*/
`
    : "";

  const branchExample = includeBranch
    ? `
/*
// Branch execution example:
// After .branch(), use .optional() for step outputs

const highValueStep = createStep({
  id: "high-value-step",
  outputSchema: z.object({ result: z.string() }),
  execute: async () => ({ result: "Premium processing" }),
});

const lowValueStep = createStep({
  id: "low-value-step",
  outputSchema: z.object({ result: z.string() }),
  execute: async () => ({ result: "Basic processing" }),
});

const afterBranchStep = createStep({
  id: "after-branch",
  // MUST use .optional() for branch outputs
  inputSchema: z.object({
    "high-value-step": z.object({ result: z.string() }).optional(),
    "low-value-step": z.object({ result: z.string() }).optional(),
  }),
  outputSchema: z.object({ message: z.string() }),
  execute: async ({ inputData }) => ({
    message: inputData["high-value-step"]?.result || inputData["low-value-step"]?.result || "None",
  }),
});

const branchWorkflow = createWorkflow({...})
  .branch([
    [async ({ inputData }) => inputData.value > 1000, highValueStep],
    [async ({ inputData }) => inputData.value <= 1000, lowValueStep],
  ])
  .then(afterBranchStep)
  .commit();
*/
`
    : "";

  const workflowContent = `/**
 * ${toPascalCase(workflowName)} Workflow
 *
 * A Mastra workflow using v1 Beta patterns.
 *
 * CRITICAL: Schema Matching Rules
 * - Workflow inputSchema → Step 1 inputSchema: MUST match exactly
 * - Step N outputSchema → Step N+1 inputSchema: MUST match exactly
 * - Final step outputSchema → Workflow outputSchema: MUST match exactly
 */

import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// ============================================================================
// Step Definitions
// ============================================================================
${stepDefinitions.join("\n")}

// ============================================================================
// Workflow Definition
// ============================================================================

export const ${camelName}Workflow = createWorkflow({
  id: "${workflowName}",

  // MUST match step 1 inputSchema
  inputSchema: z.object({
    input: z.string(),
  }),

  // MUST match final step outputSchema
  outputSchema: z.object({
    result: z.string(),
  }),

  // Optional: Retry configuration
  retryConfig: {
    attempts: 3,
    delay: 1000,
  },
})
${chainCalls.join("\n")}
  .commit();
${parallelExample}${branchExample}
/*
// Usage example:

import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  workflows: { ${camelName}Workflow },
});

// Run the workflow
const run = ${camelName}Workflow.createRun();
const result = await run.start({
  inputData: { input: "hello world" },
});

console.log(result.status);  // "success" | "failed"
console.log(result.output);  // { result: "..." }
console.log(result.steps);   // Step results by ID
*/
`;

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Write workflow file
  const filePath = join(outputDir, `${workflowName}.ts`);
  await Deno.writeTextFile(filePath, workflowContent);

  console.log(`✅ Created workflow: ${filePath}`);
  console.log(`
Next steps:
1. Update the schemas to match your data types
2. Implement the step execute logic
3. Register in Mastra: workflows: { ${camelName}Workflow }
4. Run with: workflow.createRun().start({ inputData })
`);
}

main();
