# Context Network Navigation Guide

## Overview

This context network contains all planning documents, conceptual work, and coordination information for the project. It is organized into a hierarchical structure to facilitate navigation, scalability, and information discovery.

## Structure

The context network is organized as follows:

```
context-network/
├── discovery.md                # This navigation guide
├── foundation/                 # Core project information
│   ├── index.md                # Foundation section index
│   ├── project_definition.md   # Main project purpose and goals
│   ├── structure.md            # Project structure overview
│   └── principles.md           # Guiding principles and standards
├── elements/                   # Domain-specific information
│   ├── index.md                # Elements section index
│   └── [element categories]/   # Element category folders
│       ├── index.md            # Category index
│       ├── [subcategories]/    # Optional subcategories
│       │   ├── index.md        # Subcategory index
│       │   └── [item files]    # Individual items
│       └── [item files]        # Category-level items
├── processes/                  # Process documentation
│   ├── index.md                # Processes section index
│   ├── creation.md             # Creation workflows
│   ├── validation.md           # Validation procedures
│   ├── delivery.md             # Delivery processes
│   └── document_integration.md # Process for integrating inbox documents
├── decisions/                  # Key decisions
│   ├── index.md                # Decisions section index
│   └── [individual decision records]
├── planning/                   # Planning documents
│   ├── index.md                # Planning section index
│   ├── roadmap.md              # Project roadmap
│   └── milestones.md           # Milestone definitions
├── connections/                # Cross-cutting concerns
│   ├── index.md                # Connections section index
│   ├── dependencies.md         # Dependencies between elements
│   └── interfaces.md           # Interface definitions
├── meta/                       # Information about the network itself
│   ├── index.md                # Meta section index
│   ├── updates/                # Updates tracking (hierarchical)
│   │   ├── index.md            # Updates index
│   │   └── [category folders]  # Update categories
│   ├── maintenance.md          # Network maintenance procedures
│   ├── hierarchical_implementation_guide.md  # Guide for hierarchical structure
│   └── templates/              # Templates for creating content
│       ├── main_index_template.md     # For top-level indexes
│       ├── category_index_template.md # For category indexes
│       ├── subcategory_index_template.md # For subcategory indexes
│       └── item_template.md    # For individual items
└── archive/                    # Archived documents from the inbox
```

## Hierarchical Organization

This context network implements a hierarchical file organization pattern to:

1. Improve navigation and discoverability of information
2. Enhance scalability as content grows
3. Facilitate collaboration with clear organization
4. Support detailed categorization of related content
5. Provide multiple entry points and navigation paths

The hierarchical structure is implemented through:

1. **Index Files**: Each directory has an index.md file that provides an overview and navigation to content within that section
2. **Categories**: Content is organized into logical categories
3. **Subcategories**: Where needed, categories are further divided into subcategories
4. **Individual Items**: Specific content is stored in individual files for better maintenance

For detailed guidance on when and how to implement hierarchical organization, see `meta/hierarchical_implementation_guide.md`.

## Navigation Paths

### For New Project Members
1. Start with `foundation/index.md` to get an overview of foundation materials
2. Review `foundation/project_definition.md` to understand the project's purpose
3. Explore `foundation/principles.md` to understand guiding principles
4. Check `planning/index.md` and then `planning/roadmap.md` to understand current priorities

### For Creating New Elements
1. Start with `elements/index.md` to understand the overall elements structure
2. Review relevant element category index in `elements/[category]/index.md`
3. Check `connections/dependencies.md` for integration points
4. Review applicable decision records through `decisions/index.md`
5. Follow the process in `processes/creation.md`

### For Understanding Key Decisions
1. Start with `decisions/index.md`
2. Navigate to specific decision records of interest
3. Review related structure documentation in `foundation/structure.md`

### For Document Integration
1. Follow the process outlined in `processes/document_integration.md`
2. Update relevant sections of the context network
3. Record changes in `meta/updates/index.md` and appropriate category
4. Archive processed documents in `archive/`

## Creating New Content

When creating new content:

1. Determine the appropriate section, category, and (if needed) subcategory
2. Use the appropriate template from `meta/templates/`:
   - Use `main_index_template.md` for section indexes
   - Use `category_index_template.md` for category indexes
   - Use `subcategory_index_template.md` for subcategory indexes
   - Use `item_template.md` for individual content items
3. Update the relevant index files to include references to the new content
4. Add appropriate cross-references to related content

## When to Apply Hierarchical Structure

Consider breaking down a file into a hierarchical structure when:

1. The file exceeds 1000 lines or 50KB
2. The content covers multiple distinct categories or topics
3. Information is frequently added and likely to continue growing
4. Navigation within a single file becomes challenging
5. Different sections need to be referenced individually

See `meta/hierarchical_implementation_guide.md` for detailed guidance.

## Maintenance

This context network is maintained according to the procedures documented in `meta/maintenance.md`. All changes to the network structure should be recorded in `meta/updates/index.md`.

## Classification System

Information nodes in this context network are classified along these dimensions:

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
