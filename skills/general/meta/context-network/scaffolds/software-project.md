# Software Project Scaffold

Directory structure and initial content for software development projects.

## Directory Structure

```
context/
├── status.md              # Current state, active work
├── decisions.md           # Architecture decisions
├── glossary.md            # Domain vocabulary, conventions
├── architecture/          # System design
│   ├── overview.md        # High-level architecture
│   └── [component].md     # Per-component details
├── domains/               # Domain-specific context
│   ├── [domain-1]/        # e.g., api/, frontend/, data/
│   └── [domain-2]/
└── processes/             # Development workflows
    ├── development.md     # Dev workflow, local setup
    ├── deployment.md      # Deploy process
    └── testing.md         # Test strategy
```

## Common Domains

Adapt based on project type:

| Project Type | Typical Domains |
|--------------|-----------------|
| Full-stack web | `api/`, `frontend/`, `database/`, `infra/` |
| CLI tool | `core/`, `commands/`, `config/` |
| Library | `core/`, `api/`, `examples/` |
| Microservices | `services/`, `shared/`, `infra/` |
| Mobile app | `app/`, `api/`, `assets/` |

## Initial File Content

### status.md

```markdown
# Project Status

## Current State

Project initialized. Context network established.

## Active Work

- [ ] Initial project setup
- [ ] Define core architecture

## Recent Changes

| Date | Change | Impact |
|------|--------|--------|
| {{today}} | Context network created | Persistent context now available |

## Next Steps

1. Document initial architecture decisions
2. Set up development workflow

---

*Last updated: {{today}}*
```

### architecture/overview.md

```markdown
# Architecture Overview

## Purpose

High-level view of system architecture. Entry point for understanding how components fit together.

## Classification

- **Domain:** Architecture
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Evolving

## System Diagram

{{Add architecture diagram or ASCII representation}}

## Components

| Component | Purpose | Technology |
|-----------|---------|------------|
| {{name}} | {{what it does}} | {{stack}} |

## Data Flow

{{How data moves through the system}}

## Relationships

### Related Nodes
- decisions.md - implements - architectural decisions documented here
- domains/* - is-parent-of - detailed component documentation

## Navigation

**When to access:**
- Starting work on new feature
- Understanding system boundaries
- Onboarding to project

**Next steps:**
- Specific component docs in `domains/`
- Implementation decisions in `decisions.md`
```

## Bootstrap Questions

When setting up a software project, ask:

1. **What's the primary technology stack?**
   - Affects vocabulary, conventions, domain structure

2. **Is this greenfield or existing codebase?**
   - Existing: scan for documentation to migrate
   - Greenfield: lighter initial structure

3. **Team size?**
   - Solo: lighter process docs
   - Team: more explicit conventions, workflows

4. **Deployment model?**
   - Affects infra documentation needs
   - CI/CD process documentation

## Integration Notes

- Link to source code via relative paths when referencing implementations
- Keep architecture docs in sync with actual structure
- Update status.md at session boundaries
