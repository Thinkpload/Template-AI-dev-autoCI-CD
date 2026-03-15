// wizard/src/wizard.ts — CJS package, no ESM-only APIs

import {
  intro, outro, select, multiselect, isCancel, cancel, log
} from '@clack/prompts';
import { MODULE_REGISTRY } from './registry.js';
import { readConfig } from './config.js';
import type { UserSelections, AiMethodology, AgenticSystem, ModuleId } from './types.js';

export function validateConflicts(ids: ModuleId[]): string[] {
  const seen = new Set<string>();
  const errors: string[] = [];
  for (const id of ids) {
    const def = MODULE_REGISTRY[id];
    if (!def) continue;
    for (const cid of (def.conflicts ?? [])) {
      if (ids.includes(cid as ModuleId)) {
        const key = [id, cid].sort().join('|');
        if (!seen.has(key)) {
          seen.add(key);
          const conflictDef = MODULE_REGISTRY[cid as ModuleId];
          errors.push(
            `"${def.label}" conflicts with "${conflictDef?.label ?? cid}"`
          );
        }
      }
    }
  }
  return errors;
}

export async function runWizard(yesMode = false): Promise<UserSelections> {
  intro('create-ai-template — AI dev environment setup');

  const existingConfig = readConfig();
  const installedIds = (existingConfig?.modules ?? [])
    .filter(m => m.installState === 'installed')
    .map(m => m.id);

  // Notify user about already-installed modules
  for (const id of installedIds) {
    const mod = MODULE_REGISTRY[id as ModuleId];
    if (mod) log.warn(`${mod.label} — already installed, skipping`);
  }

  const availableModules = Object.values(MODULE_REGISTRY)
    .filter(m => !installedIds.includes(m.id));

  // AI Methodology
  let aiMethodology: AiMethodology = 'both';
  if (!yesMode) {
    const result = await select({
      message: 'Which AI methodology would you like?',
      options: [
        { value: 'bmad' as AiMethodology, label: 'BMAD Method v6', hint: 'AI-driven development agents' },
        { value: 'gsd' as AiMethodology, label: 'GSD Workflow Engine', hint: 'Already in repo, will activate' },
        { value: 'both' as AiMethodology, label: 'Both BMAD + GSD', hint: 'Recommended' },
      ],
      initialValue: 'both' as AiMethodology,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    aiMethodology = result as AiMethodology;
  }

  // Agentic System
  let agenticSystem: AgenticSystem = 'claude-code';
  if (!yesMode) {
    const result = await select({
      message: 'Which agentic system do you use?',
      options: [
        { value: 'claude-code' as AgenticSystem, label: 'Claude Code' },
        { value: 'cursor' as AgenticSystem, label: 'Cursor' },
        { value: 'vscode' as AgenticSystem, label: 'VS Code' },
      ],
      initialValue: 'claude-code' as AgenticSystem,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    agenticSystem = result as AgenticSystem;
  }

  // Module selection — must-have pre-checked, already-installed filtered out
  const mustHaveIds = availableModules
    .filter(m => m.priority === 'must-have')
    .map(m => m.id as ModuleId);

  let selectedModules: ModuleId[];
  if (yesMode) {
    selectedModules = [...mustHaveIds, 'bmad' as ModuleId, 'gsd' as ModuleId]
      .filter(id => availableModules.some(m => m.id === id));
  } else {
    const result = await multiselect<ModuleId>({
      message: 'Select modules to install (must-have pre-selected):',
      options: availableModules.map(m => ({
        value: m.id as ModuleId,
        label: m.label,
        hint: m.description,
      })),
      initialValues: mustHaveIds,
      required: false,
    });
    if (isCancel(result)) { cancel('Setup cancelled.'); process.exit(0); }
    selectedModules = result as ModuleId[];
  }

  // Conflict validation — BEFORE outro() or returning
  const errors = validateConflicts(selectedModules);
  if (errors.length > 0) {
    for (const err of errors) log.error(err);
    cancel('Resolve conflicts and re-run.');
    process.exit(1);
  }

  outro('Selections complete. Writing config...');

  return { aiMethodology, agenticSystem, selectedModules };
}
