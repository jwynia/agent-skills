# DOCX Generator Skill

## Overview

Create and manipulate Word DOCX files programmatically. Supports both template-based generation (for branding compliance) and from-scratch creation.

## Location

`skills/document-processing/word/docx-generator/`

## Scripts

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract text, tables, placeholders from DOCX | `--allow-read` |
| `generate-from-template.ts` | Replace placeholders in templates | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create DOCX from JSON specification | `--allow-read --allow-write` |

## Dependencies

- `npm:docx@9.0.2` - DOCX document creation
- `npm:jszip@3.10.1` - OOXML package manipulation
- `npm:@xmldom/xmldom@0.9.6` - XML parsing
- `jsr:@std/cli@1.0.9` - CLI argument parsing
- `jsr:@std/path@1.0.8` - Path utilities

## Features

### Template Mode
- Analyze templates for `{{PLACEHOLDER}}` and `${placeholder}` patterns
- Replace placeholders in paragraphs, tables, headers, and footers
- Preserve formatting and styling during replacement
- Handle split text runs (Word XML quirk)

### Scratch Mode
- Create documents from JSON specification
- Support paragraphs, text runs, tables, images
- Add headers and footers
- Apply formatting (bold, italic, underline, color, etc.)
- Create hyperlinks

## Use Cases

- Contract generation from templates
- Report generation with dynamic content
- Letter and correspondence automation
- Data-driven document creation

## Related Skills

- [[pptx-generator]] - PowerPoint presentations
- [[xlsx-generator]] - Excel spreadsheets

## Metadata

- **Created:** 2025-12-27
- **Status:** Complete
- **Version:** 1.0
