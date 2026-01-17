# Research Findings: CalibreWeb CLI Tools

## Classification
- **Domain:** Software Development
- **Stability:** Dynamic
- **Abstraction:** Detailed
- **Confidence:** High (based on official docs and source code)

---

## 1. CalibreWeb Architecture

### Core Technology
- **Framework:** Flask (Python)
- **Rendering:** Server-side (no SPA/REST by default)
- **Database:** Uses existing Calibre SQLite database (`metadata.db`)
- **Default Port:** 8083
- **Default Credentials:** admin / admin123

### Key Flask Routes (from web.py)
| Route | Method | Purpose |
|-------|--------|---------|
| `/opds` | GET | OPDS catalog feed |
| `/ajax/listbooks` | GET | List books with pagination/search |
| `/ajax/toggleread/<book_id>` | POST | Toggle read status |
| `/ajax/togglearchived/<book_id>` | POST | Archive/unarchive book |
| `/ajax/view` | POST | Save view settings |
| `/table` | GET | Books table view |
| `/read/<book_id>/<format>` | GET | Read book in browser |
| `/download/<book_id>/<format>` | GET | Download book file |
| `/send/<book_id>/<format>` | POST | Send to e-reader |

### Authentication Methods
1. **Session-based** - Standard Flask session cookies
2. **Basic Auth** - Username/password
3. **OAuth 2.0** - Google, GitHub providers
4. **LDAP** - Enterprise directory integration
5. **Proxy Auth** - Header-based (Authelia, Traefik)
6. **Kobo Token** - Generated per-user, works for all API calls

---

## 2. OPDS Catalog Specification (v1.2)

### Feed Types
| Type | MIME Type | Purpose |
|------|-----------|---------|
| Navigation | `application/atom+xml;profile=opds-catalog;kind=navigation` | Hierarchical browsing |
| Acquisition | `application/atom+xml;profile=opds-catalog;kind=acquisition` | Book listings |

### CalibreWeb OPDS Endpoints
```
/opds                     # Root catalog
/opds/new                 # Recently added
/opds/hot                 # Popular books
/opds/author              # Browse by author
/opds/category            # Browse by category
/opds/series              # Browse by series
/opds/search?query=<term> # Search books
```

### Acquisition Link Relations
| Relation | Purpose |
|----------|---------|
| `http://opds-spec.org/acquisition/open-access` | Free download |
| `http://opds-spec.org/acquisition` | Standard download |
| `http://opds-spec.org/image` | Cover image |
| `http://opds-spec.org/image/thumbnail` | Thumbnail |

### Entry Structure (Atom XML)
```xml
<entry>
  <title>Book Title</title>
  <id>urn:uuid:book-id</id>
  <author><name>Author Name</name></author>
  <dc:language>en</dc:language>
  <summary>Book description...</summary>
  <link rel="http://opds-spec.org/acquisition"
        href="/download/123/epub"
        type="application/epub+zip"/>
  <link rel="http://opds-spec.org/image"
        href="/cover/123"
        type="image/jpeg"/>
</entry>
```

---

## 3. Calibre CLI Tools

### Primary Tools for CLI Integration

#### calibredb
Database operations against a Calibre library.

```bash
# List all books
calibredb list --library-path /path/to/library

# Search books
calibredb search "author:Tolkien" --library-path /path/to/library

# Show metadata
calibredb show_metadata 123 --library-path /path/to/library

# Export book
calibredb export 123 --to-dir /output --formats epub,mobi

# Add book
calibredb add /path/to/book.epub --library-path /path/to/library

# Set metadata
calibredb set_metadata 123 --field "tags:fiction,fantasy"
```

**Remote Access:**
```bash
calibredb list --with-library http://server:port#library_name \
  --username user --password pass
```

#### ebook-convert
Format conversion between ebook types.

```bash
# Basic conversion
ebook-convert input.epub output.mobi

# With options
ebook-convert input.epub output.pdf \
  --paper-size letter \
  --pdf-page-margin-left 72 \
  --pdf-page-margin-right 72

# EPUB to Kindle (KF8 format)
ebook-convert input.epub output.azw3

# Supported formats (input): EPUB, MOBI, AZW, PDF, HTML, TXT, RTF, ODT, DOCX
# Supported formats (output): EPUB, MOBI, AZW3, PDF, TXT, HTML, DOCX
```

#### ebook-meta
Metadata inspection and modification.

```bash
# View metadata
ebook-meta book.epub

# Set metadata
ebook-meta book.epub --title "New Title" --authors "Author Name"
```

#### fetch-ebook-metadata
Retrieve metadata from online sources.

```bash
fetch-ebook-metadata --title "1984" --authors "Orwell"
```

---

## 4. calibre-rest (Third-Party API)

A REST API wrapper around `calibredb` for programmatic access.

### Endpoints
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/books/{id}` | Get book metadata |
| GET | `/books?title=~^foo` | Search books |
| POST | `/books` | Add book (multipart) |
| GET | `/export/{id}` | Download book |

### Configuration
```bash
export CALIBRE_REST_USERNAME=user
export CALIBRE_REST_PASSWORD=pass
export CALIBRE_REST_LIBRARY=/path/to/library
export CALIBRE_REST_ADDR=localhost:5000
```

### Search Syntax
```bash
# Exact match
curl "localhost:5000/books?title:foo"

# Regex match
curl "localhost:5000/books?title:~^foo.*bar$"
```

---

## 5. Authentication Patterns

### For OPDS Access (Basic Auth)
```bash
curl -u username:password http://calibre-web:8083/opds
```

### For CalibreWeb Session
```bash
# Login to get session cookie
curl -c cookies.txt -d "username=admin&password=admin123" \
  http://calibre-web:8083/login

# Use session for subsequent requests
curl -b cookies.txt http://calibre-web:8083/download/123/epub -o book.epub
```

### For Kobo Token (if enabled)
```bash
# Token is in the Kobo sync URL: /kobo/<token>/v1/...
# Can be used for API calls without session
curl http://calibre-web:8083/kobo/<token>/v1/library/sync
```

---

## 6. Network Considerations (Tailscale)

### Direct Access
- CalibreWeb on Tailscale IP: `http://100.x.x.x:8083`
- No additional VPN configuration needed
- HTTPS recommended with reverse proxy

### MagicDNS
- Access via hostname: `http://hostname.tail-net.ts.net:8083`
- Requires MagicDNS enabled in Tailscale admin

### HTTPS Options
1. Tailscale HTTPS (automatic certs for `*.ts.net`)
2. Reverse proxy (Caddy, nginx) with Let's Encrypt
3. Self-signed certificates
