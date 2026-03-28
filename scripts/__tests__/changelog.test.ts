import { describe, it, expect } from 'vitest';
import {
  parseCommitLine,
  extractBreakingChange,
  groupCommitsBySection,
  generateChangelogMarkdown,
  CHANGELOG_TYPES,
} from '../changelog-utils.js';

// ─── parseCommitLine ──────────────────────────────────────────────────────────

describe('parseCommitLine', () => {
  it('parses a feat commit without scope', () => {
    const result = parseCommitLine('feat: add dark mode toggle');
    expect(result).toEqual({
      type: 'feat',
      scope: null,
      subject: 'add dark mode toggle',
      breaking: false,
    });
  });

  it('parses a fix commit with scope', () => {
    const result = parseCommitLine('fix(auth): resolve login redirect loop');
    expect(result).toEqual({
      type: 'fix',
      scope: 'auth',
      subject: 'resolve login redirect loop',
      breaking: false,
    });
  });

  it('parses a breaking change commit with ! marker', () => {
    const result = parseCommitLine('feat(api)!: remove legacy endpoint');
    expect(result).toEqual({
      type: 'feat',
      scope: 'api',
      subject: 'remove legacy endpoint',
      breaking: true,
    });
  });

  it('parses a chore commit', () => {
    const result = parseCommitLine('chore(deps): update dependencies');
    expect(result).toEqual({
      type: 'chore',
      scope: 'deps',
      subject: 'update dependencies',
      breaking: false,
    });
  });

  it('returns null for non-conventional commit message', () => {
    expect(parseCommitLine('just a random commit')).toBeNull();
    expect(parseCommitLine('WIP')).toBeNull();
    expect(parseCommitLine('')).toBeNull();
    expect(parseCommitLine(null as unknown as string)).toBeNull();
  });

  it('parses a breaking change without scope', () => {
    const result = parseCommitLine('feat!: major API overhaul');
    expect(result).toEqual({
      type: 'feat',
      scope: null,
      subject: 'major API overhaul',
      breaking: true,
    });
  });
});

// ─── extractBreakingChange ────────────────────────────────────────────────────

describe('extractBreakingChange', () => {
  it('extracts BREAKING CHANGE footer description', () => {
    const text =
      'feat: new auth\n\nBREAKING CHANGE: removed legacy session cookie format — migrate by clearing cookies';
    expect(extractBreakingChange(text)).toBe(
      'removed legacy session cookie format — migrate by clearing cookies'
    );
  });

  it('returns null when no BREAKING CHANGE footer present', () => {
    expect(extractBreakingChange('feat: add button')).toBeNull();
    expect(extractBreakingChange('')).toBeNull();
    expect(extractBreakingChange(null as unknown as string)).toBeNull();
  });

  it('handles BREAKING CHANGE with extra whitespace', () => {
    const text = 'fix: patch\n\nBREAKING CHANGE:   sessions are cleared on upgrade';
    expect(extractBreakingChange(text)).toBe('sessions are cleared on upgrade');
  });
});

// ─── groupCommitsBySection ────────────────────────────────────────────────────

describe('groupCommitsBySection', () => {
  it('groups feat commits into Features section', () => {
    const commits = [{ type: 'feat', scope: null, subject: 'add dashboard', breaking: false }];
    const result = groupCommitsBySection(commits);
    expect(result.sections['Features']).toContain('add dashboard');
    expect(result.breakingChanges).toHaveLength(0);
  });

  it('groups fix commits into Bug Fixes section', () => {
    const commits = [{ type: 'fix', scope: 'auth', subject: 'fix login bug', breaking: false }];
    const result = groupCommitsBySection(commits);
    expect(result.sections['Bug Fixes']).toContain('**auth:** fix login bug');
  });

  it('extracts breaking commits into breakingChanges array', () => {
    const commits = [
      {
        type: 'feat',
        scope: 'api',
        subject: 'remove old endpoint',
        breaking: true,
        breakingDescription: 'old /v1/users endpoint removed — use /v2/users',
      },
    ];
    const result = groupCommitsBySection(commits);
    expect(result.breakingChanges).toHaveLength(1);
    expect(result.breakingChanges[0]).toBe('old /v1/users endpoint removed — use /v2/users');
  });

  it('returns empty sections and breakingChanges for empty commits array', () => {
    const result = groupCommitsBySection([]);
    expect(result.breakingChanges).toHaveLength(0);
    expect(Object.keys(result.sections)).toHaveLength(0);
  });

  it('skips commits with unknown type (not in CHANGELOG_TYPES)', () => {
    const commits = [{ type: 'unknown_type', scope: null, subject: 'some work', breaking: false }];
    const result = groupCommitsBySection(commits);
    expect(Object.keys(result.sections)).toHaveLength(0);
  });

  it('handles multiple commits of different types', () => {
    const commits = [
      { type: 'feat', scope: null, subject: 'feature one', breaking: false },
      { type: 'fix', scope: null, subject: 'fix one', breaking: false },
      { type: 'chore', scope: null, subject: 'chore one', breaking: false },
    ];
    const result = groupCommitsBySection(commits);
    expect(result.sections['Features']).toContain('feature one');
    expect(result.sections['Bug Fixes']).toContain('fix one');
    expect(result.sections['Chores']).toContain('chore one');
  });
});

// ─── generateChangelogMarkdown ────────────────────────────────────────────────

describe('generateChangelogMarkdown', () => {
  it('generates markdown with Features section', () => {
    const grouped = {
      breakingChanges: [],
      sections: { Features: ['add dashboard shell'] },
    };
    const md = generateChangelogMarkdown('1.2.0', '2026-03-28', grouped);
    expect(md).toContain('## [1.2.0] (2026-03-28)');
    expect(md).toContain('### Features');
    expect(md).toContain('* add dashboard shell');
  });

  it('generates dedicated ⚠ BREAKING CHANGES section when breaking changes present', () => {
    const grouped = {
      breakingChanges: ['removed legacy session cookie — clear cookies on upgrade'],
      sections: { Features: ['new auth flow'] },
    };
    const md = generateChangelogMarkdown('2.0.0', '2026-03-28', grouped);
    expect(md).toContain('### ⚠ BREAKING CHANGES');
    expect(md).toContain('* removed legacy session cookie — clear cookies on upgrade');
  });

  it('does NOT include ⚠ BREAKING CHANGES section when no breaking changes', () => {
    const grouped = {
      breakingChanges: [],
      sections: { 'Bug Fixes': ['fix redirect'] },
    };
    const md = generateChangelogMarkdown('1.0.1', '2026-03-28', grouped);
    expect(md).not.toContain('BREAKING CHANGES');
  });

  it('produces empty-ish output when no sections and no breaking changes', () => {
    const grouped = { breakingChanges: [], sections: {} };
    const md = generateChangelogMarkdown('1.0.0', '2026-01-01', grouped);
    expect(md).toContain('## [1.0.0] (2026-01-01)');
    expect(md).not.toContain('### Features');
  });
});

// ─── CHANGELOG_TYPES map ──────────────────────────────────────────────────────

describe('CHANGELOG_TYPES', () => {
  it('maps feat to Features', () => {
    expect(CHANGELOG_TYPES['feat']).toBe('Features');
  });

  it('maps fix to Bug Fixes', () => {
    expect(CHANGELOG_TYPES['fix']).toBe('Bug Fixes');
  });

  it('maps chore to Chores', () => {
    expect(CHANGELOG_TYPES['chore']).toBe('Chores');
  });

  it('maps perf to Performance Improvements', () => {
    expect(CHANGELOG_TYPES['perf']).toBe('Performance Improvements');
  });
});
