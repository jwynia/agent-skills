# Decision: Defer Namespace/Prefix Strategy

## Decision ID
naming-strategy-001

## Date
2025-12-19

## Status
Deferred

## Context

When exporting nested skills to flat structure, we need a strategy to avoid name collisions and maintain clarity about skill purpose.

**Challenge**:
- Skill names limited to 64 characters (spec requirement)
- Need to accommodate prefixes/namespaces for collision avoidance
- Must support "mix and match" bundling
- Want names that remain readable and meaningful

**Example Problem**:
Two skills both named `analyzer`:
- `skills/data-processing/csv/analyzer/`
- `skills/web/html/analyzer/`

When flattened, both can't be just `analyzer`.

## Decision

**We defer choosing a specific namespace/prefix approach until we have enough real-world skills to evaluate trade-offs.**

**Immediate Actions**:
1. Design skills with export in mind (keep names < 40 chars base)
2. Document export considerations in tracking files
3. Structure folders to support all potential strategies
4. Avoid obvious collision-prone names

**Future Decision Point**:
When we have 10-15 skills across multiple domains, revisit with real data.

## Options Documented for Future

### Option 1: Full Path Prefix
**Pattern**: `domain-category-skillname`
**Example**: `data-csv-analyzer`, `web-html-parser`

**Pros**:
- Clear semantic meaning
- No collision risk
- Self-documenting

**Cons**:
- Long names (can hit 64 char limit)
- Verbose for simple skills
- Repetitive when bundling single domain

### Option 2: Short Code Prefix
**Pattern**: `[2-3 char code]-skillname`
**Example**: `dp-analyzer` (dp = data-processing), `wh-parser` (wh = web-html)

**Pros**:
- Shorter names
- Systematic
- Room for long skill names

**Cons**:
- Requires code registry
- Less readable
- Need to learn codes

### Option 3: Manifest-Based (No Prefix)
**Pattern**: Keep original names, use manifest to track sources
**Example**: `analyzer` with manifest entry showing source path

**Pros**:
- Short, clean names
- Flexible bundling
- No 64 char pressure

**Cons**:
- Potential collisions
- Requires manifest management
- More complex tooling

### Option 4: Hybrid Approach
**Pattern**: Prefix only when collision occurs
**Example**: Most skills keep short names, conflicts get prefixed

**Pros**:
- Best of both worlds
- Names only as long as needed
- Optimizes for common case

**Cons**:
- Inconsistent
- Need collision detection
- Harder to predict final names

## Rationale for Deferring

1. **Insufficient Data**: Don't have enough skills yet to see real patterns
2. **Unknown Constraints**: Don't know which bundling scenarios will be common
3. **Premature Optimization**: Strategy choice affects all future skills
4. **Flexibility**: Folder structure supports all options
5. **Reversibility**: Can change strategy later if needed

## Constraints to Consider

**Hard Constraints**:
- 64 character maximum (spec requirement)
- Lowercase, hyphens only (spec requirement)
- Must be unique within export/bundle

**Soft Constraints**:
- Prefer readable over cryptic
- Support domain-based bundling
- Allow cross-domain bundles
- Minimize manual intervention

## Current Mitigation Strategy

**For Now**:
1. Keep base skill names short (< 40 chars suggested)
2. Document estimated export name in tracking file
3. Calculate potential prefixed length
4. Flag potential collisions in planning

**Example from Tracking File**:
```markdown
## Export Considerations
**Base Name**: csv-analyzer (13 chars)
**Estimated With Prefix**: data-csv-analyzer (18 chars)
**With Org Prefix**: acme-data-csv-analyzer (24 chars)
**Status**: Within limits, OK to proceed
```

## Decision Criteria for Future

When revisiting this decision, consider:

1. **Actual Names**: What base names are we actually using?
2. **Collision Frequency**: How often would names collide?
3. **Bundle Patterns**: How are skills being bundled?
4. **User Feedback**: What naming makes sense to users?
5. **Tool Constraints**: What do export tools make easy/hard?

## Implementation

**Development Phase**:
- Proceed with nested structure
- Document export considerations
- Track name lengths
- Note potential collisions

**Export Tool Phase** (future):
- Make strategy configurable
- Support multiple strategies
- Default to chosen strategy
- Allow per-bundle overrides

## Review Date

When we have:
- 10-15 skills created
- 3+ domains represented
- Real bundling use cases
- Export tool under development

## Related Decisions
- `organization-structure.md` - Overall structure approach
- Future: export tool design decision

## Metadata
- **Decision Maker**: Project Team
- **Stakeholders**: Skill developers, bundle creators, end users
- **Impact**: High - affects all future skill naming
- **Reversibility**: Low once skills are deployed

## Change History
- 2025-12-19: Documented deferral with options and criteria
