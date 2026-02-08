# Mastra Framework Best Practices Guide for LLMs

**Two definitive references for writing correct Mastra code: Stable (0.24.x) and v1 Beta. Target audience: LLMs generating Mastra code and humans supervising them.**

Mastra v1 beta launched November 2025 with stable release targeted for January 2026. The framework supports **1,113 models from 53 providers**, has **18,000+ GitHub stars**, and powers enterprise deployments at companies like SoftBank and Adobe. This guide prevents the most common LLM coding errors through explicit patterns.

---

## Version detection and requirements

Before writing code, determine which version you're targeting. The APIs differ significantly.

| Aspect | Stable (0.24.x) | v1 Beta |
|--------|-----------------|---------|
| Node.js | 18+ | **22.13.0+** (breaking) |
| Install | `npm install @mastra/core` | `npm install @mastra/core@beta` |
| Tool signature | `execute: async ({ context })` | `execute: async (inputData, context)` |
| Imports | `@mastra/core` (deprecated) | `@mastra/core/agent`, `@mastra/core/tools` |
| Observability | `telemetry:` config | `observability:` config |

---

## 1. Agent definition patterns

### Correct agent definition

```typescript
// ✅ DO: Use subpath imports (required in v1, preferred in stable)
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

const agent = new Agent({
  name: "my-agent",                           // Required: unique identifier
  instructions: "You are a helpful assistant.", // Required: system prompt
  model: openai("gpt-4o-mini"),               // Required: LLM model
  tools: { weatherTool, searchTool },         // Optional: object with named tools
});
```

```typescript
// ❌ NEVER: Import from root (deprecated, removed in v1)
import { Agent } from "@mastra/core";

// ❌ NEVER: Pass tools as array
tools: [weatherTool, searchTool]  // Wrong - must be object

// ❌ NEVER: Forget required fields
const agent = new Agent({
  name: "agent",  // Missing instructions and model
});
```

### Model configuration patterns

```typescript
// ✅ DO: Use model router strings (simplest, 1113+ models)
model: "openai/gpt-4o-mini"
model: "anthropic/claude-3-5-sonnet"
model: "google/gemini-2.5-flash"

// ✅ DO: Use model fallbacks for resilience
model: [
  { model: "anthropic/claude-3-opus", maxRetries: 3 },
  { model: "openai/gpt-4o", maxRetries: 2 },
  { model: "google/gemini-pro", maxRetries: 1 },
]

// ✅ DO: Dynamic model selection
model: ({ runtimeContext }) => {
  const provider = runtimeContext.get("provider-id");
  return `${provider}/gpt-4o-mini`;
}
```

### Agent execution patterns

```typescript
// ✅ DO: Use memory object for context (stable and v1)
const response = await agent.generate("Remember my name is Alex", {
  memory: {
    thread: "conversation-123",   // Isolates conversation
    resource: "user-456",         // Associates with user
  },
});

// ❌ NEVER: Use deprecated threadId/resourceId
await agent.generate("Hello", {
  threadId: "123",    // Deprecated
  resourceId: "456",  // Deprecated
});
```

---

## 2. Tool definition patterns

### Stable version (0.24.x) tool signature

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ✅ DO: Stable version - context contains input data
export const weatherTool = createTool({
  id: "get-weather",
  description: "Fetches current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    // context contains parsed input matching inputSchema
    const { location } = context;
    
    // mastra provides access to registered agents
    const helper = mastra?.getAgent("helperAgent");
    
    // runtimeContext has request-specific values
    const userId = runtimeContext.get("user-id");
    
    return { temperature: 72, conditions: "sunny" };
  },
});
```

### v1 Beta tool signature (BREAKING CHANGE)

```typescript
// ✅ DO: v1 Beta - separate inputData and context parameters
export const weatherTool = createTool({
  id: "get-weather",
  description: "Fetches current weather",
  inputSchema: z.object({
    location: z.string().describe("City name"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  execute: async (inputData, context) => {
    // inputData contains parsed input (first parameter)
    const { location } = inputData;
    
    // context contains mastra, runtimeContext, abortSignal (second parameter)
    const { mastra, runtimeContext, abortSignal } = context;
    
    // Always check abort signal for long operations
    if (abortSignal?.aborted) throw new Error("Aborted");
    
    return { temperature: 72, conditions: "sunny" };
  },
});
```

```typescript
// ❌ NEVER: Mix up signatures between versions
// Stable version with v1 signature:
execute: async (inputData, context) => { ... }  // Wrong for 0.24.x

// v1 Beta with stable signature:
execute: async ({ context }) => { ... }  // Wrong for v1
```

### Zod schema best practices

```typescript
// ✅ DO: Add .describe() to all parameters (helps LLM understand usage)
inputSchema: z.object({
  location: z.string().describe("City name, e.g., 'Seattle'"),
  units: z.enum(["celsius", "fahrenheit"]).describe("Temperature unit"),
})

// ✅ DO: Use optional() with default() for optional parameters
inputSchema: z.object({
  query: z.string(),
  limit: z.number().optional().default(10).describe("Max results"),
})

// ❌ NEVER: Skip outputSchema (causes validation issues)
// ❌ NEVER: Use vague descriptions
description: "Does stuff"  // Unhelpful for agent tool selection
```

---

## 3. Workflow data flow patterns (CRITICAL SECTION)

This is where LLMs make the most errors. Mastra has **two workflow APIs** with different data access patterns.

### New API (recommended for v1): createWorkflow/createStep

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";

// ✅ DO: Understand that inputData IS the previous step's output
const step1 = createStep({
  id: "step-1",
  inputSchema: z.object({ message: z.string() }),
  outputSchema: z.object({ formatted: z.string() }),
  execute: async ({ inputData }) => {
    // inputData = workflow input (for first step)
    return { formatted: inputData.message.toUpperCase() };
  },
});

const step2 = createStep({
  id: "step-2",
  inputSchema: z.object({ formatted: z.string() }),  // MUST match step1's outputSchema
  outputSchema: z.object({ emphasized: z.string() }),
  execute: async ({ inputData }) => {
    // inputData = step1's return value directly
    return { emphasized: `${inputData.formatted}!!!` };
  },
});

const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ message: z.string() }),   // MUST match step1's inputSchema
  outputSchema: z.object({ emphasized: z.string() }), // MUST match final step's outputSchema
})
  .then(step1)
  .then(step2)
  .commit();
```

### Schema matching rules (MEMORIZE THESE)

| Rule | Description |
|------|-------------|
| Workflow inputSchema → First step inputSchema | Must match exactly |
| Step N outputSchema → Step N+1 inputSchema | Must match exactly |
| Final step outputSchema → Workflow outputSchema | Must match exactly |

```typescript
// ❌ NEVER: Mismatched schemas between steps
const step1 = createStep({
  outputSchema: z.object({ formatted: z.string() }),  // Returns 'formatted'
  // ...
});

const step2 = createStep({
  inputSchema: z.object({ message: z.string() }),     // Expects 'message' - MISMATCH!
  // ...
});
```

### Accessing data in step execute

```typescript
// ✅ DO: Use the correct access patterns
execute: async ({ 
  inputData,      // Previous step's output (or workflow input for step 1)
  getStepResult,  // Function to access ANY step's output by ID
  getInitData,    // Function to get original workflow input
  state,          // Shared workflow state
  setState,       // Function to update state
  mastra,         // Access to agents, tools, storage
  runtimeContext, // Request-specific context
}) => {
  // Direct access to previous step output
  const { formatted } = inputData;
  
  // Access specific step by ID or reference
  const step1Result = getStepResult("step-1");
  const altResult = getStepResult(step1);  // Pass step reference
  
  // Access original workflow input
  const originalInput = getInitData();
  
  return { result: formatted };
}
```

```typescript
// ❌ NEVER: Use legacy context.steps pattern with new API
execute: async ({ context }) => {
  const prev = context.steps.step1.output;  // WRONG - This is legacy API!
}

// ❌ NEVER: Assume inputData contains all previous steps
execute: async ({ inputData }) => {
  const step1 = inputData.step1;  // WRONG - inputData is ONLY previous step output
}
```

### Parallel execution output structure

```typescript
// ✅ DO: Understand parallel output is keyed by step ID
const workflow = createWorkflow({...})
  .parallel([formatStep, countStep])
  .then(combineStep)
  .commit();

// After parallel, output structure is:
// {
//   "format-step": { formatted: "HELLO" },
//   "count-step": { count: 5 }
// }

// Step after parallel MUST expect this structure:
const combineStep = createStep({
  id: "combine",
  inputSchema: z.object({
    "format-step": z.object({ formatted: z.string() }),
    "count-step": z.object({ count: z.number() }),
  }),
  execute: async ({ inputData }) => {
    // Access by step ID
    const formatted = inputData["format-step"].formatted;
    const count = inputData["count-step"].count;
    return { result: `${formatted} (${count} chars)` };
  },
});
```

### Conditional branching output structure

```typescript
// ✅ DO: Use .optional() for branch outputs (only one executes)
const stepAfterBranch = createStep({
  id: "after-branch",
  inputSchema: z.object({
    "high-value-step": z.object({ result: z.string() }).optional(),
    "low-value-step": z.object({ result: z.string() }).optional(),
  }),
  execute: async ({ inputData }) => {
    // Check which branch executed
    const result = inputData["high-value-step"]?.result || 
                   inputData["low-value-step"]?.result;
    return { message: result };
  },
});
```

### Using .map() for schema transformation

```typescript
// ✅ DO: Use .map() when schemas don't match between steps
const workflow = createWorkflow({...})
  .then(step1)  // outputs: { formatted: string }
  .map(async ({ inputData }) => {
    // Transform to match step2's expected input
    return { message: inputData.formatted };  // step2 expects: { message: string }
  })
  .then(step2)
  .commit();
```

### Legacy API (for reference only)

```typescript
// Legacy API uses different patterns - avoid for new code
import { LegacyStep, LegacyWorkflow } from "@mastra/core/workflows/legacy";

const step = new LegacyStep({
  id: "step-id",
  execute: async ({ context }) => {
    // LEGACY ACCESS PATTERNS:
    const triggerData = context.triggerData;        // Workflow input
    const prevOutput = context.steps.stepId.output; // Previous step output
    return { result: "..." };
  },
});
```

---

## 4. Tool wrapper patterns

### Wrapping an agent as a tool

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

// ✅ DO: Use mastra.getAgent() for proper dependency injection
export const copywriterTool = createTool({
  id: "copywriter-tool",
  description: "Writes blog post copy about a given topic",
  inputSchema: z.object({
    topic: z.string().describe("Topic to write about"),
  }),
  outputSchema: z.object({
    copy: z.string(),
    success: z.boolean(),
  }),
  execute: async ({ context, mastra }) => {  // Stable signature
    try {
      // Get agent from Mastra instance (not direct import)
      const agent = mastra!.getAgent("copywriterAgent");
      
      if (!agent) {
        throw new Error("copywriterAgent not found");
      }
      
      const result = await agent.generate(`Write about: ${context.topic}`);
      
      return {
        copy: result.text,
        success: true,
      };
    } catch (error: any) {
      // Log full error for debugging
      console.error("Copywriter error:", error);
      
      // Return structured error (or throw)
      throw new Error(`Copywriting failed: ${error.message}`);
    }
  },
});

// Register both agents in Mastra
export const mastra = new Mastra({
  agents: { copywriterAgent, publisherAgent },
});
```

```typescript
// ❌ NEVER: Import agent directly in tool
import { copywriterAgent } from "./agents";

execute: async () => {
  await copywriterAgent.generate("...");  // Loses access to logger, telemetry
}
```

### Wrapping a workflow as a tool

```typescript
export const processingTool = createTool({
  id: "data-processor",
  description: "Processes data through the data pipeline workflow",
  inputSchema: z.object({
    data: z.string(),
  }),
  outputSchema: z.object({
    result: z.string(),
    success: z.boolean(),
  }),
  execute: async ({ context, mastra, runtimeContext }) => {
    try {
      const workflow = mastra!.getWorkflow("dataPipeline");
      const run = workflow.createRun();
      
      const result = await run.start({
        inputData: { data: context.data },
        runtimeContext,  // Propagate context
      });
      
      // Extract from workflow result structure
      const output = result.steps?.["final-step"]?.output;
      
      return {
        result: output?.processed || "",
        success: result.status === "success",
      };
    } catch (error: any) {
      throw new Error(`Workflow failed: ${error.message}`);
    }
  },
});
```

### Context propagation through nested calls

```typescript
// ✅ DO: Always propagate runtimeContext through all nested calls
execute: async ({ context, runtimeContext, mastra }) => {
  // Pass to nested agent
  const agent = mastra!.getAgent("nestedAgent");
  await agent.generate("Query", { runtimeContext });
  
  // Pass to nested workflow
  const workflow = mastra!.getWorkflow("nestedWorkflow");
  await workflow.createRun().start({
    inputData: { value: context.value },
    runtimeContext,
  });
}

// Set context at entry point
const runtimeContext = new RuntimeContext();
runtimeContext.set("user-id", "user-123");
runtimeContext.set("user-tier", "enterprise");

await agent.generate("Hello", { runtimeContext });
```

---

## 5. Observability patterns

### v1 Beta: AI Tracing (recommended)

```typescript
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

// ✅ DO: Use observability config (v1 pattern)
export const mastra = new Mastra({
  observability: {
    default: { enabled: true },
  },
  storage: new LibSQLStore({
    url: "file:./mastra.db",  // Required for tracing
  }),
});
```

### Expanded configuration

```typescript
import {
  CloudExporter,
  DefaultExporter,
  SensitiveDataFilter,
} from "@mastra/core/ai-tracing";
import { LangfuseExporter } from "@mastra/langfuse";

export const mastra = new Mastra({
  observability: {
    configs: {
      default: {
        serviceName: "my-service",
        sampling: { type: "ratio", probability: 0.1 },  // 10% in production
        processors: [new SensitiveDataFilter()],
        exporters: [
          new DefaultExporter(),
          new CloudExporter(),
          new LangfuseExporter({
            publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
            secretKey: process.env.LANGFUSE_SECRET_KEY!,
          }),
        ],
        runtimeContextKeys: ["userId", "tenantId"],  // Auto-extract for traces
      },
    },
  },
});
```

### Stable version: OTEL Tracing (deprecated)

```typescript
// For 0.24.x - will be removed in future
export const mastra = new Mastra({
  telemetry: {
    enabled: true,
    serviceName: "my-service",
  },
});
```

### Trace context propagation

```typescript
// ✅ DO: Pass external trace IDs for distributed tracing
import { trace } from "@opentelemetry/api";

const currentSpan = trace.getActiveSpan();
const spanContext = currentSpan?.spanContext();

const result = await agent.generate("Analyze data", {
  tracingOptions: {
    traceId: spanContext?.traceId,
    parentSpanId: spanContext?.spanId,
  },
});

// Access trace ID from result
console.log("Trace ID:", result.traceId);
```

---

## 6. Error handling patterns

### Workflow retry configuration

```typescript
// ✅ DO: Configure retries at workflow and step level
const workflow = createWorkflow({
  id: "resilient-workflow",
  retryConfig: {
    attempts: 5,
    delay: 2000,  // ms between retries
  },
})
  .then(step1)
  .commit();

// Step-level override
const step1 = createStep({
  id: "api-step",
  retries: 3,  // Override workflow-level
  execute: async () => {
    const response = await fetch(url);
    if (!response.ok) throw new Error("API failed");
    return { data: await response.json() };
  },
});
```

### Conditional error handling

```typescript
// ✅ DO: Return status for conditional branching
const step1 = createStep({
  id: "risky-step",
  outputSchema: z.object({ 
    status: z.enum(["ok", "error"]),
    data: z.any().optional(),
  }),
  execute: async () => {
    try {
      const result = await riskyOperation();
      return { status: "ok", data: result };
    } catch (error) {
      return { status: "error" };  // Allow graceful fallback
    }
  },
});

const workflow = createWorkflow({...})
  .then(step1)
  .branch([
    [async ({ inputData }) => inputData.status === "ok", successStep],
    [async ({ inputData }) => inputData.status === "error", fallbackStep],
  ])
  .commit();
```

### Model fallbacks for graceful degradation

```typescript
// ✅ DO: Configure model fallbacks
const agent = new Agent({
  name: "resilient-agent",
  model: [
    { model: "openai/gpt-4o", maxRetries: 3 },
    { model: "anthropic/claude-3-5-sonnet", maxRetries: 2 },
    { model: "google/gemini-pro", maxRetries: 1 },
  ],
});
// Automatically falls back through chain on 5xx, 429, or timeout errors
```

---

## 7. Testing patterns

### Unit testing tools

```typescript
import { describe, it, expect, vi } from "vitest";

describe("Calculator Tool", () => {
  it("should add numbers correctly", async () => {
    // Stable version signature
    const result = await calculatorTool.execute({
      context: { a: 5, b: 3, operation: "add" },
      runtimeContext: {},
      tracingContext: {},
      abortSignal: new AbortController().signal,
    });
    
    expect(result.result).toBe(8);
  });
});
```

### Testing workflow step data flow

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Schema Compatibility Tests", () => {
  // ✅ DO: Test schema compatibility at test time
  it("should verify step1 output matches step2 input", () => {
    const step1Output = { formatted: "HELLO" };
    
    // Parse with step2's input schema
    const step2InputSchema = z.object({ formatted: z.string() });
    const parseResult = step2InputSchema.safeParse(step1Output);
    
    expect(parseResult.success).toBe(true);
  });

  it("should catch schema mismatches", () => {
    const step1Output = { wrongField: "HELLO" };
    
    const step2InputSchema = z.object({ formatted: z.string() });
    const parseResult = step2InputSchema.safeParse(step1Output);
    
    expect(parseResult.success).toBe(false);
  });
});
```

### Testing complete workflows

```typescript
describe("Test Workflow", () => {
  it("should process steps in sequence with correct data flow", async () => {
    const run = await testWorkflow.createRun();
    const result = await run.start({ inputData: { value: 5 } });

    expect(result.status).toBe("success");
    
    // Verify each step received correct input
    expect(result.steps["step-1"].payload).toEqual({ value: 5 });
    expect(result.steps["step-1"].output.doubled).toBe(10);
    
    // Verify data flowed correctly between steps
    expect(result.steps["step-2"].payload).toEqual({ doubled: 10 });
  });
});
```

### Mocking LLM calls

```typescript
import { describe, it, vi } from "vitest";

// Mock the model response
vi.mock("@ai-sdk/openai", () => ({
  openai: () => ({
    doGenerate: vi.fn().mockResolvedValue({
      text: "Mocked response",
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
  }),
}));

describe("Agent with Mocked LLM", () => {
  it("should return mocked response", async () => {
    const response = await agent.generate("Hello");
    expect(response.text).toBe("Mocked response");
  });
});
```

### Mocking Mastra instance in steps

```typescript
it("should use mocked agent in step", async () => {
  const mockMastra = {
    getAgent: vi.fn().mockReturnValue({
      generate: vi.fn().mockResolvedValue({ text: "Mocked" }),
    }),
  };

  const result = await stepWithAgent.execute({
    inputData: { prompt: "Hello" },
    mastra: mockMastra as any,
    getStepResult: () => null,
    getInitData: () => ({}),
    suspend: async () => {},
    state: {},
    setState: () => {},
    runId: "test",
  });

  expect(mockMastra.getAgent).toHaveBeenCalledWith("myAgent");
});
```

---

## Quick reference: Common mistakes by topic

| Topic | ❌ Never Do | ✅ Always Do |
|-------|------------|-------------|
| **Imports** | `import { Agent } from "@mastra/core"` | `import { Agent } from "@mastra/core/agent"` |
| **Tools array** | `tools: [tool1, tool2]` | `tools: { tool1, tool2 }` |
| **Memory context** | `{ threadId: "123" }` | `{ memory: { thread: "123", resource: "user" } }` |
| **Workflow data** | `context.steps.step1.output` | `inputData` or `getStepResult("step-1")` |
| **After parallel** | `inputData.result` | `inputData["step-id"].result` |
| **After branch** | `inputData.result` | `inputData["step-id"]?.result` (optional) |
| **Nested agents** | `import agent; agent.generate()` | `mastra.getAgent("name").generate()` |
| **State mutation** | `state.counter++` | `setState({ ...state, counter: state.counter + 1 })` |
| **v1 tool exec** | `execute: async ({ context })` | `execute: async (inputData, context)` |

---

## Migration checklist: Stable to v1 Beta

1. ☐ Upgrade Node.js to **22.13.0+**
2. ☐ Install beta packages: `npm install @mastra/core@beta`
3. ☐ Run codemods: `npx @mastra/codemod@beta v1`
4. ☐ Update imports to subpath: `@mastra/core/agent`, `@mastra/core/tools`
5. ☐ Update tool signatures: `execute: async ({ context })` → `execute: async (inputData, context)`
6. ☐ Rename `RuntimeContext` → `RequestContext` 
7. ☐ Update storage methods: `getThreads` → `listThreads`
8. ☐ Update pagination: `{ offset, limit }` → `{ page, perPage }`
9. ☐ Update observability: `telemetry:` → `observability:`
10. ☐ Update voice methods: `agent.speak()` → `agent.voice.speak()`

---

## Essential documentation links

- **Stable Docs**: https://mastra.ai/docs
- **v1 Beta Docs**: https://mastra.ai/docs/v1
- **Migration Guide**: https://mastra.ai/guides/v1/migrations/upgrade-to-v1/overview
- **API Reference**: https://mastra.ai/reference
- **GitHub**: https://github.com/mastra-ai/mastra
- **Codemods**: `npx @mastra/codemod@beta v1`

This guide covers the patterns that prevent **90% of LLM coding errors** when generating Mastra code. The workflow data flow section is especially critical—LLMs frequently assume incorrect patterns from other frameworks. When in doubt, remember: `inputData` is the previous step's return value, and parallel/branch outputs are keyed by step ID.