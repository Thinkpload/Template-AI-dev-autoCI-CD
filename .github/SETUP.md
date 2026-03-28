# CI/CD Setup Guide

This document explains how to configure the required GitHub Secrets and external services for the CI pipeline to function correctly.

## Required GitHub Secrets

Navigate to your repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**.

| Secret        | Required       | Description                                      |
| ------------- | -------------- | ------------------------------------------------ |
| `SONAR_TOKEN` | Yes            | SonarCloud authentication token                  |
| `NPM_TOKEN`   | For publishing | npm access token (only needed for `publish.yml`) |

## SonarCloud Setup

### Step 1: Create a SonarCloud account

1. Go to [sonarcloud.io](https://sonarcloud.io) and sign in with GitHub.
2. Click **Analyze new project** → select your repository.
3. Choose **With GitHub Actions** as the analysis method.

### Step 2: Get your project values

After creating the project, SonarCloud shows you:

- **Organization key** — shown in the URL: `sonarcloud.io/organizations/<your-org>`
- **Project key** — shown in the project settings, typically `<org>_<repo-name>`

### Step 3: Update `sonar-project.properties`

Replace the placeholder values at the project root:

```properties
sonar.projectKey=YOUR_ORG_YOUR_REPO   # → e.g., myorg_my-repo
sonar.organization=YOUR_ORG           # → e.g., myorg
```

### Step 4: Add SONAR_TOKEN to GitHub Secrets

1. In SonarCloud: go to **My Account** → **Security** → **Generate Tokens**.
2. Create a token named `github-actions`.
3. Copy the token value.
4. In GitHub: go to **Settings** → **Secrets** → **Actions** → **New repository secret**.
5. Name: `SONAR_TOKEN`, Value: paste the token.

### Step 5: Verify the quality gate

The default SonarCloud quality gate fails if:

- Coverage drops below the project threshold
- Security vulnerabilities (SQL injection, XSS, path traversal) are detected
- Code smells exceed the rating threshold

## CI Pipeline Overview

The `ci.yml` workflow runs on every push to `main` and every PR targeting `main`:

```
lint (Node 20) → test (Node 20 + 22 matrix) → sonarcloud → build (Node 20)
```

| Job          | What it does                   | Fails if                         |
| ------------ | ------------------------------ | -------------------------------- |
| `lint`       | ESLint + TypeScript type check | Any lint error or type error     |
| `test`       | Vitest with coverage           | Any test fails or coverage < 85% |
| `sonarcloud` | Static analysis + quality gate | Security vulnerability detected  |
| `build`      | Next.js production build       | Build error                      |

---

## Renovate Setup

Renovate automatically creates pull requests when new dependency versions are available.

### How to enable Renovate

1. Go to [github.com/apps/renovate](https://github.com/apps/renovate) and click **Install**.
2. Grant access to this repository.
3. Renovate will open an onboarding PR titled "Configure Renovate" — merge it to activate.

**No GitHub Secrets are required.** Renovate authenticates via its own GitHub App.

### What Renovate does

Configured in `renovate.json`:

- Runs **every weekend** and groups all minor + patch updates into a single PR
- **Automerges patch-level updates** (no breaking changes expected)
- Requires manual review for **major version updates**
- Ignores `wizard/` (separate standalone package)
- Labels all PRs with `dependencies` and `automated`
- Maximum 3 concurrent open PRs to avoid noise

---

## CodeQL Security Analysis

CodeQL performs static analysis to detect security vulnerabilities in the codebase.

### How it works

Configured in `.github/workflows/codeql.yml` — **no setup required**. It runs automatically:

- On every push to `main`
- On every pull request targeting `main`
- Weekly (every Monday at 10:00 UTC)

### What CodeQL detects

Uses the `security-extended` query suite, which covers:

- **Injection vulnerabilities** (SQL, command, path traversal)
- **XSS** (cross-site scripting)
- **Insecure data flows**
- All CWE categories in the OWASP Top 10

When a vulnerability is detected, a **GitHub Security Alert** is created under the repository's **Security** tab. The alert includes the affected file, line number, and remediation guidance.

### Viewing results

Go to your repository → **Security** → **Code scanning alerts**.

---

## License Compliance Check

The `dependency-review.yml` workflow blocks PRs that introduce GPL or AGPL licensed dependencies.

### How it works

Two checks run on every PR targeting `main`:

1. **`actions/dependency-review-action`** — GitHub's built-in dependency review, blocks on severity ≥ moderate and denies GPL/AGPL/LGPL licenses.
2. **`scripts/check-licenses.js`** — Custom MIT compliance check, scans all installed packages and fails if any blocked license is found.

### Blocked licenses

The following license families are blocked (incompatible with this project's MIT license):

- GPL-2.0, GPL-3.0 (and `-only`, `-or-later` variants)
- AGPL-3.0 (and `-only`, `-or-later` variants)
- LGPL-2.0, LGPL-2.1, LGPL-3.0 (and variants)
- UNLICENSED packages

### Running locally

```bash
# Check all licenses (production + dev)
node scripts/check-licenses.js

# Check production dependencies only
node scripts/check-licenses.js --production

# Output JSON report
node scripts/check-licenses.js --json > license-report.json
```

---

## Automated Releases

Releases are generated automatically from conventional commits when a version tag is pushed.

### How to trigger a release

```bash
# Bump version and create tag
npm version patch   # 0.1.0 → 0.1.1
npm version minor   # 0.1.0 → 0.2.0
npm version major   # 0.1.0 → 1.0.0

# Push the tag to trigger the release workflow
git push origin main --tags
```

### What happens automatically

When a tag matching `v*.*.*` is pushed, the `.github/workflows/release.yml` workflow:

1. Checks out the full git history (`fetch-depth: 0`)
2. Runs `npm run changelog` — updates `CHANGELOG.md` using `conventional-changelog-cli` with the Angular preset
3. Commits `CHANGELOG.md` back to `main` as `github-actions[bot]`
4. Creates a GitHub Release via `gh release create` with auto-generated notes

### GITHUB_TOKEN permissions

No extra secrets are required. The workflow uses the built-in `GITHUB_TOKEN` with `contents: write` permission, which is automatically granted by GitHub Actions. This allows:

- Committing `CHANGELOG.md` back to the repository
- Creating GitHub Releases

### BREAKING CHANGE format

To mark a commit as a breaking change, add a `BREAKING CHANGE:` footer to the commit message:

```
feat(auth)!: replace session cookie with JWT

BREAKING CHANGE: legacy session cookies are no longer supported — clear browser cookies and re-authenticate after upgrade
```

The `BREAKING CHANGE:` footer causes `conventional-changelog` to generate a dedicated **⚠ BREAKING CHANGES** section at the top of the release entry.

### Generating CHANGELOG locally

```bash
npm run changelog
```

This updates `CHANGELOG.md` in-place with all conventional commits since the last tag.

---

## Local Verification

Before pushing, verify the same checks locally:

```bash
# Lint
npm run lint
npm run type-check

# Tests with coverage
npm run test:coverage

# Build (with env stubs — same as CI)
SKIP_ENV_VALIDATION=1 DATABASE_URL=postgresql://stub:stub@localhost:5432/stub npm run build
```
