# Skills Catalog

This index provides a master catalog of all agent skills being developed in this project.

## Purpose

Maintains a central registry of skills with their current status, location, and basic metadata. This allows quick discovery of what skills exist and their development state.

## Quick Stats

- **Total Skills**: 14
- **Planning**: 0
- **In Progress**: 0
- **Validating**: 0
- **Complete**: 14

## Skills by Domain

### Data Processing

See [data-processing/index.md](data-processing/index.md) for skills in this domain.

- No skills yet

### Development

See [development/index.md](development/index.md) for skills in this domain.

| Skill | Category | Status | Description |
|-------|----------|--------|-------------|
| agile-coordinator | workflow | Complete | Multi-agent task orchestration for agile workflows |
| electron-best-practices | best-practices | Complete | Electron + React desktop app development best practices |
| npm-package | tooling | Complete | Build and publish npm packages using Bun as primary toolchain |
| npx-cli | tooling | Complete | Build and publish npx-executable CLI tools using Bun |
| scraper-builder | tooling | Complete | Generate PageObject pattern web scrapers with Playwright and Docker |

### Document Processing

See [document-processing/index.md](document-processing/index.md) for skills in this domain.

| Skill | Category | Status | Description |
|-------|----------|--------|-------------|
| pptx-generator | presentation | Complete | Create and manipulate PowerPoint PPTX files |
| docx-generator | document | Complete | Create and manipulate Word DOCX files |
| xlsx-generator | spreadsheet | Complete | Create and manipulate Excel XLSX files |
| pdf-generator | pdf | Complete | Create and manipulate PDF files |
| ebook-analysis | analysis | Complete | Extract knowledge from ebooks with citation traceability |

### Web

See [web/index.md](web/index.md) for skills in this domain.

- No skills yet

### Code Analysis

See [code-analysis/index.md](code-analysis/index.md) for skills in this domain.

- No skills yet

### Research

See [research/index.md](research/index.md) for skills in this domain.

| Skill | Category | Status | Description |
|-------|----------|--------|-------------|
| web-search | search | Complete | Web search via Tavily API |
| research-workflow | workflow | Complete | Structured research methodology |

### Game Development

| Skill | Category | Status | Description |
|-------|----------|--------|-------------|
| godot-best-practices | godot | Complete | Godot 4.x GDScript coding best practices |
| godot-asset-generator | assets | Complete | AI image generation for Godot game assets |

## Skills by Status

### Planning

None yet

### In Progress

None yet

### Validating

None yet

### Complete

| Skill | Domain | Location |
|-------|--------|----------|
| web-search | research | `skills/research/search/web-search/` |
| research-workflow | research | `skills/research/workflow/research-workflow/` |
| pptx-generator | document-processing | `skills/document-processing/presentation/pptx-generator/` |
| docx-generator | document-processing | `skills/document-processing/word/docx-generator/` |
| xlsx-generator | document-processing | `skills/document-processing/spreadsheet/xlsx-generator/` |
| pdf-generator | document-processing | `skills/document-processing/pdf/pdf-generator/` |
| ebook-analysis | document-processing | `skills/document-processing/analysis/ebook-analysis/` |
| godot-best-practices | game-development | `skills/game-development/godot-best-practices/` |
| godot-asset-generator | game-development | `skills/game-development/godot-asset-generator/` |
| agile-coordinator | development | `skills/development/workflow/agile-coordinator/` |
| electron-best-practices | development | `.claude/skills/electron-best-practices/` |
| npm-package | development | `skills/tech/development/tooling/npm-package/` |
| npx-cli | development | `skills/tech/development/tooling/npx-cli/` |
| scraper-builder | development | `skills/tech/development/tooling/scraper-builder/` |

## Technical Requirements

All skills with scripts must follow these requirements:

| Requirement | Details |
|-------------|---------|
| Runtime | Deno/TypeScript only |
| Imports | Direct `jsr:` with pinned versions |
| Portability | Scripts must work without project deno.json |
| Permissions | Document in script header |

**Decision record**: `../../decisions/deno-runtime-requirement.md`
**Script template**: `../../meta/templates/deno-script-template.ts`
**Full details**: `../../foundation/technical-stack.md`

## Adding a New Skill

1. **Plan first**: Create a planning document in the appropriate domain folder
2. **Document intent**: Follow the Intent-Before-Action principle
3. **Create skill**: Follow the process in `context-network/processes/creation.md`
4. **Update catalogs**: Update this index and the domain index
5. **Create tracking file**: Add `[domain]/[skill-name].md` tracking file

## Catalog Maintenance

This catalog should be updated:
- When a new skill is planned (add to Planning section)
- When development starts (move to In Progress)
- When validation begins (move to Validating)
- When skill is complete (move to Complete)
- Update Quick Stats totals

## Navigation

- **By Domain**: Browse domain-specific indexes (links above)
- **By Tracking File**: Each skill has a tracking file at `[domain]/[skill-name].md`
- **By Location**: Actual skills are in `/skills/[domain]/[category]/[skill-name]/`

## Metadata

- **Created:** 2025-12-19
- **Last Updated:** 2026-02-15
- **Updated By:** Claude

## Change History

- 2026-02-15: Added npm-package and npx-cli skills to Development domain (tooling category)
- 2026-02-04: Added scraper-builder skill to Development domain
- 2026-02-04: Added electron-best-practices skill to Development domain
- 2026-01-20: Added agile-coordinator skill to Development domain
- 2026-01-20: Added ebook-analysis skill to Document Processing domain
- 2025-12-31: Added godot-asset-generator skill to Game Development
- 2025-12-30: Added Game Development domain with godot-best-practices skill
- 2025-12-27: Added pdf-generator skill to Document Processing
- 2025-12-27: Added docx-generator and xlsx-generator skills to Document Processing
- 2025-12-27: Added Document Processing domain with pptx-generator skill
- 2025-12-20: Added Research domain with web-search and research-workflow skills
- 2025-12-20: Added Technical Requirements section (Deno runtime)
- 2025-12-19: Initial creation of skills catalog
