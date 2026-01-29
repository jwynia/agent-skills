/**
 * Mastra Tool Template (v1 Beta)
 *
 * IMPORTANT: v1 Beta uses a different execute signature than stable!
 *
 * v1 Beta:  execute: async (inputData, context) => { ... }
 * Stable:   execute: async ({ context, mastra }) => { ... }
 *
 * Usage: Copy this file and customize for your tool.
 *
 * Replace:
 * - TOOL_ID: Unique identifier for this tool
 * - TOOL_DESCRIPTION: What this tool does (helps LLM decide when to use it)
 * - Input/Output schemas: Define with Zod
 * - Execute logic: Implement your tool's functionality
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const TOOL_ID = createTool({
  // Required: Unique identifier
  id: "TOOL_ID",

  // Required: Description helps LLM understand when to use this tool
  // Be specific! Include:
  // - What the tool does
  // - When to use it
  // - What input it expects
  description:
    "TOOL_DESCRIPTION. Use when the user asks to [scenario]. " +
    "Input: [expected input format].",

  // Required: Zod schema for input validation
  // Always add .describe() to help LLM understand each field
  inputSchema: z.object({
    // Example fields - replace with your schema
    query: z.string().describe("The search query or input text"),
    limit: z
      .number()
      .optional()
      .default(10)
      .describe("Maximum number of results (1-100)"),
  }),

  // Required: Zod schema for output validation
  // Always define this to prevent validation issues
  outputSchema: z.object({
    // Example fields - replace with your schema
    results: z.array(z.string()),
    count: z.number(),
    success: z.boolean(),
  }),

  // Required: Execute function
  // v1 Beta signature: (inputData, context) => Promise<Output>
  execute: async (inputData, context) => {
    // Destructure parsed input from first parameter
    const { query, limit } = inputData;

    // Destructure context from second parameter
    const {
      mastra, // Access to Mastra instance (agents, workflows, tools)
      runtimeContext, // Request-specific values
      abortSignal, // Abort controller signal
    } = context;

    // Always check abort signal for long operations
    if (abortSignal?.aborted) {
      throw new Error("Operation aborted");
    }

    // Access runtime context values if needed
    // const userId = runtimeContext.get("user-id");
    // const tier = runtimeContext.get("user-tier");

    // Access other agents if needed (for agent-as-tool pattern)
    // const helper = mastra?.getAgent("helper-agent");
    // const helperResult = await helper?.generate("...", { runtimeContext });

    // Your tool logic here
    // ...

    // Return must match outputSchema
    return {
      results: ["result1", "result2"],
      count: 2,
      success: true,
    };
  },
});

/*
// Example: API Integration Tool

export const apiTool = createTool({
  id: "fetch-data",
  description: "Fetches data from external API",
  inputSchema: z.object({
    endpoint: z.string().describe("API endpoint path"),
  }),
  outputSchema: z.object({
    data: z.any(),
    status: z.number(),
  }),
  execute: async (inputData, context) => {
    const { endpoint } = inputData;
    const { abortSignal, runtimeContext } = context;

    const apiKey = runtimeContext.get("api-key");

    const response = await fetch(`https://api.example.com${endpoint}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
      signal: abortSignal,
    });

    return {
      data: await response.json(),
      status: response.status,
    };
  },
});
*/

/*
// Example: Agent-as-Tool Pattern

export const copywriterTool = createTool({
  id: "copywriter",
  description: "Writes content using the copywriter agent",
  inputSchema: z.object({
    topic: z.string(),
  }),
  outputSchema: z.object({
    content: z.string(),
  }),
  execute: async (inputData, context) => {
    const { topic } = inputData;
    const { mastra, runtimeContext } = context;

    // Get agent from Mastra (NOT direct import)
    const agent = mastra?.getAgent("copywriter-agent");
    if (!agent) throw new Error("Copywriter agent not found");

    const result = await agent.generate(`Write about: ${topic}`, {
      runtimeContext,  // Propagate context
    });

    return { content: result.text };
  },
});
*/
