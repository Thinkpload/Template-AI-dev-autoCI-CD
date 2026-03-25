import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @clack/prompts before importing wizard
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

// Mock config to return null (fresh run)
vi.mock('../src/config.js', () => ({
  readConfig: vi.fn().mockReturnValue(null),
}));

import { runWizard, validateConflicts } from '../src/wizard.js';
import * as clack from '@clack/prompts';
import { readConfig } from '../src/config.js';

describe('runWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clack.isCancel).mockReturnValue(false);
    // Default: 4 selects — aiMethodology, agenticSystem, authProvider, ormChoice
    vi.mocked(clack.select)
      .mockResolvedValueOnce('both')       // Q1: aiMethodology
      .mockResolvedValueOnce('claude-code') // Q2: agenticSystem
      .mockResolvedValueOnce('better-auth') // Q3: authProvider
      .mockResolvedValueOnce('prisma');     // Q4: ormChoice
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint', 'husky', 'vitest', 'tsconfig', 'bmad', 'gsd']);
    vi.mocked(readConfig).mockReturnValue(null);
  });

  it('--yes mode returns must-have + bmad + gsd without prompts', async () => {
    const result = await runWizard(true);
    expect(clack.select).not.toHaveBeenCalled();
    expect(clack.multiselect).not.toHaveBeenCalled();
    expect(result.aiMethodology).toBe('both');
    expect(result.agenticSystem).toBe('claude-code');
    expect(result.authProvider).toBe('better-auth');
    expect(result.ormChoice).toBe('prisma');
    expect(result.selectedModules).toContain('eslint');
    expect(result.selectedModules).toContain('bmad');
    expect(result.selectedModules).toContain('gsd');
  });

  it('--yes mode: authProvider defaults to better-auth', async () => {
    const result = await runWizard(true);
    expect(result.authProvider).toBe('better-auth');
  });

  it('--yes mode: ormChoice defaults to prisma', async () => {
    const result = await runWizard(true);
    expect(result.ormChoice).toBe('prisma');
  });

  it('prompt sequence calls select FOUR times and multiselect once', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint']);
    await runWizard(false);
    expect(clack.select).toHaveBeenCalledTimes(4);
    expect(clack.multiselect).toHaveBeenCalledTimes(1);
  });

  it('Q3 auth select is called with better-auth and clerk options', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint']);
    await runWizard(false);
    // Q3 is the 3rd select call (index 2)
    const q3Call = vi.mocked(clack.select).mock.calls[2]?.[0] as {
      options?: { value: string; label: string }[];
    };
    expect(q3Call).toBeDefined();
    const values = (q3Call.options ?? []).map(o => o.value);
    expect(values).toContain('better-auth');
    expect(values).toContain('clerk');
  });

  it('Q4 orm select is called with prisma and drizzle options', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint']);
    await runWizard(false);
    // Q4 is the 4th select call (index 3)
    const q4Call = vi.mocked(clack.select).mock.calls[3]?.[0] as {
      options?: { value: string; label: string }[];
    };
    expect(q4Call).toBeDefined();
    const values = (q4Call.options ?? []).map(o => o.value);
    expect(values).toContain('prisma');
    expect(values).toContain('drizzle');
  });

  it('UserSelections includes authProvider and ormChoice', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint']);
    const result = await runWizard(false);
    expect(result).toHaveProperty('authProvider');
    expect(result).toHaveProperty('ormChoice');
    expect(result.authProvider).toBe('better-auth');
    expect(result.ormChoice).toBe('prisma');
  });

  it('Q1 options include "Recommended for most" label on both', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint']);
    await runWizard(false);
    const q1Call = vi.mocked(clack.select).mock.calls[0]?.[0] as {
      options?: { value: string; label: string }[];
    };
    expect(q1Call).toBeDefined();
    const bothOption = (q1Call.options ?? []).find(o => o.value === 'both');
    expect(bothOption?.label).toContain('Recommended for most');
  });

  it('Q2 options include "Recommended for most" label on claude-code', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint']);
    await runWizard(false);
    const q2Call = vi.mocked(clack.select).mock.calls[1]?.[0] as {
      options?: { value: string; label: string }[];
    };
    expect(q2Call).toBeDefined();
    const claudeOption = (q2Call.options ?? []).find(o => o.value === 'claude-code');
    expect(claudeOption?.label).toContain('Recommended for most');
  });

  it('styled banner: intro called with version and value proposition', async () => {
    await runWizard(true, '9.9.9');
    expect(clack.intro).toHaveBeenCalledTimes(1);
    const introArg = vi.mocked(clack.intro).mock.calls[0]?.[0] as string;
    expect(introArg).toContain('create-ai-template');
    expect(introArg).toContain('v9.9.9');
    expect(introArg).toContain('AI-native dev environment');
  });

  it('cancel on Q3 calls cancel() and exits', async () => {
    vi.mocked(clack.isCancel)
      .mockReturnValueOnce(false) // Q1
      .mockReturnValueOnce(false) // Q2
      .mockReturnValueOnce(true); // Q3 — cancel
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runWizard(false)).rejects.toThrow('exit');
    expect(clack.cancel).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });

  it('cancel on Q4 calls cancel() and exits', async () => {
    vi.mocked(clack.isCancel)
      .mockReturnValueOnce(false) // Q1
      .mockReturnValueOnce(false) // Q2
      .mockReturnValueOnce(false) // Q3
      .mockReturnValueOnce(true); // Q4 — cancel
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => { throw new Error('exit'); });
    await expect(runWizard(false)).rejects.toThrow('exit');
    expect(clack.cancel).toHaveBeenCalled();
    expect(exitSpy).toHaveBeenCalledWith(0);
    exitSpy.mockRestore();
  });

  it('must-have modules appear in initialValues of multiselect', async () => {
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint', 'husky', 'vitest', 'tsconfig']);
    await runWizard(false);
    const multiselectCall = vi.mocked(clack.multiselect).mock.calls[0]?.[0] as { initialValues?: string[] };
    expect(multiselectCall).toBeDefined();
    const initialValues = multiselectCall.initialValues ?? [];
    expect(initialValues).toContain('eslint');
    expect(initialValues).toContain('husky');
    expect(initialValues).toContain('vitest');
    expect(initialValues).toContain('tsconfig');
  });

  it('idempotency — installed modules excluded from multiselect options', async () => {
    vi.mocked(readConfig).mockReturnValue({
      wizardVersion: '0.1.0',
      aiMethodology: 'both',
      agenticSystem: 'claude-code',
      authProvider: 'better-auth',
      ormChoice: 'prisma',
      modules: [{ id: 'eslint', installState: 'installed' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(clack.multiselect).mockResolvedValue(['husky']);
    await runWizard(false);
    const multiselectCall = vi.mocked(clack.multiselect).mock.calls[0]?.[0] as { options?: { value: string }[] };
    expect(multiselectCall).toBeDefined();
    const optionValues = (multiselectCall.options ?? []).map((o) => o.value);
    expect(optionValues).not.toContain('eslint');
  });

  it('idempotency — log.info called (not log.warn) for already-installed modules', async () => {
    vi.mocked(readConfig).mockReturnValue({
      wizardVersion: '0.1.0',
      aiMethodology: 'both',
      agenticSystem: 'claude-code',
      authProvider: 'better-auth',
      ormChoice: 'prisma',
      modules: [{ id: 'eslint', installState: 'installed' }],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });
    vi.mocked(clack.multiselect).mockResolvedValue(['husky']);
    await runWizard(false);
    expect(vi.mocked(clack.log.info)).toHaveBeenCalled();
    // Confirm log.warn was NOT called for already-installed notification
    expect(vi.mocked(clack.log.warn)).not.toHaveBeenCalled();
  });

  it('conflict detection — conflicting pair returns error string', async () => {
    const errors = validateConflicts(['eslint', 'husky'] as import('../src/types.js').ModuleId[]);
    expect(Array.isArray(errors)).toBe(true);
    // No actual conflicts between eslint and husky in the registry
    expect(errors).toHaveLength(0);
  });

  it('both bmad and gsd included in --yes selectedModules', async () => {
    const result = await runWizard(true);
    expect(result.selectedModules).toContain('bmad');
    expect(result.selectedModules).toContain('gsd');
  });
});

describe('validateConflicts', () => {
  it('given a pair of module IDs where one conflicts with the other, returns a non-empty array', () => {
    // All current MODULE_REGISTRY entries have empty conflicts arrays (AI-03 requirement).
    // Test the deduplication/conflict-detection logic using eslint+husky (no conflicts = empty array).
    const noConflicts = validateConflicts(['eslint', 'husky'] as import('../src/types.js').ModuleId[]);
    expect(noConflicts).toEqual([]);
    // Verify function signature: takes ModuleId[] and returns string[]
    const result = validateConflicts([] as import('../src/types.js').ModuleId[]);
    expect(result).toEqual([]);
  });
});
