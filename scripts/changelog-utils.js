#!/usr/bin/env node
// scripts/changelog-utils.js
// Changelog generation utilities — parses conventional commit log lines
// and groups them by type for CHANGELOG.md output.
// Used by: npm run changelog (via conventional-changelog-cli)
// Testable functions exported for scripts/__tests__/changelog.test.ts

'use strict';

/**
 * Conventional commit types that appear in CHANGELOG sections.
 */
const CHANGELOG_TYPES = {
  feat: 'Features',
  fix: 'Bug Fixes',
  perf: 'Performance Improvements',
  revert: 'Reverts',
  docs: 'Documentation',
  style: 'Styles',
  refactor: 'Code Refactoring',
  test: 'Tests',
  build: 'Build System',
  ci: 'Continuous Integration',
  chore: 'Chores',
};

/**
 * Parse a single conventional commit message line.
 * Returns { type, scope, subject, breaking } or null if not parseable.
 *
 * @param {string} line - Raw commit message (subject line only)
 * @returns {{ type: string, scope: string|null, subject: string, breaking: boolean } | null}
 */
function parseCommitLine(line) {
  if (!line || typeof line !== 'string') return null;

  // Match: type(scope)!: subject  OR  type!: subject  OR  type(scope): subject  OR  type: subject
  const match = line.match(/^(\w+)(\(([^)]+)\))?(!)?\s*:\s*(.+)$/);
  if (!match) return null;

  const [, type, , scope, bang, subject] = match;
  return {
    type,
    scope: scope || null,
    subject: subject.trim(),
    breaking: Boolean(bang),
  };
}

/**
 * Check whether a commit message body/footer contains a BREAKING CHANGE footer.
 *
 * @param {string} fullCommitText - Full commit text including body and footer
 * @returns {string|null} - The breaking change description or null
 */
function extractBreakingChange(fullCommitText) {
  if (!fullCommitText || typeof fullCommitText !== 'string') return null;

  const match = fullCommitText.match(/BREAKING CHANGE:\s*(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * Group an array of parsed commit objects by their changelog section.
 * Breaking changes are extracted into a dedicated section.
 *
 * @param {Array<{ type: string, scope: string|null, subject: string, breaking: boolean, breakingDescription?: string }>} commits
 * @returns {{ breakingChanges: string[], sections: Record<string, string[]> }}
 */
function groupCommitsBySection(commits) {
  const breakingChanges = [];
  const sections = {};

  for (const commit of commits) {
    if (!commit || !commit.type) continue;

    if (commit.breaking || commit.breakingDescription) {
      const desc = commit.breakingDescription || commit.subject;
      breakingChanges.push(desc);
    }

    const sectionName = CHANGELOG_TYPES[commit.type];
    if (sectionName) {
      if (!sections[sectionName]) sections[sectionName] = [];
      const entry = commit.scope ? `**${commit.scope}:** ${commit.subject}` : commit.subject;
      sections[sectionName].push(entry);
    }
  }

  return { breakingChanges, sections };
}

/**
 * Generate markdown for a changelog entry given grouped commits.
 *
 * @param {string} version - Release version (e.g., "1.2.0")
 * @param {string} date - Release date (e.g., "2026-03-28")
 * @param {{ breakingChanges: string[], sections: Record<string, string[]> }} grouped
 * @returns {string} - Markdown string
 */
function generateChangelogMarkdown(version, date, grouped) {
  const lines = [`## [${version}] (${date})`, ''];

  if (grouped.breakingChanges.length > 0) {
    lines.push('### ⚠ BREAKING CHANGES', '');
    for (const bc of grouped.breakingChanges) {
      lines.push(`* ${bc}`);
    }
    lines.push('');
  }

  for (const [section, entries] of Object.entries(grouped.sections)) {
    if (entries.length === 0) continue;
    lines.push(`### ${section}`, '');
    for (const entry of entries) {
      lines.push(`* ${entry}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

module.exports = {
  CHANGELOG_TYPES,
  parseCommitLine,
  extractBreakingChange,
  groupCommitsBySection,
  generateChangelogMarkdown,
};

/* istanbul ignore next */
if (require.main === module) {
  // When run directly, just confirm the module loads correctly
  console.log('changelog-utils loaded. Use npm run changelog to generate CHANGELOG.md.');
}
