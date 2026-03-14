# SaaS Template Technology Research

> Compiled: 2026-03-14
> Based on analysis of: [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate), [mickasmt/next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter), [nextjs/saas-starter](https://github.com/nextjs/saas-starter), [create-t3-app](https://github.com/t3-oss/create-t3-app), [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit)

## Already in Template
- BMAD Method v6 (AI agent workflows)
- GitHub Actions CI/CD (`ci.yml`: lint -> test -> SonarCloud -> build)
- SonarCloud static analysis (`sonar-project.properties`)
- Auto-bugfix workflow (CI failure -> GitHub Issue -> AI fix)
- `.env.example` with basic vars
- `setup.sh` (SonarCloud config + BMAD install)

---

## Master Table

| # | Category | Tool | What It Does | Why Needed in SaaS Template | Install / Config | Pre-install or Setup.sh | Priority |
|---|----------|------|-------------|---------------------------|-----------------|------------------------|----------|
| **1** | **Git Hooks** | **Husky v9** | Manages Git hooks (pre-commit, commit-msg, pre-push) so checks run before code reaches CI. | Catches lint/format/type errors locally — saves CI minutes and prevents broken commits from ever being pushed. | `npm i -D husky && npx husky init` — creates `.husky/` dir with a `pre-commit` hook. | **Pre-install** — `.husky/` dir + hook scripts ship in the template. | **Must** |
| **2** | **Git Hooks** | **lint-staged v15** | Runs linters/formatters only on staged files, not the whole codebase. | Makes pre-commit hooks fast (sub-second on typical diffs) so devs don't skip them. | `npm i -D lint-staged` — config in `package.json`: `"lint-staged": { "*.{ts,tsx}": ["eslint --fix", "prettier --write"] }` | **Pre-install** — config ships in `package.json`. | **Must** |
| **3** | **Git Hooks** | **commitlint v19 + @commitlint/config-conventional** | Enforces Conventional Commits format (`feat:`, `fix:`, `chore:`, etc.) on commit messages. | Enables automated changelogs, semantic versioning, and readable git history — critical for team projects. | `npm i -D @commitlint/{cli,config-conventional}` — `commitlint.config.ts`: `export default { extends: ['@commitlint/config-conventional'] }`. Hook: `.husky/commit-msg` runs `npx commitlint --edit $1`. | **Pre-install** — config file + husky hook ship in template. | **Must** |
| **4** | **Security** | **GitHub CodeQL** | GitHub's semantic code analysis engine — finds security vulnerabilities (SQLi, XSS, path traversal) in PRs. | Free for public repos, catches real vulnerabilities that linters miss. Complements SonarCloud (which focuses on code smells/bugs). | `.github/workflows/codeql.yml` — uses `github/codeql-action/init@v3` and `github/codeql-action/analyze@v3` with `language: javascript-typescript`. | **Pre-install** — workflow YAML ships in template. | **Must** |
| **5** | **Security** | **Dependabot** | Automatically opens PRs to update vulnerable or outdated dependencies. | SaaS apps have 50-200+ deps; manual tracking is impossible. Dependabot is free and built into GitHub. | `.github/dependabot.yml`: `version: 2, updates: [{ package-ecosystem: "npm", directory: "/", schedule: { interval: "weekly" }, groups: { minor-and-patch: { update-types: ["minor","patch"] } } }]` | **Pre-install** — YAML config ships in template. | **Must** |
| **6** | **Security** | **GitHub Secret Scanning + Push Protection** | Detects leaked API keys, tokens, and credentials in commits and blocks pushes containing secrets. | Prevents catastrophic secret leaks. Free on public repos, $19/committer/month on private (GitHub Team+). | Enable in repo Settings > Code security > Secret scanning. No config file needed — it's a repo-level toggle. Document in setup.sh as a manual step. | **Setup.sh** (reminder only — toggled in GitHub UI). | **Must** |
| **7** | **Security** | **npm audit (in CI)** | Checks installed packages for known vulnerabilities during CI runs. | Defense-in-depth: catches vulns that Dependabot hasn't PRed yet, and blocks builds with critical issues. | Add step to `ci.yml`: `- name: Security audit` / `run: npm audit --audit-level=high` (after `npm ci`). | **Pre-install** — add to existing `ci.yml`. | **Should** |
| **8** | **Formatting & Linting** | **Prettier v3** | Opinionated code formatter — enforces consistent style (semicolons, quotes, trailing commas, line width). | Eliminates style debates in PRs. Every major SaaS template includes it. | `npm i -D prettier eslint-config-prettier` — `.prettierrc`: `{ "semi": true, "singleQuote": true, "trailingComma": "all", "tabWidth": 2, "printWidth": 100 }` + `.prettierignore`. | **Pre-install** — config files ship in template. | **Must** |
| **9** | **Formatting & Linting** | **EditorConfig** | Cross-editor formatting standard (indent style, charset, trailing whitespace, final newline). | Works even without Prettier (e.g., editing Markdown, YAML). Respected by VS Code, JetBrains, vim, etc. | `.editorconfig` file at repo root — no npm package needed. | **Pre-install** — file ships in template. | **Must** |
| **10** | **Formatting & Linting** | **ESLint v9+ flat config** | Lints TypeScript/React code for bugs, best practices, and accessibility. ESLint 9 uses `eslint.config.mjs` (flat config); ESLint 10 (Feb 2026) removed `.eslintrc` entirely. | Core quality gate. Flat config is now mandatory — templates must ship the new format. | `npm i -D eslint @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-config-next eslint-config-prettier` — `eslint.config.mjs` with `defineConfig()`. | **Pre-install** — `eslint.config.mjs` ships in template. | **Must** |
| **11** | **Testing** | **Vitest v4** | Unit/integration test runner built on Vite — native ESM, TypeScript, and JSX support without config. | 5-10x faster than Jest for Next.js projects. Stable browser mode in v4. Used by ixartz boilerplate, Nuxt, SvelteKit. | `npm i -D vitest @vitejs/plugin-react @testing-library/react @testing-library/jest-dom` — `vitest.config.ts`: `{ test: { environment: 'jsdom', coverage: { provider: 'v8', thresholds: { statements: 80, branches: 80 } } } }` | **Pre-install** — config + example test ship in template. | **Must** |
| **12** | **Testing** | **Playwright v1.57+** | Cross-browser E2E testing — runs real Chromium/Firefox/WebKit browsers, auto-waiting, trace viewer. | SaaS apps need E2E tests for auth flows, payments, onboarding. Playwright is the industry standard over Cypress as of 2025. | `npm i -D @playwright/test && npx playwright install --with-deps chromium` — `playwright.config.ts` with `webServer: { command: 'npm run dev' }`. | **Setup.sh** — browsers are large (~200MB); install on demand, not in template clone. Config file ships pre-installed. | **Must** |
| **13** | **Testing** | **Coverage thresholds in CI** | Fail CI if code coverage drops below configured thresholds. | Prevents coverage erosion over time. Every mature SaaS enforces this. | Already partially configured — `npm run test:coverage` exists in `ci.yml`. Add Vitest config `thresholds: { statements: 80, branches: 70, functions: 80, lines: 80 }` to fail on drop. | **Pre-install** — in `vitest.config.ts`. | **Must** |
| **14** | **Auth** | **Better Auth v1** | Open-source TypeScript-native auth framework — email/password, OAuth, MFA, passkeys, multi-tenancy, RBAC. Auth.js/NextAuth.js now maintained by Better Auth team. | Every SaaS needs auth. Better Auth is the strongest open-source option in 2026 — replaces both NextAuth.js and Lucia (deprecated). Fully self-hosted, no vendor lock-in. | `npm i better-auth` — `auth.ts` config file with providers, database adapter, session config. | **Setup.sh** — auth is opinionated; let devs choose between Better Auth, Clerk, or roll-their-own. Ship a stub/example. | **Should** |
| **15** | **Auth** | **Clerk v6 (alternative)** | Hosted auth platform — drop-in React components, social login, MFA, passkeys, user management dashboard. | Fastest time-to-production (30 min). Free for 10K MAUs. Best for teams that don't want to manage auth infrastructure. | `npm i @clerk/nextjs` — wrap app in `<ClerkProvider>`, add `middleware.ts` with `clerkMiddleware()`. | **Setup.sh** — mutually exclusive with Better Auth. | **Nice-to-have** |
| **16** | **Database & ORM** | **Prisma v7** | Type-safe ORM — schema-first, auto-generated client, migrations, studio GUI. v7 is Rust-free (pure TypeScript), faster. | SaaS needs database access. Prisma has the largest ecosystem, best DX, and broadest database support (Postgres, MySQL, SQLite, MongoDB). | `npm i prisma @prisma/client && npx prisma init` — creates `prisma/schema.prisma`. Add seed script: `prisma/seed.ts`. | **Setup.sh** — database choice is project-specific. Ship a `prisma/schema.prisma` template with User/Account/Session models. | **Should** |
| **17** | **Database & ORM** | **Drizzle ORM v0.38+ (alternative)** | Lightweight TypeScript ORM — SQL-like syntax, zero runtime overhead, faster than Prisma at scale. Used by T3, ixartz boilerplate. | Better performance for high-throughput SaaS. Growing adoption. Good alternative for teams that prefer SQL-like syntax. | `npm i drizzle-orm postgres && npm i -D drizzle-kit` — `drizzle.config.ts` + schema in `src/db/schema.ts`. | **Setup.sh** — mutually exclusive with Prisma. | **Nice-to-have** |
| **18** | **Deployment** | **Docker + docker-compose (local dev)** | Containerized local dev environment — runs Postgres, Redis, app in isolated containers. | Eliminates "works on my machine." New devs run `docker compose up` and have everything running in 60 seconds. | `Dockerfile` (multi-stage: deps -> build -> runner) + `docker-compose.yml` with services: app, postgres, redis. | **Pre-install** — `Dockerfile` + `docker-compose.yml` ship in template. | **Should** |
| **19** | **Deployment** | **Vercel config** | `vercel.json` with build settings, rewrites, headers (security headers, caching). | Most Next.js SaaS projects deploy to Vercel. Pre-configured security headers and caching save hours. | `vercel.json`: `{ "headers": [{ "source": "/(.*)", "headers": [{"key":"X-Frame-Options","value":"DENY"}, {"key":"X-Content-Type-Options","value":"nosniff"}] }] }` | **Pre-install** — `vercel.json` ships in template. | **Should** |
| **20** | **Deployment** | **Production Dockerfile** | Multi-stage Docker build optimized for Next.js standalone output — minimal image size (~100MB). | For teams deploying to AWS/GCP/fly.io instead of Vercel. Next.js standalone mode + Alpine = tiny production image. | Multi-stage `Dockerfile`: `FROM node:20-alpine AS deps` -> `AS builder` (next build) -> `AS runner` (standalone). Follows [Next.js Docker example](https://github.com/vercel/next.js/tree/canary/examples/with-docker). | **Pre-install** — ships in template, used optionally. | **Should** |
| **21** | **Monitoring** | **Sentry SDK v10 (@sentry/nextjs)** | Error tracking, performance monitoring, session replay — catches runtime errors in production with full stack traces. | SaaS without error tracking is flying blind. Sentry is the industry standard with free tier (5K errors/month). | `npx @sentry/wizard@latest -i nextjs` — creates `sentry.client.config.ts`, `sentry.server.config.ts`, `sentry.edge.config.ts`, updates `next.config.mjs`. | **Setup.sh** — requires Sentry DSN (project-specific). Ship config stubs. | **Should** |
| **22** | **Monitoring** | **OpenTelemetry + @vercel/otel** | Distributed tracing and metrics — traces requests across API routes, server components, database queries. Next.js has built-in OTel support since v13.4. | Essential for debugging performance issues in production. Vendor-neutral — send traces to Sentry, Datadog, Grafana, etc. | `npm i @vercel/otel @opentelemetry/sdk-node` — `instrumentation.ts` (Next.js instrumentation hook): `import { registerOTel } from '@vercel/otel'; export function register() { registerOTel({ serviceName: 'my-saas' }) }` | **Setup.sh** — requires collector endpoint. Ship `instrumentation.ts` stub. | **Nice-to-have** |
| **23** | **Monitoring** | **Pino.js v9 (structured logging)** | Fast JSON logger — structured logs with request IDs, user context, timing. | Console.log doesn't scale. Structured logs are searchable, filterable, and ingestible by log aggregators (Better Stack, Datadog). | `npm i pino pino-pretty` — `src/lib/logger.ts` wrapping pino with default config. `pino-pretty` for dev, JSON for prod. | **Pre-install** — ship `src/lib/logger.ts`. | **Should** |
| **24** | **API Docs** | **next-swagger-doc + swagger-ui-react** | Auto-generates OpenAPI/Swagger docs from API route comments/decorators. | SaaS products expose APIs to customers. Auto-generated docs stay in sync with code — no manual maintenance. | `npm i next-swagger-doc swagger-ui-react` — add JSDoc `@swagger` annotations to API routes, serve Swagger UI at `/api-doc`. | **Setup.sh** — only needed if the SaaS exposes a public API. | **Nice-to-have** |
| **25** | **DevContainer** | **.devcontainer config** | VS Code / GitHub Codespaces dev container — pre-configured Node.js, extensions, port forwarding, post-create commands. | New contributors open the repo in Codespaces and have a fully working environment in < 2 minutes. No local setup needed. | `.devcontainer/devcontainer.json`: `{ "image": "mcr.microsoft.com/devcontainers/typescript-node:20", "postCreateCommand": "npm install", "forwardPorts": [3000], "customizations": { "vscode": { "extensions": ["dbaeumer.vscode-eslint","esbenp.prettier-vscode"] } } }` | **Pre-install** — `.devcontainer/` ships in template. | **Should** |
| **26** | **PR & Issue Templates** | **GitHub Issue templates** | Structured issue forms for bug reports, feature requests — collect required info (steps to repro, expected vs actual, screenshots). | Reduces back-and-forth on issues. Ensures bug reports include environment info. Standard in professional repos. | `.github/ISSUE_TEMPLATE/bug_report.yml` + `feature_request.yml` + `config.yml` (for blank issue link). Uses GitHub's YAML form schema. | **Pre-install** — YAML files ship in template. | **Must** |
| **27** | **PR & Issue Templates** | **Pull Request template** | Checklist PR description — type of change, testing done, screenshots, breaking changes. | Ensures PRs include context for reviewers. Reduces review cycles. | `.github/PULL_REQUEST_TEMPLATE.md` with sections: Summary, Type of Change (checkboxes), Testing, Screenshots. | **Pre-install** — file ships in template. | **Must** |
| **28** | **PR & Issue Templates** | **CODEOWNERS** | Maps file paths to responsible reviewers — auto-assigns PR reviewers based on what files changed. | Ensures the right people review the right code. Critical for teams > 2 people. | `.github/CODEOWNERS`: `* @org/core-team` + specific paths like `/prisma/ @org/backend-team`. | **Pre-install** — ship with placeholder team names. | **Should** |
| **29** | **Rate Limiting** | **@upstash/ratelimit v2 + @upstash/redis** | Serverless-native rate limiting backed by Upstash Redis — works on edge/serverless without persistent connections. | SaaS APIs need rate limiting to prevent abuse, ensure fair usage, and protect against DDoS. HTTP-based Redis = no connection pooling issues. | `npm i @upstash/ratelimit @upstash/redis` — `src/lib/rate-limit.ts`: create `Ratelimit` instance with sliding window algorithm. Apply in middleware or API routes. Env: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`. | **Setup.sh** — requires Upstash account. Ship `src/lib/rate-limit.ts` stub. | **Should** |
| **30** | **Rate Limiting** | **Security headers (next.config.mjs)** | HTTP security headers — CSP, X-Frame-Options, HSTS, X-Content-Type-Options, Referrer-Policy, Permissions-Policy. | Prevents XSS, clickjacking, MIME sniffing attacks. Required for SOC2/HIPAA compliance. | Configure in `next.config.mjs` `headers()` function or `vercel.json`. No additional package needed. | **Pre-install** — add `headers()` to `next.config.mjs` template. | **Must** |
| **31** | **Email** | **Resend v4 + React Email v5** | Transactional email API (Resend) + JSX email templates (React Email). Build emails with React components, send via API. | Every SaaS sends emails: welcome, password reset, invoices, notifications. React Email supports dark mode, Tailwind 4, tested across clients. | `npm i resend @react-email/components react-email` — `emails/welcome.tsx` (React component), `src/lib/email.ts` (Resend client). Env: `RESEND_API_KEY`. | **Setup.sh** — requires Resend API key. Ship template email components. | **Should** |
| **32** | **Payments** | **Stripe (stripe + @stripe/stripe-js + @stripe/react-stripe-js)** | Payment processing — subscriptions, one-time payments, invoicing, customer portal. Embedded Checkout keeps users on your domain. | The SaaS business model. 95%+ of SaaS templates include Stripe. Server Actions + Embedded Checkout is the 2026 best practice. | `npm i stripe @stripe/stripe-js @stripe/react-stripe-js` — `src/lib/stripe.ts` (server client), webhook handler at `app/api/webhook/stripe/route.ts`. Env: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. | **Setup.sh** — requires Stripe account. Ship webhook handler + subscription helpers as stubs. | **Should** |
| **33** | **Feature Flags** | **Vercel Flags SDK + env-based fallback** | Framework-native feature flags — works with LaunchDarkly, Statsig, Hypertune adapters, or simple env vars as fallback. | Ship features safely with gradual rollouts, A/B testing, kill switches. The Flags SDK is free and vendor-neutral. | `npm i @vercel/flags` — `flags.ts`: define flags with `flag()` function. For simple projects without a provider, use env-based: `src/lib/feature-flags.ts` reading `NEXT_PUBLIC_FEATURE_*` vars. | **Pre-install** — ship simple env-based `src/lib/feature-flags.ts`. Flags SDK as optional upgrade in docs. | **Nice-to-have** |
| **34** | **Caching** | **@upstash/redis (serverless Redis)** | HTTP-based Redis client for serverless/edge environments — caching, sessions, rate limiting, pub/sub. | SaaS apps need caching for performance (API responses, expensive queries, session data). Upstash works on Vercel Edge without connection pooling. | `npm i @upstash/redis` — `src/lib/redis.ts`: `new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })`. | **Setup.sh** — requires Upstash account. Ship `src/lib/redis.ts` stub. | **Should** |
| **35** | **Background Jobs** | **Inngest v3** | Serverless workflow/job orchestration — durable functions, retries, scheduling, fan-out. Deploys alongside your Next.js app via HTTP (no separate worker infrastructure). | SaaS needs background jobs: send emails, process webhooks, generate reports, sync data. Inngest requires zero infrastructure — functions run in your existing serverless deployment. | `npm i inngest` — `src/inngest/client.ts` + `src/inngest/functions/` dir + `app/api/inngest/route.ts` (serve handler). Free tier: 25K events/month. | **Setup.sh** — requires Inngest account for prod. Ship client stub + example function. | **Nice-to-have** |
| **36** | **Background Jobs** | **Trigger.dev v3 (alternative)** | Open-source background job platform — long-running tasks, scheduled jobs, with dedicated infrastructure that runs your code. | Better for CPU-intensive tasks (video processing, PDF generation) since it runs on dedicated infra rather than serverless. | `npm i @trigger.dev/sdk` — `trigger.config.ts` + tasks in `src/trigger/` dir. Self-hostable. | **Setup.sh** — alternative to Inngest. | **Nice-to-have** |
| **37** | **Docs Site** | **Nextra v4** | Next.js-based documentation framework — MDX content, search (Pagefind), App Router, Turbopack support. | SaaS products need user-facing docs. Nextra deploys alongside your app — same stack, same deployment. | `npm i nextra nextra-theme-docs` — docs in `pages/docs/` or separate `/docs` app. | **Setup.sh** — only if the project needs a docs site. Not all SaaS products do at launch. | **Nice-to-have** |
| **38** | **Component Library** | **shadcn/ui v4 (CLI)** | Copy-paste component library built on Radix UI primitives — fully customizable, accessible, Tailwind-styled. Not a dependency — components live in your codebase. | Used by 5/5 top SaaS templates researched. Saves weeks of UI work. Components are yours to modify (no version lock-in). | `npx shadcn@latest init` — installs Tailwind, creates `components.json`, `src/components/ui/` dir. Then: `npx shadcn@latest add button card dialog` etc. | **Setup.sh** — `shadcn init` is interactive (picks style, colors, etc.). Ship `components.json` pre-configured. | **Must** |
| **39** | **Dependency Updates** | **Renovate (alternative to Dependabot)** | Advanced dependency update bot — regex-based grouping, automerge for patches, dashboard, multi-platform support. | More granular control than Dependabot: group AWS SDK updates, automerge patch bumps, rate-limit PRs. Better for monorepos. | `renovate.json`: `{ "$schema": "https://docs.renovatebot.com/renovate-schema.json", "extends": ["config:recommended", ":automergeMinor"] }` + install Renovate GitHub App. | **Pre-install** — ship `renovate.json` config. Users choose Renovate OR Dependabot (not both). | **Nice-to-have** |
| **40** | **Env Validation** | **@t3-oss/env-nextjs v0.13** | Type-safe environment variable validation using Zod — fails at build time if vars are missing or wrong type. | Prevents runtime crashes from missing env vars. Enforces separation of server/client vars (prevents leaking server secrets to browser). | `npm i @t3-oss/env-nextjs zod` — `src/env.ts`: `createEnv({ server: { DATABASE_URL: z.string().url() }, client: { NEXT_PUBLIC_APP_URL: z.string().url() } })`. | **Pre-install** — ship `src/env.ts` with common SaaS vars. | **Must** |
| **41** | **Forms & Validation** | **Zod v3 + React Hook Form** | Schema validation (Zod) + performant form management (RHF). Zod schemas shared between client forms and server actions. | Every SaaS has forms (signup, settings, billing). Shared validation between client and server prevents inconsistencies and duplicated code. | `npm i zod react-hook-form @hookform/resolvers` — use `zodResolver` in forms, reuse schemas in Server Actions. | **Pre-install** — these are fundamental deps. | **Must** |
| **42** | **Type Safety** | **TypeScript strict mode** | `tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, path aliases (`@/*`). | Maximum type safety catches bugs at compile time. Path aliases eliminate `../../../` imports. | `tsconfig.json` — no extra package, just configuration. | **Pre-install** — ship strict `tsconfig.json`. | **Must** |
| **43** | **Storybook** | **Storybook v9** | Component development environment — build, test, and document UI components in isolation. | Enables parallel frontend development. Components can be built and reviewed without running the full app. | `npx storybook@latest init` — auto-detects Next.js, configures Vite builder, creates `.storybook/` dir. | **Setup.sh** — large dependency tree (~100MB). Optional for teams that want it. | **Nice-to-have** |
| **44** | **i18n** | **next-intl v4** | Internationalization for Next.js App Router — messages, formatting, routing with locale prefixes. | SaaS products targeting global markets need i18n from day one. Retrofitting is painful. | `npm i next-intl` — `messages/en.json`, `src/i18n.ts` config, `middleware.ts` with locale detection. | **Setup.sh** — not all SaaS products need i18n at launch. | **Nice-to-have** |

---

## Priority Summary

### Must-Have (ship in template, zero-config)
1. Husky v9 + lint-staged v15 + commitlint v19
2. Prettier v3 + EditorConfig + ESLint v9+ flat config
3. Vitest v4 (with coverage thresholds)
4. @t3-oss/env-nextjs (type-safe env vars)
5. Zod v3 + React Hook Form
6. TypeScript strict mode
7. GitHub Issue templates + PR template
8. Security headers in `next.config.mjs`
9. GitHub CodeQL workflow + Dependabot config
10. shadcn/ui (config file pre-installed, components added via setup.sh)
11. Playwright config (pre-installed, browsers installed via setup.sh)

### Should-Have (stubs/configs ship, activated via setup.sh)
1. Better Auth or Clerk (auth choice)
2. Prisma v7 or Drizzle (ORM choice)
3. Docker + docker-compose
4. Vercel config + production Dockerfile
5. Sentry SDK v10
6. Pino.js structured logging
7. Resend + React Email
8. Stripe integration boilerplate
9. @upstash/redis + @upstash/ratelimit
10. CODEOWNERS
11. DevContainer / Codespaces config
12. npm audit in CI

### Nice-to-Have (documented, installed on demand)
1. OpenTelemetry (@vercel/otel)
2. Feature flags (Vercel Flags SDK or env-based)
3. Inngest / Trigger.dev (background jobs)
4. Nextra (docs site)
5. Storybook
6. next-intl (i18n)
7. Renovate (alternative to Dependabot)
8. OpenAPI/Swagger auto-generation

---

## Recommended .env.example Expansion

```env
# ─────────────────────────────────────────────────────────────
# Environment variables — copy to .env and fill in real values
# NEVER commit .env to git
# ─────────────────────────────────────────────────────────────

# App
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/myapp

# Auth (Better Auth)
# AUTH_SECRET=         # openssl rand -base64 32
# GITHUB_CLIENT_ID=
# GITHUB_CLIENT_SECRET=
# GOOGLE_CLIENT_ID=
# GOOGLE_CLIENT_SECRET=

# Stripe
# STRIPE_SECRET_KEY=sk_test_...
# NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
# STRIPE_WEBHOOK_SECRET=whsec_...

# Email (Resend)
# RESEND_API_KEY=re_...

# Redis (Upstash)
# UPSTASH_REDIS_REST_URL=
# UPSTASH_REDIS_REST_TOKEN=

# Monitoring (Sentry)
# NEXT_PUBLIC_SENTRY_DSN=
# SENTRY_AUTH_TOKEN=

# Feature Flags
# NEXT_PUBLIC_FEATURE_NEW_DASHBOARD=false
# NEXT_PUBLIC_FEATURE_BETA_BILLING=false

# Background Jobs (Inngest)
# INNGEST_EVENT_KEY=
# INNGEST_SIGNING_KEY=
```

---

## Recommended setup.sh Expansion

The current `setup.sh` has 2 steps. Suggested expansion:

```
Step 1/7 — SonarCloud configuration (existing)
Step 2/7 — BMAD Method install (existing)
Step 3/7 — shadcn/ui init (npx shadcn@latest init)
Step 4/7 — Auth provider choice (Better Auth / Clerk / Skip)
Step 5/7 — Database ORM choice (Prisma / Drizzle / Skip)
Step 6/7 — Install Playwright browsers (npx playwright install chromium)
Step 7/7 — Optional integrations menu (Stripe / Resend / Sentry / Inngest)
```

---

## Config Files That Should Ship in Template

```
Root:
├── .editorconfig
├── .prettierrc
├── .prettierignore
├── eslint.config.mjs
├── commitlint.config.ts
├── vitest.config.ts
├── playwright.config.ts
├── docker-compose.yml
├── Dockerfile
├── vercel.json
├── renovate.json          (optional — alternative to dependabot.yml)
├── components.json        (shadcn/ui config)
├── next.config.mjs        (with security headers)
├── tsconfig.json          (strict mode)

.github/
├── dependabot.yml
├── CODEOWNERS
├── PULL_REQUEST_TEMPLATE.md
├── ISSUE_TEMPLATE/
│   ├── bug_report.yml
│   ├── feature_request.yml
│   └── config.yml
├── workflows/
│   ├── ci.yml             (existing — enhanced)
│   └── codeql.yml         (new)

.husky/
├── pre-commit             (npx lint-staged)
├── commit-msg             (npx commitlint --edit $1)

.devcontainer/
├── devcontainer.json

src/
├── env.ts                 (@t3-oss/env-nextjs schema)
├── lib/
│   ├── logger.ts          (pino wrapper stub)
│   ├── rate-limit.ts      (upstash stub)
│   ├── redis.ts           (upstash stub)
│   ├── stripe.ts          (stripe client stub)
│   ├── email.ts           (resend client stub)
│   └── feature-flags.ts   (env-based flags)

prisma/
├── schema.prisma          (template with User model)
├── seed.ts                (example seed script)

emails/
├── welcome.tsx            (React Email template)
```

---

## Sources

- [ixartz/SaaS-Boilerplate](https://github.com/ixartz/SaaS-Boilerplate) — Most comprehensive open-source template (Clerk, Drizzle, Vitest, Playwright, Sentry, Husky, commitlint, Codecov)
- [mickasmt/next-saas-stripe-starter](https://github.com/mickasmt/next-saas-stripe-starter) — Auth.js v5, Prisma, Stripe, Resend, React Email, shadcn/ui
- [nextjs/saas-starter](https://github.com/nextjs/saas-starter) — Official Vercel template (Drizzle, Stripe, shadcn/ui, JWT auth)
- [create-t3-app](https://github.com/t3-oss/create-t3-app) — T3 stack (tRPC, Prisma/Drizzle, NextAuth, Tailwind, t3-env)
- [boxyhq/saas-starter-kit](https://github.com/boxyhq/saas-starter-kit) — Enterprise SaaS (SAML SSO, SCIM, multi-tenancy)
- [Vitest 4.0 announcement](https://vitest.dev/blog/vitest-4) — Stable browser mode, visual regression testing
- [Prisma 7.0 announcement](https://www.prisma.io/blog/announcing-prisma-orm-7-0-0) — Rust-free, pure TypeScript client
- [Better Auth](https://better-auth.com/) — Auth.js is now part of Better Auth
- [shadcn/cli v4](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4) — March 2026 release, project templates
- [React Email 5.0](https://resend.com/blog/react-email-5) — Tailwind 4 support, dark mode, theming
- [Renovate bot comparison](https://docs.renovatebot.com/bot-comparison/) — Detailed Renovate vs Dependabot comparison
- [Vercel Flags SDK](https://github.com/vercel/flags) — Framework-native feature flags
- [Next.js OpenTelemetry guide](https://nextjs.org/docs/app/guides/open-telemetry) — Built-in OTel support
- [Nextra 4](https://the-guild.dev/blog/nextra-4) — App Router, Turbopack, Pagefind search
- [Upstash Rate Limiting](https://github.com/upstash/ratelimit-js) — Serverless rate limiting
- [Inngest](https://www.inngest.com/) — Serverless workflow orchestration
- [GitHub CodeQL docs](https://docs.github.com/en/code-security/code-scanning/enabling-code-scanning/configuring-default-setup-for-code-scanning) — Default setup for code scanning
- [ESLint flat config](https://eslint.org/blog/2025/03/flat-config-extends-define-config-global-ignores/) — defineConfig and extends
- [Stripe Next.js 2026 guide](https://dev.to/sameer_saleem/the-ultimate-guide-to-stripe-nextjs-2026-edition-2f33) — Server Actions + Embedded Checkout
- [@t3-oss/env-nextjs](https://env.t3.gg/docs/nextjs) — Type-safe environment variables
- [Sentry @sentry/nextjs](https://www.npmjs.com/package/@sentry/nextjs) — v10.43.0
