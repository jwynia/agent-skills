# Inbox

Staging area for research, examples, and experiments that inform skill development.

## Purpose

This folder holds material that is:
- **Not part of final deliverables** - Won't be exported with skills
- **Reference implementations** - Examples of patterns to follow or adapt
- **Research artifacts** - Explorations, prototypes, notes
- **External imports** - Code brought in for study

## Current Contents

### research/
Example CLI tools demonstrating patterns:
- `tavily-cli.ts` - Deno CLI for Tavily web search API
- `tavily-search.ts` - Mastra tool pattern (for comparison)

### ctx/
Example context management CLI (Bun-based, for reference):
- `ctx.ts` - CLI for storing/querying development context
- Uses @mastra/core and @jwynia/corticai

## How This Informs Skills

These examples demonstrate:
- CLI argument parsing patterns
- API integration approaches
- Help text and documentation styles
- Error handling patterns

When creating skill scripts, adapt patterns from here but:
- Convert to Deno (if not already)
- Use `jsr:` imports with pinned versions
- Make self-contained (no external dependencies on this folder)

## What Goes Here

- Interesting tools or scripts found elsewhere
- Prototypes before they become skills
- Research notes and explorations
- "What if" experiments

## What Does NOT Go Here

- Actual skills (those go in `/skills/`)
- Planning documents (those go in `/context-network/`)
- Final deliverables of any kind
