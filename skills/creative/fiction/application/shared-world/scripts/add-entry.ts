#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * add-entry.ts - Add a new entry to the world bible
 *
 * Creates a new entry from template with proper metadata.
 *
 * Usage:
 *   deno run --allow-read --allow-write add-entry.ts \
 *     --bible ./world-bible \
 *     --category character \
 *     --name "Character Name" \
 *     --status proposed \
 *     --contributor "Your Name"
 */

const CATEGORIES = [
  'character', 'characters',
  'location', 'locations',
  'faction', 'factions',
  'event', 'events',
  'rule', 'rules',
  'culture', 'cultures',
  'artifact', 'artifacts',
  'species',
];

const STATUSES = ['established', 'proposed', 'deprecated', 'contradicted', 'speculative'];

interface EntryOptions {
  bible: string;
  category: string;
  name: string;
  status: string;
  contributor: string;
}

function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeCategory(category: string): string {
  const singular = category.endsWith('s') ? category.slice(0, -1) : category;
  const plural = singular + 's';

  // Special case for species
  if (singular === 'specie') return 'species';

  return plural;
}

function getStatusSymbol(status: string): string {
  switch (status.toLowerCase()) {
    case 'established': return '✓';
    case 'proposed': return '?';
    case 'deprecated': return '✗';
    case 'contradicted': return '⚠';
    case 'speculative': return '~';
    default: return '?';
  }
}

function generateEntry(options: EntryOptions): string {
  const date = getDate();
  const statusCapitalized = options.status.charAt(0).toUpperCase() + options.status.slice(1);
  const categoryCapitalized = options.category.charAt(0).toUpperCase() + options.category.slice(1);

  return `# ${options.name}

**Canon Status:** ${statusCapitalized}
**Category:** ${categoryCapitalized}
**Created:** ${date}
**Last Updated:** ${date}
**Contributors:** ${options.contributor}

## Summary

[1-2 sentence overview for quick reference]

## Description

[Detailed information about this entry]

## Relationships

- **Related To:** [[Related Entry]]
<!-- Add more relationships as appropriate:
- **Located In:** [[Location]]
- **Member Of:** [[Faction]]
- **Contains:** [[Sub-entry]]
- **Preceded By:** [[Earlier Entry]]
- **See Also:** [[Related Entry]]
-->

## Key Facts

- [Key fact 1]
- [Key fact 2]
- [Key fact 3]

## Notes for Writers

[Guidance for using this element in stories. What should writers know? What's flexible vs. fixed?]

## Sources

- [Source work/document] (what was established)

## History

- ${date}: Created by ${options.contributor}
`;
}

function generateChangelogEntry(options: EntryOptions): string {
  const date = getDate();
  return `- **Created**: New ${options.category} entry "${options.name}" (${options.contributor})`;
}

async function addEntry(options: EntryOptions) {
  const category = normalizeCategory(options.category);
  const slug = slugify(options.name);
  const entryPath = `${options.bible}/${category}/${slug}.md`;
  const changelogPath = `${options.bible}/meta/changelog.md`;
  const indexPath = `${options.bible}/${category}/_index.md`;

  // Check if entry already exists
  try {
    await Deno.stat(entryPath);
    console.error(`Error: Entry already exists at ${entryPath}`);
    Deno.exit(1);
  } catch {
    // File doesn't exist, which is what we want
  }

  // Create the entry
  const entryContent = generateEntry(options);
  await Deno.writeTextFile(entryPath, entryContent);
  console.log(`Created: ${entryPath}`);

  // Update changelog
  try {
    let changelog = await Deno.readTextFile(changelogPath);
    const date = getDate();
    const changelogEntry = generateChangelogEntry(options);

    // Find today's date section or create it
    if (changelog.includes(`## ${date}`)) {
      // Add under existing date
      changelog = changelog.replace(
        `## ${date}\n`,
        `## ${date}\n\n${changelogEntry}\n`
      );
    } else {
      // Add new date section after the header
      const headerEnd = changelog.indexOf('\n## ');
      if (headerEnd > -1) {
        changelog = changelog.slice(0, headerEnd) +
          `\n## ${date}\n\n${changelogEntry}\n` +
          changelog.slice(headerEnd);
      }
    }

    await Deno.writeTextFile(changelogPath, changelog);
    console.log(`Updated: ${changelogPath}`);
  } catch (e) {
    console.warn(`Warning: Could not update changelog: ${e}`);
  }

  // Update index
  try {
    let index = await Deno.readTextFile(indexPath);
    const statusSymbol = getStatusSymbol(options.status);
    const newRow = `| [[${options.name}]] | ${statusSymbol} | [Add summary] |`;

    // Replace "no entries" row or add to table
    if (index.includes('*No entries yet*')) {
      index = index.replace('| *No entries yet* | | |', newRow);
    } else {
      // Add before the last empty line of the table
      const tableEnd = index.lastIndexOf('\n\n## Adding');
      if (tableEnd > -1) {
        index = index.slice(0, tableEnd) + '\n' + newRow + index.slice(tableEnd);
      }
    }

    await Deno.writeTextFile(indexPath, index);
    console.log(`Updated: ${indexPath}`);
  } catch (e) {
    console.warn(`Warning: Could not update index: ${e}`);
  }

  console.log(`
Entry created successfully!

Next steps:
1. Edit ${entryPath} to fill in details
2. Add wiki-links to related entries
3. Update the summary in ${indexPath}
`);
}

function parseArgs(args: string[]): EntryOptions | null {
  const options: Partial<EntryOptions> = {
    bible: './world-bible',
    status: 'proposed',
    contributor: 'Unknown',
  };

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--bible':
      case '-b':
        options.bible = args[++i];
        break;
      case '--category':
      case '-c':
        options.category = args[++i];
        break;
      case '--name':
      case '-n':
        options.name = args[++i];
        break;
      case '--status':
      case '-s':
        options.status = args[++i];
        break;
      case '--contributor':
      case '--author':
      case '-a':
        options.contributor = args[++i];
        break;
    }
  }

  if (!options.category || !options.name) {
    return null;
  }

  if (!CATEGORIES.includes(options.category.toLowerCase())) {
    console.error(`Invalid category: ${options.category}`);
    console.error(`Valid categories: ${CATEGORIES.filter(c => !c.endsWith('s')).join(', ')}`);
    return null;
  }

  if (!STATUSES.includes(options.status!.toLowerCase())) {
    console.error(`Invalid status: ${options.status}`);
    console.error(`Valid statuses: ${STATUSES.join(', ')}`);
    return null;
  }

  return options as EntryOptions;
}

function showUsage() {
  console.log(`
Add Entry to World Bible
========================

Creates a new entry from template.

Usage:
  deno run --allow-read --allow-write add-entry.ts [options]

Options:
  --bible, -b       Path to world bible (default: ./world-bible)
  --category, -c    Entry category (required)
  --name, -n        Entry name (required)
  --status, -s      Canon status (default: proposed)
  --contributor, -a Contributor name (default: Unknown)

Categories:
  character, location, faction, event, rule, culture, artifact, species

Statuses:
  established, proposed, deprecated, contradicted, speculative

Example:
  deno run --allow-read --allow-write add-entry.ts \\
    --bible ./my-world \\
    --category character \\
    --name "Elena Blackwood" \\
    --status proposed \\
    --contributor "jsmith"
`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    Deno.exit(0);
  }

  const options = parseArgs(args);
  if (!options) {
    showUsage();
    Deno.exit(1);
  }

  try {
    await addEntry(options);
  } catch (e) {
    console.error('Error adding entry:', e);
    Deno.exit(1);
  }
}

main();
