# Data Schema Template

Zod schemas for validating scraped data. Every data type extracted by the scraper should have a corresponding schema.

## Purpose

Schemas serve as a contract between the scraper and its consumers. They catch:
- **Selector drift** — When a site changes markup, fields extract as `null` or empty strings
- **Type mismatches** — Prices that aren't numbers, URLs that aren't valid
- **Missing data** — Required fields that didn't extract

## Template

```typescript
import { z } from 'zod';

/**
 * Schema for {{DataType}} records scraped from {{siteName}}.
 *
 * Adjust field types and constraints based on the actual data format.
 * Run a test scrape and review raw output before tightening constraints.
 */
export const {{DataType}}Schema = z.object({
  // Required string fields
  title: z.string().min(1, 'Title is required'),
  url: z.string().url('Must be a valid URL').or(z.string().startsWith('/')),

  // Optional string fields
  description: z.string().optional(),
  imageUrl: z.string().url().nullable().optional(),

  // Numeric fields (extracted as strings, then transformed)
  price: z
    .string()
    .transform((val) => {
      const cleaned = val.replace(/[^0-9.]/g, '');
      return parseFloat(cleaned);
    })
    .pipe(z.number().positive('Price must be positive')),

  // Rating (typically 1-5)
  rating: z
    .string()
    .transform((val) => parseFloat(val))
    .pipe(z.number().min(0).max(5))
    .optional(),

  // Date fields
  date: z.string().optional(),

  // Enum fields
  availability: z
    .enum(['in_stock', 'out_of_stock', 'pre_order'])
    .optional()
    .default('in_stock'),
});

/** TypeScript type inferred from the schema */
export type {{DataType}} = z.infer<typeof {{DataType}}Schema>;

/**
 * Validate a single record. Returns the validated data or null.
 */
export function validate{{DataType}}(
  data: unknown,
): {{DataType}} | null {
  const result = {{DataType}}Schema.safeParse(data);
  if (result.success) return result.data;

  console.warn(
    `Validation failed for {{DataType}}:`,
    result.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', '),
  );
  return null;
}

/**
 * Validate an array of records. Returns only valid records.
 * Logs a summary of failures.
 */
export function validateBatch(
  data: unknown[],
): {{DataType}}[] {
  const results = data.map(validate{{DataType}});
  const valid = results.filter((r): r is {{DataType}} => r !== null);

  const failures = data.length - valid.length;
  if (failures > 0) {
    console.warn(
      `Schema validation: ${valid.length}/${data.length} passed, ${failures} failed`,
    );
  }

  return valid;
}
```

## Common Field Patterns

### Price Extraction
Prices come as strings with currency symbols. Use `transform` to clean and parse:

```typescript
price: z.string()
  .transform(val => parseFloat(val.replace(/[^0-9.]/g, '')))
  .pipe(z.number().positive())
```

### Relative URLs
Some sites use relative URLs. Accept both absolute and relative:

```typescript
url: z.string().url().or(z.string().startsWith('/'))
```

### Optional with Default
Fields that may be missing but have a sensible default:

```typescript
currency: z.string().default('USD')
availability: z.enum(['in_stock', 'out_of_stock']).default('in_stock')
```

### Array Fields
Tags, categories, or image galleries:

```typescript
tags: z.array(z.string()).default([])
images: z.array(z.string().url()).default([])
```

## Customization Notes

- **Replace `{{DataType}}`** with the actual type name (e.g., `Product`, `Job`, `Article`)
- **Start loose, tighten later:** Begin with `z.string().optional()` for most fields, then add constraints after reviewing real scraped data
- **Transform chains:** Use `.transform().pipe()` to convert string extractions to proper types
- **Multiple schemas:** Create one schema per page object's output type (e.g., `ProductSchema`, `ReviewSchema`)
