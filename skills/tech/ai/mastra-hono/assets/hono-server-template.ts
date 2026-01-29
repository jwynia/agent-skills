/**
 * Mastra + Hono Server Template (v1 Beta)
 *
 * This template sets up a complete Hono server with Mastra integration.
 *
 * Features:
 * - MastraServer adapter for auto-registering agent/workflow endpoints
 * - Custom API routes
 * - Middleware configuration
 * - Health check endpoints
 *
 * Usage: Copy this file as your src/index.ts entry point.
 */

import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { MastraServer } from "@mastra/hono";
import { RuntimeContext } from "@mastra/core";

// Import your Mastra instance
import { mastra } from "./mastra/index.js";

// ============================================================================
// Create Hono App
// ============================================================================

const app = new Hono();

// ============================================================================
// Middleware (add BEFORE MastraServer.init())
// ============================================================================

// Request logging
app.use("*", logger());

// CORS configuration
app.use(
  "*",
  cors({
    origin: ["http://localhost:3000"], // Add your frontend origins
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// Optional: Authentication middleware
// app.use("/api/*", bearerAuth({ token: process.env.API_TOKEN! }));

// ============================================================================
// Initialize Mastra Server
// ============================================================================

const server = new MastraServer({
  app,
  mastra,
  // Optional: Custom route prefix (default: /api)
  // prefix: "/v1/ai",
});

await server.init();

// ============================================================================
// Custom Routes
// ============================================================================

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || "1.0.0",
  });
});

// Readiness check
app.get("/ready", (c) => {
  return c.json({ ready: true });
});

// Custom agent endpoint with context
app.post("/chat", async (c) => {
  const body = await c.req.json();
  const { message, userId, sessionId } = body;

  // Get Mastra from context
  const mastraInstance = c.get("mastra");

  // Create runtime context
  const runtimeContext = new RuntimeContext();
  runtimeContext.set("user-id", userId);
  runtimeContext.set("session-id", sessionId);

  // Get agent and generate response
  const agent = mastraInstance.getAgent("chat-agent");
  if (!agent) {
    return c.json({ error: "Agent not found" }, 404);
  }

  const response = await agent.generate(message, {
    runtimeContext,
    memory: {
      thread: sessionId,
      resource: userId,
    },
  });

  return c.json({
    response: response.text,
    traceId: response.traceId,
  });
});

// Custom workflow trigger
app.post("/process", async (c) => {
  const body = await c.req.json();
  const mastraInstance = c.get("mastra");

  const workflow = mastraInstance.getWorkflow("data-pipeline");
  if (!workflow) {
    return c.json({ error: "Workflow not found" }, 404);
  }

  const run = workflow.createRun();
  const result = await run.start({
    inputData: body,
  });

  return c.json({
    status: result.status,
    output: result.output,
    runId: run.id,
  });
});

// ============================================================================
// Error Handling
// ============================================================================

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

app.notFound((c) => {
  return c.json({ error: "Route not found" }, 404);
});

// ============================================================================
// Start Server
// ============================================================================

const port = parseInt(process.env.PORT || "3000");

serve({
  fetch: app.fetch,
  port,
});

console.log(`
🚀 Mastra + Hono Server running at http://localhost:${port}

Endpoints:
  GET  /health                          - Health check
  GET  /ready                           - Readiness check
  POST /chat                            - Custom chat endpoint
  POST /process                         - Custom workflow trigger
  POST /api/agents/{name}/generate      - Agent generate
  POST /api/agents/{name}/stream        - Agent stream
  POST /api/workflows/{id}/start        - Start workflow
`);

// ============================================================================
// Mastra Instance Template (src/mastra/index.ts)
// ============================================================================

/*
import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";

// Import agents
import { chatAgent } from "./agents/chat-agent.js";
import { assistantAgent } from "./agents/assistant-agent.js";

// Import workflows
import { dataPipeline } from "./workflows/data-pipeline.js";

export const mastra = new Mastra({
  agents: {
    "chat-agent": chatAgent,
    "assistant-agent": assistantAgent,
  },
  workflows: {
    "data-pipeline": dataPipeline,
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  server: {
    port: 3000,
    timeout: 30000,
  },
  observability: {
    default: { enabled: true },
  },
});
*/
