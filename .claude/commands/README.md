# Claude Code Custom Commands

## Overview

This directory contains custom commands for Claude Code that extend its capabilities with specialized workflows and focused assistance patterns.

## Command Structure

Claude Code commands are Markdown files where:
- The filename (without `.md`) becomes the command name (e.g., `plan.md` → `/plan`)
- The content provides instructions and context for Claude
- `$ARGUMENTS` is replaced with user input when the command is invoked

## Available Commands

### Planning & Architecture
- `/plan [topic]` - Enter planning-only mode for architecture and design
- `/research [topic]` - Comprehensive research with MCP integration

### Implementation
- `/implement [task]` - Turn plans into working code with TDD approach
- `/refactor [target]` - Improve code structure without changing functionality

### Code Quality
- `/audit [scope]` - Comprehensive code quality and security review
- `/review-tests [scope]` - Review unit tests for quality and anti-patterns

### Task Management
- `/groom [scope]` - Transform task backlog into actionable items
- `/status [scope]` - Project health and progress report

### Maintenance & Sync
- `/sync` - Synchronize context network with actual project state
- `/maintenance` - Regular maintenance and cleanup tasks
- `/retrospective` - Review and document lessons learned

### Documentation
- `/discovery` - Document new findings and insights
- `/checklist` - Quick session closure checklist

## Command Syntax

### Basic Structure
```markdown
# Command Title

Brief description of the command's purpose.

## Input/Arguments
$ARGUMENTS

## Process
[Detailed instructions for Claude]

## Output Format
[Expected output structure]
```

### Common Patterns

1. **Role Definition**: Many commands start by defining Claude's role
   ```markdown
   You are a [Role] responsible for [Purpose].
   ```

2. **Phased Approach**: Commands often break work into phases
   ```markdown
   ### Phase 1: Discovery
   ### Phase 2: Analysis  
   ### Phase 3: Documentation
   ```

3. **Checklists**: Commands include validation checklists
   ```markdown
   - [ ] Item to verify
   - [ ] Another check
   ```

4. **Output Templates**: Structured formats for consistency
   ```markdown
   ## Output Format
   ```

## Creating New Commands

To add a new command:

1. Create a `.md` file in this directory
2. Name it according to the command (e.g., `analyze.md` for `/analyze`)
3. Structure the content to guide Claude through the task
4. Include clear success criteria and output formats

### Template for New Commands

```markdown
# [Command Purpose]

You are a [Role] responsible for [specific responsibility].

## Task
$ARGUMENTS

## Process

### Phase 1: [First Phase]
[Detailed steps]

### Phase 2: [Second Phase]
[Detailed steps]

## Output Format

[Specify the expected output structure]

## Success Criteria

- [ ] [Criterion 1]
- [ ] [Criterion 2]

## Notes

[Any additional context or warnings]
```

## Best Practices

1. **Be Specific**: Provide clear, actionable instructions
2. **Include Examples**: Show good and bad patterns where relevant
3. **Define Success**: Clear criteria for task completion
4. **Structure Output**: Specify exact format for responses
5. **Handle Edge Cases**: Include guidance for common issues

## Integration with Context Network

Most commands interact with the context network at `/context-network/`. Commands should:
- Read existing documentation before making changes
- Update relevant sections when work is completed
- Create new documentation in appropriate locations
- Maintain relationships between related documents

## Command Options

Many commands support options/flags passed as part of $ARGUMENTS:

### Common Options
- `--dry-run` - Preview changes without applying
- `--verbose` - Include detailed output
- `--scope [area]` - Limit to specific area
- `--all` - Process everything (usually default)

### Command-Specific Options

**`/sync` options:**
- `--last [timeframe]` - Only check recent work (e.g., "7d", "2w")
- `--confidence [high|medium|low]` - Update confidence threshold
- `--interactive` - Prompt for ambiguous cases

**`/groom` options:**
- `--ready-only` - Only show implementation-ready tasks
- `--blocked` - Focus on blocked tasks
- `--stale [days]` - Re-groom old tasks
- `--complexity [level]` - Filter by complexity
- `--generate-sprint` - Create sprint plan

**`/review-tests` options:**
- `--uncommitted` - Only review uncommitted changes
- `--staged` - Only review staged changes
- `--branch` - Review branch changes vs main
- `--coverage [threshold]` - Set coverage requirement
- `--strict` - Apply stricter criteria

**`/refactor` options:**
- `--type [pattern]` - Specific refactoring type
- `--scope [level]` - Refactoring scope
- `--safe` - Only low-risk refactorings
- `--aggressive` - More extensive refactorings
- `--metrics` - Show before/after metrics

**`/status` options:**
- `--brief` - Quick summary only
- `--detailed` - Full report (default)
- `--sprint` - Focus on current sprint
- `--metrics` - Include quantitative metrics
- `--risks` - Emphasize risks and blockers

## Command Categories

### Analysis Commands
- Focus on understanding and evaluating
- Examples: `/audit`, `/review-tests`, `/status`

### Planning Commands  
- Restrict implementation, focus on design
- Examples: `/plan`, `/research`

### Implementation Commands
- Turn designs into working code
- Examples: `/implement`, `/refactor`

### Task Management Commands
- Organize and track work
- Examples: `/groom`, `/status`

### Maintenance Commands
- Keep project organized and up-to-date
- Examples: `/sync`, `/maintenance`

### Documentation Commands
- Capture knowledge and insights
- Examples: `/discovery`, `/retrospective`, `/checklist`

## Command Sequences

Commands can be combined into powerful sequences for common workflows:

### Quick Reference
- See `quick-sequences.md` for one-liner combinations and quick workflows
- See `sequences.md` for detailed sequence documentation and automation

### Most Valuable Sequences
1. **Daily Morning**: `/sync` → `/status` → `/groom`
2. **Weekly Planning**: `/sync` → `/retrospective` → `/groom` → `/plan`
3. **Quality Check**: `/audit` → `/review-tests` → `/refactor`
4. **Documentation**: `/discovery` → `/retrospective` → `/sync`

## Version History

- 2024-01: Initial command set created
- 2024-02: Added `/review-tests` and `/groom` commands
- 2024-02: Added `/audit`, `/implement`, `/status`, `/refactor` commands
- 2024-02: Documented command sequences and automation patterns
- Latest: Complete command suite with sequences documentation