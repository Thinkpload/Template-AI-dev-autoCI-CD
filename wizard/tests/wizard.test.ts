import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock @clack/prompts before importing wizard
vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  select: vi.fn(),
  multiselect: vi.fn(),
  isCancel: vi.fn().mockReturnValue(false),
  cancel: vi.fn(),
  log: { warn: vi.fn(), error: vi.fn() },
}));

// Mock config to return null (fresh run)
vi.mock('../src/config.js', () => ({
  readConfig: vi.fn().mockReturnValue(null),
}));

import { runWizard, validateConflicts } from '../src/wizard.js';
import * as clack from '@clack/prompts';

describe('runWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(clack.isCancel).mockReturnValue(false);
    vi.mocked(clack.select).mockResolvedValue('both');
    vi.mocked(clack.multiselect).mockResolvedValue(['eslint', 'husky', 'vitest', 'tsconfig', 'bmad', 'gsd']);
  });

  it('--yes mode returns must-have + bmad + gsd without prompts', async () => {
    expect.fail('not implemented — wizard.ts does not exist yet');
  });

  it('prompt sequence calls select twice and multiselect once', async () => {
    expect.fail('not implemented — wizard.ts does not exist yet');
  });

  it('must-have modules appear in initialValues of multiselect', async () => {
    expect.fail('not implemented — wizard.ts does not exist yet');
  });

  it('idempotency — installed modules excluded from multiselect options', async () => {
    expect.fail('not implemented — wizard.ts does not exist yet');
  });

  it('conflict detection — conflicting pair returns error string', async () => {
    expect.fail('not implemented — wizard.ts does not exist yet');
  });

  it('both bmad and gsd included in --yes selectedModules', async () => {
    expect.fail('not implemented — wizard.ts does not exist yet');
  });
});

describe('validateConflicts', () => {
  it.todo('given a pair of module IDs where one conflicts with the other, returns a non-empty array');
});
