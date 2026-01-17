# Apply Recommendations Command Reference

Triage and apply recommendations from reviews.

## Purpose

Analyze recommendations from code/test reviews and intelligently split them into immediate actions (apply now) and deferred tasks (create follow-up).

## When Used in Workflow

- **Task Cycle**: After reviews, when issues were found
- Conditionally invoked based on review results

## Common Invocation Patterns

```bash
apply-recommendations [review-output]
apply-recommendations --quick-only    # Only low-risk fixes
apply-recommendations --defer-all     # Convert all to tasks
apply-recommendations --dry-run       # Preview without applying
```

## Core Principle: Smart Triage

Not all recommendations are equal. Some should be fixed immediately, others need planning. The decision matrix:

**APPLY NOW if ALL of:**
- Effort: Trivial or Small
- Risk: Low or (Medium with good test coverage)
- Dependencies: Independent or Local
- Clear fix is obvious
- Won't break existing functionality

**DEFER TO TASK if ANY of:**
- Effort: Large
- Risk: High
- Dependencies: System or Team
- Requires design decisions
- Needs performance benchmarking
- Could introduce breaking changes

## Assessment Criteria

### Effort Required
- **Trivial**: < 5 minutes, single line changes
- **Small**: 5-30 minutes, single file
- **Medium**: 30-60 minutes, 2-3 files
- **Large**: > 60 minutes, multiple files/systems

### Risk Level
- **Low**: Style, documentation, isolated cleanup
- **Medium**: Logic changes, refactoring with tests
- **High**: Architecture, external APIs, data handling

### Dependencies
- **Independent**: Can be done in isolation
- **Local**: Requires understanding of immediate context
- **System**: Requires broader architectural knowledge
- **Team**: Needs discussion or approval

## Category Handling

### Critical Security Issues → ALWAYS APPLY NOW
- Hardcoded secrets/credentials
- SQL injection vulnerabilities
- XSS vulnerabilities
- Exposed sensitive data

### High Priority Bugs → USUALLY APPLY NOW
- Null reference errors
- Unhandled promise rejections
- Memory leaks (if isolated)
- Clear logic errors

### Code Quality → SELECTIVE
**Apply Now:**
- Dead code removal
- Obvious duplications (< 10 lines)
- Simple variable renames
- Missing error handling (simple cases)

**Defer:**
- Large-scale refactoring
- Architecture changes
- Complex abstraction creation

### Test Improvements → USUALLY APPLY NOW
- Adding missing assertions
- Fixing tautological tests
- Improving test names
- Fixing test isolation

### Documentation → APPLY NOW
- Adding missing comments
- Updating incorrect docs
- Clarifying confusing names

## Output Format

```markdown
# Recommendation Application Report

## Summary
- Total recommendations: X
- Applied immediately: Y
- Deferred to tasks: Z

## Applied Immediately

### 1. [Recommendation Title]
**Type**: [Security/Bug/Quality/Test/Documentation]
**Files Modified**:
- `path/to/file.ts` - [What changed]
**Risk**: Low

## Deferred to Tasks

### High Priority

#### Task: [Clear Task Title]
**Original Recommendation**: [What was recommended]
**Why Deferred**: [Reason]
**Effort Estimate**: [Size]
**Created at**: `/tasks/[type]/[filename].md`

## Validation
- [ ] All tests pass
- [ ] Linting passes
- [ ] No regressions detected

## Next Steps
1. Review applied changes
2. Run full test suite
3. Review high-priority deferred tasks
```

## Quality Guidelines

1. **Never break working code** - If unsure, defer
2. **Maintain test coverage** - Add tests for bug fixes
3. **Preserve behavior** - Refactoring shouldn't change functionality
4. **Document decisions** - Explain why items were deferred
5. **Incremental progress** - Many small improvements > one risky change

## Orchestration Notes

After applying recommendations:
- If all applied successfully: ready for PR prep
- If issues remain: loop back to review
- Deferred tasks are created but don't block workflow
