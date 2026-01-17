---
name: code-review
description: "Provide structured code review guidance for catching defects and improving quality. This skill should be used when the user asks to 'review this code', 'check for issues', 'PR review', 'code quality check', or wants systematic code evaluation. Keywords: code review, PR, pull request, quality, defects, security, maintainability, performance."
license: MIT
compatibility: Works with any programming language. Integrates with github-agile for PR workflow.
metadata:
  author: jwynia
  version: "1.0"
---

# Code Review Diagnostic

Systematic code review catches 60-90% of defects before production, reduces maintenance costs by 40%, and serves as effective knowledge transfer. This skill provides structured review guidance for both human reviewers and AI agents.

## When to Use This Skill

Use this skill when:
- Reviewing code before merge
- Assessing code quality
- Preparing code for PR submission
- Self-reviewing before requesting review

Do NOT use this skill when:
- Writing new code (use implementation skills)
- Designing architecture (use system-design)
- Working on requirements (use requirements-analysis)

## Core Principle

**Review effectiveness degrades sharply with PR size.** Under 400 lines: highest defect detection. 400-800 lines: 50% less effective. 800+ lines: 90% less effective.

## Quick Reference: Review Effectiveness

| Factor | Optimal | Degraded |
|--------|---------|----------|
| PR size | < 400 lines | > 800 lines |
| Review time | < 60 minutes | > 90 minutes |
| Review speed | 200-400 LOC/hour | > 500 LOC/hour |
| Reviewers | 2 | 4+ (diminishing returns) |

## Quality Pyramid

| Level | Checks | Catches | Frequency |
|-------|--------|---------|-----------|
| 1. Automated | Lint, types, unit tests, security scan | 60% | Every commit |
| 2. Integration | Integration tests, contracts, performance | 25% | Every PR |
| 3. Human Review | Design, logic, maintainability, context | 15% | Significant changes |

## Review Focus Areas

### 1. Correctness

**Questions:**
- Does it solve the stated problem?
- Are edge cases handled?
- Is error handling complete?
- Are assumptions valid?

**Validation:** Test coverage, business logic, data integrity, concurrency handling

### 2. Maintainability

**Questions:**
- Is the code self-documenting?
- Can it be easily modified?
- Are abstractions appropriate?
- Is complexity justified?

**Indicators:** Clear naming, single responsibility, minimal coupling, high cohesion

### 3. Performance

**Questions:**
- Are there obvious bottlenecks?
- Is caching appropriate?
- Are queries optimized?
- Is memory managed?

**Red Flags:** N+1 queries, unbounded loops, synchronous I/O in async context, memory leaks

### 4. Security

**Questions:**
- Is input validated?
- Are secrets protected?
- Is authentication checked?
- Are permissions verified?

**Critical Checks:** No hardcoded secrets, SQL parameterized, XSS prevention, CSRF tokens

## Code Smells Checklist

### Method Level
| Smell | Threshold | Action |
|-------|-----------|--------|
| Long method | > 50 lines | Extract method |
| Long parameter list | > 5 params | Parameter object |
| Duplicate code | > 10 similar lines | Extract common |
| Dead code | Never called | Remove |

### Class Level
| Smell | Symptoms | Action |
|-------|----------|--------|
| God class | > 1000 lines, > 20 methods | Split class |
| Feature envy | Uses other class data excessively | Move method |
| Data clumps | Same parameter groups | Extract class |

### Architecture Level
| Smell | Detection | Action |
|-------|-----------|--------|
| Circular dependencies | Dependency cycles | Introduce interface |
| Unstable dependencies | Depends on volatile modules | Dependency inversion |

## Comment Guidelines

### Comment Types

**[BLOCKING]** - Must fix before merge
- Security vulnerabilities, data corruption risks, breaking API changes

**[MAJOR]** - Should fix before merge
- Missing tests, performance issues, code duplication

**[MINOR]** - Can fix in follow-up
- Style inconsistencies, documentation typos, naming improvements

**[QUESTION]** - Seeking clarification
- Design decisions, business logic, external dependencies

### Effective Comment Pattern

```
Observation + Impact + Suggestion

Example:
"This method is 200 lines long [observation].
This makes it hard to understand and test [impact].
Consider extracting helper methods [suggestion]."
```

### Avoid
- Vague: "This could be better"
- Personal: "I don't like this"
- Nitpicky: "Missing period in comment"
- Overwhelming: 50+ minor style issues

## Review Readiness Checklist

### Before Requesting Review
- [ ] Feature fully implemented
- [ ] All tests written and passing
- [ ] Self-review performed
- [ ] No commented code or debug statements
- [ ] Coverage threshold met
- [ ] Linting clean
- [ ] Build succeeds
- [ ] Documentation updated
- [ ] PR description explains problem and solution

### PR Description Should Include
- Problem statement (why this change?)
- Solution approach (how does it solve it?)
- Testing strategy (how verified?)
- Breaking changes (if any)
- Review focus areas (where to look closely?)

## Complexity Thresholds

### Cyclomatic Complexity
| Range | Classification | Action |
|-------|----------------|--------|
| 1-10 | Simple | OK |
| 11-20 | Moderate | Consider refactoring |
| 21-50 | Complex | Refactor required |
| > 50 | Untestable | Must decompose |

### Cognitive Complexity
| Range | Classification |
|-------|----------------|
| < 7 | Clear |
| 7-15 | Acceptable |
| > 15 | Confusing - refactor needed |

## Anti-Patterns

### Rubber Stamp
Approving without thorough review. "LGTM" in < 1 minute.
**Fix:** Minimum review time, required comments, random audits.

### Nitpicking
50+ style comments, missing real issues.
**Fix:** Automate style checks, focus on logic/design, limit minor comments.

### Big Bang Review
2000+ line PRs that overwhelm.
**Fix:** Stack small PRs, feature flags, review drafts early.

## Security Scanning Categories

### Severity Classification
| Level | Definition | SLA |
|-------|------------|-----|
| Critical | Remote code execution possible | Fix immediately |
| High | Data breach possible | Fix within 24 hours |
| Medium | Limited impact | Fix within sprint |
| Low | Minimal risk | Fix when convenient |

## Review Metrics

### Efficiency
| Metric | Target |
|--------|--------|
| First review turnaround | < 4 hours |
| Review cycles | < 3 |
| PR to merge time | < 24 hours |

### Quality
| Metric | Target |
|--------|--------|
| Defect detection rate | > 80% |
| Post-merge defects | < 0.5 per PR |
| Review coverage | 100% |

## Related Skills

- **github-agile** - PR workflow and GitHub integration
- **task-decomposition** - If PR too large, break it down
- **requirements-analysis** - For unclear requirements
