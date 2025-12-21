# Skill Tracking: web-search

## Overview

| Field | Value |
|-------|-------|
| **Name** | web-search |
| **Domain** | research |
| **Category** | search |
| **Status** | Complete |
| **Location** | `skills/research/search/web-search/` |

## Description

Web search using Tavily API for high-quality, AI-optimized results. Provides a CLI script for executing searches with various parameters.

## Components

- [x] SKILL.md - Frontmatter and instructions
- [x] scripts/search.ts - Deno CLI for Tavily API

## Validation

- [x] `skills-ref validate` passes
- [x] YAML frontmatter valid
- [x] Description includes what/when/keywords
- [x] Script follows Deno template pattern
- [ ] Portability tested (copy to temp dir)
- [ ] End-to-end test with API key

## Dependencies

### External
- TAVILY_API_KEY environment variable (required)
- Internet access to api.tavily.com

### Related Skills
- Used by: research-workflow

## Key Decisions

1. **Script approach**: Adapted existing tavily-cli.ts from inbox/research
2. **Permissions**: Scoped to `--allow-env --allow-net=api.tavily.com`
3. **Output**: Supports both human-readable and JSON output

## Open Items

- [ ] Add integration tests
- [ ] Document rate limits more clearly
- [ ] Consider adding retry logic

## Changelog

### 2025-12-20
- Initial creation
- SKILL.md with full documentation
- scripts/search.ts adapted from inbox/research/tavily-cli.ts
- Validation passed

## Metadata

- **Created**: 2025-12-20
- **Last Updated**: 2025-12-20
- **Updated By**: Claude
