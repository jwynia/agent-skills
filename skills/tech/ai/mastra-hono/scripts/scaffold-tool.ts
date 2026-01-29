#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * Scaffold Mastra Tool
 *
 * Generates a new Mastra tool with v1 Beta patterns.
 *
 * Usage:
 *   deno run --allow-read --allow-write scripts/scaffold-tool.ts --name fetch-weather
 *   deno run --allow-read --allow-write scripts/scaffold-tool.ts --name search-docs --output ./src/mastra/tools/
 *
 * Options:
 *   --name         Tool name (kebab-case)
 *   --output       Output directory (default: ./src/mastra/tools/)
 *   --description  Tool description
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

async function main() {
  const args = parse(Deno.args, {
    string: ["name", "output", "description"],
    boolean: ["help"],
    default: {
      output: "./src/mastra/tools",
      description: "Description of what this tool does",
    },
  });

  if (args.help || !args.name) {
    console.log(`
Scaffold Mastra Tool (v1 Beta)

Usage:
  deno run --allow-read --allow-write scripts/scaffold-tool.ts --name <tool-name> [options]

Options:
  --name          Tool name in kebab-case (required)
  --output        Output directory (default: ./src/mastra/tools/)
  --description   Tool description
  --help          Show this help

Examples:
  deno run --allow-read --allow-write scripts/scaffold-tool.ts --name fetch-weather
  deno run --allow-read --allow-write scripts/scaffold-tool.ts --name search-docs --description "Search documentation"
`);
    Deno.exit(args.help ? 0 : 1);
  }

  const toolName = args.name as string;
  const outputDir = args.output as string;
  const description = args.description as string;

  const camelName = toCamelCase(toolName);
  const pascalName = toPascalCase(toolName);

  const toolContent = `/**
 * ${pascalName} Tool
 *
 * ${description}
 */

import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const ${camelName}Tool = createTool({
  id: "${toolName}",

  description: "${description}. Use when the user asks to [describe trigger scenarios]. " +
    "Input: [describe expected input].",

  inputSchema: z.object({
    // Define your input fields here
    query: z.string().describe("The main input for this tool"),
    options: z.object({
      limit: z.number().optional().default(10).describe("Maximum results"),
    }).optional(),
  }),

  outputSchema: z.object({
    // Define your output fields here
    result: z.string(),
    success: z.boolean(),
    metadata: z.object({
      processingTime: z.number(),
    }).optional(),
  }),

  /**
   * Execute function - v1 Beta signature
   *
   * @param inputData - First parameter contains parsed input matching inputSchema
   * @param context - Second parameter contains mastra, runtimeContext, abortSignal
   */
  execute: async (inputData, context) => {
    // Destructure input
    const { query, options } = inputData;

    // Destructure context
    const {
      mastra,         // Access to Mastra instance
      runtimeContext, // Request-specific values
      abortSignal,    // Abort controller signal
    } = context;

    // Always check abort signal at start
    if (abortSignal?.aborted) {
      throw new Error("Operation aborted");
    }

    const startTime = Date.now();

    try {
      // Your tool logic here
      // Example: const userId = runtimeContext.get("user-id");
      // Example: const agent = mastra?.getAgent("helper-agent");

      // Placeholder implementation
      const result = \`Processed: \${query}\`;

      return {
        result,
        success: true,
        metadata: {
          processingTime: Date.now() - startTime,
        },
      };
    } catch (error: any) {
      // Check abort signal on error
      if (abortSignal?.aborted) {
        throw new Error("Operation aborted");
      }

      return {
        result: error.message,
        success: false,
        metadata: {
          processingTime: Date.now() - startTime,
        },
      };
    }
  },
});
`;

  // Ensure output directory exists
  await ensureDir(outputDir);

  // Write tool file
  const filePath = join(outputDir, `${toolName}.ts`);
  await Deno.writeTextFile(filePath, toolContent);

  console.log(`✅ Created tool: ${filePath}`);
  console.log(`
Next steps:
1. Update the inputSchema and outputSchema for your use case
2. Implement the execute logic
3. Add to an agent: tools: { ${camelName}Tool }
4. Or register in Mastra: tools: { ${camelName}Tool }
`);
}

main();
