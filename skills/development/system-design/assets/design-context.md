# Design Context: [Project Name]

## Requirements Summary

[From requirements-analysis, summarize in 2-3 sentences]

**Problem:** [One sentence]
**Core needs:** [Bullet list of must-haves]
**Key constraints:** [From constraint inventory]

## Quality Attributes (Prioritized)

Rank these by importance for THIS project. Not all matter equally.

1. **[Attribute]** - [Why it matters for this project]
2. **[Attribute]** - [Why it matters]
3. **[Attribute]** - [Why it matters]

Common attributes to consider:
- Simplicity (can you understand it in 6 months?)
- Performance (does speed actually matter here?)
- Maintainability (will you change this often?)
- Reliability (what's the cost of failure?)
- Extensibility (will you actually extend it?)

## Real Constraints

From constraint inventory - things that limit design options.

| Constraint | Design Impact |
|------------|---------------|
| [constraint] | [what this rules out or requires] |
| [constraint] | [design impact] |

## Design Goals

What the architecture should optimize for (derived from quality attributes):

- [Goal 1]
- [Goal 2]
- [Goal 3]

## Explicitly Not Optimizing For

Trade-offs we're accepting. What we're giving up.

- [Thing we're NOT optimizing] - [why it's okay to deprioritize]
- [Thing we're NOT optimizing] - [why acceptable]

## Validation

Before proceeding to architecture decisions:
- [ ] Requirements summary matches validated requirements
- [ ] Quality attributes are ranked (not all equal)
- [ ] Constraints are design-relevant (not implementation details)
- [ ] At least one thing is explicitly NOT being optimized for
