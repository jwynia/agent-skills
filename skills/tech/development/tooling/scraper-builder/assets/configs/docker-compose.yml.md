# Docker Compose Template

Docker Compose configuration for running the scraper with volume mounts for output data and debug screenshots.

## Template

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
      - OUTPUT_DIR=/app/data
    volumes:
      # Persist scraped data on the host
      - ./data:/app/data
      # Persist debug screenshots on the host
      - ./screenshots:/app/screenshots
    # Prevent runaway browser processes from consuming all resources
    deploy:
      resources:
        limits:
          memory: 2G
          cpus: '2'
```

## Usage

```bash
# Build and run
docker compose up --build

# Run with custom URL
BASE_URL=https://shop.example.com docker compose up

# Run in background
docker compose up -d

# View logs
docker compose logs -f scraper

# One-off run (remove container after)
docker compose run --rm scraper
```

## Customization Notes

- **Environment variables:** Override at runtime via shell exports or a `.env` file in the project root. Docker Compose automatically reads `.env`.
- **Resource limits:** Adjust `memory` and `cpus` based on target site complexity. Heavy JavaScript sites need more memory.
- **Shared memory:** If Chromium crashes with out-of-memory errors, add `shm_size: '512mb'` under the service.
- **Networking:** Add a `networks` section if the scraper needs to communicate with other services (proxy, database).
- **Restart policy:** Add `restart: on-failure` for scheduled/recurring scrapes.

## See Also

- `dockerfile.md` — Dockerfile template
- `../../references/docker-setup.md` — Full Docker setup guide
