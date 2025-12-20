# Skill Delivery Process

## Purpose

This document defines the export and deployment process for transforming nested development skills into flat runtime structure.

## Classification
- **Domain:** Process
- **Stability:** Dynamic
- **Abstraction:** Structural
- **Confidence:** Evolving

## Content

### Current Status

**Export tooling**: To be developed when needed
**Current process**: Manual export if required

### Nested to Flat Transformation

**Development Structure** (current):
```
skills/
├── data-processing/
│   └── csv/
│       └── csv-analyzer/
│           └── SKILL.md (name: csv-analyzer)
```

**Runtime Structure** (export target):
```
exported-skills/
└── csv-analyzer/  (or prefixed: data-csv-analyzer/)
    └── SKILL.md
```

### Export Strategies (To Be Decided)

Three potential approaches documented for future export tool development:

**1. Prefix Approach**
- Add domain prefix to skill name
- Example: `csv-analyzer` → `data-csv-analyzer`
- Pros: Clear namespace, prevents collisions
- Cons: Longer names, may hit 64 char limit

**2. Short Code Approach**
- Define 2-3 char codes per category
- Example: `dp-csv-analyzer` (dp = data-processing)
- Pros: Shorter names, systematic
- Cons: Requires code registry, less readable

**3. Manifest-Based Bundling**
- Export with original names
- Bundle manifest tracks source paths
- Pros: Preserves short names, flexible bundling
- Cons: Requires manifest management

**Decision**: Deferred until we have enough skills to evaluate real-world needs

### Manual Export Process (Current)

Until export tool exists:

1. **Copy skill folder** to target location
2. **Rename if needed** to avoid collisions
3. **Preserve all files** (SKILL.md, scripts/, references/, assets/)
4. **Document mapping** in context network

### Future Export Tool Requirements

When building the export tool, it should:

**Requirements**:
- Flatten nested structure while preserving functionality
- Apply chosen namespace/prefix strategy
- Generate bundle manifests
- Validate exported skills (run skills-ref)
- Document transformation mapping
- Handle name collisions
- Preserve file permissions for scripts

**Input**: `skills/` directory (nested)
**Output**: Flat directory + manifest

**Validation**: All exported skills must pass skills-ref validation

### Bundling

**Purpose**: Group related skills for specific use cases.

**Future Capabilities**:
- Select skills by domain/category
- Create bundle manifests
- Version bundles
- Distribute as packages

**Current**: Manual selection and copying

### Export Considerations

**Documented in Skill Tracking**:
Each skill's tracking file includes:
- Estimated export name
- Name length check
- Namespace prefix needs
- Collision potential

**Example from Tracking File**:
```markdown
## Export Considerations
**Estimated Export Name**: data-csv-analyzer
**Name Length**: 18 characters / 64 max
**Namespace Prefix Needed**: yes (to distinguish from other analyzers)
```

### Distribution

**Current**: Not implemented
**Future**: Package manager, git repos, download bundles

## Process Steps (When Tool Exists)

1. **Select skills** for export
2. **Run export tool** with chosen strategy
3. **Validate exported skills** (skills-ref)
4. **Generate bundle manifest**
5. **Document transformation** mapping
6. **Distribute** via chosen method

## Relationships
- **Parent Nodes:** processes/creation.md
- **Child Nodes:** None
- **Related Nodes:**
  - decisions/naming-strategy.md - informs export naming
  - foundation/structure.md - defines source structure

## Navigation Guidance
- **Access Context:** Use when ready to export/deploy skills
- **Common Next Steps:** Build export tool when sufficient skills exist
- **Related Tasks:** Bundling, distribution, deployment
- **Update Patterns:** Update when export tool is developed or strategy chosen

## Metadata
- **Created:** 2025-12-19
- **Last Updated:** 2025-12-19
- **Updated By:** Claude (via Context Network Template Adjustment)

## Change History
- 2025-12-19: Created delivery process documentation with deferred tooling
