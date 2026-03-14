# SaaS Project Template — BMAD + CI/CD

A GitHub Template Repository for new SaaS projects.
Ships with **BMAD Method v6** agent workflows and a **SonarCloud CI/CD pipeline** out of the box.

---

## What's included

| Layer | Tool | Purpose |
|---|---|---|
| AI Workflows | BMAD Method v6 | Structured agents: PM, Architect, Dev, QA, Scrum Master |
| CI/CD | GitHub Actions | Lint → Test → SonarCloud → Build |
| Code Quality | SonarCloud | Static analysis + coverage tracking |
| Auto Bugfix | `_agents/workflows/BUGFIX-CI-GITHUB-ISSUES.md` | AI fixes latest CI failure from GitHub Issues |

---

## Quick Start

### 1. Use this template

Click **"Use this template"** → **"Create a new repository"** on GitHub.

### 2. Clone and run setup

```bash
git clone https://github.com/YOUR_ORG/YOUR_REPO.git
cd YOUR_REPO
bash setup.sh
```

The setup script will:
- Prompt for your SonarCloud org and project key → patches `sonar-project.properties`
- Launch the **BMAD interactive installer** (`npx bmad-method install`)

> Requires Node.js ≥ 20

### 3. Add GitHub Secrets

Go to **Settings → Secrets and variables → Actions** in your new repo:

| Secret | Where to get it |
|---|---|
| `SONAR_TOKEN` | [sonarcloud.io](https://sonarcloud.io) → My Account → Security → Generate token |
| `GITHUB_TOKEN` | Provided automatically by GitHub Actions — no action needed |

### 4. Copy env file

```bash
cp .env.example .env
# Fill in your values
```

---

## SonarCloud Setup (first time)

1. Log in to [sonarcloud.io](https://sonarcloud.io) with your GitHub account
2. Click **"+"** → **"Analyze new project"** → import your repo
3. Choose **"With GitHub Actions"** — copy the `SONAR_TOKEN`
4. Add `SONAR_TOKEN` as a GitHub Secret (see above)
5. In SonarCloud project settings, set **"New Code"** definition to `Previous version`

The `sonar-project.properties` file is already configured — just replace `YOUR_ORG` and `YOUR_ORG_YOUR_REPO` if you skipped `setup.sh`.

---

## CI/CD Pipeline

**Triggers:** push or PR to `main`

```
Checkout → Setup Node 20 → npm ci → Lint → Tests + Coverage → SonarCloud Scan → Build
                                                                          ↓ (on failure)
                                                              GitHub Issue created with logs
```

On failure, the pipeline automatically opens a GitHub Issue (label: `bug`) with the last 50 lines of the failing step's log. This powers the **BUGFIX-CI-GITHUB-ISSUES** workflow.

---

## BMAD Agent Workflows

After running `setup.sh`, BMAD creates a `_bmad/` directory with compiled agent files.

### Available agents (BMM module)

| Agent | Role |
|---|---|
| `bmad-orchestrator` | Routes tasks across all agents |
| `bmm-analyst` | Requirements & research |
| `bmm-pm` | PRD and planning |
| `bmm-architect` | Technical architecture |
| `bmm-ux-designer` | UI/UX design |
| `bmm-scrum-master` | Sprint planning |
| `bmm-dev` | Implementation |

Start with: `/bmad-help` in your AI editor (Claude Code, Cursor, Gemini, etc.)

### Custom workflows (`_agents/workflows/`)

| Workflow | Description |
|---|---|
| `BUGFIX-CI-GITHUB-ISSUES.md` | Reads the latest CI failure issue and auto-fixes the code |

To trigger the bugfix workflow, open your AI agent and run:
`/BUGFIX-CI-GITHUB-ISSUES`

---

## Project Structure

```
your-project/
├── .github/
│   └── workflows/
│       └── ci.yml              # CI/CD pipeline
├── _agents/
│   └── workflows/              # Custom AI agent workflows
├── _bmad/                      # BMAD agents & config (created by setup.sh)
├── _bmad-output/               # BMAD generated artifacts
├── src/                        # Your source code
├── sonar-project.properties    # SonarCloud config
├── .env.example                # Environment variable template
├── setup.sh                    # One-time post-clone setup
└── README.md
```

---

## CI Status Badge

After your first CI run, add this to your project README (replace org/repo):

```markdown
[![CI](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml/badge.svg)](https://github.com/YOUR_ORG/YOUR_REPO/actions/workflows/ci.yml)
```
