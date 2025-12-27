# pptx-generator Skill Tracking

## Basic Info

| Field | Value |
|-------|-------|
| Name | pptx-generator |
| Domain | document-processing |
| Category | presentation |
| Status | Complete |
| Location | `skills/document-processing/presentation/pptx-generator/` |

## Description

Create and manipulate PowerPoint PPTX files programmatically. Supports two modes:
1. **Template Mode**: Modify existing branded templates (analyze & replace, slide library)
2. **Scratch Mode**: Create presentations from JSON specifications

## Key Features

- Template text inventory extraction
- Tagged content replacement ({{PLACEHOLDER}} pattern)
- Slide library selection and combination
- Full scratch generation via PptxGenJS
- Support for text, images, tables, shapes, and charts
- Presentation thumbnail and info extraction

## Scripts

| Script | Purpose |
|--------|---------|
| `analyze-template.ts` | Extract text inventory from PPTX |
| `generate-thumbnails.ts` | Get slide info and extract previews |
| `generate-from-template.ts` | Template-based generation |
| `generate-scratch.ts` | From-scratch generation |

## Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| pptxgenjs | 3.12.0 | PPTX generation |
| jszip | 3.10.1 | PPTX file manipulation |
| @xmldom/xmldom | 0.9.6 | XML parsing |

## Design Decisions

- **Avoided pptx-automizer**: Node.js only, not Deno compatible
- **Direct JSZip + xmldom**: Full control over template manipulation
- **PptxGenJS for scratch**: Well-supported library with good Deno compat

## Related Documents

- [Template Workflow Reference](../../../skills/document-processing/presentation/pptx-generator/references/template-workflow.md)
- [PptxGenJS API Reference](../../../skills/document-processing/presentation/pptx-generator/references/pptxgenjs-api.md)

## Change History

- 2025-12-27: Initial implementation complete
  - analyze-template.ts: Text inventory extraction
  - generate-scratch.ts: PptxGenJS wrapper for Deno
  - generate-from-template.ts: Template manipulation
  - generate-thumbnails.ts: Slide info extraction
  - SKILL.md and reference documentation

## Metadata

- **Created:** 2025-12-27
- **Last Updated:** 2025-12-27
- **Created By:** Claude
