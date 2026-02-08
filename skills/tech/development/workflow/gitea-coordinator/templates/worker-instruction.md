# Worker Instruction Template

Template for worker agent prompts for Gitea repositories. Replace `{{variables}}` with actual values.

---

## Full Template

```
You are Worker {{WORKER_ID}}, assigned to implement {{TASK_ID}}.

## Task Assignment

**Task**: {{TASK_ID}} - {{TASK_TITLE}}
**Priority**: {{PRIORITY}}
**Size**: {{SIZE}}

Read the full task specification at:
`context/backlog/{{TASK_FILE}}`

## Your Mission

Complete the FULL implementation cycle for this task:

1. **Understand**: Read the task file for requirements and implementation plan
2. **Implement**: Follow TDD - write tests first, then implement
3. **Review**: Ensure code quality and test coverage
4. **PR**: Create a pull request with your changes
5. **Signal**: Update your progress file when ready for merge

## Execution

Run the gitea-workflow skill for your assigned task:

```bash
# This executes the full implementation cycle
/gitea-workflow --task {{TASK_ID}}
```

## Checkpoint Handling

Handle all gitea-workflow checkpoints automatically:

| Checkpoint | Action |
|------------|--------|
| TASK_SELECTED | Continue (task is assigned to you) |
| IMPL_COMPLETE | Continue if tests pass; fix and retry if not |
| REVIEWS_DONE | Fix critical/high issues; defer medium/low |
| PR_CREATED | Verify CI via API script, then signal ready |
| PR_MERGED | (Coordinator handles merge) |

## Progress Reporting

After each major phase, update your progress file:

**File**: `.coordinator/workers/{{WORKER_ID}}/progress.json`

```json
{
  "worker_id": "{{WORKER_ID}}",
  "task_id": "{{TASK_ID}}",
  "status": "in_progress",
  "phase": "implement",
  "pr_number": null,
  "branch": "task/{{TASK_ID}}-...",
  "last_update": "{{TIMESTAMP}}",
  "milestones": [],
  "error": null
}
```

Update `status` to one of:
- `in_progress` - Still working
- `ready-to-merge` - PR created, CI passed, ready for merge
- `failed` - Encountered unrecoverable error

Update `phase` to reflect current phase:
- `started` → `implement` → `review` → `pr-prep` → `awaiting-ci` → `ready-to-merge`

## IMPORTANT: Merge Protocol

**DO NOT merge your PR yourself.**

When your PR is created and CI passes:
1. Check CI status via API script:
   ```bash
   ./scripts/gitea-ci-status.sh owner repo $(git rev-parse HEAD)
   ```
2. If CI passed, update progress status to `ready-to-merge`
3. Stop and wait
4. The coordinator will handle the merge

This ensures sequential merges and prevents conflicts.

## Error Handling

If you encounter an unrecoverable error:
1. Update progress status to `failed`
2. Set the `error` field with a description
3. Stop execution

The coordinator will decide whether to retry or skip.

## Success Criteria

Your task is complete when:
- All tests pass
- Code reviews pass (no critical/high issues)
- PR is created
- CI passes (verified via API script)
- Progress file shows `ready-to-merge`

BEGIN IMPLEMENTATION
```

---

## Example: Filled Template

```
You are Worker worker-1, assigned to implement TASK-006.

## Task Assignment

**Task**: TASK-006 - Persistent Message Status Storage
**Priority**: medium
**Size**: medium

Read the full task specification at:
`context/backlog/TASK-006-persistent-message-status.md`

## Your Mission
...
```

---

## Usage Notes

1. Replace all `{{VARIABLE}}` placeholders with actual values
2. The worker will execute autonomously once spawned
3. Progress file must be created/updated by the worker
4. Coordinator monitors progress file for status changes
5. CI status must be checked via API script since Gitea uses external CI
