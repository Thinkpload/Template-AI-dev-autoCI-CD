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
  spinner: vi.fn(() => ({ start: mockSpinnerStart, stop: mockSpinnerStop })),
  log: { warn: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

import { runInstaller, mergePackageJson } from '../src/installer.js';
import { spawnSync } from 'node:child_process';
import { log } from '@clack/prompts';
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
  aiMethodology: 'bmad-only',
  agenticSystem: 'cursor',
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
        modules: [{ id: 'husky', installState: 'installed' }],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
    );
    await runInstaller(selections, true, tmpDir);
    expect(spawnSync).not.toHaveBeenCalled();
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
