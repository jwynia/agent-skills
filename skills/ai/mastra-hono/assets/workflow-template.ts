/**
 * Mastra Workflow Template (v1 Beta)
 *
 * CRITICAL: Workflow data flow is the most error-prone area!
 *
 * Key rules:
 * 1. inputData is ONLY the previous step's output (not a container of all steps)
 * 2. Schemas MUST chain: workflow input → step1 input → step1 output → step2 input → ...
 * 3. Use getStepResult("step-id") to access any step's output
 * 4. After .parallel(), inputData is keyed by step ID
 * 5. After .branch(), use .optional() for branch outputs
 *
 * Usage: Copy this file and customize for your workflow.
 */

import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// ============================================================================
// Step 1: Define your steps
// ============================================================================

const step1 = createStep({
  id: "step-1",

  // Input schema MUST match workflow inputSchema (for first step)
  // or previous step's outputSchema (for subsequent steps)
  inputSchema: z.object({
    value: z.string(),
  }),

  // Output schema MUST match next step's inputSchema
  outputSchema: z.object({
    processed: z.string(),
    metadata: z.object({
      length: z.number(),
    }),
  }),

  execute: async ({ inputData, getStepResult, getInitData, mastra, state, setState }) => {
    // inputData = workflow input (for step 1)
    const { value } = inputData;

    // getInitData() returns original workflow input
    const originalInput = getInitData();

    // getStepResult("step-id") returns any step's output
    // const prevStep = getStepResult("previous-step");

    // state/setState for cross-step shared state
    // setState({ ...state, processedAt: new Date().toISOString() });

    // mastra for accessing agents, tools, workflows
    // const agent = mastra?.getAgent("helper-agent");

    return {
      processed: value.toUpperCase(),
      metadata: { length: value.length },
    };
  },
});

const step2 = createStep({
  id: "step-2",

  // MUST match step1's outputSchema
  inputSchema: z.object({
    processed: z.string(),
    metadata: z.object({
      length: z.number(),
    }),
  }),

  outputSchema: z.object({
    result: z.string(),
    stats: z.object({
      original: z.number(),
      final: z.number(),
    }),
  }),

  execute: async ({ inputData }) => {
    // inputData = step1's return value DIRECTLY
    const { processed, metadata } = inputData;

    return {
      result: `${processed}!!!`,
      stats: {
        original: metadata.length,
        final: processed.length + 3,
      },
    };
  },
});

// ============================================================================
// Step 2: Define the workflow
// ============================================================================

export const myWorkflow = createWorkflow({
  id: "my-workflow",

  // MUST match first step's inputSchema
  inputSchema: z.object({
    value: z.string(),
  }),

  // MUST match final step's outputSchema
  outputSchema: z.object({
    result: z.string(),
    stats: z.object({
      original: z.number(),
      final: z.number(),
    }),
  }),

  // Optional: Retry configuration
  retryConfig: {
    attempts: 3,
    delay: 1000,
  },
})
  .then(step1)
  .then(step2)
  .commit();

// ============================================================================
// Example: Parallel Execution
// ============================================================================

/*
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

// Step after parallel MUST expect keyed structure
const combineStep = createStep({
  id: "combine-step",
  inputSchema: z.object({
    "format-step": z.object({ formatted: z.string() }),
    "count-step": z.object({ count: z.number() }),
  }),
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => {
    // Access by step ID
    const formatted = inputData["format-step"].formatted;
    const count = inputData["count-step"].count;
    return { result: `${formatted} (${count} chars)` };
  },
});

const parallelWorkflow = createWorkflow({
  id: "parallel-workflow",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .parallel([formatStep, countStep])
  .then(combineStep)
  .commit();
*/

// ============================================================================
// Example: Conditional Branching
// ============================================================================

/*
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

// Step after branch uses .optional()
const afterBranchStep = createStep({
  id: "after-branch",
  inputSchema: z.object({
    "high-value-step": z.object({ result: z.string() }).optional(),
    "low-value-step": z.object({ result: z.string() }).optional(),
  }),
  outputSchema: z.object({ message: z.string() }),
  execute: async ({ inputData }) => {
    const result =
      inputData["high-value-step"]?.result ||
      inputData["low-value-step"]?.result ||
      "No branch executed";
    return { message: result };
  },
});

const branchWorkflow = createWorkflow({
  id: "branch-workflow",
  inputSchema: z.object({ value: z.number() }),
  outputSchema: z.object({ message: z.string() }),
})
  .branch([
    [async ({ inputData }) => inputData.value > 1000, highValueStep],
    [async ({ inputData }) => inputData.value <= 1000, lowValueStep],
  ])
  .then(afterBranchStep)
  .commit();
*/

// ============================================================================
// Example: Using .map() for Schema Transformation
// ============================================================================

/*
const transformWorkflow = createWorkflow({
  id: "transform-workflow",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .then(step1)  // outputs: { processed: string, metadata: {...} }
  .map(async ({ inputData }) => {
    // Transform to match next step's expected input
    return { value: inputData.processed };
  })
  .then(anotherStep)  // expects: { value: string }
  .commit();
*/

// ============================================================================
// Usage
// ============================================================================

/*
import { Mastra } from "@mastra/core/mastra";

const mastra = new Mastra({
  workflows: { myWorkflow },
});

// Run the workflow
const run = myWorkflow.createRun();
const result = await run.start({
  inputData: { value: "hello world" },
});

console.log(result.status);  // "success" | "failed"
console.log(result.steps);   // Step results by ID
console.log(result.output);  // Final output
*/
