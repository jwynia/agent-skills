# Decision: External Skill Collections via Git Submodules

## Decision ID
external-collections-001

## Date
2025-12-26

## Status
Accepted

## Context

As the agent skills ecosystem grows, valuable skill collections exist in external repositories. We need a mechanism to:
1. Reference external skills for discovery and learning
2. Potentially use external skills directly
3. Curate skills from external sources into our local repository
4. Keep external content synchronized with upstream

**Key constraint**: This project uses Deno/TypeScript exclusively for scripts (see `deno-runtime-requirement.md`). Many external collections include Python scripts that would need conversion before local adoption.

**Challenges**:
- Must maintain clear separation between external and local skills
- Need to track upstream changes without breaking local work
- Should support multiple collections over time
- Must integrate with existing context network patterns

## Decision

**We will use git submodules in a dedicated `/collections/` directory for external skill repositories.**

**Structure**:
```
collections/
├── README.md                    # Usage guide and curation workflow
└── [collection-name]/           # Git submodule
```

**Key aspects**:
- One submodule per external collection
- Collections tracked in context network separately from local skills
- Clear documentation for curation workflow including Python-to-Deno conversion
- Preserves original collection structure and naming

## Rationale

**Benefits of Git Submodules**:
1. **Version Control**: Track specific commits of external repos
2. **Separation**: Clear boundary between external and local content
3. **Updates**: Controlled update mechanism (`git submodule update`)
4. **Attribution**: Preserves original source repository history
5. **Efficiency**: No duplication of upstream content in our history

**Benefits of Dedicated `/collections/` Directory**:
1. **Clarity**: Distinct from `/skills/` (local development)
2. **Staging Area**: Evaluate skills before committing to curation
3. **Extensibility**: Easy to add more collections
4. **Runtime Boundary**: External Python stays isolated from Deno-only local skills

**Trade-offs Accepted**:
- Submodules require extra git commands for cloning/updating
- Contributors must run `git submodule update --init` after clone
- External collections may have different structures than local convention

## Alternatives Considered

### Alternative 1: Copy External Skills Directly
**Description**: Clone external repos and copy skills into `/skills/`
**Pros**: Simple, no submodule complexity
**Cons**: Loses provenance, difficult to track upstream changes, bloats history
**Rejected Because**: Makes curation/attribution harder, no clean sync mechanism

### Alternative 2: Git Subtree
**Description**: Use `git subtree` instead of submodules
**Pros**: No special commands needed for clone, history merged
**Cons**: More complex merge operations, history pollution
**Rejected Because**: Submodules provide cleaner separation for this use case

### Alternative 3: External References Only
**Description**: Just link to external repos in documentation
**Pros**: Simplest, no git complexity
**Cons**: No offline access, no version tracking, manual sync
**Rejected Because**: Insufficient for curation workflow

## Implications

### Immediate
1. Create `/collections/` directory with README
2. Add first submodule (awesome-claude-skills)
3. Create context network tracking for collections
4. Update foundation/structure.md to mention collections

### Curation Workflow
When importing skills from collections:
1. Evaluate skill and dependencies
2. Convert any Python scripts to Deno/TypeScript
3. Document intent in context network
4. Copy and adapt to local structure
5. Validate with skills-ref
6. Track source attribution

### Related Decisions
- `organization-structure.md` - Local skills nesting strategy
- `deno-runtime-requirement.md` - Why scripts must be Deno/TypeScript
- `naming-strategy.md` - How naming applies to curated skills

## Implementation

**Initial Setup**:
```bash
mkdir -p collections
git submodule add https://github.com/ComposioHQ/awesome-claude-skills.git collections/awesome-claude-skills
```

**Tracking**:
- Create `context-network/elements/collections/index.md`
- Create tracking file for each collection

**Documentation Updates**:
- Update project README.md
- Update foundation/structure.md
- Create collections/README.md

## Review Date
After adding 3+ collections or 6 months - reassess if structure is working

## References
- `foundation/structure.md` - Project structure overview
- `elements/collections/index.md` - Collection tracking
- `deno-runtime-requirement.md` - Script runtime decision
- Git submodules documentation: https://git-scm.com/book/en/v2/Git-Tools-Submodules

## Metadata
- **Decision Maker**: Project Team
- **Stakeholders**: Skill developers, curators
- **Impact**: Medium - adds new top-level directory
- **Reversibility**: High - submodules can be removed without affecting local skills

## Change History
- 2025-12-26: Initial decision documented
