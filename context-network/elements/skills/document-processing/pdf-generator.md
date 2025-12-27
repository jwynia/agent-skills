# PDF Generator Skill

## Overview

Create and manipulate PDF files programmatically. Supports both template-based generation (form filling, overlays, merging) and from-scratch creation.

## Location

`skills/document-processing/pdf/pdf-generator/`

## Scripts

| Script | Purpose | Permissions |
|--------|---------|-------------|
| `analyze-template.ts` | Extract text, metadata, form fields from PDF | `--allow-read` |
| `generate-from-template.ts` | Fill forms, add overlays, merge PDFs | `--allow-read --allow-write` |
| `generate-scratch.ts` | Create PDF from JSON specification | `--allow-read --allow-write` |

## Dependencies

- `npm:pdf-lib@1.17.1` - PDF creation and manipulation
- `npm:unpdf@0.11.0` - PDF text extraction (PDF.js based)
- `jsr:@std/cli@1.0.9` - CLI argument parsing
- `jsr:@std/path@1.0.8` - Path utilities

## Features

### Template Mode
- Fill PDF form fields (text, checkbox, radio, dropdown)
- Add text overlays with rotation
- Add image overlays (PNG, JPEG)
- Add shape overlays (rectangles)
- Merge multiple PDFs
- Include/exclude specific pages
- Flatten forms for final output

### Scratch Mode
- Create PDFs from JSON specification
- Text elements with standard fonts
- Image embedding (PNG, JPEG)
- Shapes (rectangles, circles, lines)
- Basic table layout
- Page size options (A4, Letter, Legal, custom)

### Analysis
- Extract text from PDF pages
- Extract metadata (title, author, dates)
- Enumerate form fields with types
- Find placeholder patterns

## Use Cases

- PDF form filling automation
- Adding watermarks and stamps
- Document merging and assembly
- Report generation
- Certificate creation

## Limitations

- No built-in table layout (manual positioning)
- Standard fonts only (no custom font embedding)
- No flowing text across pages
- Cannot create new form fields (only fill existing)
- No encryption/password protection
- Text extraction quality depends on PDF structure

## Related Skills

- [[pptx-generator]] - PowerPoint presentations
- [[docx-generator]] - Word documents
- [[xlsx-generator]] - Excel spreadsheets

## Metadata

- **Created:** 2025-12-27
- **Status:** Complete
- **Version:** 1.0
