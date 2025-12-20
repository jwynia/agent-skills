# Project Definition

## Purpose
This document defines the core purpose, goals, and scope of the project.

## Classification
- **Domain:** Core Concept
- **Stability:** Static
- **Abstraction:** Conceptual
- **Confidence:** Established

## Content

### Project Overview

This project creates a collection of reusable agent skills following the agentskills.io specification. Agent Skills are a lightweight, open format for extending AI agent capabilities with specialized knowledge and workflows. Each skill is a folder containing a `SKILL.md` file with instructions, metadata, and optional supporting resources (scripts, references, assets).

### Vision Statement

Build a comprehensive library of high-quality, validated agent skills that enable AI agents to perform common tasks effectively across diverse domains.

### Mission Statement

Create, validate, and maintain agent skills that follow the agentskills.io specification, providing agents with clear, actionable instructions for specific tasks. We organize skills for human maintainability during development while ensuring they can be exported to runtime-compatible formats.

### Project Objectives

1. Create agent skills following the agentskills.io specification
2. Validate all skills using the skills-ref reference implementation
3. Organize skills hierarchically for maintainability and bundling flexibility
4. Document skill creation processes for consistency and repeatability

### Success Criteria

1. All created skills pass skills-ref validation
2. Clear, documented processes exist for skill creation, validation, and export
3. Skills are exportable to runtime-compatible flat structure
4. Skills are organized by domain for easy discovery and bundle creation

### Project Scope

#### In Scope

- SKILL.md files with proper YAML frontmatter and markdown instructions
- Supporting scripts, reference documentation, and assets for skills
- Validation and quality assurance processes using skills-ref
- Nested folder organization for development
- Documentation of export process for runtime deployment
- Context network tracking of skill development progress

#### Out of Scope

- Specific agent runtime implementations (Claude Code, Cursor, etc.)
- Hosting or distribution platform infrastructure
- Automated testing of skill effectiveness with live agents
- Commercial licensing or marketplace development

### Stakeholders

| Role | Responsibilities | Representative(s) |
|------|-----------------|-------------------|
| Project Owner | Define priorities, approve skill domains, make strategic decisions | TBD |
| Skill Authors | Create and validate individual skills | TBD |
| Validators | Review skills for quality and spec compliance | TBD |

### Constraints

- Skill names limited to 64 characters (agentskills.io spec requirement)
- Must maintain compatibility with agentskills.io specification
- Nested development structure must be exportable to flat runtime structure
- All skills must pass skills-ref validation
- Progressive disclosure pattern must be followed (metadata → instructions → resources)

### Assumptions

- skills-ref validation library is available and functional
- Export tooling can be developed when needed
- Nested-to-flat transformation can preserve skill functionality
- Naming conventions can accommodate both maintainability and 64-char limit
- Skills will be used by multiple agent implementations (Claude Code, Cursor, etc.)

### Risks

- **Name collision**: Flattening nested structure might create naming conflicts
- **Export complexity**: Tooling for nested-to-flat transformation may be non-trivial
- **Spec evolution**: agentskills.io spec may change, requiring skill updates
- **Validation coverage**: skills-ref may not catch all issues that affect real agent usage
- **Bundle fragmentation**: Without clear bundling strategy, may end up with scattered collection

## Relationships
- **Parent Nodes:** None
- **Child Nodes:** 
  - [foundation/structure.md] - implements - Structural implementation of project goals
  - [foundation/principles.md] - guides - Principles that guide project execution
- **Related Nodes:** 
  - [planning/roadmap.md] - details - Specific implementation plan for project goals
  - [planning/milestones.md] - schedules - Timeline for achieving project objectives

## Navigation Guidance
- **Access Context:** Use this document when needing to understand the fundamental purpose and scope of the project
- **Common Next Steps:** After reviewing this definition, typically explore structure.md or principles.md
- **Related Tasks:** Strategic planning, scope definition, stakeholder communication
- **Update Patterns:** This document should be updated when there are fundamental changes to project direction or scope

## Metadata
- **Created:** 2025-12-19
- **Last Updated:** 2025-12-19
- **Updated By:** Claude (via Context Network Template Adjustment)

## Change History
- 2025-12-19: Updated from generic template to agent skills project definition
