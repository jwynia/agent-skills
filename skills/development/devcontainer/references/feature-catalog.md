# Devcontainer Features Catalog

Features are pre-packaged tools and runtimes that can be added to any devcontainer.
They install on top of any base image, making configuration modular and reusable.

**Official Features Repository:** https://github.com/devcontainers/features

## How to Use Features

```json
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/git:1": {}
  }
}
```

## Core Development Tools

### Git

Essential for most development workflows.

```json
"ghcr.io/devcontainers/features/git:1": {}
```

Options:
- `version`: Git version (default: "latest")
- `ppa`: Use PPA for latest version (default: true)

### GitHub CLI

For GitHub operations from the command line.

```json
"ghcr.io/devcontainers/features/github-cli:1": {}
```

Options:
- `version`: CLI version (default: "latest")

### Docker-in-Docker

Run Docker commands inside the devcontainer (for container development).

```json
"ghcr.io/devcontainers/features/docker-in-docker:2": {
  "version": "latest",
  "moby": true
}
```

Options:
- `version`: Docker version
- `moby`: Use Moby (open source Docker, default: true)
- `dockerDashComposeVersion`: Compose version

**Note:** May not work in all Codespaces configurations. Test thoroughly.

### Docker-outside-of-Docker

Use host's Docker daemon (lighter than docker-in-docker).

```json
"ghcr.io/devcontainers/features/docker-outside-of-docker:1": {}
```

## Languages & Runtimes

### Node.js

```json
"ghcr.io/devcontainers/features/node:1": {
  "version": "20",
  "nodeGypDependencies": true
}
```

Options:
- `version`: Node version ("lts", "20", "18", etc.)
- `nodeGypDependencies`: Install build tools for native modules
- `nvmVersion`: NVM version to install

### Python

```json
"ghcr.io/devcontainers/features/python:1": {
  "version": "3.11"
}
```

Options:
- `version`: Python version
- `installTools`: Install pip, pipx, etc. (default: true)
- `optimize`: Optimize Python installation (default: false)

### Go

```json
"ghcr.io/devcontainers/features/go:1": {
  "version": "1.21"
}
```

Options:
- `version`: Go version

### Rust

```json
"ghcr.io/devcontainers/features/rust:1": {
  "version": "latest",
  "profile": "default"
}
```

Options:
- `version`: Rust version
- `profile`: Rustup profile (minimal, default, complete)

### Java

```json
"ghcr.io/devcontainers/features/java:1": {
  "version": "17",
  "installMaven": true,
  "installGradle": true
}
```

Options:
- `version`: Java version
- `installMaven`: Install Maven
- `installGradle`: Install Gradle
- `jdkDistro`: JDK distribution (ms, default)

### .NET

```json
"ghcr.io/devcontainers/features/dotnet:2": {
  "version": "8.0"
}
```

Options:
- `version`: .NET version
- `aspnetcore`: Install ASP.NET Core runtime

### PHP

```json
"ghcr.io/devcontainers/features/php:1": {
  "version": "8.2",
  "installComposer": true
}
```

Options:
- `version`: PHP version
- `installComposer`: Install Composer

### Ruby

```json
"ghcr.io/devcontainers/features/ruby:1": {
  "version": "3.2"
}
```

Options:
- `version`: Ruby version

## Shell & Terminal

### Oh My Zsh

```json
"ghcr.io/devcontainers/features/omz:1": {
  "plugins": "git docker kubectl"
}
```

Options:
- `plugins`: Space-separated plugin list
- `theme`: Theme name (default: "robbyrussell")

### Fish Shell

```json
"ghcr.io/devcontainers/features/fish:1": {}
```

### Starship Prompt

```json
"ghcr.io/devcontainers/features/starship:1": {}
```

## Cloud & Infrastructure

### AWS CLI

```json
"ghcr.io/devcontainers/features/aws-cli:1": {}
```

### Azure CLI

```json
"ghcr.io/devcontainers/features/azure-cli:1": {}
```

### Google Cloud CLI

```json
"ghcr.io/devcontainers/features/gcloud:1": {}
```

### Terraform

```json
"ghcr.io/devcontainers/features/terraform:1": {
  "version": "latest",
  "tflint": "latest"
}
```

Options:
- `version`: Terraform version
- `tflint`: TFLint version
- `terragrunt`: Terragrunt version

### Kubectl & Helm

```json
"ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {
  "version": "latest",
  "helm": "latest",
  "minikube": "latest"
}
```

## Databases & Data Tools

### PostgreSQL Client

```json
"ghcr.io/devcontainers/features/postgresql-client:1": {}
```

### MySQL Client

```json
"ghcr.io/devcontainers/features/mysql-client:1": {}
```

### Redis Client (redis-cli)

```json
"ghcr.io/devcontainers/features/redis-cli:1": {}
```

### MongoDB Shell

```json
"ghcr.io/devcontainers/features/mongodb-community:1": {}
```

## Utilities

### jq (JSON processor)

```json
"ghcr.io/devcontainers/features/jq:1": {}
```

### yq (YAML processor)

```json
"ghcr.io/devcontainers/features/yq:1": {}
```

### HTTPie (HTTP client)

```json
"ghcr.io/devcontainers/features/httpie:1": {}
```

### Deno

```json
"ghcr.io/anthropics/devcontainer-features/deno:1": {}
```

## Community Features

Beyond official features, many community features exist:

### Bun

```json
"ghcr.io/shyim/devcontainers-features/bun:1": {}
```

### pnpm

```json
"ghcr.io/devcontainers-contrib/features/pnpm:2": {}
```

### Yarn

```json
"ghcr.io/devcontainers/features/yarn:1": {}
```

### Biome (linter/formatter)

```json
"ghcr.io/biomejs/devcontainer-features/biome:1": {}
```

## Feature Configuration Patterns

### Version Pinning

```json
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20.10.0"
    }
  }
}
```

### Multiple Language Versions

```json
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": {
      "version": "20"
    },
    "ghcr.io/devcontainers/features/python:1": {
      "version": "3.11"
    }
  }
}
```

### Override Install Order

```json
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": {},
    "ghcr.io/devcontainers/features/python:1": {}
  },
  "overrideFeatureInstallOrder": [
    "ghcr.io/devcontainers/features/python",
    "ghcr.io/devcontainers/features/node"
  ]
}
```

## Common Feature Combinations

### Full Stack JavaScript

```json
{
  "features": {
    "ghcr.io/devcontainers/features/node:1": { "version": "20" },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {}
  }
}
```

### Python Data Science

```json
{
  "features": {
    "ghcr.io/devcontainers/features/python:1": { "version": "3.11" },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/github-cli:1": {},
    "ghcr.io/devcontainers/features/postgresql-client:1": {}
  }
}
```

### DevOps/Platform Engineering

```json
{
  "features": {
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/kubectl-helm-minikube:1": {},
    "ghcr.io/devcontainers/features/terraform:1": {},
    "ghcr.io/devcontainers/features/aws-cli:1": {}
  }
}
```

### Go Microservices

```json
{
  "features": {
    "ghcr.io/devcontainers/features/go:1": { "version": "1.21" },
    "ghcr.io/devcontainers/features/git:1": {},
    "ghcr.io/devcontainers/features/docker-in-docker:2": {},
    "ghcr.io/devcontainers/features/postgresql-client:1": {}
  }
}
```

## Troubleshooting Features

### Feature Not Installing

1. Check feature name spelling (case-sensitive)
2. Check version exists
3. Review devcontainer creation logs
4. Try rebuilding without cache

### Feature Conflicts

Some features may conflict:
- Multiple versions of same language
- Docker-in-Docker vs Docker-outside-of-Docker
- Different shell configurations

Use `overrideFeatureInstallOrder` to control order.

### Slow Feature Installation

Features install sequentially. For faster startup:
1. Move stable tools to Dockerfile
2. Use prebuilds for team repositories
3. Only include actually needed features

### Finding Feature Options

1. Check official docs: https://containers.dev/features
2. Check feature's GitHub repo README
3. Look at `devcontainer-feature.json` in feature source
