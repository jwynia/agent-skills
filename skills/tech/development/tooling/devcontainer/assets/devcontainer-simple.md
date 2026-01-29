# Simple Image-Based Devcontainer Template

Use this template when:
- You want the fastest setup
- You're using a standard language/framework
- You don't need custom system packages
- The base image already has what you need

## Basic Template

Create `.devcontainer/devcontainer.json`:

```json
{
  "name": "Project Name",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",

  // Features add common tools without custom Dockerfile
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {}
  },

  // VS Code customization
  "customizations": {
    "vscode": {
      "extensions": [
        "esbenp.prettier-vscode",
        "dbaeumer.vscode-eslint"
      ],
      "settings": {
        "editor.formatOnSave": true
      }
    }
  },

  // Port forwarding for dev servers
  "forwardPorts": [3000],

  // Commands
  "postCreateCommand": "echo 'Ready to code!'",

  // Run as non-root user
  "remoteUser": "vscode"
}
```

## Language-Specific Templates

### Node.js

```json
{
  "name": "Node.js",
  "image": "mcr.microsoft.com/devcontainers/javascript-node:20",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "dbaeumer.vscode-eslint",
        "esbenp.prettier-vscode"
      ]
    }
  },

  "forwardPorts": [3000],
  "postCreateCommand": "npm install",
  "remoteUser": "node"
}
```

### Python

```json
{
  "name": "Python",
  "image": "mcr.microsoft.com/devcontainers/python:3.11",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "ms-python.python",
        "ms-python.vscode-pylance"
      ],
      "settings": {
        "python.defaultInterpreterPath": "/usr/local/bin/python"
      }
    }
  },

  "postCreateCommand": "pip install -r requirements.txt",
  "remoteUser": "vscode"
}
```

### Go

```json
{
  "name": "Go",
  "image": "mcr.microsoft.com/devcontainers/go:1.21",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "golang.go"
      ]
    }
  },

  "postCreateCommand": "go mod download",
  "remoteUser": "vscode"
}
```

### Rust

```json
{
  "name": "Rust",
  "image": "mcr.microsoft.com/devcontainers/rust:1",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "rust-lang.rust-analyzer"
      ]
    }
  },

  "remoteUser": "vscode"
}
```

### TypeScript (Deno)

```json
{
  "name": "Deno",
  "image": "mcr.microsoft.com/devcontainers/base:ubuntu",

  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/anthropics/devcontainer-features/deno:1": {}
  },

  "customizations": {
    "vscode": {
      "extensions": [
        "denoland.vscode-deno"
      ],
      "settings": {
        "deno.enable": true
      }
    }
  },

  "remoteUser": "vscode"
}
```

## Common Patterns

### Environment Variables

```json
{
  // Set during container creation (available in Dockerfile)
  "containerEnv": {
    "NODE_ENV": "development"
  },

  // Set at runtime (available in shell)
  "remoteEnv": {
    "API_URL": "${localEnv:API_URL}",
    "DEBUG": "true"
  }
}
```

### Port Forwarding

```json
{
  "forwardPorts": [3000, 5432],
  "portsAttributes": {
    "3000": {
      "label": "Frontend",
      "onAutoForward": "notify"
    },
    "5432": {
      "label": "Database",
      "onAutoForward": "silent"
    }
  }
}
```

### Mounting Local Files

```json
{
  "mounts": [
    "source=${localEnv:HOME}/.aws,target=/home/vscode/.aws,type=bind,readonly"
  ]
}
```

### GitHub Codespaces Secrets

Secrets are available as environment variables. Reference them:

```json
{
  "remoteEnv": {
    "DATABASE_URL": "${localEnv:DATABASE_URL}"
  }
}
```

Set secrets in GitHub: Settings → Codespaces → Secrets

## When to Graduate to Dockerfile

Move to a Dockerfile-based setup when:
- You need system packages not available as features
- postCreateCommand is slow and could be cached
- You need specific versions of tools
- You want smaller image size
- You need multi-stage builds

See `devcontainer-dockerfile.md` template.
