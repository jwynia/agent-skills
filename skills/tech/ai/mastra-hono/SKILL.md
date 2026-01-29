---
name: mastra-hono
description: "Develop AI agents, tools, and workflows with Mastra v1 Beta and Hono servers. This skill should be used when creating Mastra agents, defining tools with Zod schemas, building workflows with step data flow, setting up Hono API servers with Mastra adapters, or implementing agent networks. Keywords: mastra, hono, agent, tool, workflow, AI, LLM, typescript, API, MCP."
license: MIT
compatibility: Node.js 22.13.0+ required for v1 Beta
metadata:
  author: agent-skills
  version: "1.0"
---

# Mastra + Hono Development

Build production-ready AI agents, tools, and workflows using Mastra v1 Beta with Hono API servers. This skill covers the complete stack from agent definition to deployment.

**Target version**: Mastra v1 Beta (stable release expected January 2026)

## When to Use This Skill

**Use when**:
- Creating Mastra agents with tools and memory
- Defining tools with Zod input/output schemas
- Building workflows with multi-step data flow
- Setting up Hono API servers with Mastra adapters
- Implementing agent networks for multi-agent collaboration
- Authoring MCP servers to expose agents/tools
- Integrating RAG and conversation memory

**Do NOT use when**:
- Working with Mastra stable (0.24.x) - patterns differ significantly
- Building non-AI web APIs (use Hono directly)
- Simple LLM calls without agents/tools

## Prerequisites

- **Node.js 22.13.0+** (required for v1 Beta)
- **Package manager**: npm, pnpm, or bun
- **API keys**: OpenAI, Anthropic, or other supported providers

```bash
# Install v1 Beta packages
npm install @mastra/core@beta @mastra/hono@beta
npm install @ai-sdk/openai  # or other provider
npm install zod hono @hono/node-server
```

## Quick Start

### Minimal Agent + Tool + Hono Server

```typescript
// src/mastra/tools/weather-tool.ts
import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const weatherTool = createTool({
  id: "get-weather",
  description: "Fetches current weather for a location",
  inputSchema: z.object({
    location: z.string().describe("City name, e.g., 'Seattle'"),
  }),
  outputSchema: z.object({
    temperature: z.number(),
    conditions: z.string(),
  }),
  // v1 Beta signature: (inputData, context)
  execute: async (inputData, context) => {
    const { location } = inputData;
    const { abortSignal } = context;

    if (abortSignal?.aborted) throw new Error("Aborted");

    // Fetch weather data...
    return { temperature: 72, conditions: "sunny" };
  },
});
```

```typescript
// src/mastra/agents/weather-agent.ts
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { weatherTool } from "../tools/weather-tool.js";

export const weatherAgent = new Agent({
  name: "weather-agent",
  instructions: "You are a helpful weather assistant.",
  model: openai("gpt-4o-mini"),
  tools: { weatherTool },  // Object, not array
});
```

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";
import { weatherAgent } from "./agents/weather-agent.js";

export const mastra = new Mastra({
  agents: { weatherAgent },
});
```

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MastraServer } from "@mastra/hono";
import { mastra } from "./mastra/index.js";

const app = new Hono();
const server = new MastraServer({ app, mastra });
await server.init();

app.get("/", (c) => c.text("Mastra + Hono Server"));

serve({ fetch: app.fetch, port: 3000 });
console.log("Server running at http://localhost:3000");
// Agent endpoint: POST /api/agents/weather-agent/generate
```

---

## Core Patterns

### Agent Definition

```typescript
import { Agent } from "@mastra/core/agent";

const agent = new Agent({
  name: "my-agent",                           // Required: unique identifier
  instructions: "You are a helpful assistant.", // Required: system prompt
  model: openai("gpt-4o-mini"),               // Required: LLM model
  tools: { weatherTool, searchTool },         // Optional: object with named tools
});

// Model routing (1113+ models from 53 providers)
model: "openai/gpt-4o-mini"
model: "anthropic/claude-3-5-sonnet"
model: "google/gemini-2.5-flash"

// Model fallbacks for resilience
model: [
  { model: "anthropic/claude-3-opus", maxRetries: 3 },
  { model: "openai/gpt-4o", maxRetries: 2 },
  { model: "google/gemini-pro", maxRetries: 1 },
]

// Agent execution with memory
const response = await agent.generate("Remember my name is Alex", {
  memory: {
    thread: "conversation-123",   // Isolates conversation
    resource: "user-456",         // Associates with user
  },
});
```

### Tool Signatures (v1 Beta - CRITICAL)

```typescript
// v1 Beta: execute(inputData, context)
execute: async (inputData, context) => {
  const { location } = inputData;  // First parameter: parsed input
  const { mastra, runtimeContext, abortSignal } = context;  // Second: context

  // Access nested agents via mastra
  const helper = mastra?.getAgent("helperAgent");

  // Always check abort signal for long operations
  if (abortSignal?.aborted) throw new Error("Aborted");

  return { temperature: 72, conditions: "sunny" };
}

// WRONG for v1 Beta:
execute: async ({ context }) => { ... }  // This is stable 0.24.x signature
```

### Workflow Data Flow (CRITICAL)

This is where most errors occur. See `references/workflow-data-flow.md` for complete patterns.

```typescript
import { createWorkflow, createStep } from "@mastra/core/workflows";

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
  inputSchema: z.object({ formatted: z.string() }),  // MUST match step1 output
  outputSchema: z.object({ emphasized: z.string() }),
  execute: async ({ inputData }) => {
    // inputData = step1's return value directly
    return { emphasized: `${inputData.formatted}!!!` };
  },
});

const workflow = createWorkflow({
  id: "my-workflow",
  inputSchema: z.object({ message: z.string() }),     // MUST match step1 input
  outputSchema: z.object({ emphasized: z.string() }), // MUST match final output
})
  .then(step1)
  .then(step2)
  .commit();
```

**Schema matching rules**:
| Rule | Description |
|------|-------------|
| Workflow input → Step 1 input | Must match exactly |
| Step N output → Step N+1 input | Must match exactly |
| Final step output → Workflow output | Must match exactly |

**Data access in steps**:
```typescript
execute: async ({
  inputData,      // Previous step's output (or workflow input for step 1)
  getStepResult,  // Access ANY step's output by ID
  getInitData,    // Get original workflow input
  mastra,         // Access agents, tools, storage
}) => {
  const step1Result = getStepResult("step-1");
  const originalInput = getInitData();
  return { result: inputData.formatted };
}
```

### Hono Server Setup

```typescript
import { MastraServer } from "@mastra/hono";

const app = new Hono();
const server = new MastraServer({ app, mastra });
await server.init();

// Endpoints auto-registered:
// POST /api/agents/{agent-name}/generate
// POST /api/agents/{agent-name}/stream
// POST /api/workflows/{workflow-id}/start
```

**Custom route prefix**:
```typescript
const server = new MastraServer({
  app,
  mastra,
  prefix: "/v1/ai"  // Routes at /v1/ai/agents/...
});
```

**Custom API routes**:
```typescript
import { registerApiRoute } from "@mastra/core/server";

registerApiRoute("/my-custom-route", {
  method: "POST",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const agent = mastra.getAgent("my-agent");
    const result = await agent.generate("Hello");
    return c.json({ response: result.text });
  },
});
```

---

## Common Mistakes Quick Reference

| Topic | Wrong | Correct |
|-------|-------|---------|
| Imports | `import { Agent } from "@mastra/core"` | `import { Agent } from "@mastra/core/agent"` |
| Tools array | `tools: [tool1, tool2]` | `tools: { tool1, tool2 }` |
| Memory context | `{ threadId: "123" }` | `{ memory: { thread: "123", resource: "user" } }` |
| Workflow data | `context.steps.step1.output` | `inputData` or `getStepResult("step-1")` |
| After parallel | `inputData.result` | `inputData["step-id"].result` |
| After branch | `inputData.result` | `inputData["step-id"]?.result` (optional) |
| Nested agents | `import agent; agent.generate()` | `mastra.getAgent("name").generate()` |
| State mutation | `state.counter++` | `setState({ ...state, counter: state.counter + 1 })` |
| v1 tool exec | `execute: async ({ context })` | `execute: async (inputData, context)` |

---

## Scripts Reference

| Script | Purpose | Usage |
|--------|---------|-------|
| `scaffold-project.ts` | Create new Mastra+Hono project | `deno run --allow-all scripts/scaffold-project.ts --name my-project` |
| `scaffold-agent.ts` | Create agent with tools | `deno run --allow-all scripts/scaffold-agent.ts --name weather` |
| `scaffold-workflow.ts` | Create workflow with steps | `deno run --allow-all scripts/scaffold-workflow.ts --name process-data` |
| `scaffold-tool.ts` | Create tool with schemas | `deno run --allow-all scripts/scaffold-tool.ts --name fetch-weather` |
| `validate-workflow-schemas.ts` | Validate step schema matching | `deno run --allow-read scripts/validate-workflow-schemas.ts ./src/mastra/workflows/` |
| `check-version-patterns.ts` | Detect v1/stable pattern mixing | `deno run --allow-read scripts/check-version-patterns.ts ./src/mastra/` |

---

## Additional Resources

### Reference Files
- **`references/workflow-data-flow.md`** - Complete data flow patterns (CRITICAL)
- **`references/common-mistakes.md`** - Extended anti-patterns and fixes
- **`references/agent-patterns.md`** - Agent definition deep-dive
- **`references/tool-patterns.md`** - Tool signatures, wrappers
- **`references/hono-server-patterns.md`** - Server setup, routes, middleware
- **`references/testing-patterns.md`** - Vitest setup, mocking LLMs
- **`references/mcp-server-patterns.md`** - Model Context Protocol authoring
- **`references/agent-networks.md`** - Multi-agent collaboration, A2A
- **`references/rag-memory-patterns.md`** - Vector stores, embeddings, memory
- **`references/context-network-memory.md`** - Context networks for agent memory

### Asset Templates
- **`assets/agent-template.ts`** - Agent boilerplate
- **`assets/tool-template.ts`** - Tool boilerplate (v1 signature)
- **`assets/workflow-template.ts`** - Workflow boilerplate
- **`assets/hono-server-template.ts`** - Hono+Mastra server setup
- **`assets/vitest-setup-template.ts`** - Test configuration

### External Documentation
- [Mastra v1 Beta Docs](https://mastra.ai/docs/v1)
- [Hono Documentation](https://hono.dev/docs)
- [Mastra GitHub](https://github.com/mastra-ai/mastra)

---

## Limitations

- Targets v1 Beta only; stable (0.24.x) patterns differ significantly
- Scripts require Deno runtime with appropriate permissions
- MCP server patterns require MCP-compatible clients
- Agent networks require all participating agents to be registered in same Mastra instance

## Related Skills

- **research-workflow** - Deep dive research for AI agent design
- **web-search** - Real-time information retrieval for agents
