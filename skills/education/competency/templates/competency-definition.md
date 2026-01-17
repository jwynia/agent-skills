# Competency Definition Template

Use this template to define competencies. Each competency must be an observable capability.

## Template

```markdown
## [Cluster Name] Competencies

| ID | Competency | Description |
|----|------------|-------------|
| [PREFIX]-1 | [Action verb phrase] | Can [observable capability that you could watch someone demonstrate] |
| [PREFIX]-2 | [Action verb phrase] | Can [observable capability] |
```

## Checklist

Before finalizing each competency, verify:

- [ ] Starts with "Can" + action verb
- [ ] Describes something you could observe
- [ ] Two people could agree/disagree whether someone has it
- [ ] Not too broad (applies to too many situations)
- [ ] Not too narrow (only applies to one exact situation)
- [ ] Connected to a real decision or action

## Good vs. Bad Examples

| Bad (knowledge state) | Good (observable capability) |
|----------------------|------------------------------|
| "Understands data policies" | "Can classify data according to organizational categories" |
| "Knows the approval process" | "Can determine required approval level for a given expense" |
| "Familiar with the tool" | "Can configure the tool to accomplish [specific task]" |
| "Aware of security requirements" | "Can identify security implications of a proposed change" |

## ID Conventions

- Use 2-4 letter prefix based on cluster name (e.g., DP- for Data Privacy)
- Sequential numbers within cluster
- Keep IDs stable once assigned (don't renumber)

## Deriving Competencies from Failure Modes

1. List mistakes people make
2. For each mistake, identify what someone would need to DO to avoid it
3. Write that as a competency
4. Verify it's observable

Example:
- Failure: "People put customer data in public AI tools"
- What would prevent it: Recognizing that data is sensitive + knowing which tools are approved
- Competencies:
  - "Can classify data according to sensitivity levels"
  - "Can identify which AI tools are approved for which data types"
