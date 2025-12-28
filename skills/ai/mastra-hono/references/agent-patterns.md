# Agent Patterns

Complete guide to defining and using Mastra agents in v1 Beta.

## Basic Agent Definition

```typescript
import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";

export const myAgent = new Agent({
  name: "my-agent",                             // Required: unique identifier
  instructions: "You are a helpful assistant.", // Required: system prompt
  model: openai("gpt-4o-mini"),                 // Required: LLM model
  tools: { weatherTool, searchTool },           // Optional: named tools object
});
```

## Model Configuration

### Model Router Strings

Mastra supports 1113+ models from 53+ providers through model router strings.

```typescript
// OpenAI
model: "openai/gpt-4o"
model: "openai/gpt-4o-mini"
model: "openai/o1"

// Anthropic
model: "anthropic/claude-3-5-sonnet"
model: "anthropic/claude-3-opus"

// Google
model: "google/gemini-2.5-flash"
model: "google/gemini-pro"

// Others
model: "groq/llama-3.1-70b-versatile"
model: "mistral/mistral-large"
model: "cohere/command-r-plus"
```

### SDK Model Instances

```typescript
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

// Direct SDK usage
model: openai("gpt-4o-mini")
model: anthropic("claude-3-5-sonnet-20241022")
model: google("gemini-1.5-pro")

// With options
model: openai("gpt-4o", { temperature: 0.7 })
```

### Model Fallbacks

Configure automatic fallbacks for resilience.

```typescript
const agent = new Agent({
  name: "resilient-agent",
  model: [
    { model: "openai/gpt-4o", maxRetries: 3 },
    { model: "anthropic/claude-3-5-sonnet", maxRetries: 2 },
    { model: "google/gemini-pro", maxRetries: 1 },
  ],
  // Automatically falls back on 5xx, 429, or timeout errors
});
```

### Dynamic Model Selection

```typescript
const agent = new Agent({
  name: "dynamic-agent",
  model: ({ runtimeContext }) => {
    const provider = runtimeContext.get("provider-id");
    const tier = runtimeContext.get("user-tier");

    // Select model based on context
    if (tier === "premium") {
      return `${provider}/gpt-4o`;
    }
    return `${provider}/gpt-4o-mini`;
  },
});
```

## Instructions Patterns

### Basic Instructions

```typescript
instructions: "You are a helpful customer support agent for Acme Corp."
```

### Detailed Instructions

```typescript
instructions: `You are an expert weather analyst.

Your capabilities:
- Fetch current weather data for any city
- Provide detailed forecasts
- Explain weather patterns

Guidelines:
- Always include temperature in both Celsius and Fahrenheit
- Mention humidity and wind conditions
- Be concise but thorough

When you don't have data, say so clearly rather than guessing.`
```

### Dynamic Instructions

```typescript
const agent = new Agent({
  name: "personalized-agent",
  instructions: ({ runtimeContext }) => {
    const userName = runtimeContext.get("user-name");
    const preferences = runtimeContext.get("preferences");

    return `You are a personal assistant for ${userName}.

Their preferences:
${JSON.stringify(preferences, null, 2)}

Always address them by name and respect their preferences.`;
  },
});
```

## Tool Integration

### Adding Tools

```typescript
import { weatherTool } from "../tools/weather-tool.js";
import { searchTool } from "../tools/search-tool.js";
import { calculatorTool } from "../tools/calculator-tool.js";

const agent = new Agent({
  name: "multi-tool-agent",
  instructions: "You help users with weather, search, and calculations.",
  model: openai("gpt-4o-mini"),
  tools: {
    weatherTool,    // Key becomes tool's id in agent context
    searchTool,
    calculatorTool,
  },
});
```

### Tool Selection by Model

The agent automatically decides which tools to use based on the user's request and the tool descriptions.

```typescript
// Tool with good description = better selection
export const weatherTool = createTool({
  id: "get-weather",
  description: "Fetches current weather conditions for a specific city. " +
               "Use this when the user asks about weather, temperature, " +
               "or climate conditions in a location.",
  // ...
});
```

## Memory Configuration

### Basic Memory

```typescript
const response = await agent.generate("Remember my name is Alex", {
  memory: {
    thread: "conversation-123",  // Conversation isolation
    resource: "user-456",        // User association
  },
});

// Later in same thread
const response2 = await agent.generate("What's my name?", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
});
// Agent remembers: "Your name is Alex"
```

### Memory with Storage

```typescript
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

const mastra = new Mastra({
  agents: { myAgent },
  storage: new LibSQLStore({
    url: "file:./mastra.db",
  }),
});

// Conversations now persist across restarts
```

## Agent Execution

### Generate (Non-Streaming)

```typescript
const response = await agent.generate("What's the weather in Tokyo?");

console.log(response.text);       // Full response text
console.log(response.usage);      // Token usage
console.log(response.traceId);    // Trace ID for observability
```

### Stream (Real-Time)

```typescript
const stream = await agent.stream("Tell me about Seattle");

for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
```

### With Runtime Context

```typescript
import { RuntimeContext } from "@mastra/core";

const runtimeContext = new RuntimeContext();
runtimeContext.set("user-id", "user-123");
runtimeContext.set("user-tier", "premium");

const response = await agent.generate("What's my account status?", {
  runtimeContext,
});
```

### With Memory

```typescript
const response = await agent.generate("My favorite color is blue", {
  memory: {
    thread: "preferences-thread",
    resource: "user-456",
  },
});
```

## Structured Output

### With Output Schema

```typescript
import { z } from "zod";

const response = await agent.generate("List three cities in Japan", {
  output: z.object({
    cities: z.array(z.object({
      name: z.string(),
      population: z.number().optional(),
    })),
  }),
});

// response.object is typed as { cities: { name: string; population?: number }[] }
console.log(response.object.cities);
```

### Complex Structured Output

```typescript
const analysisSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
  confidence: z.number().min(0).max(1),
  keywords: z.array(z.string()),
  summary: z.string(),
});

const response = await agent.generate("Analyze: Great product, fast shipping!", {
  output: analysisSchema,
});
```

## Agent Networks

### Multi-Agent Collaboration

```typescript
import { AgentNetwork } from "@mastra/core/agent";

const network = new AgentNetwork({
  name: "research-team",
  agents: [researcherAgent, writerAgent, editorAgent],
  router: async ({ message }) => {
    // Route to appropriate agent based on task
    if (message.includes("research")) return "researcher-agent";
    if (message.includes("write")) return "writer-agent";
    return "editor-agent";
  },
});

const result = await network.generate("Research and write about AI trends");
```

### A2A Protocol (Agent-to-Agent)

```typescript
// Agents can communicate directly within a network
const supervisorAgent = new Agent({
  name: "supervisor",
  instructions: "You coordinate a team of specialized agents.",
  model: openai("gpt-4o"),
  tools: {
    delegateToResearcher: createTool({
      id: "delegate-research",
      description: "Delegate research task to researcher agent",
      inputSchema: z.object({ task: z.string() }),
      execute: async (input, context) => {
        const researcher = context.mastra?.getAgent("researcher");
        const result = await researcher?.generate(input.task);
        return { research: result?.text };
      },
    }),
  },
});
```

## Registering in Mastra

### Single Agent

```typescript
import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  agents: { weatherAgent },
});
```

### Multiple Agents

```typescript
export const mastra = new Mastra({
  agents: {
    weatherAgent,
    searchAgent,
    assistantAgent,
  },
});
```

### Accessing Agents

```typescript
// In tools or workflows
const agent = mastra.getAgent("weather-agent");
const result = await agent?.generate("Hello");

// In custom routes
registerApiRoute("/custom", {
  method: "POST",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const agent = mastra.getAgent("weather-agent");
    // ...
  },
});
```

## Observability

### AI Tracing

```typescript
const mastra = new Mastra({
  agents: { myAgent },
  observability: {
    default: { enabled: true },
  },
  storage: new LibSQLStore({ url: "file:./mastra.db" }),
});

// Traces automatically captured for all agent calls
```

### Custom Trace Context

```typescript
import { trace } from "@opentelemetry/api";

const currentSpan = trace.getActiveSpan();
const spanContext = currentSpan?.spanContext();

const result = await agent.generate("Analyze data", {
  tracingOptions: {
    traceId: spanContext?.traceId,
    parentSpanId: spanContext?.spanId,
  },
});

console.log("Trace ID:", result.traceId);
```

## Best Practices

### 1. Descriptive Names

```typescript
// Good: Descriptive, indicates purpose
name: "customer-support-agent"
name: "weather-forecast-agent"
name: "code-review-agent"

// Bad: Vague, non-descriptive
name: "agent1"
name: "my-agent"
name: "test"
```

### 2. Clear Instructions

```typescript
// Good: Specific, actionable
instructions: `You are a customer support agent for TechCorp.

Responsibilities:
- Answer product questions
- Help with billing issues
- Escalate complex issues

Tone: Professional but friendly
Response format: Keep answers under 200 words unless detailed explanation needed`

// Bad: Vague, no guidance
instructions: "Help users"
```

### 3. Tool Descriptions

```typescript
// Good: Explains what, when, and how
description: "Fetches current weather for a city. Use when user asks about " +
             "temperature, conditions, or forecast. Input: city name as string."

// Bad: Minimal, unhelpful
description: "Gets weather"
```

### 4. Error Handling

```typescript
try {
  const response = await agent.generate(userMessage);
  return response.text;
} catch (error) {
  if (error.message.includes("rate limit")) {
    // Handle rate limiting
    await delay(1000);
    return await agent.generate(userMessage);
  }
  throw error;
}
```
