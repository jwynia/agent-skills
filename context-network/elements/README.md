# Elements

This directory contains lightweight tracking and metadata for individual skills being developed in this project. Each skill is an "element" that we track through its lifecycle from planning to completion.

## Purpose

The elements directory tracks individual skills without duplicating their actual content (which lives in `/skills/`). This allows the context network to maintain planning, decisions, and status information separate from the skill deliverables.

## Structure

For this agent skills project, elements are organized by the skills being created:

```
elements/
└── skills/
    ├── index.md                      # Master catalog of all skills
    ├── [domain]/                     # e.g., data-processing, web, code-analysis
    │   ├── index.md                  # Domain-level skill catalog
    │   └── [skill-name].md           # Lightweight tracking for specific skill
    └── templates/
        └── skill-tracking.md         # Template for skill tracking files
```

## What Gets Tracked

For each skill, we track:

- **Status**: planning | in-progress | validating | complete
- **Location**: Path in `/skills/` directory
- **Validation Results**: Pass/fail from skills-ref
- **Key Decisions**: Important choices made during development
- **Dependencies**: Related skills, external tools, etc.
- **Notes**: Special considerations, lessons learned

## What Does NOT Get Tracked Here

- **Actual skill content**: Lives in `/skills/[domain]/[category]/[skill-name]/`
- **Detailed instructions**: In the SKILL.md file itself
- **Code/scripts**: In the skill's `scripts/` directory
- **Reference docs**: In the skill's `references/` directory

## Creating Skill Tracking

Before creating a skill:

1. Document intent in a planning file here: `elements/skills/[domain]/[skill-name]-planning.md`
2. Create the actual skill in `/skills/[domain]/[category]/[skill-name]/`
3. Update the tracking file as you work
4. Update the catalog indexes (`elements/skills/index.md` and `elements/skills/[domain]/index.md`)

## Why Separate Tracking from Skills?

1. **Context network stays lightweight**: Agents don't load full skill content when reviewing planning
2. **Clear separation**: Planning/meta vs. deliverables
3. **Session resilience**: Context network always reflects current state
4. **Independent evolution**: Can reorganize skills without breaking tracking

## Relationships

- **Parent Nodes:** [foundation/structure.md]
- **Child Nodes:** Individual element directories
- **Related Nodes:** 
  - [connections/dependencies.md] - documents - Dependencies between elements
  - [connections/interfaces.md] - specifies - Interfaces between elements
