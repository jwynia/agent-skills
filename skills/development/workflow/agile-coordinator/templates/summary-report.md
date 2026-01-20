# Summary Report Template

Template for the final orchestration summary. Replace `{{variables}}` with actual values.

---

## Full Template

```markdown
## Orchestration Summary

**Session**: {{SESSION_ID}}
**Started**: {{START_TIME}}
**Completed**: {{END_TIME}}
**Duration**: {{DURATION}}

---

### Configuration

| Setting | Value |
|---------|-------|
| Execution Mode | {{EXECUTION_MODE}} |
| Max Workers | {{MAX_WORKERS}} |
| Autonomy Level | {{AUTONOMY_LEVEL}} |

---

### Tasks Completed

{{#each COMPLETED_TASKS}}
#### {{TASK_ID}}: {{TASK_TITLE}}

- **Status**: Completed
- **Worker**: {{WORKER_ID}}
- **PR**: #{{PR_NUMBER}}
- **Commit**: {{COMMIT_SHA}}
- **Branch**: {{BRANCH_NAME}}
- **Duration**: {{TASK_DURATION}}

{{/each}}

---

### Tasks Failed

{{#if FAILED_TASKS}}
{{#each FAILED_TASKS}}
#### {{TASK_ID}}: {{TASK_TITLE}}

- **Status**: Failed
- **Worker**: {{WORKER_ID}}
- **Phase**: {{FAILED_PHASE}}
- **Error**: {{ERROR_MESSAGE}}
- **Attempts**: {{RETRY_COUNT}}

{{/each}}
{{else}}
None
{{/if}}

---

### Tasks Skipped

{{#if SKIPPED_TASKS}}
{{#each SKIPPED_TASKS}}
- {{TASK_ID}}: {{TASK_TITLE}} ({{SKIP_REASON}})
{{/each}}
{{else}}
None
{{/if}}

---

### Metrics

| Metric | Value |
|--------|-------|
| Tasks Attempted | {{TASKS_ATTEMPTED}} |
| Tasks Completed | {{TASKS_COMPLETED}} |
| Tasks Failed | {{TASKS_FAILED}} |
| Tasks Skipped | {{TASKS_SKIPPED}} |
| Workers Spawned | {{WORKERS_SPAWNED}} |
| PRs Created | {{PRS_CREATED}} |
| PRs Merged | {{PRS_MERGED}} |
| Commits | {{TOTAL_COMMITS}} |
| Tests Added | {{TESTS_ADDED}} |

---

### Verification

| Check | Status |
|-------|--------|
| Build | {{BUILD_STATUS}} |
| Tests | {{TEST_STATUS}} ({{TESTS_PASSED}}/{{TESTS_TOTAL}}) |
| Coverage | {{COVERAGE_PERCENT}}% |

**Verdict**: {{VERIFICATION_VERDICT}}

{{#if VERIFICATION_FAILURES}}
#### Failures

{{#each VERIFICATION_FAILURES}}
- {{TEST_FILE}}: {{FAILURE_MESSAGE}}
{{/each}}
{{/if}}

---

### Backlog Status

| Status | Count |
|--------|-------|
| Completed (this session) | {{COMPLETED_THIS_SESSION}} |
| Ready | {{REMAINING_READY}} |
| In Progress | {{REMAINING_IN_PROGRESS}} |
| Total Backlog | {{TOTAL_BACKLOG}} |

---

### Next Steps

{{#if REMAINING_READY}}
Ready tasks remaining:
{{#each REMAINING_READY_TASKS}}
- {{TASK_ID}}: {{TASK_TITLE}} ({{PRIORITY}} priority)
{{/each}}

Run `/agile-coordinator` to continue.
{{else}}
All ready tasks have been implemented!

Next actions:
- Review completed PRs
- Groom backlog for new tasks
- Run `/agile-workflow --phase daily-evening` to wrap up
{{/if}}
```

---

## Example: Filled Report

```markdown
## Orchestration Summary

**Session**: coord-2026-01-20-abc123
**Started**: 2026-01-20T10:00:00Z
**Completed**: 2026-01-20T10:45:00Z
**Duration**: 45 minutes

---

### Configuration

| Setting | Value |
|---------|-------|
| Execution Mode | sequential |
| Max Workers | 2 |
| Autonomy Level | autonomous |

---

### Tasks Completed

#### TASK-006: Persistent Message Status Storage

- **Status**: Completed
- **Worker**: worker-1
- **PR**: #123
- **Commit**: 5cc6e36
- **Branch**: task/TASK-006-persistence
- **Duration**: 18 minutes

#### TASK-007: Add Unit and Integration Tests

- **Status**: Completed
- **Worker**: worker-2
- **PR**: #124
- **Commit**: 94750f0
- **Branch**: task/TASK-007-tests
- **Duration**: 22 minutes

---

### Tasks Failed

None

---

### Tasks Skipped

None

---

### Metrics

| Metric | Value |
|--------|-------|
| Tasks Attempted | 2 |
| Tasks Completed | 2 |
| Tasks Failed | 0 |
| Tasks Skipped | 0 |
| Workers Spawned | 2 |
| PRs Created | 2 |
| PRs Merged | 2 |
| Commits | 4 |
| Tests Added | 142 |

---

### Verification

| Check | Status |
|-------|--------|
| Build | PASSED |
| Tests | PASSED (142/142) |
| Coverage | 82% |

**Verdict**: VERIFIED

---

### Backlog Status

| Status | Count |
|--------|-------|
| Completed (this session) | 2 |
| Ready | 0 |
| In Progress | 0 |
| Total Backlog | 8 |

---

### Next Steps

All ready tasks have been implemented!

Next actions:
- Review completed PRs
- Groom backlog for new tasks
- Run `/agile-workflow --phase daily-evening` to wrap up
```
