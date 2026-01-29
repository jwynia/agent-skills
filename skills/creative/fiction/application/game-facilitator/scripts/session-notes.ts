#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * session-notes.ts - Generate session note templates
 *
 * Creates structured session notes for tracking:
 * - What happened (summary)
 * - NPCs introduced
 * - Locations visited
 * - Plot threads
 * - Player decisions
 * - Next session setup
 *
 * Usage:
 *   deno run --allow-read --allow-write session-notes.ts "Session Title"
 *   deno run --allow-read --allow-write session-notes.ts "Session Title" --output session-3.md
 */

function getDate(): string {
  return new Date().toISOString().split('T')[0];
}

function generateSessionNotes(title: string): string {
  const date = getDate();

  return `# ${title}

**Date:** ${date}
**Duration:** [X hours]
**Players Present:** [List]

---

## Session Summary

[2-3 sentences capturing the key events]

---

## What Happened

### Opening Situation
[What was the state at session start?]

### Key Events
1. [First major thing that happened]
2. [Second major thing]
3. [Third major thing]

### Ending State
[How did the session end? Cliffhanger? Resolution?]

---

## NPCs Encountered

### New NPCs

| Name | Role | Notable |
|------|------|---------|
| [Name] | [What they do] | [What players remember them for] |

### Returning NPCs

| Name | What Happened |
|------|---------------|
| [Name] | [Their role in this session] |

---

## Locations

### New Locations
- **[Location Name]:** [Brief description and what happened there]

### Revisited Locations
- **[Location Name]:** [What changed or was discovered]

---

## Plot Threads

### Advanced
- [ ] [Thread name]: [What progress was made]

### New
- [ ] [New thread]: [How it was introduced]

### Dormant
- [ ] [Thread on hold]: [Why it's waiting]

### Resolved
- [x] [Completed thread]: [How it resolved]

---

## Player Decisions

Significant choices the players made:

1. **[Decision]:** [What they chose and why it matters]
2. **[Decision]:** [What they chose and why it matters]

---

## Consequences Pending

Things that will happen because of this session:

- [ ] [NPC will react to...]
- [ ] [Faction will respond by...]
- [ ] [Environment will change because...]

---

## Loot/Resources

### Acquired
- [Item/resource]: [Where/how obtained]

### Expended
- [Item/resource]: [How used]

---

## Memorable Moments

[Quote, scene, or moment worth remembering]

---

## GM Notes

### What Worked
- [Thing that went well]

### What to Improve
- [Thing to do better]

### Prep for Next Session
- [ ] [Thing to prepare]
- [ ] [NPC to develop]
- [ ] [Location to detail]

---

## Next Session

### Setup
[What situation will open the next session?]

### Threads to Pursue
1. [Most pressing thread]
2. [Secondary thread]

### NPCs Likely to Appear
- [Name]: [Why]

---

*Notes taken: ${date}*
`;
}

function showUsage() {
  console.log(`
Session Notes Generator
=======================

Generate structured session note templates.

Usage:
  deno run --allow-read --allow-write session-notes.ts "Session Title"
  deno run --allow-read --allow-write session-notes.ts "Session Title" --output file.md

Options:
  --output, -o    Output file path (default: prints to console)

Examples:
  deno run --allow-read --allow-write session-notes.ts "The Heist Begins"
  deno run --allow-read --allow-write session-notes.ts "Session 3" -o notes/session-3.md
`);
}

async function main() {
  const args = Deno.args;

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    showUsage();
    Deno.exit(0);
  }

  // Find title (first non-flag argument)
  let title = '';
  let output = '';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--output' || args[i] === '-o') {
      output = args[++i] || '';
    } else if (!args[i].startsWith('-')) {
      title = args[i];
    }
  }

  if (!title) {
    console.error('Error: Session title required');
    showUsage();
    Deno.exit(1);
  }

  const notes = generateSessionNotes(title);

  if (output) {
    await Deno.writeTextFile(output, notes);
    console.log(`Session notes created: ${output}`);
  } else {
    console.log(notes);
  }
}

main();
