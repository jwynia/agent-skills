# Skill Tracking: research-workflow

## Overview

| Field | Value |
|-------|-------|
| **Name** | research-workflow |
| **Domain** | research |
| **Category** | workflow |
| **Status** | Complete |
| **Location** | `skills/research/workflow/research-workflow/` |

## Description

Structured research methodology guiding agents through planning, execution, analysis, and synthesis phases. Includes templates for research plans and reports.

## Components

- [x] SKILL.md - Frontmatter and complete methodology
- [x] references/methodology.md - Detailed research methodology background
- [x] references/output-formats.md - Output format specifications
- [x] assets/research-plan-template.md - Planning template
- [x] assets/research-report-template.md - Report template
- [x] assets/source-evaluation-checklist.md - Source credibility checklist

## Validation

- [x] `skills-ref validate` passes
- [x] YAML frontmatter valid
- [x] Description includes what/when/keywords
- [x] Templates complete and usable
- [x] References provide additional depth

## Dependencies

### External
- Web search capability (web-search skill recommended)

### Related Skills
- Depends on: web-search (or similar search capability)

## Key Decisions

1. **No scripts**: Methodology-only skill, no code duplication
2. **Four phases**: Planning, Execution, Analysis, Synthesis
3. **Progressive disclosure**: Core methodology in SKILL.md, details in references
4. **Templates**: Provided as editable assets

## Open Items

- [ ] Add more example research scenarios
- [ ] Consider adding research quality scoring
- [ ] Explore automated research log generation

## Changelog

### 2025-12-20
- Initial creation
- SKILL.md with complete four-phase methodology
- Reference docs for methodology and output formats
- Three template assets
- Validation passed

## Metadata

- **Created**: 2025-12-20
- **Last Updated**: 2025-12-20
- **Updated By**: Claude
