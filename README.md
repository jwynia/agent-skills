# Agent Skills Development

This project creates a collection of reusable [Agent Skills](https://agentskills.io) following the official specification. Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows.

Each skill is a folder containing a `SKILL.md` file with instructions and metadata, plus optional supporting resources (scripts, references, assets). Skills use progressive disclosure to stay context-efficient while providing detailed guidance when needed.

## Project Structure

- **`skills/`** - Actual skill deliverables organized in nested folders by domain
- **`collections/`** - External skill collections as git submodules (reference/curation)
- **`context-network/`** - Planning, processes, decisions, and progress tracking
- **`reference/agentskills/`** - Official specification and validation tools
- **`CLAUDE.md` / `AGENTS.md`** - Collaboration protocols for AI agents

## Quick Links

- **Specification**: `reference/agentskills/docs/specification.mdx`
- **Creation Process**: `context-network/processes/creation.md`
- **Validation**: `context-network/processes/validation.md`
- **Skills Catalog**: `context-network/elements/skills/index.md`
- **Project Principles**: `context-network/foundation/principles.md`

## Development vs. Runtime

**Development** (this repo):
- Nested folder organization (`skills/domain/category/skill-name/`)
- Human-friendly structure for maintainability
- Tracked in context network

**Runtime** (export target):
- Flat folder structure (spec requirement)
- Export tooling to be developed
- Naming strategy to be finalized

## External Collections

External skill collections are tracked as git submodules in `/collections/`. These provide:
- Reference implementations for learning
- Source material for curation into local skills
- Direct use if compatible with your platform

**Current collections**:
- `collections/awesome-claude-skills/` - ComposioHQ curated skills (25+)

**After cloning, initialize submodules**:
```bash
git submodule update --init --recursive
```

**Curation note**: This project uses Deno/TypeScript exclusively for scripts. When curating skills from external collections, convert any Python scripts to Deno/TypeScript before importing.

See `collections/README.md` for detailed usage and curation workflow.

## Creating a Skill

1. **Plan First** - Document intent in `context-network/elements/skills/[domain]/[skill-name]-planning.md`
2. **Create Structure** - Make folder in `skills/[domain]/[category]/[skill-name]/`
3. **Write SKILL.md** - Use template in `context-network/meta/templates/skill-md-starter.md`
4. **Validate** - Run `skills-ref validate ./skills/path/to/skill`
5. **Document** - Update tracking file and catalog indexes

See `context-network/processes/creation.md` for detailed workflow.

## Validation

**All skills MUST pass validation before completion:**

```bash
cd reference/agentskills/skills-ref
skills-ref validate ../../skills/[domain]/[category]/[skill-name]
```

See `context-network/processes/validation.md` for validation procedures.

## Key Principles

- **Specification Compliance** - All skills follow agentskills.io spec
- **Validation-First** - Run skills-ref early and often
- **Progressive Disclosure** - Keep SKILL.md < 500 lines, details in references
- **Atomic Skills** - Each skill does one thing well
- **Intent-Before-Action** - Document in context network before creating
- **Quality Over Quantity** - Thorough validation beats rapid expansion

See `context-network/foundation/principles.md` for complete principles.

## Context Network

This project uses a [context network](https://jwynia.github.io/context-networks/) for planning, coordination, and session resilience. The context network ensures:

- Plans are documented before execution
- Progress survives session resets
- Decisions are recorded with rationale
- Quality standards are maintained

See `.context-network.md` for location and `context-network/discovery.md` for navigation.

## Agent Collaboration

This project is designed to work with AI agents (Claude Code, Cursor, Cline, etc.) that have file access. Agents should:

1. Read `CLAUDE.md` or `AGENTS.md` for collaboration protocols
2. Check context network before starting work
3. Document intent before taking action
4. Update tracking as work progresses
5. Validate all skills before marking complete

**Agent platforms** that work well with this project:
- [Claude Code](https://claude.com/code) - CLI tool from Anthropic
- [Cursor](https://cursor.com) - AI-native IDE
- [Cline](https://cline.bot/) - VS Code extension
- Any agent with file system access and context network support

**Validation tooling**:
- `reference/agentskills/skills-ref/` - Official validation library
- Python-based CLI for validating SKILL.md files

## Current Skills

See `context-network/elements/skills/index.md` for the complete skills catalog.

**Status**: Project template configured, ready for skill development.

## Contributing

### Before Creating a Skill

1. Check the catalog - avoid duplicates
2. Review principles - ensure alignment
3. Plan first - use the planning template
4. Get approval - discuss scope and approach

### Creating Your First Skill

Start with the creation process:
1. Read `context-network/processes/creation.md`
2. Use `context-network/meta/templates/skill-planning-template.md`
3. Follow the validation requirements
4. Update the catalog when complete

### Questions?

- **Process questions**: See `context-network/processes/`
- **Decision rationale**: See `context-network/decisions/`
- **Quality standards**: See `context-network/foundation/principles.md`
- **Specification details**: See `reference/agentskills/docs/specification.mdx`

## License

[Specify project license]

## References

- [Agent Skills Specification](https://agentskills.io)
- [Context Networks](https://jwynia.github.io/context-networks/)
- [skills-ref Validation Tool](reference/agentskills/skills-ref/)

## Metadata

- **Created**: 2025-12-19
- **Last Updated**: 2025-12-26
- **Status**: Template configured, ready for skill development