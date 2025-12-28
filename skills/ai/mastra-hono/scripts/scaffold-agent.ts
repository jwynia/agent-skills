#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Scaffold Mastra Agent
 *
 * Generates a new Mastra agent with v1 Beta patterns.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold-agent.ts --name weather
 *   deno run --allow-read --allow-write scripts/scaffold-agent.ts --name assistant --model anthropic
 */

import { parse } from "https://deno.land/std@0.208.0/flags/mod.ts";
import { ensureDir } from "https://deno.land/std@0.208.0/fs/mod.ts";
import { join } from "https://deno.land/std@0.208.0/path/mod.ts";

function toCamelCase(str: string): string {
  return str.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function toPascalCase(str: string): string {
  const camel = toCamelCase(str);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

const MODEL_CONFIGS: Record<string, { import: string; model: string }> = {
  openai: {
    import: 'import { openai } from "@ai-sdk/openai";',
    model: 'openai("gpt-4o-mini")',
  },
  anthropic: {
    import: 'import { anthropic } from "@ai-sdk/anthropic";',
    model: 'anthropic("claude-3-5-sonnet-20241022")',
  },
  google: {
    import: 'import { google } from "@ai-sdk/google";',
    model: 'google("gemini-1.5-pro")',
  },
  groq: {
    import: 'import { groq } from "@ai-sdk/groq";',
    model: 'groq("llama-3.1-70b-versatile")',
  },
  router: {
    import: "// Using model router string",
    model: '"openai/gpt-4o-mini"',
  },
};

async function main() {
  const args = parse(Deno.args, {
    string: ["name", "output", "model", "instructions"],
    boolean: ["help", "with-tools"],
    default: {
      output: "./src/mastra/agents",
      model: "openai",
      instructions: "You are a helpful assistant.",
    },
  });

  if (args.help || !args.name) {
    console.log(`
Scaffold Mastra Agent (v1 Beta)

Usage:
  deno run --allow-read --allow-write scripts/scaffold-agent.ts --name <agent-name> [options]

Options:
  --name          Agent name in kebab-case (required)
  --output        Output directory (default: ./src/mastra/agents/)
  --model         Model provider: openai, anthropic, google, groq, router (default: openai)
  --instructions  System prompt for the agent
  --with-tools    Include example tool imports
  --help          Show this help

Examples:
  deno run --allow-read --allow-write scripts/scaffold-agent.ts --name weather
  deno run --allow-read --allow-write scripts/scaffold-agent.ts --name assistant --model anthropic
  deno run --allow-read --allow-write scripts/scaffold-agent.ts --name helper --with-tools
`);
    Deno.exit(args.help ? 0 : 1);
  }

  const agentName = args.name as string;
  const outputDir = args.output as string;
  const modelProvider = args.model as string;
  const instructions = args.instructions as string;
  const withTools = args["with-tools"] as boolean;

  const camelName = toCamelCase(agentName);
  const modelConfig = MODEL_CONFIGS[modelProvider] || MODEL_CONFIGS.openai;

  const toolImport = withTools
    ? `
// Import your tools
// import { exampleTool } from "../tools/example-tool.js";
`
    : "";

  const toolsObject = withTools
    ? `tools: {
    // Add your tools here
    // exampleTool,
  },`
    : "// tools: { },";

  const agentContent = `/**
 * ${toPascalCase(agentName)} Agent
 *
 * A Mastra agent using v1 Beta patterns.
 */

import { Agent } from "@mastra/core/agent";
${modelConfig.import}
${toolImport}
export const ${camelName}Agent = new Agent({
  // Required: Unique identifier
  name: "${agentName}-agent",

  // Required: System prompt
  instructions: \`${instructions}

Your capabilities:
- [Describe what this agent can do]
- [Another capability]

Guidelines:
- [Behavior guidelines]
- [Response format preferences]

When you don't know something, admit it clearly.\`,

  // Required: LLM model
  // Options:
  //   - SDK: openai("gpt-4o-mini"), anthropic("claude-3-5-sonnet-20241022")
  //   - Router string: "openai/gpt-4o-mini", "anthropic/claude-3-5-sonnet"
  //   - Fallback array: [{ model: "openai/gpt-4o", maxRetries: 3 }, ...]
  model: ${modelConfig.model},

  // Optional: Tools (MUST be object, not array)
  ${toolsObject}
});

/*
// Usage example:

import { Mastra } from "@mastra/core/mastra";

export const mastra = new Mastra({
  agents: { "${agentName}-agent": ${camelName}Agent },
});

// Generate response
const response = await ${camelName}Agent.generate("Hello!", {
  memory: {
    thread: "conversation-123",
    resource: "user-456",
  },
});

console.log(response.text);

// Stream response
const stream = await ${camelName}Agent.stream("Tell me more");
for await (const chunk of stream.textStream) {
  process.stdout.write(chunk);
}
*/
`;

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Write agent file
  const filePath = join(outputDir, `${agentName}-agent.ts`);
  await Deno.writeTextFile(filePath, agentContent);

  console.log(`✅ Created agent: ${filePath}`);
  console.log(`
Next steps:
1. Update the instructions for your use case
2. Add tools if needed: tools: { myTool }
3. Register in Mastra: agents: { "${agentName}-agent": ${camelName}Agent }
4. Use with memory: agent.generate(msg, { memory: { thread, resource } })
`);
}

main();
