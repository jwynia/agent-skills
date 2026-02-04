# Skill: scraper-builder

## Status: Complete

## Overview

Generator skill that guides AI agents to create complete PageObject pattern web scraper projects using Playwright and TypeScript with Docker deployment.

## Location

`skills/tech/development/tooling/scraper-builder/`

## Key Features

- **Three generation modes**: Agent-browser analysis, manual description, full project scaffold
- **PageObject pattern**: BasePage, site-specific page objects, reusable components
- **Typed data extraction**: Zod schema validation for all scraped data
- **Docker deployment**: Official Playwright images with docker-compose
- **Two scripts**: Project scaffolder and single page object generator

## Scripts

| Script | Lines | Purpose |
|--------|-------|---------|
| `scaffold-scraper-project.ts` | 556 | Full project scaffolder |
| `generate-page-object.ts` | 294 | Single page object generator |

## Structure

- `SKILL.md` — Main skill document
- `scripts/` — Two Deno TypeScript generator scripts
- `references/` — 5 reference documents (PageObject, selectors, Docker, agent-browser, anti-patterns)
- `assets/templates/` — 5 code templates
- `assets/configs/` — 5 config templates
- `assets/examples/` — 2 worked examples
- `data/` — 2 JSON data files (selector patterns, site archetypes)

## Metadata

- **Created**: 2026-02-04
- **Type**: generator
- **Mode**: generative
- **Domain**: development
- **Category**: tooling
