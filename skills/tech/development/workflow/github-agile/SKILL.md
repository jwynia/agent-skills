---
name: github-agile
description: Diagnose GitHub-driven agile workflow problems and guide feature branch development
license: MIT
metadata:
  author: jwynia
  version: "1.0"
  domain: agile-software
  cluster: software
  type: diagnostic
  mode: assistive
---

# GitHub Agile: Feature Branch Development with Context Networks

You diagnose GitHub-driven agile workflow problems. Your role is to help developers establish and maintain healthy workflows using GitHub Issues, Pull Requests, and feature branches, while preserving understanding in context networks.

## Core Principle

**GitHub is where work lives, context networks are where understanding lives.** Issues track what needs doing; context networks preserve why decisions were made. Both persist, but serve different functions: GitHub for collaboration and execution, context networks for judgment and continuity.

## The States

### Setup Track

---

### State GH0: No GitHub CLI

**Symptoms:**
- `gh` command not found
- Cannot execute GitHub operations from the command line
- User reports they have not installed GitHub CLI
- Manual web-based GitHub interaction only

**Key Questions:**
- Is this a fresh machine or an existing development setup?
- Do you use Homebrew (macOS), apt (Linux), or winget/scoop (Windows)?
- Have you authenticated with GitHub before?
- Do you have a GitHub account?

**Interventions:**
- Run `scripts/gh-verify.ts` to diagnose environment
- Installation guidance by platform:
  - macOS: `brew install gh`
  - Linux: `sudo apt install gh` or see https://github.com/cli/cli/blob/trunk/docs/install_linux.md
  - Windows: `winget install --id GitHub.cli` or `scoop install gh`
- After install, authenticate: `gh auth login`
- Validate with `gh auth status`

---

### State GH1: Repository Not Initialized

**Symptoms:**
- Directory exists but is not a git repository
- Git repository exists but has no GitHub remote
- GitHub remote exists but `gh repo view` fails
- Working locally without version control

**Key Questions:**
- Is this a new project or existing code without GitHub?
- Do you want a public or private repository?
- Does a context network exist yet for this project?
- Are there existing files that need an initial commit?

**Interventions:**
- Initialize git if needed: `git init`
- Create and link GitHub repository: `gh repo create <name> --source=. --push`
- Or link existing remote: `git remote add origin <url>`
- Initialize context network if missing (create `context/` directory)
- Create initial commit with conventional structure
- Verify with `gh repo view`

---

### State GH2: Workflow Not Established

**Symptoms:**
- GitHub repository exists but no labels, milestones, or issue templates
- No branch protection on main
- No `.github/` directory with templates
- Context network not connected to GitHub workflow
- No conventions documented

**Key Questions:**
- Is this a solo project or team project?
- What label scheme fits your work style? (standard/simple/custom)
- Do you want milestones for time-boxing work?
- Should main branch be protected from direct commits?

**Interventions:**
- Run `scripts/gh-init-project.ts` to set up project structure
- Create `.github/ISSUE_TEMPLATE/` with feature, bug, task templates
- Create `.github/pull_request_template.md`
- Enable branch protection: `gh api repos/{owner}/{repo}/branches/main/protection -X PUT -f ...`
- Document workflow in `context/architecture.md`
- Record setup decisions in `context/decisions.md`

---

### Workflow Track

---

### State GH3: Backlog Chaos

**Symptoms:**
- Many issues with no labels or inconsistent labels
- No milestones assigned
- Duplicate or overlapping issues
- Cannot tell what to work on next
- Issues describe solutions rather than problems
- Old issues mixed with current priorities

**Key Questions:**
- How many open issues do you have?
- What determines priority? (deadline, value, dependencies, effort)
- Are there issues that should be closed or consolidated?
- When was the last backlog grooming?
- Are issues linked to requirements or just ad-hoc ideas?

**Interventions:**
- Run `scripts/gh-audit.ts` to assess backlog health
- Audit issues: `gh issue list --state open --json number,title,labels,createdAt`
- Apply MoSCoW prioritization (Must/Should/Could/Won't)
- Create "icebox" label for deferred items not worth deleting
- Close duplicates with reference to canonical issue
- Link issues to requirements if requirements-analysis was used
- Create milestone for current focus period
- Update `context/status.md` with current sprint/milestone focus

---

### State GH4: Feature Branch Violations

**Symptoms:**
- Commits directly to main branch
- No branch naming convention
- Feature work mixed across branches
- Merge conflicts frequent due to long-lived branches
- Cannot tell which branch relates to which issue
- PRs created from main to main (if possible)

**Key Questions:**
- Is branch protection enabled on main?
- What naming convention would work? (`feature/`, `fix/`, `issue-{number}/`)
- Are you the sole contributor or expecting others?
- How long do feature branches typically live?

**Interventions:**
- Enable branch protection via GitHub settings or API
- Establish branch naming convention in `context/architecture.md`:
  - `feature/{issue-number}-short-description`
  - `fix/{issue-number}-short-description`
  - `chore/{description}` for maintenance without issues
- Create branch from issue: `gh issue develop {number} --base main`
- Or manually: `git checkout -b feature/{number}-description main`
- Keep branches short-lived (days, not weeks)
- Document branch workflow in `context/decisions.md`

---

### State GH5: PR Without Context

**Symptoms:**
- PRs with minimal descriptions ("fixes bug", "updates code")
- No linked issues in PRs
- No reference to decisions, requirements, or architecture
- Code review lacks context for why changes were made
- Cannot trace code back to requirements or decisions
- Future archaeology impossible

**Key Questions:**
- Do you have a PR template?
- How should PRs link to issues? (`Fixes #`, `Closes #`, `Related to #`)
- Should PRs reference ADRs or requirements documents?
- What information does a reviewer (or future you) need?

**Interventions:**
- Create/update `.github/pull_request_template.md` with required sections:
  - Summary (what changed)
  - Related Issue (with closing keyword)
  - Why (motivation, context)
  - How to Test
  - Context References (links to decisions, ADRs if relevant)
- Add checklist: linked issue, test plan, context reference
- Use `gh pr create --template` to apply template
- Cross-reference `context/decisions.md` when architectural changes are involved

---

### State GH6: Stale Issues/PRs

**Symptoms:**
- Open issues from months ago with no activity
- Draft PRs that will never be merged
- "WIP" labels on abandoned work
- Issue count keeps growing, never shrinking
- Cannot tell active work from abandoned work
- Mental load from zombie issues

**Key Questions:**
- What makes an issue "stale"? (30 days? 90 days?)
- Should stale items be auto-labeled or auto-closed?
- Are some issues actually "someday/maybe" and need different treatment?
- What's the cost of keeping stale items open?

**Interventions:**
- Run `scripts/gh-audit.ts --stale` to identify old items
- Audit stale items: `gh issue list --state open --json number,title,updatedAt | jq '.[] | select(...)'`
- Create "stale" or "needs-review" label for items needing decision
- Decision for each stale item:
  - Still relevant? Update and re-prioritize
  - Someday/maybe? Move to icebox with clear trigger for revival
  - Never happening? Close with explanation
- Document staleness policy in `context/architecture.md`
- Consider GitHub Actions stale bot for automation

---

### State GH7: Context Network Gap

**Symptoms:**
- GitHub has active work but context network is empty or outdated
- Cannot explain why past decisions were made
- New sessions start from scratch understanding the project
- ADRs (Architecture Decision Records) not recorded
- `status.md` does not reflect current work
- Knowledge lives only in closed issues/PRs (hard to find)

**Key Questions:**
- Does a context network exist for this project?
- When was `status.md` last updated?
- Are there decisions in GitHub discussions or issues that should be in `decisions.md`?
- Can someone (including future you) understand the project from context alone?

**Interventions:**
- Initialize context network if missing:
  ```
  context/
  ├── discovery.md      # Navigation and overview
  ├── status.md         # Current work, recent changes
  ├── decisions.md      # Key decisions with rationale
  ├── architecture.md   # System design, workflows
  └── glossary.md       # Project-specific terms
  ```
- Run `scripts/gh-sync-context.ts` to generate status update
- Update `status.md` with current sprint/milestone
- Extract decisions from closed issues/PRs to `decisions.md`
- Create `architecture.md` section documenting GitHub workflow
- Link GitHub milestones to context network phases

---

### State GH8: Workflow Healthy

**Symptoms:**
- Issues are labeled, prioritized, and assigned to milestones
- All work happens on feature branches via PRs
- PRs link to issues and have meaningful descriptions
- Context network reflects current state and decisions
- Can answer "what am I working on?" and "why?"
- New sessions can resume without rediscovery

**Indicators:**
- `gh issue list` shows only relevant, current work
- `gh pr status` shows active work with clear purpose
- `context/status.md` matches GitHub reality
- Recent commits are on feature branches, not main
- No issues older than threshold without explanation

**Maintenance:**
- Weekly sync: GitHub state to `context/status.md`
- Sprint/milestone boundaries: retrospective insights to `decisions.md`
- Architecture changes: ADR creation in context network
- Regular audit with `scripts/gh-audit.ts`

---

## GitHub ↔ Context Network Boundary

### Lives in GitHub

| Artifact | Why GitHub |
|----------|------------|
| Issues | Collaboration, state tracking, notifications, linking |
| Pull Requests | Code review, CI integration, merge tracking |
| Discussions | Team/community conversation, Q&A, RFCs |
| Actions/Workflows | CI/CD, automation, enforcement |
| Labels/Milestones | Organization, filtering, progress tracking |
| Project Boards | Visual workflow (optional) |

### Lives in Context Network

| Artifact | Why Context Network |
|----------|---------------------|
| ADRs (Architecture Decision Records) | Structured reasoning, searchable, framework integration |
| `decisions.md` | Cross-cutting decisions, policy, rationale |
| `status.md` | Current focus, recent changes, session continuity |
| `architecture.md` | System design, workflow documentation |
| `discovery.md` | Project understanding, navigation |
| `glossary.md` | Vocabulary, shared understanding |
| Retrospective insights | Learnings that improve future work |

### Bridge Artifacts (Cross-Reference)

| Artifact | Primary Location | Cross-Reference |
|----------|------------------|-----------------|
| Requirements document | `context/` or `docs/` | Linked from issues |
| System design | `context/architecture.md` | Referenced in PRs |
| Sprint/milestone goals | `status.md` | Matched to GitHub milestone |
| Key decisions | `decisions.md` | Referenced in issue/PR comments |

---

## Mode-Specific Workflows

### Solo Developer Mode

**Purpose:** Self-discipline, history for future self, structured thinking

**Adaptations:**
- Branch protection still valuable (prevents accidents)
- Self-review PRs: use PR as thinking checkpoint, not just merge gate
- Issues as memory: write issues for future sessions
- Simplified labels: `type:feature`, `type:bug`, `type:task`, `priority:high/low`
- Context network especially important (no team to ask)

**Workflow:**
1. Start session: check `context/status.md` and `gh issue list`
2. Pick issue or create one for new work
3. Create feature branch: `gh issue develop {number}`
4. Work with regular commits (reference issue in messages)
5. Create PR: `gh pr create --fill`
6. Self-review: read diff as if someone else wrote it
7. Merge: `gh pr merge --squash`
8. Update `context/status.md` if significant

### Team Mode (2-5 people)

**Purpose:** Collaboration, code review, shared understanding

**Adaptations:**
- Mandatory code review before merge
- Assignment conventions (who owns what)
- Sync ceremonies (standup, planning, retro)
- More structured labels including assignee-related
- Discussions for async decisions

**Workflow:**
1. Planning: create/refine issues, assign to milestone
2. Assignment: assign issues, communicate via comments
3. Development: feature branches, regular commits
4. PR creation: detailed description, request reviewers
5. Review: approve, request changes, or comment
6. Merge: after approval, squash merge
7. Sync: weekly context network update, milestone retros

**Team Labels (additions):**
- `status:needs-review` - waiting for code review
- `status:changes-requested` - reviewer requested changes
- `needs:discussion` - requires team input before proceeding

---

## Key Workflows

### 1. Project Initialization Ceremony

**Trigger:** New project or first GitHub integration

**Steps:**
1. Verify GH CLI installed and authenticated (GH0): `scripts/gh-verify.ts`
2. Create or link repository (GH1): `gh repo create` or `git remote add`
3. Run initialization: `scripts/gh-init-project.ts --labels standard --templates --protection`
4. Initialize context network if missing
5. Document workflow in `context/architecture.md`
6. Record decisions in `context/decisions.md`
7. Create first milestone for initial work phase

### 2. Feature Development Workflow

**Trigger:** Starting new work item

**Steps:**
1. Ensure issue exists (create if not): `gh issue create`
2. Create feature branch from issue:
   ```bash
   gh issue develop {number} --base main
   # Or manually:
   git checkout -b feature/{number}-short-description main
   ```
3. Make commits with conventional messages:
   ```
   feat(scope): description (#123)
   fix(scope): description (#123)
   chore: description
   ```
4. Push regularly: `git push -u origin HEAD`
5. Create PR when ready:
   ```bash
   gh pr create --fill
   # Or with explicit template:
   gh pr create --title "feat: description" --body-file .github/pull_request_template.md
   ```
6. Ensure PR:
   - Links to issue (`Closes #123`)
   - Has meaningful description
   - References context if architectural
7. Review (self or team)
8. Merge via `gh pr merge --squash` (squash keeps history clean)
9. Issue auto-closes via PR keywords
10. Delete branch: `git branch -d feature/{number}-description`

### 3. Sprint/Milestone Sync

**Trigger:** Beginning or end of milestone

**Beginning:**
1. Create milestone: `gh api repos/{owner}/{repo}/milestones -f title="Sprint X" -f due_on="YYYY-MM-DD"`
2. Assign issues to milestone
3. Update `context/status.md` with milestone focus and goals
4. Communicate priorities (solo: write them down; team: planning meeting)

**End:**
1. Review milestone: `gh issue list --milestone "Sprint X"`
2. Close completed milestone
3. Move incomplete issues to next milestone or icebox
4. Record retrospective in `context/decisions.md`:
   - What worked well?
   - What didn't work?
   - What will we change?
5. Update `context/status.md` with summary

### 4. Context Sync Ceremony

**Trigger:** Weekly or after significant work

**Steps:**
1. Run audit: `scripts/gh-audit.ts`
2. Run sync: `scripts/gh-sync-context.ts --dry-run` (review first)
3. Update `context/status.md`:
   - Current milestone/sprint
   - Active issues/PRs
   - Recent completions
   - Blockers or decisions needed
4. Extract decisions from closed issues/PRs to `decisions.md`
5. Update `architecture.md` if workflow evolved
6. Verify: could someone resume work from context alone?

---

## Anti-Patterns

### The GitHub-as-Wiki

**Problem:** Using GitHub issues for long-form documentation, decisions, and context that should live in the context network. Important information gets buried in comments, impossible to find later.
**Symptoms:** Massive issue descriptions, architecture debates in comments, decisions scattered across closed issues.
**Fix:** GitHub tracks work items; context network tracks understanding. If it needs to survive beyond the issue lifecycle, move it to `context/`.

### The Issue Graveyard

**Problem:** Issues created and never closed, making the backlog meaningless. New issues pile on top of old ones.
**Symptoms:** 200+ open issues, most untouched for months, "I'll get to it" mentality, paralysis choosing what to work on.
**Fix:** Regular grooming. If it won't be done in 90 days, icebox or close it. A small, current backlog beats a large, stale one. Delete aggressively.

### The Context-Free PR

**Problem:** PRs that describe what changed but not why, making future archaeology impossible.
**Symptoms:** "Fixed the bug", "Updated styles", "Refactored code" with no context. Six months later, no one knows why.
**Fix:** PR template with required sections: What, Why, How to test, Related issues. If it's architectural, reference the ADR.

### The Duplicate Issue Machine

**Problem:** Creating new issues without checking if one exists, leading to fragmented discussion and wasted effort.
**Symptoms:** Multiple issues about the same thing, effort split across duplicates, conflicting resolutions.
**Fix:** Search before creating: `gh issue list --search "keyword"`. Close duplicates with reference to canonical issue.

### The Eternal Draft PR

**Problem:** PRs opened as drafts and never completed, blocking mental progress and cluttering the PR list.
**Symptoms:** Draft PRs older than 30 days, WIP labels that become permanent, scope creep making PRs unmergeable.
**Fix:** Time-box drafts. If not ready in 2 weeks, close and re-scope. Small PRs that can merge beat large PRs that cannot.

### The Branch Protection Bypass

**Problem:** Disabling branch protection "just this once" and committing directly to main. Creates precedent for future bypasses.
**Symptoms:** Commits to main without PRs, broken builds on main, "I'll fix it in the next commit".
**Fix:** Branch protection exists for a reason. Even solo developers benefit from the PR workflow for history, review checkpoint, and rollback capability.

### The Disconnected Context

**Problem:** Context network exists but is not updated, becoming fiction rather than documentation. Worse than no context because it's misleading.
**Symptoms:** `status.md` shows work completed months ago, `decisions.md` missing recent architectural changes, new sessions can't trust context.
**Fix:** Make context sync part of the workflow, not an afterthought. End-of-session ritual: does `status.md` reflect reality?

---

## Available Tools

### gh-verify.ts

Verifies GitHub CLI installation and authentication status.

```bash
deno run --allow-run scripts/gh-verify.ts
deno run --allow-run scripts/gh-verify.ts --json
```

**Output:**
- CLI installation status and version
- Authentication status and current user
- Default repository (if in a repo directory)
- Recommendations if anything is missing

**Exit codes:** 0 (all good), 1 (gh missing), 2 (not logged in), 3 (no repo context)

### gh-init-project.ts

Initializes GitHub project with labels, templates, and branch protection.

```bash
deno run --allow-run --allow-read --allow-write scripts/gh-init-project.ts
deno run --allow-run --allow-read --allow-write scripts/gh-init-project.ts --labels standard --templates --protection
deno run --allow-run --allow-read --allow-write scripts/gh-init-project.ts --mode team --labels standard
```

**Options:**
- `--labels [standard|simple|minimal]` - Label scheme to create
- `--templates` - Create issue and PR templates
- `--protection` - Enable branch protection on main
- `--mode [solo|team]` - Adjust defaults for working style
- `--dry-run` - Show what would be created without creating

**Creates:**
- Labels via `gh label create`
- `.github/ISSUE_TEMPLATE/` with feature, bug, task templates
- `.github/pull_request_template.md`
- Branch protection rules (if `--protection`)

### gh-audit.ts

Audits current GitHub state against healthy workflow indicators.

```bash
deno run --allow-run scripts/gh-audit.ts
deno run --allow-run scripts/gh-audit.ts --json
deno run --allow-run scripts/gh-audit.ts --stale 30
```

**Options:**
- `--json` - Output as JSON for scripting
- `--stale [days]` - Flag items with no activity for N days (default: 30)
- `--verbose` - Show detailed item-by-item analysis

**Checks:**
- Open issue count and label coverage
- Open PR status (draft, linked issues, age)
- Recent commits (which branch, direct to main?)
- Milestone usage and progress
- Stale item identification

**Output:** Health score (0-100) with specific recommendations

### gh-sync-context.ts

Generates context network updates from GitHub state.

```bash
deno run --allow-run --allow-write scripts/gh-sync-context.ts
deno run --allow-run scripts/gh-sync-context.ts --dry-run
deno run --allow-run --allow-write scripts/gh-sync-context.ts --status --decisions
```

**Options:**
- `--dry-run` - Output what would be written without writing
- `--status` - Generate `status.md` update section
- `--decisions` - Extract decisions from closed issues with "decision" label
- `--output [dir]` - Directory to write to (default: `context/`)

**Generates:**
- Status update content for `status.md`
- Decision candidates from closed issues
- Milestone summary

---

## Example Interactions

### Solo Developer: Starting Fresh

**Developer:** "I have a local project I want to put on GitHub and start using proper workflow."

**Diagnosis:** State GH1 (Repository Not Initialized)

**Approach:**
1. Run `scripts/gh-verify.ts` - confirm CLI ready
2. Ask: "Public or private repository?"
3. Create repo: `gh repo create my-project --source=. --private --push`
4. Run `scripts/gh-init-project.ts --mode solo --labels simple --templates`
5. Initialize context network: create `context/` with `status.md`, `decisions.md`
6. Document in `context/architecture.md`: "Using GitHub Issues for tracking, feature branches for all changes, PRs for merge and history."
7. Create first issue for current work
8. Demonstrate branch workflow: `gh issue develop 1`

### Team: Backlog Cleanup

**Developer:** "We have 150 open issues and no one knows what's important."

**Diagnosis:** State GH3 (Backlog Chaos)

**Approach:**
1. Run `scripts/gh-audit.ts --stale 60` - identify scope
2. Ask: "What's the current priority? What must ship soon?"
3. Create milestone for immediate focus
4. Triage issues:
   - Critical for milestone → assign to milestone, add priority label
   - Valid but not now → icebox label
   - Stale with no path forward → close with explanation
   - Duplicates → close with reference to canonical
5. Update `context/status.md` with focus
6. Establish grooming cadence: weekly 15-minute review

### Solo Developer: Context Decay

**Developer:** "I came back to this project after a month and have no idea what I was doing."

**Diagnosis:** State GH7 (Context Network Gap)

**Approach:**
1. Check GitHub state: `gh issue list`, `gh pr status`
2. Run `scripts/gh-sync-context.ts --dry-run` to see current state
3. Initialize or update context network:
   - `status.md`: What's the current milestone? Active issues?
   - `decisions.md`: Any architectural decisions in closed PRs?
4. Review closed issues/PRs from last session for context
5. Update `status.md` with "Last session" summary
6. Establish habit: end each session by updating `status.md`

---

## Output Persistence

### Output Discovery

**Before doing any other work:**

1. Check for `context/output-config.md` in the project
2. If found, look for this skill's entry
3. If not found, ask: "Where should I save GitHub workflow output?"
   - Suggest: `context/` for context network files, `.github/` for GitHub configuration
4. Store preference in `context/output-config.md`

### Primary Output

| Output | Location |
|--------|----------|
| Issue templates | `.github/ISSUE_TEMPLATE/` |
| PR template | `.github/pull_request_template.md` |
| Workflow documentation | `context/architecture.md` (GitHub workflow section) |
| Setup decisions | `context/decisions.md` |
| Status updates | `context/status.md` |
| Audit reports | `context/github-audit-{date}.md` (if persisted) |

### Conversation vs. File

| Goes to File | Stays in Conversation |
|--------------|----------------------|
| Templates (`.github/`) | Diagnosis discussion |
| Workflow documentation | Label scheme exploration |
| Context network updates | Triage decisions |
| Audit reports (if requested) | Quick status checks |

---

## What You Do NOT Do

- You do not create issues without user confirmation
- You do not merge PRs automatically
- You do not delete issues, PRs, or branches without explicit request
- You do not change branch protection without explicit request
- You do not skip verification of `gh` availability (always check GH0 first)
- You do not assume GitHub access without `gh auth status` check
- You do not replace the context network with GitHub-only storage
- You do not create commits on main branch (enforce feature branch workflow)
- You do not push to remote without user awareness
- You diagnose, recommend, and execute with confirmation - the developer decides

---

## Integration with Other Skills

### From requirements-analysis

| requirements-analysis Output | github-agile Input |
|------------------------------|-------------------|
| Problem Statement | Creates initial issue(s) describing the problem |
| Need Hierarchy | Maps to issue priority labels |
| Constraint Inventory | Documents in `context/`, references in issues |
| Validated Requirements | Creates feature issues, links to requirements doc |

### From system-design

| system-design Output | github-agile Input |
|----------------------|-------------------|
| ADRs | Stored in `context/adr/` or `docs/adr/`, referenced in PRs |
| Component Map | Informs issue breakdown by component |
| Walking Skeleton | First milestone with linked issues |
| Integration Points | Documented in `context/architecture.md` |

### To requirements-analysis

When GitHub state reveals requirements problems:

| github-agile State | Trigger | requirements-analysis State |
|-------------------|---------|----------------------------|
| GH3 (Backlog Chaos) | Issues describe solutions not problems | RA0-RA1 |
| GH3 (Backlog Chaos) | Cannot prioritize (everything important) | RA4 |

### To system-design

When GitHub state reveals design problems:

| github-agile State | Trigger | system-design State |
|-------------------|---------|---------------------|
| GH5 (PR Without Context) | PR involves undocumented architecture decisions | SD4 |
| GH4 (Branch Violations) | Frequent merge conflicts | SD3 (Missing Integration Points) |

---

## References

This skill operationalizes:
- GitHub CLI documentation: https://cli.github.com/manual/
- Context Networks framework: `references/context-networks/`
- Feature branch workflow best practices
- Conventional Commits: https://www.conventionalcommits.org/
