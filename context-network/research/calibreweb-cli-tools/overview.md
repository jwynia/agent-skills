# Research: CalibreWeb CLI Tools Integration

## Purpose
Research to inform the design of CLI scripts/tools for interacting with a CalibreWeb ebook library on a Tailscale network. The tools should enable finding, downloading, converting, and managing ebooks programmatically.

## Classification
- **Domain:** Software Development / Personal Infrastructure
- **Stability:** Dynamic - research represents current understanding
- **Abstraction:** Structural - synthesized findings
- **Confidence:** Established - based on official documentation and source code

## Research Scope
- **Core Topic:** CalibreWeb API access, OPDS catalogs, CLI integration patterns
- **Research Depth:** Comprehensive
- **Date Conducted:** 2026-01-10

## Key Questions Addressed

### 1. Does CalibreWeb have a REST API?
- **Finding:** No native REST API. CalibreWeb is a server-side rendered Flask application without documented API endpoints.
- **Confidence:** High
- **Alternative:** The Kobo sync endpoints use token-based auth that can authorize any CalibreWeb API call.

### 2. How can we access the library programmatically?
- **Finding:** Three primary approaches available:
  1. **OPDS Feed** (`/opds`) - Standard catalog format, best for browsing/downloading
  2. **Web scraping** - Flask routes exist but undocumented
  3. **calibre-rest** - Third-party REST wrapper around `calibredb`
- **Confidence:** High

### 3. What authentication methods are supported?
- **Finding:** CalibreWeb supports LDAP, Google/GitHub OAuth, proxy authentication, and basic auth. OPDS supports Basic Auth and OAuth 2.0. Kobo sync tokens work for all endpoints.
- **Confidence:** High

### 4. How do we convert ebook formats?
- **Finding:** Calibre's `ebook-convert` CLI tool handles all conversions. CalibreWeb can invoke this if Calibre binaries are available on the server.
- **Confidence:** High

## Executive Summary

CalibreWeb is a Flask-based web application that serves ebooks from a Calibre database. It does **not** provide a documented REST API, but offers several programmatic access methods:

1. **OPDS Catalog** (Best Option): Available at `/opds`, follows the OPDS 1.2 specification. Provides Atom-based XML feeds for browsing and downloading books. Supports Basic Authentication and is compatible with any OPDS client.

2. **Kobo Sync API**: Generates user tokens that can authorize API calls without username/password. This is the closest to a "native" API.

3. **calibre-rest** (Alternative): A third-party REST API wrapper that wraps `calibredb` directly. Useful if you have direct filesystem access to the Calibre library.

For format conversion, the `ebook-convert` CLI tool from Calibre handles all supported formats (EPUB, MOBI, PDF, AZW3, etc.).

## Navigation
- **Detailed Findings:** [[findings.md]]
- **Source Analysis:** [[sources.md]]
- **Implementation Guide:** [[implementation.md]]

## Related Context Network Nodes
- [[/context-network/elements/skills/research/web-search.md]]
