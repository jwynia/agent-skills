# Session Bootstrap

**Read this first.** This document provides quick orientation for AI agents starting a new session on this project.

## Project Purpose

This project creates a collection of reusable **Agent Skills** following the [agentskills.io](https://agentskills.io) specification. Skills are portable packages that extend AI agent capabilities with specialized knowledge and workflows.

## Directory Structure

```
agent-skills/
├── skills/                    # Skill deliverables (nested by domain/category)
│   └── [domain]/[category]/[skill-name]/
│       ├── SKILL.md           # Required: frontmatter + instructions
│       ├── scripts/           # Optional: executable code (Deno/TypeScript)
│       ├── references/        # Optional: detailed docs loaded on-demand
│       └── assets/            # Optional: templates, data files
│
├── context-network/           # Planning, decisions, tracking (source of truth)
│   ├── foundation/            # Project definition, principles, structure
│   ├── decisions/             # Architectural decision records
│   ├── elements/skills/       # Skill catalog and tracking
│   ├── processes/             # Workflows (creation, validation, delivery)
│   └── meta/                  # Templates, maintenance docs
│
├── reference/                 # External tools and specs
│   └── agentskills/skills-ref/  # Python validation tool
│
├── inbox/                     # Research, examples, experiments (staging area)
│
└── deno.json                  # Project-level dev config (not required by skills)
```

## Key Decisions Already Made

| Decision | Summary | Location |
|----------|---------|----------|
| Organization | Nested development, flat runtime export | `decisions/organization-structure.md` |
| Scripts Runtime | Deno/TypeScript with portable direct imports | `decisions/deno-runtime-requirement.md` |
| Naming | Deferred until 10-15 skills exist | `decisions/naming-strategy.md` |

## Technical Stack

- **Skill scripts**: Deno/TypeScript with `jsr:` imports (no node_modules)
- **Validation**: Python-based skills-ref tool (uses uv)
- **No Node.js/Bun in skills** - portability requirement

See `foundation/technical-stack.md` for details.

## Templates

| Template | Purpose | Location |
|----------|---------|----------|
| SKILL.md starter | New skill creation | `meta/templates/skill-md-starter.md` |
| Deno script | CLI tool for skills | `meta/templates/deno-script-template.ts` |
| Skill planning | Pre-creation planning | `meta/templates/skill-planning-template.md` |
| Skill tracking | Development tracking | `elements/skills/templates/skill-tracking.md` |

## Common Tasks

### Create a new skill
1. Plan in context network first (`processes/creation.md`)
2. Create folder in `skills/[domain]/[category]/[skill-name]/`
3. Write SKILL.md using template
4. Validate: `cd reference/agentskills/skills-ref && uv run skills-ref validate ../../../skills/path/to/skill`

### Add a script to a skill
1. Use `meta/templates/deno-script-template.ts` as starter
2. Pin all dependency versions (`jsr:@std/cli@1.0.9`, not `@latest`)
3. Document permissions in script header
4. Test portability: script must work without project's deno.json

### Check project conventions
- Read `CLAUDE.md` or `AGENTS.md` for working style
- Check `foundation/principles.md` for design values
- Review existing decisions in `decisions/`

## What NOT to Do

- Don't create skills without planning in context network first
- Don't use Node.js/Bun for skill scripts (Deno only)
- Don't rely on project-root config in skill scripts (portability)
- Don't duplicate info between CLAUDE.md and context network

## Quick Links

- Project definition: `foundation/project_definition.md`
- Creation process: `processes/creation.md`
- Validation process: `processes/validation.md`
- Skills catalog: `elements/skills/index.md`
