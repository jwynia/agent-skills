# Context Network Integration Rules

## Critical Domain Boundary

There are two distinct information domains in projects:

1. **Context Network Domain (Team Memory)**
   - Purpose: Planning, coordination, knowledge preservation
   - Audience: Agents, maintainers, internal team
   - Contains: ALL planning documents, key decisions, design discussions

2. **Project Artifact Domain (Build Artifacts)**
   - Purpose: Execution by systems, direct use by end-users
   - Audience: Runtime environments, users, external developers
   - Contains: Source code, configuration files, public documentation

**CRITICAL RULE: NEVER create planning documents, structure diagrams, or design discussions in the project root or artifact domain. These MUST be placed in the context network.**

## Discovery and Initialization

1. At the start of each task, check for a `.context-network.md` discovery file in the project root.

2. If a `.context-network.md` exists:
   - Read the file to determine the actual location of the context network
   - The location may be specified in a "Location" section
   - The context network could be within the project in a specific directory, in a separate repository, or in a shared location

3. If no `.context-network.md` exists, create one with this structure:
   ```markdown
   # Project Context Network

   ## Location
   The context network for this project is located at: ./context-network/

   ## Purpose
   This context network contains all planning documents, conceptual work, and coordination information.

   ## Usage Guidelines
   - ALL planning documents, conceptual models, and design discussions MUST be stored within the context network
   - Do NOT place planning or conceptual documents in the project root
   - Project files outside the context network should only be files that constitute the actual project deliverables

   ## Navigation
   See the context network's navigation guide at [LOCATION]/discovery.md
   ```

4. Then create the context network structure in the specified location (defaulting to "./context-network/" if nothing else was specified):
   ```
   [LOCATION]/
   ├── discovery.md              # Navigation guide for the network
   ├── foundation/               # Core project information
   │   ├── project_definition.md # Main project purpose and goals
   │   ├── structure.md          # Project structure overview
   │   └── principles.md         # Guiding principles and standards
   ├── elements/                 # Element-specific information
   │   ├── element_a/            # Information for element A
   │   └── element_b/            # Information for element B
   ├── processes/                # Process documentation
   │   ├── creation.md           # Creation workflows
   │   ├── validation.md         # Validation procedures
   │   └── delivery.md           # Delivery processes
   ├── decisions/                # Key decisions
   │   ├── decision_001.md       # Individual decision records
   │   └── decision_index.md     # Index of all decisions
   ├── planning/                 # Planning documents
   │   ├── roadmap.md            # Project roadmap
   │   └── milestones.md         # Milestone definitions
   ├── connections/              # Cross-cutting concerns
   │   ├── dependencies.md       # Dependencies between elements
   │   └── interfaces.md         # Interface definitions
   ├── meta/                     # Information about the network itself
   │   ├── updates.md            # Record of network changes
   │   └── maintenance.md        # Network maintenance procedures
   └── archive/                  # Archived documents from the inbox
   ```

5. Notify the user when creating a new context network.

## Context-Aware Workflow

### Before Task Execution
1. Read the `.context-network.md` discovery file
2. Navigate to the actual context network location it specifies
3. Review the context network's discovery.md navigation guide
4. Load relevant foundation documents into your working context
5. Identify information nodes relevant to your current task
6. Note recent changes documented in meta/updates.md that might impact your work

### During Task Execution
1. Maintain awareness of how your work relates to the established network
2. Reference specific information nodes when making decisions
3. Follow documented navigation protocols within the network
4. Maintain consistency with established terminology and patterns
5. Document conflicts between information nodes when encountered

### After Task Completion
1. Update appropriate information nodes with new content
2. Document new relationships discovered during the task
3. Strengthen existing connections that were validated
4. Update meta/updates.md with your changes
5. For significant changes to the network structure, update the discovery.md navigation guide

## Information Classification System

When classifying information nodes, use these dimension labels:

1. **Domain**: [Primary knowledge area]
   - Examples: Core Concept, Supporting Element, External Factor, Resource, Output
   - Project-specific examples might include: Research, Design, Content, Process, Outcome

2. **Stability**: [Change frequency expectation]
   - Static: Fundamental principles unlikely to change
   - Semi-stable: Established patterns that evolve gradually
   - Dynamic: Frequently changing information

3. **Abstraction**: [Detail level]
   - Conceptual: High-level ideas and principles
   - Structural: Organizational patterns and frameworks
   - Detailed: Specific implementations and examples

4. **Confidence**: [Information reliability]
   - Established: Verified and reliable information
   - Evolving: Partially validated but subject to refinement
   - Speculative: Exploratory ideas requiring validation

## Standard Information Node Structure

Use this structure for all information nodes:

```markdown
# [Node Title]

## Purpose
[Concise explanation of this node's function]

## Classification
- **Domain:** [Primary knowledge area]
- **Stability:** [Static/Semi-stable/Dynamic]
- **Abstraction:** [Conceptual/Structural/Detailed]
- **Confidence:** [Established/Evolving/Speculative]

## Content
[Primary information organized appropriately]

## Relationships
- **Parent Nodes:** [Broader context nodes]
- **Child Nodes:** [More detailed nodes]
- **Related Nodes:** [Nodes with associative connections]
  - [Node Name] - [Relationship Type] - [Brief description]

## Navigation Guide
- **When to Use:** [Access scenarios]
- **Next Steps:** [Typical navigation paths]
- **Related Tasks:** [Activities where relevant]

## Metadata
- **Created:** [Date]
- **Last Updated:** [Date]
- **Updated By:** [Agent ID/Task]

## Change History
- [Date]: [Brief description of changes]
```

## Relationship Types Reference

Use these standardized relationship types:

1. **Hierarchical Relationships**:
   - `is-parent-of`: Node contains broader context
   - `is-child-of`: Node provides specific details
   - `is-version-of`: Node represents a variant

2. **Associative Relationships**:
   - `relates-to`: General connection
   - `depends-on`: Node requires the target
   - `implements`: Node concretely implements target
   - `extends`: Node builds upon target
   - `contradicts`: Node presents opposing view
   - `complements`: Node works alongside target

3. **Cross-Element Relationships**:
   - `interfaces-with`: Node connects across elements
   - `translates-to`: Equivalent concept in different element
   - `impacts`: Changes to node affect target

## Context Window Management

1. When context limitations prevent loading all relevant information:
   - Prioritize task-critical information in your limited context
   - Maintain foundation knowledge while working with specific details
   - Create a multi-step process with explicit transitions
   - Document what information was excluded due to limitations

2. For multi-agent workflows:
   - Include explicit context handoff protocols
   - Document which context elements were used and which were modified
   - Reference specific nodes that future agents should consult

## Change Documentation

After completing a task, update the meta/updates.md file with a changelog entry:

```markdown
## Context Network Update: [Task Name] - [Date]

### Information Nodes Modified
- [Node Name]: [Brief description of changes]
  - **Classification Changes**: [Updates to metadata]
  - **Content Changes**: [Content modifications]
  - **Structure Changes**: [Organization changes]

### New Relationships Established
- [Source Node] → [Relationship Type] → [Target Node]: [Description]

### Relationships Modified
- [Source Node] → [Relationship Type] → [Target Node]: [Description]

### Navigation Implications
- [Task Pattern]: [Navigation path changes]

### Follow-up Recommendations
- [Recommendation]: [Rationale and suggested action]
```

## Verification Process

Before completing a task, verify the following:
1. Bidirectional relationship consistency is maintained
2. Navigation paths remain functional after your changes
3. Modified information maintains appropriate classification
4. Your changes support the network's overall coherence
5. The boundary between context network and project artifacts is preserved:
   - ALL planning documents, structure diagrams, and design discussions are in the context network
   - ONLY code, configuration, and implementation files are in the project artifact domain
   - NO planning or conceptual documents in the project root

## Mode-Specific Guidelines

### Conceptual/Planning Mode

If you are operating in conceptual or planning mode:

**CRITICAL WARNING: ALL outputs you create MUST be placed within the context network. NEVER create planning or conceptual documents in the project root.**

Follow this path structure:
- Place system designs in foundation/structure.md or elements/*/structure.md
- Place implementation plans in planning/
- Place key decision records in decisions/
- Place process documentation in processes/

### Implementation Mode

If you are operating in implementation mode:

1. When implementing code, place files in their appropriate project locations
2. When documenting implementation decisions or design patterns, place these in the context network
3. Before implementation, ALWAYS check the context network for relevant design documents
4. Update the context network with any implementation decisions that deviate from the original design
