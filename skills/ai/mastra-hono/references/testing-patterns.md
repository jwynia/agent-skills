# Testing Patterns

Complete guide to testing Mastra agents, tools, and workflows with Vitest.

## Setup

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
```

### Test Setup File

```typescript
// test/setup.ts
import { beforeAll, afterAll, vi } from "vitest";

// Mock environment variables
beforeAll(() => {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.DATABASE_URL = "file:./test.db";
});

// Clean up
afterAll(() => {
  vi.restoreAllMocks();
});
```

### Package.json Scripts

```json
{
  "scripts": {
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:coverage": "vitest --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Testing Tools

### Basic Tool Test

```typescript
import { describe, it, expect } from "vitest";
import { RuntimeContext } from "@mastra/core";
import { weatherTool } from "../src/mastra/tools/weather-tool";

describe("Weather Tool", () => {
  it("should return weather data for valid location", async () => {
    const result = await weatherTool.execute(
      { location: "Seattle", units: "celsius" },
      {
        mastra: undefined,
        runtimeContext: new RuntimeContext(),
        abortSignal: new AbortController().signal,
      }
    );

    expect(result).toHaveProperty("temperature");
    expect(result).toHaveProperty("conditions");
    expect(typeof result.temperature).toBe("number");
  });

  it("should handle abort signal", async () => {
    const controller = new AbortController();
    controller.abort();

    await expect(
      weatherTool.execute(
        { location: "Seattle" },
        {
          mastra: undefined,
          runtimeContext: new RuntimeContext(),
          abortSignal: controller.signal,
        }
      )
    ).rejects.toThrow("Aborted");
  });
});
```

### Tool with Mocked External API

```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock fetch globally
vi.mock("node-fetch", () => ({
  default: vi.fn(),
}));

import fetch from "node-fetch";
import { apiTool } from "../src/mastra/tools/api-tool";

describe("API Tool", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fetch data from API", async () => {
    (fetch as any).mockResolvedValue({
      json: () => Promise.resolve({ data: "test" }),
      ok: true,
    });

    const result = await apiTool.execute(
      { endpoint: "/users" },
      {
        mastra: undefined,
        runtimeContext: new RuntimeContext(),
        abortSignal: new AbortController().signal,
      }
    );

    expect(result.data).toBe("test");
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining("/users"),
      expect.any(Object)
    );
  });
});
```

### Tool with Mocked Mastra

```typescript
describe("Agent Wrapper Tool", () => {
  it("should call nested agent", async () => {
    const mockAgent = {
      generate: vi.fn().mockResolvedValue({ text: "Generated text" }),
    };

    const mockMastra = {
      getAgent: vi.fn().mockReturnValue(mockAgent),
    };

    const result = await copywriterTool.execute(
      { topic: "AI trends" },
      {
        mastra: mockMastra as any,
        runtimeContext: new RuntimeContext(),
        abortSignal: new AbortController().signal,
      }
    );

    expect(mockMastra.getAgent).toHaveBeenCalledWith("copywriter-agent");
    expect(mockAgent.generate).toHaveBeenCalled();
    expect(result.copy).toBe("Generated text");
  });
});
```

## Testing Workflows

### Schema Compatibility Tests

```typescript
import { describe, it, expect } from "vitest";
import { z } from "zod";

describe("Workflow Schema Tests", () => {
  it("step1 output matches step2 input", () => {
    const step1OutputSchema = z.object({ formatted: z.string() });
    const step2InputSchema = z.object({ formatted: z.string() });

    const step1Output = { formatted: "HELLO" };

    // Validate step1 output against step2 input
    const result = step2InputSchema.safeParse(step1Output);
    expect(result.success).toBe(true);
  });

  it("parallel output matches combine step input", () => {
    const parallelOutput = {
      "format-step": { formatted: "HELLO" },
      "count-step": { count: 5 },
    };

    const combineInputSchema = z.object({
      "format-step": z.object({ formatted: z.string() }),
      "count-step": z.object({ count: z.number() }),
    });

    const result = combineInputSchema.safeParse(parallelOutput);
    expect(result.success).toBe(true);
  });

  it("branch output uses optional correctly", () => {
    const branchOutput = {
      "branch-a": { result: "A executed" },
      // branch-b is undefined (didn't execute)
    };

    const afterBranchSchema = z.object({
      "branch-a": z.object({ result: z.string() }).optional(),
      "branch-b": z.object({ result: z.string() }).optional(),
    });

    const result = afterBranchSchema.safeParse(branchOutput);
    expect(result.success).toBe(true);
  });
});
```

### Complete Workflow Test

```typescript
import { describe, it, expect } from "vitest";
import { dataWorkflow } from "../src/mastra/workflows/data-workflow";

describe("Data Workflow", () => {
  it("should process data through all steps", async () => {
    const run = dataWorkflow.createRun();

    const result = await run.start({
      inputData: { value: 5 },
    });

    expect(result.status).toBe("success");

    // Verify step 1 received correct input
    expect(result.steps["step-1"].payload).toEqual({ value: 5 });
    expect(result.steps["step-1"].output.doubled).toBe(10);

    // Verify data flowed to step 2
    expect(result.steps["step-2"].payload).toEqual({ doubled: 10 });
    expect(result.steps["step-2"].output.result).toBe(20);
  });

  it("should handle errors gracefully", async () => {
    const run = dataWorkflow.createRun();

    const result = await run.start({
      inputData: { value: -1 }, // Invalid input
    });

    expect(result.status).toBe("failed");
    expect(result.error).toBeDefined();
  });
});
```

### Step Unit Test

```typescript
import { describe, it, expect } from "vitest";
import { formatStep } from "../src/mastra/workflows/steps/format-step";

describe("Format Step", () => {
  it("should format input correctly", async () => {
    const result = await formatStep.execute({
      inputData: { text: "hello world" },
      getStepResult: () => null,
      getInitData: () => ({ text: "hello world" }),
      suspend: async () => {},
      state: {},
      setState: () => {},
      runId: "test-run",
      mastra: undefined,
      runtimeContext: new RuntimeContext(),
    });

    expect(result.formatted).toBe("HELLO WORLD");
  });
});
```

## Mocking LLM Responses

### Mock OpenAI Provider

```typescript
import { vi } from "vitest";

vi.mock("@ai-sdk/openai", () => ({
  openai: vi.fn().mockReturnValue({
    doGenerate: vi.fn().mockResolvedValue({
      text: "Mocked LLM response",
      usage: { promptTokens: 10, completionTokens: 20 },
    }),
    doStream: vi.fn().mockReturnValue({
      stream: (async function* () {
        yield { type: "text-delta", textDelta: "Mocked " };
        yield { type: "text-delta", textDelta: "stream" };
      })(),
    }),
  }),
}));
```

### Mock Agent Response

```typescript
import { describe, it, expect, vi } from "vitest";
import { Agent } from "@mastra/core/agent";

describe("Agent with Mocked LLM", () => {
  it("should return mocked response", async () => {
    const mockModel = {
      doGenerate: vi.fn().mockResolvedValue({
        text: "Mocked response",
        usage: { promptTokens: 10, completionTokens: 20 },
      }),
    };

    const agent = new Agent({
      name: "test-agent",
      instructions: "Test instructions",
      model: mockModel as any,
    });

    const response = await agent.generate("Hello");
    expect(response.text).toBe("Mocked response");
  });
});
```

### Spy on Agent Calls

```typescript
describe("Tool with Agent", () => {
  it("should call agent with correct prompt", async () => {
    const generateSpy = vi.fn().mockResolvedValue({ text: "Result" });

    const mockMastra = {
      getAgent: vi.fn().mockReturnValue({
        generate: generateSpy,
      }),
    };

    await myTool.execute(
      { topic: "AI trends" },
      { mastra: mockMastra as any, runtimeContext: new RuntimeContext() }
    );

    expect(generateSpy).toHaveBeenCalledWith(
      expect.stringContaining("AI trends"),
      expect.any(Object)
    );
  });
});
```

## Testing Mastra Instance

### Integration Test Setup

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

describe("Mastra Integration", () => {
  let mastra: Mastra;

  beforeAll(async () => {
    mastra = new Mastra({
      agents: { testAgent },
      workflows: { testWorkflow },
      storage: new LibSQLStore({
        url: "file:./test.db",
      }),
    });
  });

  afterAll(async () => {
    // Cleanup test database
    await fs.unlink("./test.db").catch(() => {});
  });

  it("should get registered agent", () => {
    const agent = mastra.getAgent("test-agent");
    expect(agent).toBeDefined();
    expect(agent?.name).toBe("test-agent");
  });

  it("should get registered workflow", () => {
    const workflow = mastra.getWorkflow("test-workflow");
    expect(workflow).toBeDefined();
  });
});
```

## Testing Hono Routes

### Route Test Setup

```typescript
import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { MastraServer } from "@mastra/hono";
import { mastra } from "../src/mastra";

describe("API Routes", () => {
  let app: Hono;

  beforeAll(async () => {
    app = new Hono();
    const server = new MastraServer({ app, mastra });
    await server.init();
  });

  it("should respond to health check", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
  });

  it("should generate from agent", async () => {
    const res = await app.request("/api/agents/test-agent/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toHaveProperty("text");
  });
});
```

### Custom Route Test

```typescript
describe("Custom Routes", () => {
  it("should handle custom API route", async () => {
    // Add custom route
    app.post("/custom", async (c) => {
      const mastra = c.get("mastra");
      const agent = mastra.getAgent("test-agent");
      const result = await agent.generate("Test");
      return c.json({ response: result.text });
    });

    const res = await app.request("/custom", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    expect(res.status).toBe(200);
  });
});
```

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: "22"
          cache: "npm"

      - run: npm ci

      - run: npm test
        env:
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}

      - uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json
```

### Running Evals in CI

```typescript
// test/evals.test.ts
import { describe, it, expect } from "vitest";
import { evaluate } from "@mastra/evals";

describe("Agent Evals", () => {
  it("should pass quality evaluation", async () => {
    const result = await evaluate({
      agent: myAgent,
      testCases: [
        {
          input: "What is 2 + 2?",
          expected: "4",
          scorer: (response, expected) => {
            return response.includes(expected) ? 1 : 0;
          },
        },
      ],
    });

    expect(result.score).toBeGreaterThan(0.8);
  });
});
```

## Best Practices

### 1. Test Schema Compatibility First

```typescript
// Always test that schemas chain correctly
describe("Schema Chain", () => {
  it("workflow → step1 → step2 → workflow schemas match", () => {
    // Test each connection in the chain
  });
});
```

### 2. Mock External Dependencies

```typescript
// Never hit real APIs in unit tests
vi.mock("node-fetch");
vi.mock("@ai-sdk/openai");
```

### 3. Use Factories for Test Data

```typescript
function createTestContext(overrides = {}) {
  return {
    mastra: undefined,
    runtimeContext: new RuntimeContext(),
    abortSignal: new AbortController().signal,
    ...overrides,
  };
}
```

### 4. Test Error Paths

```typescript
it("should handle API errors", async () => {
  (fetch as any).mockRejectedValue(new Error("Network error"));

  await expect(tool.execute(input, context)).rejects.toThrow("Network error");
});
```

### 5. Isolate Tests

```typescript
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});
```
