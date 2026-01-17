# Source Analysis: CalibreWeb CLI Tools Research

## Classification
- **Domain:** Meta/Research
- **Stability:** Static
- **Abstraction:** Detailed
- **Confidence:** Established

---

## Primary Sources

| Source | Type | Credibility | Key Contributions |
|--------|------|-------------|-------------------|
| [janeczku/calibre-web](https://github.com/janeczku/calibre-web) | Official Repo | High | Feature list, auth methods, OPDS endpoint |
| [Calibre User Manual](https://manual.calibre-ebook.com/) | Official Docs | High | CLI tools documentation, calibredb, ebook-convert |
| [OPDS 1.2 Specification](https://specs.opds.io/opds-1.2.html) | Standard | High | Feed structure, acquisition links, search |
| [Authentication for OPDS 1.0](https://drafts.opds.io/authentication-for-opds-1.0.html) | Draft Spec | High | Auth flows, Basic Auth, OAuth support |

## Secondary Sources

| Source | Type | Credibility | Value |
|--------|------|-------------|-------|
| [kencx/calibre-rest](https://github.com/kencx/calibre-rest) | Third-party | Medium | REST API wrapper pattern, endpoint design |
| [calibredb docs](https://manual.calibre-ebook.com/generated/en/calibredb.html) | Official | High | Database operations, remote access |
| [ebook-convert docs](https://manual.calibre-ebook.com/generated/en/ebook-convert.html) | Official | High | Conversion options, format support |
| [CalibreWeb OPDS Issue #2103](https://github.com/janeczku/calibre-web/issues/2103) | Community | Medium | OPDS URL discovery |
| [Kobo sync PR #1100](https://github.com/janeczku/calibre-web/pull/1100) | Official | High | Token auth implementation details |
| [MobileRead Forums](https://www.mobileread.com/forums/) | Community | Medium | User experiences, workarounds |

## Source Consensus Analysis

### Strong Agreement On
- OPDS is the standard way to programmatically browse ebook catalogs
- CalibreWeb does not have a documented REST API
- `calibredb` and `ebook-convert` are the official CLI tools
- Basic Auth works for OPDS access

### Divergent Views On
- Best approach for programmatic access (OPDS vs web scraping vs calibre-rest)
- Whether to wrap CalibreWeb or access Calibre library directly

### Gaps in Literature
- No official CalibreWeb API documentation
- Limited documentation on internal Flask routes
- No official CLI client for CalibreWeb

## Research Quality Metrics

| Metric | Assessment |
|--------|------------|
| Source Diversity | Good - official docs, specs, community sources |
| Recency | Current - checked against latest versions |
| Depth | Comprehensive for core topics |
| Bias | Low - primarily technical documentation |

---

## Full Source Links

### CalibreWeb
- GitHub Repository: https://github.com/janeczku/calibre-web
- PyPI Package: https://pypi.org/project/calibreweb/

### Calibre Documentation
- CLI Index: https://manual.calibre-ebook.com/generated/en/cli-index.html
- calibredb: https://manual.calibre-ebook.com/generated/en/calibredb.html
- ebook-convert: https://manual.calibre-ebook.com/generated/en/ebook-convert.html
- Database API: https://manual.calibre-ebook.com/db_api.html
- Content Server: https://manual.calibre-ebook.com/server.html

### OPDS
- Specifications: https://specs.opds.io/
- OPDS 1.2: https://specs.opds.io/opds-1.2.html
- Authentication Draft: https://drafts.opds.io/authentication-for-opds-1.0.html
- OPDS 2.0 Draft: https://github.com/opds-community/drafts/blob/main/opds-2.0.md
- MobileRead Wiki: https://wiki.mobileread.com/wiki/OPDS

### Third-Party Tools
- calibre-rest: https://github.com/kencx/calibre-rest
- Calibre-Web-Automated: https://github.com/crocodilestick/Calibre-Web-Automated
- calibre-opds-client: https://github.com/goodlibs/calibre-opds-client
