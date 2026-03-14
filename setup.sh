#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
# Post-clone setup script
# Run once after using this template:  bash setup.sh
# Requires: Node.js >= 20, git
# ─────────────────────────────────────────────────────────────
set -e

BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
CYAN="\033[0;36m"
RESET="\033[0m"

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${BOLD}  SaaS Project Template — Interactive Setup${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""

# ── 1. SonarCloud config ──────────────────────────────────────
echo -e "${CYAN}Step 1/2 — SonarCloud configuration${RESET}"
echo ""

read -p "  SonarCloud organization (e.g. my-org): " SONAR_ORG
read -p "  SonarCloud project key  (e.g. my-org_my-repo): " SONAR_KEY

if [[ -n "$SONAR_ORG" && -n "$SONAR_KEY" ]]; then
  sed -i "s/YOUR_ORG_YOUR_REPO/$SONAR_KEY/g" sonar-project.properties
  sed -i "s/YOUR_ORG/$SONAR_ORG/g" sonar-project.properties
  echo -e "  ${GREEN}✔ sonar-project.properties updated${RESET}"
else
  echo -e "  ${YELLOW}⚠ Skipped — edit sonar-project.properties manually${RESET}"
fi

echo ""

# ── 2. BMAD interactive install ───────────────────────────────
echo -e "${CYAN}Step 2/2 — BMAD Method v6 installation${RESET}"
echo ""
echo -e "  This will launch the interactive BMAD installer."
echo -e "  Recommended modules: ${BOLD}bmm${RESET} (dev workflow) + ${BOLD}tea${RESET} (testing)"
echo ""
read -p "  Install BMAD now? [Y/n] " INSTALL_BMAD
INSTALL_BMAD="${INSTALL_BMAD:-Y}"

if [[ "$INSTALL_BMAD" =~ ^[Yy]$ ]]; then
  npx bmad-method install
else
  echo -e "  ${YELLOW}⚠ Skipped — run 'npx bmad-method install' later${RESET}"
fi

# ── Done ──────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo -e "${GREEN}${BOLD}  Setup complete!${RESET}"
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
echo ""
echo -e "  ${BOLD}Next steps:${RESET}"
echo -e "  1. Add GitHub Secrets (repo Settings → Secrets → Actions):"
echo -e "     ${YELLOW}SONAR_TOKEN${RESET}  — from sonarcloud.io → My Account → Security"
echo -e "     ${YELLOW}GITHUB_TOKEN${RESET} — provided automatically by GitHub Actions"
echo -e "  2. Copy .env.example → .env and fill in your values"
echo -e "  3. Run ${BOLD}npm install${RESET} and start building"
echo ""
