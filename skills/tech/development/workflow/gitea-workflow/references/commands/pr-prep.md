# PR Prep Command Reference

Prepare and create pull request with full documentation for Gitea.

## Purpose

Validate implementation, generate PR documentation, and create the pull request using Gitea Tea CLI.

## When Used in Workflow

- **Task Cycle**: After reviews and fixes, before merge

## Prerequisites

- Task implementation complete in worktree
- All changes committed to feature branch
- Gitea Tea CLI installed (`tea --version`)
- Authenticated with Gitea (`tea login`)
- GITEA_URL and GITEA_TOKEN environment variables set (for API scripts)

## PR Preparation Process

### Phase 1: Identify Context

```bash
# Check current branch
git branch --show-current

# Should be in worktree
pwd  # .worktrees/[TASK-ID]/
```

### Phase 2: Validation Suite

**ALL CHECKS MUST PASS before creating PR**

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

### Phase 3: PR Documentation

Generate comprehensive PR description:

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

### Related Issues/Tasks
- Implements: #[TASK-ID]
- Related to: [other task IDs]

### Checklist
- [x] Tests written and passing
- [x] Linting passes
- [x] Type checking passes
- [x] Build succeeds
- [x] Documentation updated
- [x] No console.logs or debug code
```

### Phase 4: Create Pull Request

```bash
# Push to remote
git push -u origin task/[TASK-ID]-description

# Create PR using tea CLI
tea pulls create \
  --title "[TASK-ID]: [Task Title]" \
  --description "$(cat /tmp/pr-description.md)" \
  --base main \
  --head task/[TASK-ID]-description
```

**Alternative with inline description:**
```bash
tea pulls create \
  --title "[TASK-ID]: [Task Title]" \
  --description "## Summary

Implements [feature description].

## Changes
- Change 1
- Change 2

## Testing
All tests passing."
```

### Phase 5: Update Task Status

**Status updates happen in worktree, committed to feature branch**

```bash
# Update task file
# - Add PR number
# - Update status to 'in-review'
# - Note PR creation timestamp

# Commit status changes
git add context-network/backlog/
git commit -m "Status: Move [TASK-ID] to in-review (PR #$PR_NUMBER)"
git push
```

## Validation Checklist

Before creating PR:
- [ ] All tests pass
- [ ] Code coverage meets minimum (80%)
- [ ] Linting has no errors
- [ ] Type checking passes
- [ ] Build succeeds
- [ ] No debug code remains
- [ ] Documentation updated
- [ ] Commits are clean and descriptive

## Error Handling

### If Tests Fail
1. Fix issues in worktree
2. Commit fixes
3. Re-run validation
4. Do NOT create PR until passing

### If Not in Worktree
```bash
cd .worktrees/[TASK-ID]/
# Or error if task not in progress
```

## Output Format

```markdown
## PR Created Successfully!

**Task:** [TASK-ID] - [Task Title]
**PR:** #[PR_NUMBER]
**URL:** [GITEA_URL]/[owner]/[repo]/pulls/[PR_NUMBER]
**Status:** In Review

### Next Steps
1. Wait for CI checks to complete (check your CI dashboard)
2. Request code review if needed
3. Address any review comments
4. Once approved, run pr-complete to merge
```

## Orchestration Notes

After PR creation:
- **CHECKPOINT: PR_CREATED** - Pause for CI and review
- Monitor CI status via your CI dashboard or API script:
  ```bash
  ./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
  ```
- Wait for required approvals
- On all green: ready for pr-complete

## Gitea-Specific Notes

### Tea CLI PR Creation Options

```bash
# Full options
tea pulls create \
  --title "Title" \
  --description "Description" \
  --base main \
  --head feature-branch \
  --assignee username

# The PR number is shown in output after creation
```

### Verifying PR Created

```bash
# List your open PRs
tea pulls list --state open

# View the PR you just created
tea pulls
```

### CI Status

Gitea uses external CI systems. After PR creation:

1. Check your CI dashboard (Drone, Woodpecker, Jenkins, etc.)
2. Or use the API script:
   ```bash
   ./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
   ```
3. CI results are typically posted as commit statuses
