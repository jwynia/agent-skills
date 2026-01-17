#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * build-index.ts - Rebuild index files from entries
 *
 * Scans all entries in a category and regenerates the _index.md file.
 *
 * Usage:
 *   deno run --allow-read --allow-write build-index.ts ./world-bible
 *   deno run --allow-read --allow-write build-index.ts ./world-bible --category characters
 */

import { walk } from "https://deno.land/std@0.208.0/fs/walk.ts";

interface EntryInfo {
  name: string;
  file: string;
  status: string;
  summary: string;
}

const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  characters: 'People and beings that inhabit this world.',
  locations: 'Places in the world, from continents to individual buildings.',
  factions: 'Organizations, governments, groups, and alliances.',
  rules: 'How the world works - magic systems, technology, physics.',
  culture: 'Beliefs, customs, languages, and traditions.',
  artifacts: 'Significant objects, weapons, and items of power.',
  species: 'Non-human beings, creatures, and races.',
};

function getStatusSymbol(status: string): string {
  const lower = status.toLowerCase();
  if (lower.includes('established')) return '✓';
  if (lower.includes('proposed')) return '?';
  if (lower.includes('deprecated')) return '✗';
  if (lower.includes('contradicted')) return '⚠';
  if (lower.includes('speculative')) return '~';
  return '?';
}

function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

async function parseEntry(path: string): Promise<EntryInfo | null> {
  try {
    const content = await Deno.readTextFile(path);

    // Extract name from first heading
    const nameMatch = content.match(/^#\s+(.+)$/m);
    if (!nameMatch) return null;

    const name = nameMatch[1].trim();

    // Extract status
    const statusMatch = content.match(/\*\*Canon Status:\*\*\s*(\w+)/);
    const status = statusMatch ? statusMatch[1] : 'Proposed';

    // Extract summary (first line after ## Summary)
    const summaryMatch = content.match(/## Summary\s*\n+([^\n#]+)/);
    let summary = summaryMatch ? summaryMatch[1].trim() : '';

    // Clean up placeholder text
    if (summary.startsWith('[') || summary === '') {
      summary = '[Add summary]';
    }

    // Truncate long summaries
    if (summary.length > 60) {
      summary = summary.slice(0, 57) + '...';
    }

    return {
      name,
      file: path,
      status,
      summary,
    };
  } catch {
    return null;
  }
}

async function buildCategoryIndex(biblePath: string, category: string): Promise<number> {
  const categoryPath = `${biblePath}/${category}`;
  const indexPath = `${categoryPath}/_index.md`;

  // Check if category directory exists
  try {
    await Deno.stat(categoryPath);
  } catch {
    return 0;
  }

  // Collect all entries
  const entries: EntryInfo[] = [];

  for await (const file of walk(categoryPath, {
    maxDepth: 1,
    exts: ['.md'],
  })) {
    if (file.isFile && !file.name.startsWith('_') && file.name !== 'overview.md') {
      const entry = await parseEntry(file.path);
      if (entry) {
        entries.push(entry);
      }
    }
  }

  // Sort alphabetically
  entries.sort((a, b) => a.name.localeCompare(b.name));

  // Generate index content
  const description = CATEGORY_DESCRIPTIONS[category] || `Entries in the ${category} category.`;
  const singular = category.endsWith('s') ? category.slice(0, -1) : category;

  let content = `# ${category.charAt(0).toUpperCase() + category.slice(1)}

${description}

## Entries

| Name | Status | Summary |
|------|--------|---------|
`;

  if (entries.length === 0) {
    content += `| *No entries yet* | | |\n`;
  } else {
    for (const entry of entries) {
      const symbol = getStatusSymbol(entry.status);
      content += `| [[${entry.name}]] | ${symbol} | ${entry.summary} |\n`;
    }
  }

  content += `
## Adding New ${category.charAt(0).toUpperCase() + category.slice(1)}

1. Create file in this directory: \`${singular}-name.md\`
2. Use the entry template
3. Set category to "${category.charAt(0).toUpperCase() + category.slice(1)}"
4. Add relationships to existing entries
5. Update this index
6. Note in [changelog](../meta/changelog.md)

---

*Last updated: ${getDate()}*
*Entries: ${entries.length}*
`;

  await Deno.writeTextFile(indexPath, content);
  return entries.length;
}

async function buildAllIndexes(biblePath: string): Promise<void> {
  const categories = Object.keys(CATEGORY_DESCRIPTIONS);
  let totalEntries = 0;

  console.log(`Building indexes for ${biblePath}...\n`);

  for (const category of categories) {
    const count = await buildCategoryIndex(biblePath, category);
    console.log(`  ${category}/_index.md: ${count} entries`);
    totalEntries += count;
  }

  console.log(`\nTotal entries indexed: ${totalEntries}`);
}

function showUsage() {
  console.log(`
Build World Bible Indexes
=========================

Regenerates _index.md files from entries.

Usage:
  deno run --allow-read --allow-write build-index.ts <world-bible-path>
  deno run --allow-read --allow-write build-index.ts <world-bible-path> --category <name>

Options:
  --category, -c    Only rebuild specific category index

Categories:
  characters, locations, factions, rules, culture, artifacts, species

Example:
  deno run --allow-read --allow-write build-index.ts ./world-bible
  deno run --allow-read --allow-write build-index.ts ./world-bible -c characters
`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    Deno.exit(0);
  }

  const biblePath = args[0];

  // Check if path exists
  try {
    await Deno.stat(biblePath);
  } catch {
    console.error(`Error: Path not found: ${biblePath}`);
    Deno.exit(1);
  }

  // Check for specific category
  const categoryIndex = args.indexOf('--category');
  const categoryIndexShort = args.indexOf('-c');
  const catIdx = categoryIndex > -1 ? categoryIndex : categoryIndexShort;

  if (catIdx > -1 && args[catIdx + 1]) {
    const category = args[catIdx + 1];
    console.log(`Building index for ${category}...`);
    const count = await buildCategoryIndex(biblePath, category);
    console.log(`${category}/_index.md: ${count} entries`);
  } else {
    await buildAllIndexes(biblePath);
  }
}

main();
