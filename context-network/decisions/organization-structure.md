# Decision: Nested Development Structure with Flat Runtime Export

## Decision ID
organization-structure-001

## Date
2025-12-19

## Status
Accepted

## Context

Agent skills follow the agentskills.io specification, which requires a flat folder structure at runtime (each skill folder at the top level). However, as we develop multiple skills across different domains, a flat structure becomes difficult to navigate and maintain.

**Challenge**:
- Spec requires: flat structure for runtime
- Development needs: hierarchical organization for maintainability
- Must support: bundling related skills together

## Decision

**We will use a nested folder structure during development and export to flat structure for runtime deployment.**

**Development Structure**:
```
skills/
├── data-processing/
│   ├── csv/
│   │   └── csv-analyzer/
│   └── json/
│       └── json-validator/
└── web/
    └── scraping/
        └── html-parser/
```

**Runtime Structure** (after export):
```
exported-skills/
├── csv-analyzer/  (or with prefix: data-csv-analyzer/)
├── json-validator/
└── html-parser/
```

## Rationale

**Benefits of Nested Development**:
1. **Discoverability**: Easy to find related skills by browsing folders
2. **Organization**: Natural grouping by domain and category
3. **Maintenance**: Clear structure for adding new skills
4. **Bundling**: Simple to select all skills in a category
5. **Context**: Folder path provides semantic meaning

**Benefits of Flat Runtime**:
1. **Spec Compliance**: Meets agentskills.io requirements
2. **Simplicity**: Agents see simple, flat list of available skills
3. **Performance**: No nested directory traversal
4. **Compatibility**: Works with all agent implementations

**Trade-offs Accepted**:
- Requires export/transformation tooling (to be built)
- Need namespace strategy to avoid name collisions
- Adds build step to workflow

## Alternatives Considered

### Alternative 1: Flat Development Structure
**Description**: Match runtime structure during development
**Pros**: No export needed, what you see is what ships
**Cons**: Difficult to navigate with many skills, no semantic grouping
**Rejected Because**: Doesn't scale, poor developer experience

### Alternative 2: Only Nested (Violate Spec)
**Description**: Use nested structure everywhere, including runtime
**Pros**: Simple, no export needed
**Cons**: Violates agentskills.io spec, incompatible with standard tools
**Rejected Because**: Spec compliance is a hard requirement

### Alternative 3: Symbolic Links
**Description**: Nested development with symlinks to flat export
**Pros**: No build step, instant export
**Cons**: Symlink handling varies by OS/tool, fragile, confusing
**Rejected Because**: Too error-prone, not portable

## Implications

### Immediate
1. Create nested structure in `skills/` directory
2. Document export strategy (even though tool doesn't exist yet)
3. Track export considerations in skill tracking files

### Future
1. Build export tool when we have enough skills to test
2. Choose specific namespace/prefix strategy
3. Integrate export into delivery workflow
4. Potentially automate via CI/CD

### Related Decisions
- `naming-strategy.md` - How to name skills when flattening
- `validation-integration.md` - Validation works on both structures

## Implementation

**Development**:
- Skills created in `skills/[domain]/[category]/[skill-name]/`
- Context network tracks in `elements/skills/`

**Export** (when tool exists):
- Tool reads nested structure
- Applies namespace/prefix strategy
- Outputs flat structure
- Validates exported skills

**Current Workaround**:
- Manual copy and rename if export needed
- Document transformation in context network

## Review Date
When we have 10+ skills - reassess if nesting strategy is working

## References
- `foundation/structure.md` - Project structure overview
- `processes/delivery.md` - Export process documentation
- `reference/agentskills/docs/specification.mdx` - Spec requirements

## Metadata
- **Decision Maker**: Project Team
- **Stakeholders**: Skill developers, tool users
- **Impact**: High - affects all skill organization
- **Reversibility**: Moderate - could flatten development, but disruptive

## Change History
- 2025-12-19: Initial decision documented
