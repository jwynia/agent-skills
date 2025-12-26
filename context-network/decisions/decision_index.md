# Decision Record Index

## Purpose
This document serves as an index of all key decisions made for the project, providing a centralized registry for easy reference and navigation.

## Classification
- **Domain:** Documentation
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### Decision Records

| ID | Title | Status | Date | Domain | Summary |
|----|-------|--------|------|--------|---------|
| organization-structure-001 | Nested Dev Structure with Flat Export | Accepted | 2025-12-19 | Architecture | Use nested folders for development, flat for runtime |
| deno-runtime-requirement-001 | Deno/TypeScript for Scripts | Accepted | 2025-12-19 | Architecture | All skill scripts must use Deno/TypeScript only |
| validation-integration-001 | skills-ref Validation | Accepted | 2025-12-19 | Process | Use skills-ref CLI for validating all skills |
| naming-strategy-001 | Naming Strategy | Deferred | 2025-12-19 | Architecture | Namespace/prefix strategy deferred until 10-15 skills |
| external-collections-001 | External Collections via Submodules | Accepted | 2025-12-26 | Architecture | Use git submodules in /collections/ for external skill repos |

### Decision Status Legend

- **Proposed**: A decision that is under consideration but not yet accepted
- **Accepted**: A decision that has been accepted and is currently in effect
- **Deprecated**: A decision that is no longer recommended but still in effect
- **Superseded**: A decision that has been replaced by a newer decision

### Decision Categories

#### By Domain
<!-- Categories should be customized based on project type -->

<!-- For Software Projects -->
- **Frontend**: [List of decision IDs related to frontend]
- **Backend**: [List of decision IDs related to backend]
- **DevOps**: [List of decision IDs related to DevOps]
- **Data**: [List of decision IDs related to data]
- **Security**: [List of decision IDs related to security]
- **Architecture**: [List of decision IDs related to overall architecture]

<!-- For Research Projects -->
- **Methodology**: [List of decision IDs related to research methodology]
- **Data Collection**: [List of decision IDs related to data collection]
- **Analysis**: [List of decision IDs related to analysis approaches]
- **Interpretation**: [List of decision IDs related to interpretation frameworks]

<!-- For Creative Projects -->
- **Narrative**: [List of decision IDs related to narrative structure]
- **Characters**: [List of decision IDs related to character development]
- **Setting**: [List of decision IDs related to setting design]
- **Style**: [List of decision IDs related to stylistic choices]

<!-- For Knowledge Base Projects -->
- **Structure**: [List of decision IDs related to knowledge organization]
- **Content**: [List of decision IDs related to content creation]
- **Access**: [List of decision IDs related to access patterns]
- **Integration**: [List of decision IDs related to external integrations]

#### By Status
- **Proposed**: [List of decision IDs with proposed status]
- **Accepted**: [List of decision IDs with accepted status]
- **Deprecated**: [List of decision IDs with deprecated status]
- **Superseded**: [List of decision IDs with superseded status]

### Decision Relationships

[This section will contain a visualization or description of how decisions relate to each other]

## Relationships
- **Parent Nodes:** [foundation/structure.md]
- **Child Nodes:** [All individual decision records]
- **Related Nodes:** 
  - [processes/creation.md] - relates-to - Creation processes affected by decisions
  - [foundation/principles.md] - implements - Decisions implement project principles

## Navigation Guidance
- **Access Context:** Use this document when looking for specific key decisions or understanding decision history
- **Common Next Steps:** From here, navigate to specific decision records of interest
- **Related Tasks:** Project review, onboarding new team members, planning new work, understanding rationale
- **Update Patterns:** This index should be updated whenever a new decision is added or a decision status changes

## Metadata
- **Created:** 2025-12-19
- **Last Updated:** 2025-12-26
- **Updated By:** Claude

## Change History
- 2025-12-26: Added external-collections-001, populated decision table
- 2025-12-19: Initial creation of decision index
