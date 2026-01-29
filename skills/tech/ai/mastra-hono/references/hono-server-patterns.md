# Hono Server Patterns

Complete guide to setting up and configuring Hono servers with Mastra.

## Basic Setup

### Minimal Server

```typescript
// src/index.ts
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MastraServer } from "@mastra/hono";
import { mastra } from "./mastra/index.js";

const app = new Hono();
const server = new MastraServer({ app, mastra });
await server.init();  // Don't forget await!

app.get("/", (c) => c.text("Mastra + Hono Server"));

serve({ fetch: app.fetch, port: 3000 });
```

### Auto-Generated Endpoints

After `server.init()`, these endpoints are available:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/agents/{name}/generate` | POST | Generate response from agent |
| `/api/agents/{name}/stream` | POST | Stream response from agent |
| `/api/workflows/{id}/start` | POST | Start workflow run |
| `/api/workflows/{id}/{runId}/status` | GET | Get workflow run status |

### Request Format

```bash
# Agent generate
curl -X POST http://localhost:3000/api/agents/weather-agent/generate \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "What is the weather in Tokyo?" }
    ]
  }'

# Agent stream
curl -X POST http://localhost:3000/api/agents/weather-agent/stream \
  -H "Content-Type: application/json" \
  -d '{"messages": [{"role": "user", "content": "Tell me about Seattle"}]}'

# Workflow start
curl -X POST http://localhost:3000/api/workflows/data-pipeline/start \
  -H "Content-Type: application/json" \
  -d '{"inputData": {"value": 42}}'
```

## Server Configuration

### Custom Route Prefix

```typescript
const server = new MastraServer({
  app,
  mastra,
  prefix: "/v1/ai",  // Routes at /v1/ai/agents/...
});

// Now endpoints are:
// /v1/ai/agents/{name}/generate
// /v1/ai/workflows/{id}/start
```

### Mastra Instance Configuration

```typescript
// src/mastra/index.ts
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

export const mastra = new Mastra({
  agents: { weatherAgent, assistantAgent },
  workflows: { dataPipeline, reportGenerator },
  storage: new LibSQLStore({
    url: "file:./mastra.db",
  }),
  server: {
    port: 3000,      // Defaults to 4111
    timeout: 30000,  // Request timeout (default: 3 minutes)
  },
  cors: {
    origin: ["https://example.com"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  },
});
```

## Custom API Routes

### Basic Custom Route

```typescript
import { registerApiRoute } from "@mastra/core/server";

registerApiRoute("/health", {
  method: "GET",
  handler: async (c) => {
    return c.json({ status: "healthy", timestamp: Date.now() });
  },
});
```

### Accessing Mastra in Routes

```typescript
registerApiRoute("/custom-agent-call", {
  method: "POST",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const body = await c.req.json();

    const agent = mastra.getAgent("my-agent");
    if (!agent) {
      return c.json({ error: "Agent not found" }, 404);
    }

    const result = await agent.generate(body.message);
    return c.json({ response: result.text });
  },
});
```

### Running Workflows from Routes

```typescript
registerApiRoute("/process-data", {
  method: "POST",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const body = await c.req.json();

    const workflow = mastra.getWorkflow("data-pipeline");
    const run = workflow.createRun();

    const result = await run.start({
      inputData: { data: body.data },
    });

    return c.json({
      status: result.status,
      output: result.steps?.["final-step"]?.output,
    });
  },
});
```

### Route with Middleware

```typescript
import { bearerAuth } from "hono/bearer-auth";

registerApiRoute("/protected-route", {
  method: "POST",
  middleware: [
    bearerAuth({ token: process.env.API_TOKEN! }),
  ],
  handler: async (c) => {
    const mastra = c.get("mastra");
    // ... protected logic
    return c.json({ success: true });
  },
});
```

## Middleware Patterns

### Global Middleware

```typescript
const app = new Hono();

// Add middleware before MastraServer.init()
app.use("*", async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  await next();
});

// CORS middleware
import { cors } from "hono/cors";
app.use("*", cors({
  origin: ["https://example.com"],
  allowMethods: ["GET", "POST", "OPTIONS"],
}));

// Then initialize Mastra
const server = new MastraServer({ app, mastra });
await server.init();
```

### Authentication Middleware

```typescript
import { bearerAuth } from "hono/bearer-auth";

// Protect all /api routes
app.use("/api/*", bearerAuth({ token: process.env.API_TOKEN! }));

// Or use JWT
import { jwt } from "hono/jwt";
app.use("/api/*", jwt({ secret: process.env.JWT_SECRET! }));
```

### Rate Limiting

```typescript
// Custom rate limiter middleware
const rateLimiter = new Map<string, { count: number; resetAt: number }>();

app.use("/api/*", async (c, next) => {
  const ip = c.req.header("x-forwarded-for") || "unknown";
  const now = Date.now();
  const limit = rateLimiter.get(ip);

  if (limit && now < limit.resetAt) {
    if (limit.count >= 100) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }
    limit.count++;
  } else {
    rateLimiter.set(ip, { count: 1, resetAt: now + 60000 });
  }

  await next();
});
```

### Request Logging

```typescript
import { logger } from "hono/logger";

app.use("*", logger());
```

## RuntimeContext Pattern

### Setting Context at Request Level

```typescript
import { RuntimeContext } from "@mastra/core";

registerApiRoute("/user-query", {
  method: "POST",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const body = await c.req.json();
    const userId = c.req.header("x-user-id");

    // Create runtime context with request-specific values
    const runtimeContext = new RuntimeContext();
    runtimeContext.set("user-id", userId);
    runtimeContext.set("user-tier", body.tier || "free");
    runtimeContext.set("request-id", crypto.randomUUID());

    const agent = mastra.getAgent("my-agent");
    const result = await agent.generate(body.message, {
      runtimeContext,
    });

    return c.json({ response: result.text });
  },
});
```

### Accessing Context in Tools

```typescript
export const premiumTool = createTool({
  id: "premium-feature",
  execute: async (inputData, context) => {
    const { runtimeContext } = context;
    const tier = runtimeContext.get("user-tier");

    if (tier !== "premium") {
      throw new Error("Premium subscription required");
    }

    // Premium logic...
    return { result: "Premium result" };
  },
});
```

## OpenAPI Documentation

### Enabling OpenAPI

```typescript
const server = new MastraServer({
  app,
  mastra,
  openapiPath: "/openapi.json",  // Enable OpenAPI spec
});
await server.init();

// Access spec at http://localhost:3000/openapi.json
```

### Adding Swagger UI

```typescript
import { swaggerUI } from "@hono/swagger-ui";

app.get("/docs", swaggerUI({ url: "/openapi.json" }));
```

## Error Handling

### Global Error Handler

```typescript
app.onError((err, c) => {
  console.error("Server error:", err);

  if (err.message.includes("not found")) {
    return c.json({ error: "Resource not found" }, 404);
  }

  if (err.message.includes("unauthorized")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  return c.json({ error: "Internal server error" }, 500);
});
```

### Not Found Handler

```typescript
app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});
```

## Deployment Patterns

### Node.js Server

```typescript
import { serve } from "@hono/node-server";

serve({
  fetch: app.fetch,
  port: parseInt(process.env.PORT || "3000"),
});
```

### Bun Server

```typescript
export default {
  fetch: app.fetch,
  port: parseInt(process.env.PORT || "3000"),
};
```

### Cloudflare Workers

```typescript
export default app;
```

### Docker Configuration

```dockerfile
FROM node:22-alpine

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

## Health Checks

```typescript
registerApiRoute("/health", {
  method: "GET",
  handler: async (c) => {
    const mastra = c.get("mastra");

    // Check storage connection
    try {
      await mastra.storage?.getThreads({ limit: 1 });
    } catch (err) {
      return c.json({ status: "unhealthy", error: "Storage unavailable" }, 503);
    }

    return c.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version,
    });
  },
});

registerApiRoute("/ready", {
  method: "GET",
  handler: async (c) => {
    return c.json({ ready: true });
  },
});
```

## Streaming Responses

### Server-Sent Events (SSE)

```typescript
import { streamSSE } from "hono/streaming";

registerApiRoute("/stream-updates", {
  method: "GET",
  handler: async (c) => {
    return streamSSE(c, async (stream) => {
      for (let i = 0; i < 10; i++) {
        await stream.writeSSE({
          data: JSON.stringify({ count: i }),
          event: "update",
        });
        await new Promise((r) => setTimeout(r, 1000));
      }
    });
  },
});
```

### Streaming Agent Response

```typescript
registerApiRoute("/chat-stream", {
  method: "POST",
  handler: async (c) => {
    const mastra = c.get("mastra");
    const body = await c.req.json();

    const agent = mastra.getAgent("chat-agent");
    const stream = await agent.stream(body.message);

    return new Response(stream.textStream, {
      headers: { "Content-Type": "text/event-stream" },
    });
  },
});
```
