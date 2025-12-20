# Command Sequences Guide

This document defines logical sequences of commands that work together to accomplish common workflows. These sequences can be run manually or automated via scheduled jobs.

## Daily Sequences

### Morning Standup Sequence
**Purpose**: Start the day with reality check, understand sprint progress, and identify ready work.
**When**: Daily at start of work (e.g., 9:00 AM)

```bash
/sync --last 1d --dry-run     # Check what actually got done yesterday
/status --brief --sprint       # Quick sprint health check
/groom --ready-only           # Show today's actionable tasks
```

**Expected Time**: 5-10 minutes
**Key Outcomes**:
- Understanding of yesterday's actual progress
- Current sprint status
- Clear list of today's priorities

### Evening Wrap-up Sequence
**Purpose**: Capture knowledge before context is lost, sync documentation with actual work.
**When**: Daily at end of work (e.g., 5:30 PM)

```bash
/checklist                    # Ensure nothing important is lost
/discovery                    # Document any learnings from today
/sync --last 1d              # Update task statuses to reflect reality
```

**Expected Time**: 10-15 minutes
**Key Outcomes**:
- No lost insights or discoveries
- Task statuses reflect reality
- Context network is current

## Weekly Sequences

### Monday Planning Sequence
**Purpose**: Start week with clear understanding of where things stand and what to focus on.
**When**: Monday morning (e.g., 9:00 AM)

```bash
/sync --last 1w              # Sync last week's actual progress
/status --detailed --metrics  # Full health assessment
/retrospective               # Document lessons from last week
/groom --stale 7            # Re-groom aging tasks
/groom --generate-sprint    # Plan the week's sprint
```

**Expected Time**: 30-45 minutes
**Key Outcomes**:
- Last week's work properly documented
- Lessons learned captured
- Fresh, actionable task backlog
- Clear sprint plan for the week

### Friday Review Sequence
**Purpose**: Quality control, cleanup, and risk identification before weekend.
**When**: Friday afternoon (e.g., 3:00 PM)

```bash
/audit --scope modified      # Review week's code changes
/review-tests --branch       # Check test quality for week's work
/maintenance                 # Clean up and organize
/status --sprint --risks     # End-of-week risk assessment
```

**Expected Time**: 45-60 minutes
**Key Outcomes**:
- Code quality issues identified
- Test quality validated
- Documentation organized
- Risks documented for Monday

## Sprint Sequences (Bi-Weekly)

### Sprint Start Sequence
**Purpose**: Clean slate for new sprint with properly groomed backlog.
**When**: First day of sprint

```bash
/sync --all                  # Full reality sync
/groom --all                # Comprehensive grooming
/plan sprint-goals          # Define sprint architecture needs
/status --detailed          # Baseline status
```

**Expected Time**: 60-90 minutes
**Key Outcomes**:
- Complete alignment with reality
- All tasks properly groomed
- Architecture needs identified
- Sprint baseline established

### Sprint End Sequence
**Purpose**: Close out sprint properly with full documentation and quality review.
**When**: Last day of sprint

```bash
/sync --sprint              # Final sprint sync
/retrospective             # Sprint retrospective
/audit --scope sprint      # Sprint code quality review
/status --metrics --detailed # Sprint metrics and analysis
/maintenance --deep        # Deep cleanup between sprints
```

**Expected Time**: 90-120 minutes
**Key Outcomes**:
- Sprint work fully documented
- Retrospective insights captured
- Quality metrics recorded
- Ready for next sprint

## Monthly Sequences

### Monthly Health Check
**Purpose**: Deep health assessment and proactive maintenance.
**When**: First Monday of month (e.g., 10:00 AM)

```bash
/sync --all --verbose              # Deep sync with evidence
/audit --all --strict             # Comprehensive quality audit
/maintenance --deep               # Thorough cleanup
/refactor --metrics --safe       # Identify refactoring opportunities
/status --detailed --metrics --risks # Full health report
```

**Expected Time**: 2-3 hours
**Key Outcomes**:
- Complete system health assessment
- All quality issues identified
- Refactoring opportunities catalogued
- Comprehensive status report

### Monthly Architecture Review
**Purpose**: Strategic technical assessment and planning.
**When**: Mid-month (e.g., 15th at 2:00 PM)

```bash
/audit --scope architecture       # Architecture health check
/review-tests --all --coverage 80 # Test coverage analysis
/groom --complexity large        # Review complex tasks
/research "technical debt"      # Research debt reduction strategies
```

**Expected Time**: 2-3 hours
**Key Outcomes**:
- Architecture issues identified
- Test coverage gaps found
- Complex tasks re-evaluated
- Debt reduction strategies researched

## Continuous Integration Sequences

### Pre-Commit Sequence
**Purpose**: Catch issues before they're committed.
**When**: Before git commit (via git hook)

```bash
/review-tests --staged          # Review test changes
/audit --staged --quick        # Quick quality check
```

**Expected Time**: 2-5 minutes
**Key Outcomes**:
- Test quality validated
- No obvious issues committed

### Post-Merge Sequence
**Purpose**: Ensure merged code is documented and tracked.
**When**: After PR merge

```bash
/sync --last 1h               # Sync merged changes
/audit --scope modified       # Audit merged code
/discovery                   # Document any new patterns/learnings
```

**Expected Time**: 10-15 minutes
**Key Outcomes**:
- Merged changes tracked
- Quality verified
- Patterns documented

## Special Event Sequences

### Onboarding Sequence
**Purpose**: Quickly bring new team member up to speed.
**When**: New team member joins

```bash
/status --detailed           # Current state overview
/discovery --all            # Share all discoveries
/groom --ready-only        # Show available tasks
```

**Expected Time**: 30-45 minutes
**Key Outcomes**:
- New member understands current state
- Has access to team knowledge
- Knows what tasks are available

### Crisis Recovery Sequence
**Purpose**: Recover from and learn from production issues.
**When**: After production incident

```bash
/sync --all                 # Understand current reality
/status --risks            # Identify all risks
/audit --security --performance # Deep security/perf check
/retrospective            # Document incident learnings
/plan "prevention-measures" # Plan preventive measures
```

**Expected Time**: 2-4 hours
**Key Outcomes**:
- Current state understood
- All risks identified
- Security/performance validated
- Lessons documented
- Prevention plan created

### Release Preparation Sequence
**Purpose**: Ensure readiness for production release.
**When**: Before major release

```bash
/sync --all                    # Ensure documentation current
/audit --all --strict         # Full quality check
/review-tests --all --coverage 90 # Verify test coverage
/status --detailed --risks    # Risk assessment
/checklist                    # Final pre-release check
```

**Expected Time**: 3-4 hours
**Key Outcomes**:
- All changes documented
- Quality validated
- Test coverage confirmed
- Risks identified
- Release checklist complete

## Automation Configuration

These sequences can be automated using cron jobs, CI/CD pipelines, or task schedulers. Example configuration:

```yaml
# .claude/schedules.yaml
version: 1
schedules:
  daily:
    morning_standup:
      time: "09:00"
      timezone: "America/New_York"
      workdays_only: true
      commands:
        - "/sync --last 1d --dry-run"
        - "/status --brief --sprint"
        - "/groom --ready-only"
      notify_on_error: true
      
    evening_wrapup:
      time: "17:30"
      workdays_only: true
      commands:
        - "/checklist"
        - "/discovery"
        - "/sync --last 1d"
      optional: true  # Don't fail if skipped
  
  weekly:
    monday_planning:
      day: "monday"
      time: "09:00"
      commands:
        - "/sync --last 1w"
        - "/status --detailed --metrics"
        - "/retrospective"
        - "/groom --stale 7"
        - "/groom --generate-sprint"
      requires_confirmation: true
    
    friday_review:
      day: "friday"
      time: "15:00"
      commands:
        - "/audit --scope modified"
        - "/review-tests --branch"
        - "/maintenance"
        - "/status --sprint --risks"
      generate_report: true
  
  monthly:
    health_check:
      day_of_month: 1
      time: "10:00"
      commands:
        - "/sync --all --verbose"
        - "/audit --all --strict"
        - "/maintenance --deep"
        - "/refactor --metrics --safe"
        - "/status --detailed --metrics --risks"
      output_to: "monthly-health-report.md"
  
  triggered:
    pre_commit:
      trigger: "git:pre-commit"
      commands:
        - "/review-tests --staged"
        - "/audit --staged --quick"
      blocking: true  # Block commit on failure
    
    post_merge:
      trigger: "git:post-merge"
      commands:
        - "/sync --last 1h"
        - "/audit --scope modified"
        - "/discovery"
      async: true  # Run in background
```

## Sequence Principles

### 1. Order Matters
- **Start with sync** - Always understand reality first
- **Document before forgetting** - Run discovery/retrospective while context is fresh
- **Clean as you go** - Regular maintenance prevents debt buildup
- **Review at boundaries** - Sprint/week ends are good for quality checks
- **Plan with fresh data** - Groom and plan after syncing

### 2. Escalate Depth Over Time
- **Daily**: Quick checks (5-15 min)
- **Weekly**: Thorough review (30-60 min)
- **Sprint**: Comprehensive assessment (1-2 hours)
- **Monthly**: Deep analysis (2-4 hours)

### 3. Fail Fast, Recover Gracefully
- Pre-commit checks should be fast and blocking
- Daily sequences should be resilient to failures
- Weekly/monthly sequences should generate reports even on partial failure

### 4. Context Preservation
- Each sequence should be self-contained
- Output from one command should inform the next
- Final command should summarize or checkpoint

## Customization Guide

### Creating Custom Sequences

1. **Identify the Goal**: What outcome do you want?
2. **Determine Frequency**: How often should this run?
3. **Order Commands**: What sequence makes sense?
4. **Set Time Budget**: How long can this take?
5. **Define Success**: What indicates completion?

### Example Custom Sequence

```bash
# "Tech Debt Friday" - Weekly debt reduction focus
/audit --scope "technical-debt"    # Find debt items
/groom --tag "tech-debt"          # Groom debt tasks
/refactor --safe --preview        # Identify safe refactorings
/plan "debt-reduction"            # Plan debt work
/status --tag "tech-debt"         # Report on debt status
```

## Monitoring & Metrics

Track sequence effectiveness:

### Success Metrics
- **Completion Rate**: How often do sequences finish?
- **Time to Complete**: Are they within budget?
- **Issues Found**: What problems do they catch?
- **Action Items Generated**: What work do they identify?

### Health Indicators
- Increasing sequence duration → Growing complexity
- Decreasing issues found → Improving quality
- Skipped sequences → Team overload
- Failed sequences → Environment issues

## Best Practices

1. **Start Small**: Begin with daily sequences, add weekly, then monthly
2. **Monitor Fatigue**: If sequences are ignored, they're too frequent
3. **Adjust Timing**: Run sequences when team can act on results
4. **Keep It Relevant**: Remove commands that rarely provide value
5. **Document Changes**: Track why sequences were modified
6. **Review Quarterly**: Assess if sequences still serve their purpose

## Quick Start Recommendations

For a new project, start with these three sequences:

1. **Daily Morning Standup** - Maintains daily alignment
2. **Weekly Monday Planning** - Keeps backlog fresh
3. **Sprint End Sequence** - Ensures proper closure

These provide the minimum viable process for maintaining project health and documentation currency.