import { describe, it, expect } from 'vitest';
import { execSync, spawnSync } from 'child_process';
import { mkdirSync, writeFileSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

const SCRIPT_PATH = join(process.cwd(), 'scripts/check-secrets.sh');

/**
 * Helper: run check-secrets.sh in a temp git repo with specified staged files.
 * Returns { exitCode, stdout, stderr }.
 */
function runSecretScan(stagedFiles: Array<{ name: string; content: string }>): {
  exitCode: number;
  stdout: string;
  stderr: string;
} {
  const tmpDir = join(tmpdir(), `secret-scan-test-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  try {
    // Init minimal git repo
    execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
    execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });

    // Create and stage files
    for (const { name, content } of stagedFiles) {
      const filePath = join(tmpDir, name);
      const dir = join(tmpDir, name.split('/').slice(0, -1).join('/'));
      if (dir !== tmpDir) mkdirSync(dir, { recursive: true });
      writeFileSync(filePath, content);
      execSync(`git add "${name}"`, { cwd: tmpDir, stdio: 'pipe' });
    }

    // Run the script
    const result = spawnSync('bash', [SCRIPT_PATH], {
      cwd: tmpDir,
      encoding: 'utf8',
    });

    return {
      exitCode: result.status ?? 1,
      stdout: result.stdout ?? '',
      stderr: result.stderr ?? '',
    };
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('check-secrets.sh', () => {
  it('exits 0 when no files are staged', () => {
    const tmpDir = join(tmpdir(), `secret-scan-empty-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
    try {
      execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
      const result = spawnSync('bash', [SCRIPT_PATH], {
        cwd: tmpDir,
        encoding: 'utf8',
      });
      expect(result.status).toBe(0);
    } finally {
      rmSync(tmpDir, { recursive: true, force: true });
    }
  });

  it('exits 0 for a normal TypeScript file without secrets', () => {
    const result = runSecretScan([
      {
        name: 'src/lib/utils.ts',
        content: 'export const add = (a: number, b: number) => a + b;\n',
      },
    ]);
    expect(result.exitCode).toBe(0);
  });

  it('exits 1 when a .env file is staged', () => {
    const result = runSecretScan([
      {
        name: '.env',
        content: 'DATABASE_URL=postgres://localhost/mydb\n',
      },
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Potential secret detected');
  });

  it('exits 1 when a .env.local file is staged', () => {
    const result = runSecretScan([
      {
        name: '.env.local',
        content: 'NEXTAUTH_SECRET=supersecret\n',
      },
    ]);
    expect(result.exitCode).toBe(1);
  });

  it('exits 1 when a file contains SECRET_KEY= with a value', () => {
    const result = runSecretScan([
      {
        name: 'config.ts',
        content: 'const SECRET_KEY=abc123;\n',
      },
    ]);
    expect(result.exitCode).toBe(1);
    expect(result.stdout).toContain('Potential secret detected');
  });

  it('exits 1 when a file contains API_KEY= with a value', () => {
    const result = runSecretScan([
      {
        name: 'service.ts',
        content: 'const API_KEY=sk-abc123;\n',
      },
    ]);
    expect(result.exitCode).toBe(1);
  });

  it('exits 0 when SECRET_KEY appears in a comment without a value', () => {
    const result = runSecretScan([
      {
        name: 'README.md',
        content: '# Set SECRET_KEY in your environment\n',
      },
    ]);
    // Pattern requires "KEY= value" — a comment without "=" assignment should pass
    expect(result.exitCode).toBe(0);
  });

  it('exits 0 when file references process.env without hardcoded secret', () => {
    const result = runSecretScan([
      {
        name: 'src/lib/auth.ts',
        content: 'const secret = process.env.NEXTAUTH_SECRET;\n',
      },
    ]);
    expect(result.exitCode).toBe(0);
  });
});
