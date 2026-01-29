# status.md Template

The status file is the primary entry point for agents. Keep it current.

---

```markdown
# Project Status

## Current State

{{Brief description of where the project is right now. 1-3 sentences.}}

## Active Work

{{What's currently being worked on. Update at session start/end.}}

- [ ] {{Active task 1}}
- [ ] {{Active task 2}}

## Recent Changes

{{Last 3-5 significant changes. Helps agents understand recent context.}}

| Date | Change | Impact |
|------|--------|--------|
| {{date}} | {{what changed}} | {{what it affects}} |

## Blockers

{{Anything blocking progress. Remove when resolved.}}

- {{Blocker description}} - Blocked since: {{date}}

## Next Steps

{{What comes after current work. Helps agents understand trajectory.}}

1. {{Next step 1}}
2. {{Next step 2}}

---

*Last updated: {{date}} by {{who/what}}*
```

---

## Usage Notes

- **Update frequency**: At minimum, start and end of each work session
- **Keep it scannable**: Agents read this first; density over length
- **Active Work**: Should reflect actual current state, not aspirational backlog
- **Recent Changes**: Rotate out changes older than ~2 weeks
- **Blockers**: Critical section—stale blockers mislead agents
