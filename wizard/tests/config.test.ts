import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock node:fs to avoid real filesystem access
vi.mock('node:fs', () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

import { readFileSync, writeFileSync } from 'node:fs';
import type { TemplateConfig, InstallState } from '../src/types.js';

// Import after mocks are set up
const { readConfig, writeConfig, buildInitialConfig } = await import('../src/config.js');

describe('readConfig', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns null when config file does not exist (ENOENT)', () => {
    const err = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    vi.mocked(readFileSync).mockImplementation(() => { throw err; });
    const result = readConfig();
    expect(result).toBeNull();
  });

  it('round-trips a TemplateConfig object exactly via writeConfig then readConfig', () => {
    const config: TemplateConfig = {
      wizardVersion: '0.1.0',
      aiMethodology: 'both',
      agenticSystem: 'claude-code',
      modules: [
        { id: 'eslint', installState: 'pending' },
        { id: 'husky', installState: 'installed' },
      ],
      createdAt: '2026-03-15T00:00:00.000Z',
      updatedAt: '2026-03-15T00:00:00.000Z',
    };

    // Simulate writeConfig storing then readConfig reading it back
    let stored = '';
    vi.mocked(writeFileSync).mockImplementation((_path, data) => {
      stored = data as string;
    });
    vi.mocked(readFileSync).mockImplementation(() => stored);

    writeConfig(config);
    const result = readConfig();
    expect(result).toEqual(config);
  });

  it('writeConfig calls writeFileSync with 2-space indented JSON', () => {
    const config: TemplateConfig = {
      wizardVersion: '0.1.0',
      aiMethodology: 'gsd',
      agenticSystem: 'cursor',
      modules: [],
      createdAt: '2026-03-15T00:00:00.000Z',
      updatedAt: '2026-03-15T00:00:00.000Z',
    };
    writeConfig(config);
    expect(writeFileSync).toHaveBeenCalledWith(
      expect.any(String),
      JSON.stringify(config, null, 2),
      'utf-8',
    );
  });
});

describe('buildInitialConfig', () => {
  it('maps selectedModules to ModuleInstallRecord[] with installState pending', () => {
    const result = buildInitialConfig(
      { aiMethodology: 'both', agenticSystem: 'claude-code', selectedModules: ['eslint', 'husky'] },
      '0.1.0',
    );
    expect(result.wizardVersion).toBe('0.1.0');
    expect(result.modules).toEqual([
      { id: 'eslint', installState: 'pending' },
      { id: 'husky', installState: 'pending' },
    ]);
    expect(result.aiMethodology).toBe('both');
    expect(result.agenticSystem).toBe('claude-code');
    expect(result.createdAt).toBeTruthy();
    expect(result.updatedAt).toBeTruthy();
  });
});

describe('InstallState type contract (WIZ-07)', () => {
  it('InstallState type includes failed and skipped', () => {
    // TypeScript compile-time check — if this compiles, the type is correct
    const failed: InstallState = 'failed';
    const skipped: InstallState = 'skipped';
    const pending: InstallState = 'pending';
    const installed: InstallState = 'installed';
    expect(failed).toBe('failed');
    expect(skipped).toBe('skipped');
    expect(pending).toBe('pending');
    expect(installed).toBe('installed');
  });
});
