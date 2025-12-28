# Workflow Data Flow Patterns

This is the most error-prone area when generating Mastra code. LLMs frequently assume incorrect patterns from other frameworks. Study this document carefully.

## Core Principle

In Mastra workflows, **`inputData` is the direct output of the previous step**. It is NOT a container of all step results. It is NOT the workflow input (except for step 1).

## Schema Matching Rules

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Workflow     │     │     Step 1      │     │     Step 2      │
│   inputSchema   │────▶│   inputSchema   │     │   inputSchema   │
│                 │     │                 │     │   (MUST match   │
│ { message: str }│     │ { message: str }│     │   step1 output) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                              │                        │
                              ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   outputSchema  │────▶│   outputSchema  │
                        │                 │     │                 │
                        │{ formatted: str}│     │{ emphasized: str}│
                        └─────────────────┘     └─────────────────┘
                                                       │
                                                       ▼
                                               ┌─────────────────┐
                                               │    Workflow     │
                                               │  outputSchema   │
                                               │   (MUST match   │
                                               │   final output) │
                                               └─────────────────┘
```

| Rule | Description |
|------|-------------|
| Workflow inputSchema → Step 1 inputSchema | Must match exactly |
| Step N outputSchema → Step N+1 inputSchema | Must match exactly |
| Final step outputSchema → Workflow outputSchema | Must match exactly |

## Basic Sequential Flow

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => {
    // For step 1: inputData = workflow input
    // Type: { message: string }
    return { formatted: inputData.message.toUpperCase() };
  },
});

const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ formatted: z.string() }),  // Matches step1 output
  outputSchema: z.object({ emphasized: z.string() }),
  execute: async ({ inputData }) => {
    // For step 2+: inputData = previous step's return value
    // Type: { formatted: string }
    return { emphasized: `${inputData.formatted}!!!` };
  },
});

const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ message: z.string() }),     // Matches step1 input
  outputSchema: z.object({ emphasized: z.string() }), // Matches step2 output
})
  .then(step1)
  .then(step2)
  .commit();
```

## Data Access Patterns

### Available in execute function

```typescript
execute: async ({
  inputData,       // Previous step's output (or workflow input for step 1)
  getStepResult,   // Function to access ANY step's output by ID
  getInitData,     // Function to get original workflow input
  state,           // Shared workflow state
  setState,        // Function to update state
  mastra,          // Access to agents, tools, storage
  runtimeContext,  // Request-specific context
  suspend,         // Function to pause workflow
  runId,           // Unique run identifier
}) => { ... }
```

### Accessing Previous Step (inputData)

```typescript
// CORRECT: inputData IS the previous step's output
const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => {
    const { formatted } = inputData;  // Direct destructuring
    return { result: formatted };
  },
});
```

### Accessing Any Step by ID (getStepResult)

```typescript
const step3 = createStep({
  id: "step-3",
  execute: async ({ inputData, getStepResult }) => {
    // Access by step ID string
    const step1Result = getStepResult("step-1");

    // Access by step reference (if in scope)
    const altResult = getStepResult(step1);

    // Both return the step's output or undefined
    return { combined: `${step1Result?.formatted} - ${inputData.value}` };
  },
});
```

### Accessing Original Workflow Input (getInitData)

```typescript
const step3 = createStep({
  id: "step-3",
  execute: async ({ inputData, getInitData }) => {
    const originalInput = getInitData();  // Returns workflow input
    const previousOutput = inputData;     // Returns step2 output

    return {
      original: originalInput.message,
      processed: previousOutput.value,
    };
  },
});
```

## Parallel Execution

When steps run in parallel, their outputs are combined into an object keyed by step ID.

```typescript
const formatStep = createStep({
  id: "format-step",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => {
    return { formatted: inputData.text.toUpperCase() };
  },
});

const countStep = createStep({
  id: "count-step",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ count: z.number() }),
  execute: async ({ inputData }) => {
    return { count: inputData.text.length };
  },
});

// Step after parallel must expect keyed structure
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

const workflow = createWorkflow({
  id: "parallel-workflow",
  inputSchema: z.object({ text: z.string() }),
  outputSchema: z.object({ result: z.string() }),
})
  .parallel([formatStep, countStep])
  .then(combineStep)
  .commit();
```

**Parallel output structure:**
```typescript
// After .parallel([formatStep, countStep]), inputData is:
{
  "format-step": { formatted: "HELLO" },
  "count-step": { count: 5 }
}
```

## Conditional Branching

When using branches, only one path executes. Use `.optional()` in the schema.

```typescript
const highValueStep = createStep({
  id: "high-value-step",
  outputSchema: z.object({ result: z.string(), tier: z.literal("premium") }),
  execute: async () => ({ result: "Premium processing", tier: "premium" }),
});

const lowValueStep = createStep({
  id: "low-value-step",
  outputSchema: z.object({ result: z.string(), tier: z.literal("basic") }),
  execute: async () => ({ result: "Basic processing", tier: "basic" }),
});

// Step after branch must handle optional outputs
const afterBranchStep = createStep({
  id: "after-branch",
  inputSchema: z.object({
    "high-value-step": z.object({ result: z.string(), tier: z.string() }).optional(),
    "low-value-step": z.object({ result: z.string(), tier: z.string() }).optional(),
  }),
  outputSchema: z.object({ message: z.string() }),
  execute: async ({ inputData }) => {
    // Check which branch executed
    const result = inputData["high-value-step"]?.result ||
                   inputData["low-value-step"]?.result ||
                   "No branch executed";
    return { message: result };
  },
});

const workflow = createWorkflow({...})
  .branch([
    [async ({ inputData }) => inputData.value > 1000, highValueStep],
    [async ({ inputData }) => inputData.value <= 1000, lowValueStep],
  ])
  .then(afterBranchStep)
  .commit();
```

## Schema Transformation with .map()

When schemas don't match between steps, use `.map()` to transform.

```typescript
const step1 = createStep({
  id: "step-1",
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => {
    return { formatted: inputData.text.toUpperCase() };
  },
});

const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ message: z.string() }),  // Different field name!
  outputSchema: z.object({ result: z.string() }),
  execute: async ({ inputData }) => {
    return { result: `Message: ${inputData.message}` };
  },
});

// Use .map() to transform between incompatible schemas
const workflow = createWorkflow({...})
  .then(step1)
  .map(async ({ inputData }) => {
    // Transform { formatted: string } to { message: string }
    return { message: inputData.formatted };
  })
  .then(step2)
  .commit();
```

## Using State for Cross-Step Data

For data that doesn't fit the schema flow, use workflow state.

```typescript
const step1 = createStep({
  id: "step-1",
  execute: async ({ inputData, state, setState }) => {
    // Store metadata in state
    setState({
      ...state,
      processedAt: new Date().toISOString(),
      originalLength: inputData.text.length,
    });
    return { formatted: inputData.text.toUpperCase() };
  },
});

const step2 = createStep({
  id: "step-2",
  execute: async ({ inputData, state }) => {
    // Read from state
    const { originalLength, processedAt } = state;
    return {
      result: inputData.formatted,
      metadata: { originalLength, processedAt },
    };
  },
});
```

## Common Errors and Fixes

### Error: Schema Mismatch

```typescript
// WRONG: step2 expects 'message' but step1 outputs 'formatted'
const step1 = createStep({
  outputSchema: z.object({ formatted: z.string() }),
  // ...
});

const step2 = createStep({
  inputSchema: z.object({ message: z.string() }),  // MISMATCH!
  // ...
});

// FIX: Match schemas OR use .map()
```

### Error: Using Legacy Patterns

```typescript
// WRONG: This is the legacy API pattern
execute: async ({ context }) => {
  const prev = context.steps.step1.output;  // LEGACY - DON'T USE
}

// CORRECT: New API pattern
execute: async ({ inputData, getStepResult }) => {
  const prev = inputData;  // Previous step's output
  const step1 = getStepResult("step-1");  // Any step by ID
}
```

### Error: Assuming inputData Contains All Steps

```typescript
// WRONG: inputData is NOT a container of all steps
execute: async ({ inputData }) => {
  const step1 = inputData.step1;  // WRONG!
  const step2 = inputData.step2;  // WRONG!
}

// CORRECT: inputData is ONLY the previous step's output
execute: async ({ inputData, getStepResult }) => {
  const previousOutput = inputData;  // Just the previous step
  const step1 = getStepResult("step-1");  // Use this for any step
}
```

### Error: Forgetting Optional After Branch

```typescript
// WRONG: After a branch, one path didn't execute
inputSchema: z.object({
  "branch-a": z.object({ result: z.string() }),  // Not optional!
  "branch-b": z.object({ result: z.string() }),  // Not optional!
})

// CORRECT: Use .optional() for branch outputs
inputSchema: z.object({
  "branch-a": z.object({ result: z.string() }).optional(),
  "branch-b": z.object({ result: z.string() }).optional(),
})
```

## Debugging Tips

1. **Log inputData structure**: `console.log(JSON.stringify(inputData, null, 2))`
2. **Verify schema types**: Use TypeScript's type inference to catch mismatches
3. **Check step IDs**: After parallel/branch, keys are step IDs exactly as defined
4. **Use getStepResult**: When unsure, explicitly get step results by ID
5. **Run validation script**: `deno run scripts/validate-workflow-schemas.ts ./workflows/`

## Testing Schema Compatibility

```typescript
import { describe, it, expect } from "vitest";

describe("Workflow Schema Tests", () => {
  it("step1 output matches step2 input", () => {
    const step1Output = { formatted: "HELLO" };
    const step2InputSchema = z.object({ formatted: z.string() });

    const result = step2InputSchema.safeParse(step1Output);
    expect(result.success).toBe(true);
  });
});
```
