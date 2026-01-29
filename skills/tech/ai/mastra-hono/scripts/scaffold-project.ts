#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Scaffold Mastra + Hono Project
 *
 * Generates a complete Mastra + Hono project with v1 Beta patterns.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold-project.ts --name my-project
 *   deno run --allow-read --allow-write scripts/scaffold-project.ts --name my-project --with-tests
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

async function main() {
  const args = parse(Deno.args, {
    string: ["name", "output"],
    boolean: ["help", "with-tests"],
    default: {
      output: ".",
    },
  });

  if (args.help || !args.name) {
    console.log(`
Scaffold Mastra + Hono Project (v1 Beta)

Usage:
  deno run --allow-read --allow-write scripts/scaffold-project.ts --name <project-name> [options]

Options:
  --name          Project name (required)
  --output        Output directory (default: current directory)
  --with-tests    Include Vitest test setup
  --help          Show this help

Examples:
  deno run --allow-read --allow-write scripts/scaffold-project.ts --name my-ai-api
  deno run --allow-read --allow-write scripts/scaffold-project.ts --name my-project --with-tests
`);
    Deno.exit(args.help ? 0 : 1);
  }

  const projectName = args.name as string;
  const outputDir = join(args.output as string, projectName);
  const withTests = args["with-tests"] as boolean;

  console.log(`\n🚀 Creating Mastra + Hono project: ${projectName}\n`);

  // Create directory structure
  const directories = [
    "src/mastra/agents",
    "src/mastra/tools",
    "src/mastra/workflows",
  ];

  if (withTests) {
    directories.push("test");
  }

  for (const dir of directories) {
    await ensureDir(join(outputDir, dir));
    console.log(`  📁 Created ${dir}/`);
  }

  // Create package.json
  const packageJson = {
    name: projectName,
    version: "1.0.0",
    type: "module",
    scripts: {
      dev: "tsx --watch src/index.ts",
      build: "tsc",
      start: "node dist/index.js",
      ...(withTests
        ? {
            test: "vitest",
            "test:watch": "vitest --watch",
            "test:coverage": "vitest --coverage",
          }
        : {}),
    },
    dependencies: {
      "@mastra/core": "beta",
      "@mastra/hono": "beta",
      "@mastra/libsql": "beta",
      "@ai-sdk/openai": "latest",
      "@hono/node-server": "latest",
      hono: "latest",
      zod: "latest",
    },
    devDependencies: {
      "@types/node": "latest",
      tsx: "latest",
      typescript: "latest",
      ...(withTests
        ? {
            vitest: "latest",
            "@vitest/coverage-v8": "latest",
          }
        : {}),
    },
    engines: {
      node: ">=22.13.0",
    },
  };

  await Deno.writeTextFile(
    join(outputDir, "package.json"),
    JSON.stringify(packageJson, null, 2)
  );
  console.log("  📄 Created package.json");

  // Create tsconfig.json
  const tsconfig = {
    compilerOptions: {
      target: "ES2022",
      module: "NodeNext",
      moduleResolution: "NodeNext",
      esModuleInterop: true,
      strict: true,
      skipLibCheck: true,
      outDir: "./dist",
      rootDir: "./src",
      declaration: true,
    },
    include: ["src/**/*"],
    exclude: ["node_modules", "dist", "test"],
  };

  await Deno.writeTextFile(
    join(outputDir, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2)
  );
  console.log("  📄 Created tsconfig.json");

  // Create .env.example
  const envExample = `# Mastra + Hono Configuration

# LLM Provider API Keys (at least one required)
OPENAI_API_KEY=your-openai-api-key
# ANTHROPIC_API_KEY=your-anthropic-api-key
# GOOGLE_AI_API_KEY=your-google-api-key

# Server Configuration
PORT=3000

# Database (optional, for conversation memory)
DATABASE_URL=file:./mastra.db
`;

  await Deno.writeTextFile(join(outputDir, ".env.example"), envExample);
  console.log("  📄 Created .env.example");

  // Create .gitignore
  const gitignore = `# Dependencies
node_modules/

# Build output
dist/
.mastra/

# Environment
.env
.env.local

# Database
*.db
*.db-journal

# IDE
.vscode/
.idea/

# Testing
coverage/

# OS
.DS_Store
`;

  await Deno.writeTextFile(join(outputDir, ".gitignore"), gitignore);
  console.log("  📄 Created .gitignore");

  // Create src/index.ts (Hono server)
  const serverCode = `import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { MastraServer } from "@mastra/hono";
import { mastra } from "./mastra/index.js";

const app = new Hono();

// Middleware
app.use("*", logger());
app.use("*", cors());

// Initialize Mastra
const server = new MastraServer({ app, mastra });
await server.init();

// Custom routes
app.get("/", (c) => c.text("${projectName} API"));

app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const port = parseInt(process.env.PORT || "3000");
serve({ fetch: app.fetch, port });

console.log(\`
🚀 ${projectName} running at http://localhost:\${port}

Endpoints:
  GET  /                          - API info
  GET  /health                    - Health check
  POST /api/agents/example/generate  - Chat with agent
\`);
`;

  await Deno.writeTextFile(join(outputDir, "src/index.ts"), serverCode);
  console.log("  📄 Created src/index.ts");

  // Create src/mastra/index.ts
  const mastraIndex = `import { Mastra } from "@mastra/core/mastra";
import { LibSQLStore } from "@mastra/libsql";
import { exampleAgent } from "./agents/example-agent.js";

export const mastra = new Mastra({
  agents: {
    example: exampleAgent,
  },
  storage: new LibSQLStore({
    url: process.env.DATABASE_URL || "file:./mastra.db",
  }),
  server: {
    port: parseInt(process.env.PORT || "3000"),
    timeout: 30000,
  },
  observability: {
    default: { enabled: true },
  },
});
`;

  await Deno.writeTextFile(join(outputDir, "src/mastra/index.ts"), mastraIndex);
  console.log("  📄 Created src/mastra/index.ts");

  // Create example agent
  const exampleAgent = `import { Agent } from "@mastra/core/agent";
import { openai } from "@ai-sdk/openai";
import { exampleTool } from "../tools/example-tool.js";

export const exampleAgent = new Agent({
  name: "example",
  instructions: \`You are a helpful assistant for ${projectName}.

Your capabilities:
- Answer questions
- Help with tasks
- Use available tools

Be concise and helpful.\`,
  model: openai("gpt-4o-mini"),
  tools: { exampleTool },
});
`;

  await Deno.writeTextFile(
    join(outputDir, "src/mastra/agents/example-agent.ts"),
    exampleAgent
  );
  console.log("  📄 Created src/mastra/agents/example-agent.ts");

  // Create example tool
  const exampleTool = `import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const exampleTool = createTool({
  id: "example-tool",
  description: "An example tool that echoes input. Use when testing the API.",
  inputSchema: z.object({
    message: z.string().describe("Message to echo"),
  }),
  outputSchema: z.object({
    echo: z.string(),
    timestamp: z.string(),
  }),
  execute: async (inputData, context) => {
    const { message } = inputData;
    const { abortSignal } = context;

    if (abortSignal?.aborted) {
      throw new Error("Aborted");
    }

    return {
      echo: message,
      timestamp: new Date().toISOString(),
    };
  },
});
`;

  await Deno.writeTextFile(
    join(outputDir, "src/mastra/tools/example-tool.ts"),
    exampleTool
  );
  console.log("  📄 Created src/mastra/tools/example-tool.ts");

  // Create test setup if requested
  if (withTests) {
    const vitestConfig = `import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
    },
  },
});
`;

    await Deno.writeTextFile(join(outputDir, "vitest.config.ts"), vitestConfig);
    console.log("  📄 Created vitest.config.ts");

    const testSetup = `import { beforeAll, afterEach, vi } from "vitest";

beforeAll(() => {
  process.env.OPENAI_API_KEY = "test-key";
  process.env.DATABASE_URL = "file:./test.db";
});

afterEach(() => {
  vi.restoreAllMocks();
});
`;

    await Deno.writeTextFile(join(outputDir, "test/setup.ts"), testSetup);
    console.log("  📄 Created test/setup.ts");
  }

  console.log(`
✅ Project created successfully!

Next steps:
  cd ${projectName}
  npm install
  cp .env.example .env
  # Add your OPENAI_API_KEY to .env
  npm run dev

Test your API:
  curl http://localhost:3000/health
  curl -X POST http://localhost:3000/api/agents/example/generate \\
    -H "Content-Type: application/json" \\
    -d '{"messages":[{"role":"user","content":"Hello!"}]}'
`);
}

main();
