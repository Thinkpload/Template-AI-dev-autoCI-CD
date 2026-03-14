import { describe, it, expect } from 'vitest';

describe('dependency-versions.ts', () => {
  it('exports exist and are importable', async () => {
    // This will fail until wizard/src/dependency-versions.ts is created in Plan 02
    const versions = await import('../src/dependency-versions.js');
    expect(versions).toBeDefined();
  });

  it('no @latest strings in any exported version constant', async () => {
    const versions = await import('../src/dependency-versions.js') as Record<string, string>;
    const versionValues = Object.values(versions).filter((v): v is string => typeof v === 'string');
    const latestEntries = versionValues.filter(v => v.includes('@latest'));
    expect(latestEntries).toHaveLength(0);
  });

  it('all exported version constants are non-empty strings', async () => {
    const versions = await import('../src/dependency-versions.js') as Record<string, string>;
    const entries = Object.entries(versions).filter(([, v]) => typeof v === 'string');
    expect(entries.length).toBeGreaterThan(0);
    for (const [key, value] of entries) {
      expect(value, `${key} must be a non-empty string`).not.toBe('');
    }
  });
});
