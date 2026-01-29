# Creative Project Scaffold

Directory structure and initial content for creative projects (fiction, games, screenwriting, worldbuilding).

## Directory Structure

```
context/
├── status.md              # Current project state
├── decisions.md           # Creative decisions
├── glossary.md            # World vocabulary, naming conventions
├── world/                 # Setting and worldbuilding
│   ├── overview.md        # World summary
│   ├── locations/         # Places
│   ├── factions/          # Groups, organizations
│   └── rules/             # Magic systems, physics, constraints
├── characters/            # Character information
│   ├── index.md           # Character list
│   ├── main/              # Protagonist(s), major characters
│   └── supporting/        # Secondary characters
├── structure/             # Story structure
│   ├── outline.md         # Current outline
│   ├── arcs/              # Character arcs, plot arcs
│   └── timeline.md        # Chronology of events
└── reference/             # Research, inspiration
    ├── research.md        # Research notes
    └── inspiration/       # Reference material
```

## Initial File Content

### status.md

```markdown
# Project Status

## Current State

Creative project initiated. Establishing core concepts.

## Active Work

- [ ] Define core premise
- [ ] Establish main characters
- [ ] Outline initial structure

## Project Phase

**Current Phase:** Development
**Target:** {{Draft / Outline / Pitch}}

## Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| {{today}} | Project initiated | Core concepts in development |

## Creative Blockers

{{Story problems, character issues, plot holes}}

## Next Steps

1. {{Next creative task}}
2. {{Following task}}

---

*Last updated: {{today}}*
```

### world/overview.md

```markdown
# World Overview

## Purpose

High-level summary of the setting. Entry point for understanding the world.

## Classification

- **Domain:** Worldbuilding
- **Stability:** Semi-stable
- **Abstraction:** Conceptual
- **Confidence:** Evolving

## Logline

{{One-sentence world summary}}

## Core Concepts

### Setting
{{When and where. Era, location, scope.}}

### Tone
{{Mood, genre, atmosphere}}

### Central Conflict
{{What tension drives this world}}

### Rules
{{What's different from our world. Magic, technology, social structures.}}

## Key Locations

| Location | Significance |
|----------|--------------|
| {{place}} | {{why it matters}} |

## Key Factions

| Faction | Role |
|---------|------|
| {{group}} | {{their function in the story}} |

## Relationships

### Child Nodes
- locations/* - specific place details
- factions/* - group details
- rules/* - system details

## Navigation

**When to access:**
- Starting a new scene
- Checking consistency
- Introducing new elements
```

### characters/index.md

```markdown
# Character Index

## Purpose

Quick reference for all characters. Links to detailed profiles.

## Classification

- **Domain:** Characters
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Evolving

## Main Characters

| Character | Role | Arc | Profile |
|-----------|------|-----|---------|
| {{name}} | {{protagonist/antagonist/etc}} | {{arc summary}} | [link](main/{{name}}.md) |

## Supporting Characters

| Character | Function | Appears In | Profile |
|-----------|----------|------------|---------|
| {{name}} | {{story function}} | {{chapters/scenes}} | [link](supporting/{{name}}.md) |

## Character Relationships

{{Diagram or list of key relationships between characters}}

## Naming Conventions

- {{Convention for this world's names}}
- {{Phonetic patterns, cultural naming}}

## Relationships

### Related Nodes
- world/factions/* - belongs-to - characters affiliated with factions
- structure/arcs/* - drives - character arcs shape plot
```

### structure/outline.md

```markdown
# Story Outline

## Purpose

Current structural plan for the narrative. Living document—expect changes.

## Classification

- **Domain:** Structure
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Evolving

## Story Shape

**Structure Type:** {{Three-act / Hero's Journey / Other}}
**POV:** {{First/Third/Multiple}}
**Timeline:** {{Linear / Non-linear}}

## Act/Section Breakdown

### Act 1: {{Title}}
**Purpose:** {{What this section accomplishes}}

1. {{Scene/Chapter}} - {{What happens}} - {{Purpose}}
2. {{Scene/Chapter}} - {{What happens}} - {{Purpose}}

### Act 2: {{Title}}
...

### Act 3: {{Title}}
...

## Key Turning Points

| Point | What Happens | Page/Chapter Target |
|-------|--------------|---------------------|
| Inciting Incident | {{event}} | {{location}} |
| Midpoint | {{event}} | {{location}} |
| Climax | {{event}} | {{location}} |

## Relationships

### Related Nodes
- characters/index.md - depends-on - structure serves character arcs
- world/overview.md - constrained-by - world rules limit plot options
```

## Bootstrap Questions

When setting up a creative project, ask:

1. **What format?**
   - Novel/short story: structure/, chapters
   - Screenplay: scenes, dialogue focus
   - Game: mechanics, player agency
   - Series: episode structure, overarching plot

2. **Worldbuilding depth?**
   - Light: minimal world/ structure
   - Deep: extensive worldbuilding documentation

3. **Character complexity?**
   - Few deep characters: detailed profiles
   - Large cast: index-focused, lighter profiles

4. **Collaboration?**
   - Solo: personal creative decisions
   - Shared world: canon management, contributor guidelines

## Integration Notes

- Keep outline in sync with actual progress
- Update character profiles as they evolve
- Capture creative decisions in decisions.md—prevents re-solving same problems
