# PptxGenJS API Reference

This document covers the JSON specification format for scratch mode generation.

## Presentation Specification

```typescript
interface PresentationSpec {
  title?: string;           // Presentation title (metadata)
  subject?: string;         // Presentation subject (metadata)
  author?: string;          // Author name (metadata)
  company?: string;         // Company name (metadata)
  layout?: {
    width?: number;         // Width in inches (default: 10)
    height?: number;        // Height in inches (default: 5.625 for 16:9)
  };
  slides: SlideSpec[];
}
```

## Slide Specification

```typescript
interface SlideSpec {
  layout?: 'blank' | 'title' | 'titleAndContent' | 'section' | 'twoColumn';
  background?: {
    color?: string;         // Hex color without # (e.g., "003366")
    image?: string;         // Path to image file
  };
  elements: ElementSpec[];
}
```

## Element Specification

All elements share common positioning properties:

```typescript
interface ElementSpec {
  type: 'text' | 'image' | 'table' | 'shape' | 'chart';
  x: number;    // X position in inches from left edge
  y: number;    // Y position in inches from top edge
  w: number;    // Width in inches
  h: number;    // Height in inches
  options: TextOptions | ImageOptions | TableOptions | ShapeOptions | ChartOptions;
}
```

## Text Element

```typescript
interface TextOptions {
  text: string;                     // The text content
  fontSize?: number;                // Font size in points
  fontFace?: string;                // Font family name
  color?: string;                   // Hex color without #
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  align?: 'left' | 'center' | 'right' | 'justify';
  valign?: 'top' | 'middle' | 'bottom';
  bullet?: boolean | {
    type?: string;                  // Bullet type
    code?: string;                  // Unicode bullet character
  };
  paraSpaceAfter?: number;          // Space after paragraph in points
  paraSpaceBefore?: number;         // Space before paragraph in points
}
```

**Example**:
```json
{
  "type": "text",
  "x": 1, "y": 1, "w": 8, "h": 1,
  "options": {
    "text": "Hello World",
    "fontSize": 32,
    "bold": true,
    "color": "003366",
    "align": "center"
  }
}
```

## Image Element

```typescript
interface ImageOptions {
  path?: string;           // Path to image file (relative to spec.json)
  data?: string;           // Base64-encoded image data
  sizing?: {
    type: 'contain' | 'cover' | 'crop';
    w?: number;            // Target width
    h?: number;            // Target height
  };
  hyperlink?: {
    url: string;           // URL to link to
  };
}
```

**Example (file path)**:
```json
{
  "type": "image",
  "x": 1, "y": 2, "w": 4, "h": 3,
  "options": {
    "path": "./images/logo.png",
    "sizing": { "type": "contain" }
  }
}
```

**Example (base64)**:
```json
{
  "type": "image",
  "x": 1, "y": 2, "w": 4, "h": 3,
  "options": {
    "data": "data:image/png;base64,iVBORw0KGgo..."
  }
}
```

## Table Element

```typescript
interface TableCell {
  text: string;
  options?: {
    bold?: boolean;
    color?: string;
    fill?: string;         // Background color
    fontSize?: number;
    align?: 'left' | 'center' | 'right';
    valign?: 'top' | 'middle' | 'bottom';
    colspan?: number;
    rowspan?: number;
  };
}

interface TableOptions {
  rows: (string | TableCell)[][];   // 2D array of cells
  colW?: number[];                   // Column widths in inches
  rowH?: number[];                   // Row heights in inches
  border?: {
    pt?: number;                     // Border width in points
    color?: string;                  // Border color
  };
  fill?: string;                     // Default cell background
  fontSize?: number;
  fontFace?: string;
  color?: string;                    // Default text color
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
}
```

**Example (simple)**:
```json
{
  "type": "table",
  "x": 0.5, "y": 1.5, "w": 9, "h": 3,
  "options": {
    "rows": [
      ["Header 1", "Header 2", "Header 3"],
      ["Row 1 Col 1", "Row 1 Col 2", "Row 1 Col 3"],
      ["Row 2 Col 1", "Row 2 Col 2", "Row 2 Col 3"]
    ],
    "border": { "pt": 1, "color": "CCCCCC" }
  }
}
```

**Example (styled cells)**:
```json
{
  "type": "table",
  "x": 0.5, "y": 1.5, "w": 9, "h": 3,
  "options": {
    "rows": [
      [
        { "text": "Header 1", "options": { "bold": true, "fill": "003366", "color": "FFFFFF" }},
        { "text": "Header 2", "options": { "bold": true, "fill": "003366", "color": "FFFFFF" }},
        { "text": "Header 3", "options": { "bold": true, "fill": "003366", "color": "FFFFFF" }}
      ],
      ["Data 1", "Data 2", "Data 3"]
    ],
    "colW": [3, 3, 3]
  }
}
```

## Shape Element

```typescript
interface ShapeOptions {
  type: 'rect' | 'roundRect' | 'ellipse' | 'triangle' | 'line' | 'arrow' | 'star';
  fill?: string;           // Fill color
  line?: {
    color?: string;
    width?: number;        // Line width in points
    dashType?: string;     // 'solid', 'dash', 'dot', etc.
  };
  text?: string;           // Text inside shape
  fontSize?: number;
  fontFace?: string;
  color?: string;          // Text color
  align?: 'left' | 'center' | 'right';
  valign?: 'top' | 'middle' | 'bottom';
}
```

**Example**:
```json
{
  "type": "shape",
  "x": 1, "y": 1, "w": 3, "h": 2,
  "options": {
    "type": "roundRect",
    "fill": "4472C4",
    "text": "Click Here",
    "color": "FFFFFF",
    "align": "center",
    "valign": "middle"
  }
}
```

## Chart Element

```typescript
interface ChartData {
  name: string;            // Series name
  labels: string[];        // Category labels
  values: number[];        // Data values
}

interface ChartOptions {
  type: 'bar' | 'line' | 'pie' | 'doughnut' | 'area' | 'scatter';
  data: ChartData[];
  title?: string;
  showLegend?: boolean;
  legendPos?: 'b' | 'l' | 'r' | 't' | 'tr';  // bottom, left, right, top, top-right
  showTitle?: boolean;
  showValue?: boolean;
  catAxisTitle?: string;   // Category axis title
  valAxisTitle?: string;   // Value axis title
}
```

**Example (bar chart)**:
```json
{
  "type": "chart",
  "x": 0.5, "y": 1.5, "w": 9, "h": 4,
  "options": {
    "type": "bar",
    "title": "Quarterly Sales",
    "showLegend": true,
    "legendPos": "r",
    "data": [
      {
        "name": "2023",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "values": [100, 150, 180, 220]
      },
      {
        "name": "2024",
        "labels": ["Q1", "Q2", "Q3", "Q4"],
        "values": [120, 175, 200, 250]
      }
    ]
  }
}
```

**Example (pie chart)**:
```json
{
  "type": "chart",
  "x": 3, "y": 1.5, "w": 4, "h": 4,
  "options": {
    "type": "pie",
    "title": "Market Share",
    "showValue": true,
    "data": [
      {
        "name": "Share",
        "labels": ["Product A", "Product B", "Product C", "Other"],
        "values": [35, 25, 20, 20]
      }
    ]
  }
}
```

## Color Values

Colors are specified as 6-character hex strings WITHOUT the `#` prefix:
- `"FFFFFF"` - White
- `"000000"` - Black
- `"003366"` - Dark blue
- `"4472C4"` - Office blue
- `"FF0000"` - Red

## Common Layouts

### Title Slide
```json
{
  "background": { "color": "003366" },
  "elements": [
    {
      "type": "text",
      "x": 0.5, "y": 2, "w": 9, "h": 1.5,
      "options": {
        "text": "Presentation Title",
        "fontSize": 44,
        "bold": true,
        "color": "FFFFFF",
        "align": "center"
      }
    },
    {
      "type": "text",
      "x": 0.5, "y": 3.5, "w": 9, "h": 0.5,
      "options": {
        "text": "Subtitle or Author",
        "fontSize": 20,
        "color": "CCCCCC",
        "align": "center"
      }
    }
  ]
}
```

### Content Slide
```json
{
  "elements": [
    {
      "type": "text",
      "x": 0.5, "y": 0.3, "w": 9, "h": 0.7,
      "options": {
        "text": "Slide Title",
        "fontSize": 28,
        "bold": true,
        "color": "003366"
      }
    },
    {
      "type": "text",
      "x": 0.5, "y": 1.2, "w": 9, "h": 4,
      "options": {
        "text": "• First bullet point\n• Second bullet point\n• Third bullet point",
        "fontSize": 18,
        "bullet": true
      }
    }
  ]
}
```

### Two-Column Layout
```json
{
  "elements": [
    {
      "type": "text",
      "x": 0.5, "y": 0.3, "w": 9, "h": 0.7,
      "options": { "text": "Title", "fontSize": 28, "bold": true }
    },
    {
      "type": "text",
      "x": 0.5, "y": 1.2, "w": 4, "h": 4,
      "options": { "text": "Left column content", "fontSize": 16 }
    },
    {
      "type": "text",
      "x": 5, "y": 1.2, "w": 4.5, "h": 4,
      "options": { "text": "Right column content", "fontSize": 16 }
    }
  ]
}
```
