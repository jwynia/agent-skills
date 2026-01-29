# PR Complete Command Reference

Merge approved PR, cleanup worktree, and update task status.

## Purpose

Complete the pull request lifecycle: merge, cleanup branches and worktrees, mark task as complete.

## When Used in Workflow

- **Task Cycle**: Final step after PR approval

## Prerequisites

- PR has been created and reviewed
- CI checks are passing
- Required approvals obtained

## Completion Process

### Phase 1: Verify PR Status

```bash
# Check PR details
gh pr view $PR_NUMBER

# Check CI status
gh pr checks $PR_NUMBER

# Verify approvals
gh pr reviews $PR_NUMBER
```

### Phase 2: Pre-Merge Validation

```bash
# Navigate to worktree
cd .worktrees/[TASK-ID]/

# Update from main
git fetch origin main

# Check for conflicts
git merge origin/main --no-commit --no-ff
git merge --abort  # Just checking

# Final test run
npm test
npm run lint
npm run build
```

### Phase 3: Merge Pull Request

```bash
# Squash merge (recommended)
gh pr merge $PR_NUMBER \
  --squash \
  --delete-branch \
  --subject "[TASK-ID]: [Task Title]"

# Verify merge
gh pr view $PR_NUMBER --json state
```

### Phase 4: Worktree Cleanup

```bash
# Navigate out of worktree
cd /path/to/main/repo

# Remove worktree
git worktree remove .worktrees/[TASK-ID]/

# Verify removal
git worktree list

# Prune stale references
git worktree prune
```

### Phase 5: Update Task Status

**CRITICAL: After PR merge, status updates happen ON MAIN**

```bash
# Ensure on main
git checkout main
git pull origin main

# Update task file
# - Status: completed
# - PR: #[PR_NUMBER] (merged)
# - Completed: [current date]

# Update status indexes
# - Remove from in-review.md
# - Add to completed.md

# Commit to main (only case we commit directly)
git add context-network/backlog/
git commit -m "Complete: [TASK-ID] merged via PR #$PR_NUMBER"
git push origin main
```

**Note:** This is the ONLY command that commits to main because:
- PR has already been reviewed and approved
- We're just recording completion in the backlog
- Feature branch and worktree no longer exist
- This is administrative bookkeeping

## Error Handling

### PR Not Approved
```
Error: PR #X is not approved yet
Required approvals: Y
Current approvals: Z
Request review with: gh pr review --request @reviewer
```

### CI Checks Failing
```
Error: CI checks are failing
[Show failing checks]
Fix issues in worktree and push updates
```

### Merge Conflicts
```
1. cd .worktrees/[TASK-ID]/
2. git pull origin main
3. Resolve conflicts
4. git add . && git commit
5. git push
6. Re-run pr-complete
```

## Output Format

```markdown
## PR Merged Successfully!

**Task:** [TASK-ID] - [Task Title]
**PR:** #[PR_NUMBER]
**Merge Method:** Squash and merge
**Status:** Completed

### Cleanup Complete
- [x] PR merged to main
- [x] Feature branch deleted
- [x] Worktree removed
- [x] Task status updated
- [x] Backlog indexes updated

### Next Available Tasks
[Top 3 ready tasks from backlog]
```

## Rollback Procedure

If issues discovered after merge:
```bash
# Create revert PR
gh pr create --title "Revert [TASK-ID]" \
  --body "Reverting PR #$PR_NUMBER due to [reason]"

# Or revert commit directly
git revert [merge-commit-sha]
git push origin main
```

## Orchestration Notes

After completion:
- Task cycle is complete
- Can immediately start next task cycle
- Consider running `/discovery` to capture learnings
- Consider `/retrospective` for larger tasks
