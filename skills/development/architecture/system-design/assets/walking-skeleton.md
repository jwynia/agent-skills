# Walking Skeleton: [Project Name]

## The Thinnest Path

[Describe the minimal end-to-end path through the system: user/input does X, data flows through Y, result appears at Z]

**Input:** [What enters]
**Processing:** [What happens to it]
**Output:** [What comes out]

## Purpose

The walking skeleton validates:
- [ ] Components can actually connect
- [ ] Data flows as designed
- [ ] Architecture is sound
- [ ] [Project-specific architectural assumption to test]

## Components Involved

List each component in the skeleton with its MINIMAL implementation.

### [Component 1]

**In skeleton:** [What this component does in the minimal version]
**Stubbed/Deferred:** [What's NOT in the skeleton version]
**Validates:** [What architectural question this answers]

### [Component 2]

**In skeleton:**
**Stubbed/Deferred:**
**Validates:**

### [Component 3]

**In skeleton:**
**Stubbed/Deferred:**
**Validates:**

## What This Validates

- [ ] [Architectural assumption 1 - e.g., "data can flow from file system to HTML output"]
- [ ] [Architectural assumption 2 - e.g., "markdown parser integrates with template system"]
- [ ] [Integration point 1 works]
- [ ] [Integration point 2 works]

## What This Defers

Things explicitly NOT in the walking skeleton (they come after skeleton works):

- [Feature/capability 1] - added in phase: [when]
- [Feature/capability 2] - added in phase: [when]
- [Feature/capability 3] - added in phase: [when]

## Build Order

Sequence for building the walking skeleton:

1. **[First thing to build]**
   - Why first: [reason - often: least dependent, or validates riskiest assumption]
   - Done when: [acceptance criteria]

2. **[Second thing to build]**
   - Why second: [reason - depends on #1, or next riskiest]
   - Done when: [acceptance criteria]

3. **[Third thing to build]**
   - Why third: [reason]
   - Done when: [acceptance criteria]

4. **[Integration step]**
   - Wire together: [what connects]
   - Done when: [end-to-end test passes]

## Definition of "Skeleton Complete"

The walking skeleton is complete when:

- [ ] [Specific end-to-end test: "Given X input, produces Y output"]
- [ ] All components communicate as designed
- [ ] No fake data or hardcoded values in the flow
- [ ] Could demo to someone (even if underwhelming)

## After Skeleton

Once skeleton works, flesh out in this order:

1. [Next feature/capability to add]
2. [Next feature/capability]
3. [Next feature/capability]

## Validation

Before starting to build:
- [ ] Skeleton path is truly minimal (could it be simpler?)
- [ ] Each component has clear "in skeleton" vs "deferred" split
- [ ] Build order makes sense (dependencies respected)
- [ ] "Complete" criteria are testable
- [ ] Skeleton validates the riskiest architectural assumptions
