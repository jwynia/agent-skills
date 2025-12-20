# Skills Catalog

This index provides a master catalog of all agent skills being developed in this project.

## Purpose

Maintains a central registry of skills with their current status, location, and basic metadata. This allows quick discovery of what skills exist and their development state.

## Quick Stats

- **Total Skills**: 0
- **Planning**: 0
- **In Progress**: 0
- **Validating**: 0
- **Complete**: 0

## Skills by Domain

### Data Processing

See [data-processing/index.md](data-processing/index.md) for skills in this domain.

- No skills yet

### Web

See [web/index.md](web/index.md) for skills in this domain.

- No skills yet

### Code Analysis

See [code-analysis/index.md](code-analysis/index.md) for skills in this domain.

- No skills yet

## Skills by Status

### Planning

None yet

### In Progress

None yet

### Validating

None yet

### Complete

None yet

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
- **Last Updated:** 2025-12-20
- **Updated By:** Claude

## Change History

- 2025-12-20: Added Technical Requirements section (Deno runtime)
- 2025-12-19: Initial creation of skills catalog
