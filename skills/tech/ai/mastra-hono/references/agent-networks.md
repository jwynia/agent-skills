# Agent Networks

Guide to multi-agent collaboration, A2A protocol, and agent orchestration patterns.

## Overview

Agent networks enable multiple specialized agents to collaborate on complex tasks. Mastra supports:

- **AgentNetwork class** - Coordinates multiple agents
- **A2A Protocol** - Agent-to-Agent communication (based on Google's A2A standard)
- **Supervisor patterns** - Hierarchical agent organization
- **Tool-based delegation** - Agents calling other agents as tools

## Basic Agent Network

### Creating an Agent Network

```typescript
import { AgentNetwork } from "@mastra/core/agent";
import { researcherAgent, writerAgent, editorAgent } from "./agents";

const contentTeam = new AgentNetwork({
  name: "content-team",
  description: "A team that researches, writes, and edits content",
  agents: [researcherAgent, writerAgent, editorAgent],
});
```

### Using the Network

```typescript
const result = await contentTeam.generate(
  "Create a blog post about AI trends in 2025"
);

console.log(result.text);
console.log(result.agentPath); // Which agents were involved
```

## Routing Strategies

### Automatic Routing (Default)

The network automatically routes to the most appropriate agent based on the request.

```typescript
const network = new AgentNetwork({
  name: "auto-network",
  agents: [weatherAgent, calculatorAgent, searchAgent],
  // Routing happens automatically based on agent instructions/descriptions
});

// Routes to weather agent
await network.generate("What's the weather in Tokyo?");

// Routes to calculator agent
await network.generate("What is 15% of 250?");
```

### Custom Router Function

```typescript
const network = new AgentNetwork({
  name: "custom-routed",
  agents: [researcherAgent, writerAgent, editorAgent],
  router: async ({ message, context }) => {
    const keywords = message.toLowerCase();

    if (keywords.includes("research") || keywords.includes("find")) {
      return "researcher-agent";
    }
    if (keywords.includes("write") || keywords.includes("create")) {
      return "writer-agent";
    }
    if (keywords.includes("edit") || keywords.includes("review")) {
      return "editor-agent";
    }

    // Default to researcher for ambiguous requests
    return "researcher-agent";
  },
});
```

### LLM-Based Routing

```typescript
import { openai } from "@ai-sdk/openai";

const network = new AgentNetwork({
  name: "llm-routed",
  agents: [agentA, agentB, agentC],
  router: async ({ message }) => {
    // Use LLM to decide routing
    const routerAgent = new Agent({
      name: "router",
      model: openai("gpt-4o-mini"),
      instructions: `You are a router. Given a message, respond with ONLY the name of the best agent to handle it.
        Available agents:
        - agent-a: Handles data analysis
        - agent-b: Handles content creation
        - agent-c: Handles customer support`,
    });

    const response = await routerAgent.generate(message);
    return response.text.trim();
  },
});
```

## Supervisor Pattern

### Hierarchical Agent Structure

```typescript
// Create specialized worker agents
const dataAnalyst = new Agent({
  name: "data-analyst",
  instructions: "You analyze data and provide insights.",
  model: openai("gpt-4o-mini"),
  tools: { dataQueryTool, chartTool },
});

const reportWriter = new Agent({
  name: "report-writer",
  instructions: "You write clear, professional reports.",
  model: openai("gpt-4o-mini"),
  tools: { formatTool },
});

// Create supervisor agent with delegation tools
const supervisor = new Agent({
  name: "supervisor",
  instructions: `You are a project supervisor. You coordinate work between specialists.

Available team members:
- data-analyst: For data queries and analysis
- report-writer: For writing and formatting reports

Delegate tasks appropriately and synthesize results.`,
  model: openai("gpt-4o"),
  tools: {
    delegateToAnalyst: createTool({
      id: "delegate-analyst",
      description: "Delegate a data analysis task to the data analyst",
      inputSchema: z.object({
        task: z.string().describe("The analysis task to perform"),
      }),
      execute: async (input, context) => {
        const analyst = context.mastra?.getAgent("data-analyst");
        const result = await analyst?.generate(input.task);
        return { analysis: result?.text };
      },
    }),
    delegateToWriter: createTool({
      id: "delegate-writer",
      description: "Delegate a writing task to the report writer",
      inputSchema: z.object({
        task: z.string().describe("The writing task"),
        data: z.string().optional().describe("Data to include"),
      }),
      execute: async (input, context) => {
        const writer = context.mastra?.getAgent("report-writer");
        const prompt = input.data
          ? `${input.task}\n\nData to use:\n${input.data}`
          : input.task;
        const result = await writer?.generate(prompt);
        return { report: result?.text };
      },
    }),
  },
});
```

### Using the Supervisor

```typescript
// Register all agents
const mastra = new Mastra({
  agents: {
    supervisor,
    "data-analyst": dataAnalyst,
    "report-writer": reportWriter,
  },
});

// Supervisor coordinates the work
const result = await supervisor.generate(
  "Analyze our Q4 sales data and create a summary report"
);
```

## A2A Protocol

### Direct Agent Communication

```typescript
// Agent with A2A capabilities
const coordinatorAgent = new Agent({
  name: "coordinator",
  instructions: "You coordinate complex tasks across multiple agents.",
  model: openai("gpt-4o"),
  tools: {
    sendToAgent: createTool({
      id: "send-to-agent",
      description: "Send a message to another agent and get a response",
      inputSchema: z.object({
        agentName: z.string().describe("Name of the target agent"),
        message: z.string().describe("Message to send"),
        context: z.any().optional().describe("Additional context"),
      }),
      outputSchema: z.object({
        response: z.string(),
        success: z.boolean(),
      }),
      execute: async (input, context) => {
        const { agentName, message } = input;
        const { mastra, runtimeContext } = context;

        const targetAgent = mastra?.getAgent(agentName);
        if (!targetAgent) {
          return { response: `Agent ${agentName} not found`, success: false };
        }

        try {
          const result = await targetAgent.generate(message, { runtimeContext });
          return { response: result.text, success: true };
        } catch (error) {
          return { response: error.message, success: false };
        }
      },
    }),
  },
});
```

### Message Passing Patterns

```typescript
// Define message types
interface AgentMessage {
  from: string;
  to: string;
  type: "request" | "response" | "notification";
  content: string;
  metadata?: Record<string, any>;
}

// Message broker tool
const messageBroker = createTool({
  id: "message-broker",
  description: "Routes messages between agents",
  inputSchema: z.object({
    to: z.string(),
    type: z.enum(["request", "response", "notification"]),
    content: z.string(),
  }),
  execute: async (input, context) => {
    const { to, type, content } = input;
    const { mastra, runtimeContext } = context;

    // Log the message
    console.log(`[A2A] ${runtimeContext.get("current-agent")} -> ${to}: ${type}`);

    if (type === "notification") {
      // Fire and forget for notifications
      const agent = mastra?.getAgent(to);
      agent?.generate(content, { runtimeContext }).catch(console.error);
      return { sent: true };
    }

    // For requests, wait for response
    const agent = mastra?.getAgent(to);
    const response = await agent?.generate(content, { runtimeContext });
    return { response: response?.text };
  },
});
```

## Parallel Agent Execution

### Running Agents in Parallel

```typescript
const parallelNetwork = new AgentNetwork({
  name: "parallel-workers",
  agents: [researchAgent, factCheckAgent, summaryAgent],
  mode: "parallel", // All agents process simultaneously
});

// All agents receive the same input and process in parallel
const result = await parallelNetwork.generate("Analyze this article about AI");

// Results from all agents are combined
console.log(result.responses); // { researcher: "...", factChecker: "...", summarizer: "..." }
```

### Fan-Out/Fan-In Pattern

```typescript
const fanOutInNetwork = new AgentNetwork({
  name: "fan-out-in",
  agents: [analyst1, analyst2, analyst3],
  aggregator: async (responses) => {
    // Combine all responses into final output
    const combined = responses.map(r => r.text).join("\n\n");

    // Optionally use another agent to synthesize
    const synthesizer = new Agent({
      name: "synthesizer",
      instructions: "Combine and synthesize multiple analyses.",
      model: openai("gpt-4o-mini"),
    });

    const final = await synthesizer.generate(
      `Synthesize these analyses:\n\n${combined}`
    );

    return final.text;
  },
});
```

## Pipeline Pattern

### Sequential Agent Processing

```typescript
const pipeline = new AgentNetwork({
  name: "content-pipeline",
  agents: [researcherAgent, writerAgent, editorAgent],
  mode: "sequential", // Each agent passes output to the next
});

// Each agent's output becomes the next agent's input
const result = await pipeline.generate("Create an article about quantum computing");
// researcher -> writer -> editor
```

### Custom Pipeline Logic

```typescript
const customPipeline = {
  async run(input: string) {
    // Step 1: Research
    const research = await researcherAgent.generate(
      `Research the following topic: ${input}`
    );

    // Step 2: Write draft based on research
    const draft = await writerAgent.generate(
      `Write an article based on this research:\n\n${research.text}`
    );

    // Step 3: Edit and polish
    const final = await editorAgent.generate(
      `Edit and improve this draft:\n\n${draft.text}`
    );

    return {
      research: research.text,
      draft: draft.text,
      final: final.text,
    };
  },
};
```

## Consensus Pattern

### Multiple Agents Voting

```typescript
const consensusNetwork = {
  agents: [expert1, expert2, expert3],

  async decide(question: string) {
    // Get all expert opinions
    const opinions = await Promise.all(
      this.agents.map(agent =>
        agent.generate(question, {
          output: z.object({
            answer: z.string(),
            confidence: z.number().min(0).max(1),
            reasoning: z.string(),
          }),
        })
      )
    );

    // Find consensus
    const answers = opinions.map(o => o.object);
    const grouped = groupBy(answers, a => a.answer);

    // Return answer with highest combined confidence
    const winner = Object.entries(grouped)
      .map(([answer, votes]) => ({
        answer,
        totalConfidence: votes.reduce((sum, v) => sum + v.confidence, 0),
        count: votes.length,
      }))
      .sort((a, b) => b.totalConfidence - a.totalConfidence)[0];

    return {
      answer: winner.answer,
      confidence: winner.totalConfidence / this.agents.length,
      votesFor: winner.count,
      totalExperts: this.agents.length,
    };
  },
};
```

## Registering Networks

```typescript
const mastra = new Mastra({
  agents: {
    supervisor,
    researcher: researcherAgent,
    writer: writerAgent,
    editor: editorAgent,
  },
  networks: {
    contentTeam,
    analysisTeam,
  },
});

// Access network
const network = mastra.getNetwork("content-team");
const result = await network?.generate("Create a report");
```

## Best Practices

### 1. Clear Agent Responsibilities

```typescript
// Good: Specific, focused agents
const dataAgent = new Agent({
  name: "data-analyst",
  instructions: "You ONLY analyze data. Do not write reports or make recommendations.",
});

// Bad: Overlapping responsibilities
const vagueAgent = new Agent({
  name: "helper",
  instructions: "You help with various tasks.",
});
```

### 2. Proper Error Handling

```typescript
const resilientNetwork = new AgentNetwork({
  name: "resilient",
  agents: [primaryAgent, backupAgent],
  onError: async (error, agentName, context) => {
    console.error(`Agent ${agentName} failed:`, error);

    // Fallback to backup agent
    if (agentName !== "backup-agent") {
      const backup = context.mastra?.getAgent("backup-agent");
      return backup?.generate(context.originalMessage);
    }

    throw error;
  },
});
```

### 3. Context Propagation

```typescript
// Always propagate context through the network
const result = await network.generate(message, {
  runtimeContext,  // User ID, session info, etc.
  memory: { thread: "conversation-123" },
});
```

### 4. Logging and Tracing

```typescript
const observableNetwork = new AgentNetwork({
  name: "observable",
  agents: [agent1, agent2],
  onAgentStart: (agentName, input) => {
    console.log(`[${agentName}] Starting with input:`, input.slice(0, 100));
  },
  onAgentComplete: (agentName, output, duration) => {
    console.log(`[${agentName}] Completed in ${duration}ms`);
  },
});
```

### 5. Resource Management

```typescript
// Limit concurrent agent executions
const managedNetwork = new AgentNetwork({
  name: "managed",
  agents: [agent1, agent2, agent3],
  maxConcurrent: 2, // Only 2 agents run at a time
  timeout: 30000,   // 30 second timeout per agent
});
```
