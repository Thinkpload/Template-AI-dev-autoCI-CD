import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type { TemplateConfig, ModuleInstallRecord, UserSelections } from './types.js';

const CONFIG_PATH = join(process.cwd(), '.template-config.json');

export function readConfig(): TemplateConfig | null {
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, 'utf-8')) as TemplateConfig;
  } catch {
    return null;
  }
}

export function writeConfig(config: TemplateConfig): void {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

export function buildInitialConfig(
  selections: UserSelections,
  wizardVersion: string,
): TemplateConfig {
  const now = new Date().toISOString();
  return {
    wizardVersion,
    aiMethodology: selections.aiMethodology,
    agenticSystem: selections.agenticSystem,
    authProvider: selections.authProvider,
    ormChoice: selections.ormChoice,
    modules: selections.selectedModules.map((id): ModuleInstallRecord => ({
      id,
      installState: 'pending',
    })),
    createdAt: now,
    updatedAt: now,
  };
}
