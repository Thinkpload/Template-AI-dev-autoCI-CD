import { spawnSync } from 'node:child_process';
import {
  readFileSync,
  writeFileSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  chmodSync,
  statSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { spinner, outro, log } from '@clack/prompts';
import { MODULE_REGISTRY } from './registry.js';
import { readConfig, writeConfig } from './config.js';
import type { UserSelections, TemplateConfig } from './types.js';

type PackageJsonAdditions = {
  scripts?: Record<string, string>;
  [key: string]: unknown;
};

export function mergePackageJson(pkgPath: string, additions: PackageJsonAdditions): void {
  const pkg = JSON.parse(readFileSync(pkgPath, 'utf-8')) as Record<string, unknown>;

  // Merge scripts keys (only if absent)
  if (additions.scripts) {
    const existingScripts = (pkg['scripts'] ?? {}) as Record<string, string>;
    for (const [key, value] of Object.entries(additions.scripts)) {
      if (!(key in existingScripts)) {
        existingScripts[key] = value;
      } else {
        log.warn(`package.json: scripts.${key} already exists — skipping`);
      }
    }
    pkg['scripts'] = existingScripts;
  }

  // Merge top-level keys (only if absent), skip 'scripts' (handled above)
  for (const [key, value] of Object.entries(additions)) {
    if (key === 'scripts') continue;
    if (!(key in pkg)) {
      pkg[key] = value;
    } else {
      log.warn(`package.json: "${key}" already exists — skipping`);
    }
  }

  writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n', 'utf-8');
}

function npmInstallDevDeps(packages: string[], cwd: string): void {
  const result = spawnSync('npm', ['install', '--save-dev', ...packages], {
    cwd,
    stdio: 'pipe',
    encoding: 'utf-8',
  });
  if (result.error) throw result.error;
  if (result.status !== 0 && result.status !== null) {
    throw new Error(result.stderr ?? `npm install exited with code ${result.status}`);
  }
}

function writeHookFile(src: string, dest: string): void {
  const content = readFileSync(src, 'utf-8').replace(/\r\n/g, '\n');
  writeFileSync(dest, content, 'utf-8');
  if (process.platform !== 'win32') {
    chmodSync(dest, 0o755);
  }
}

function copyWithBackup(src: string, dest: string): void {
  if (existsSync(dest)) {
    copyFileSync(dest, dest + '.bak');
  }
  copyFileSync(src, dest);
}

function copyTemplateDir(templateRelPath: string, destDir: string, _yesMode: boolean): void {
  // CJS: __dirname resolves to wizard/src at runtime in dist, but we need wizard/ root
  // templateRelPath is relative to wizard/ root (e.g. 'templates/husky')
  const srcDir = join(__dirname, '..', templateRelPath);

  if (!existsSync(srcDir)) {
    return; // template dir may not exist for stub modules
  }

  mkdirSync(destDir, { recursive: true });

  const entries = readdirSync(srcDir, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = join(srcDir, entry.name);
    const destPath = join(destDir, entry.name);

    if (entry.isDirectory()) {
      // Recurse into subdirectory (e.g. .husky/ inside templates/husky/)
      mkdirSync(destPath, { recursive: true });
      const subEntries = readdirSync(srcPath, { withFileTypes: true });
      for (const subEntry of subEntries) {
        if (subEntry.isFile()) {
          const subSrc = join(srcPath, subEntry.name);
          const subDest = join(destPath, subEntry.name);
          // All files in .husky/ directories get LF normalization
          if (entry.name === '.husky') {
            writeHookFile(subSrc, subDest);
          } else {
            copyWithBackup(subSrc, subDest);
          }
        }
      }
    } else if (entry.isFile()) {
      copyWithBackup(srcPath, destPath);
    }
  }
}

function runPostInstall(commands: string[], cwd: string): void {
  for (const cmd of commands) {
    // Husky install requires .git
    if (cmd.includes('husky install') || cmd.includes('husky')) {
      if (!existsSync(join(cwd, '.git'))) {
        log.warn('No .git directory found — skipping husky install (run it manually after git init)');
        continue;
      }
    }

    const [bin, ...args] = cmd.split(' ');
    const result = spawnSync(bin ?? cmd, args, {
      cwd,
      stdio: 'pipe',
      encoding: 'utf-8',
      shell: true,
    });
    if (result.error) throw result.error;
    if (result.status !== 0 && result.status !== null) {
      throw new Error(result.stderr ?? `Command "${cmd}" exited with code ${result.status}`);
    }
  }
}

function updateModuleState(
  config: TemplateConfig,
  moduleId: string,
  state: 'installed' | 'failed',
): void {
  const record = config.modules.find(m => m.id === moduleId);
  if (record) {
    record.installState = state;
  } else {
    config.modules.push({ id: moduleId, installState: state });
  }
}

function getPackageJsonAdditions(moduleId: string): PackageJsonAdditions {
  const map: Record<string, PackageJsonAdditions> = {
    husky: {
      scripts: { prepare: 'husky install' },
      'lint-staged': { '*.{ts,tsx,js,jsx}': ['eslint --fix'] },
    },
    vitest: {
      scripts: {
        test: 'vitest run --reporter=verbose',
        'test:coverage': 'vitest run --coverage',
      },
    },
    eslint: { scripts: { lint: 'eslint .' } },
  };
  return map[moduleId] ?? {};
}

export async function runInstaller(
  selections: UserSelections,
  yesMode: boolean,
  targetDir: string = process.cwd(),
): Promise<void> {
  // Read config from targetDir (not process.cwd())
  let config: TemplateConfig | null;
  try {
    const configPath = join(targetDir, '.template-config.json');
    if (existsSync(configPath)) {
      config = JSON.parse(readFileSync(configPath, 'utf-8')) as TemplateConfig;
    } else {
      config = null;
    }
  } catch {
    config = null;
  }

  if (!config) {
    // Build a minimal config for the installer to work with
    config = {
      wizardVersion: '1.0.0',
      aiMethodology: selections.aiMethodology,
      agenticSystem: selections.agenticSystem,
      modules: selections.selectedModules.map(id => ({ id, installState: 'pending' as const })),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  const saveConfig = (cfg: TemplateConfig) => {
    const configPath = join(targetDir, '.template-config.json');
    writeFileSync(configPath, JSON.stringify(cfg, null, 2), 'utf-8');
  };

  const results: Array<{ id: string; status: 'installed' | 'failed' }> = [];

  for (const moduleId of selections.selectedModules) {
    const record = config.modules.find(m => m.id === moduleId);
    if (record?.installState === 'installed') continue; // idempotency guard

    const mod = MODULE_REGISTRY[moduleId as keyof typeof MODULE_REGISTRY];
    if (!mod) continue;

    const s = spinner();
    s.start(`Installing ${mod.label}...`);

    try {
      // 1. npm install devDeps
      if (mod.devDeps.length > 0) {
        npmInstallDevDeps(mod.devDeps, targetDir);
      }

      // 2. copy template files
      // For husky: the hook files live in templates/husky/.husky/ and should go to targetDir/.husky/
      // The copyTemplateDir call puts them in destDir, we pass targetDir so subdirs work correctly
      copyTemplateDir(mod.templateDir, targetDir, yesMode);

      // 3. package.json merge
      const pkgPath = join(targetDir, 'package.json');
      if (existsSync(pkgPath)) {
        mergePackageJson(pkgPath, getPackageJsonAdditions(mod.id));
      }

      // 4. postInstall
      runPostInstall(mod.postInstall, targetDir);

      updateModuleState(config, moduleId, 'installed');
      saveConfig(config);
      s.stop(`${mod.label} installed`);
      results.push({ id: moduleId, status: 'installed' });
    } catch (err) {
      updateModuleState(config, moduleId, 'failed');
      saveConfig(config);
      s.stop(`${mod.label} failed`);
      const msg = err instanceof Error ? err.message : String(err);
      log.error(`${mod.label}: ${msg}`);
      log.warn(`Run: npm install ${mod.devDeps.join(' ')} manually to retry`);
      results.push({ id: moduleId, status: 'failed' });
    }
  }

  const installed = results.filter(r => r.status === 'installed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  if (failed > 0) {
    outro(`Installed: ${installed}, Failed: ${failed} (see above for details)`);
  } else {
    outro(`Setup complete! ${installed} module${installed !== 1 ? 's' : ''} installed.`);
  }
}
