# Decision: Mandatory skills-ref Validation

## Decision ID
validation-integration-001

## Date
2025-12-19

## Status
Accepted

## Context

The agentskills.io specification defines required formats and conventions for skills. The skills-ref reference implementation provides a validation tool that checks compliance.

**Challenge**:
- Spec compliance is complex (frontmatter format, naming rules, etc.)
- Manual verification is error-prone
- Non-compliant skills cause runtime failures
- Different agent implementations may enforce spec differently

**Question**: Should skills-ref validation be optional or mandatory?

## Decision

**All skills MUST pass skills-ref validation before being marked complete.**

No exceptions. Validation is a hard requirement, not a suggested practice.

## Rationale

**Why Mandatory**:

1. **Spec Compliance**: Only way to ensure we meet agentskills.io requirements
2. **Cross-Agent Compatibility**: Validated skills work across all implementations
3. **Early Error Detection**: Catch issues during development, not deployment
4. **Quality Baseline**: Establishes minimum quality bar
5. **Automation-Ready**: Validated skills can be automatically processed/distributed
6. **Future-Proof**: If spec evolves, we can revalidate all skills

**Why No Exceptions**:

1. **Slippery Slope**: One exception becomes many
2. **Compatibility Risk**: Invalid skills may work in some agents but not others
3. **Technical Debt**: "Fix later" rarely happens
4. **User Trust**: Users expect spec-compliant skills
5. **Tooling Assumptions**: Export/bundle tools assume valid input

## Implementation

### In Development Process

**Phase**: Validation (step 5 of creation process)

**Requirements**:
- Run skills-ref after initial structure
- Run after any frontmatter changes
- Run before marking skill complete
- Document results in tracking file

**Command**:
```bash
cd reference/agentskills/skills-ref
skills-ref validate ../../skills/[domain]/[category]/[skill-name]
```

### In Tracking Files

**Validation Section**:
```markdown
## Validation Results
**Last Validation**: [date]
**Result**: [pass | fail]
**Command Used**: `skills-ref validate ./skills/[path]`
**Issues Found**: [list or "none"]
```

**Checklist Item**:
- [ ] Frontmatter valid (skills-ref)

### In Principles

**Quality Standards**:
> **Validation-First**: All skills MUST pass skills-ref validation before completion

**Exceptions to Principles**:
> **Validation**: No exception - all skills must pass skills-ref validation

## Alternatives Considered

### Alternative 1: Optional Validation
**Description**: Suggest but don't require validation
**Pros**: Faster development, fewer blockers
**Cons**: Inconsistent quality, spec violations slip through
**Rejected Because**: Defeats the purpose of having a spec

### Alternative 2: Manual Spec Review
**Description**: Human review instead of automated validation
**Pros**: Can make contextual judgments
**Cons**: Error-prone, slow, doesn't scale, inconsistent
**Rejected Because**: Automated tools are more reliable

### Alternative 3: Validation Only for Export
**Description**: Require validation only when exporting/bundling
**Pros**: Less friction during development
**Cons**: Late error detection, wasted development time
**Rejected Because**: Want fast feedback loops

## Edge Cases

### What if skills-ref has a bug?
- Document the bug in decision record
- Create workaround if possible
- Contribute fix to skills-ref project
- Don't bypass validation

### What if validation blocks critical fix?
- Fix the validation error first
- If truly impossible, document in decision record with approval
- Create follow-up task to resolve
- Mark skill as "known non-compliant" in tracking

### What if spec changes?
- Revalidate all existing skills
- Update those that fail
- Document spec version in metadata

## Future Enhancements

**Potential Automation**:
1. Pre-commit hook: Block commits with invalid skills
2. CI/CD integration: Automated validation on push
3. Batch validation: Script to validate all skills
4. Regression testing: Revalidate on spec updates

**Not Implemented Yet**: Manual process is sufficient for now

## Benefits Realized

By making validation mandatory, we ensure:

1. **Confidence**: Every skill is known to be spec-compliant
2. **Portability**: Skills work across different agent implementations
3. **Quality**: Baseline quality standard is met
4. **Documentation**: Validation results tracked for all skills
5. **Debugging**: When issues arise, spec compliance isn't the culprit

## Implementation Checklist

- [x] Document in principles.md
- [x] Include in creation.md process
- [x] Add to validation.md procedures
- [x] Include in skill tracking template
- [ ] Create validation batch script (future)
- [ ] Add to pre-commit hooks (future)

## Related Decisions

- Future: CI/CD automation decision
- Future: Pre-commit hook integration

## References

- `reference/agentskills/skills-ref/` - Validation tool
- `reference/agentskills/docs/specification.mdx` - Spec definition
- `processes/validation.md` - Validation procedures
- `foundation/principles.md` - Quality principles

## Metadata

- **Decision Maker**: Project Team
- **Stakeholders**: Skill developers, skill users, agent implementers
- **Impact**: High - affects all skill development
- **Reversibility**: Low - removing requirement would undermine quality

## Change History

- 2025-12-19: Initial decision - mandatory validation required
