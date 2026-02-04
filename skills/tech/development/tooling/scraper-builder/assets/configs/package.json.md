# Package.json Template

Package configuration with Playwright, Zod, and tsx as core dependencies.

## Template

```json
{
  "name": "{{project-name}}",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "start": "tsx src/index.ts",
    "build": "tsc",
    "dev": "tsx watch src/index.ts",
    "scrape": "tsx src/index.ts",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "playwright": "^1.48.0",
    "zod": "^3.23.0",
    "dotenv": "^16.4.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "tsx": "^4.19.0",
    "@types/node": "^22.0.0"
  }
}
```

## Customization Notes

- **`playwright` not `@playwright/test`:** Scrapers use the library package, not the test runner. The library package is smaller and doesn't include test runner overhead.
- **`tsx`:** TypeScript execute — runs `.ts` files directly without a build step. Used for development and can be used in production for simpler setups.
- **`zod`:** Remove from dependencies if `--no-validation` was used during scaffolding.
- **`dotenv`:** Loads `.env` files for local development. Not needed in Docker (environment variables set via compose).
- **`type: "module"`:** Enables ESM imports. Required for top-level await and modern module syntax.
- **Scripts:**
  - `start` / `scrape`: Run the scraper
  - `dev`: Run with file watching (re-runs on source changes)
  - `build`: Compile TypeScript to JavaScript
  - `typecheck`: Verify types without emitting

## See Also

- `tsconfig.json.md` — TypeScript configuration
- `../../references/docker-setup.md` — Docker deployment
