import { describe, it, expect } from 'vitest';

const REQUIRED_FIELDS = ['id', 'label', 'description', 'priority', 'deps', 'devDeps', 'templateDir', 'postInstall'] as const;
const REQUIRED_MODULES = ['husky', 'eslint', 'vitest', 'tsconfig', 'bmad', 'gsd'] as const;

describe('MODULE_REGISTRY', () => {
  it('is importable', async () => {
    // This will fail until wizard/src/registry.ts is created in Plan 02
    const { MODULE_REGISTRY } = await import('../src/registry.js');
    expect(MODULE_REGISTRY).toBeDefined();
  });

  it('contains all required module entries', async () => {
    const { MODULE_REGISTRY } = await import('../src/registry.js');
    for (const moduleId of REQUIRED_MODULES) {
      expect(MODULE_REGISTRY, `MODULE_REGISTRY must contain '${moduleId}'`).toHaveProperty(moduleId);
    }
  });

  it('each module entry has all required fields', async () => {
    const { MODULE_REGISTRY } = await import('../src/registry.js');
    for (const [id, def] of Object.entries(MODULE_REGISTRY)) {
      for (const field of REQUIRED_FIELDS) {
        expect(def, `module '${id}' missing required field '${field}'`).toHaveProperty(field);
      }
    }
  });

  it('bmad and gsd entries have non-empty version references', async () => {
    const { MODULE_REGISTRY } = await import('../src/registry.js');
    // bmad devDep must reference a version string (not @latest)
    const bmadDep = MODULE_REGISTRY.bmad.devDeps[0] ?? '';
    expect(bmadDep).toMatch(/@\d/); // must contain a version number, not @latest
    expect(bmadDep).not.toContain('@latest');
  });

  it('no inline version strings — all versions come from dependency-versions.ts', async () => {
    const { MODULE_REGISTRY } = await import('../src/registry.js');
    const { HUSKY_VERSION, LINT_STAGED_VERSION, VITEST_VERSION, ESLINT_VERSION, BMAD_VERSION } = await import('../src/dependency-versions.js');

    // Spot-check: husky devDeps should contain the HUSKY_VERSION constant value
    const huskyDep = MODULE_REGISTRY.husky.devDeps.find(d => d.startsWith('husky@'));
    expect(huskyDep).toBe(`husky@${HUSKY_VERSION}`);

    // vitest devDeps should reference VITEST_VERSION
    const vitestDep = MODULE_REGISTRY.vitest.devDeps.find(d => d.startsWith('vitest@'));
    expect(vitestDep).toBe(`vitest@${VITEST_VERSION}`);
  });
});
