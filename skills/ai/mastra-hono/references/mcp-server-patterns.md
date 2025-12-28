# MCP Server Patterns

Guide to creating and using Model Context Protocol (MCP) servers with Mastra.

## Overview

MCP (Model Context Protocol) is a standardized way to expose tools, agents, and resources to AI systems. Mastra supports both authoring MCP servers and consuming external MCP servers.

## Creating an MCP Server

### Basic MCP Server

```typescript
// src/mcp/index.ts
import { createMCPServer } from "@mastra/core/mcp";
import { mastra } from "../mastra/index.js";

const mcpServer = createMCPServer({
  name: "my-mcp-server",
  version: "1.0.0",
  mastra,
});

// Start the server
mcpServer.listen({ port: 8080 });
```

### Exposing Tools via MCP

```typescript
import { createMCPServer } from "@mastra/core/mcp";
import { weatherTool, searchTool, calculatorTool } from "../mastra/tools";

const mcpServer = createMCPServer({
  name: "tools-server",
  version: "1.0.0",
  tools: {
    weatherTool,
    searchTool,
    calculatorTool,
  },
});

// Tools are now accessible via MCP protocol
```

### Exposing Agents via MCP

```typescript
import { createMCPServer } from "@mastra/core/mcp";
import { weatherAgent, assistantAgent } from "../mastra/agents";

const mcpServer = createMCPServer({
  name: "agents-server",
  version: "1.0.0",
  agents: {
    weatherAgent,
    assistantAgent,
  },
});

// Agents accessible as MCP resources
```

### Combined Server

```typescript
const mcpServer = createMCPServer({
  name: "full-server",
  version: "1.0.0",
  mastra, // Exposes all registered agents, tools, workflows

  // Or explicitly specify what to expose
  tools: { weatherTool },
  agents: { weatherAgent },
  resources: {
    "config://settings": {
      type: "text",
      content: JSON.stringify(config),
    },
  },
});
```

## MCP Server Configuration

### Transport Options

```typescript
// stdio transport (for CLI tools)
mcpServer.listen({ transport: "stdio" });

// HTTP transport
mcpServer.listen({
  transport: "http",
  port: 8080,
});

// WebSocket transport
mcpServer.listen({
  transport: "websocket",
  port: 8081,
});
```

### Server Metadata

```typescript
const mcpServer = createMCPServer({
  name: "my-server",
  version: "1.0.0",
  description: "Provides weather and search capabilities",
  vendor: "MyCompany",
  capabilities: {
    tools: true,
    resources: true,
    prompts: true,
  },
});
```

## Defining MCP Resources

### Static Resources

```typescript
const mcpServer = createMCPServer({
  name: "resource-server",
  resources: {
    "config://app-settings": {
      type: "text",
      mimeType: "application/json",
      content: JSON.stringify({
        theme: "dark",
        language: "en",
      }),
    },
    "file://readme": {
      type: "text",
      mimeType: "text/markdown",
      content: "# My Application\n\nWelcome to the docs.",
    },
  },
});
```

### Dynamic Resources

```typescript
const mcpServer = createMCPServer({
  name: "dynamic-server",
  resources: {
    "data://users": {
      type: "dynamic",
      handler: async (uri) => {
        const users = await database.getUsers();
        return {
          type: "text",
          mimeType: "application/json",
          content: JSON.stringify(users),
        };
      },
    },
  },
});
```

### Resource Templates

```typescript
const mcpServer = createMCPServer({
  name: "template-server",
  resourceTemplates: {
    "user://": {
      description: "User profiles by ID",
      handler: async (uri) => {
        const userId = uri.replace("user://", "");
        const user = await database.getUser(userId);
        return {
          type: "text",
          mimeType: "application/json",
          content: JSON.stringify(user),
        };
      },
    },
  },
});
```

## MCP Prompts

### Defining Prompts

```typescript
const mcpServer = createMCPServer({
  name: "prompt-server",
  prompts: {
    "summarize": {
      description: "Summarizes text content",
      arguments: [
        { name: "text", description: "Text to summarize", required: true },
        { name: "length", description: "Target length", required: false },
      ],
      handler: async ({ text, length }) => {
        return {
          messages: [
            {
              role: "user",
              content: `Summarize the following text${length ? ` in ${length} words` : ""}:\n\n${text}`,
            },
          ],
        };
      },
    },
    "translate": {
      description: "Translates text to another language",
      arguments: [
        { name: "text", required: true },
        { name: "targetLanguage", required: true },
      ],
      handler: async ({ text, targetLanguage }) => {
        return {
          messages: [
            {
              role: "user",
              content: `Translate to ${targetLanguage}: ${text}`,
            },
          ],
        };
      },
    },
  },
});
```

## Consuming MCP Servers

### Using MCP Tools in Agents

```typescript
import { Agent } from "@mastra/core/agent";
import { mcpTools } from "@mastra/core/mcp";

// Load tools from external MCP server
const externalTools = await mcpTools({
  server: "http://localhost:8080",
  // Or stdio:
  // command: "python",
  // args: ["mcp_server.py"],
});

const agent = new Agent({
  name: "mcp-agent",
  instructions: "You can use external MCP tools.",
  model: openai("gpt-4o-mini"),
  tools: {
    ...externalTools,  // Spread MCP tools
    ...localTools,     // Add local tools
  },
});
```

### MCP Client Configuration

```typescript
import { MCPClient } from "@mastra/core/mcp";

const client = new MCPClient({
  server: "http://localhost:8080",
  timeout: 30000,
  retries: 3,
});

// List available tools
const tools = await client.listTools();

// Call a tool
const result = await client.callTool("weather-tool", {
  location: "Seattle",
});

// Get a resource
const config = await client.getResource("config://settings");

// Run a prompt
const prompt = await client.getPrompt("summarize", {
  text: "Long text here...",
});
```

### Stdio MCP Servers

```typescript
// Connect to a Python MCP server
const tools = await mcpTools({
  command: "python",
  args: ["./mcp_server.py"],
  env: {
    API_KEY: process.env.API_KEY,
  },
});

// Connect to an npm package MCP server
const tools = await mcpTools({
  command: "npx",
  args: ["-y", "@company/mcp-server"],
});
```

## Integration with Mastra

### MCP + Hono Server

```typescript
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { MastraServer } from "@mastra/hono";
import { createMCPServer } from "@mastra/core/mcp";
import { mastra } from "./mastra/index.js";

const app = new Hono();

// HTTP API
const server = new MastraServer({ app, mastra });
await server.init();

// MCP Server on different port
const mcpServer = createMCPServer({
  name: "dual-protocol-server",
  mastra,
});
mcpServer.listen({ port: 8081 });

// Main HTTP server
serve({ fetch: app.fetch, port: 3000 });

console.log("HTTP API: http://localhost:3000");
console.log("MCP Server: http://localhost:8081");
```

### MCP Tools in Workflows

```typescript
import { createStep } from "@mastra/core/workflows";
import { mcpTools } from "@mastra/core/mcp";

// Load MCP tools once
const externalTools = await mcpTools({
  server: "http://mcp-server:8080",
});

const analyzeStep = createStep({
  id: "analyze",
  execute: async ({ inputData, mastra }) => {
    // Use MCP tool directly
    const analysisResult = await externalTools["analyze-data"].execute(
      { data: inputData.rawData },
      { mastra, runtimeContext: new RuntimeContext() }
    );

    return { analysis: analysisResult };
  },
});
```

## Error Handling

### Server-Side Errors

```typescript
const mcpServer = createMCPServer({
  name: "error-handling-server",
  tools: {
    riskyTool: createTool({
      id: "risky-tool",
      execute: async (input) => {
        try {
          const result = await riskyOperation(input);
          return { success: true, data: result };
        } catch (error) {
          // MCP-compliant error response
          throw new MCPError({
            code: -32000,
            message: error.message,
            data: { input },
          });
        }
      },
    }),
  },
});
```

### Client-Side Error Handling

```typescript
try {
  const result = await client.callTool("risky-tool", { value: 42 });
} catch (error) {
  if (error instanceof MCPError) {
    console.error("MCP Error:", error.code, error.message);
    // Handle specific error codes
    if (error.code === -32601) {
      console.error("Tool not found");
    }
  } else {
    console.error("Connection error:", error);
  }
}
```

## Security Considerations

### Authentication

```typescript
const mcpServer = createMCPServer({
  name: "secure-server",
  mastra,
  middleware: [
    async (req, next) => {
      const token = req.headers.get("authorization");
      if (!token || !verifyToken(token)) {
        throw new Error("Unauthorized");
      }
      return next();
    },
  ],
});
```

### Tool Permissions

```typescript
const mcpServer = createMCPServer({
  name: "permission-server",
  tools: {
    publicTool: { ...weatherTool, permissions: ["public"] },
    adminTool: { ...dangerousTool, permissions: ["admin"] },
  },
  authorize: async (toolId, context) => {
    const userRole = context.headers.get("x-user-role");
    const tool = tools[toolId];

    if (tool.permissions.includes("admin") && userRole !== "admin") {
      return false;
    }
    return true;
  },
});
```

## Testing MCP Servers

```typescript
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { MCPClient } from "@mastra/core/mcp";

describe("MCP Server", () => {
  let server: MCPServer;
  let client: MCPClient;

  beforeAll(async () => {
    server = createMCPServer({ name: "test", tools: { testTool } });
    await server.listen({ port: 9999 });

    client = new MCPClient({ server: "http://localhost:9999" });
  });

  afterAll(async () => {
    await server.close();
  });

  it("should list tools", async () => {
    const tools = await client.listTools();
    expect(tools).toContainEqual(
      expect.objectContaining({ name: "test-tool" })
    );
  });

  it("should call tool", async () => {
    const result = await client.callTool("test-tool", { input: "value" });
    expect(result.success).toBe(true);
  });
});
```

## Best Practices

1. **Version your MCP servers** - Use semantic versioning for compatibility
2. **Document all tools** - Clear descriptions help AI clients understand usage
3. **Validate inputs** - Use Zod schemas for all tool inputs
4. **Handle errors gracefully** - Return MCP-compliant error responses
5. **Use authentication** - Protect sensitive tools and resources
6. **Monitor usage** - Log tool calls for debugging and analytics
7. **Test thoroughly** - Unit test tools, integration test the server
