/**
 * Vitest Configuration and Setup for Mastra Projects
 *
 * This template provides:
 * - vitest.config.ts configuration
 * - Test setup file with common mocks
 * - Example test patterns
 *
 * Usage:
 * 1. Copy vitest.config.ts to your project root
 * 2. Copy test/setup.ts to your test directory
 * 3. Use the example patterns for your tests
 */

// ============================================================================
// vitest.config.ts
// ============================================================================

/*
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    include: ["**\/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "test/",
        "**\/*.d.ts",
        "**\/*.config.*",
      ],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
*/

// ============================================================================
// test/setup.ts
// ============================================================================

import { beforeAll, afterAll, beforeEach, afterEach, vi } from "vitest";

// Mock environment variables
beforeAll(() => {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.DATABASE_URL = "file:./test.db";
  process.env.NODE_ENV = "test";
});

// Reset mocks between tests
beforeEach(() => {
  vi.clearAllMocks();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// Cleanup after all tests
afterAll(async () => {
  // Clean up test database if needed
  // await fs.unlink("./test.db").catch(() => {});
});

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Creates a mock context for tool testing
 */
export function createMockContext(overrides: Partial<ToolContext> = {}) {
  const { RuntimeContext } = require("@mastra/core");

  return {
    mastra: undefined,
    runtimeContext: new RuntimeContext(),
    abortSignal: new AbortController().signal,
    ...overrides,
  };
}

/**
 * Creates a mock Mastra instance
 */
export function createMockMastra(agents: Record<string, any> = {}) {
  return {
    getAgent: vi.fn((name: string) => agents[name]),
    getWorkflow: vi.fn(),
    getTool: vi.fn(),
    storage: {
      getMessages: vi.fn(),
      addMessage: vi.fn(),
      createThread: vi.fn(),
      listThreads: vi.fn(),
    },
    vectors: {
      default: {
        query: vi.fn(),
        upsert: vi.fn(),
      },
    },
  };
}

/**
 * Creates a mock agent for testing
 */
export function createMockAgent(responses: Record<string, string> = {}) {
  return {
    generate: vi.fn(async (message: string) => ({
      text: responses[message] || "Default mock response",
      usage: { promptTokens: 10, completionTokens: 20 },
    })),
    stream: vi.fn(async () => ({
      textStream: (async function* () {
        yield "Mocked ";
        yield "stream";
      })(),
    })),
  };
}

// Type for context
interface ToolContext {
  mastra: any;
  runtimeContext: any;
  abortSignal: AbortSignal;
}

// ============================================================================
// Example Test Patterns
// ============================================================================

/*
// test/tools/weather-tool.test.ts

import { describe, it, expect, vi } from "vitest";
import { weatherTool } from "../../src/mastra/tools/weather-tool";
import { createMockContext, createMockMastra } from "../setup";

describe("Weather Tool", () => {
  it("should return weather data for valid location", async () => {
    const result = await weatherTool.execute(
      { location: "Seattle", units: "celsius" },
      createMockContext()
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
        createMockContext({ abortSignal: controller.signal })
      )
    ).rejects.toThrow("Aborted");
  });

  it("should use nested agent when available", async () => {
    const mockAgent = {
      generate: vi.fn().mockResolvedValue({ text: "Weather analysis" }),
    };
    const mockMastra = createMockMastra({ "analyzer-agent": mockAgent });

    const result = await weatherTool.execute(
      { location: "Seattle" },
      createMockContext({ mastra: mockMastra as any })
    );

    expect(mockMastra.getAgent).toHaveBeenCalledWith("analyzer-agent");
  });
});
*/

/*
// test/workflows/data-workflow.test.ts

import { describe, it, expect } from "vitest";
import { z } from "zod";
import { dataWorkflow } from "../../src/mastra/workflows/data-workflow";

describe("Data Workflow", () => {
  describe("Schema Compatibility", () => {
    it("step1 output matches step2 input", () => {
      const step1Output = { processed: "HELLO", count: 5 };
      const step2InputSchema = z.object({
        processed: z.string(),
        count: z.number(),
      });

      const result = step2InputSchema.safeParse(step1Output);
      expect(result.success).toBe(true);
    });
  });

  describe("Workflow Execution", () => {
    it("should process data through all steps", async () => {
      const run = dataWorkflow.createRun();
      const result = await run.start({
        inputData: { value: "hello" },
      });

      expect(result.status).toBe("success");
      expect(result.steps["step-1"]).toBeDefined();
      expect(result.steps["step-2"]).toBeDefined();
    });

    it("should handle errors gracefully", async () => {
      const run = dataWorkflow.createRun();
      const result = await run.start({
        inputData: { value: "" }, // Empty string triggers error
      });

      expect(result.status).toBe("failed");
    });
  });
});
*/

/*
// test/api/routes.test.ts

import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { MastraServer } from "@mastra/hono";
import { mastra } from "../../src/mastra";

describe("API Routes", () => {
  let app: Hono;

  beforeAll(async () => {
    app = new Hono();
    const server = new MastraServer({ app, mastra });
    await server.init();

    // Add test routes
    app.get("/health", (c) => c.json({ status: "healthy" }));
  });

  it("should respond to health check", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("healthy");
  });

  it("should handle agent generate endpoint", async () => {
    const res = await app.request("/api/agents/test-agent/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [{ role: "user", content: "Hello" }],
      }),
    });

    // May be 200 or 404 depending on agent registration
    expect([200, 404]).toContain(res.status);
  });
});
*/

// Export for use in test files
export { vi } from "vitest";
