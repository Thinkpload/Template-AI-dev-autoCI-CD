# Template BMAD + auto CI/CD

[![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2FYOUR_REPO)

> One command. Five questions. Production-ready AI dev environment.

A GitHub Template Repository for new SaaS projects. Ships with **BMAD Method v6** agent workflows, an interactive CLI wizard, a full **CI/CD quality pipeline**, and a self-healing **auto-bugfix** system out of the box.

---

## What's included

| Layer | Tool | Purpose |
|---|---|---|
| App Framework | Next.js 15 + React 19 | App Router, RSC, Server Actions |
| Styling | Tailwind CSS v4 + shadcn/ui | Direction D purple theme, dark mode default |
| Auth | Better Auth / Clerk (your choice) | Self-hosted or managed auth |
| ORM | Prisma / Drizzle (your choice) | Schema-first or code-first DB |
| Database | PostgreSQL (Neon prod, Docker local) | Serverless-ready |
| AI Workflows | BMAD Method v6 | PM, Architect, Dev, QA, SM agents |
| CI/CD | GitHub Actions | Lint → Test → SonarCloud → Build |
| Auto Bugfix | `/fix-issue <N>` in Claude Code | AI-generated fix PR on CI failure |
| Dependency Updates | Renovate | Weekly grouped PRs, automerge |
| Security | CodeQL + npm audit + license scan | Automated on every push |

---

## Quick Start

### 1. Use this template

Click **"Use this template"** → **"Create a new repository"** on GitHub.

> **Repository Setup (maintainers only):** After creating the template repo, go to **Settings → General** and check **"Template repository"** to enable the "Use this template" button.

### 2. Run the interactive wizard

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
npx create-ai-template
```

The wizard will:
- Ask 5 questions with educational hints (AI methodology, auth, ORM, optional modules)
- Install only what you chose and remove the rest
- Show real-time progress per module
- Display next steps and auto-bugfix preview on success

Or use defaults non-interactively:
```bash
npx create-ai-template --yes
```

> Requires Node.js ≥ 20

### 3. Configure environment

```bash
cp .env.example .env
# Fill in your values — see comments in .env.example
```

### 4. Start local development

```bash
docker-compose up -d   # Start local PostgreSQL
npx prisma migrate dev # Apply initial schema
npm run dev            # Start Next.js on http://localhost:3000
```

### 5. Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions**:

| Secret | Where to get it |
|---|---|
| `SONAR_TOKEN` | [sonarcloud.io](https://sonarcloud.io) → My Account → Security → Generate token |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions |

---

## Auto-Bugfix Pipeline

The template's killer feature: when CI fails, a structured GitHub Issue is created automatically.

```
CI fails → GitHub Issue created (job + error log + SHA + branch)
         → Run /fix-issue <N> in Claude Code
         → AI reads the issue, applies a targeted fix
         → Opens a PR with [skip ci] commit (prevents infinite loop)
         → After 3 failed attempts → needs-human label, stops
```

---

## BMAD Agent Workflows

All 8 BMAD agents are available as slash commands immediately after cloning (no setup required):

| Agent | Slash Command | Role |
|---|---|---|
| Orchestrator | `/bmad-help` | Routes tasks across agents |
| PM | `/bmad-pm` | PRD and planning |
| Architect | `/bmad-architect` | Technical architecture |
| UX Designer | `/bmad-ux-designer` | UI/UX specifications |
| Dev | `/bmad-dev` | Implementation guidance |
| QA | `/bmad-qa` | Testing strategy |
| Scrum Master | `/bmad-sm` | Sprint planning |
| Tech Writer | `/bmad-tech-writer` | Documentation |

---

## Project Structure

```
your-project/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/             # Sign-in / Sign-up
│   │   ├── dashboard/          # Protected dashboard
│   │   └── api/                # Route Handlers
│   ├── components/
│   │   ├── ui/                 # shadcn/ui (do not edit)
│   │   └── shared/             # Shared components
│   ├── lib/
│   │   ├── db.ts               # Database client (Prisma or Drizzle)
│   │   ├── auth.ts             # Auth configuration
│   │   ├── validations/        # Zod schemas
│   │   └── utils/              # Utility functions
│   ├── actions/                # Server Actions
│   ├── hooks/                  # Custom React hooks
│   └── stores/                 # Zustand stores
├── prisma/                     # Prisma schema + migrations
├── drizzle/                    # Drizzle schema (removed if Prisma chosen)
├── e2e/                        # Playwright E2E tests
├── docs/
│   ├── decisions/              # Architecture Decision Records (ADRs)
│   └── guides/                 # Integration + migration guides
├── wizard/                     # npx create-ai-template package
├── _bmad/                      # BMAD agents & config
├── .github/workflows/          # CI/CD pipelines
├── .env.example                # Environment variable template
└── setup.sh                    # Passthrough to wizard
```

---

## CI/CD Pipeline

**Triggers:** push or PR to `main`

```
Checkout → Setup Node → npm ci → Security Audit → Lint → Tests + Coverage → SonarCloud → Build
                                                                                    ↓ (on failure)
                                                                       GitHub Issue auto-created
```

Coverage threshold: ≥ 85% (blocks merge if below).

---

## Keeping Your Project Updated

```bash
npm run template:update
```

- Fetches latest `_bmad/`, `.github/`, and root config improvements
- Runs `npm install` and full test suite automatically
- **MINOR versions:** always backward-compatible (your `src/` is never touched)
- **MAJOR versions:** migration guide provided, previous version tagged for rollback

---

## Deployment

### Vercel (one-click)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FYOUR_ORG%2FYOUR_REPO)

Set `DATABASE_URL` to your Neon PostgreSQL connection string in Vercel environment variables.

### Self-hosted (AWS / GCP / fly.io)

See `docs/guides/deployment.md` for step-by-step guides.

---

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting issues and PRs.

- Commit format: [Conventional Commits](https://www.conventionalcommits.org/)
- Test coverage: ≥ 85% required
- PR review: within 48 hours
