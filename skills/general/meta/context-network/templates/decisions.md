# decisions.md Template

Track significant decisions and their rationale. Prevents re-litigating settled questions.

---

```markdown
# Decisions

## How to Use This File

Record decisions that:
- Affect multiple parts of the project
- Were non-obvious or had alternatives
- Future-you or agents might question

Format: Decision, rationale, date. Keep it brief.

---

## Architecture Decisions

### {{Decision Title}}
**Date:** {{YYYY-MM-DD}}
**Status:** Active | Superseded by {{link}} | Revisiting

**Context:** {{Why this decision was needed. 1-2 sentences.}}

**Decision:** {{What was decided. Be specific.}}

**Rationale:** {{Why this option over alternatives. Key factors that drove the choice.}}

**Consequences:**
- {{Positive consequence}}
- {{Tradeoff accepted}}

---

### {{Another Decision}}
...

---

## Process Decisions

### {{Process Decision Title}}
**Date:** {{YYYY-MM-DD}}

**Decision:** {{What process/workflow was established}}

**Rationale:** {{Why this approach}}

---

## Revisit Queue

Decisions flagged for future reconsideration:

| Decision | Revisit When | Reason |
|----------|--------------|--------|
| {{decision}} | {{trigger/date}} | {{why reconsider}} |
```

---

## Usage Notes

- **Granularity**: Not every choice needs recording. Focus on decisions you'd explain to a new team member.
- **Status tracking**: Mark decisions as Superseded when they're replaced—don't delete history.
- **Revisit Queue**: Captures "we'll do X for now but reconsider when Y"—prevents forgotten technical debt.
- **Integration**: Link to relevant context files when decisions affect specific domains.
