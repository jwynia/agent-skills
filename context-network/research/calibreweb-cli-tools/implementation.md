# Implementation Guide: CalibreWeb CLI Tools

## Classification
- **Domain:** Practical/Applied
- **Stability:** Semi-stable
- **Abstraction:** Structural
- **Confidence:** High

---

## Recommended Architecture

### Approach: OPDS Client + Calibre CLI

The most robust approach combines:
1. **OPDS client** for browsing and downloading from CalibreWeb
2. **Calibre CLI tools** (`ebook-convert`, `ebook-meta`) for local operations
3. **Direct HTTP** for any CalibreWeb-specific features

### Why OPDS?
- Standardized, well-documented protocol
- Works across any OPDS-compliant server
- Handles authentication cleanly
- Atom/XML is easy to parse
- Future-proof (not dependent on internal CalibreWeb routes)

---

## Core Components

### 1. Configuration Management
```
~/.calibre-cli/
  config.yaml       # Server URLs, credentials
  cache/            # Cached catalog data
  downloads/        # Default download directory
```

**config.yaml schema:**
```yaml
servers:
  home:
    url: http://100.x.x.x:8083
    username: admin
    password: (encrypted or from keyring)
    default: true

settings:
  download_dir: ~/Books
  default_format: epub
  convert_to: null  # or "mobi", "azw3", etc.
```

### 2. OPDS Client Module

**Core operations:**
| Command | Description |
|---------|-------------|
| `list` | Browse/list books from catalog |
| `search <query>` | Search books by title, author, etc. |
| `info <book-id>` | Show book metadata |
| `download <book-id>` | Download book file |
| `formats <book-id>` | List available formats |

**Implementation notes:**
- Parse Atom XML feeds with `xml.etree.ElementTree` or `lxml`
- Follow `link rel="next"` for pagination
- Cache catalog locally for faster repeated access
- Support Basic Auth via `requests` library

### 3. Conversion Module

**Wrapper around ebook-convert:**
```bash
calibre-cli convert <input> --to <format> [--output <path>]
```

**Options:**
- `--to epub|mobi|azw3|pdf`
- `--output` - Custom output path
- `--profile` - Device profile (kindle, kobo, etc.)

### 4. Download + Convert Pipeline

```bash
# Download and convert in one step
calibre-cli get <book-id> --format mobi

# If book not available in mobi, download epub and convert
```

---

## CLI Design

### Command Structure
```
calibre-cli [global-options] <command> [command-options] [arguments]

Global Options:
  --server, -s    Server name from config (default: "default")
  --verbose, -v   Verbose output
  --json          Output as JSON

Commands:
  list            List books (with filters)
  search          Search catalog
  info            Show book details
  download        Download book
  convert         Convert local file
  get             Download + optional convert
  config          Manage configuration
  servers         List configured servers
```

### Example Usage
```bash
# List recent books
calibre-cli list --recent --limit 20

# Search by author
calibre-cli search "author:Sanderson"

# Download book
calibre-cli download 123 --format epub

# Download and convert to Kindle format
calibre-cli get 123 --format azw3

# Show book info
calibre-cli info 123

# Convert local file
calibre-cli convert mybook.epub --to mobi
```

---

## Implementation Options

### Option A: Python (Recommended)

**Pros:**
- Native Calibre library integration possible
- Rich ecosystem (requests, click, lxml)
- Cross-platform

**Libraries:**
- `click` - CLI framework
- `requests` - HTTP client
- `lxml` or `defusedxml` - XML parsing
- `keyring` - Secure credential storage
- `pyyaml` - Configuration
- `rich` - Terminal formatting

**Structure:**
```
calibre-cli/
  pyproject.toml
  src/
    calibre_cli/
      __init__.py
      cli.py          # Click commands
      config.py       # Configuration management
      opds.py         # OPDS client
      convert.py      # ebook-convert wrapper
      models.py       # Book, Entry dataclasses
```

### Option B: TypeScript/Deno

**Pros:**
- Matches project's technical stack (per context network)
- Single binary distribution
- Good XML parsing with `fast-xml-parser`

**Libraries:**
- `cliffy` - CLI framework
- `fast-xml-parser` - XML parsing
- Native `fetch` - HTTP client

### Option C: Shell Scripts + jq/xmlstarlet

**Pros:**
- Zero dependencies
- Quick to prototype
- Composable with other CLI tools

**Cons:**
- Limited error handling
- XML parsing is awkward
- Less maintainable

---

## Authentication Implementation

### Basic Auth for OPDS
```python
import requests
from requests.auth import HTTPBasicAuth

def fetch_opds(url, username, password):
    response = requests.get(
        url,
        auth=HTTPBasicAuth(username, password)
    )
    return response.content
```

### Session Auth for CalibreWeb
```python
def get_session(base_url, username, password):
    session = requests.Session()
    session.post(f"{base_url}/login", data={
        "username": username,
        "password": password
    })
    return session
```

### Credential Storage
```python
import keyring

def store_credentials(server_name, username, password):
    keyring.set_password("calibre-cli", f"{server_name}_user", username)
    keyring.set_password("calibre-cli", f"{server_name}_pass", password)

def get_credentials(server_name):
    username = keyring.get_password("calibre-cli", f"{server_name}_user")
    password = keyring.get_password("calibre-cli", f"{server_name}_pass")
    return username, password
```

---

## OPDS Parsing Example

```python
from dataclasses import dataclass
from xml.etree import ElementTree as ET

ATOM_NS = "http://www.w3.org/2005/Atom"
DC_NS = "http://purl.org/dc/terms/"
OPDS_NS = "http://opds-spec.org/2010/catalog"

@dataclass
class Book:
    id: str
    title: str
    author: str
    summary: str
    formats: dict[str, str]  # format -> download URL
    cover_url: str | None

def parse_feed(xml_content: bytes) -> list[Book]:
    root = ET.fromstring(xml_content)
    books = []

    for entry in root.findall(f"{{{ATOM_NS}}}entry"):
        book_id = entry.find(f"{{{ATOM_NS}}}id").text
        title = entry.find(f"{{{ATOM_NS}}}title").text

        author_elem = entry.find(f"{{{ATOM_NS}}}author/{{{ATOM_NS}}}name")
        author = author_elem.text if author_elem is not None else "Unknown"

        summary_elem = entry.find(f"{{{ATOM_NS}}}summary")
        summary = summary_elem.text if summary_elem is not None else ""

        # Parse acquisition links
        formats = {}
        for link in entry.findall(f"{{{ATOM_NS}}}link"):
            rel = link.get("rel", "")
            if "acquisition" in rel:
                href = link.get("href")
                mime_type = link.get("type", "")
                # Map MIME to format name
                format_name = mime_to_format(mime_type)
                formats[format_name] = href

        # Find cover
        cover_url = None
        for link in entry.findall(f"{{{ATOM_NS}}}link"):
            if "image" in link.get("rel", ""):
                cover_url = link.get("href")
                break

        books.append(Book(
            id=book_id,
            title=title,
            author=author,
            summary=summary,
            formats=formats,
            cover_url=cover_url
        ))

    return books

def mime_to_format(mime_type: str) -> str:
    mapping = {
        "application/epub+zip": "epub",
        "application/x-mobipocket-ebook": "mobi",
        "application/pdf": "pdf",
        "application/x-mobi8-ebook": "azw3",
    }
    return mapping.get(mime_type, mime_type)
```

---

## Testing Strategy

### Unit Tests
- OPDS XML parsing with sample feeds
- Configuration loading/saving
- URL construction

### Integration Tests
- Actual OPDS fetch against test server
- Download verification
- Conversion pipeline

### Manual Testing
- Test against real CalibreWeb instance
- Verify authentication flows
- Test edge cases (large libraries, special characters)

---

## Future Enhancements

1. **Sync functionality** - Keep local directory in sync with library
2. **Metadata editing** - Update book metadata remotely
3. **Upload** - Add books to library (if CalibreWeb supports)
4. **Reading progress** - Track/sync reading progress
5. **Collections** - Manage shelves/collections
6. **Export** - Batch export to device
