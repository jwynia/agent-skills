# Skill Validation Process

## Purpose

This document defines the validation procedures for ensuring agent skills meet all requirements and function correctly.

## Classification
- **Domain:** Process
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** Established

## Content

### Validation Philosophy

**Validation-First**: Run validation early and often. Don't wait until the end to discover spec violations or usability issues.

## Validation Types

### 1. Automated Validation (skills-ref)

**Purpose**: Verify spec compliance using the official reference implementation.

**When to Run**:
- After creating initial SKILL.md structure
- After making changes to frontmatter
- Before marking skill as complete
- As part of final verification

**Command**:
```bash
# From reference implementation directory
cd reference/agentskills/skills-ref
skills-ref validate ../../skills/[domain]/[category]/[skill-name]
```

**What It Checks**:
- YAML frontmatter is valid
- Required fields (`name`, `description`) present
- Name follows conventions (lowercase, hyphens, max 64 chars)
- Description is 1-1024 characters
- Folder name matches `name` field

**Common Errors and Fixes**:
- "Name must be lowercase" → Use only lowercase in frontmatter and folder
- "Name contains invalid characters" → Remove uppercase/underscores, use only `a-z 0-9 -`
- "Folder name doesn't match" → Rename folder to match `name` field exactly
- "Description too long" → Reduce to under 1024 characters

### 2. Manual Validation

**Purpose**: Verify the skill is actually usable.

**Checklist**:
- [ ] Description states what + when + keywords
- [ ] Instructions are actionable and complete
- [ ] Examples included with expected outputs
- [ ] Edge cases documented
- [ ] Progressive disclosure (SKILL.md < 500 lines)
- [ ] Name length works with export prefix
- [ ] Manual testing completed

### 3. Name Validation

Keep base name short enough for potential prefixes (suggest < 40 chars base).

## Full Validation Checklist

From skill tracking template:

**Automated (skills-ref)**:
- [ ] Frontmatter valid
- [ ] Name follows conventions
- [ ] Name matches folder name
- [ ] Description clear and complete

**Manual**:
- [ ] Instructions actionable and tested
- [ ] Examples with expected outputs
- [ ] Edge cases documented
- [ ] Progressive disclosure followed
- [ ] Referenced files created if needed
- [ ] Manual testing completed

## Validation Results Documentation

Record in tracking file:
```markdown
## Validation Results
**Last Validation**: 2025-12-19
**Result**: pass
**Command Used**: `skills-ref validate ./skills/[path]`
**Issues Found**: None
```

## Quality Over Speed

Better to have one thoroughly validated skill than multiple unverified ones.

## Metadata
- **Created:** 2025-12-19
- **Last Updated:** 2025-12-19
- **Updated By:** Claude (via Context Network Template Adjustment)

## Change History
- 2025-12-19: Created agent skills validation process
