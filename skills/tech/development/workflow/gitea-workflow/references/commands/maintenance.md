# Maintenance Command Reference

Context network audit and cleanup.

## Purpose

Systematically review and maintain the integrity of the context network, ensuring it remains valuable, navigable, and accurate.

## When Used in Workflow

- **Sprint End**: Deep cleanup between sprints
- **Weekly**: Regular maintenance
- **Ad-hoc**: When network feels disorganized

## Common Invocation Patterns

```bash
maintenance              # Standard maintenance
maintenance --deep       # Thorough cleanup
```

## Audit Categories

### 1. Structural Integrity

**File Organization:**
- Verify standard directory structure
- Check planning docs are in context network (not project root)
- Ensure no build artifacts in context network
- Validate `.context-network.md` exists and is accurate

**Node Size & Scope:**
- Flag nodes > 1500 words (consider splitting)
- Identify sparse nodes < 200 words (consider consolidating)
- Verify single-concept focus per node

**Naming Conventions:**
- Consistent file naming patterns
- Accurate node titles
- No duplicate names

### 2. Relationship Network

**Link Integrity:**
- Verify bidirectional relationships
- Identify orphaned nodes
- Flag broken links
- Check relationship type consistency

**Relationship Quality:**
- Explicit relationship types (not just "relates to")
- Meaningful relationship descriptions
- Identify missing connections

**Cross-Domain Connections:**
- Adequate connections between domains
- Well-documented interface points

### 3. Content Accuracy

**Project Alignment:**
- Compare descriptions against actual project
- Flag outdated architecture descriptions
- Identify missing documentation

**Temporal Accuracy:**
- Verify metadata reflects actual update dates
- Identify stale content
- Flag nodes marked "Dynamic" that haven't changed

### 4. Navigation & Usability

**Entry Points:**
- Main discovery.md provides orientation
- Domain-specific entry points current
- Navigation guides accurate

**Search & Discovery:**
- Key terms in appropriate nodes
- Tag consistency
- Discovery records use effective keywords
- Location indexes current

### 5. Metadata Consistency

- Complete classification on all nodes
- Consistent date formatting
- Accurate stability ratings
- Proper confidence levels

## Red Flags to Check

1. Planning documents in project root
2. Architecture diagrams outside context network
3. Orphaned nodes with no connections
4. Circular navigation paths
5. Missing bidirectional links
6. Stale "Dynamic" content
7. Undefined relationship types
8. Inconsistent classification schemes
9. Missing change history
10. Build artifacts in context network
11. Discovery records without keywords
12. Location indexes with stale paths
13. Learning paths not connected to discoveries
14. Obsolete content not archived

## Output Format

```markdown
# Context Network Audit Report - [Date]

## Executive Summary
- Overall health score
- Critical issues requiring attention
- Key recommendations

## Detailed Findings

### Structural Integrity
- [Issues with examples]
- [Severity ratings]
- [Recommended fixes]

### Relationship Network
- [Link integrity issues]
- [Missing connections]

### Content Accuracy
- [Outdated information]
- [Missing documentation]

### Navigation & Usability
- [Navigation issues]
- [Discovery problems]

## Prioritized Recommendations

### Critical (Address Immediately)
1. [Issue] → [Fix] → [Impact]

### High Priority (This Week)
1. [Issue] → [Fix] → [Impact]

### Medium Priority (This Month)
1. [Issue] → [Fix] → [Impact]

## Process Improvements
- [Workflow changes]
- [Automation opportunities]
```

## Orchestration Notes

Maintenance is typically run:
- At workflow boundaries (sprint end, week end)
- Before major planning sessions
- When navigation feels difficult
- Ensures context network remains useful
