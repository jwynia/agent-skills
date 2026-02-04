# Docker Setup for Playwright Scrapers

Running scrapers in Docker ensures consistent browser environments, eliminates "works on my machine" issues, and simplifies deployment to servers and CI.

## Official Playwright Docker Images

Microsoft maintains official Docker images with all browser dependencies pre-installed:

```
mcr.microsoft.com/playwright:v1.48.0-jammy
```

These images include:
- Chromium, Firefox, and WebKit browsers
- All system dependencies (fonts, libraries, codecs)
- Node.js runtime
- Non-root user `pwuser` (UID 1000)

### Image Tags

| Tag | Base OS | Size |
|-----|---------|------|
| `v1.48.0-jammy` | Ubuntu 22.04 | ~1.2 GB |
| `v1.48.0-noble` | Ubuntu 24.04 | ~1.2 GB |

Always pin the Playwright image version to match your `package.json` Playwright version. Mismatched versions cause browser launch failures.

## Dockerfile

```dockerfile
# Build stage
FROM mcr.microsoft.com/playwright:v1.48.0-jammy AS builder

WORKDIR /app

# Copy dependency manifests first (Docker cache optimization)
COPY package*.json ./
RUN npm ci

# Copy source and compile
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# Production stage
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Create output directories
RUN mkdir -p data screenshots

# Run as non-root
USER pwuser

CMD ["node", "dist/index.js"]
```

### Build Decisions

- **Multi-stage build** — Keeps TypeScript compiler and dev dependencies out of the production image
- **Dependency cache** — Copy `package*.json` before source code so `npm ci` is cached when only code changes
- **Non-root user** — `pwuser` is included in the Playwright image; use it for security
- **Output directories** — Create `data/` and `screenshots/` in the image; mount volumes at runtime for persistence

## Docker Compose

```yaml
services:
  scraper:
    build: .
    environment:
      - NODE_ENV=production
      - BASE_URL=${BASE_URL:-https://example.com}
      - HEADLESS=true
      - MAX_PAGES=${MAX_PAGES:-10}
      - REQUEST_DELAY=${REQUEST_DELAY:-1000}
    volumes:
      - ./data:/app/data
      - ./screenshots:/app/screenshots
    # Resource limits prevent runaway browser processes
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

### Volume Mounts

| Mount | Purpose |
|-------|---------|
| `./data:/app/data` | Scraped output (JSON, CSV) persists on host |
| `./screenshots:/app/screenshots` | Debug screenshots accessible from host |

### Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `https://example.com` | Target site base URL |
| `HEADLESS` | `true` | Run browser in headless mode |
| `MAX_PAGES` | `10` | Maximum pages to scrape |
| `REQUEST_DELAY` | `1000` | Delay between requests (ms) |
| `NODE_ENV` | `production` | Node environment |

## Running

### Build and Run

```bash
# Build the image
docker compose build

# Run the scraper
docker compose up

# Run with custom URL
BASE_URL=https://shop.example.com docker compose up

# Run in background
docker compose up -d

# View logs
docker compose logs -f scraper
```

### One-Off Runs

```bash
# Run once and remove container
docker compose run --rm scraper

# Override command for debugging
docker compose run --rm scraper node -e "console.log('Browser check')"
```

## Playwright Configuration for Docker

When running in Docker, Playwright needs specific configuration:

```typescript
import { chromium } from 'playwright';

const browser = await chromium.launch({
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-setuid-sandbox',
    '--disable-dev-shm-usage',  // Use /tmp instead of /dev/shm
    '--disable-gpu',
  ],
});
```

### `--disable-dev-shm-usage`

Docker containers have a small `/dev/shm` (shared memory) by default (64MB). Chromium uses `/dev/shm` for shared memory, which can cause crashes. This flag tells Chromium to use `/tmp` instead. Alternatively, increase shared memory in docker-compose:

```yaml
services:
  scraper:
    shm_size: '512mb'
```

## CI Integration

### GitHub Actions

```yaml
jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: docker compose build
      - run: docker compose run --rm scraper
      - uses: actions/upload-artifact@v4
        with:
          name: scraped-data
          path: data/
```

### Scheduled Runs

```yaml
on:
  schedule:
    - cron: '0 6 * * *'  # Daily at 6 AM UTC
```

## Troubleshooting

| Problem | Cause | Solution |
|---------|-------|----------|
| Browser crash on launch | Insufficient shared memory | Add `--disable-dev-shm-usage` or increase `shm_size` |
| Font rendering issues | Missing fonts in image | Use official Playwright image (includes fonts) |
| Permission denied on volumes | UID mismatch | Ensure host directories are writable by UID 1000 |
| Playwright version mismatch | Image/package version differ | Pin both to same version |
| Container OOM killed | Browser memory leak | Set memory limits and restart policy |

## See Also

- `../assets/configs/dockerfile.md` — Dockerfile template
- `../assets/configs/docker-compose.yml.md` — Docker Compose template
- `pageobject-pattern.md` — PageObject pattern overview
