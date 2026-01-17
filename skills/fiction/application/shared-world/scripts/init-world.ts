#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * init-world.ts - Initialize a new world bible structure
 *
 * Creates the full directory structure with template files
 * for a wiki-style world bible.
 *
 * Usage:
 *   deno run --allow-read --allow-write init-world.ts "World Name" [output-dir]
 *
 * Example:
 *   deno run --allow-read --allow-write init-world.ts "The Shattered Realms"
 *   deno run --allow-read --allow-write init-world.ts "My World" ./worlds/my-world
 */

const DIRECTORIES = [
  'characters',
  'locations',
  'history',
  'history/eras',
  'history/events',
  'factions',
  'rules',
  'culture',
  'artifacts',
  'species',
  'meta',
];

function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function generateDiscovery(worldName: string): string {
  return `# ${worldName} World Bible

Welcome to the canonical reference for ${worldName}. This world bible contains all established facts, proposed additions, and organizational structure for our shared world.

## Quick Start

1. **New here?** Start with [Style Guide](meta/style-guide.md) for conventions
2. **Looking for something?** Check the category indexes below
3. **Adding content?** Use [Add Entry](#adding-entries) workflow
4. **Found a conflict?** Report in [Conflicts](meta/conflicts.md)

## Canon Status Guide

| Symbol | Status | Meaning |
|--------|--------|---------|
| ✓ | Established | Confirmed canon - treat as fact |
| ? | Proposed | Suggested - available but may change |
| ✗ | Deprecated | Superseded - don't use in new work |
| ⚠ | Contradicted | Conflicts exist - needs resolution |
| ~ | Speculative | Extrapolated - use cautiously |

See [Canon Status](canon-status.md) for current overview.

## Categories

### [Characters](characters/_index.md)
People and beings in the world.

### [Locations](locations/_index.md)
Places, from continents to rooms.

### [History](history/timeline.md)
Timeline, eras, and significant events.

### [Factions](factions/_index.md)
Organizations, governments, and groups.

### [Rules](rules/_index.md)
How the world works - magic, technology, physics.

### [Culture](culture/_index.md)
Beliefs, customs, languages, traditions.

### [Artifacts](artifacts/_index.md)
Significant objects.

### [Species](species/_index.md)
Non-human beings and creatures.

## Adding Entries

1. Create entry using appropriate template
2. Set status to **Proposed**
3. Add relationships (wiki-links)
4. Update relevant index
5. Note in [Changelog](meta/changelog.md)

Proposed entries become Established after review by canon authority.

## Recent Changes

See [Changelog](meta/changelog.md) for recent updates.

## Conflicts

See [Conflicts](meta/conflicts.md) for unresolved contradictions.

## Contributors

See [Contributors](meta/contributors.md) for who maintains what.

---

*Created: ${getDate()}*
`;
}

function generateCanonStatus(worldName: string): string {
  return `# ${worldName} Canon Status

Overview of canonical state across all categories.

## Status Summary

| Category | Established | Proposed | Deprecated | Contradicted |
|----------|-------------|----------|------------|--------------|
| Characters | 0 | 0 | 0 | 0 |
| Locations | 0 | 0 | 0 | 0 |
| History | 0 | 0 | 0 | 0 |
| Factions | 0 | 0 | 0 | 0 |
| Rules | 0 | 0 | 0 | 0 |
| Culture | 0 | 0 | 0 | 0 |
| Artifacts | 0 | 0 | 0 | 0 |
| Species | 0 | 0 | 0 | 0 |

## Recent Status Changes

*No changes yet.*

## Pending Review

Proposed entries awaiting establishment:

*None yet.*

---

*Last updated: ${getDate()}*
`;
}

function generateIndex(category: string, description: string): string {
  const singular = category.endsWith('s') ? category.slice(0, -1) : category;
  return `# ${category.charAt(0).toUpperCase() + category.slice(1)}

${description}

## Entries

| Name | Status | Summary |
|------|--------|---------|
| *No entries yet* | | |

## Adding New ${category.charAt(0).toUpperCase() + category.slice(1)}

1. Create file in this directory: \`${singular}-name.md\`
2. Use the entry template
3. Set category to "${category.charAt(0).toUpperCase() + category.slice(1)}"
4. Add relationships to existing entries
5. Update this index
6. Note in [changelog](../meta/changelog.md)

---

*Last updated: ${getDate()}*
`;
}

function generateTimeline(): string {
  return `# Timeline

Chronological overview of ${getDate()}'s history.

## Eras

| Era | Period | Description |
|-----|--------|-------------|
| *Define eras as needed* | | |

## Major Events

See [events/](events/) for detailed event entries.

## Adding to Timeline

1. Create event entry in \`events/\` directory
2. Add to appropriate era section above
3. Update [changelog](../meta/changelog.md)

---

*Last updated: ${getDate()}*
`;
}

function generateStyleGuide(worldName: string): string {
  return `# ${worldName} Style Guide

Guidelines for contributing to this shared world.

## Naming Conventions

### Characters
- [Describe naming patterns, cultural influences]
- [Examples of good names]

### Places
- [Describe place naming conventions]
- [Linguistic patterns]

### Organizations
- [How factions/groups are named]

## Tone and Voice

### World Tone
[Describe the overall feel - dark, hopeful, gritty, whimsical, etc.]

### What Fits
- [Elements that belong]
- [Themes that work]

### What Doesn't Fit
- [Elements to avoid]
- [Tone mismatches]

## Content Boundaries

### Acceptable Content
- [What can be depicted]
- [How to handle sensitive topics]

### Requires Care
- [Topics needing sensitivity]
- [How to approach them]

### Off-Limits
- [Topics not allowed]
- [Hard boundaries]

## Formatting Standards

### Dates
- In-world calendar: [describe]
- Out-of-world: YYYY-MM-DD

### Measurements
- [Units used in-world]
- [Conversion notes if helpful]

### Capitalization
- [What gets capitalized]
- [Title conventions]

## Common Terms

| Term | Meaning | Usage |
|------|---------|-------|
| [Term] | [Definition] | [How to use] |

## Canon Authority

Primary canon authority: [Name/Role]

Decisions logged in: [conflicts.md](conflicts.md)

---

*Established: ${getDate()}*
`;
}

function generateChangelog(worldName: string): string {
  return `# ${worldName} Changelog

Recent changes to the world bible.

## ${getDate()}

- **Created**: World bible initialized

---

## Adding to Changelog

When you make changes:
1. Add entry under today's date (or create new date header)
2. Use format: \`- **Action**: Description (contributor)\`
3. Actions: Created, Updated, Deprecated, Established, Resolved

Example:
\`\`\`
- **Created**: New character entry for Elena (jsmith)
- **Updated**: Expanded magic system rules (kdoe)
- **Established**: Proposed faction "The Order" now canon (admin)
\`\`\`
`;
}

function generateConflicts(): string {
  return `# Canon Conflicts

Unresolved contradictions requiring attention.

## Active Conflicts

*No conflicts currently.*

## Resolved Conflicts

*No resolutions yet.*

---

## Reporting Conflicts

When you find contradicting information:

1. Add to Active Conflicts section below
2. Include:
   - Both entries involved (with links)
   - Nature of contradiction
   - Source references
   - Date discovered

### Template:

\`\`\`
### [Brief Description]
**Discovered:** [Date]
**Entries:** [[Entry 1]] vs [[Entry 2]]
**Conflict:** [Description of contradiction]
**Sources:**
- Entry 1: [source]
- Entry 2: [source]
**Status:** Awaiting resolution
\`\`\`

## Resolving Conflicts

Canon authority resolves by:
1. Determining which source has priority
2. Either reconciling both or deprecating one
3. Moving to Resolved section with decision documented
`;
}

function generateContributors(): string {
  return `# Contributors

Who maintains what in this world bible.

## Canon Authority

- **Primary:** [Name] - final decisions on canon status

## Active Contributors

| Name | Areas | Since |
|------|-------|-------|
| [Name] | [Categories/areas] | ${getDate()} |

## Contribution History

See [changelog](changelog.md) for detailed contribution history.

---

## Becoming a Contributor

1. Read the [Style Guide](style-guide.md)
2. Familiarize yourself with existing canon
3. Start with Proposed entries in your area of interest
4. Contact canon authority for questions
`;
}

const INDEX_DESCRIPTIONS: Record<string, string> = {
  characters: 'People and beings that inhabit this world.',
  locations: 'Places in the world, from continents to individual buildings.',
  factions: 'Organizations, governments, groups, and alliances.',
  rules: 'How the world works - magic systems, technology, physics.',
  culture: 'Beliefs, customs, languages, and traditions.',
  artifacts: 'Significant objects, weapons, and items of power.',
  species: 'Non-human beings, creatures, and races.',
};

async function initWorld(worldName: string, outputDir: string) {
  console.log(`Initializing world bible for "${worldName}"...`);
  console.log(`Output directory: ${outputDir}`);

  // Create directories
  await Deno.mkdir(outputDir, { recursive: true });
  for (const dir of DIRECTORIES) {
    await Deno.mkdir(`${outputDir}/${dir}`, { recursive: true });
    console.log(`  Created: ${dir}/`);
  }

  // Create main files
  await Deno.writeTextFile(`${outputDir}/discovery.md`, generateDiscovery(worldName));
  console.log('  Created: discovery.md');

  await Deno.writeTextFile(`${outputDir}/canon-status.md`, generateCanonStatus(worldName));
  console.log('  Created: canon-status.md');

  // Create index files
  for (const [category, description] of Object.entries(INDEX_DESCRIPTIONS)) {
    await Deno.writeTextFile(
      `${outputDir}/${category}/_index.md`,
      generateIndex(category, description)
    );
    console.log(`  Created: ${category}/_index.md`);
  }

  // Create history timeline
  await Deno.writeTextFile(`${outputDir}/history/timeline.md`, generateTimeline());
  console.log('  Created: history/timeline.md');

  // Create meta files
  await Deno.writeTextFile(`${outputDir}/meta/style-guide.md`, generateStyleGuide(worldName));
  console.log('  Created: meta/style-guide.md');

  await Deno.writeTextFile(`${outputDir}/meta/changelog.md`, generateChangelog(worldName));
  console.log('  Created: meta/changelog.md');

  await Deno.writeTextFile(`${outputDir}/meta/conflicts.md`, generateConflicts());
  console.log('  Created: meta/conflicts.md');

  await Deno.writeTextFile(`${outputDir}/meta/contributors.md`, generateContributors());
  console.log('  Created: meta/contributors.md');

  console.log(`
World bible initialized!

Next steps:
1. Edit meta/style-guide.md with your world's conventions
2. Add yourself to meta/contributors.md
3. Start adding entries to populate the bible
4. Use discovery.md as your navigation hub
`);
}

function showUsage() {
  console.log(`
Initialize World Bible
======================

Creates a complete world bible directory structure.

Usage:
  deno run --allow-read --allow-write init-world.ts "World Name" [output-dir]

Arguments:
  World Name    Name of your world (required)
  output-dir    Where to create the bible (default: ./world-bible)

Examples:
  deno run --allow-read --allow-write init-world.ts "The Shattered Realms"
  deno run --allow-read --allow-write init-world.ts "My World" ./worlds/my-world
`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    showUsage();
    Deno.exit(0);
  }

  const worldName = args[0];
  const outputDir = args[1] || `./world-bible`;

  try {
    await initWorld(worldName, outputDir);
  } catch (e) {
    console.error('Error initializing world bible:', e);
    Deno.exit(1);
  }
}

main();
