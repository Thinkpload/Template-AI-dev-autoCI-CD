# Technology Stack

**Analysis Date:** 2026-03-14

## Languages

**Primary:**
- TypeScript - Intended primary language for all application code (strict mode planned, referenced throughout research and config stubs)
- JavaScript (CJS) - Used for GSD tooling internals (`gsd-tools.cjs` and `lib/*.cjs` in `.claude/get-shit-done/bin/`)

**Secondary:**
- Bash - `setup.sh` post-clone setup script
- YAML - GitHub Actions workflow config (`.github/workflows/ci.yml`)
- Markdown - Agent workflow definitions (`.md` files in `_agents/workflows/`, `.claude/agents/`, `.claude/commands/gsd/`)

## Runtime

**Environment:**
- Node.js >= 20 (required; enforced in `setup.sh` comment and `ci.yml` `node-version: "20"`)

**Package Manager:**
- npm (`npm ci` used in CI, `npm install` referenced in README)
- Lockfile: Not yet present (template has no `package.json` at root — added after `npx bmad-method install` + project scaffolding)

## Frameworks

**Core:**
- Next.js (App Router) - Planned primary framework; referenced throughout `research/RESEARCH-template-technologies.md`, `.gitignore` excludes `.next/` and `next-env.d.ts`; `sonar-project.properties` excludes `.next/**`
- React - Paired with Next.js

**Testing (planned/recommended):**
- Vitest v4 - Unit/integration test runner; referenced in research as "Must" priority; `sonar-project.properties` already configured for `coverage/lcov.info` (Vitest/Jest output)
- Playwright v1.57+ - E2E testing; "Must" priority in research
- Jest coverage format - `sonar-project.properties` references `**/*.test.ts`, `**/*.spec.ts`, `**/*.test.tsx`, `**/*.spec.tsx`

**Build/Dev:**
- npm scripts: `lint`, `test:coverage`, `build` — expected by `ci.yml`
- SonarCloud GitHub Action (`SonarSource/sonarcloud-github-action@master`) - Static analysis in CI
- GitHub Actions - CI/CD runner (`ubuntu-latest`)

## Key Dependencies

**Currently installed (devDependencies via GSD tooling only):**
- GSD tools (`gsd-tools.cjs`) - Internal CLI utilities for GSD workflows; located at `.claude/get-shit-done/bin/gsd-tools.cjs`

**Planned/recommended (from `research/RESEARCH-template-technologies.md`):**

Must-Have:
- `husky` v9 - Git hooks manager
- `lint-staged` v15 - Staged-file linter for pre-commit hooks
- `@commitlint/cli` + `@commitlint/config-conventional` v19 - Conventional commit enforcement
- `prettier` v3 + `eslint-config-prettier` - Code formatting
- `eslint` v9+ (flat config) + `@eslint/js` + `typescript-eslint` - Linting
- `vitest` v4 + `@vitejs/plugin-react` + `@testing-library/react` - Testing
- `@t3-oss/env-nextjs` v0.13 + `zod` - Type-safe env var validation
- `zod` v3 + `react-hook-form` + `@hookform/resolvers` - Validation and forms
- TypeScript (strict mode via `tsconfig.json`)

Should-Have:
- `prisma` v7 / `drizzle-orm` v0.38+ - ORM
- `better-auth` v1 / `@clerk/nextjs` v6 - Authentication
- `@sentry/nextjs` v10 - Error monitoring
- `pino` v9 + `pino-pretty` - Structured logging
- `resend` v4 + `@react-email/components` + `react-email` v5 - Transactional email
- `stripe` + `@stripe/stripe-js` + `@stripe/react-stripe-js` - Payments
- `@upstash/ratelimit` v2 + `@upstash/redis` - Rate limiting and caching

## Configuration

**Environment:**
- Template file: `.env.example` at repo root
- Required vars (from `.env.example`):
  - `NODE_ENV`
  - `NEXT_PUBLIC_APP_URL`
  - `DATABASE_URL`
- Commented optional vars: `AUTH_SECRET`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`, `API_KEY`
- `.env` is gitignored; `.env.example` is committed

**Build:**
- `sonar-project.properties` - SonarCloud project config at repo root
- `.github/workflows/ci.yml` - Full CI pipeline definition
- CI runs: `npm run lint`, `npm run test:coverage`, `npm run build` (in that order)
- Coverage output expected at: `coverage/lcov.info`
- Build artifacts excluded from analysis: `node_modules/**`, `coverage/**`, `_bmad/**`, `_bmad-output/**`, `.next/**`, `dist/**`, `build/**`

**AI Tooling:**
- `.claude/` - Claude Code agent definitions, GSD commands, GSD workflow engine
- `.gemini/` - Gemini CLI equivalents of the same GSD system
- `.opencode/` - OpenCode equivalents of the same GSD system
- All three have identical `package.json` with `{"type":"commonjs"}` to enable `.cjs` imports

## Platform Requirements

**Development:**
- Node.js >= 20
- npm
- bash (for `setup.sh`)
- Git

**Production:**
- Deployment target: Vercel (primary, `.vercel` gitignored); Docker/self-hosted also planned (Dockerfile + docker-compose in research roadmap)
- CI runner: `ubuntu-latest` (GitHub Actions)

---

*Stack analysis: 2026-03-14*
