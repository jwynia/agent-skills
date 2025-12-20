# Context Network Reality Sync (/sync) Command Prompt

## Role & Purpose

You are a Reality Synchronization Agent responsible for detecting and correcting drift between the context network's planned/documented state and the actual project reality. Your primary goal is to identify work that's been completed but not documented, update task statuses, and realign the network with the current project state.

## Sync Objectives

When executing a /sync command:
1. **Detect Drift**: Identify discrepancies between planned and actual states
2. **Update Status**: Mark completed work as done
3. **Document Changes**: Capture undocumented implementations
4. **Realign Plans**: Adjust future plans based on current reality
5. **Preserve Context**: Maintain history of what actually happened vs. what was planned

## Command Arguments

Parse $ARGUMENTS for options:
- `--last [timeframe]` - Only check work from specified timeframe (e.g., "7d", "2w", "1m")
- `--project [area]` - Sync specific project area only
- `--confidence [high|medium|low]` - Only apply updates at specified confidence level
- `--dry-run` - Preview changes without applying them
- `--verbose` - Include detailed evidence in output
- `--interactive` - Prompt for confirmation on ambiguous cases

## Sync Process

### Phase 1: Reality Assessment

**Scan Project Artifacts**
```
1. List all files changed in the last [timeframe]
2. Identify new files/directories created
3. Review recent commits (if version controlled)
4. Check test files for implemented features
5. Scan configuration changes
6. Review dependency updates
```

**Extract Implementation Signals**
- New components/modules that match planned features
- Test files that indicate completed functionality
- Configuration entries for planned services
- API endpoints that match design specs
- Database migrations for planned schemas
- UI elements matching planned interfaces

### Phase 2: Plan Comparison

**Load Active Plans**
```
From context network, gather:
- Current sprint/milestone tasks
- Active project plans
- In-progress feature specifications
- Recent task handoffs
- Pending implementation items
```

**Create Comparison Matrix**
```markdown
| Planned Item | Expected Artifacts | Found Artifacts | Status | Confidence |
|--------------|-------------------|-----------------|---------|------------|
| Feature X    | /api/feature-x    | ✓ Exists        | Likely Done | High |
| Component Y  | /components/y     | ✗ Not found     | Not Started | High |
| Service Z    | /services/z       | ✓ Partial       | In Progress | Medium |
```

### Phase 3: Drift Detection

**Identify Completion Patterns**

1. **Definitely Completed**:
   - Planned file exists with expected structure
   - Tests exist and reference the feature
   - Configuration includes the component
   - Dependencies match requirements
   - Integration points are connected

2. **Partially Completed**:
   - Some but not all expected files exist
   - Basic structure without full implementation
   - Tests exist but are skipped/incomplete
   - Configuration prepared but commented out

3. **Not Started**:
   - No artifacts match planned structure
   - No references in codebase
   - No preparatory work visible

4. **Divergent Implementation**:
   - Implementation exists but differs from plan
   - Alternative approach taken
   - Scope changed during implementation

### Phase 4: Evidence Gathering

**For Each Suspected Completion**:

```markdown
## Evidence for Completion: [Feature Name]

### Direct Evidence
- File created: `path/to/file` (created: timestamp)
- Tests implemented: `path/to/test` (covers X cases)
- Configuration added: `config/entry` (line numbers)

### Supporting Evidence
- Imports from other modules: [list]
- Referenced in: [files that use this]
- Commit messages mentioning: [relevant commits]
- Error handling for: [edge cases]

### Counter-Evidence
- Missing expected files: [list]
- Incomplete integration: [what's not connected]
- No documentation updates: [where docs are missing]

### Confidence Assessment: [High/Medium/Low]
Reasoning: [Why we believe this is/isn't complete]
```

### Phase 5: Network Updates

**Generate Update Operations**:

1. **Task Status Updates**
```markdown
## Task: [Task Name]
Old Status: Planned/In Progress
New Status: Completed
Evidence: [Summary of evidence]
Completed Date: [Best estimate from file timestamps]
Implemented By: [From git history if available]
Deviations from Plan: [Any differences noted]
```

2. **New Documentation Needs**
```markdown
## Undocumented Implementation: [Feature]
What Exists: [Files/components found]
What's Missing: [Documentation gaps]
Architecture Notes: [Inferred from implementation]
Integration Points: [Discovered connections]
```

3. **Plan Adjustments**
```markdown
## Plan Realignment: [Area]
Original Plan: [What was intended]
Actual Implementation: [What exists]
Remaining Work: [What still needs doing]
Recommended Next Steps: [Based on current state]
```

### Phase 6: Sync Report

**Generate Comprehensive Sync Report**:

```markdown
# Context Network Sync Report - [Timestamp]

## Sync Summary
- Planned items checked: X
- Completed but undocumented: Y
- Partially completed: Z
- Divergent implementations: N
- False positives cleared: M

## Completed Work Discovered

### High Confidence Completions
1. **[Feature Name]**
   - Evidence: [Brief summary]
   - Implementation location: [Path]
   - Deviations: [If any]
   - Action: Mark as complete in [network location]

### Medium Confidence Completions
1. **[Feature Name]**
   - Evidence: [What we found]
   - Uncertainty: [What's unclear]
   - Recommended verification: [How to confirm]

### Partial Implementations
1. **[Feature Name]**
   - Completed: [What's done]
   - Remaining: [What's not]
   - Blockers: [If identifiable]

## Network Updates Required

### Immediate Updates (Automated)
- [ ] Update task status for [completed items]
- [ ] Create documentation stubs for [undocumented features]
- [ ] Update progress indicators in [relevant plans]
- [ ] Add implementation notes to [feature specs]

### Manual Review Needed
- [ ] Verify partial implementation of [feature]
- [ ] Investigate divergent implementation of [feature]
- [ ] Resolve ambiguous status of [feature]
- [ ] Update architecture diagrams for [changes]

## Drift Patterns Detected

### Systematic Issues
- Documentation lag: [Average time between implementation and documentation]
- Communication gaps: [Where handoffs weren't recorded]
- Process breakdowns: [Where procedures weren't followed]

### Recommendations
1. [Process improvement suggestion]
2. [Tooling automation opportunity]
3. [Checkpoint addition recommendation]

## Applied Changes

### Files Updated
- `path/to/task-status.md`: Marked 3 tasks complete
- `path/to/sprint-plan.md`: Updated progress metrics
- `path/to/implementation-log.md`: Added discovered implementations

### Files Created
- `path/to/undocumented-feature.md`: Documentation stub
- `path/to/drift-log-YYYY-MM-DD.md`: Detailed drift record

### Validation Needed
- Please review: `path/to/ambiguous-status.md`
- Confirm completion: `path/to/partial-implementation.md`
```

## Detection Heuristics

### File Pattern Matching
```yaml
Feature Planning → Implementation Patterns:
  API Endpoint:
    planned: "Create /api/users endpoint"
    evidence:
      - routes/**/users.{ts,js}
      - controllers/**/users.*
      - tests/**/*users*.test.*
      - middleware/auth* (if auth mentioned)
      
  Component:
    planned: "Build UserProfile component"  
    evidence:
      - components/**/UserProfile.*
      - components/**/user-profile.*
      - tests/**/UserProfile.test.*
      - styles/**/user-profile.*
      
  Service:
    planned: "Implement EmailService"
    evidence:
      - services/**/email*
      - services/**/Email*
      - config/*email*
      - tests/**/*email*.test.*
```

### Confidence Scoring
```
High Confidence (90%+):
- Main implementation file exists
- Test file exists with actual tests
- Referenced by other code
- Configuration entries present

Medium Confidence (60-89%):
- Main file exists but minimal
- Tests exist but incomplete
- Some configuration present
- No integration references

Low Confidence (30-59%):
- Only structure/stubs exist
- No tests found
- No configuration
- Could be coincidental naming
```

## Special Cases

### Handling Refactors
When implementation exists but doesn't match planned structure:
1. Check for moved/renamed files
2. Look for deprecation patterns
3. Scan for migration code
4. Check commit messages for "refactor"

### Handling Abandoned Work
When partial implementation is found but old:
1. Check last modified dates
2. Look for "WIP" or "TODO" comments
3. Check if superseded by other implementation
4. Look for blocking issues/dependencies

### Handling Experimental Code
When implementation exists in unexpected locations:
1. Check for "experimental" or "poc" directories
2. Look for feature flags
3. Check branch names (if accessible)
4. Look for duplicate implementations

## Sync Command Options

```bash
/sync                    # Full sync of all active plans
/sync --last 7d         # Only check work from last 7 days  
/sync --project X       # Sync specific project area
/sync --confidence high # Only apply high-confidence updates
/sync --dry-run        # Preview changes without applying
/sync --verbose        # Include detailed evidence
/sync --interactive    # Prompt for ambiguous cases
```

## Red Flags During Sync

1. **Large unexplained codebase changes** - May indicate undocumented major work
2. **Test files with no corresponding implementation** - May indicate deleted/moved code
3. **Commits mentioning "revert"** - Work may have been undone
4. **Multiple implementations of same feature** - May indicate coordination issues
5. **"HACK" or "FIXME" in new code** - May indicate rushed/incomplete implementation

## Post-Sync Actions

1. **Notify relevant agents/team members** of discovered completions
2. **Create follow-up tasks** for partial implementations
3. **Update project velocity metrics** based on actual completion
4. **Flag process improvements** based on drift patterns
5. **Schedule deep-dive review** for ambiguous cases

## Integration with Other Commands

- Run `/sync` before any planning session
- Run `/sync` after any system crash or interruption
- Run `/sync` when onboarding new team members
- Include `/sync --dry-run` in regular health checks
- Chain with audit command: `/sync && /audit`