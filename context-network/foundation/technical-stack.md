# Technical Stack

Quick reference for runtime and tooling decisions in this project.

## Skill Scripts: Deno/TypeScript

**All executable scripts in skills use Deno.**

| Aspect | Choice | Rationale |
|--------|--------|-----------|
| Runtime | Deno | No node_modules, global cache, TypeScript built-in |
| Language | TypeScript | Type safety, self-documenting |
| Imports | Direct `jsr:` with pinned versions | Portability - no config file needed |
| Permissions | Explicit in shebang | Security, documentation |

### Import Priority

1. `jsr:` - Deno/TypeScript packages (preferred)
2. `npm:` - Node packages not on JSR
3. `https://` - Last resort

### Example

```typescript
#!/usr/bin/env -S deno run --allow-env --allow-net

import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

if (import.meta.main) {
  // CLI logic
}
```

**Decision record**: `decisions/deno-runtime-requirement.md`

## Validation: Python/skills-ref

The agentskills.io reference implementation for validation.

| Aspect | Choice |
|--------|--------|
| Runtime | Python 3.x |
| Package manager | uv (or pip) |
| Location | `reference/agentskills/skills-ref/` |

### Usage

```bash
cd reference/agentskills/skills-ref
uv run skills-ref validate ../../../skills/domain/category/skill-name
```

### What It Validates

- YAML frontmatter structure
- Name conventions (1-64 chars, lowercase, hyphens)
- Folder name matches `name` field
- Description present and reasonable length

## Project Development Tools

These help during development but are NOT required by skills.

| Tool | Purpose | Location |
|------|---------|----------|
| `deno.json` | Linting, formatting, dev tasks | Project root |
| `.vscode/settings.json` | Editor Deno support | `.vscode/` |

### Deno Tasks

```bash
deno task check      # Type check all scripts
deno task lint       # Lint skills/
deno task fmt        # Format skills/
deno task fmt:check  # Check formatting
```

## Explicitly NOT Used in Skills

| Technology | Why Not |
|------------|---------|
| Node.js | Creates node_modules, not portable |
| Bun | Same portability issues as Node |
| Import maps | Requires deno.json to travel with skill |
| Shared project utilities | Skills must be self-contained |

## Portability Requirement

Skills are exported for use elsewhere in mix/match ways. Therefore:

- Scripts must work with only Deno installed
- No dependencies on project-root config
- All imports pinned to specific versions
- No relative imports outside the skill folder

## Related Documents

- Decision record: `decisions/deno-runtime-requirement.md`
- Script template: `meta/templates/deno-script-template.ts`
- Skills README: `/skills/README.md`
