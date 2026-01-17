# Docker Compose-Based Devcontainer Template

Use this template when:
- Your app needs multiple services (database, cache, queue)
- You want to develop against a production-like environment
- Services need to communicate with each other
- You need persistent data volumes

## Directory Structure

```
.devcontainer/
├── devcontainer.json
├── docker-compose.yml
├── Dockerfile          # Optional: for app service
└── .env               # Environment variables
```

## Basic Multi-Service Template

### devcontainer.json

```json
{
  "name": "Full Stack Dev",
  "dockerComposeFile": "docker-compose.yml",
  "service": "app",
  "workspaceFolder": "/workspace",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode",
        "ms-azuretools.vscode-docker"
      ]
    }
  },

  "forwardPorts": [3000, 5432],
  "portsAttributes": {
    "3000": { "label": "App" },
    "5432": { "label": "PostgreSQL" }
  },

  "postCreateCommand": "npm install",
  "remoteUser": "vscode"
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity
    depends_on:
      db:
        condition: service_healthy
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/dev
    networks:
      - dev-network

  db:
    image: postgres:15
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - dev-network

volumes:
  postgres-data:

networks:
  dev-network:
```

### Dockerfile (for app service)

```dockerfile
FROM mcr.microsoft.com/devcontainers/javascript-node:20

# Install any additional system packages
RUN apt-get update && apt-get install -y \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

USER node
WORKDIR /workspace
```

## Common Service Combinations

### Node.js + PostgreSQL + Redis

```yaml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/dev
      - REDIS_URL=redis://redis:6379
    networks:
      - dev-network

  db:
    image: postgres:15
    restart: unless-stopped
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: dev
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - dev-network

  redis:
    image: redis:7-alpine
    restart: unless-stopped
    volumes:
      - redis-data:/data
    networks:
      - dev-network

volumes:
  postgres-data:
  redis-data:

networks:
  dev-network:
```

### Python + MySQL + RabbitMQ

```yaml
version: '3.8'

services:
  app:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity
    depends_on:
      db:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    environment:
      - DATABASE_URL=mysql://root:root@db:3306/dev
      - RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
    networks:
      - dev-network

  db:
    image: mysql:8
    restart: unless-stopped
    volumes:
      - mysql-data:/var/lib/mysql
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: dev
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - dev-network

  rabbitmq:
    image: rabbitmq:3-management
    restart: unless-stopped
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    healthcheck:
      test: rabbitmq-diagnostics -q ping
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - dev-network

volumes:
  mysql-data:
  rabbitmq-data:

networks:
  dev-network:
```

### Microservices Development

```yaml
version: '3.8'

services:
  # Main development service (VS Code attaches here)
  api:
    build:
      context: ..
      dockerfile: .devcontainer/Dockerfile
    volumes:
      - ..:/workspace:cached
    command: sleep infinity
    depends_on:
      - db
      - auth-service
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/api
      - AUTH_SERVICE_URL=http://auth-service:3001
    ports:
      - "3000:3000"
    networks:
      - dev-network

  # Additional service that's part of the system
  auth-service:
    build:
      context: ../auth-service
      dockerfile: Dockerfile
    volumes:
      - ../auth-service:/app:cached
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/auth
    ports:
      - "3001:3001"
    networks:
      - dev-network

  db:
    image: postgres:15
    volumes:
      - postgres-data:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    networks:
      - dev-network

volumes:
  postgres-data:

networks:
  dev-network:
```

## Configuration Patterns

### Environment Variables from File

**.devcontainer/.env:**
```env
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@db:5432/dev
```

**docker-compose.yml:**
```yaml
services:
  app:
    env_file:
      - .env
```

### Volume Mounting Strategies

```yaml
services:
  app:
    volumes:
      # Source code: cached for performance
      - ..:/workspace:cached

      # Node modules: named volume for speed
      - node_modules:/workspace/node_modules

      # Persistent user config
      - vscode-extensions:/home/vscode/.vscode-server/extensions

volumes:
  node_modules:
  vscode-extensions:
```

### Health Checks for Dependencies

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_healthy

  db:
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

  redis:
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5
```

### Networking

```yaml
services:
  app:
    networks:
      - frontend
      - backend

  db:
    networks:
      - backend

  nginx:
    networks:
      - frontend

networks:
  frontend:
  backend:
```

Service discovery via DNS: `http://db:5432`, `http://redis:6379`

## Port Forwarding

**devcontainer.json:**
```json
{
  "forwardPorts": [3000, 5432, 6379],
  "portsAttributes": {
    "3000": {
      "label": "Application",
      "onAutoForward": "openBrowser"
    },
    "5432": {
      "label": "PostgreSQL",
      "onAutoForward": "silent"
    },
    "6379": {
      "label": "Redis",
      "onAutoForward": "silent"
    }
  }
}
```

## Running Multiple Services

If you need VS Code attached to multiple services, create multiple devcontainer configs:

**.devcontainer/api/devcontainer.json:**
```json
{
  "name": "API Development",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "api",
  "workspaceFolder": "/workspace"
}
```

**.devcontainer/auth/devcontainer.json:**
```json
{
  "name": "Auth Service Development",
  "dockerComposeFile": "../docker-compose.yml",
  "service": "auth-service",
  "workspaceFolder": "/app"
}
```

## Common Issues

### Services Can't Connect

```yaml
# Ensure all services on same network
services:
  app:
    networks:
      - dev-network
  db:
    networks:
      - dev-network

networks:
  dev-network:
```

### Data Not Persisting

```yaml
# Use named volumes, not bind mounts for databases
volumes:
  postgres-data:  # Named volume

services:
  db:
    volumes:
      - postgres-data:/var/lib/postgresql/data  # Persists across rebuilds
```

### Slow File System

```yaml
# Use cached consistency for source code
volumes:
  - ..:/workspace:cached  # Improves macOS performance

# Use delegated for write-heavy directories
  - ../logs:/workspace/logs:delegated
```

### Container Startup Order

```yaml
services:
  app:
    depends_on:
      db:
        condition: service_healthy  # Wait for health check
    restart: unless-stopped         # Restart if DB not ready
```

## GitHub Codespaces Considerations

- Services run inside the Codespace VM (not separate VMs)
- Port forwarding works automatically
- Named volumes persist within the Codespace
- Some volume mounts may behave differently

Test in both local VS Code and Codespaces to ensure compatibility.
