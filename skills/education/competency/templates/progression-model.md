# Progression Model Template

Use this template to map competency dependencies and create personalized learning paths.

## Template

```markdown
## Progression Model

### Dependency Diagram

\`\`\`
Foundation (Role: Everyone)
├── [COMP-1]: [Name] - [Why this is foundational]
└── [COMP-2]: [Name] - [Why this is foundational]

├─► Intermediate (Role: [Role Name])
│   ├── [COMP-3]: [Name] (requires: COMP-1, COMP-2)
│   └── [COMP-4]: [Name] (requires: COMP-2)

└─► Specialist Track (Role: [Role Name])
    ├── [COMP-5]: [Name] (requires: COMP-3)
    └── [COMP-6]: [Name] (requires: COMP-3, COMP-4)
\`\`\`

### Dependency Rationale

| Competency | Requires | Why |
|------------|----------|-----|
| COMP-3 | COMP-1, COMP-2 | [Explanation of dependency] |
| COMP-4 | COMP-2 | [Explanation] |
| COMP-5 | COMP-3 | [Explanation] |

### Skip Logic

| If demonstrates... | Evidence required | Can skip... |
|--------------------|-------------------|-------------|
| COMP-1, COMP-2 in interview | Strong scenario response | Foundation training |
| Prior [domain] experience | Portfolio review | [Specific modules] |
| Certification in [X] | Verification | [Specific modules] |

### Role Paths

| Role | Required Competencies | Optional |
|------|----------------------|----------|
| [Role 1] | COMP-1, COMP-2, COMP-3 | COMP-4 |
| [Role 2] | COMP-1, COMP-2, COMP-5, COMP-6 | - |
| [Role 3] | All | - |

### Minimum Viable Path

For someone who needs to be functional quickly:

1. [COMP-1] - [Estimate: X hours] - [Why first]
2. [COMP-2] - [Estimate: X hours] - [Why second]
3. Assessment checkpoint
4. If passing, can begin work with supervision
5. Complete [COMP-3] within first [timeframe]
```

## Design Principles

### 1. Dependencies Should Be Real

A dependency exists when:
- You literally can't understand B without understanding A
- A provides vocabulary/concepts that B builds on
- Attempting B without A causes common failure modes

A dependency does NOT exist just because:
- A comes before B in your documentation
- A is "simpler" than B
- You've always taught them in that order

### 2. Parallel Tracks Are OK

Not everyone needs everything. Role-specific branches allow:
- Faster time-to-competence for specialized roles
- Deeper expertise where needed
- No wasted training on irrelevant competencies

### 3. Skip Logic Respects Prior Knowledge

If someone can demonstrate competency, don't make them sit through training for it:
- Test before training
- Accept external evidence (certifications, portfolio, reference checks)
- Convert training to "verify you know our specifics" rather than full coverage

### 4. Minimum Viable Paths Enable Action

Define the shortest path to being useful:
- What's the absolute minimum to start working (with support)?
- What completes the foundation (independent work)?
- What leads to mastery (can teach others)?

## Common Patterns

### The Funnel

Wide foundation, narrowing specialization:

```
Foundation (everyone)
├── ├── ├──
    │
    ▼
Intermediate (most)
├── ├──
    │
    ▼
Specialist (few)
├──
```

### The Fork

Common foundation, diverging role paths:

```
Foundation
├── ├──
    │
   ╱ ╲
  ▼   ▼
Path A Path B
├──    ├──
```

### The Ladder

Linear progression with increasing depth:

```
Level 1 → Level 2 → Level 3 → Level 4
```

## Validation Questions

1. Can someone complete a role path without gaps?
2. Are dependencies actually required, or just traditional?
3. Does skip logic exist for common prior knowledge?
4. Is there a minimum viable path for urgent needs?
5. Do role paths match actual job requirements?
