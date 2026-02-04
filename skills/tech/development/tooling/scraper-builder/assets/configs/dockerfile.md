# Dockerfile Template

Multi-stage Dockerfile using Microsoft's official Playwright image with all browser dependencies pre-installed.

## Template

```dockerfile
# ============================================
# Stage 1: Build
# ============================================
FROM mcr.microsoft.com/playwright:v1.48.0-jammy AS builder

WORKDIR /app

# Copy dependency manifests first for Docker cache optimization
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript
COPY tsconfig.json ./
COPY src/ ./src/
RUN npx tsc

# ============================================
# Stage 2: Production
# ============================================
FROM mcr.microsoft.com/playwright:v1.48.0-jammy

WORKDIR /app

# Install production dependencies only
COPY package*.json ./
RUN npm ci --omit=dev

# Copy compiled output from builder
COPY --from=builder /app/dist ./dist

# Copy .env.example as reference (actual .env should be mounted or set via compose)
COPY .env.example ./.env.example

# Create output directories
RUN mkdir -p data screenshots

# Run as the non-root user included in the Playwright image
USER pwuser

CMD ["node", "dist/index.js"]
```

## Customization Notes

- **Playwright version:** Always match the image tag version (`v1.48.0`) to the `playwright` package version in `package.json`. Mismatched versions cause browser launch failures.
- **Base OS:** `jammy` = Ubuntu 22.04. Use `noble` for Ubuntu 24.04.
- **Single-stage alternative:** For simpler setups, remove the build stage and use `tsx` to run TypeScript directly (add `tsx` to production dependencies).
- **Environment variables:** Pass via `docker-compose.yml` or `docker run -e`. Do not bake secrets into the image.
- **Shared memory:** If Chromium crashes, add `--shm-size=512m` to docker run or `shm_size: '512mb'` in compose.

## See Also

- `docker-compose.yml.md` — Compose configuration
- `../../references/docker-setup.md` — Full Docker setup guide
