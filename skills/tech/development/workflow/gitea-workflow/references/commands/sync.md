# Sync Command Reference

Reality synchronization between context network and actual project state.

## Purpose

Detect and correct drift between planned/documented state and actual project reality. Identifies work that's been completed but not documented, updates task statuses, and realigns the network with current state.

## When Used in Workflow

- **Task Cycle**: First step to ensure starting from accurate state
- **Daily Morning**: Reality check before starting work
- **Daily Evening**: Capture actual progress made
- **Sprint End**: Full synchronization before retrospective

## Common Invocation Patterns

```bash
sync                      # Full sync of all active plans
sync --last 1d           # Only check work from last day
sync --last 1w           # Only check work from last week
sync --dry-run           # Preview changes without applying
sync --verbose           # Include detailed evidence
```

## Sync Process

### Phase 1: Reality Assessment

Scan project artifacts:
1. List files changed in the timeframe
2. Identify new files/directories created
3. Review recent commits
4. Check test files for implemented features
5. Scan configuration changes
6. Review dependency updates

### Phase 2: Plan Comparison

Load active plans from context network:
- Current sprint/milestone tasks
- Active project plans
- In-progress feature specifications
- Recent task handoffs
- Pending implementation items

### Phase 3: Drift Detection

Identify completion patterns:

**Definitely Completed:**
- Planned file exists with expected structure
- Tests exist and reference the feature
- Configuration includes the component
- Integration points are connected

**Partially Completed:**
- Some but not all expected files exist
- Basic structure without full implementation
- Tests exist but incomplete

**Divergent Implementation:**
- Implementation exists but differs from plan
- Alternative approach taken
- Scope changed during implementation

### Phase 4: Evidence Gathering

For each suspected completion, document:
- Direct evidence (files, tests, config)
- Supporting evidence (imports, references, commits)
- Counter-evidence (missing files, incomplete integration)
- Confidence assessment (High/Medium/Low)

### Phase 5: Network Updates

Generate updates for:
- Task status changes
- New documentation needs
- Plan adjustments

## Output Format

```markdown
# Context Network Sync Report

## Sync Summary
- Planned items checked: X
- Completed but undocumented: Y
- Partially completed: Z
- Divergent implementations: N

## Completed Work Discovered

### High Confidence Completions
1. **[Feature Name]**
   - Evidence: [Brief summary]
   - Implementation location: [Path]
   - Action: Mark as complete

### Medium Confidence Completions
1. **[Feature Name]**
   - Evidence: [What we found]
   - Uncertainty: [What's unclear]
   - Recommended verification: [How to confirm]

## Network Updates Required
- [ ] Update task status for [items]
- [ ] Create documentation stubs for [features]
- [ ] Update progress indicators

## Recently Completed Tasks (Last 7 Days)
[List of tasks that may still appear as available but are actually done]
```

## Orchestration Notes

After sync completes:
- If drift detected: summarize key findings for checkpoint
- If no drift: auto-continue to next workflow step
- Update checkpoint context with sync results
