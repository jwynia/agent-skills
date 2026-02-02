# Implement Command Reference

Test-driven development in isolated worktree.

## Purpose

Implement a task using TDD methodology: write tests first, then implementation, in an isolated worktree to keep main branch clean.

## When Used in Workflow

- **Task Cycle**: After task selection, the main development step

## Invocation

```bash
implement [TASK-ID]       # Implement specific task in worktree
```

## Core Principle: Test-First Development

**NEVER write implementation code before writing tests.** Tests define the contract and guide the implementation.

## Implementation Process

### Phase 1: Setup & Validation

1. **Locate Planning Documents**
   - Find relevant plans in `/context-network/planning/`
   - Review architecture in `/context-network/architecture/`
   - Check decisions in `/context-network/decisions/`

2. **Validate Requirements**
   - Confirm understanding of acceptance criteria
   - Identify any ambiguities
   - Check for missing specifications

3. **Create Worktree**
   ```bash
   git worktree add .worktrees/[TASK-ID] -b task/[TASK-ID]-description
   cd .worktrees/[TASK-ID]
   ```

### Phase 2: Test-Driven Development (MANDATORY)

**Write tests before ANY implementation code**

1. **Write Tests First**
   - Happy path tests - Core functionality
   - Edge case tests - Boundary conditions
   - Error tests - Failure scenarios
   - Integration tests - Component interactions

2. **Test Structure**
   ```typescript
   describe('ComponentName', () => {
     beforeEach(() => { /* Setup */ });
     afterEach(() => { /* Cleanup */ });

     describe('functionName', () => {
       it('should handle normal input correctly', () => {
         // Arrange
         const input = setupTestData();
         // Act
         const result = functionName(input);
         // Assert
         expect(result).toEqual(expectedOutput);
       });

       it('should throw error for invalid input', () => {
         // Test error conditions
       });
     });
   });
   ```

3. **Run Tests (Red Phase)**
   - Confirm ALL tests fail appropriately
   - Validate test assertions are meaningful
   - **DO NOT PROCEED until tests are failing correctly**

### Phase 3: Implementation (Only After Tests)

**STOP! Have you written tests? If no, go back to Phase 2.**

1. **Minimal Implementation**
   - Write ONLY enough code to make the next test pass
   - No premature optimization
   - No features not covered by tests
   - Focus on one test at a time

2. **Implementation Order**
   - Run test - see it fail
   - Write minimal code to pass
   - Run test - see it pass
   - Refactor if needed (tests still pass)
   - Move to next test

3. **Code Quality**
   - Proper separation of concerns
   - Clear naming conventions
   - SOLID principles
   - Every public method must have tests

### Phase 4: Refinement (Red-Green-Refactor)

1. **Verify All Tests Pass (Green Phase)**
   - ALL tests must be green
   - No skipped tests
   - Coverage > 80% minimum

2. **Refactor With Confidence**
   - Improve code structure (tests protect you!)
   - Remove duplication
   - Optimize performance
   - Run tests after EVERY refactor

### Phase 5: Integration

1. **Wire Up**
   - Connect to existing systems
   - Update configuration
   - Add to dependency injection

2. **Commit Changes**
   ```bash
   git add .
   git commit -m "[TASK-ID]: Implement [feature]

   - Added tests for [functionality]
   - Implemented [component]
   - Updated configuration

   Co-Authored-By: Claude <noreply@anthropic.com>"
   ```

## Output Format

```markdown
## Implementation Complete: [Task Name]

### Summary
- **What**: [Brief description]
- **Why**: [Business/technical reason]
- **How**: [High-level approach]

### Changes Made
- `path/to/new/file.ts` - [Purpose]
- `path/to/modified/file.ts` - [What changed]

### Testing
- [ ] **Tests written BEFORE implementation**
- [ ] Unit tests passing
- [ ] Edge cases tested
- [ ] Error conditions tested
- Test coverage: [X]%
- Number of tests: [Count]

### Validation
- [ ] Linting passes
- [ ] Type checking passes
- [ ] Build succeeds
```

## Quality Checklist

Before marking complete:
- [ ] Tests were written FIRST (not retrofitted)
- [ ] All acceptance criteria met
- [ ] Coverage > 80%
- [ ] All tests pass consistently
- [ ] Code follows project patterns
- [ ] No console.logs or debug code
- [ ] Error handling is comprehensive

## Orchestration Notes

After implementation completes:
- **CHECKPOINT: IMPL_COMPLETE** - Pause to verify work
- Show test results, coverage, build status
- If all pass: ready to proceed to review
- If failures: must address before continuing
