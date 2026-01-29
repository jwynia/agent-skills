# Discovery Command Reference

Capture learning moments and insights in the context network.

## Purpose

Document insights as they happen, preventing knowledge loss and building institutional memory. Create discovery records, update location indexes, and maintain learning paths.

## When Used in Workflow

- **Daily Evening**: Capture learnings from the day
- **Post-Task**: After completing implementation
- **Ad-hoc**: Any "aha moment" during development

## When to Create Discovery Records

Invoke when:
- Spent >5 minutes figuring out how something works
- Read >3 files to understand one feature
- Had an "aha!" moment about system design
- Discovered why something was implemented a certain way
- Found the actual location of important functionality
- Mental model of a component changed

## Discovery Documentation Process

### Phase 1: Trigger Assessment

Identify discovery type:

**Complexity Triggers:**
- Multi-file understanding sequences
- Non-obvious component interactions
- Surprising implementation approaches

**Navigation Triggers:**
- Finding key entry points
- Understanding component organization
- Discovering configuration patterns

**Understanding Triggers:**
- Mental model evolution
- Assumption corrections
- Pattern recognition

### Phase 2: Record Creation

Create record at `/discoveries/records/YYYY-MM-DD-###.md`:

```markdown
# Discovery: [Brief Title]

**Date**: YYYY-MM-DD
**Context**: [What task/exploration led to this]

## What I Was Looking For
[1-2 sentences about the original goal]

## What I Found
**Location**: `path/to/file:lines`
**Summary**: [One sentence explaining what this does/means]

## Significance
[Why this matters for understanding the system]

## Connections
- Related concepts: [[concept-1]], [[concept-2]]
- Implements: [[pattern-name]]
- See also: [[related-discovery]]

## Keywords
[Terms someone might search for]
```

### Phase 3: Location Index Updates

When discovering key code locations:
1. Check existing indexes in `/discoveries/locations/`
2. Add new locations with file paths and line numbers
3. Explain significance
4. Include navigation patterns

### Phase 4: Learning Path Updates

When understanding evolves significantly:
1. What did you think before?
2. What do you understand now?
3. What changed your understanding?

Update or create learning path to show progression.

## Quality Guidelines

### For Discovery Records
- **Be Specific**: Include exact file paths and line numbers
- **Include Context**: Explain what led to exploration
- **Use Keywords**: Think about search terms
- **Connect to Existing**: Link to related concepts

### For Location Indexes
- **Keep Current**: Update paths when code moves
- **Explain Significance**: Not just locations, but why they matter
- **Include Navigation Hints**: Help others explore

## Integration with Development

### During Development Tasks
- Create records for "figuring out" moments
- Update location indexes for new key areas
- Note architecture understanding evolution

### During Debugging
- Document root cause discoveries
- Record surprising behavior explanations
- Note workarounds and rationale

### During Code Review
- Create records for reusable patterns
- Document insights from others' approaches
- Record "I didn't know you could do that" moments

## Maintenance Schedule

- **Daily**: Review and link related discoveries
- **Weekly**: Update learning paths, organize records
- **Monthly**: Consolidate into primary documentation

## Orchestration Notes

Discovery is typically an end-of-workflow activity:
- Run after task completion to capture learnings
- Run during daily wrap-up
- Creates valuable context for future work
