# Project Principles

## Purpose
This document outlines the core principles and standards that guide decision-making and development across the project.

## Classification
- **Domain:** Core Concept
- **Stability:** Static
- **Abstraction:** Conceptual
- **Confidence:** Established

## Content

### Core Values

The project is guided by these fundamental values:

1. **Quality Over Quantity**
   Skills must be well-crafted, validated, and genuinely useful. We prioritize thorough development over rapid expansion.

2. **Clarity Over Cleverness**
   Instructions should be clear and actionable. Simple, explicit guidance is better than concise but ambiguous directions.

3. **Maintainability Over Minimalism**
   Nested folder structure for human understanding is more valuable than minimal file count. We optimize for long-term maintenance.

### Design Principles

1. **Specification Compliance**
   All skills MUST conform to the agentskills.io specification. This ensures compatibility across agent implementations.

   *Example:* Every SKILL.md includes valid YAML frontmatter with required `name` and `description` fields, validated by skills-ref.

2. **Progressive Disclosure**
   Structure skills for efficient context use: metadata first (lightweight), then instructions (detailed), then resources (on-demand).

   *Example:* A PDF processing skill keeps the main SKILL.md under 500 lines, moving detailed API documentation to `references/pdf-api.md`.

3. **Atomic Skills**
   Each skill does one thing well. Complex workflows are achieved by composing multiple focused skills, not by creating monolithic instructions.

   *Example:* Separate skills for "extract-pdf-text", "extract-pdf-tables", and "merge-pdfs" rather than one "pdf-processing" mega-skill.

4. **Clear Descriptions**
   Skill descriptions must indicate both WHAT the skill does and WHEN to use it, including relevant keywords for agent discovery.

   *Example:* "Extracts text and tables from PDF files. Use when working with PDF documents or when the user mentions PDFs, forms, or document extraction."

5. **Intent-Before-Action**
   ALWAYS document what you're going to do in the context network BEFORE doing it. This ensures context accuracy across session resets and provides a recoverable plan if work is interrupted.

   *Example:* Before creating a new skill, write a planning document in `context-network/elements/skills/[domain]/[skill-name]-planning.md`. Only after the plan is documented should you create the actual SKILL.md file.

### Standards and Guidelines

#### Quality Standards

- **Validation-First**: All skills MUST pass skills-ref validation before completion
- **Examples Required**: Every skill must include concrete examples of inputs, actions, and expected outputs
- **Edge Cases Documented**: Common issues and error scenarios must be addressed in instructions
- **Manual Testing**: Instructions must be tested by following them step-by-step before finalization

#### Structural Standards

- **Naming Conventions**: Skill names must be lowercase, use hyphens (not underscores), max 64 characters
- **File Organization**: Follow SKILL.md + optional `scripts/`, `references/`, `assets/` structure
- **Context Budget**: Main SKILL.md under 500 lines (recommended), detailed content in reference files
- **Nested Development**: Organize by domain/category, export to flat structure for runtime

#### Documentation Standards

- **Context Network First**: Document intent in context network before creating/modifying skills
- **Decision Records**: All significant decisions must be captured in context network
- **Tracking Updates**: Skill status and validation results tracked in context network
- **Change Attribution**: Update metadata and change history for all modifications

#### Discoverability Standards

- **Rich Descriptions**: Include what, when, and keywords in description field
- **Domain Organization**: Logical categorization by domain and subcategory
- **Catalog Maintenance**: Keep skills catalog index up-to-date
- **Cross-References**: Link related skills and dependencies

### Process Principles

1. **Validation-First Development**
   Run skills-ref validation early and often during skill development. Don't wait until the end to discover spec violations.

2. **Incremental Documentation**
   Update the context network as you work, not just at completion. Document discoveries and decisions in real-time.

3. **Collaborative Decision-Making**
   Pause for user input when facing design choices, architectural decisions, or ambiguous requirements.

### Decision-Making Framework

When making decisions about skills, consider:

#### Decision Criteria

- **Spec Compliance**: Does this comply with agentskills.io specification?
- **Agent Usability**: Will agents be able to follow these instructions effectively?
- **Maintainability**: Can humans understand and modify this later?
- **Exportability**: Will this work when transformed to flat structure?
- **Context Efficiency**: Does this follow progressive disclosure principles?

#### Trade-off Considerations

- **Detail vs. Brevity**: Prefer clarity over conciseness when instructions are ambiguous
- **Nesting vs. Flatness**: Use nesting for development maintainability, flatten for runtime
- **Atomicity vs. Convenience**: Split complex skills even if it means more total files
- **Validation vs. Speed**: Always run validation even if it slows development

### Principle Application

#### When Principles Conflict

1. **Spec compliance always wins**: If a principle conflicts with the agentskills.io spec, follow the spec
2. **Quality over speed**: If maintaining quality requires more time, take the time
3. **User intent over assumptions**: When unclear, ask rather than assume
4. **Document the conflict**: Record the conflict and resolution in a decision record

#### Exceptions to Principles

Exceptions should be rare and well-documented:

- **Context Budget**: May exceed 500 lines if skill genuinely requires it and cannot be split
- **Naming Length**: No exception - 64 char limit is a hard constraint from the spec
- **Validation**: No exception - all skills must pass skills-ref validation

## Relationships
- **Parent Nodes:** [foundation/project_definition.md]
- **Child Nodes:** None
- **Related Nodes:** 
  - [foundation/structure.md] - implements - Project structure implements these principles
  - [processes/creation.md] - guided-by - Creation processes follow these principles
  - [decisions/*] - evaluated-against - Decisions are evaluated against these principles

## Navigation Guidance
- **Access Context:** Use this document when making significant decisions or evaluating options
- **Common Next Steps:** After reviewing principles, typically explore structure.md or specific decision records
- **Related Tasks:** Decision-making, design reviews, code reviews, process definition
- **Update Patterns:** This document should be updated rarely, only when fundamental principles change

## Metadata
- **Created:** 2025-12-19
- **Last Updated:** 2025-12-19
- **Updated By:** Claude (via Context Network Template Adjustment)

## Change History
- 2025-12-19: Updated from generic template to agent skills principles
