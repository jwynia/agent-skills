# Merge Prep Command Reference

Prepare and validate implementation before merging to main.

## Purpose

Validate implementation, ensure all checks pass, and prepare for direct merge to main branch.

## When Used in Workflow

- **Task Cycle**: After reviews and fixes, before merge

## Prerequisites

- Task implementation complete in worktree
- All changes committed to feature branch
- Reviews complete with no blocking issues

## Merge Preparation Process

### Phase 1: Identify Context

```bash
# Check current branch
git branch --show-current

# Should be in worktree
pwd  # .worktrees/[TASK-ID]/
```

### Phase 2: Validation Suite

**ALL CHECKS MUST PASS before merging**

1. **Run Test Suite**
   ```bash
   npm test
   npm run test:integration
   ```

2. **Code Quality Checks**
   ```bash
   npm run lint
   npm run typecheck
   ```

3. **Build Verification**
   ```bash
   npm run build
   ```

4. **Coverage Check**
   - Ensure > 80% coverage for new code

### Phase 3: Update from Main

Ensure feature branch is up-to-date with main:

```bash
# Fetch latest changes
git fetch origin main

# Check for conflicts
git merge origin/main --no-commit --no-ff
git merge --abort  # Just checking

# If no conflicts, actually merge
git merge origin/main -m "Merge main into task/[TASK-ID]"
```

### Phase 4: Generate Merge Documentation

Create documentation for the merge (stored in commit message or task file):

```markdown
## [TASK-ID]: [Task Title]

### Summary
[Brief description of what was implemented]

### Changes
- [Key change 1]
- [Key change 2]
- [Key change 3]

### Acceptance Criteria
[Copy from task file, mark completed items]
- [x] Criterion 1 completed
- [x] Criterion 2 completed

### Testing
- Unit tests: [count] added/modified
- Integration tests: [count] added/modified
- Coverage: [before]% → [after]%
- All tests passing

### Technical Notes
[Any important implementation details]
```

### Phase 5: Final Push

```bash
# Push latest changes
git push origin task/[TASK-ID]-description
```

## Validation Checklist

Before proceeding to merge:
- [ ] All tests pass
- [ ] Code coverage meets minimum (80%)
- [ ] Linting has no errors
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No debug code remains
- [ ] Documentation updated
- [ ] Commits are clean and descriptive
- [ ] Branch is up-to-date with main

## Error Handling

### If Tests Fail
1. Fix issues in worktree
2. Commit fixes
3. Re-run validation
4. Do NOT proceed until passing

### If Merge Conflicts with Main
1. Merge main into feature branch
2. Resolve conflicts
3. Commit resolution
4. Re-run all tests
5. Push updated branch

### If Not in Worktree
```bash
cd .worktrees/[TASK-ID]/
# Or error if task not in progress
```

## Output Format

```markdown
## Ready for Merge!

**Task:** [TASK-ID] - [Task Title]
**Branch:** task/[TASK-ID]-description
**Status:** Ready to merge

### Validation Results
- Tests: PASSED (X/X)
- Lint: PASSED
- TypeCheck: PASSED
- Build: PASSED
- Coverage: XX%

### Next Steps
Run merge-complete to merge to main
```

## Orchestration Notes

After validation:
- **CHECKPOINT: MERGE_READY** - Confirm ready to merge
- All validation must pass
- Branch must be up-to-date with main
- On confirmation: ready for merge-complete
