import { describe, it, expect, vi } from 'vitest';
import { isBlockedLicense, runCheck, BLOCKED_LICENSES } from '../check-licenses.js';

// ─── isBlockedLicense: pure function, no mocking needed ───────────────────────

describe('isBlockedLicense', () => {
  it('returns false for MIT license', () => {
    expect(isBlockedLicense('MIT')).toBe(false);
  });

  it('returns false for Apache-2.0 license', () => {
    expect(isBlockedLicense('Apache-2.0')).toBe(false);
  });

  it('returns false for ISC license', () => {
    expect(isBlockedLicense('ISC')).toBe(false);
  });

  it('returns true for GPL-2.0', () => {
    expect(isBlockedLicense('GPL-2.0')).toBe(true);
  });

  it('returns true for GPL-3.0', () => {
    expect(isBlockedLicense('GPL-3.0')).toBe(true);
  });

  it('returns true for GPL-2.0-only', () => {
    expect(isBlockedLicense('GPL-2.0-only')).toBe(true);
  });

  it('returns true for GPL-3.0-or-later', () => {
    expect(isBlockedLicense('GPL-3.0-or-later')).toBe(true);
  });

  it('returns true for AGPL-3.0', () => {
    expect(isBlockedLicense('AGPL-3.0')).toBe(true);
  });

  it('returns true for AGPL-3.0-only', () => {
    expect(isBlockedLicense('AGPL-3.0-only')).toBe(true);
  });

  it('returns true for LGPL-2.1', () => {
    expect(isBlockedLicense('LGPL-2.1')).toBe(true);
  });

  it('returns true for UNLICENSED package (empty string)', () => {
    expect(isBlockedLicense('')).toBe(true);
  });

  it('returns true for UNLICENSED string', () => {
    expect(isBlockedLicense('UNLICENSED')).toBe(true);
  });

  it('returns true for null/undefined license', () => {
    expect(isBlockedLicense(undefined as unknown as string)).toBe(true);
    expect(isBlockedLicense(null as unknown as string)).toBe(true);
  });

  it('returns true for multi-license string containing GPL', () => {
    expect(isBlockedLicense('MIT; GPL-2.0')).toBe(true);
  });

  it('returns false for multi-license string with only MIT and Apache', () => {
    expect(isBlockedLicense('MIT; Apache-2.0')).toBe(false);
  });
});

// ─── BLOCKED_LICENSES list ────────────────────────────────────────────────────

describe('BLOCKED_LICENSES list', () => {
  it('contains GPL-2.0', () => {
    expect(BLOCKED_LICENSES).toContain('GPL-2.0');
  });

  it('contains AGPL-3.0', () => {
    expect(BLOCKED_LICENSES).toContain('AGPL-3.0');
  });

  it('contains LGPL variants', () => {
    expect(BLOCKED_LICENSES).toContain('LGPL-2.0');
    expect(BLOCKED_LICENSES).toContain('LGPL-2.1');
    expect(BLOCKED_LICENSES).toContain('LGPL-3.0');
  });

  it('does NOT contain MIT or Apache-2.0', () => {
    expect(BLOCKED_LICENSES).not.toContain('MIT');
    expect(BLOCKED_LICENSES).not.toContain('Apache-2.0');
  });

  it('contains GPL-2.0-only and GPL-3.0-or-later variants', () => {
    expect(BLOCKED_LICENSES).toContain('GPL-2.0-only');
    expect(BLOCKED_LICENSES).toContain('GPL-3.0-or-later');
  });
});

// ─── runCheck: uses dependency injection — pass mock checker ──────────────────

function makeMockChecker(
  impl: (opts: object, cb: (err: Error | null, pkgs: object | null) => void) => void
) {
  return { init: vi.fn(impl) };
}

describe('runCheck (dependency-injected mock checker)', () => {
  it('returns no violations when all licenses are MIT', async () => {
    const mockChecker = makeMockChecker((_opts, cb) => {
      cb(null, {
        'react@19.0.0': { licenses: 'MIT' },
        'next@15.0.0': { licenses: 'MIT' },
      });
    });

    const result = await runCheck({ start: '.', production: true }, mockChecker);
    expect(result.violations).toHaveLength(0);
    expect(Object.keys(result.all)).toHaveLength(2);
  });

  it('returns violations when GPL license is detected', async () => {
    const mockChecker = makeMockChecker((_opts, cb) => {
      cb(null, {
        'react@19.0.0': { licenses: 'MIT' },
        'bad-pkg@1.0.0': { licenses: 'GPL-3.0' },
      });
    });

    const result = await runCheck({ start: '.', production: true }, mockChecker);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].package).toBe('bad-pkg@1.0.0');
    expect(result.violations[0].license).toBe('GPL-3.0');
  });

  it('returns violations when AGPL license is detected', async () => {
    const mockChecker = makeMockChecker((_opts, cb) => {
      cb(null, {
        'agpl-pkg@1.0.0': { licenses: 'AGPL-3.0' },
      });
    });

    const result = await runCheck({ start: '.', production: true }, mockChecker);
    expect(result.violations).toHaveLength(1);
    expect(result.violations[0].license).toBe('AGPL-3.0');
  });

  it('returns violations for unlicensed packages', async () => {
    const mockChecker = makeMockChecker((_opts, cb) => {
      cb(null, {
        'unlicensed-pkg@1.0.0': { licenses: 'UNLICENSED' },
        'no-license@2.0.0': { licenses: '' },
      });
    });

    const result = await runCheck({ start: '.', production: true }, mockChecker);
    expect(result.violations).toHaveLength(2);
    const pkgNames = result.violations.map((v) => v.package);
    expect(pkgNames).toContain('unlicensed-pkg@1.0.0');
    expect(pkgNames).toContain('no-license@2.0.0');
  });

  it('rejects when license-checker returns an error', async () => {
    const mockChecker = makeMockChecker((_opts, cb) => {
      cb(new Error('Failed to read node_modules'), null);
    });

    await expect(runCheck({ start: '.' }, mockChecker)).rejects.toThrow(
      'Failed to read node_modules'
    );
  });

  it('produces valid JSON-serializable violations array', async () => {
    const mockChecker = makeMockChecker((_opts, cb) => {
      cb(null, {
        'bad@1.0.0': { licenses: 'GPL-2.0' },
      });
    });

    const result = await runCheck({ start: '.' }, mockChecker);
    const json = JSON.stringify(result.violations);
    const parsed = JSON.parse(json);
    expect(Array.isArray(parsed)).toBe(true);
    expect(parsed[0]).toHaveProperty('package', 'bad@1.0.0');
    expect(parsed[0]).toHaveProperty('license', 'GPL-2.0');
  });
});
