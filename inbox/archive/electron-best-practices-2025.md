# Building Production Electron Apps with TypeScript and React in 2025

The current best practice stack for Electron development centers on electron-vite for fast development, Electron Forge for packaging, and strict security defaults that have become standard since Electron 20. For teams already experienced with TypeScript, React, and Hono, this modern toolchain delivers sub-second hot reload, type-safe IPC patterns, and the option to embed familiar HTTP server patterns directly in your desktop apps. The ecosystem has matured significantly, with Spectron deprecated in favor of Playwright for E2E testing[^1], and Tauri 2.0 now offering a compelling Rust-based alternative worth evaluating[^2].

---

## Project Setup Now Favors Vite Over Webpack

The dominant approach in 2024-2025 uses **electron-vite** (v5.0+) for development and **Electron Forge** (v7.x) for packaging. This combination provides near-instant dev server startup and integrated code signing—a significant improvement over the webpack-based toolchains that dominated earlier years.

**electron-vite** provides a unified configuration file managing main, preload, and renderer processes with distinct Vite configs[^3]. Development starts in under a second, with instant HMR for the React renderer and hot reloading for main process changes[^4]. The template scaffolding supports React, Vue, Svelte, and Solid out of the box:

```bash
npm create @quick-start/electron@latest my-app -- --template react-ts
```

For packaging and distribution, **Electron Forge** is now the official recommendation over electron-builder. Forge uses first-party Electron packages (@electron/packager, @electron/osx-sign, @electron/notarize), ensuring new Electron features like ASAR integrity and universal macOS builds work immediately upon release[^5]. However, electron-builder maintains higher adoption (~600k weekly npm downloads)[^6] and offers more configuration options—both remain production-ready choices.

The recommended project structure separates concerns clearly:

```
src/
├── main/           # Main process (Node.js environment)
│   ├── index.ts
│   └── ipc/        # IPC handlers
├── preload/        # Secure bridge via contextBridge
│   ├── index.ts
│   └── index.d.ts  # TypeScript declarations for exposed APIs
└── renderer/       # React application (pure web, no Node access)
    ├── src/
    └── index.html
```

---

## Security Defaults Have Fundamentally Changed the Architecture

Modern Electron security relies on three key defaults that became standard in Electron 20+: **context isolation** prevents renderer code from accessing preload internals, **sandbox mode** restricts preload scripts to a limited Node.js polyfill, and **nodeIntegration disabled** prevents renderers from directly accessing Node.js APIs[^7]. These aren't optional—disabling any of them enables XSS attacks to escalate to full remote code execution[^8].

The practical implication is that all main-renderer communication now flows through **contextBridge**, which exposes specific functions rather than raw IPC access:

```typescript
// preload.ts - SECURE pattern
contextBridge.exposeInMainWorld('electronAPI', {
  // Wrap IPC calls - never expose raw ipcRenderer
  loadPreferences: () => ipcRenderer.invoke('load-prefs'),
  saveFile: (content: string) => ipcRenderer.invoke('save-file', content),
  // For events, filter the callback data to avoid leaking event object
  onUpdateCounter: (callback: (value: number) => void) => {
    const handler = (_event: IpcRendererEvent, value: number) => callback(value);
    ipcRenderer.on('update-counter', handler);
    return () => ipcRenderer.removeListener('update-counter', handler);
  }
});
```

Content Security Policy should be set via HTTP headers for apps loading local files, restricting script sources to `'self'`. The **Electronegativity** scanner can audit your app for security misconfigurations in CI/CD pipelines[^9].

---

## Type-Safe IPC Patterns Eliminate Runtime Errors

The **invoke/handle** pattern is now preferred over send/on for request-response communication, as it provides proper async/await semantics and error propagation[^10]. For complex applications, **electron-trpc** provides full type safety by using tRPC's router pattern with Zod validation[^11]:

```typescript
// router.ts (main process)
export const appRouter = t.router({
  greeting: t.procedure
    .input(z.object({ name: z.string() }))
    .query(({ input }) => `Hello, ${input.name}!`),
  
  saveDocument: t.procedure
    .input(z.object({ id: z.string(), content: z.string() }))
    .mutation(async ({ input }) => {
      await saveToDatabase(input);
      return { success: true };
    })
});

// renderer.ts - fully type-safe client
const greeting = await trpc.greeting.query({ name: 'World' });
```

For simpler cases, manual typed IPC works well using TypeScript's mapped types to define channel signatures and their parameter/return types[^12], which the preload script then enforces.

Error handling across the IPC boundary requires attention because Electron only serializes the `message` property of Error objects—custom properties are lost. Wrapping responses in a `{ success: boolean, data?, error? }` pattern preserves full error context.

---

## Hono Integration Offers a Familiar REST Development Model

For teams experienced with Hono, embedding it in Electron apps provides familiar REST patterns, independent testability, and the option for external tool access. Hono's lightweight footprint (~14KB) and Web Standards compliance make it particularly suitable for Electron's main process.

The simplest approach runs Hono directly in the main process with dynamic port allocation:

```typescript
// server.ts
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';

const app = new Hono();
app.use('/api/*', cors({ origin: 'file://' }));
app.get('/api/health', (c) => c.json({ status: 'ok' }));

const server = serve({
  fetch: app.fetch,
  port: 0,              // OS-assigned port
  hostname: '127.0.0.1' // Critical: never bind to 0.0.0.0
});
```

For applications with heavy backend work, spawning the server as a separate process prevents blocking Electron's main process. The electron-with-server-example pattern demonstrates forking a child process and communicating via node-ipc sockets[^13].

**Security is critical**: always bind to localhost only, use randomly-generated tokens validated via middleware, and pass credentials from main to renderer via IPC[^14]. Hono's RPC client (`hc`) provides type-safe fetch calls that mirror the server's route definitions, giving you compile-time checking without GraphQL complexity.

The tradeoff between embedded HTTP servers and direct IPC is meaningful: IPC calls complete in ~0.08ms while localhost HTTP adds 1-5ms latency[^15]. Use IPC for system operations (file dialogs, window management) and HTTP for data APIs where the REST familiarity aids development and testing.

---

## React Integration Requires Electron-Specific State Patterns

React 18's concurrent features work normally in Electron's Chromium-based renderer[^16], but Strict Mode's double-invocation of effects catches IPC listener leaks that would otherwise cause memory issues. Always return cleanup functions from effects that register IPC listeners.

For multi-window applications, the main process should serve as the single source of truth for shared state. Using electron-store for persistence combined with IPC broadcasting creates a pattern where any window's mutation updates all others[^17]:

```typescript
// main/store.ts
store.onDidChange(key, (newValue) => {
  BrowserWindow.getAllWindows().forEach(win => {
    win.webContents.send(`state:${key}`, newValue);
  });
});
```

**Zustand** is the recommended state library for most Electron apps due to its simplicity and built-in persistence middleware[^18]. For complex multi-window scenarios, treat windows as React Portals—the pattern used by Screen Studio—where child windows are managed declaratively as components that portal their content into separate OS windows[^19].

Hot module replacement via electron-vite provides instant React Fast Refresh in the renderer while hot-reloading main process changes[^20].

---

## Packaging Requires Platform-Specific Code Signing

Code signing has become more complex since 2023, particularly for Windows where EV certificates now require hardware tokens (FIPS 140-2 Level 2 compliant) or cloud-based signing services like DigiCert KeyLocker or Azure SignTool[^21].

For macOS, notarization is mandatory for apps to run without security warnings. Electron Forge integrates this directly via configuration:

```javascript
// forge.config.js
packagerConfig: {
  osxSign: {},
  osxNotarize: {
    appleId: process.env.APPLE_ID,
    appleIdPassword: process.env.APPLE_PASSWORD,
    teamId: process.env.APPLE_TEAM_ID
  }
}
```

**Auto-updates** are best handled through electron-updater (from electron-builder, works with any packaging tool) for private repositories, or the free update.electronjs.org service for open-source GitHub projects. Both support differential updates and staged rollouts.

Bundle size reduction focuses on: excluding source maps from production, aggressive tree shaking, lazy loading heavy components, and ensuring devDependencies don't leak into the production bundle. Typical optimized apps with React land around 45-60 MB, compared to 120-150 MB for unoptimized builds.

CI/CD patterns center on GitHub Actions with a platform matrix (ubuntu-latest, windows-latest, macos-latest), with macOS requiring keychain setup for signing certificates and Linux requiring Xvfb for headless Electron execution[^22].

---

## Playwright Has Replaced Spectron for E2E Testing

Spectron was deprecated in February 2022 and only supports Electron v13 and below. Playwright's experimental Electron support (via CDP) is now the recommended approach[^23]:

```typescript
import { test, _electron as electron } from '@playwright/test';

test('app launches and displays content', async () => {
  const electronApp = await electron.launch({ args: ['.'] });
  const window = await electronApp.firstWindow();
  
  await window.click('button#submit');
  await expect(window).toHaveScreenshot(); // Visual regression
  
  // Evaluate in main process
  const appPath = await electronApp.evaluate(({ app }) => app.getAppPath());
  
  await electronApp.close();
});
```

The **electron-playwright-helpers** package provides utilities for finding the latest build artifact and stubbing dialogs. For teams preferring WebdriverIO, the **wdio-electron-service** package offers Spectron-like APIs with Vitest-style mocking[^24].

Unit testing the main process uses Jest or Vitest with a multi-project configuration—main process tests use `node` environment while renderer tests use `jsdom`[^25]. Extract logic from preload scripts into separate modules for testability, mocking the minimal Electron API surface.

---

## Tauri Presents a Compelling Alternative

Tauri 2.0, released October 2024, offers 95% smaller binaries (~3 MB vs ~150 MB), 50% lower memory usage, and sub-second startup times by using system WebViews instead of bundled Chromium[^2]. The tradeoff is requiring Rust for backend logic and accepting WebKit rendering differences on macOS/Linux.

| Factor | Electron | Tauri |
|--------|----------|-------|
| Bundle size | 80-150 MB | 2.5-10 MB |
| Memory (idle) | 150-300 MB | 30-40 MB |
| Backend language | JavaScript/TypeScript | Rust |
| Rendering consistency | Identical everywhere | Varies by OS |
| Ecosystem maturity | Very mature | Rapidly growing |
| Mobile support | None | iOS/Android (Tauri 2.0) |

**Choose Tauri when**: bundle size matters critically, you need mobile support from a single codebase, or you're willing to invest in Rust for performance-critical operations.

**Choose Electron when**: your team is JavaScript-only, consistent cross-platform rendering is essential, you need specific Node.js packages, or you're extending an existing Electron codebase.

---

## Recommended Technology Stack for Internal Tools

| Component | Recommendation | Rationale |
|-----------|----------------|-----------|
| Build tool | electron-vite 5.x | Fastest HMR, unified config |
| Packaging | Electron Forge 7.x | Official tooling, first-party signing |
| TypeScript | 5.x | Latest features, better type inference |
| React | 18.x | Concurrent features, Suspense |
| State management | Zustand + electron-store | Simple, persistent, cross-window sync |
| IPC | electron-trpc or typed manual IPC | Full type safety |
| Embedded server | Hono + @hono/node-server | Lightweight, TypeScript-native |
| E2E testing | Playwright | Official support, visual regression |
| UI components | Shadcn/UI + Tailwind | Accessible, customizable |
| Auto-updates | electron-updater | Flexible providers, delta updates |

For teams already proficient with TypeScript, React, and Hono, this stack maximizes development velocity while maintaining production-grade security and distribution capabilities. The electron-vite template provides an excellent starting point that can be customized with Hono integration and electron-trpc as complexity warrants.

---

## Footnotes

[^1]: Sam C. Tomasi, "How to Test Electron Apps," Medium/Better Programming. https://medium.com/better-programming/how-to-test-electron-apps-1e8eb0078d7b

[^2]: RaftLabs, "Tauri vs Electron: A Practical Guide to Picking the Right Framework," Medium. https://raftlabs.medium.com/tauri-vs-electron-a-practical-guide-to-picking-the-right-framework-5df80e360f26

[^3]: electron-vite official documentation. https://electron-vite.org/

[^4]: electron-vite, "Next Generation Electron Build Tooling." https://electron-vite.org/

[^5]: Electron Forge, "Why Electron Forge?" https://www.electronforge.io/core-concepts/why-electron-forge

[^6]: npm trends comparison: electron-builder vs electron-forge vs electron-packager. https://npmtrends.com/electron-builder-vs-electron-forge-vs-electron-packager

[^7]: Electron documentation, "WebPreferences Object." https://www.electronjs.org/docs/latest/api/structures/web-preferences

[^8]: Electron documentation, "Security." https://www.electronjs.org/docs/latest/tutorial/security

[^9]: Doyensec, "Electronegativity," GitHub. https://github.com/doyensec/electronegativity

[^10]: Electron documentation, "Inter-Process Communication." https://www.electronjs.org/docs/latest/tutorial/ipc

[^11]: electron-trpc official documentation. https://electron-trpc.dev/

[^12]: npm, "@kjn/electron-typesafe-ipc." https://www.npmjs.com/package/@kjn/electron-typesafe-ipc

[^13]: James Long, "electron-with-server-example," GitHub. https://github.com/jlongster/electron-with-server-example

[^14]: DeepStrike, "Penetration Testing of Electron-based Applications." https://deepstrike.io/blog/penetration-testing-of-electron-based-applications

[^15]: "Electron Adventures: Episode 20: IPC Benchmark," DEV Community. https://dev.to/taw/electron-adventures-episode-20-ipc-benchmark-2b2d

[^16]: React Blog, "React v18.0." https://legacy.reactjs.org/blog/2022/03/29/react-v18.html

[^17]: BigBinary, "Creating a synchronized store between main and renderer process in Electron." https://www.bigbinary.com/blog/sync-store-main-renderer-electron

[^18]: OpenReplay, "Zustand vs Jotai: Choosing the Right State Manager for Your React App." https://blog.openreplay.com/zustand-jotai-react-state-manager/

[^19]: Pietrasiak, "Creating multi-window Electron apps using React portals." https://pietrasiak.com/creating-multi-window-electron-apps-using-react-portals

[^20]: electron-vite, "Getting Started." https://electron-vite.org/guide/

[^21]: Swabhab Swarup Panigrahi, "A Comprehensive Guide to Electron App Development in 2025," Medium. https://medium.com/@swabhab.panigrahi/a-comprehensive-guide-to-electron-app-development-in-2025-9f15caed16f1

[^22]: Electron documentation, "Testing on Headless CI Systems," GitHub. https://github.com/electron/electron/blob/v1.6.10/docs/tutorial/testing-on-headless-ci.md

[^23]: See [^1].

[^24]: WebdriverIO, "Electron Service." https://webdriver.io/docs/wdio-electron-service/

[^25]: Woovi, "Electron Testing Best Practices: Testing Main and Renderer Code with Jest," DEV Community. https://dev.to/woovi/electron-testing-best-practices-testing-main-and-renderer-code-with-jest-4b5m

---

## Appendix: Additional Resources Consulted

The following resources were consulted during research but not directly cited above:

- **Electron official documentation** — https://www.electronjs.org/docs/latest/
- **Electron ipcMain API** — https://www.electronjs.org/docs/latest/api/ipc-main
- **NPMCompare: electron-builder vs electron-forge vs electron-packager** — https://npmcompare.com/compare/electron-builder,electron-forge,electron-packager
- **W3cubDocs: Electron Security Tutorial** — https://docs.w3cub.com/electron/tutorial/security
- **LogRocket: Advanced Electron.js architecture** — https://blog.logrocket.com/advanced-electron-js-architecture/
- **electron-trpc GitHub repository** — https://github.com/jsonnull/electron-trpc
- **How to run Express inside an Electron app (Gist)** — https://gist.github.com/maximilian-lindsey/a446a7ee87838a62099d
- **Electron Adventures: Episode 24: Unit Testing Electron** — https://dev.to/taw/electron-adventures-episode-24-unit-testing-electron-3a5b
