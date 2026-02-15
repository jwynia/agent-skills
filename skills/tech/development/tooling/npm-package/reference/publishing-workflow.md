# Publishing Workflow

## Versioning: Changesets

**`standard-version` is deprecated.** Use Changesets for new projects.

Changesets uses a file-based approach: each PR includes a changeset file describing what changed and whether it's a patch, minor, or major bump. At release time, changesets are consumed to bump versions and generate changelogs.

### Setup

```bash
bun add -d @changesets/cli
bunx changeset init
```

This creates a `.changeset/` directory with a `config.json`:

```json
{
  "$schema": "https://unpkg.com/@changesets/config@3.1.1/schema.json",
  "changelog": "@changesets/cli/changelog",
  "commit": false,
  "fixed": [],
  "linked": [],
  "access": "public",
  "baseBranch": "main",
  "updateInternalDependencies": "patch",
  "ignore": []
}
```

### Workflow

1. **During development**: Run `bunx changeset` to create a changeset file describing the change
2. **At release time**: Run `bunx changeset version` to consume changesets, bump package.json version, update CHANGELOG.md
3. **Publish**: Run the build + publish pipeline

### Package.json Scripts

```json
{
  "scripts": {
    "changeset": "changeset",
    "version": "changeset version",
    "release": "bun run build && npm publish"
  }
}
```

## Pre-Publish Checklist

### Use `files` Field, Never `.npmignore`

The `files` field is a whitelist — only listed paths are included in the published tarball. This prevents accidentally shipping secrets, `.env` files, test fixtures, or source code.

```json
{
  "files": ["dist"]
}
```

`.npmignore` is a blacklist that **replaces** `.gitignore` (they are not merged). This is a common source of credential leaks — if `.gitignore` blocks `.env` but `.npmignore` doesn't, your secrets ship to npm.

### Verify Before Publishing

Always dry-run before publishing:

```bash
npm pack --dry-run
```

This shows exactly what will be in the tarball. Review the file list. If anything unexpected appears, fix `files` in package.json.

### Use `prepublishOnly` for Build + Test

```json
{
  "scripts": {
    "prepublishOnly": "bun run lint && bun run test && bun run build"
  }
}
```

Never use the legacy `prepublish` hook — it runs on both `npm publish` AND `npm install` (in npm v7+), which is almost never what you want.

## Publishing

### `npm publish` with Provenance (Recommended)

```bash
npm publish --provenance --access public
```

Provenance signing creates a cryptographic attestation linking the published package to its source code and build process. This is the gold standard for supply chain security.

**Note:** `bun publish` exists and works, but does NOT support `--provenance`. Use `npm publish` for provenance signing.

### npm Trusted Publishing (OIDC)

npm Trusted Publishing eliminates long-lived npm tokens. Configure it on npmjs.com by linking your GitHub repository to your npm package. Then in GitHub Actions:

```yaml
name: Release
on:
  push:
    tags: ['v*']

permissions:
  contents: read
  id-token: write  # Required for OIDC

jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run build
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          registry-url: 'https://registry.npmjs.org'
      - run: npm publish --provenance --access public
```

No `NODE_AUTH_TOKEN` needed — the OIDC token is obtained automatically.

### `bun publish` (When Provenance Not Required)

```bash
bun publish --access public
```

Bun publish handles `workspace:` protocol stripping, respects `.npmrc`, supports `--dry-run` and `--tag`. Use `NPM_CONFIG_TOKEN` (not `NODE_AUTH_TOKEN`) for authentication in CI.

## GitHub Actions: Full Release Pipeline

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  ci:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: oven-sh/setup-bun@v2
      - run: bun install --frozen-lockfile
      - run: bun run lint
      - run: bun run typecheck
      - run: bun run test
      - run: bun run build
```

## Version Tagging Convention

After `changeset version` bumps the version:

```bash
git add .
git commit -m "chore: release v$(node -p "require('./package.json').version")"
git tag "v$(node -p "require('./package.json').version")"
git push --follow-tags
```

Or automate this with a release script.

## Access Control

For scoped packages (`@scope/package-name`), the first publish requires `--access public` (scoped packages default to restricted). Subsequent publishes inherit the access level.

```json
{
  "publishConfig": {
    "access": "public"
  }
}
```

Adding `publishConfig.access` to package.json avoids needing `--access public` on every publish.
