# PR Complete Command Reference

Merge approved PR, cleanup worktree, and update task status for Gitea.

## Purpose

Complete the pull request lifecycle: merge, cleanup branches and worktrees, mark task as complete.

## When Used in Workflow

- **Task Cycle**: Final step after PR approval

## Prerequisites

- PR has been created and reviewed
- CI checks are passing (verified externally or via API)
- Required approvals obtained

## Completion Process

### Phase 1: Verify PR Status

```bash
# View PR details
tea pulls

# Check if PR is approved (via API script)
./scripts/gitea-pr-checks.sh owner repo $PR_NUMBER

# Verify CI status (via API script)
./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
```

**Manual verification:**
- Check your Gitea PR page for approval status
- Check your CI dashboard for build status

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
tea pulls merge $PR_NUMBER --style squash

# Or merge commit
tea pulls merge $PR_NUMBER --style merge

# Or rebase merge
tea pulls merge $PR_NUMBER --style rebase

# Or rebase-merge (creates merge commit after rebase)
tea pulls merge $PR_NUMBER --style rebase-merge
```

**Note:** Tea CLI may not automatically delete the branch. Delete manually if needed:
```bash
git push origin --delete task/[TASK-ID]-description
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
Request review via Gitea UI or:
tea pulls review
```

### CI Checks Failing
```
Error: CI checks are failing
Check your CI dashboard for details.
Fix issues in worktree and push updates.

To check CI status:
./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
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
**Merge Method:** Squash merge
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
# Create revert commit
git revert [merge-commit-sha]
git push origin main

# Or create a revert PR via Gitea UI
```

## Orchestration Notes

After completion:
- Task cycle is complete
- Can immediately start next task cycle
- Consider running `/discovery` to capture learnings
- Consider `/retrospective` for larger tasks

## Gitea-Specific Notes

### Tea Merge Styles

| Style | Command | Result |
|-------|---------|--------|
| Squash | `tea pulls merge --style squash` | All commits squashed into one |
| Merge | `tea pulls merge --style merge` | Merge commit preserving history |
| Rebase | `tea pulls merge --style rebase` | Commits rebased onto main |
| Rebase-merge | `tea pulls merge --style rebase-merge` | Rebase + merge commit |

### Branch Deletion

Tea CLI may not automatically delete branches after merge. To clean up:

```bash
# Delete remote branch
git push origin --delete task/[TASK-ID]-description

# Delete local branch (if exists)
git branch -d task/[TASK-ID]-description
```

### Verifying Merge

```bash
# Check PR state
tea pulls list --state merged

# Verify on main
git checkout main
git pull
git log --oneline -5  # Should show your merge
```
