# Personal Knowledge Scaffold

Directory structure and initial content for personal knowledge management (PKM, second brain, digital garden).

## Directory Structure

```
context/
├── status.md              # Current focus, active projects
├── decisions.md           # System decisions
├── glossary.md            # Personal vocabulary, abbreviations
├── areas/                 # Life areas (ongoing responsibilities)
│   ├── index.md           # Area overview
│   └── [area]/            # e.g., health/, career/, finance/
├── projects/              # Active projects (with end dates)
│   ├── index.md           # Project list
│   └── [project]/         # Individual project context
├── resources/             # Reference material
│   ├── index.md           # Resource catalog
│   └── [topic]/           # Organized by subject
└── archive/               # Completed/inactive items
    ├── projects/          # Finished projects
    └── areas/             # Deprecated areas
```

## PARA Integration

This scaffold follows the PARA method with context network enhancements:

| PARA Component | Location | Purpose |
|----------------|----------|---------|
| **P**rojects | `projects/` | Active work with deadlines |
| **A**reas | `areas/` | Ongoing responsibilities |
| **R**esources | `resources/` | Reference material |
| **A**rchive | `archive/` | Inactive items |

Context network additions:
- `status.md` for current state across all areas
- `decisions.md` for system-level choices
- Explicit relationships between components

## Initial File Content

### status.md

```markdown
# Current Status

## Focus Areas

{{What's getting attention right now}}

### This Week
- {{Primary focus}}
- {{Secondary focus}}

### This Month
- {{Larger goal}}

## Active Projects

| Project | Status | Next Action |
|---------|--------|-------------|
| {{project}} | {{status}} | {{next step}} |

## Areas Needing Attention

{{Areas that have been neglected or need review}}

## Recent Captures

{{Recent additions to the system—notes, resources, ideas}}

| Date | Item | Location | Processed |
|------|------|----------|-----------|
| {{date}} | {{what}} | {{where filed}} | Yes/No |

---

*Last updated: {{today}}*
```

### areas/index.md

```markdown
# Life Areas

## Purpose

Ongoing areas of responsibility. No end date—these persist.

## Classification

- **Domain:** Personal
- **Stability:** Static
- **Abstraction:** Structural
- **Confidence:** Established

## Active Areas

| Area | Description | Status | Last Review |
|------|-------------|--------|-------------|
| {{area}} | {{what it covers}} | {{healthy/needs attention}} | {{date}} |

## Area Health Indicators

How to assess if an area needs attention:
- {{Indicator 1}}
- {{Indicator 2}}

## Relationships

### Related Nodes
- projects/* - supports - projects often serve area goals
- resources/* - informs - resources support area maintenance
```

### projects/index.md

```markdown
# Projects

## Purpose

Active projects with defined outcomes and end states.

## Classification

- **Domain:** Personal
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Evolving

## Active Projects

| Project | Area | Outcome | Status | Due |
|---------|------|---------|--------|-----|
| {{project}} | {{area}} | {{what done looks like}} | {{status}} | {{date}} |

## Project States

- **Active**: Currently being worked
- **Paused**: On hold, will resume
- **Waiting**: Blocked on external input
- **Review**: Evaluating if still relevant

## Someday/Maybe

Projects not committed to but might pursue:

| Project | Why Interesting | Trigger to Activate |
|---------|-----------------|---------------------|
| {{project}} | {{appeal}} | {{what would make you start}} |

## Relationships

### Related Nodes
- areas/* - serves - projects advance area goals
- archive/projects/* - completes-to - finished projects move here
```

### resources/index.md

```markdown
# Resources

## Purpose

Reference material organized by topic. Information you might need again.

## Classification

- **Domain:** Reference
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Resource Categories

| Category | Contents | Frequency |
|----------|----------|-----------|
| {{topic}} | {{what's here}} | {{how often accessed}} |

## Recently Added

| Date | Resource | Category | Notes |
|------|----------|----------|-------|
| {{date}} | {{what}} | {{where}} | {{why useful}} |

## Resource Quality

Not all resources are equal:
- **Core**: Frequently referenced, high value
- **Reference**: Occasionally useful
- **Archive candidate**: Rarely accessed, consider moving

## Relationships

### Related Nodes
- areas/* - supports - resources inform area work
- projects/* - supports - resources used in projects
```

## Bootstrap Questions

When setting up a PKM system, ask:

1. **What's the capture method?**
   - Quick capture location for inbox items
   - Integration with existing tools (notes apps, bookmarks)

2. **What are your life areas?**
   - Career, health, relationships, finance, hobbies, etc.
   - Start with 3-5, expand as needed

3. **Review cadence?**
   - Weekly review: status.md, active projects
   - Monthly review: areas, resources
   - Quarterly: archive, system evaluation

4. **What's the retrieval pattern?**
   - Search-first: flat structure, good naming
   - Browse-first: hierarchical, clear categories
   - Link-first: heavy cross-referencing

## Integration Notes

- status.md is your daily dashboard—keep it scannable
- Process inbox items regularly—unprocessed captures lose value
- Archive aggressively—completed projects don't need prime real estate
- Review decisions.md when system friction appears—may need adjustment
