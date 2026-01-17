# Dockerfile-Based Devcontainer Template

Use this template when:
- You need custom system packages
- You want to optimize startup time by caching installations
- You need specific tool versions not available as features
- You're building a production-like development environment
- You want fine-grained control over the image

## Directory Structure

```
.devcontainer/
├── devcontainer.json
├── Dockerfile
└── .dockerignore
```

## Basic Template

### devcontainer.json

```json
{
  "name": "Custom Dev Environment",
  "build": {
    "dockerfile": "Dockerfile",
    "context": ".."
  },

  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode"
      ]
    }
  },

  "forwardPorts": [3000],
  "postCreateCommand": "npm install",
  "remoteUser": "vscode"
}
```

### Dockerfile

```dockerfile
# Use devcontainer base for proper user setup
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Install system packages (cached layer)
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Switch to vscode user for subsequent operations
USER vscode

# Set working directory
WORKDIR /workspace
```

### .dockerignore

```
node_modules
.git
*.log
.env
dist
build
coverage
.cache
```

## Language-Specific Templates

### Node.js with Optimized Caching

```dockerfile
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install global packages (rarely changes)
RUN npm install -g typescript ts-node

# Copy package files first for caching
COPY package*.json ./

# Install dependencies (cached unless package.json changes)
RUN npm install

# Copy rest of code (changes frequently)
COPY . .

USER node
WORKDIR /workspace
```

With this setup, `postCreateCommand` can be empty or just run migrations.

### Python with Poetry

```dockerfile
FROM mcr.microsoft.com/devcontainers/python:3.11

# Install Poetry
RUN curl -sSL https://install.python-poetry.org | python3 -

# Add Poetry to PATH
ENV PATH="/home/vscode/.local/bin:$PATH"

# Copy dependency files
COPY pyproject.toml poetry.lock* ./

# Install dependencies (without creating virtualenv inside container)
RUN poetry config virtualenvs.create false \
    && poetry install --no-interaction --no-ansi

USER vscode
WORKDIR /workspace
```

### Go with Tools

```dockerfile
FROM mcr.microsoft.com/devcontainers/go:1.21

# Install additional Go tools
RUN go install github.com/cosmtrek/air@latest \
    && go install github.com/golangci/golangci-lint/cmd/golangci-lint@latest

# Copy go.mod and go.sum for dependency caching
COPY go.mod go.sum ./
RUN go mod download

USER vscode
WORKDIR /workspace
```

### Multi-Stage for Complex Setups

```dockerfile
# Build stage - install heavy dependencies
FROM mcr.microsoft.com/devcontainers/base:ubuntu AS builder

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    && rm -rf /var/lib/apt/lists/*

# Final development stage
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Copy only built artifacts from builder
COPY --from=builder /usr/local/bin/custom-tool /usr/local/bin/

# Development-specific tools
RUN apt-get update && apt-get install -y \
    git \
    vim \
    && rm -rf /var/lib/apt/lists/*

USER vscode
WORKDIR /workspace
```

## Optimization Patterns

### Layer Ordering for Cache Efficiency

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# 1. System packages (rarely change)
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 2. Global tools (occasionally change)
RUN npm install -g typescript

# 3. Dependency files (change with project updates)
COPY package*.json ./
RUN npm install

# 4. Source code (changes frequently)
COPY . .
```

### Cleanup in Same Layer

```dockerfile
# BAD: Cleanup in separate layer doesn't reduce size
RUN apt-get update && apt-get install -y build-essential
RUN rm -rf /var/lib/apt/lists/*

# GOOD: Cleanup in same layer
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*
```

### Using ARG for Flexible Versions

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

ARG NODE_VERSION=20
ARG PYTHON_VERSION=3.11

# Use in installation
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs
```

Override at build time:

```json
{
  "build": {
    "dockerfile": "Dockerfile",
    "args": {
      "NODE_VERSION": "18"
    }
  }
}
```

## Security Best Practices

### Run as Non-Root

```dockerfile
FROM mcr.microsoft.com/devcontainers/base:ubuntu

# Do root operations
RUN apt-get update && apt-get install -y \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Switch to non-root user
USER vscode
WORKDIR /home/vscode

# User-level installations
RUN npm install -g typescript
```

### Pin Versions

```dockerfile
# Good: Pinned versions
FROM mcr.microsoft.com/devcontainers/base:ubuntu-22.04

# Avoid: Unpinned versions
FROM mcr.microsoft.com/devcontainers/base:ubuntu
```

### Avoid Secrets in Dockerfile

```dockerfile
# BAD: Secret in image layer
ENV API_KEY=secret123

# GOOD: Use runtime environment
# Set in devcontainer.json remoteEnv or Codespaces secrets
```

## devcontainer.json Integration

```json
{
  "build": {
    "dockerfile": "Dockerfile",
    "context": "..",
    "args": {
      "NODE_VERSION": "20"
    }
  },

  // Features still work with Dockerfile
  "features": {
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  },

  // Only run what MUST happen after container creation
  "postCreateCommand": "npm run setup:dev",

  "remoteUser": "vscode"
}
```

## Debugging Build Issues

### View Build Output

```bash
# Full build output
docker build --progress=plain -t test .

# No cache (rebuild from scratch)
docker build --no-cache -t test .
```

### Inspect Layers

```bash
# See layer sizes
docker history <image>

# Detailed layer analysis
docker inspect <image>
```

### Test Without VS Code

```bash
# Build and run interactively
docker build -t dev-test .
docker run -it dev-test /bin/bash
```

## When to Graduate to Docker Compose

Move to Docker Compose when:
- You need additional services (database, cache, queue)
- Services need to communicate via network
- You want to match production multi-container setup

See `devcontainer-compose.md` template.
