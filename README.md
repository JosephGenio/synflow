# synflow (monorepo)

Monorepo scaffold with a React + TypeScript frontend and a Node + TypeScript server.

## Quick Start with Docker (Recommended)

```bash
# install pnpm if you don't have it
npm install -g pnpm

# install dependencies
pnpm install

# Start development environment (Docker)
# This starts the backend + MSSQL database
pnpm docker:up

# In another terminal, run the frontend
pnpm dev:app

# Open browser: http://localhost:3000
```

## Environment Configuration

Environment variables are stored in the `/env/` directory:

- `env/.env.example` — Template for all environments (committed to git)
- `env/.env.development` — Local development (git-ignored)
- `env/.env.staging` — Staging environment (git-ignored)
- `env/.env.production` — Production environment (git-ignored)

Copy `env/.env.example` to create your environment files.

## Development Commands

See [CLAUDE.md](./CLAUDE.md) for complete list of development commands.

### Docker Commands

| Task | Command |
|---|---|
| Start dev environment | `pnpm docker:up` |
| Stop dev environment | `pnpm docker:down` |
| View backend logs | `pnpm docker:logs` |
| Build Docker images | `pnpm docker:build` |

### Traditional Development (without Docker)

```bash
# install dependencies
pnpm install

# run server (in one terminal)
pnpm --filter @synflow/server dev

# run app (in another terminal)
pnpm --filter @synflow/app dev

# Or run both
pnpm dev
```

## Project Structure

- `packages/app` — Vite + React + TypeScript (frontend)
- `packages/server` — Node (Express) + TypeScript (backend)
- `env/` — Environment configuration files
- `scripts/` — Utility scripts for Docker and deployment
- `nginx/` — Nginx configuration for production

## Packages

- `packages/app` — Vite + React + TypeScript
- `packages/server` — Node (Express) + TypeScript
