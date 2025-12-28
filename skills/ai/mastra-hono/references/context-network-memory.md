# Context Network Memory Patterns

Guide to integrating context networks across agent knowledge, conversation memory, and developer documentation.

## Overview

Context networks provide a structured approach to organizing information at three levels:

1. **Agent Knowledge (RAG)** - Facts and documents agents can retrieve
2. **Conversation Memory** - Thread-based context and insights
3. **Developer Documentation** - Project knowledge that informs agent behavior

This integration creates a unified knowledge layer where information flows between all three levels.

## Level 1: Agent Knowledge as Context Network

### Organizing Knowledge with Atomic Notes

```typescript
// Knowledge as atomic, interconnected notes
interface KnowledgeNode {
  id: string;
  title: string;
  content: string;
  type: "fact" | "concept" | "procedure" | "decision";
  connections: string[];  // IDs of related nodes
  metadata: {
    source: string;
    createdAt: string;
    confidence: number;
  };
}

// Example knowledge nodes
const knowledgeBase: KnowledgeNode[] = [
  {
    id: "api-auth",
    title: "API Authentication",
    content: "The API uses Bearer token authentication...",
    type: "procedure",
    connections: ["api-endpoints", "security-policies"],
    metadata: { source: "docs", createdAt: "2024-01-15", confidence: 1.0 },
  },
  {
    id: "api-endpoints",
    title: "API Endpoints",
    content: "Available endpoints include /users, /orders, /products...",
    type: "concept",
    connections: ["api-auth", "rate-limits"],
    metadata: { source: "docs", createdAt: "2024-01-15", confidence: 1.0 },
  },
];
```

### Indexing with Relationship Metadata

```typescript
// Index knowledge nodes with connection information
async function indexKnowledgeNetwork(nodes: KnowledgeNode[]) {
  const embeddings = await embedMany({
    model: openai.embedding("text-embedding-3-small"),
    values: nodes.map(n => `${n.title}\n\n${n.content}`),
  });

  await mastra.vectors?.default.upsert({
    indexName: "knowledge-network",
    vectors: nodes.map((node, i) => ({
      id: node.id,
      vector: embeddings.embeddings[i],
      metadata: {
        title: node.title,
        content: node.content,
        type: node.type,
        connections: node.connections,
        ...node.metadata,
      },
    })),
  });
}
```

### Graph-Aware Retrieval

```typescript
export const contextNetworkSearch = createTool({
  id: "context-network-search",
  description: "Search knowledge network with relationship expansion",
  inputSchema: z.object({
    query: z.string(),
    expandConnections: z.boolean().optional().default(true),
    maxDepth: z.number().optional().default(1),
  }),
  execute: async (input, context) => {
    const { query, expandConnections, maxDepth } = input;
    const { mastra } = context;

    // Initial semantic search
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    const directResults = await mastra?.vectors?.default.query({
      indexName: "knowledge-network",
      queryVector: embedding,
      topK: 5,
    });

    if (!expandConnections) {
      return { nodes: directResults };
    }

    // Expand connections
    const expanded = new Map();
    const queue = directResults?.map(r => ({ node: r, depth: 0 })) || [];

    while (queue.length > 0) {
      const { node, depth } = queue.shift()!;

      if (expanded.has(node.id) || depth > maxDepth) continue;
      expanded.set(node.id, node);

      // Fetch connected nodes
      if (depth < maxDepth && node.metadata.connections) {
        for (const connId of node.metadata.connections) {
          const connected = await mastra?.vectors?.default.get({
            indexName: "knowledge-network",
            id: connId,
          });
          if (connected) {
            queue.push({ node: connected, depth: depth + 1 });
          }
        }
      }
    }

    return {
      nodes: Array.from(expanded.values()),
      connections: directResults?.flatMap(r => r.metadata.connections || []),
    };
  },
});
```

## Level 2: Conversation Memory as Context Network

### Thread Organization Patterns

```typescript
// Threads organized by context type
interface ThreadContext {
  threadId: string;
  contextType: "support" | "research" | "planning" | "general";
  topic: string;
  connections: string[];  // Related threads
  insights: ConversationInsight[];
}

interface ConversationInsight {
  id: string;
  type: "preference" | "fact" | "decision" | "question";
  content: string;
  extractedFrom: string;  // Message ID
  confidence: number;
}
```

### Extracting Insights from Conversations

```typescript
const insightExtractor = createStep({
  id: "extract-insights",
  execute: async ({ inputData, mastra }) => {
    const { threadId, messages } = inputData;

    // Use LLM to extract insights
    const extractor = new Agent({
      name: "insight-extractor",
      model: openai("gpt-4o-mini"),
      instructions: `Extract key insights from conversations.
        Categories:
        - preference: User preferences (e.g., "prefers dark mode")
        - fact: Facts about user/context (e.g., "works at TechCorp")
        - decision: Decisions made (e.g., "chose Plan B")
        - question: Unanswered questions`,
    });

    const conversation = messages.map(m => `${m.role}: ${m.content}`).join("\n");

    const insights = await extractor.generate(conversation, {
      output: z.object({
        insights: z.array(z.object({
          type: z.enum(["preference", "fact", "decision", "question"]),
          content: z.string(),
          confidence: z.number(),
        })),
      }),
    });

    // Store insights in knowledge network
    for (const insight of insights.object.insights) {
      await mastra?.vectors?.default.upsert({
        indexName: "conversation-insights",
        vectors: [{
          id: `${threadId}-${Date.now()}`,
          vector: await getEmbedding(insight.content),
          metadata: {
            ...insight,
            threadId,
            extractedAt: new Date().toISOString(),
          },
        }],
      });
    }

    return { insights: insights.object.insights };
  },
});
```

### Cross-Session Context

```typescript
export const retrieveUserContext = createTool({
  id: "retrieve-user-context",
  description: "Retrieve relevant context from user's conversation history",
  inputSchema: z.object({
    userId: z.string(),
    currentQuery: z.string(),
  }),
  execute: async (input, context) => {
    const { userId, currentQuery } = input;
    const { mastra } = context;

    // Get insights relevant to current query
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: currentQuery,
    });

    const relevantInsights = await mastra?.vectors?.default.query({
      indexName: "conversation-insights",
      queryVector: embedding,
      topK: 10,
      filter: { userId },
    });

    // Get recent conversation context
    const recentThreads = await mastra?.storage?.listThreads({
      resourceId: userId,
      limit: 5,
    });

    return {
      insights: relevantInsights?.map(i => ({
        type: i.metadata.type,
        content: i.metadata.content,
        from: i.metadata.threadId,
      })),
      recentTopics: recentThreads?.map(t => t.metadata?.topic),
    };
  },
});
```

### Memory Consolidation to Knowledge

```typescript
const consolidateToKnowledge = async (threadId: string, userId: string) => {
  const insights = await mastra.vectors?.default.query({
    indexName: "conversation-insights",
    filter: { threadId },
    topK: 100,
  });

  // High-confidence insights become permanent knowledge
  const permanentInsights = insights?.filter(i => i.metadata.confidence > 0.8);

  for (const insight of permanentInsights || []) {
    await mastra.vectors?.default.upsert({
      indexName: "user-knowledge",
      vectors: [{
        id: `${userId}-${insight.id}`,
        vector: insight.vector,
        metadata: {
          userId,
          content: insight.metadata.content,
          type: insight.metadata.type,
          source: "conversation",
          originalThread: threadId,
          consolidatedAt: new Date().toISOString(),
        },
      }],
    });
  }

  return { consolidated: permanentInsights?.length || 0 };
};
```

## Level 3: Developer Documentation as Context

### Project Context Network

```typescript
// Structure mirrors .context-network.md
interface ProjectContext {
  architecture: {
    decisions: ArchitectureDecision[];
    patterns: Pattern[];
    constraints: Constraint[];
  };
  agents: {
    [agentName: string]: AgentContext;
  };
  tasks: {
    completed: TaskRecord[];
    inProgress: TaskRecord[];
  };
}

interface ArchitectureDecision {
  id: string;
  title: string;
  context: string;
  decision: string;
  consequences: string[];
  date: string;
  status: "active" | "superseded";
}
```

### Agent Self-Documentation

```typescript
// Agent can query its own documentation
export const selfDocsTool = createTool({
  id: "query-my-docs",
  description: "Query documentation about this agent's capabilities and constraints",
  inputSchema: z.object({
    query: z.string().describe("What to look up about my capabilities"),
  }),
  execute: async (input, context) => {
    const { query } = input;
    const { runtimeContext, mastra } = context;

    const agentName = runtimeContext.get("current-agent");

    // Search project context network
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    const docs = await mastra?.vectors?.default.query({
      indexName: "project-context",
      queryVector: embedding,
      filter: {
        $or: [
          { type: "agent-docs", agentName },
          { type: "architecture-decision" },
          { type: "project-constraint" },
        ],
      },
      topK: 5,
    });

    return {
      capabilities: docs?.filter(d => d.metadata.type === "agent-docs"),
      relevantDecisions: docs?.filter(d => d.metadata.type === "architecture-decision"),
      constraints: docs?.filter(d => d.metadata.type === "project-constraint"),
    };
  },
});
```

### Decision Record Integration

```typescript
// Decisions from context network inform agent behavior
const decisionAwareAgent = new Agent({
  name: "decision-aware-agent",
  instructions: async ({ runtimeContext, mastra }) => {
    // Fetch relevant architectural decisions
    const decisions = await mastra?.vectors?.default.query({
      indexName: "project-context",
      filter: { type: "architecture-decision", status: "active" },
      topK: 10,
    });

    const decisionContext = decisions
      ?.map(d => `- ${d.metadata.title}: ${d.metadata.decision}`)
      .join("\n");

    return `You are a development assistant.

Respect these architectural decisions:
${decisionContext}

When in doubt about approaches, query the project documentation.`;
  },
  model: openai("gpt-4o-mini"),
  tools: { selfDocsTool },
});
```

## Cross-Layer Integration

### Unified Query Tool

```typescript
export const unifiedContextSearch = createTool({
  id: "unified-context-search",
  description: "Search across all context layers: knowledge, memory, and docs",
  inputSchema: z.object({
    query: z.string(),
    layers: z.array(z.enum(["knowledge", "memory", "docs"])).optional(),
  }),
  execute: async (input, context) => {
    const { query, layers = ["knowledge", "memory", "docs"] } = input;
    const { mastra, runtimeContext } = context;

    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    const results: Record<string, any[]> = {};

    if (layers.includes("knowledge")) {
      results.knowledge = await mastra?.vectors?.default.query({
        indexName: "knowledge-network",
        queryVector: embedding,
        topK: 5,
      }) || [];
    }

    if (layers.includes("memory")) {
      const userId = runtimeContext.get("user-id");
      results.memory = await mastra?.vectors?.default.query({
        indexName: "conversation-insights",
        queryVector: embedding,
        filter: userId ? { userId } : undefined,
        topK: 5,
      }) || [];
    }

    if (layers.includes("docs")) {
      results.docs = await mastra?.vectors?.default.query({
        indexName: "project-context",
        queryVector: embedding,
        topK: 5,
      }) || [];
    }

    return results;
  },
});
```

### Feedback Loops

```typescript
// Conversation insights update knowledge
const feedbackLoop = createWorkflow({
  id: "context-feedback-loop",
  inputSchema: z.object({
    threadId: z.string(),
    userId: z.string(),
  }),
  outputSchema: z.object({ updated: z.number() }),
})
  .then(createStep({
    id: "extract-insights",
    execute: async ({ inputData, mastra }) => {
      // Extract new insights from conversation
      const messages = await mastra?.storage?.getMessages({
        threadId: inputData.threadId,
        limit: 50,
      });

      // ... insight extraction logic
      return { insights: extractedInsights };
    },
  }))
  .then(createStep({
    id: "validate-insights",
    execute: async ({ inputData }) => {
      // Filter high-confidence insights
      return {
        validInsights: inputData.insights.filter(i => i.confidence > 0.7),
      };
    },
  }))
  .then(createStep({
    id: "update-knowledge",
    execute: async ({ inputData, mastra }) => {
      // Update knowledge network
      let updated = 0;
      for (const insight of inputData.validInsights) {
        // Check if this updates existing knowledge
        const existing = await mastra?.vectors?.default.query({
          indexName: "knowledge-network",
          queryVector: await getEmbedding(insight.content),
          topK: 1,
          scoreThreshold: 0.95,
        });

        if (existing?.length) {
          // Update existing node
          await updateKnowledgeNode(existing[0].id, insight);
        } else {
          // Create new node
          await createKnowledgeNode(insight);
        }
        updated++;
      }
      return { updated };
    },
  }))
  .commit();
```

### Developer Decisions Propagate to Agents

```typescript
// When a new architectural decision is made
async function recordDecision(decision: ArchitectureDecision) {
  // 1. Store in project context
  await mastra.vectors?.default.upsert({
    indexName: "project-context",
    vectors: [{
      id: decision.id,
      vector: await getEmbedding(`${decision.title} ${decision.decision}`),
      metadata: {
        type: "architecture-decision",
        ...decision,
      },
    }],
  });

  // 2. Update affected agent instructions
  for (const agentName of getAffectedAgents(decision)) {
    await refreshAgentInstructions(agentName);
  }

  // 3. Notify relevant conversation threads
  const affectedThreads = await findAffectedThreads(decision);
  for (const thread of affectedThreads) {
    await mastra.storage?.addMessage({
      threadId: thread.id,
      role: "system",
      content: `[CONTEXT UPDATE] New architectural decision may affect this conversation: ${decision.title}`,
    });
  }
}
```

## Best Practices

### 1. Atomic Knowledge Nodes

Keep knowledge nodes small and focused:
- One concept per node
- 100-300 words maximum
- Clear connections to related nodes

### 2. Explicit Connections

Always define relationships:
- `relatedTo`: Conceptual similarity
- `dependsOn`: Prerequisite knowledge
- `supersedes`: Updated information
- `conflictsWith`: Contradictory information

### 3. Source Tracking

Always track where information came from:
- `source: "docs"` - Official documentation
- `source: "conversation"` - Extracted from user
- `source: "decision"` - Architectural decision
- `source: "inferred"` - AI-generated connection

### 4. Confidence Scoring

Track reliability of information:
- 1.0: Verified fact
- 0.8+: High confidence
- 0.5-0.8: Moderate confidence
- <0.5: Speculative

### 5. Regular Maintenance

Schedule maintenance workflows:
- Consolidate conversation insights weekly
- Validate knowledge connections monthly
- Archive superseded decisions quarterly
