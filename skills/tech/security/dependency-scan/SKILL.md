# Dependency Scan

Analyze package dependencies for known vulnerabilities.

---
description: Detect CVEs and security issues in project dependencies
version: 1.0.0
tags: [security, dependencies, cve, sca, packages]
---

## Quick Start

```
/dependency-scan                  # Scan all detected package managers
/dependency-scan --npm            # Node.js packages only
/dependency-scan --pip            # Python packages only
/dependency-scan --fix            # Auto-fix where possible
```

## What This Skill Does

1. **Identifies package managers** in your project
2. **Parses dependency manifests** (package.json, requirements.txt, etc.)
3. **Checks vulnerability databases** for known CVEs
4. **Reports severity and remediation** options
5. **Optionally auto-fixes** by updating to patched versions

## Supported Package Managers

| Ecosystem | Files | Tool Used |
|-----------|-------|-----------|
| Node.js | package.json, package-lock.json | npm audit |
| Python | requirements.txt, Pipfile, pyproject.toml | pip-audit, safety |
| Ruby | Gemfile, Gemfile.lock | bundler-audit |
| Java | pom.xml, build.gradle | dependency-check |
| Go | go.mod, go.sum | govulncheck |
| Rust | Cargo.toml, Cargo.lock | cargo-audit |
| PHP | composer.json, composer.lock | composer audit |
| .NET | *.csproj, packages.config | dotnet list --vulnerable |

## Scan Modes

### Full Scan
```
/dependency-scan
```
Scans all detected package managers, reports all severity levels.

### Specific Ecosystem
```
/dependency-scan --npm
/dependency-scan --pip
/dependency-scan --go
```

### Severity Filter
```
/dependency-scan --severity critical,high
/dependency-scan --severity medium
```

### Auto-Fix Mode
```
/dependency-scan --fix
/dependency-scan --fix --dry-run    # Preview changes
```

Attempts to update vulnerable packages to patched versions.

## Output Format

### Summary View

```
DEPENDENCY SCAN RESULTS
=======================

Scanned: package.json, requirements.txt
Packages analyzed: 127 (78 npm, 49 pip)

VULNERABILITIES BY SEVERITY
  Critical: 2
  High: 4
  Medium: 8
  Low: 12

TOP ISSUES

[!] CRITICAL: lodash < 4.17.21
    CVE-2021-23337: Command Injection
    Affected: lodash@4.17.19
    Fix: npm update lodash

[!] CRITICAL: urllib3 < 2.0.6
    CVE-2023-43804: Cookie Leak
    Affected: urllib3@1.26.0
    Fix: pip install urllib3>=2.0.6

[H] HIGH: express < 4.19.2
    CVE-2024-29041: Open Redirect
    Affected: express@4.18.0
    Fix: npm update express
```

### Detailed View
```
/dependency-scan --details
```

```
DETAILED VULNERABILITY REPORT
=============================

CVE-2021-23337
--------------
Package: lodash
Installed: 4.17.19
Patched: 4.17.21
Severity: CRITICAL (CVSS 9.8)

Description:
  Command Injection in lodash template function allows
  arbitrary command execution via crafted template strings.

Attack Vector: Remote, no auth required
Exploitability: Public exploit available

References:
  - https://nvd.nist.gov/vuln/detail/CVE-2021-23337
  - https://github.com/lodash/lodash/issues/5085

Remediation:
  npm update lodash
  # or
  npm install lodash@4.17.21
```

## Vulnerability Sources

### Databases Consulted

| Database | Coverage |
|----------|----------|
| NVD (National Vulnerability Database) | All CVEs |
| GitHub Advisory Database | GitHub-reported |
| OSV (Open Source Vulnerabilities) | Multi-ecosystem |
| npm Security Advisories | Node.js specific |
| PyPI Advisory Database | Python specific |
| RustSec Advisory Database | Rust specific |

### CVSS Scoring

| Score | Severity |
|-------|----------|
| 9.0-10.0 | Critical |
| 7.0-8.9 | High |
| 4.0-6.9 | Medium |
| 0.1-3.9 | Low |

## Commands Used

### Node.js (npm)
```bash
npm audit --json
npm audit fix           # Auto-fix
npm audit fix --force   # Breaking changes OK
```

### Python (pip-audit)
```bash
pip-audit
pip-audit --fix
pip-audit -r requirements.txt
```

### Python (safety)
```bash
safety check
safety check -r requirements.txt
```

### Ruby (bundler-audit)
```bash
bundle-audit check
bundle-audit update     # Update advisory DB
```

### Go (govulncheck)
```bash
govulncheck ./...
```

### Rust (cargo-audit)
```bash
cargo audit
cargo audit fix         # Auto-fix
```

## Auto-Fix Behavior

### Safe Fixes
Updates within semver-compatible range:
- Patch versions (1.2.3 → 1.2.4)
- Minor versions if locked to major (^1.2.3 → ^1.3.0)

### Breaking Fixes
May introduce breaking changes:
- Major version updates
- Requires `--force` flag

### Fix Report
```
AUTO-FIX REPORT
===============

Fixed: 8 vulnerabilities
  lodash: 4.17.19 → 4.17.21
  axios: 0.21.0 → 0.21.1
  minimist: 1.2.5 → 1.2.6

Unable to fix: 2 vulnerabilities
  react-scripts: No patch available (major version required)
  webpack-dev-server: Conflicts with other dependencies

Review package.json changes before committing.
```

## Configuration

### Ignore Known Issues

Create `.dependency-scan-ignore`:

```yaml
# Ignore specific CVEs (document reason!)
ignore:
  - id: CVE-2021-23337
    reason: "Not exploitable in our usage, lodash template not used"
    expires: 2024-12-31

  - id: GHSA-xxx-xxx
    reason: "Development dependency only"

# Ignore packages
packages:
  - name: lodash
    versions: ["< 4.17.0"]  # Only old versions
```

### Severity Thresholds

```yaml
# .dependency-scan.yaml
thresholds:
  fail_on: critical         # Fail CI on critical
  warn_on: high            # Warn on high
  ignore_below: low        # Don't report low

fix:
  auto_fix: true
  allow_major: false       # No major version bumps
```

## CI/CD Integration

### GitHub Actions
```yaml
- name: Dependency Scan
  run: |
    /dependency-scan --severity critical,high --fail-on-findings

- name: Auto-fix and PR
  if: failure()
  run: |
    /dependency-scan --fix
    git add .
    gh pr create --title "Security: Update vulnerable dependencies"
```

### Pre-Commit
```bash
#!/bin/sh
# Run on package.json changes
if git diff --cached --name-only | grep -q "package.json\|requirements.txt"; then
  /dependency-scan --severity critical,high
fi
```

## Dependency Health

### Beyond CVEs

```
/dependency-scan --health
```

Additional checks:
- **Outdated packages**: Major versions behind
- **Deprecated packages**: No longer maintained
- **License issues**: Incompatible licenses
- **Maintenance**: Last update, open issues

### Health Report

```
DEPENDENCY HEALTH
=================

Outdated (major behind): 5
  react: 17.0.2 → 18.2.0
  typescript: 4.9.5 → 5.3.3

Deprecated: 1
  request: Use got, axios, or node-fetch

Unmaintained (>2 years): 2
  moment: Consider dayjs or date-fns

License Issues: 0
```

## Related Skills

- `/security-scan` - Full security analysis
- `/secrets-scan` - Credential detection
- `/config-scan` - Configuration security
