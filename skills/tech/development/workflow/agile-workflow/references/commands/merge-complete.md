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

### Phase 6: Update Backlog Epic File and Project Status

**CRITICAL: Persist progress to source-of-truth documentation.**

Without this phase, internal tracking (worker progress files, coordinator state) diverges from the backlog and project status files that humans and future sessions rely on.

```bash
# Ensure on main
git checkout main
```

#### Step 1: Update task status in the backlog epic file

```bash
# Locate the epic file that contains this task
# e.g., context-network/backlog/by-epic/E1-feature-name.md

# Change the task's status from "ready" (or "in-progress") to "complete"
# Update any completion metadata (date, commit hash)
```

#### Step 2: Update epic-level progress

```bash
# Recalculate the epic's completion count
# e.g., "Status: In Progress (22/28 complete)" → "Status: In Progress (23/28 complete)"
# If all tasks complete, update epic status to "Complete"
```

#### Step 3: Unblock dependent tasks

```bash
# Check if any tasks in the epic were blocked on the just-completed task
# If so, update their status from "blocked" to "ready"
# Example: If TASK-023 was blocked by TASK-022, and TASK-022 is now complete,
#          change TASK-023 status to "ready"
```

#### Step 4: Update project status file

```bash
# Update context/status.md (or equivalent project status file) with:
# - Current project phase
# - Epic progress table (tasks completed / total per epic)
# - Recently completed work
# - Active/upcoming work summary
```

#### Step 5: Commit documentation updates

```bash
git add context-network/backlog/ context/status.md
git commit -m "docs: Update backlog and project status after [TASK-ID] completion"
git push origin main
```

**Why this phase exists:** Internal tracking files (`.coordinator/state.json`, worker progress files) are ephemeral and session-scoped. The backlog epic files and project status are the persistent source of truth. Skipping this phase causes documented state to drift from reality — future sessions will see stale "ready" statuses for already-completed tasks.

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
- [x] Epic file updated (task marked complete, dependents unblocked)
- [x] Project status file updated

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
