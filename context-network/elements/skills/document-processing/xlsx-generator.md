# XLSX Generator Skill

## Overview

Create and manipulate Excel XLSX files programmatically. Supports both template-based generation (for branding compliance) and from-scratch creation.

## Location

`skills/document-processing/spreadsheet/xlsx-generator/`

## Scripts

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract cells, formulas, placeholders from XLSX | `--allow-read` |
| `generate-from-template.ts` | Replace placeholders in templates | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create XLSX from JSON specification | `--allow-read --allow-write` |

## Dependencies

- `npm:xlsx@0.18.5` - Excel file manipulation (SheetJS)
- `jsr:@std/cli@1.0.9` - CLI argument parsing
- `jsr:@std/path@1.0.8` - Path utilities

## Features

### Template Mode
- Analyze templates for `{{PLACEHOLDER}}` and `${placeholder}` patterns
- Replace placeholders across all sheets
- Direct cell value updates
- Preserve formulas and formatting

### Scratch Mode
- Create workbooks from JSON specification
- Multiple sheets with different structures
- Add formulas for calculations
- Column width and visibility control
- Freeze panes and auto-filter
- Merged cell ranges

## Use Cases

- Financial report generation
- Data exports with calculations
- Template-based reporting
- Multi-sheet workbook creation

## Related Skills

- [[pptx-generator]] - PowerPoint presentations
- [[docx-generator]] - Word documents

## Metadata

- **Created:** 2025-12-27
- **Status:** Complete
- **Version:** 1.0
