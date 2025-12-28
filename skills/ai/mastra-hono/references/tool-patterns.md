# Tool Patterns

Complete guide to creating and using tools in Mastra v1 Beta.

## Basic Tool Definition

```typescript
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherTool = createTool({
  id: "get-weather",
  description: "Fetches current weather for a city. Use when user asks about " +
               "temperature, conditions, or forecast for a specific location.",
  inputSchema: z.object({
    location: z.string().describe("City name, e.g., 'Seattle' or 'Tokyo, Japan'"),
    units: z.enum(["celsius", "fahrenheit"]).optional().default("celsius")
      .describe("Temperature unit"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
    humidity: z.number(),
  }),
  execute: async (inputData, context) => {
    const { location, units } = inputData;
    const { abortSignal } = context;

    if (abortSignal?.aborted) throw new Error("Aborted");

    // Fetch weather data...
    return { temperature: 72, conditions: "sunny", humidity: 45 };
  },
});
```

## v1 Beta Execute Signature (CRITICAL)

### Correct v1 Beta Signature

```typescript
// v1 Beta: execute(inputData, context)
execute: async (inputData, context) => {
  // First parameter: parsed input matching inputSchema
  const { location, units } = inputData;

  // Second parameter: context object
  const {
    mastra,         // Access to Mastra instance (agents, workflows)
    runtimeContext, // Request-specific values
    abortSignal,    // Abort controller signal
  } = context;

  return { result: "..." };
}
```

### Wrong (Stable 0.24.x Signature)

```typescript
// WRONG for v1 Beta - this is the stable signature
execute: async ({ context, mastra, runtimeContext }) => {
  const { location } = context;  // context contains input in stable
  // ...
}
```

### Comparison Table

| Version | Signature | Input Access | Context Access |
|---------|-----------|--------------|----------------|
| v1 Beta | `(inputData, context)` | `inputData.field` | `context.mastra` |
| Stable 0.24.x | `({ context, mastra })` | `context.field` | `mastra` |

## Zod Schema Best Practices

### Input Schema

```typescript
inputSchema: z.object({
  // Always add .describe() to help LLM understand usage
  query: z.string().describe("Search query, 1-100 characters"),

  // Use .optional() with .default() for optional params
  limit: z.number().optional().default(10).describe("Max results (1-100)"),

  // Use enums for constrained choices
  format: z.enum(["json", "text", "markdown"]).describe("Output format"),

  // Complex nested objects
  filters: z.object({
    startDate: z.string().optional().describe("ISO date string"),
    endDate: z.string().optional().describe("ISO date string"),
    categories: z.array(z.string()).optional().describe("Filter categories"),
  }).optional().describe("Optional filters for the search"),
})
```

### Output Schema

```typescript
// Always define outputSchema - prevents validation issues
outputSchema: z.object({
  results: z.array(z.object({
    title: z.string(),
    url: z.string(),
    snippet: z.string(),
  })),
  totalCount: z.number(),
  hasMore: z.boolean(),
})
```

### Description Guidelines

```typescript
// Good: Specific, actionable descriptions
description: "Fetches current weather conditions including temperature, " +
             "humidity, and conditions for a specific city. Use when the " +
             "user asks about weather, temperature, or climate in a location."

// Bad: Vague, unhelpful
description: "Gets weather data"

// Good: Field descriptions guide LLM input
location: z.string().describe("City name with optional country, e.g., 'Paris' or 'Paris, France'")

// Bad: No guidance
location: z.string()
```

## Abort Signal Handling

### Basic Pattern

```typescript
execute: async (inputData, context) => {
  const { abortSignal } = context;

  // Check at start
  if (abortSignal?.aborted) throw new Error("Aborted");

  const result = await someOperation();

  // Check after long operations
  if (abortSignal?.aborted) throw new Error("Aborted");

  return result;
}
```

### With Fetch Requests

```typescript
execute: async (inputData, context) => {
  const { abortSignal } = context;

  // Pass signal to fetch
  const response = await fetch(url, {
    signal: abortSignal,
  });

  return await response.json();
}
```

### With Iterative Operations

```typescript
execute: async (inputData, context) => {
  const { abortSignal } = context;
  const results = [];

  for (const item of items) {
    // Check each iteration
    if (abortSignal?.aborted) {
      throw new Error("Aborted during processing");
    }

    results.push(await processItem(item));
  }

  return { results };
}
```

## Tool Wrappers

### Wrapping an Agent as a Tool

```typescript
export const copywriterTool = createTool({
  id: "copywriter-tool",
  description: "Writes blog post copy about a given topic using AI",
  inputSchema: z.object({
    topic: z.string().describe("Topic to write about"),
    tone: z.enum(["formal", "casual", "technical"]).optional().default("casual"),
  }),
  outputSchema: z.object({
    copy: z.string(),
    wordCount: z.number(),
  }),
  execute: async (inputData, context) => {
    const { topic, tone } = inputData;
    const { mastra } = context;

    // Get agent from Mastra (NOT direct import)
    const agent = mastra?.getAgent("copywriter-agent");
    if (!agent) throw new Error("Copywriter agent not found");

    const prompt = `Write a ${tone} blog post about: ${topic}`;
    const result = await agent.generate(prompt);

    return {
      copy: result.text,
      wordCount: result.text.split(/\s+/).length,
    };
  },
});
```

### Wrapping a Workflow as a Tool

```typescript
export const dataProcessorTool = createTool({
  id: "data-processor",
  description: "Processes data through the data pipeline workflow",
  inputSchema: z.object({
    data: z.string().describe("JSON data to process"),
  }),
  outputSchema: z.object({
    result: z.string(),
    success: z.boolean(),
    duration: z.number(),
  }),
  execute: async (inputData, context) => {
    const { data } = inputData;
    const { mastra, runtimeContext } = context;

    const startTime = Date.now();

    const workflow = mastra?.getWorkflow("data-pipeline");
    if (!workflow) throw new Error("Workflow not found");

    const run = workflow.createRun();
    const result = await run.start({
      inputData: { data: JSON.parse(data) },
      runtimeContext,  // Propagate context
    });

    return {
      result: JSON.stringify(result.steps?.["final-step"]?.output),
      success: result.status === "success",
      duration: Date.now() - startTime,
    };
  },
});
```

## Context Propagation

### Propagating Runtime Context

```typescript
execute: async (inputData, context) => {
  const { mastra, runtimeContext } = context;

  // Propagate to nested agent
  const agent = mastra?.getAgent("nested-agent");
  await agent?.generate("Query", { runtimeContext });

  // Propagate to nested workflow
  const workflow = mastra?.getWorkflow("nested-workflow");
  await workflow?.createRun().start({
    inputData: { value: inputData.value },
    runtimeContext,
  });
}
```

### Accessing Runtime Context Values

```typescript
execute: async (inputData, context) => {
  const { runtimeContext } = context;

  const userId = runtimeContext.get("user-id");
  const tier = runtimeContext.get("user-tier");
  const requestId = runtimeContext.get("request-id");

  // Use context values for authorization, logging, etc.
  if (tier !== "premium") {
    throw new Error("Premium subscription required");
  }

  return { result: "..." };
}
```

## Error Handling

### Structured Error Returns

```typescript
outputSchema: z.object({
  success: z.boolean(),
  data: z.any().optional(),
  error: z.string().optional(),
}),
execute: async (inputData, context) => {
  try {
    const result = await riskyOperation(inputData);
    return { success: true, data: result };
  } catch (error) {
    return { success: false, error: error.message };
  }
}
```

### Throwing vs Returning Errors

```typescript
// Throw for unrecoverable errors (stops agent execution)
if (!context.mastra) {
  throw new Error("Mastra instance not available");
}

// Return for recoverable/expected errors (agent can continue)
if (!data) {
  return { success: false, error: "No data found" };
}
```

## Tool Categories

### API Integration Tools

```typescript
export const githubTool = createTool({
  id: "github-api",
  description: "Interacts with GitHub API for repository operations",
  inputSchema: z.object({
    action: z.enum(["list-repos", "get-issues", "create-issue"]),
    owner: z.string(),
    repo: z.string().optional(),
    data: z.any().optional(),
  }),
  outputSchema: z.object({
    result: z.any(),
    status: z.number(),
  }),
  execute: async (inputData, context) => {
    const { action, owner, repo, data } = inputData;
    const { runtimeContext, abortSignal } = context;

    const token = runtimeContext.get("github-token");
    if (!token) throw new Error("GitHub token not configured");

    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: { Authorization: `token ${token}` },
      signal: abortSignal,
    });

    return {
      result: await response.json(),
      status: response.status,
    };
  },
});
```

### Computation Tools

```typescript
export const calculatorTool = createTool({
  id: "calculator",
  description: "Performs mathematical calculations. Supports +, -, *, /, ^, sqrt",
  inputSchema: z.object({
    expression: z.string().describe("Math expression, e.g., '(5 + 3) * 2'"),
  }),
  outputSchema: z.object({
    result: z.number(),
    expression: z.string(),
  }),
  execute: async (inputData) => {
    const { expression } = inputData;

    // Safe evaluation (use a proper math parser in production)
    const result = evaluateExpression(expression);

    return { result, expression };
  },
});
```

### Data Retrieval Tools

```typescript
export const databaseTool = createTool({
  id: "database-query",
  description: "Executes read-only database queries",
  inputSchema: z.object({
    table: z.enum(["users", "orders", "products"]),
    filters: z.record(z.string()).optional(),
    limit: z.number().optional().default(10),
  }),
  outputSchema: z.object({
    rows: z.array(z.any()),
    count: z.number(),
  }),
  execute: async (inputData, context) => {
    const { table, filters, limit } = inputData;
    const { runtimeContext } = context;

    // Get database connection from context
    const db = runtimeContext.get("database");

    const rows = await db.query(table, filters, limit);

    return { rows, count: rows.length };
  },
});
```

## Registering Tools

### In Agents

```typescript
const agent = new Agent({
  name: "multi-tool-agent",
  tools: {
    weatherTool,
    calculatorTool,
    searchTool,
  },
});
```

### In Mastra (for workflow access)

```typescript
const mastra = new Mastra({
  agents: { myAgent },
  tools: {
    weatherTool,
    calculatorTool,
  },
});

// Access in workflows
const tool = mastra.getTool("weather-tool");
```

## Testing Tools

### Unit Test Pattern

```typescript
import { describe, it, expect } from "vitest";

describe("Weather Tool", () => {
  it("should return weather data", async () => {
    const result = await weatherTool.execute(
      { location: "Seattle", units: "celsius" },
      {
        mastra: undefined,
        runtimeContext: new RuntimeContext(),
        abortSignal: new AbortController().signal,
      }
    );

    expect(result.temperature).toBeTypeOf("number");
    expect(result.conditions).toBeTypeOf("string");
  });
});
```

### With Mocked Dependencies

```typescript
describe("Copywriter Tool", () => {
  it("should use agent to generate copy", async () => {
    const mockMastra = {
      getAgent: vi.fn().mockReturnValue({
        generate: vi.fn().mockResolvedValue({ text: "Generated copy" }),
      }),
    };

    const result = await copywriterTool.execute(
      { topic: "AI trends" },
      {
        mastra: mockMastra as any,
        runtimeContext: new RuntimeContext(),
        abortSignal: new AbortController().signal,
      }
    );

    expect(result.copy).toBe("Generated copy");
    expect(mockMastra.getAgent).toHaveBeenCalledWith("copywriter-agent");
  });
});
```
