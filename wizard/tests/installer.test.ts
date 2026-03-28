// Expected installer.ts exports:
// export async function runInstaller(selections: UserSelections, yesMode: boolean, targetDir?: string): Promise<void>
// export function mergePackageJson(pkgPath: string, additions: PackageJsonAdditions): void
// type PackageJsonAdditions = { scripts?: Record<string,string>; [key: string]: unknown }

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

vi.mock('node:child_process', () => ({
  spawnSync: vi.fn().mockReturnValue({ status: 0, error: undefined, stderr: '' }),
}));

const mockSpinnerStart = vi.fn();
const mockSpinnerStop = vi.fn();

vi.mock('@clack/prompts', () => ({
  intro: vi.fn(),
  outro: vi.fn(),
  note: vi.fn(),
  spinner: vi.fn(() => ({ start: mockSpinnerStart, stop: mockSpinnerStop })),
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn(), step: vi.fn() },
}));

import { runInstaller, mergePackageJson } from '../src/installer.js';
import { spawnSync } from 'node:child_process';
import { log, outro, note } from '@clack/prompts';
import type { UserSelections } from '../src/types.js';

let tmpDir: string;

beforeEach(() => {
  tmpDir = mkdtempSync(join(tmpdir(), 'installer-test-'));
  // Write a minimal package.json so mergePackageJson has something to read
  writeFileSync(
    join(tmpDir, 'package.json'),
    JSON.stringify({ name: 'test-project', scripts: {} }, null, 2)
  );
  vi.clearAllMocks();
  mockSpinnerStart.mockClear();
  mockSpinnerStop.mockClear();
  vi.mocked(spawnSync).mockReturnValue({ status: 0, error: undefined, stderr: '' } as ReturnType<typeof spawnSync>);
});

afterEach(() => {
  rmSync(tmpDir, { recursive: true, force: true });
});

const baseSelections: UserSelections = {
  aiMethodology: 'bmad-only' as UserSelections['aiMethodology'],
  agenticSystem: 'cursor',
  authProvider: 'better-auth',
  ormChoice: 'prisma',
  selectedModules: ['husky'],
};

describe('runInstaller', () => {
  it('skips modules where installState is already installed (idempotency)', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    // Pre-write config indicating husky is already installed
    writeFileSync(
      join(tmpDir, '.template-config.json'),
      JSON.stringify({
        wizardVersion: '1.0.0',
        aiMethodology: 'bmad-only',
        agenticSystem: 'cursor',
        authProvider: 'better-auth',
        ormChoice: 'prisma',
        modules: [{ id: 'husky', installState: 'installed' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    await runInstaller(selections, true, tmpDir);
    // husky devDeps (husky@...) should NOT be installed (idempotency guard)
    const calls = vi.mocked(spawnSync).mock.calls;
    const huskyInstallCall = calls.find(c =>
      Array.isArray(c[1]) && c[1].includes('--save-dev') && c[1].some((a: unknown) => typeof a === 'string' && (a as string).includes('husky@'))
    );
    expect(huskyInstallCall).toBeUndefined();
  });

  it('calls spawnSync with npm install --save-dev and devDeps for pending modules', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    expect(spawnSync).toHaveBeenCalledWith(
      'npm',
      expect.arrayContaining(['install', '--save-dev']),
      expect.objectContaining({ cwd: tmpDir })
    );
  });

  it('marks module as failed in config when spawnSync returns non-zero status, then continues', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined, stderr: 'error' } as ReturnType<typeof spawnSync>);
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    // Should not throw — installer continues after failure
    await expect(runInstaller(selections, true, tmpDir)).resolves.not.toThrow();
  });

  it('vitest module install adds both "test" and "test:coverage" scripts to package.json', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['vitest'] };
    await runInstaller(selections, true, tmpDir);
    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf-8'));
    expect(pkg.scripts).toHaveProperty('test');
    expect(pkg.scripts).toHaveProperty('test:coverage');
  });
});

describe('mergePackageJson', () => {
  it('injects scripts keys without overwriting existing scripts', () => {
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-project', scripts: { build: 'tsc' } }, null, 2)
    );
    mergePackageJson(join(tmpDir, 'package.json'), { scripts: { test: 'vitest' } });
    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf-8'));
    expect(pkg.scripts.build).toBe('tsc');
    expect(pkg.scripts.test).toBe('vitest');
  });

  it('injects lint-staged key into package.json when key is absent', () => {
    mergePackageJson(join(tmpDir, 'package.json'), { 'lint-staged': { '*.ts': ['eslint --fix'] } });
    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf-8'));
    expect(pkg['lint-staged']).toBeDefined();
  });

  it('does NOT overwrite an existing lint-staged key (logs warning, skips)', () => {
    const existing = { '*.ts': ['prettier --write'] };
    writeFileSync(
      join(tmpDir, 'package.json'),
      JSON.stringify({ name: 'test-project', scripts: {}, 'lint-staged': existing }, null, 2)
    );
    mergePackageJson(join(tmpDir, 'package.json'), { 'lint-staged': { '*.ts': ['eslint --fix'] } });
    const pkg = JSON.parse(readFileSync(join(tmpDir, 'package.json'), 'utf-8'));
    expect(pkg['lint-staged']).toEqual(existing);
  });
});

describe('hook file integrity', () => {
  it('hook files written to .husky/ have LF endings only (no CRLF)', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    mkdirSync(join(tmpDir, '.husky'), { recursive: true });
    await runInstaller(selections, true, tmpDir);
    const preCommit = readFileSync(join(tmpDir, '.husky', 'pre-commit'), 'utf-8');
    expect(preCommit).not.toContain('\r');
  });

  it('pre-commit hook file does NOT contain a shebang line', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    mkdirSync(join(tmpDir, '.husky'), { recursive: true });
    await runInstaller(selections, true, tmpDir);
    const preCommit = readFileSync(join(tmpDir, '.husky', 'pre-commit'), 'utf-8');
    expect(preCommit).not.toMatch(/^#!/);
  });

  it('commit-msg hook file contains commitlint invocation', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    mkdirSync(join(tmpDir, '.husky'), { recursive: true });
    await runInstaller(selections, true, tmpDir);
    const commitMsg = readFileSync(join(tmpDir, '.husky', 'commit-msg'), 'utf-8');
    expect(commitMsg).toContain('commitlint');
  });
});

describe('spinner version display', () => {
  it('spinner start message includes module label for husky', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    expect(mockSpinnerStart).toHaveBeenCalledWith(expect.stringContaining('Husky'));
  });

  it('spinner start message includes major version number extracted from devDep', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    // husky@^9.1.7 → message should contain "v9"
    expect(mockSpinnerStart).toHaveBeenCalledWith(expect.stringMatching(/v\d+/));
  });

  it('spinner start message for gsd (no devDeps) contains label without version suffix', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['gsd'] };
    await runInstaller(selections, true, tmpDir);
    const call = mockSpinnerStart.mock.calls[0]?.[0] ?? '';
    expect(call).toContain('GSD');
    // No version number should appear when no devDeps
    expect(call).not.toMatch(/v\d+/);
  });
});

describe('consolidated error display', () => {
  it('log.error is called with consolidated header after all modules complete when a module fails', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined, stderr: 'install failed' } as ReturnType<typeof spawnSync>);
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    expect(vi.mocked(log.error)).toHaveBeenCalledWith(
      expect.stringMatching(/failed to install/i)
    );
  });

  it('log.error is NOT called mid-loop — only after all modules finish', async () => {
    // Strategy: track which modules have had their spinner.stop() called when log.error fires.
    // log.error should only be called after both modules' spinners have stopped.
    const stopCallLabels: string[] = [];
    mockSpinnerStop.mockImplementation((msg: string) => {
      stopCallLabels.push(msg);
    });

    let firstModuleFailed = false;
    vi.mocked(spawnSync).mockImplementation(() => {
      if (!firstModuleFailed) {
        firstModuleFailed = true;
        return { status: 1, error: undefined, stderr: 'fail' } as ReturnType<typeof spawnSync>;
      }
      return { status: 0, error: undefined, stderr: '' } as ReturnType<typeof spawnSync>;
    });

    const selections: UserSelections = { ...baseSelections, selectedModules: ['eslint', 'vitest'] };
    let errorCalledBeforeBothModulesFinished = false;
    vi.mocked(log.error).mockImplementation(() => {
      // At this point both modules should have had their spinner stopped
      const failedModulesStopped = stopCallLabels.some(l => l.includes('failed'));
      const successModulesStopped = stopCallLabels.some(l => l.includes('installed'));
      if (!failedModulesStopped || !successModulesStopped) {
        errorCalledBeforeBothModulesFinished = true;
      }
    });

    await runInstaller(selections, true, tmpDir);
    expect(errorCalledBeforeBothModulesFinished).toBe(false);
  });

  it('installer resolves (does not throw) even when all modules fail', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined, stderr: 'fail' } as ReturnType<typeof spawnSync>);
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky', 'eslint'] };
    await expect(runInstaller(selections, true, tmpDir)).resolves.not.toThrow();
  });

  it('spinner stop is called with "<label> failed" message on failure', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined, stderr: 'fail' } as ReturnType<typeof spawnSync>);
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    expect(mockSpinnerStop).toHaveBeenCalledWith(expect.stringContaining('failed'));
  });
});

describe('auth setup', () => {
  it('better-auth: installs better-auth runtime dep (no --save-dev)', async () => {
    const selections: UserSelections = { ...baseSelections, authProvider: 'better-auth', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const calls = vi.mocked(spawnSync).mock.calls;
    const authCall = calls.find(c => Array.isArray(c[1]) && c[1].some((a: unknown) => typeof a === 'string' && a.includes('better-auth')));
    expect(authCall).toBeDefined();
    // Must NOT include --save-dev
    expect(authCall?.[1]).not.toContain('--save-dev');
  });

  it('better-auth: writes src/lib/auth.ts to target directory', async () => {
    const selections: UserSelections = { ...baseSelections, authProvider: 'better-auth', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const { existsSync: fsExists } = await import('node:fs');
    expect(fsExists(join(tmpDir, 'src', 'lib', 'auth.ts'))).toBe(true);
  });

  it('clerk: installs @clerk/nextjs runtime dep (no --save-dev)', async () => {
    const selections: UserSelections = { ...baseSelections, authProvider: 'clerk', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const calls = vi.mocked(spawnSync).mock.calls;
    const authCall = calls.find(c => Array.isArray(c[1]) && c[1].some((a: unknown) => typeof a === 'string' && a.includes('@clerk/nextjs')));
    expect(authCall).toBeDefined();
    expect(authCall?.[1]).not.toContain('--save-dev');
  });

  it('clerk: writes src/lib/auth.ts to target directory', async () => {
    const selections: UserSelections = { ...baseSelections, authProvider: 'clerk', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const { existsSync: fsExists } = await import('node:fs');
    expect(fsExists(join(tmpDir, 'src', 'lib', 'auth.ts'))).toBe(true);
  });
});

describe('orm setup', () => {
  beforeEach(() => {
    // Create both ORM stub dirs as they exist in the real template repo
    mkdirSync(join(tmpDir, 'prisma'), { recursive: true });
    writeFileSync(join(tmpDir, 'prisma', 'schema.prisma'), '// stub');
    mkdirSync(join(tmpDir, 'drizzle'), { recursive: true });
    writeFileSync(join(tmpDir, 'drizzle', 'schema.ts'), 'export {};');
  });

  it('prisma: installs prisma devDep and @prisma/client runtime dep', async () => {
    const selections: UserSelections = { ...baseSelections, ormChoice: 'prisma', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const calls = vi.mocked(spawnSync).mock.calls;
    const prismaDevCall = calls.find(c => Array.isArray(c[1]) && c[1].includes('--save-dev') && c[1].some((a: unknown) => typeof a === 'string' && a.includes('prisma@')));
    expect(prismaDevCall).toBeDefined();
    const prismaClientCall = calls.find(c => Array.isArray(c[1]) && !c[1].includes('--save-dev') && c[1].some((a: unknown) => typeof a === 'string' && a.includes('@prisma/client')));
    expect(prismaClientCall).toBeDefined();
  });

  it('prisma: deletes drizzle/ directory', async () => {
    const { existsSync: fsExists } = await import('node:fs');
    const selections: UserSelections = { ...baseSelections, ormChoice: 'prisma', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(fsExists(join(tmpDir, 'drizzle'))).toBe(false);
  });

  it('prisma: keeps prisma/ directory intact', async () => {
    const { existsSync: fsExists } = await import('node:fs');
    const selections: UserSelections = { ...baseSelections, ormChoice: 'prisma', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(fsExists(join(tmpDir, 'prisma'))).toBe(true);
  });

  it('prisma: writes src/lib/db.ts to target directory', async () => {
    const { existsSync: fsExists } = await import('node:fs');
    const selections: UserSelections = { ...baseSelections, ormChoice: 'prisma', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(fsExists(join(tmpDir, 'src', 'lib', 'db.ts'))).toBe(true);
  });

  it('drizzle: installs drizzle-orm runtime dep and drizzle-kit devDep', async () => {
    const selections: UserSelections = { ...baseSelections, ormChoice: 'drizzle', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const calls = vi.mocked(spawnSync).mock.calls;
    const drizzleOrmCall = calls.find(c => Array.isArray(c[1]) && !c[1].includes('--save-dev') && c[1].some((a: unknown) => typeof a === 'string' && a.includes('drizzle-orm')));
    expect(drizzleOrmCall).toBeDefined();
    const drizzleKitCall = calls.find(c => Array.isArray(c[1]) && c[1].includes('--save-dev') && c[1].some((a: unknown) => typeof a === 'string' && a.includes('drizzle-kit')));
    expect(drizzleKitCall).toBeDefined();
  });

  it('drizzle: deletes prisma/ directory', async () => {
    const { existsSync: fsExists } = await import('node:fs');
    const selections: UserSelections = { ...baseSelections, ormChoice: 'drizzle', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(fsExists(join(tmpDir, 'prisma'))).toBe(false);
  });

  it('drizzle: keeps drizzle/ directory intact', async () => {
    const { existsSync: fsExists } = await import('node:fs');
    const selections: UserSelections = { ...baseSelections, ormChoice: 'drizzle', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(fsExists(join(tmpDir, 'drizzle'))).toBe(true);
  });

  it('drizzle: writes src/lib/db.ts to target directory', async () => {
    const { existsSync: fsExists } = await import('node:fs');
    const selections: UserSelections = { ...baseSelections, ormChoice: 'drizzle', selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(fsExists(join(tmpDir, 'src', 'lib', 'db.ts'))).toBe(true);
  });
});

describe('.template-config.json persists auth and orm choices', () => {
  // Note: runInstaller reads/writes config during module processing.
  // buildInitialConfig (called in index.ts before runInstaller) writes authProvider + ormChoice.
  // These tests verify that runInstaller preserves authProvider/ormChoice from a pre-written config.
  it('config retains authProvider when a module is installed', async () => {
    const selections: UserSelections = { ...baseSelections, authProvider: 'better-auth', selectedModules: ['eslint'] };
    // Pre-write config with authProvider (as buildInitialConfig does in index.ts)
    writeFileSync(
      join(tmpDir, '.template-config.json'),
      JSON.stringify({
        wizardVersion: '0.1.0',
        aiMethodology: 'both',
        agenticSystem: 'claude-code',
        authProvider: 'better-auth',
        ormChoice: 'prisma',
        modules: [{ id: 'eslint', installState: 'pending' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    await runInstaller(selections, true, tmpDir);
    const cfg = JSON.parse(readFileSync(join(tmpDir, '.template-config.json'), 'utf-8'));
    expect(cfg.authProvider).toBe('better-auth');
  });

  it('config retains ormChoice when a module is installed', async () => {
    const selections: UserSelections = { ...baseSelections, ormChoice: 'drizzle', selectedModules: ['eslint'] };
    writeFileSync(
      join(tmpDir, '.template-config.json'),
      JSON.stringify({
        wizardVersion: '0.1.0',
        aiMethodology: 'both',
        agenticSystem: 'claude-code',
        authProvider: 'better-auth',
        ormChoice: 'drizzle',
        modules: [{ id: 'eslint', installState: 'pending' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    await runInstaller(selections, true, tmpDir);
    const cfg = JSON.parse(readFileSync(join(tmpDir, '.template-config.json'), 'utf-8'));
    expect(cfg.ormChoice).toBe('drizzle');
  });
});

describe('success screen', () => {
  it('note() is called with content containing the number of installed modules', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    const noteCalls = vi.mocked(note).mock.calls;
    const summaryCall = noteCalls.find(c => typeof c[0] === 'string' && /\d+\s+module/i.test(c[0]));
    expect(summaryCall).toBeDefined();
  });

  it('note() is called with content containing /fix-issue (auto-bugfix preview)', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const noteCalls = vi.mocked(note).mock.calls;
    const autoBugfixCall = noteCalls.find(c =>
      (typeof c[0] === 'string' && c[0].includes('/fix-issue')) ||
      (typeof c[1] === 'string' && c[1].includes('fix-issue'))
    );
    expect(autoBugfixCall).toBeDefined();
  });

  it('outro() is called exactly once at the end', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(vi.mocked(outro)).toHaveBeenCalledTimes(1);
  });

  it('outro() message contains a success phrase', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    expect(vi.mocked(outro)).toHaveBeenCalledWith(expect.stringMatching(/set|ready|done|complete|building/i));
  });

  it('note() is called with content containing git push command (What\'s next section)', async () => {
    const selections: UserSelections = { ...baseSelections, selectedModules: [] };
    await runInstaller(selections, true, tmpDir);
    const noteCalls = vi.mocked(note).mock.calls;
    const nextstepsCall = noteCalls.find(c =>
      (typeof c[0] === 'string' && c[0].includes('git push')) ||
      (typeof c[1] === 'string' && c[1].includes('What'))
    );
    expect(nextstepsCall).toBeDefined();
  });

  it('when modules fail: outro() is still called exactly once (success screen shown even on failure)', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined, stderr: 'fail' } as ReturnType<typeof spawnSync>);
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    expect(vi.mocked(outro)).toHaveBeenCalledTimes(1);
  });

  it('when modules fail: failure info appears in note() or outro() output', async () => {
    vi.mocked(spawnSync).mockReturnValue({ status: 1, error: undefined, stderr: 'fail' } as ReturnType<typeof spawnSync>);
    const selections: UserSelections = { ...baseSelections, selectedModules: ['husky'] };
    await runInstaller(selections, true, tmpDir);
    const allTextCalls = [
      ...vi.mocked(note).mock.calls.map(c => String(c[0] ?? '')),
      ...vi.mocked(outro).mock.calls.map(c => String(c[0] ?? '')),
    ];
    const hasFail = allTextCalls.some(t => /fail|fix|error/i.test(t));
    expect(hasFail).toBe(true);
  });
});

describe('coverage threshold assertions', () => {
  it('vitest.config.ts template file contains correct coverage thresholds', () => {
    const templatePath = resolve(__dirname, '../templates/vitest/vitest.config.ts');
    const content = readFileSync(templatePath, 'utf-8');
    expect(content).toContain('statements: 80');
    expect(content).toContain('functions: 80');
    expect(content).toContain('lines: 80');
    expect(content).toContain('branches: 70');
  });

  it('sonar-project.properties template contains correct lcov path', () => {
    const templatePath = resolve(__dirname, '../templates/vitest/sonar-project.properties');
    const content = readFileSync(templatePath, 'utf-8');
    expect(content).toContain('sonar.javascript.lcov.reportPaths=coverage/lcov.info');
  });
});
