/**
 * Mastra Agent Template (v1 Beta)
 *
 * Usage: Copy this file and customize for your agent.
 *
 * Replace:
 * - AGENT_NAME: Your agent's unique identifier
 * - AGENT_INSTRUCTIONS: System prompt for the agent
 * - MODEL: The LLM model to use
 * - TOOLS: Object containing tools available to this agent
 */

import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
// import { myTool } from "../tools/my-tool.js";

export const AGENT_NAME = new Agent({
  // Required: Unique identifier for this agent
  name: "AGENT_NAME",

  // Required: System prompt that defines agent behavior
  instructions: `You are a helpful assistant.

Your capabilities:
- [List what this agent can do]
- [Another capability]

Guidelines:
- [How to behave]
- [Response format preferences]

When you don't know something, admit it clearly.`,

  // Required: LLM model
  // Options:
  //   - SDK: openai("gpt-4o-mini"), anthropic("claude-3-5-sonnet-20241022")
  //   - Router string: "openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"
  //   - Fallback array: [{ model: "openai/gpt-4o", maxRetries: 3 }, ...]
  model: openai("gpt-4o-mini"),

  // Optional: Tools available to this agent (MUST be object, not array)
  tools: {
    // myTool,
    // anotherTool,
  },
});

// Export for registration in Mastra instance

/*
// Example usage:

import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  agents: { AGENT_NAME },
});

// Then call:
const response = await AGENT_NAME.generate("Hello!", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
});

console.log(response.text);
*/
