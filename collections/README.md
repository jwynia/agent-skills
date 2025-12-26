# External Skill Collections

This directory contains external skill collections added as git submodules. These collections provide reference skills for discovery, evaluation, and potential curation into the local `/skills/` directory.

## Purpose

External collections serve three purposes:

1. **Reference & Discovery**: Browse existing skills for patterns, ideas, and examples
2. **Direct Use**: Use skills directly if compatible with your platform
3. **Curation Pipeline**: Import and adapt skills into the local repository

## Current Collections

| Collection | Source | Description |
|------------|--------|-------------|
| `awesome-claude-skills/` | [ComposioHQ](https://github.com/ComposioHQ/awesome-claude-skills) | 25+ curated Claude skills across multiple domains |

## Browsing Collections

Navigate directly into collection folders to explore skill implementations:

```bash
ls collections/awesome-claude-skills/
```

Each skill typically contains:
- `SKILL.md` - Core instructions and metadata
- `scripts/` - Helper automation (often Python - see curation notes)
- `templates/` - Reusable document templates
- `resources/` - Reference materials

## Curating Skills into Local Repository

When importing a skill from an external collection, follow this workflow:

### 1. Evaluate the Skill
- Review the skill's SKILL.md and structure
- Check script dependencies and runtime requirements
- Assess compatibility with local conventions

### 2. Script Runtime Conversion
**Important**: This project uses Deno/TypeScript exclusively for scripts (see `context-network/decisions/deno-runtime-requirement.md`).

If the external skill uses Python scripts, convert them to Deno/TypeScript before importing:
- Rewrite Python logic in TypeScript
- Use Deno standard library and pinned JSR packages
- Document permissions in shebang
- Test thoroughly before integration

### 3. Create Planning Document
```bash
# Document intent before action
context-network/elements/skills/[domain]/[skill-name]-planning.md
```

### 4. Adapt to Local Structure
```bash
# Copy and adapt
skills/[domain]/[category]/[skill-name]/
```

- Adjust folder structure to match nested convention
- Update SKILL.md if needed for local patterns
- Ensure all scripts are Deno/TypeScript
- Note source attribution in tracking file

### 5. Validate
```bash
cd reference/agentskills/skills-ref
uv run skills-ref validate ../../../skills/[domain]/[category]/[skill-name]
```

### 6. Update Tracking
- Create tracking file in `context-network/elements/skills/`
- Update curation log in `context-network/elements/collections/`

## Adding a New Collection

1. **Document intent** in context network (create planning document)
2. **Get approval** before adding
3. **Add submodule**:
   ```bash
   git submodule add [URL] collections/[collection-name]
   ```
4. **Update this README** with the new collection
5. **Create tracking file** at `context-network/elements/collections/[collection-name].md`
6. **Update index** at `context-network/elements/collections/index.md`

## Updating Collections

Update a specific collection:
```bash
cd collections/[collection-name]
git pull origin main
cd ../..
git add collections/[collection-name]
git commit -m "Update [collection-name] to latest"
```

Update all collections:
```bash
git submodule update --remote --merge
```

## After Cloning This Repository

Initialize submodules after cloning:
```bash
git submodule update --init --recursive
```

## Related Documentation

- **Decision record**: `context-network/decisions/external-collections.md`
- **Collection tracking**: `context-network/elements/collections/index.md`
- **Deno requirement**: `context-network/decisions/deno-runtime-requirement.md`
- **Skill creation process**: `context-network/processes/creation.md`
