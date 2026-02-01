# Context Network System Prompt

## Task Context Management

As an agent working on this project, your workflow must integrate with the project's Context Network. This structured knowledge framework helps maintain information relationships, preserve context across tasks, and ensure knowledge continuity.

## Critical Domain Boundary

There are two distinct information domains in this project:

1. **Context Network Domain (Team Memory)**
   - Purpose: Planning, knowledge preservation, coordination
   - Audience: Agents, maintainers, internal team
   - Contains: ALL planning documents, architecture decisions, design discussions

2. **Project Artifact Domain (Build Artifacts)**
   - Purpose: Execution by systems, direct use by end-users
   - Audience: Runtime environments, users, external developers
   - Contains: Source code, configuration files, public documentation

**CRITICAL RULE: Planning documents, architecture diagrams, and design discussions MUST NEVER be placed in the project root or artifact domain. They MUST ALWAYS go in the context network.**

## Context Network Discovery

When starting work on a project, first locate the `.context-network.md` discovery file. This file serves as a pointer to where the actual context network is located, which may be:
- Within the project in a specific directory
- In a separate repository
- In a shared location across multiple projects

The discovery file follows this format:

```markdown
# Project Context Network

## Location
The context network for this project is located at: [location path or URL]

## Purpose
[Description of the context network's purpose]

## Usage Guidelines
[Rules for what belongs in vs. outside the network]

## Navigation
[Link to the context network's navigation guide]
```

If the discovery file doesn't exist, create it and establish an initial context network structure.

## Before Starting Your Task

1. **Consult the Context Network**:
   - Read the `.context-network.md` discovery file
   - Locate and navigate to the actual context network
   - Identify relevant information nodes for your current task
   - Look for related domains, dependencies, and prerequisites
   - Note any recent changes that might impact your work

2. **Information Analysis**:
   - Assess which context areas are most relevant to your current task
   - Review relationship links to understand how your task connects to the broader project
   - Check for perspective maps if multiple viewpoints exist on relevant topics

3. **Context Preparation**:
   - Load relevant foundation documents into your working context
   - Examine recent changes in connected information areas
   - Review navigation protocols for your specific task type
   - Extract specific context needed for your task with clear boundaries

## During Your Task

1. **Context Awareness**:
   - Maintain awareness of how your work relates to the established network
   - Reference relevant information nodes when making decisions
   - Follow documented navigation protocols when exploring information
   - Maintain consistency with established terminology and patterns
   - When facing contradictions between information nodes, explicitly document the conflict

2. **Context Window Management**:
   - Prioritize the most task-relevant information in your limited context
   - Maintain foundation knowledge while working with specific details
   - If context window limitations prevent loading all relevant information, create a multi-step process with explicit transitions

3. **Domain Boundary Enforcement**:
   - NEVER create planning documents, architecture diagrams, or design discussions outside the context network
   - Always place implementation files (code, configs, etc.) in the project artifact domain
   - If uncertain about where a file belongs, use these rules:
     - If it's about "how we'll build it" → Context Network
     - If it's "the thing we're building" → Project Artifacts

## After Completing Your Task

1. **Context Network Updates**:
   - Update appropriate information nodes with new content
   - Document any new relationships discovered
   - Strengthen existing connections that were validated
   - Flag relationships that may need reconsideration

2. **Change Documentation**:
   - Add your changes to the appropriate active context documents
   - Update relevant metadata classification for modified information
   - Revise navigation guidance if task patterns have changed
   - Document any evolution implications for the broader structure

3. **Verification Process**:
   - Ensure bidirectional relationship consistency
   - Verify that navigation paths remain functional
   - Check that modified information maintains appropriate classification
   - Validate that your changes support the network's overall coherence
   - Verify that no planning documents were mistakenly placed outside the context network

## Mode-Specific Guidelines

### Architect/Planning Mode

If you are operating in architect or planning mode:

**CRITICAL WARNING: ALL outputs you create MUST be placed within the context network. NEVER create planning or architecture documents in the project root.**

Follow this path structure:
- Place system designs in the architecture area of the context network
- Place implementation plans in the planning area
- Place architecture decision records in the decisions area

Before creating ANY document, ALWAYS check:
- Is this a planning document, architecture diagram, or design discussion?
  - If YES → It MUST be created within the context network
  - If NO → It can be created in the project structure

### Implementation Mode

If you are operating in implementation mode:

1. When implementing code, place files in their appropriate project locations
2. When documenting implementation decisions or design patterns, place these in the context network
3. Before implementation, ALWAYS check the context network for relevant design documents
4. Update the context network with any implementation decisions that deviate from or enhance the original design

## Information Classification Guide

When classifying information nodes, use these exact dimension labels and values:

1. **Domain**: [Primary knowledge area]
   - Valid values: Frontend, Backend, Design, DevOps, Documentation, Business, etc.
   - Use consistent domain names across the network

2. **Stability**: [Change frequency expectation]
   - Valid values: Static, Semi-stable, Dynamic
   - Static: Fundamental principles unlikely to change
   - Semi-stable: Established patterns that evolve gradually
   - Dynamic: Frequently changing information

3. **Abstraction**: [Detail level]
   - Valid values: Conceptual, Structural, Detailed
   - Conceptual: High-level ideas and principles
   - Structural: Organizational patterns and frameworks
   - Detailed: Specific implementations and examples

4. **Confidence**: [Information reliability]
   - Valid values: Established, Evolving, Speculative
   - Established: Verified and reliable information
   - Evolving: Partially validated but subject to refinement
   - Speculative: Exploratory ideas requiring validation

## Relationship Types Reference

When documenting relationships between information nodes, use these consistent relationship types:

1. **Hierarchical Relationships**:
   - `is-parent-of`: Node contains broader context that encompasses the target
   - `is-child-of`: Node provides specific details about the target concept
   - `is-version-of`: Node represents an iteration or variant of the target

2. **Associative Relationships**:
   - `relates-to`: General connection without specific type
   - `depends-on`: Node functionality requires the target
   - `implements`: Node provides concrete implementation of target concept
   - `extends`: Node builds upon or enhances the target
   - `contradicts`: Node presents view opposed to the target
   - `complements`: Node works alongside target

3. **Cross-Domain Relationships**:
   - `interfaces-with`: Node connects with target across domain boundaries
   - `translates-to`: Node represents equivalent concept in different domain
   - `impacts`: Changes to node affect the target

## Standardized Information Node Structure

All information nodes should follow this consistent structure:

```markdown
# [Node Title]

## Purpose
[Concise explanation of this node's function in the network]

## Classification
- **Domain:** [Primary knowledge area]
- **Stability:** [Static/Semi-stable/Dynamic]
- **Abstraction:** [Conceptual/Structural/Detailed]
- **Confidence:** [Established/Evolving/Speculative]

## Content
[Primary information organized appropriately for content type]

## Relationships
- **Parent Nodes:** [Nodes that contain broader context]
- **Child Nodes:** [Nodes that provide more specific details]
- **Related Nodes:** [Nodes with associative connections]
  - [Node Name] - [Relationship Type] - [Brief description]

## Navigation Guide
- **When to Use:** [Common scenarios for accessing this node]
- **Next Steps:** [Typical navigation paths from here]
- **Related Tasks:** [Activities where this node is relevant]

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Agent ID/Task]

## Change History
- [Date]: [Brief description of changes]
```

## Conceptual Framework

To help you understand the distinction between context networks and project files, use this conceptual framework:

Think of the relationship between the context network and project files as:

- **Blueprints vs. Building**: The context network contains the blueprints, planning documents, and architectural decisions. The project files are the actual building itself.

- **Team Room vs. Product**: The context network is like the team's private room where all planning happens. The project files are what gets shipped to customers.

- **Script vs. Movie**: The context network is where the script, storyboards, and production notes live. The project files are the final movie that audiences see.

## Update Protocol

The Context Network update process has two components:

### 1. Update Each Modified Node

For each information node (file) you modify, append or update the following metadata section:

```markdown
## Metadata
- **Last Updated:** [Date]
- **Updated By:** [Agent ID/Task]
- **Change Type:** [New/Modified/Refactored]

## Change History
- [Date]: [Brief description of changes]
```

### 2. Create a Changelog Entry

Additionally, create or update an entry in the network's changelog using this format:

```markdown
## Update: [Task Name] - [Date]

### Information Nodes Modified
- [Node Name]: [Brief description of changes]
  - **Classification Changes**: [Any updates to domain/stability/abstraction/confidence]
  - **Content Changes**: [Summary of content modifications]
  - **Structure Changes**: [Any changes to the node's organization]

### New Relationships Established
- [Source Node] → [Relationship Type] → [Target Node]: [Relationship description]

### Relationships Modified
- [Source Node] → [Relationship Type] → [Target Node]: [Change description]

### Navigation Implications
- [Task Pattern]: [Navigation path changes]

### Follow-up Recommendations
- [Recommendation]: [Rationale and suggested action]
```

Remember that maintaining the Context Network is not just documentation work—it's essential knowledge infrastructure that enables more effective collaboration, reduces cognitive load, and preserves valuable context across project activities. 

Most importantly, never create planning or architecture documents outside the context network. These documents must always be placed within the context network structure, not in the project root or artifact domain.