# Review Code Command Reference

Code quality review for maintainability, security, and best practices.

## Purpose

Review code files for quality issues, security vulnerabilities, performance problems, and adherence to best practices.

## When Used in Workflow

- **Task Cycle**: After implementation, before PR
- **Ad-hoc**: Code quality check at any time

## Common Invocation Patterns

```bash
review-code               # Review all code
review-code --uncommitted # Only uncommitted changes
review-code --staged      # Only staged changes
review-code --branch      # All changes in current branch vs main
review-code --security    # Enhanced security focus
review-code --performance # Enhanced performance focus
```

## Review Focus Areas

### 1. Code Quality and Maintainability

- Code duplication (DRY violations)
- Overly complex functions
- Proper separation of concerns
- Appropriate abstraction levels
- Code smells and anti-patterns

### 2. Security Vulnerabilities

- Hardcoded secrets, API keys, passwords
- Injection vulnerabilities (SQL, command, XSS)
- Unsafe type coercion or unvalidated inputs
- Authentication/authorization issues
- Insecure data handling

### 3. Performance Issues

- Inefficient algorithms or data structures
- Unnecessary loops or redundant computations
- Memory leaks or resource management issues
- Improper async/await usage
- Blocking operations

### 4. Error Handling

- Proper error handling and recovery
- Unhandled promise rejections
- Informative error messages
- Proper logging
- Graceful degradation

### 5. Code Standards

- Consistent naming conventions
- Proper typing (TypeScript) or type hints
- Single responsibility functions
- Design pattern usage
- SOLID principles

## Common Anti-Patterns to Flag

**Hardcoded Secrets:**
```javascript
// BAD
const API_KEY = "sk-1234567890abcdef";
```

**SQL Injection:**
```javascript
// BAD
const query = `SELECT * FROM users WHERE id = ${userId}`;
```

**Unhandled Promises:**
```javascript
// BAD
async function getData() {
  const result = await fetch('/api/data');
  return result.json();  // No error handling
}
```

**Deep Nesting:**
```javascript
// BAD - Pyramid of doom
if (condition1) {
  if (condition2) {
    if (condition3) {
      // do something
    }
  }
}
```

**Magic Numbers:**
```javascript
// BAD
if (user.age > 17) { /* ... */ }
```

## Quality Thresholds

- Functions longer than 50 lines
- Files longer than 500 lines
- Cyclomatic complexity > 10
- Nesting depth > 4 levels
- Commented out code blocks
- TODO/FIXME without context

## Output Format

```markdown
## Code Review Summary

### Critical Issues (Security/Data Loss Risk)
- [Issues that could cause vulnerabilities or data loss]

### High Priority Issues (Bugs/Crashes)
- [Issues that could cause runtime errors]

### Medium Priority Issues (Maintainability)
- [Issues affecting code maintainability]

### Low Priority Issues (Style/Convention)
- [Minor improvements]

### Statistics
- Files reviewed: X
- Critical issues: A
- High priority: B
- Medium priority: C
- Low priority: D

### Top Recommendations
1. [Most critical improvement]
2. [Second priority]
3. [Third priority]

### Positive Findings
- [Well-written patterns observed]
```

## Orchestration Notes

Review results feed into the REVIEWS_DONE checkpoint:
- Critical issues: must address before continuing
- High issues: strongly recommend addressing
- Medium/Low: can defer to tasks via apply-recommendations
