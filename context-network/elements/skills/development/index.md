# Development Skills

Skills for software development workflows, architecture, and team coordination.

## Overview

This domain covers skills that help agents:
- Coordinate multi-agent development workflows
- Manage agile processes and task orchestration
- Handle code architecture decisions
- Support development team practices

## Skills in this Domain

| Skill | Category | Status | Description |
|-------|----------|--------|-------------|
| [agile-coordinator](agile-coordinator.md) | workflow | Complete | Multi-agent task orchestration for agile workflows |
| electron-best-practices | best-practices | Complete | Electron + React desktop app development best practices |
| npm-package | tooling | Complete | Build and publish npm packages using Bun as primary toolchain |
| npx-cli | tooling | Complete | Build and publish npx-executable CLI tools using Bun |
| scraper-builder | tooling | Complete | Generate PageObject pattern web scrapers with Playwright and Docker |

## Categories

### Workflow
Skills for managing development workflows and processes.

- **agile-coordinator**: Orchestrates multiple worker agents to implement groomed tasks from a backlog. Coordinates task assignment, progress monitoring, merge sequencing, and post-merge verification.

### Best Practices
Skills providing coding standards, architecture patterns, and tooling guidance for specific technology stacks.

- **electron-best-practices**: Guides agents through Electron + React desktop app development including security patterns, type-safe IPC, packaging with code signing, and testing.

### Tooling
Generator skills that scaffold projects and generate code for specific technology domains.

- **npm-package**: Builds and publishes npm packages using Bun as the primary toolchain with npm-compatible output. Covers scaffolding, strict TypeScript, Biome + ESLint linting, Vitest testing, Bunup bundling, and publishing workflows.
- **npx-cli**: Builds and publishes npx-executable CLI tools using Bun as the primary toolchain. Covers citty argument parsing, sub-commands, terminal UX, strict TypeScript, and publishing workflows.
- **scraper-builder**: Generates complete PageObject pattern web scraper projects using Playwright and TypeScript with Docker deployment. Supports agent-browser site analysis for automated selector discovery.

## Quick Stats

- **Total Skills**: 5
- **Complete**: 5
- **In Progress**: 0
- **Planning**: 0

## Skill Locations

| Skill | Path |
|-------|------|
| agile-coordinator | `skills/development/workflow/agile-coordinator/` |
| electron-best-practices | `.claude/skills/electron-best-practices/` |
| npm-package | `skills/tech/development/tooling/npm-package/` |
| npx-cli | `skills/tech/development/tooling/npx-cli/` |
| scraper-builder | `skills/tech/development/tooling/scraper-builder/` |

## Dependencies

- **agile-coordinator**: Orchestrates the `agile-workflow` skill, requires GitHub CLI for PR operations

## Future Considerations

Potential future skills in this domain:
- Code review automation
- Architecture decision records
- Technical debt tracking
- Release management

## Metadata

- **Created**: 2026-01-20
- **Last Updated**: 2026-02-15
- **Updated By**: Claude
- **Skills Count**: 5
