# Synflo — Claude Code Instructions

## Project Overview

Synflo is a full-stack monorepo using a React + Vite frontend and an Express backend, managed with pnpm workspaces.

**Package manager:** pnpm (always use pnpm, never npm or yarn)
**Monorepo tool:** pnpm workspaces
**Language:** TypeScript (strict mode) across all packages

---

## Directory Structure

```
synflow/
├── .claude/
│   ├── agents/          # Sub-agent prompt files (*.md)
│   └── commands/        # Custom slash commands (*.md)
├── .github/
│   └── workflows/       # GitHub Actions CI/CD
├── packages/
│   ├── app/             # React + Vite frontend (port 3000)
│   └── server/          # Express backend
├── CLAUDE.md            # This file
├── package.json         # Root workspace config
├── pnpm-workspace.yaml
└── tsconfig.json        # Root TypeScript config (path aliases: @synflow/*)
```

---

## Development Commands

| Task | Command |
|---|---|
| Install dependencies | `pnpm bootstrap` |
| Run full stack (dev) | `pnpm dev` |
| Run frontend only | `pnpm dev:app` |
| Run backend only | `pnpm dev:server` |
| Build all packages | `pnpm build` |
| Start server (prod) | `pnpm start:server` |
| Run all tests | `pnpm test` |
| Run app tests only | `pnpm --filter @synflow/app test` |
| Run server tests only | `pnpm --filter @synflow/server test` |
| Lint | `pnpm eslint . --max-warnings=0` |

Always run commands from the workspace root unless working in an isolated package.

---

## Tech Stack

### Frontend — `packages/app`
- React 18 with TypeScript
- Vite 5 (dev server: `localhost:3000`)
- Entry: `packages/app/src/main.tsx`
- Main component: `packages/app/src/App.tsx`

### Backend — `packages/server`
- Express 4 with TypeScript
- ts-node-dev for hot reload in development
- App setup: `packages/server/src/app.ts` (exported for testing)
- Entry: `packages/server/src/index.ts` (imports app, calls listen)
- Output: `packages/server/dist/`
- CORS enabled
- Tests: `supertest` for API integration tests

### Shared
- Path alias `@synflow/*` resolves to `packages/*` (configured in root `tsconfig.json`)
- TypeScript strict mode enforced across all packages

---

## CI/CD

- GitHub Actions runs ESLint on every PR targeting `master`
- Workflow: `.github/workflows/eslint.yml`
- Zero ESLint warnings allowed (`--max-warnings=0`)
- Node.js 24, pnpm v8, with dependency caching

All PRs must pass the ESLint check before merging.

---

## Code Conventions

- **TypeScript:** Strict mode — no `any`, explicit return types on exported functions
- **Imports:** Use `@synflow/*` path aliases for cross-package imports
- **Formatting:** Consistent with ESLint rules; run lint before committing
- **File naming:** `camelCase` for utilities, `PascalCase` for React components
- **No unused variables or imports** — ESLint will catch them
- Keep components small and focused; extract logic into hooks or utilities when a component grows beyond ~100 lines

---

## Agent Directory — `.claude/agents/`

Sub-agents are stored as Markdown files in `.claude/agents/`. Each file defines a specialized agent that Claude Code can invoke automatically or on request.

**Agent file format:**
```markdown
---
name: agent-name
description: When this agent should be used (used by Claude for routing)
tools: Read, Edit, Bash, Glob, Grep   # comma-separated tool list
---

[System prompt / instructions for this agent]
```

**Current agents:**

| File | Purpose |
|---|---|
| `migration.md` | Create, run, and manage database migration SQL files |

**How to add an agent:**
1. Create `.claude/agents/<name>.md`
2. Add the YAML front matter (`name`, `description`, `tools`)
3. Write the agent's instructions in the body
4. Claude Code will route tasks to it automatically based on its `description`

---

## Skill / Command Directory — `.claude/commands/`

Custom slash commands are stored as Markdown files in `.claude/commands/`. They appear in Claude Code as `/project:<command-name>` and can be invoked by the user.

**Command file format:**
```markdown
# Command Title

[Description of what this command does]

$ARGUMENTS  <!-- optional: passes user-provided args into the prompt -->

[Detailed instructions Claude should follow when this command is run]
```

**Current commands:**

| File | Slash Command | Purpose |
|---|---|---|
| *(none yet — add commands here as the project grows)* | | |

**How to add a command:**
1. Create `.claude/commands/<name>.md`
2. Write the prompt/instructions Claude should follow
3. Use `$ARGUMENTS` as a placeholder if the command accepts arguments
4. Invoke it in Claude Code with `/project:<name>`

---

## PR Workflow

1. Branch off `master` using `joseph/<feature>` naming convention
2. Make changes, ensure lint passes locally
3. Push branch and open PR targeting `master`
4. GitHub Actions ESLint check must pass before merge

---

## Testing

- **Framework:** Jest 29 with ts-jest for TypeScript transformation
- **Frontend:** `jest-environment-jsdom` + `@testing-library/react` + `@testing-library/jest-dom`
- **Backend:** `supertest` for HTTP integration tests; Express app is exported from `app.ts` separate from `index.ts` to allow import without starting the server
- **Test files:** place in `src/__tests__/` as `*.test.ts` / `*.test.tsx`
- **Jest configs:** per-package (`packages/app/jest.config.js`, `packages/server/jest.config.js`)

---

## Notes

- The `act` dependency in root `package.json` is for running GitHub Actions locally
