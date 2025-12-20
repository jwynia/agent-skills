# Decision: Deno Runtime for Skill Scripts

## Decision ID
deno-runtime-001

## Date
2025-12-20

## Status
Accepted

## Context

Skills in this project can include executable scripts in their `scripts/` directory. We need a consistent runtime and tooling approach that:

1. Ensures skills are **portable** - work when extracted from this project
2. Provides **type safety** through TypeScript
3. Requires **minimal setup** for users running skills
4. Avoids **dependency bloat** (no node_modules per skill)
5. Works **cross-platform** (Linux, macOS, Windows)

**Key Constraint**: Skills will be exported for use elsewhere in mix/match ways. Any configuration must be portable - skills cannot depend on project-root files that won't travel with them.

## Decision

**Use Deno as the required runtime for skill scripts with self-contained imports.**

**Key principles**:
1. Scripts use **direct `jsr:` imports with pinned versions** - no deno.json required
2. Project-level deno.json provides **development conveniences only** (linting, formatting)
3. Scripts must be **fully self-contained** and work when extracted from this project
4. No shared utilities within the project - each skill is independent

## Rationale

### Why Deno

| Requirement | How Deno Addresses It |
|-------------|----------------------|
| Portability | Global cache, no node_modules folder per skill |
| TypeScript | Built-in, no compilation step |
| Minimal setup | Single binary, no package manager needed |
| No bloat | Dependencies cached globally, shared across all projects |
| Cross-platform | First-class Windows, macOS, Linux support |

### Why Direct Imports (Not Import Maps)

Import maps (`deno.json` imports) provide DRY versioning but break portability:
- Scripts would fail without the project's deno.json
- Users would need to recreate the import map

Direct `jsr:` imports with pinned versions:
- Scripts work anywhere with just Deno installed
- Dependencies auto-cached on first run
- Version is explicit in the code (documentation)

**Trade-off accepted**: Some version duplication across scripts in exchange for true portability.

## Implementation

### Script Pattern

```typescript
#!/usr/bin/env -S deno run --allow-env --allow-net

// Direct imports with pinned versions - no deno.json needed
import { parseArgs } from "jsr:@std/cli@1.0.9/parse-args";

// Entry point guard for library/CLI dual use
if (import.meta.main) {
  main(Deno.args);
}
```

### Import Priority

1. **`jsr:`** - First choice for Deno/TypeScript packages
2. **`npm:`** - For Node packages not on JSR
3. **`https://`** - Last resort only

### Permission Model

Document in script header and shebang:
- `--allow-env` - Read environment variables (API keys)
- `--allow-net` - Make network requests
- `--allow-read=.` - Read files (scope when possible)
- `--allow-write=.` - Write files (scope when possible)

### Project-Level Config

`/deno.json` provides development conveniences:
- TypeScript strict mode
- Lint rules
- Formatting standards
- Development tasks (`deno task check`, `deno task lint`)

This file is **NOT required by skills** - it only helps during development.

## Alternatives Considered

### Alternative 1: Node.js with package.json
**Pros**: Familiar, large ecosystem
**Cons**: Requires npm install, creates node_modules bloat, not portable
**Rejected Because**: Each skill would need its own package.json and npm install

### Alternative 2: Bun
**Pros**: Fast, TypeScript support
**Cons**: Less mature, smaller ecosystem, also has node_modules
**Rejected Because**: Same portability issues as Node.js

### Alternative 3: deno.json per Skill
**Pros**: Centralizes versions within skill
**Cons**: Still requires config file to travel with skill, adds complexity
**Rejected Because**: Direct imports are simpler and truly portable

### Alternative 4: Shared deps.ts in Project Root
**Pros**: DRY versioning, single source of truth
**Cons**: Creates dependency on project structure, breaks portability
**Rejected Because**: Skills must work standalone

## Implications

### For Skill Authors
- Use Deno runtime for all scripts
- Pin all dependency versions explicitly
- Document required permissions in script header
- Test scripts work in isolation (copy to empty directory)

### For Skill Users
- Install Deno once (`curl -fsSL https://deno.land/install.sh | sh`)
- Run scripts directly - no npm install, no setup
- Dependencies auto-cached on first run

### Files Created
- `/deno.json` - Project development config
- `/.vscode/settings.json` - Editor Deno support
- `/context-network/meta/templates/deno-script-template.ts` - Script starter

## Portability Verification Checklist

Before any skill with scripts is complete:
- [ ] Script runs with `deno run` in empty directory (no deno.json)
- [ ] All imports use pinned versions (`@1.0.0` not `@latest`)
- [ ] Permissions documented in script header
- [ ] Help text includes usage examples
- [ ] No imports from project-relative paths (no `../../../`)

## Related Decisions
- `organization-structure.md` - Skills export as standalone folders
- `naming-strategy.md` - Skill naming conventions

## References
- Template: `/context-network/meta/templates/deno-script-template.ts`
- JSR docs: https://jsr.io/docs/with/deno
- Deno modules: https://docs.deno.com/runtime/fundamentals/modules/

## Metadata
- **Decision Maker**: Project Team
- **Stakeholders**: Skill developers, skill users
- **Impact**: High - affects all skill scripts
- **Reversibility**: Low - changing runtime after skills exist is disruptive

## Change History
- 2025-12-20: Initial decision documented
