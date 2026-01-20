#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * kb-generate-index.ts - Knowledge Base Entity Index Generator
 *
 * Scans the knowledge base directory, extracts metadata from entity files,
 * and generates a searchable _entities.json index for entity resolution.
 *
 * Usage:
 *   deno run --allow-read --allow-write kb-generate-index.ts [knowledge-dir]
 *   deno run --allow-read --allow-write kb-generate-index.ts /path/to/knowledge
 *
 * Output:
 *   Creates/updates _entities.json in the knowledge directory root
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";
import { parse as parsePath } from "https://deno.land/std@0.208.0/path/mod.ts";

interface EntityRecord {
  name: string;
  path: string;
  domain: string;
  type: string;
  status: string;
  aliases: string[];
  lastUpdated: string;
}

interface EntityIndex {
  generated: string;
  entityCount: number;
  domains: Record<string, number>;
  entities: EntityRecord[];
}

/**
 * Parse entity metadata from markdown file content
 */
function parseEntityFile(content: string, filePath: string): EntityRecord | null {
  const lines = content.split("\n");

  // Extract name from H1
  const nameMatch = lines[0]?.match(/^#\s+(.+)$/);
  if (!nameMatch) return null;
  const name = nameMatch[1].trim();

  // Extract metadata fields
  let type = "";
  let status = "";
  let aliases: string[] = [];
  let lastUpdated = "";

  for (const line of lines.slice(1, 20)) { // Check first 20 lines for metadata
    const typeMatch = line.match(/^\*\*Type:\*\*\s*(.+)$/);
    if (typeMatch) type = typeMatch[1].trim();

    const statusMatch = line.match(/^\*\*Status:\*\*\s*(.+)$/);
    if (statusMatch) status = statusMatch[1].trim();

    const aliasMatch = line.match(/^\*\*Aliases:\*\*\s*(.+)$/);
    if (aliasMatch) {
      aliases = aliasMatch[1].split(",").map(a => a.trim()).filter(a => a);
    }

    const dateMatch = line.match(/^\*\*Last Updated:\*\*\s*(.+)$/);
    if (dateMatch) lastUpdated = dateMatch[1].trim();
  }

  // Extract domain and type from path
  // e.g., "nonfiction/frameworks/kind-vs-wicked.md" -> domain: "nonfiction", type: "frameworks"
  const pathParts = filePath.split("/");
  const knowledgeIdx = pathParts.findIndex(p => p === "knowledge");
  const domain = knowledgeIdx >= 0 && pathParts[knowledgeIdx + 1]
    ? pathParts[knowledgeIdx + 1]
    : "unknown";

  // Get relative path from knowledge directory
  const relativePath = knowledgeIdx >= 0
    ? pathParts.slice(knowledgeIdx + 1).join("/")
    : filePath;

  return {
    name,
    path: relativePath,
    domain,
    type: type || "unknown",
    status: status || "unknown",
    aliases,
    lastUpdated,
  };
}

/**
 * Scan knowledge directory and build entity index
 */
async function generateIndex(knowledgeDir: string): Promise<EntityIndex> {
  const entities: EntityRecord[] = [];
  const domains: Record<string, number> = {};

  // Walk the knowledge directory
  for await (const entry of walk(knowledgeDir, {
    exts: [".md"],
    skip: [/WORKFLOW\.md$/, /_entities\.json$/], // Skip workflow and JSON index
  })) {
    if (!entry.isFile) continue;

    // Skip files directly in knowledge root (only process domain subdirectories)
    const relativePath = entry.path.replace(knowledgeDir + "/", "");
    if (!relativePath.includes("/")) continue;

    // Skip helper files (those starting with underscore)
    // These include: _index.md, _quotes.md, _inventory.md, etc.
    const fileName = parsePath(entry.path).base;
    if (fileName.startsWith("_")) continue;

    try {
      const content = await Deno.readTextFile(entry.path);
      const entity = parseEntityFile(content, entry.path);

      if (entity) {
        entities.push(entity);
        domains[entity.domain] = (domains[entity.domain] || 0) + 1;
      }
    } catch (err) {
      console.error(`Error processing ${entry.path}:`, err);
    }
  }

  // Sort entities by name
  entities.sort((a, b) => a.name.localeCompare(b.name));

  return {
    generated: new Date().toISOString(),
    entityCount: entities.length,
    domains,
    entities,
  };
}

/**
 * Main function
 */
async function main() {
  const knowledgeDir = Deno.args[0] || "./knowledge";

  console.log(`Scanning knowledge base: ${knowledgeDir}`);

  const index = await generateIndex(knowledgeDir);

  console.log(`Found ${index.entityCount} entities across domains:`, index.domains);

  // Write index file
  const outputPath = `${knowledgeDir}/_entities.json`;
  await Deno.writeTextFile(outputPath, JSON.stringify(index, null, 2));

  console.log(`Index written to: ${outputPath}`);

  // Also output a summary
  console.log("\nEntities indexed:");
  for (const entity of index.entities) {
    const aliasCount = entity.aliases.length;
    const aliasNote = aliasCount > 0 ? ` (+${aliasCount} aliases)` : "";
    console.log(`  - ${entity.name} [${entity.type}]${aliasNote}`);
  }
}

main();
