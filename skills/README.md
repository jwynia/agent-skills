# Agent Skills Directory

This directory contains **106 skills** organized by domain.

## Structure

Skills are organized by domain with subcategories:

```
skills/
├── ai/                         # 1 skill
│   └── mastra-hono/
├── analysis/                   # 1 skill
│   └── technology-impact/
├── communication/              # 2 skills
│   ├── presentation-design/
│   └── speech-adaptation/
├── creative/                   # 3 skills
│   ├── humor/
│   │   └── joke-engineering/
│   └── music/
│       ├── lyric-diagnostic/
│       └── musical-dna/
├── development/                # 10 skills
│   ├── architecture/
│   │   ├── architecture-decision/
│   │   ├── requirements-analysis/
│   │   └── system-design/
│   ├── quality/
│   │   ├── code-review/
│   │   └── task-decomposition/
│   ├── tooling/
│   │   ├── devcontainer/
│   │   ├── skill-maker/
│   │   └── typescript-best-practices/
│   └── workflow/
│       ├── agile-workflow/
│       └── github-agile/
├── document-processing/        # 5 skills
│   ├── analysis/
│   │   └── ebook-analysis/
│   ├── pdf/
│   │   └── pdf-generator/
│   ├── presentation/
│   │   └── pptx-generator/
│   ├── spreadsheet/
│   │   └── xlsx-generator/
│   └── word/
│       └── docx-generator/
├── education/                  # 2 skills
│   ├── competency/
│   └── gentle-teaching/
├── fiction/                    # 54 skills
│   ├── application/
│   ├── character/
│   ├── core/
│   ├── craft/
│   ├── orchestrators/
│   ├── structure/
│   └── worldbuilding/
├── frontend/                   # 4 skills
│   ├── design/
│   │   ├── frontend-design/
│   │   └── shadcn-layouts/
│   └── pwa/
│       ├── pwa-development/
│       └── react-pwa/
├── game-development/           # 3 skills
│   ├── design/
│   │   └── abstract-strategy/
│   └── godot/
│       ├── godot-asset-generator/
│       └── godot-best-practices/
├── ideation/                   # 2 skills
│   ├── brainstorming/
│   └── naming/
├── meta/                       # 3 skills
│   ├── context-network/
│   ├── context-retrospective/
│   └── skill-builder/
├── productivity/               # 1 skill
│   └── task-breakdown/
├── research/                   # 7 skills
│   ├── methodology/
│   │   ├── research/
│   │   └── research-workflow/
│   ├── tools/
│   │   ├── media-meta-analysis/
│   │   ├── web-search/
│   │   └── web-search-tavily/
│   └── verification/
│       ├── claim-investigation/
│       └── fact-check/
├── security/                   # 4 skills
│   ├── config-scan/
│   ├── dependency-scan/
│   ├── secrets-scan/
│   └── security-scan/
└── writing/                    # 4 skills
    ├── analysis/
    │   ├── blind-spot-detective/
    │   └── voice-analysis/
    └── revision/
        ├── non-fiction-revision/
        └── summarization/
```

Each skill folder contains:
- **SKILL.md** (required): YAML frontmatter + markdown instructions
- **scripts/** (optional): Executable Deno/TypeScript code
- **references/** (optional): Additional documentation
- **assets/** (optional): Templates, images, data files

## Skill Format

Each skill is a folder containing:

- **SKILL.md** (required): YAML frontmatter + markdown instructions
- **scripts/** (optional): Executable code that agents can run
- **references/** (optional): Additional documentation loaded on-demand
- **assets/** (optional): Templates, images, data files

## Scripts: Deno/TypeScript

All executable scripts in skills use **Deno** with TypeScript. This provides:

- **Portability**: No `node_modules` - dependencies cached globally by Deno
- **Self-contained**: Scripts work when skill is extracted and used elsewhere
- **Type safety**: TypeScript built-in, no compilation step
- **Minimal setup**: Users only need Deno installed

### Script Pattern

```typescript
#!/usr/bin/env -S deno run --allow-env --allow-net

// Direct imports with pinned versions (no deno.json required)
import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

if (import.meta.main) {
  // CLI logic here
}
```

### Key Requirements

1. **Pin all versions**: Use `jsr:@std/cli@1.0.9`, never `@latest`
2. **Document permissions**: List required `--allow-*` flags in script header
3. **Self-contained**: No imports from project paths (`../../../`)
4. **Export functions**: Enable both CLI and library use with `if (import.meta.main)`

### Import Priority

1. `jsr:` - First choice (Deno/TypeScript packages)
2. `npm:` - For Node packages not on JSR
3. `https://` - Last resort only

### Running Scripts

```bash
# Direct execution
deno run --allow-env --allow-net skills/domain/category/skill-name/scripts/tool.ts

# Or with shebang (if executable)
./skills/domain/category/skill-name/scripts/tool.ts
```

See `context-network/meta/templates/deno-script-template.ts` for the full starter template.

## Naming Requirements

Per the agentskills.io specification:

- Skill names must be 1-64 characters
- Lowercase letters, numbers, and hyphens only (`a-z`, `0-9`, `-`)
- Must not start or end with hyphen
- Must not contain consecutive hyphens (`--`)
- **Folder name must match the `name` field in SKILL.md frontmatter**

## Development vs. Runtime

**Development Structure** (this directory):
- Nested folders for human understanding and organization
- Organized by domain/category for easy navigation
- Supports grouping related skills

**Runtime Structure** (export target):
- Flat folder structure (one level deep)
- Each skill folder at the top level
- Names may include namespace/prefix to avoid collisions

Export tooling (to be developed) will flatten this structure for runtime deployment while preserving all skill functionality.

## Creating a New Skill

1. **Plan first**: Document your intent in the context network using the skill planning template
2. **Choose location**: Select appropriate domain and category folders (create if needed)
3. **Create folder**: Make a folder with the skill name (must match SKILL.md `name` field)
4. **Write SKILL.md**: Start with the template in `context-network/meta/templates/skill-md-starter.md`
5. **Validate**: Run `skills-ref validate ./path/to/your-skill`
6. **Document**: Update the skill catalog in the context network

## Validation

All skills MUST pass validation before completion:

```bash
# From the reference implementation
cd reference/agentskills/skills-ref
skills-ref validate ../../skills/domain/category/skill-name
```

See `context-network/processes/validation.md` for detailed validation procedures.

## Finding Skills

- **By domain**: Browse the folder structure
- **By catalog**: See `context-network/elements/skills/index.md` for a complete catalog
- **By status**: Check context network tracking files for skill development status

## Best Practices

1. **Atomic skills**: Each skill does one thing well
2. **Clear descriptions**: Include what, when, and keywords
3. **Progressive disclosure**: Keep SKILL.md concise, detailed content in references
4. **Examples matter**: Every skill should include concrete examples
5. **Test instructions**: Follow your own instructions to verify they work

## Questions?

See the context network for:
- Creation process: `context-network/processes/creation.md`
- Validation process: `context-network/processes/validation.md`
- Project principles: `context-network/foundation/principles.md`
- Decision records: `context-network/decisions/`
