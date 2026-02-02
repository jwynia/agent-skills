# Merge Complete Command Reference

Merge feature branch to main, cleanup worktree, and update task status.

## Purpose

Complete the merge lifecycle: merge to main, cleanup branches and worktrees, mark task as complete.

## When Used in Workflow

- **Task Cycle**: Final step after merge-prep validation

## Prerequisites

- All validation checks passed in merge-prep
- Branch is up-to-date with main
- No merge conflicts

## Completion Process

### Phase 1: Pre-Merge Check

```bash
# Navigate to worktree
cd .worktrees/[TASK-ID]/

# Verify on correct branch
git branch --show-current  # Should be task/[TASK-ID]-*

# Verify clean state
git status --porcelain  # Should be empty

# Final test run
npm test
npm run build
```

### Phase 2: Merge to Main

```bash
# Switch to main repo (not worktree)
cd /path/to/main/repo

# Update main
git checkout main
git pull --rebase origin main

# Merge feature branch (squash recommended)
git merge --squash task/[TASK-ID]-description

# Create merge commit with descriptive message
git commit -m "[TASK-ID]: [Task Title]

Implements [feature description].

Changes:
- [Change 1]
- [Change 2]

Tests: All passing
"

# Push to origin
git push origin main
```

**Alternative: Standard merge (preserves commit history)**
```bash
git merge --no-ff task/[TASK-ID]-description -m "[TASK-ID]: [Task Title]"
git push origin main
```

### Phase 3: Worktree Cleanup

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

### Phase 4: Branch Cleanup

```bash
# Delete local feature branch
git branch -d task/[TASK-ID]-description

# Delete remote feature branch
git push origin --delete task/[TASK-ID]-description
```

### Phase 5: Update Task Status

**CRITICAL: After merge, status updates happen ON MAIN**

```bash
# Ensure on main
git checkout main

# Update task file
# - Status: completed
# - Completed: [current date]
# - Merge commit: [commit hash]

# Update status indexes
# - Remove from in-progress.md
# - Add to completed.md

# Commit status update
git add context-network/backlog/
git commit -m "Complete: [TASK-ID] merged to main"
git push origin main
```

**Note:** This is the ONLY command that commits to main because:
- Feature branch has already been reviewed
- We're just recording completion in the backlog
- Feature branch and worktree no longer exist
- This is administrative bookkeeping

## Error Handling

### Merge Conflicts
```
1. cd /path/to/main/repo
2. git checkout main
3. git pull
4. git merge --squash task/[TASK-ID]-description
5. Resolve conflicts
6. git add . && git commit
7. git push
```

### Tests Fail on Main After Merge
```
# Revert the merge
git revert HEAD
git push origin main

# Return to worktree to fix
cd .worktrees/[TASK-ID]/
# Fix issues
# Re-run merge process
```

### Worktree Already Removed
```
# Just clean up branch
git branch -D task/[TASK-ID]-description
git push origin --delete task/[TASK-ID]-description
```

## Output Format

```markdown
## Task Merged Successfully!

**Task:** [TASK-ID] - [Task Title]
**Commit:** [commit-hash]
**Status:** Completed

### Cleanup Complete
- [x] Merged to main
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
# Revert the merge commit
git revert [merge-commit-sha]
git push origin main

# Task will need to be reopened
# Update status back to in-progress
```

## Orchestration Notes

After completion:
- Task cycle is complete
- Can immediately start next task cycle
- Consider running `/discovery` to capture learnings
- Consider `/retrospective` for larger tasks
