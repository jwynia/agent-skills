# Quick Command Sequences Reference

## 🌅 Daily Sequences

### Morning (5 min)
```bash
/sync --last 1d --dry-run
/status --brief --sprint
/groom --ready-only
```
*Start your day knowing what's real, what's important, and what's ready.*

### Evening (10 min)
```bash
/checklist
/discovery
/sync --last 1d
```
*End your day capturing knowledge and updating reality.*

## 📅 Weekly Sequences

### Monday Planning (30 min)
```bash
/sync --last 1w
/status --detailed --metrics
/retrospective
/groom --stale 7
/groom --generate-sprint
```
*Start your week with clean slate and clear plan.*

### Friday Review (45 min)
```bash
/audit --scope modified
/review-tests --branch
/maintenance
/status --sprint --risks
```
*End your week with quality checked and risks identified.*

## 🏃 Sprint Sequences

### Sprint Start (60 min)
```bash
/sync --all
/groom --all
/plan sprint-goals
/status --detailed
```
*Begin sprint with everything aligned and ready.*

### Sprint End (90 min)
```bash
/sync --sprint
/retrospective
/audit --scope sprint
/status --metrics --detailed
/maintenance --deep
```
*Close sprint with learnings captured and quality reviewed.*

## 🚀 Quick Checks

### Before Committing (2 min)
```bash
/review-tests --staged
/audit --staged --quick
```
*Catch issues before they enter the codebase.*

### After Merging (10 min)
```bash
/sync --last 1h
/audit --scope modified
/discovery
```
*Document what just landed in main.*

### Health Check (15 min)
```bash
/sync --last 1d
/status --brief --risks
/groom --blocked
```
*Quick pulse check on project health.*

## 🔥 Special Situations

### After Production Issue
```bash
/sync --all
/status --risks
/audit --security --performance
/retrospective
/plan "prevention-measures"
```
*Learn from incidents and prevent recurrence.*

### Before Release
```bash
/sync --all
/audit --all --strict
/review-tests --all --coverage 90
/status --detailed --risks
/checklist
```
*Ensure everything is ready for production.*

### New Team Member
```bash
/status --detailed
/discovery --all
/groom --ready-only
```
*Get someone productive quickly.*

## 📊 Recommended Cadence

| Sequence | Frequency | Time | Critical? |
|----------|-----------|------|-----------|
| Morning Standup | Daily | 5 min | Yes |
| Evening Wrap-up | Daily | 10 min | No |
| Monday Planning | Weekly | 30 min | Yes |
| Friday Review | Weekly | 45 min | No |
| Sprint Start | Bi-weekly | 60 min | Yes |
| Sprint End | Bi-weekly | 90 min | Yes |
| Health Check | Monthly | 2-3 hrs | No |

## 🎯 One-Liner Sequences

**"What should I work on?"**
```bash
/groom --ready-only
```

**"What's the status?"**
```bash
/status --brief
```

**"Is my code okay?"**
```bash
/audit --uncommitted
```

**"What did we learn?"**
```bash
/retrospective
```

**"Is everything documented?"**
```bash
/sync --dry-run
```

**"What's broken?"**
```bash
/status --risks
```

**"Clean things up"**
```bash
/maintenance
```

## 💡 Pro Tips

1. **Chain related commands**: Output from one informs the next
2. **Use --dry-run first**: Preview before applying changes
3. **Start with --brief**: Get overview before diving deep
4. **End with /checklist**: Never lose important work
5. **Document immediately**: /discovery while memory is fresh

## 🔄 Command Combinations

### The Reality Check
```bash
/sync --dry-run && /status --brief
```
*What's planned vs what's real?*

### The Quality Sweep
```bash
/audit --modified && /review-tests --uncommitted
```
*How good is recent work?*

### The Planning Combo
```bash
/groom --all && /plan next-sprint
```
*Get ready for what's next.*

### The Knowledge Capture
```bash
/discovery && /retrospective
```
*Document learnings and insights.*

### The Risk Scanner
```bash
/status --risks && /audit --security
```
*What could go wrong?*

## 📈 Automation Priority

Start automating in this order:
1. Daily Morning Standup (highest value, lowest effort)
2. Pre-commit Checks (catch issues early)
3. Weekly Monday Planning (maintain momentum)
4. Sprint End Sequence (ensure closure)
5. Monthly Health Check (proactive maintenance)

Remember: **Consistency beats intensity**. Better to run simple sequences daily than complex ones rarely.