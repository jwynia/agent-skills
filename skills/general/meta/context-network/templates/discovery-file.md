# .context-network.md Template

Use this template to create the discovery file at your project root.

---

```markdown
# Project Context Network

## Location

The context network for this project is located at: `./context/`

## Purpose

This context network maintains persistent knowledge about {{PROJECT_NAME}}:
- Project state and active work
- Architecture and design decisions
- Domain-specific documentation
- Vocabulary and conventions

## Audience

- **Agents**: AI assistants working on this project
- **Maintainers**: Developers contributing to the codebase
- **Future self**: Context preservation across sessions

## What Belongs Here vs. Project Root

| Context Network (`context/`) | Project Root |
|------------------------------|--------------|
| Planning documents | Source code |
| Architecture decisions | Configuration files |
| Design discussions | User-facing documentation |
| Internal documentation | Build artifacts |
| Process documentation | Tests |

**Rule**: If it's about "how we'll build it" → Context Network. If it's "the thing we're building" → Project Root.

## Navigation

Start here:
- **Current state**: `context/status.md`
- **Key decisions**: `context/decisions.md`
- **Vocabulary**: `context/glossary.md`

## Agent Instructions

See `CLAUDE.md` for agent-specific guidance on using this context network.
```

---

## Customization Notes

Replace:
- `{{PROJECT_NAME}}` with your project name
- Add project-specific navigation links as the network grows
- Extend "What Belongs Here" table with project-specific examples
