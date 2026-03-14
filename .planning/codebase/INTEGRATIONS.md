# External Integrations

**Analysis Date:** 2026-03-14

## CI/CD & Code Quality

**GitHub Actions:**
- Purpose: Primary CI/CD pipeline — lint, test, SonarCloud scan, build
- Config: `.github/workflows/ci.yml`
- Triggers: push or PR to `main`
- Permissions required: `contents: read`, `issues: write`, `pull-requests: read`

**SonarCloud:**
- Purpose: Static code analysis, coverage tracking, quality gates
- SDK/Action: `SonarSource/sonarcloud-github-action@master`
- Config: `sonar-project.properties`
- Auth: `SONAR_TOKEN` (GitHub Actions secret), `GITHUB_TOKEN` (auto-provided)
- Requires full git history: `fetch-depth: 0` in checkout step
- Coverage input: `coverage/lcov.info` (LCOV format from test runner)
- Sources analyzed: `src/`
- Exclusions: `node_modules/**`, `coverage/**`, `_bmad/**`, `_bmad-output/**`, `.next/**`, `dist/**`, `build/**`

**GitHub Issues API (via `gh` CLI):**
- Purpose: Auto-creates bug issues on CI failure with last 50 lines of failing step logs
- Auth: `GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}` (auto-provided)
- Issue label applied: `bug`
- Triggered by: `if: failure()` step in `ci.yml`
- Consumed by: `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md` AI workflow

## AI Agent Platforms

**BMAD Method v6:**
- Purpose: Structured AI agent workflow framework (PM, Architect, Dev, QA, Scrum Master roles)
- Install: `npx bmad-method install` (run via `setup.sh`)
- Output directory: `_bmad/` (created at install time, gitignored via `_bmad-output/`)
- Modules recommended: `bmm` (dev workflow), `tea` (testing)
- Entry: `/bmad-help` in AI editor

**Claude Code (`claude`):**
- Purpose: AI coding agent; GSD command system and custom agents hosted here
- Commands: `.claude/commands/gsd/` (30+ `.md` workflow files)
- Agents: `.claude/agents/` (12 named sub-agents)
- GSD engine: `.claude/get-shit-done/` — bin tools, workflows, templates, references
- Package type: `commonjs` (`.claude/package.json`)

**Gemini CLI (`gemini`):**
- Purpose: Equivalent GSD system for Google Gemini AI editor
- Commands: `.gemini/commands/gsd/`
- Agents: `.gemini/agents/`
- GSD engine: `.gemini/get-shit-done/`
- Package type: `commonjs` (`.gemini/package.json`)

**OpenCode (`opencode`):**
- Purpose: Equivalent GSD system for OpenCode AI editor
- Commands: `.opencode/command/`
- Agents: `.opencode/agents/`
- GSD engine: `.opencode/get-shit-done/`
- Package type: `commonjs` (`.opencode/package.json`)

## Data Storage

**Databases (planned — not yet implemented):**
- Local dev default: SQLite — `DATABASE_URL=file:./dev.db` (from `.env.example`)
- Production default: PostgreSQL — `DATABASE_URL=postgresql://...` (from research expanded `.env.example`)
- ORM choice (to be selected at setup): Prisma v7 or Drizzle ORM v0.38+
- Prisma artifacts: `prisma/` directory gitignored for `*.db`, `*.db-journal`, `prisma/migrations/**/migration_lock.toml`

**File Storage:**
- Not configured — local filesystem only at this stage

**Caching (planned):**
- Upstash Redis (serverless HTTP-based Redis)
- Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Client stub planned: `src/lib/redis.ts`

## Authentication & Identity

**Auth Provider (planned — not yet implemented):**
- Option A: Better Auth v1 (open-source, self-hosted TypeScript-native)
  - Env vars: `AUTH_SECRET`, OAuth provider credentials
- Option B: Clerk v6 (hosted, drop-in React components)
  - Env vars: `CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`
- Current stub in `.env.example`: `AUTH_SECRET`, `OAUTH_CLIENT_ID`, `OAUTH_CLIENT_SECRET`, `OAUTH_REDIRECT_URI`

## Payments

**Stripe (planned — not yet implemented):**
- Purpose: Subscriptions, one-time payments, invoicing, customer portal
- Packages: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`
- Env vars: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`
- Webhook handler planned: `app/api/webhook/stripe/route.ts`

## Email

**Resend + React Email (planned — not yet implemented):**
- Purpose: Transactional email (welcome, password reset, invoices, notifications)
- Packages: `resend` v4, `@react-email/components`, `react-email` v5
- Env var: `RESEND_API_KEY`
- Client stub planned: `src/lib/email.ts`
- Email templates planned: `emails/welcome.tsx`

## Monitoring & Observability

**Error Tracking (planned):**
- Sentry (`@sentry/nextjs` v10)
- Env vars: `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`
- Config stubs planned: `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`

**Structured Logging (planned):**
- Pino.js v9 + pino-pretty
- Logger wrapper planned: `src/lib/logger.ts`

**Distributed Tracing (optional/nice-to-have):**
- OpenTelemetry via `@vercel/otel`
- Instrumentation hook planned: `instrumentation.ts`

## Rate Limiting

**Upstash Rate Limit (planned):**
- Package: `@upstash/ratelimit` v2 + `@upstash/redis`
- Env vars: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Stub planned: `src/lib/rate-limit.ts`

## Background Jobs

**Inngest v3 (optional/nice-to-have):**
- Purpose: Serverless durable functions, scheduled jobs, retries
- Env vars: `INNGEST_EVENT_KEY`, `INNGEST_SIGNING_KEY`
- Stubs planned: `src/inngest/client.ts`, `app/api/inngest/route.ts`

**Trigger.dev v3 (alternative to Inngest):**
- Purpose: Long-running tasks on dedicated infrastructure

## Deployment

**Vercel:**
- Primary deployment target
- `.vercel` directory gitignored
- `vercel.json` planned (security headers, rewrites)

**Docker (planned):**
- `Dockerfile` (multi-stage, Next.js standalone, Alpine base) planned
- `docker-compose.yml` for local dev (app + postgres + redis) planned

## Security Scanning

**GitHub CodeQL (planned):**
- Workflow: `.github/workflows/codeql.yml` (not yet created, in research roadmap)
- Language: `javascript-typescript`
- Purpose: Semantic vulnerability scanning (SQLi, XSS, path traversal)

**GitHub Dependabot (planned):**
- Config: `.github/dependabot.yml` (not yet created, in research roadmap)
- Package ecosystem: `npm`
- Schedule: weekly, grouped minor+patch

**npm audit (planned):**
- CI step to be added to `ci.yml`: `npm audit --audit-level=high`

## Secrets Location

**GitHub Actions Secrets (required):**
- `SONAR_TOKEN` — from sonarcloud.io → My Account → Security
- `GITHUB_TOKEN` — auto-provided by GitHub Actions (no setup needed)

**Local Development:**
- `.env` file at repo root (gitignored)
- Template: `.env.example` (committed)

## Webhooks & Callbacks

**Incoming (planned):**
- `app/api/webhook/stripe/route.ts` — Stripe payment events

**Outgoing:**
- None currently configured

---

*Integration audit: 2026-03-14*
