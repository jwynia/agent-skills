# Common Mistakes Reference

Quick reference for the most frequent errors when generating Mastra code. Each entry shows the wrong pattern and the correct fix.

## Import Errors

### Root Import (Deprecated)

```typescript
// WRONG: Root import removed in v1
import { Agent } from "@mastra/core";
import { createTool } from "@mastra/core";

// CORRECT: Subpath imports (required in v1)
import { Agent } from "@mastra/core/agent";
import { createTool } from "@mastra/core/tools";
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { Mastra } from "@mastra/core/mastra";
```

## Agent Definition Errors

### Tools as Array

```typescript
// WRONG: Tools must be an object, not an array
const agent = new Agent({
  name: "my-agent",
  tools: [weatherTool, searchTool],  // Array - WRONG
});

// CORRECT: Tools as named object
const agent = new Agent({
  name: "my-agent",
  tools: { weatherTool, searchTool },  // Object with named keys
});
```

### Missing Required Fields

```typescript
// WRONG: Missing instructions and model
const agent = new Agent({
  name: "my-agent",
});

// CORRECT: All required fields
const agent = new Agent({
  name: "my-agent",
  instructions: "You are a helpful assistant.",
  model: openai("gpt-4o-mini"),
});
```

### Deprecated Memory Options

```typescript
// WRONG: Deprecated threadId/resourceId
await agent.generate("Hello", {
  threadId: "123",
  resourceId: "456",
});

// CORRECT: Use memory object
await agent.generate("Hello", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
});
```

## Tool Signature Errors

### v1 Beta vs Stable Signature

```typescript
// WRONG for v1 Beta: Stable (0.24.x) signature
export const myTool = createTool({
  execute: async ({ context, mastra, runtimeContext }) => {
    const { location } = context;  // context contains input in stable
    return { result: location };
  },
});

// CORRECT for v1 Beta: Separate inputData and context
export const myTool = createTool({
  execute: async (inputData, context) => {
    const { location } = inputData;  // First param: parsed input
    const { mastra, runtimeContext, abortSignal } = context;  // Second: context
    return { result: location };
  },
});
```

### Missing Abort Signal Check

```typescript
// WRONG: No abort handling for long operations
execute: async (inputData, context) => {
  const result = await longRunningOperation();  // Could hang
  return result;
}

// CORRECT: Check abort signal
execute: async (inputData, context) => {
  const { abortSignal } = context;
  if (abortSignal?.aborted) throw new Error("Aborted");

  const result = await longRunningOperation();

  // Check again for very long operations
  if (abortSignal?.aborted) throw new Error("Aborted");
  return result;
}
```

## Workflow Data Flow Errors

### Legacy Context Pattern

```typescript
// WRONG: Legacy API pattern
execute: async ({ context }) => {
  const triggerData = context.triggerData;
  const prevOutput = context.steps.step1.output;
  return { result: prevOutput };
}

// CORRECT: New API pattern
execute: async ({ inputData, getStepResult, getInitData }) => {
  const originalInput = getInitData();
  const step1Output = getStepResult("step-1");
  const previousOutput = inputData;  // Direct previous step
  return { result: previousOutput };
}
```

### Assuming inputData Contains All Steps

```typescript
// WRONG: inputData is NOT a container
execute: async ({ inputData }) => {
  const step1 = inputData.step1;  // WRONG!
  const step2 = inputData.step2;  // WRONG!
}

// CORRECT: inputData is ONLY previous step output
execute: async ({ inputData, getStepResult }) => {
  const previousOutput = inputData;
  const step1 = getStepResult("step-1");
  const step2 = getStepResult("step-2");
}
```

### Schema Mismatch Between Steps

```typescript
// WRONG: Output doesn't match next step's input
const step1 = createStep({
  outputSchema: z.object({ formatted: z.string() }),
});

const step2 = createStep({
  inputSchema: z.object({ message: z.string() }),  // Different field!
});

// CORRECT: Schemas must match, or use .map()
const step2 = createStep({
  inputSchema: z.object({ formatted: z.string() }),  // Matches step1 output
});

// OR use .map() to transform
workflow.then(step1).map(async ({ inputData }) => ({
  message: inputData.formatted
})).then(step2);
```

### Missing Optional After Branch

```typescript
// WRONG: Both branches won't execute
inputSchema: z.object({
  "branch-a": z.object({ result: z.string() }),
  "branch-b": z.object({ result: z.string() }),
})

// CORRECT: Use .optional() for branch outputs
inputSchema: z.object({
  "branch-a": z.object({ result: z.string() }).optional(),
  "branch-b": z.object({ result: z.string() }).optional(),
})
```

### Parallel Output Access

```typescript
// WRONG: Expecting direct result
execute: async ({ inputData }) => {
  const formatted = inputData.formatted;  // WRONG after parallel
}

// CORRECT: Access by step ID after parallel
execute: async ({ inputData }) => {
  const formatted = inputData["format-step"].formatted;
  const count = inputData["count-step"].count;
}
```

## State Mutation Errors

### Direct State Mutation

```typescript
// WRONG: Direct mutation
execute: async ({ state }) => {
  state.counter++;  // Direct mutation - WRONG
  state.items.push(newItem);  // Direct mutation - WRONG
}

// CORRECT: Use setState with new object
execute: async ({ state, setState }) => {
  setState({
    ...state,
    counter: state.counter + 1,
    items: [...state.items, newItem],
  });
}
```

## Nested Agent/Workflow Access

### Direct Import of Agents

```typescript
// WRONG: Direct import loses observability
import { copywriterAgent } from "./agents";

execute: async () => {
  await copywriterAgent.generate("Hello");  // No logging, no tracing
}

// CORRECT: Use mastra.getAgent()
execute: async (inputData, context) => {
  const { mastra } = context;
  const agent = mastra.getAgent("copywriterAgent");
  await agent.generate("Hello");  // Full observability
}
```

### Forgetting to Propagate Context

```typescript
// WRONG: Context not propagated
execute: async (inputData, context) => {
  const { mastra } = context;
  const agent = mastra.getAgent("nestedAgent");
  await agent.generate("Hello");  // Missing runtimeContext
}

// CORRECT: Propagate runtimeContext
execute: async (inputData, context) => {
  const { mastra, runtimeContext } = context;
  const agent = mastra.getAgent("nestedAgent");
  await agent.generate("Hello", { runtimeContext });
}
```

## Zod Schema Errors

### Missing Descriptions

```typescript
// WRONG: No descriptions (LLM won't understand usage)
inputSchema: z.object({
  location: z.string(),
  units: z.enum(["celsius", "fahrenheit"]),
})

// CORRECT: Descriptions help LLM understand
inputSchema: z.object({
  location: z.string().describe("City name, e.g., 'Seattle'"),
  units: z.enum(["celsius", "fahrenheit"]).describe("Temperature unit"),
})
```

### Missing Output Schema

```typescript
// WRONG: No outputSchema (causes validation issues)
export const myTool = createTool({
  inputSchema: z.object({ query: z.string() }),
  // outputSchema missing!
  execute: async (inputData) => {
    return { result: "..." };
  },
});

// CORRECT: Always include outputSchema
export const myTool = createTool({
  inputSchema: z.object({ query: z.string() }),
  outputSchema: z.object({ result: z.string() }),
  execute: async (inputData) => {
    return { result: "..." };
  },
});
```

## Hono Server Errors

### Missing Await on init()

```typescript
// WRONG: init() is async
const server = new MastraServer({ app, mastra });
server.init();  // Missing await!

// CORRECT: Await init()
const server = new MastraServer({ app, mastra });
await server.init();
```

### Wrong Context Access

```typescript
// WRONG: Incorrect context access
app.get("/custom", (c) => {
  const mastra = c.mastra;  // Wrong property access
});

// CORRECT: Use c.get()
app.get("/custom", (c) => {
  const mastra = c.get("mastra");
});
```

## Observability Errors

### Using Deprecated Telemetry Config

```typescript
// WRONG: Deprecated in v1
export const mastra = new Mastra({
  telemetry: {
    enabled: true,
    serviceName: "my-service",
  },
});

// CORRECT: Use observability config
export const mastra = new Mastra({
  observability: {
    default: { enabled: true },
  },
});
```

## Quick Reference Table

| Category | Wrong | Correct |
|----------|-------|---------|
| Imports | `@mastra/core` | `@mastra/core/agent`, `@mastra/core/tools` |
| Tools | `tools: [a, b]` | `tools: { a, b }` |
| Memory | `{ threadId }` | `{ memory: { thread, resource } }` |
| Tool exec (v1) | `({ context })` | `(inputData, context)` |
| Workflow data | `context.steps.x.output` | `inputData` or `getStepResult("x")` |
| After parallel | `inputData.result` | `inputData["step-id"].result` |
| After branch | `inputData.result` | `inputData["step-id"]?.result` |
| Nested agents | Direct import | `mastra.getAgent("name")` |
| State | `state.x++` | `setState({ ...state, x: state.x + 1 })` |
| Observability | `telemetry:` | `observability:` |
