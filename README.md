# synflow (monorepo)

Monorepo scaffold with a React + TypeScript frontend and a Node + TypeScript server.

Quick start (recommended: pnpm):

```bash
# install pnpm if you don't have it
npm install -g pnpm

# install dependencies (root workspace)
pnpm install

# run server (in one terminal)
pnpm --filter @synflow/server dev

# run app (in another terminal)
pnpm --filter @synflow/app dev

# Or run both (root `dev` uses concurrently)
pnpm dev
```

Packages:
- `packages/app` — Vite + React + TypeScript
- `packages/server` — Node (Express) + TypeScript
