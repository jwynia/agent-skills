# Review Tests Command Reference

Unit test quality review for isolation, meaningfulness, and best practices.

## Purpose

Review test files for quality issues including tautological tests, proper mocking, meaningful assertions, and test structure.

## When Used in Workflow

- **Task Cycle**: After implementation, alongside code review
- **Ad-hoc**: Test quality assessment

## Common Invocation Patterns

```bash
review-tests               # Review all test files
review-tests --uncommitted # Only uncommitted changes
review-tests --staged      # Only staged changes
review-tests --branch      # All changes in current branch
review-tests --coverage 80 # Minimum coverage threshold
```

## Review Focus Areas

### 1. Tautological Tests Detection

- Tests that assert the same value they just set
- Tests that only verify mocked behavior
- Tests like: `expect(true).toBe(true)`
- Tests that pass even when implementation is broken

### 2. Proper Mocking and Isolation

- External dependencies mocked (databases, APIs, file systems)
- Only unit under test uses real implementation
- Mocks properly reset between tests
- No tests depending on external state

### 3. Meaningful Assertions

- Tests check actual behavior, not implementation details
- Assertions test the contract/interface
- Edge cases and error conditions verified
- Error messages and types tested

### 4. Test Structure and Clarity

- Test names clearly describe scenarios
- Arrange-Act-Assert structure
- Tests are independent and order-agnostic
- Proper setup/teardown usage

### 5. Coverage Quality

- Business logic thoroughly tested
- Edge cases, error paths, boundaries covered
- Not just happy path testing

## Common Anti-Patterns to Flag

**Direct Tautologies:**
```javascript
// BAD - Testing the assignment
const result = 5;
expect(result).toBe(5);
```

**Mock-Only Tests:**
```javascript
// BAD - Testing the mock, not the component
mockService.getValue.mockReturnValue(42);
const result = component.getData();
expect(result).toBe(42);
```

**Self-Referential Tests:**
```javascript
// BAD - Just testing constructor assignment
const user = new User({ name: 'John' });
expect(user.name).toBe('John');
```

**Missing Isolation:**
```javascript
// BAD - Depends on external state
const data = await fetchFromRealDatabase();
expect(data).toBeDefined();
```

## Quality Checks

- Testing private methods directly
- Testing implementation details
- Snapshot tests without clear purpose
- Missing negative test cases
- Tests with no assertions
- Tests that always pass

## Examples of Good Tests

```javascript
// GOOD - Tests actual behavior
it('should calculate discount correctly for premium users', () => {
  const calculator = new PriceCalculator();
  const result = calculator.calculatePrice({
    basePrice: 100,
    userType: 'premium'
  });
  expect(result).toBe(80); // 20% discount
});

// GOOD - Proper mocking with behavior verification
it('should handle API errors gracefully', async () => {
  mockApi.fetch.mockRejectedValue(new Error('Network error'));
  const service = new DataService(mockApi);

  await expect(service.getData()).rejects.toThrow('Failed to fetch data');
  expect(mockLogger.error).toHaveBeenCalledWith(
    'API call failed',
    expect.any(Error)
  );
});
```

## Output Format

```markdown
## Test Quality Review Summary

### Critical Issues (High Severity)
- [Issues that break test isolation or leave functionality untested]

### Poor Practices (Medium Severity)
- [Issues that reduce test effectiveness]

### Style Improvements (Low Severity)
- [Minor improvements and consistency issues]

### Statistics
- Test files reviewed: X
- Files with issues: Y
- Tautological tests found: Z
- Missing mocks: N

### Top Recommendations
1. [Most important improvement]
2. [Second priority]
3. [Third priority]
```

## Orchestration Notes

Test review results combine with code review for REVIEWS_DONE checkpoint:
- Tautological tests: should fix (tests provide false confidence)
- Missing isolation: should fix (tests are unreliable)
- Style issues: can defer
