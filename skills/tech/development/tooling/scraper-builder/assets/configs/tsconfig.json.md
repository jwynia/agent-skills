# TypeScript Configuration Template

Strict TypeScript configuration targeting ES2022 for modern Node.js with Playwright.

## Template

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "resolveJsonModule": true,
    "isolatedModules": true
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist", "data", "screenshots"]
}
```

## Customization Notes

- **ES2022 target:** Provides top-level await, `Array.at()`, and `Object.hasOwn()`. Matches Node.js 18+ capabilities.
- **Bundler module resolution:** Works with both ESM imports and CommonJS interop. Use `"node"` if not using a bundler.
- **Declaration files:** Enable `declaration: true` if the scraper exports types for other tools. Remove if standalone.
- **Strict mode:** Keeps all strict checks enabled. Do not relax these.

## See Also

- `package.json.md` — Package configuration
