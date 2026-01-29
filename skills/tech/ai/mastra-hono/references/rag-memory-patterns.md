# RAG and Memory Patterns

Guide to implementing Retrieval-Augmented Generation (RAG) and conversation memory in Mastra.

## Overview

Mastra supports multiple memory and retrieval patterns:

- **Conversation Memory** - Thread-based message history
- **Vector Storage** - Semantic search over documents
- **RAG Integration** - Combining retrieval with generation
- **Hybrid Search** - Vector + keyword search

## Conversation Memory

### Basic Memory Configuration

```typescript
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

const mastra = new Mastra({
  agents: { myAgent },
  storage: new LibSQLStore({
    url: "file:./mastra.db",
  }),
});
```

### Using Memory in Agent Calls

```typescript
// First interaction
const response1 = await agent.generate("My name is Alex and I work at TechCorp", {
  memory: {
    thread: "conversation-123",  // Unique thread ID
    resource: "user-456",        // User identifier
  },
});

// Later in same thread - agent remembers context
const response2 = await agent.generate("What company do I work for?", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
});
// Agent responds: "You work at TechCorp"
```

### Thread Management

```typescript
// Create new thread
const thread = await mastra.storage?.createThread({
  resourceId: "user-456",
  metadata: {
    topic: "customer-support",
    createdAt: new Date().toISOString(),
  },
});

// List threads for a user
const threads = await mastra.storage?.listThreads({
  resourceId: "user-456",
  page: 1,
  perPage: 10,
});

// Get thread messages
const messages = await mastra.storage?.getMessages({
  threadId: "thread-123",
  page: 1,
  perPage: 50,
});

// Delete thread
await mastra.storage?.deleteThread("thread-123");
```

### Message History Window

```typescript
// Limit context window for cost/performance
const response = await agent.generate("Continue our conversation", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
    options: {
      maxMessages: 10,     // Last 10 messages
      maxTokens: 4000,     // Or token limit
    },
  },
});
```

## Vector Storage

### Setting Up Vector Store

```typescript
import { Mastra } from "@mastra/core/mastra";
import { PgVector } from "@mastra/pg-vector";

const mastra = new Mastra({
  agents: { myAgent },
  vectors: {
    default: new PgVector({
      connectionString: process.env.DATABASE_URL,
      tableName: "embeddings",
    }),
  },
});
```

### Indexing Documents

```typescript
import { embedMany } from "@ai-sdk/openai";

// Chunk and embed documents
const documents = [
  { id: "doc-1", content: "Mastra is a TypeScript AI framework...", metadata: { source: "docs" } },
  { id: "doc-2", content: "Agents in Mastra can use tools...", metadata: { source: "docs" } },
];

// Generate embeddings
const { embeddings } = await embedMany({
  model: openai.embedding("text-embedding-3-small"),
  values: documents.map(d => d.content),
});

// Store in vector database
await mastra.vectors?.default.upsert({
  indexName: "knowledge-base",
  vectors: documents.map((doc, i) => ({
    id: doc.id,
    vector: embeddings[i],
    metadata: {
      content: doc.content,
      ...doc.metadata,
    },
  })),
});
```

### Querying Vectors

```typescript
import { embed } from "@ai-sdk/openai";

// Embed query
const { embedding } = await embed({
  model: openai.embedding("text-embedding-3-small"),
  value: "How do Mastra agents work?",
});

// Search
const results = await mastra.vectors?.default.query({
  indexName: "knowledge-base",
  queryVector: embedding,
  topK: 5,
  filter: { source: "docs" },
});

// results: [{ id, score, metadata: { content, source } }, ...]
```

## RAG Implementation

### Basic RAG Tool

```typescript
export const ragTool = createTool({
  id: "knowledge-search",
  description: "Search the knowledge base for relevant information",
  inputSchema: z.object({
    query: z.string().describe("Search query"),
    limit: z.number().optional().default(5),
  }),
  outputSchema: z.object({
    results: z.array(z.object({
      content: z.string(),
      score: z.number(),
      source: z.string(),
    })),
  }),
  execute: async (input, context) => {
    const { query, limit } = input;
    const { mastra } = context;

    // Embed query
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    // Search
    const results = await mastra?.vectors?.default.query({
      indexName: "knowledge-base",
      queryVector: embedding,
      topK: limit,
    });

    return {
      results: results?.map(r => ({
        content: r.metadata.content,
        score: r.score,
        source: r.metadata.source,
      })) || [],
    };
  },
});
```

### RAG-Enabled Agent

```typescript
const ragAgent = new Agent({
  name: "rag-agent",
  instructions: `You are a helpful assistant with access to a knowledge base.

When answering questions:
1. First search the knowledge base for relevant information
2. Use the retrieved information to inform your response
3. Cite sources when possible
4. If the knowledge base doesn't have relevant info, say so`,
  model: openai("gpt-4o-mini"),
  tools: { ragTool },
});
```

### Advanced RAG with Reranking

```typescript
export const advancedRagTool = createTool({
  id: "advanced-search",
  description: "Search with semantic reranking",
  inputSchema: z.object({
    query: z.string(),
    limit: z.number().optional().default(10),
  }),
  execute: async (input, context) => {
    const { query, limit } = input;
    const { mastra } = context;

    // Initial retrieval (over-fetch)
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    const candidates = await mastra?.vectors?.default.query({
      indexName: "knowledge-base",
      queryVector: embedding,
      topK: limit * 3, // Fetch 3x for reranking
    });

    // Rerank with LLM
    const reranker = new Agent({
      name: "reranker",
      model: openai("gpt-4o-mini"),
      instructions: "Score relevance 0-10 for each document to the query.",
    });

    const reranked = await Promise.all(
      candidates?.map(async (c) => {
        const response = await reranker.generate(
          `Query: ${query}\nDocument: ${c.metadata.content}\nScore (0-10):`,
          { output: z.object({ score: z.number() }) }
        );
        return { ...c, rerankedScore: response.object.score };
      }) || []
    );

    // Sort by reranked score and take top results
    return {
      results: reranked
        .sort((a, b) => b.rerankedScore - a.rerankedScore)
        .slice(0, limit)
        .map(r => ({
          content: r.metadata.content,
          score: r.rerankedScore,
        })),
    };
  },
});
```

## Hybrid Search

### Combining Vector and Keyword Search

```typescript
export const hybridSearchTool = createTool({
  id: "hybrid-search",
  description: "Search using both semantic and keyword matching",
  inputSchema: z.object({
    query: z.string(),
    keywords: z.array(z.string()).optional(),
  }),
  execute: async (input, context) => {
    const { query, keywords } = input;
    const { mastra } = context;

    // Semantic search
    const { embedding } = await embed({
      model: openai.embedding("text-embedding-3-small"),
      value: query,
    });

    const semanticResults = await mastra?.vectors?.default.query({
      indexName: "knowledge-base",
      queryVector: embedding,
      topK: 10,
    });

    // Keyword search (if storage supports full-text search)
    const keywordResults = keywords?.length
      ? await mastra?.storage?.search({
          query: keywords.join(" "),
          limit: 10,
        })
      : [];

    // Merge and deduplicate
    const merged = new Map();
    semanticResults?.forEach(r => {
      merged.set(r.id, { ...r, semanticScore: r.score, keywordScore: 0 });
    });
    keywordResults?.forEach((r: any) => {
      if (merged.has(r.id)) {
        merged.get(r.id).keywordScore = r.score;
      } else {
        merged.set(r.id, { ...r, semanticScore: 0, keywordScore: r.score });
      }
    });

    // Combine scores (weighted average)
    const results = Array.from(merged.values())
      .map(r => ({
        ...r,
        combinedScore: r.semanticScore * 0.7 + r.keywordScore * 0.3,
      }))
      .sort((a, b) => b.combinedScore - a.combinedScore);

    return { results: results.slice(0, 10) };
  },
});
```

## Memory Consolidation

### Summarizing Long Conversations

```typescript
const summarizeThread = async (threadId: string) => {
  const messages = await mastra.storage?.getMessages({
    threadId,
    page: 1,
    perPage: 100,
  });

  const summarizer = new Agent({
    name: "summarizer",
    model: openai("gpt-4o-mini"),
    instructions: "Create a concise summary of the conversation.",
  });

  const conversation = messages
    ?.map(m => `${m.role}: ${m.content}`)
    .join("\n");

  const summary = await summarizer.generate(
    `Summarize this conversation:\n\n${conversation}`
  );

  // Store summary as new message type
  await mastra.storage?.addMessage({
    threadId,
    role: "system",
    content: `[SUMMARY] ${summary.text}`,
    metadata: { type: "summary", originalMessageCount: messages?.length },
  });

  return summary.text;
};
```

### Periodic Consolidation

```typescript
// Workflow for periodic memory consolidation
const consolidationWorkflow = createWorkflow({
  id: "memory-consolidation",
  inputSchema: z.object({ threadId: z.string() }),
  outputSchema: z.object({ consolidated: z.boolean() }),
})
  .then(
    createStep({
      id: "check-thread-size",
      execute: async ({ inputData, mastra }) => {
        const messages = await mastra?.storage?.getMessages({
          threadId: inputData.threadId,
          page: 1,
          perPage: 1,
        });

        // @ts-ignore - checking total count
        const totalCount = messages?.totalCount || 0;
        return { needsConsolidation: totalCount > 50 };
      },
    })
  )
  .branch([
    [
      async ({ inputData }) => inputData.needsConsolidation,
      createStep({
        id: "consolidate",
        execute: async ({ inputData, mastra }) => {
          await summarizeThread(inputData.threadId);
          // Optionally archive old messages
          return { consolidated: true };
        },
      }),
    ],
    [
      async () => true,
      createStep({
        id: "skip",
        execute: async () => ({ consolidated: false }),
      }),
    ],
  ])
  .commit();
```

## Document Processing Pipeline

### Chunking and Indexing Workflow

```typescript
const indexDocumentWorkflow = createWorkflow({
  id: "index-document",
  inputSchema: z.object({
    documentId: z.string(),
    content: z.string(),
    metadata: z.record(z.any()),
  }),
  outputSchema: z.object({
    chunksIndexed: z.number(),
  }),
})
  .then(
    createStep({
      id: "chunk-document",
      execute: async ({ inputData }) => {
        // Split into chunks
        const chunks = chunkDocument(inputData.content, {
          maxChunkSize: 500,
          overlap: 50,
        });

        return {
          chunks: chunks.map((chunk, i) => ({
            id: `${inputData.documentId}-chunk-${i}`,
            content: chunk,
            metadata: {
              ...inputData.metadata,
              chunkIndex: i,
              documentId: inputData.documentId,
            },
          })),
        };
      },
    })
  )
  .then(
    createStep({
      id: "embed-chunks",
      execute: async ({ inputData }) => {
        const { embeddings } = await embedMany({
          model: openai.embedding("text-embedding-3-small"),
          values: inputData.chunks.map(c => c.content),
        });

        return {
          vectors: inputData.chunks.map((chunk, i) => ({
            id: chunk.id,
            vector: embeddings[i],
            metadata: chunk.metadata,
          })),
        };
      },
    })
  )
  .then(
    createStep({
      id: "store-vectors",
      execute: async ({ inputData, mastra }) => {
        await mastra?.vectors?.default.upsert({
          indexName: "documents",
          vectors: inputData.vectors,
        });

        return { chunksIndexed: inputData.vectors.length };
      },
    })
  )
  .commit();
```

## Best Practices

### 1. Chunk Size Optimization

```typescript
// Smaller chunks for precise retrieval
const preciseChunks = chunkDocument(content, { maxChunkSize: 200 });

// Larger chunks for more context
const contextualChunks = chunkDocument(content, { maxChunkSize: 1000 });
```

### 2. Metadata Enrichment

```typescript
// Rich metadata enables better filtering
await vectorStore.upsert({
  vectors: [{
    id: "doc-1",
    vector: embedding,
    metadata: {
      content: text,
      source: "docs",
      category: "api-reference",
      createdAt: new Date().toISOString(),
      author: "engineering-team",
      version: "2.0",
    },
  }],
});
```

### 3. Cache Embeddings

```typescript
const embeddingCache = new Map<string, number[]>();

async function getEmbedding(text: string): Promise<number[]> {
  const cacheKey = createHash("md5").update(text).digest("hex");

  if (embeddingCache.has(cacheKey)) {
    return embeddingCache.get(cacheKey)!;
  }

  const { embedding } = await embed({
    model: openai.embedding("text-embedding-3-small"),
    value: text,
  });

  embeddingCache.set(cacheKey, embedding);
  return embedding;
}
```

### 4. Thread Isolation

```typescript
// Use unique thread IDs per conversation context
const threadId = `${userId}-${sessionId}`;

// Or per topic
const threadId = `${userId}-support-ticket-${ticketId}`;
```

### 5. Memory Limits

```typescript
// Prevent runaway context costs
const response = await agent.generate(message, {
  memory: {
    thread: threadId,
    resource: userId,
    options: {
      maxMessages: 20,
      maxTokens: 8000,
      summarizeAfter: 15, // Auto-summarize after 15 messages
    },
  },
});
```
