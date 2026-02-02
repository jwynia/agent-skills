# Status Command Reference

Project health and progress reporting.

## Purpose

Provide comprehensive overview of project health, progress, risks, and recommendations.

## When Used in Workflow

- **Daily Morning**: Quick health check
- **Sprint Start**: Baseline status
- **Sprint End**: Sprint metrics

## Common Invocation Patterns

```bash
status                    # Detailed report (default)
status --brief           # Quick summary (1-2 paragraphs)
status --sprint          # Focus on current sprint
status --metrics         # Include quantitative metrics
status --risks           # Emphasize risks and blockers
```

## Assessment Process

### Phase 1: Progress Evaluation

**Task Status Analysis:**
- Review `/tasks/` for completion rates
- Check `/planning/sprint-*.md` for progress
- Analyze `/planning/backlog.md` for remaining work

**Velocity Metrics:**
- Tasks completed this period
- Tasks in progress
- Tasks blocked
- Completion rate vs plan

### Phase 2: Health Indicators

**Code Quality:**
- Recent test coverage changes
- Technical debt accumulation
- Code complexity trends
- Recent audit findings

**Documentation:**
- Context network currency
- Documentation coverage
- Discovery records created
- Knowledge gaps identified

**Process:**
- Decision velocity
- Blocker resolution time
- Collaboration effectiveness

### Phase 3: Risk Assessment

**Current Risks:**
- Technical risks and mitigation
- Schedule risks and impact
- Resource constraints
- External dependencies

**Emerging Concerns:**
- New technical debt
- Architectural drift
- Process breakdowns
- Knowledge silos

### Phase 4: Recommendations

**Immediate Actions:**
- Critical issues to address
- Quick wins available
- Blockers to resolve

**Strategic Adjustments:**
- Process improvements
- Architecture refinements
- Resource reallocations

## Output Format

```markdown
# Project Status Report - [Date]

## Executive Summary
[1-2 paragraph overview]

## Progress Overview

### Current Sprint/Milestone
- **Goal**: [Objective]
- **Progress**: X/Y tasks (Z%)
- **Days Remaining**: N
- **Status**: On Track | At Risk | Behind

### Velocity
- **This Period**: X tasks completed
- **Average**: Y tasks/period
- **Trend**: Improving | Stable | Declining

## Key Accomplishments
- [Achievement 1]
- [Achievement 2]

## Current Focus
- [Priority 1]
- [Priority 2]

## Health Indicators

### Code Quality
- **Test Coverage**: X%
- **Technical Debt**: Low/Medium/High
- **Build Status**: Passing | Failing

### Documentation
- **Currency**: X% up-to-date
- **Coverage**: Y% documented

## Risks & Blockers

### Critical Issues
1. **[Issue]**
   - Impact: [Description]
   - Action: [What to do]

### Warnings
1. **[Concern]**
   - Risk: [What might happen]
   - Mitigation: [Prevention]

## Recommendations

### Immediate (This Week)
1. [Most urgent]
2. [Second priority]

### Short-term (This Sprint)
- [Process improvement]
- [Technical adjustment]

## Upcoming Milestones
- [Date] - [Milestone 1]
- [Date] - [Milestone 2]
```

## Status Indicators

Use consistently:
- On Track / At Risk / Behind
- Improving / Stable / Declining
- Complete / In Progress / Waiting / Blocked

## Orchestration Notes

Status provides context for workflow decisions:
- Morning: informs task selection
- Sprint boundaries: guides planning
- Risk-focused: prioritizes blockers
